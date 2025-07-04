import { ProcessingContext } from "../interfaces/ProcessingContext";
import { FileService } from "../core/FileService";
import { DebugHelper } from "../utils/DebugHelper";

export interface ImageData {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  format: ImageFormat;
  size: number;
  hash: string;
  dimensions?: { width: number; height: number };
}

export interface ImageProcessResult {
  success: boolean;
  imageData?: ImageData;
  dataUrl?: string;
  error?: string;
}

export type ImageFormat =
  | "jpeg"
  | "png"
  | "gif"
  | "bmp"
  | "webp"
  | "tiff"
  | "unknown";

export class ImageDataService {
  constructor(private fileService: FileService) {}

  /**
   * 从PPTX中提取图片二进制数据
   */
  async extractImageData(
    embedId: string,
    context: ProcessingContext
  ): Promise<ImageData | null> {
    DebugHelper.log(
      context,
      `=== Starting Image Data Extraction for ${embedId} ===`,
      "info"
    );

    try {
      // 从关系映射中获取图片路径
      const relationship = context.relationships.get(embedId);
      if (!relationship) {
        DebugHelper.log(
          context,
          `No relationship found for embedId: ${embedId}`,
          "warn"
        );
        console.warn(`No relationship found for embedId: ${embedId}`);
        return null;
      }

      // 提取实际的图片路径（支持对象和字符串格式）
      let imagePath: string;
      if (typeof relationship === "string") {
        imagePath = relationship;
      } else if (
        relationship &&
        typeof relationship === "object" &&
        relationship.target
      ) {
        imagePath = relationship.target;
      } else {
        console.warn(
          `Invalid relationship format for embedId: ${embedId}`,
          relationship
        );
        return null;
      }

      // 构建完整的图片路径
      const fullPath = this.resolveImagePath(imagePath);
      DebugHelper.log(context, `Resolved image path: ${fullPath}`, "info");

      // 从ZIP中提取图片数据
      const buffer = await this.fileService.extractBinaryFileAsBuffer(
        context.zip,
        fullPath
      );
      if (!buffer) {
        DebugHelper.log(
          context,
          `Failed to extract image data from path: ${fullPath}`,
          "error"
        );
        console.warn(`Failed to extract image data from path: ${fullPath}`);
        return null;
      }

      // 检测图片格式和MIME类型
      const format = this.detectImageFormat(buffer);
      const mimeType = this.getMimeType(format);

      if (format === "unknown") {
        DebugHelper.log(context, "unknown image type", "warn");
      }

      // 生成文件名和hash
      const filename = this.extractFilename(fullPath);
      const hash = this.generateHash(buffer);

      // 获取图片尺寸（可选）
      const dimensions = await this.getImageDimensions(buffer, format);

      const imageData = {
        buffer,
        filename,
        mimeType,
        format,
        size: buffer.length,
        hash,
        dimensions,
      };

      DebugHelper.log(
        context,
        `Image extracted successfully: ${filename} (${format}, ${buffer.length} bytes)`,
        "success"
      );

      // 如果启用了调试图片保存，保存原始图片用于调试
      if (DebugHelper.shouldSaveDebugImages(context)) {
        await this.saveDebugImage(imageData, embedId, context);
      }

      return imageData;
    } catch (error) {
      DebugHelper.log(
        context,
        `Error extracting image data for ${embedId}: ${error}`,
        "error"
      );
      console.error(`Error extracting image data for ${embedId}:`, error);
      return null;
    }
  }

  /**
   * 保存调试图片到debug-images目录
   */
  private async saveDebugImage(
    imageData: ImageData,
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
      const debugFileName = `slide-${slideId}_image-${embedId}_${timestamp}.${imageData.format}`;
      const debugFilePath = path.join(debugDir, debugFileName);

      // 保存图片文件
      fs.writeFileSync(debugFilePath, imageData.buffer);

      // 保存元数据JSON
      const metadataFileName = `slide-${slideId}_image-${embedId}_${timestamp}.json`;
      const metadataFilePath = path.join(debugDir, metadataFileName);
      const metadata = {
        embedId,
        slideId,
        filename: imageData.filename,
        format: imageData.format,
        mimeType: imageData.mimeType,
        size: imageData.size,
        hash: imageData.hash,
        dimensions: imageData.dimensions,
        extractedAt: new Date().toISOString(),
        debugFilePath,
      };
      fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));

      DebugHelper.log(
        context,
        `Debug image saved: ${debugFileName}`,
        "success"
      );
      DebugHelper.log(
        context,
        `Debug metadata saved: ${metadataFileName}`,
        "info"
      );
    } catch (error) {
      DebugHelper.log(context, `Failed to save debug image: ${error}`, "error");
      console.warn(`Failed to save debug image for ${embedId}:`, error);
    }
  }

  /**
   * 将图片数据编码为base64 data URL
   */
  encodeToBase64(imageData: ImageData): string {
    try {
      const base64Data = imageData.buffer.toString("base64");
      return `data:${imageData.mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error("Error encoding image to base64:", error);
      throw new Error("Failed to encode image to base64");
    }
  }

  /**
   * 批量处理图片
   */
  async processBatch(
    embedIds: string[],
    context: ProcessingContext
  ): Promise<Map<string, ImageProcessResult>> {
    const results = new Map<string, ImageProcessResult>();

    // 控制并发数量，避免内存压力
    const concurrency = 3;
    const semaphore = new Semaphore(concurrency);

    await Promise.all(
      embedIds.map(async (embedId) => {
        await semaphore.acquire(async () => {
          try {
            const imageData = await this.extractImageData(embedId, context);

            if (imageData) {
              const dataUrl = this.encodeToBase64(imageData);
              results.set(embedId, {
                success: true,
                imageData,
                dataUrl,
              });
            } else {
              results.set(embedId, {
                success: false,
                error: "Failed to extract image data",
              });
            }
          } catch (error) {
            results.set(embedId, {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        });
      })
    );

    return results;
  }

  /**
   * 检测图片格式
   */
  private detectImageFormat(buffer: Buffer): ImageFormat {
    if (buffer.length < 2) return "unknown";

    // BMP (只需要检查前2个字节)
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return "bmp";
    }

    // JPEG (需要检查前3个字节)
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return "jpeg";
    }

    // PNG (需要检查前8个字节)
    if (
      buffer.length >= 8 &&
      buffer
        .slice(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return "png";
    }

    // GIF (需要检查前6个字节)
    if (buffer.length >= 6) {
      const gifHeader87 = Buffer.from("GIF87a", "ascii");
      const gifHeader89 = Buffer.from("GIF89a", "ascii");
      if (
        buffer.slice(0, 6).equals(gifHeader87) ||
        buffer.slice(0, 6).equals(gifHeader89)
      ) {
        return "gif";
      }
    }

    // TIFF (需要检查前4个字节)
    if (
      buffer.length >= 4 &&
      ((buffer[0] === 0x49 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x2a &&
        buffer[3] === 0x00) ||
        (buffer[0] === 0x4d &&
          buffer[1] === 0x4d &&
          buffer[2] === 0x00 &&
          buffer[3] === 0x2a))
    ) {
      return "tiff";
    }

    // WebP (需要检查前12个字节)
    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).equals(Buffer.from("RIFF", "ascii")) &&
      buffer.slice(8, 12).equals(Buffer.from("WEBP", "ascii"))
    ) {
      return "webp";
    }

    return "unknown";
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ImageFormat): string {
    const mimeTypes: Record<ImageFormat, string> = {
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      tiff: "image/tiff",
      unknown: "application/octet-stream",
    };

    return mimeTypes[format];
  }

  /**
   * 解析图片路径
   */
  private resolveImagePath(relativePath: string): string {
    // 移除前导的 '../' 并构建完整路径
    const cleanPath = relativePath.replace(/^\.\.\//, "");
    return `ppt/${cleanPath}`;
  }

  /**
   * 提取文件名
   */
  private extractFilename(path: string): string {
    return path.split("/").pop() || "unknown";
  }

  /**
   * 生成内容hash
   */
  private generateHash(buffer: Buffer): string {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(buffer).digest("hex");
  }

  /**
   * 获取图片尺寸（简单实现）
   */
  private async getImageDimensions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _buffer: Buffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _format: ImageFormat
  ): Promise<{ width: number; height: number } | undefined> {
    try {
      // 这里可以集成 image-size 库或自己实现
      // 为了简化，暂时返回 undefined
      // TODO: 实现图片尺寸检测
      return undefined;
    } catch (error) {
      console.warn("Failed to get image dimensions:", error);
      return undefined;
    }
  }
}

/**
 * 简单的信号量实现，用于控制并发
 */
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tryAcquire = () => {
        if (this.permits > 0) {
          this.permits--;
          task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              this.permits++;
              if (this.waitQueue.length > 0) {
                const next = this.waitQueue.shift();
                if (next) next();
              }
            });
        } else {
          this.waitQueue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }
}
