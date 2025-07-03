/**
 * 图片处理服务 - 集成 Sharp 处理到现有 ImageDataService
 * 提供 PowerPoint 拉伸偏移的完整处理链路
 */

import {
  PPTXImageProcessor,
  ProcessedImageResult,
  StretchOffsetConfig,
} from "./PPTXImageProcessor";
import { ImageDataService } from "./ImageDataService";
import {
  ImageElement,
  ImageStretchInfo,
} from "../../models/domain/elements/ImageElement";
import { ProcessingContext } from "../interfaces/ProcessingContext";
import { DebugHelper } from "../utils/DebugHelper";

export interface ImageProcessingOptions {
  enableStretchProcessing?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  outputFormat?: "base64" | "buffer" | "url";
  enableDebug?: boolean;
  quality?: number;
}

export interface ProcessedImageData {
  originalData: any; // 来自 ImageDataService 的原始数据
  processedResult?: ProcessedImageResult;
  dataUrl?: string;
  processingTime?: number;
  wasProcessed: boolean;
  error?: string;
}

export class ImageProcessingService {
  private imageDataService: ImageDataService;
  private pptxProcessor: PPTXImageProcessor;

  constructor(imageDataService: ImageDataService) {
    this.imageDataService = imageDataService;
    this.pptxProcessor = new PPTXImageProcessor();
  }

  /**
   * 处理图片元素（重载版本，直接接收 embedId）
   */
  public async processImageElementWithEmbedId(
    imageElement: ImageElement,
    embedId: string,
    context: ProcessingContext,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageData> {
    const startTime = Date.now();
    const {
      enableStretchProcessing = true,
      containerWidth = 1350,
      containerHeight = 759.375,
      outputFormat = "base64",
      enableDebug = false,
    } = options;

    try {
      // 1. 获取原始图片数据
      const originalData = await this.imageDataService.extractImageData(
        embedId,
        context
      );
      if (!originalData) {
        throw new Error(`Failed to extract image data for ${embedId}`);
      }

      if (enableDebug) {
        console.log(`🖼️ Processing image element ${imageElement.getId()}`);
        console.log(
          `📁 Original data: ${originalData.format}, ${originalData.size} bytes`
        );
      }

      // 2. 检查是否需要拉伸偏移处理
      const stretchInfo = imageElement.getStretchInfo();
      if (
        !enableStretchProcessing ||
        !stretchInfo ||
        !this.needsStretchProcessing(stretchInfo)
      ) {
        // 不需要处理，返回原始数据
        if (enableDebug) {
          console.log(
            `⏭️ No stretch processing needed for ${imageElement.getId()}`
          );
        }

        return {
          originalData,
          dataUrl:
            outputFormat === "base64"
              ? this.imageDataService.encodeToBase64(originalData)
              : undefined,
          processingTime: Date.now() - startTime,
          wasProcessed: false,
        };
      }

      // 3. 应用拉伸偏移处理
      if (enableDebug) {
        console.log(
          `🔧 Applying stretch offset processing for ${imageElement.getId()}`
        );
        console.log(`📐 Stretch info:`, stretchInfo);
      }

      const config = this.createProcessingConfig(
        stretchInfo,
        imageElement,
        containerWidth,
        containerHeight,
        enableDebug
      );

      console.log("originalData.buffer", originalData.buffer);
      const processedResult = await this.pptxProcessor.applyStretchOffset(
        originalData.buffer,
        config
      );

      // 4. 生成输出格式
      let dataUrl: string | undefined;
      if (outputFormat === "base64") {
        dataUrl = this.createDataUrl(processedResult);
      }

      if (enableDebug) {
        console.log(
          `✅ Stretch processing completed for ${imageElement.getId()}`
        );
        console.log(
          `📊 Result: ${processedResult.width}x${processedResult.height}, ${processedResult.buffer.length} bytes`
        );
        console.log(`⏱️ Processing time: ${Date.now() - startTime}ms`);
      }

      // 保存转换完成后的调试图片
      if (DebugHelper.shouldSaveDebugImages(context)) {
        await this.saveProcessedDebugImage(processedResult, embedId, context);
      }

      return {
        originalData,
        processedResult,
        dataUrl,
        processingTime: Date.now() - startTime,
        wasProcessed: true,
      };
    } catch (error) {
      console.error(
        `❌ Image processing failed for ${imageElement.getId()}:`,
        error
      );

      // 回退到原始数据
      try {
        const originalData = await this.imageDataService.extractImageData(
          embedId,
          context
        );

        return {
          originalData: originalData || undefined,
          dataUrl:
            originalData && outputFormat === "base64"
              ? this.imageDataService.encodeToBase64(originalData)
              : undefined,
          processingTime: Date.now() - startTime,
          wasProcessed: false,
          error:
            error instanceof Error ? error.message : "Unknown processing error",
        };
      } catch (fallbackError) {
        return {
          originalData: undefined,
          processingTime: Date.now() - startTime,
          wasProcessed: false,
          error: `Processing failed and fallback failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    }
  }

  /**
   * 批量处理多个图片元素
   */
  public async processBatch(
    imageElements: ImageElement[],
    context: ProcessingContext,
    options: ImageProcessingOptions = {}
  ): Promise<Map<string, ProcessedImageData>> {
    const results = new Map<string, ProcessedImageData>();
    const { enableDebug = false } = options;

    if (enableDebug) {
      console.log(
        `📦 Starting batch processing of ${imageElements.length} images`
      );
    }

    const concurrency = 3; // 限制并发数
    for (let i = 0; i < imageElements.length; i += concurrency) {
      const batch = imageElements.slice(i, i + concurrency);

      const batchPromises = batch.map(async (element) => {
        const embedId = element.getEmbedId();
        if (!embedId) {
          return {
            elementId: element.getId(),
            result: {
              originalData: undefined,
              wasProcessed: false,
              error: "No embedId found for image element",
            } as ProcessedImageData,
          };
        }

        const result = await this.processImageElementWithEmbedId(
          element,
          embedId,
          context,
          options
        );
        return { elementId: element.getId(), result };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((promiseResult, index) => {
        const element = batch[index];
        if (promiseResult.status === "fulfilled") {
          results.set(element.getId(), promiseResult.value.result);
        } else {
          console.error(
            `Batch processing failed for ${element.getId()}:`,
            promiseResult.reason
          );
          results.set(element.getId(), {
            originalData: undefined,
            wasProcessed: false,
            error:
              promiseResult.reason instanceof Error
                ? promiseResult.reason.message
                : "Batch processing failed",
          });
        }
      });
    }

    if (enableDebug) {
      const successCount = Array.from(results.values()).filter(
        (r) => r.wasProcessed
      ).length;
      console.log(
        `📦 Batch processing completed: ${successCount}/${imageElements.length} processed successfully`
      );
    }

    return results;
  }

  /**
   * 检查是否需要拉伸偏移处理
   */
  private needsStretchProcessing(stretchInfo: ImageStretchInfo): boolean {
    if (!this.pptxProcessor.isAvailable()) {
      return false;
    }

    const { fillRect } = stretchInfo;
    return (
      Math.abs(fillRect.left) > 0.001 ||
      Math.abs(fillRect.top) > 0.001 ||
      Math.abs(fillRect.right) > 0.001 ||
      Math.abs(fillRect.bottom) > 0.001
    );
  }

  /**
   * 创建处理配置
   */
  private createProcessingConfig(
    stretchInfo: ImageStretchInfo,
    imageElement: ImageElement,
    containerWidth: number,
    containerHeight: number,
    enableDebug: boolean
  ): StretchOffsetConfig {
    // 使用元素的实际尺寸作为容器尺寸（如果可用）
    const size = imageElement.getSize();
    const actualContainerWidth = size?.width || containerWidth;
    const actualContainerHeight = size?.height || containerHeight;

    return PPTXImageProcessor.createConfigFromStretchInfo(
      stretchInfo,
      actualContainerWidth,
      actualContainerHeight,
      enableDebug
    );
  }

  /**
   * 创建 Data URL
   */
  private createDataUrl(processedResult: ProcessedImageResult): string {
    const mimeType = this.getMimeType(processedResult.format);
    console.log("processedResult", processedResult);
    const base64Data = processedResult.buffer.toString("base64");
    return `data:${mimeType};base64,${base64Data}`;
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: "image/jpeg",
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      bmp: "image/bmp",
      tiff: "image/tiff",
    };

    return mimeTypes[format.toLowerCase()] || "image/jpeg";
  }

  /**
   * 保存转换完成后的调试图片
   */
  private async saveProcessedDebugImage(
    processedResult: ProcessedImageResult,
    embedId: string,
    context: ProcessingContext
  ): Promise<void> {
    try {
      const fs = require("fs");
      const path = require("path");

      // 创建debug-images目录
      const debugDir = path.join(process.cwd(), "debug-images");
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
        DebugHelper.log(
          context,
          `Created debug directory: ${debugDir}`,
          "info"
        );
      }

      // 生成调试文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const slideId = context.slideId || "unknown";
      const debugFileName = `slide-${slideId}_image-${embedId}_processed_${timestamp}.${processedResult.format}`;
      const debugFilePath = path.join(debugDir, debugFileName);

      // 保存处理后的图片文件
      fs.writeFileSync(debugFilePath, processedResult.buffer);

      // 保存处理元数据JSON
      const metadataFileName = `slide-${slideId}_image-${embedId}_processed_${timestamp}.json`;
      const metadataFilePath = path.join(debugDir, metadataFileName);
      const metadata = {
        embedId,
        slideId,
        processedAt: new Date().toISOString(),
        processType: "stretch_offset",
        format: processedResult.format,
        size: processedResult.buffer.length,
        dimensions: {
          width: processedResult.width,
          height: processedResult.height,
        },
        debugFilePath,
        isProcessed: true,
      };
      fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));

      DebugHelper.log(
        context,
        `Processed debug image saved: ${debugFileName}`,
        "success"
      );
      DebugHelper.log(
        context,
        `Processed debug metadata saved: ${metadataFileName}`,
        "info"
      );
    } catch (error) {
      DebugHelper.log(
        context,
        `Failed to save processed debug image: ${error}`,
        "error"
      );
      console.warn(
        `Failed to save processed debug image for ${embedId}:`,
        error
      );
    }
  }

  /**
   * 获取处理统计信息
   */
  public getProcessingStats(): {
    isSharpAvailable: boolean;
    processedCount: number;
    averageProcessingTime: number;
  } {
    // 这里可以添加统计信息收集
    return {
      isSharpAvailable: this.pptxProcessor.isAvailable(),
      processedCount: 0, // TODO: 实现计数器
      averageProcessingTime: 0, // TODO: 实现平均时间计算
    };
  }
}
