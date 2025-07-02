/**
 * PPTX 图片处理器 - 基于 Sharp 的服务端图像处理
 * 专门处理 PowerPoint 的拉伸偏移（Stretch Offset）效果
 */

import { ImageStretchInfo } from '../../models/domain/elements/ImageElement';
import * as fs from 'fs';
import * as path from 'path';

// 当 Sharp 可用时的接口定义
interface SharpInstance {
  resize(width?: number, height?: number, options?: any): SharpInstance;
  extract(options: { left: number; top: number; width: number; height: number }): SharpInstance;
  extend(options: { top: number; bottom: number; left: number; right: number; background?: any }): SharpInstance;
  composite(images: Array<{ input: Buffer | string; left: number; top: number }>): SharpInstance;
  png(): SharpInstance;
  toFile(path: string): Promise<any>;
  toBuffer(): Promise<Buffer>;
  metadata(): Promise<{ width?: number; height?: number; format?: string }>;
}

interface SharpStatic {
  (input?: Buffer | string): SharpInstance;
}

// 图片处理结果接口
export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  processedAt: Date;
  appliedEffects: string[];
}

// PowerPoint 拉伸偏移处理配置
export interface StretchOffsetConfig {
  containerWidth: number;
  containerHeight: number;
  fillRect: {
    left: number;    // 左偏移 (0-1 范围，可为负值)
    top: number;     // 上偏移 (0-1 范围，可为负值)
    right: number;   // 右偏移 (0-1 范围，可为负值)
    bottom: number;  // 下偏移 (0-1 范围，可为负值)
  };
  srcRect?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  enableDebug?: boolean;
}

export class PPTXImageProcessor {
  private sharp: SharpStatic | null = null;
  private isSharpAvailable = false;
  private debugImageCounter = 1;
  private debugOutputDir = path.join(process.cwd(), 'debug-images');

  constructor() {
    this.initializeSharp();
    this.ensureDebugDirectory();
  }

  /**
   * 初始化 Sharp
   */
  private async initializeSharp(): Promise<void> {
    try {
      // Use dynamic import with type assertion to avoid TypeScript errors when sharp is not installed
      const sharpModule = await import('sharp' as any);
      this.sharp = sharpModule.default as SharpStatic;
      this.isSharpAvailable = true;
      console.log('✅ Sharp initialized successfully for image processing');
    } catch (error) {
      console.warn('⚠️ Sharp not available, image processing will be limited:', error);
      this.isSharpAvailable = false;
    }
  }

  /**
   * 检查 Sharp 是否可用
   */
  public isAvailable(): boolean {
    return this.isSharpAvailable && this.sharp !== null;
  }

  /**
   * 处理 PowerPoint 拉伸偏移效果
   * 
   * @param imageBuffer 原始图片 Buffer
   * @param config 拉伸偏移配置
   * @returns 处理后的图片结果
   */
  public async applyStretchOffset(
    imageBuffer: Buffer,
    config: StretchOffsetConfig
  ): Promise<ProcessedImageResult> {
    if (!this.isAvailable() || !this.sharp) {
      throw new Error('Sharp is not available for image processing');
    }

    const { fillRect, srcRect, containerWidth, containerHeight, enableDebug } = config;
    const appliedEffects: string[] = [];

    try {
      let image = this.sharp(imageBuffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
      }

      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      if (enableDebug) {
        console.log(`🔧 PPTXImageProcessor: Processing image ${originalWidth}x${originalHeight}`);
        console.log(`📐 Container size: ${containerWidth}x${containerHeight}`);
        console.log(`📍 FillRect offsets:`, fillRect);
        if (srcRect) console.log(`✂️ SrcRect crop:`, srcRect);
        
        // Debug模式下保存原始图片
        try {
          await this.saveDebugImage(image, 'original', {
            originalSize: `${originalWidth}x${originalHeight}`,
            containerSize: `${containerWidth}x${containerHeight}`,
            fillRect: JSON.stringify(fillRect),
            srcRect: srcRect ? JSON.stringify(srcRect) : 'none'
          });
        } catch (error) {
          console.warn('⚠️ Failed to save original debug image:', error);
        }
      }

      // 1. 首先处理 srcRect（源图裁剪）
      if (srcRect && this.hasCropping(srcRect)) {
        const cropLeft = Math.floor(originalWidth * srcRect.left);
        const cropTop = Math.floor(originalHeight * srcRect.top);
        const cropWidth = Math.floor(originalWidth * (1 - srcRect.left - srcRect.right));
        const cropHeight = Math.floor(originalHeight * (1 - srcRect.top - srcRect.bottom));

        if (cropWidth > 0 && cropHeight > 0) {
          image = image.extract({
            left: Math.max(0, cropLeft),
            top: Math.max(0, cropTop),
            width: Math.min(cropWidth, originalWidth - cropLeft),
            height: Math.min(cropHeight, originalHeight - cropTop)
          });
          
          appliedEffects.push(`srcRect crop: ${cropWidth}x${cropHeight} from (${cropLeft},${cropTop})`);
          if (enableDebug) {
            console.log(`✂️ Applied srcRect crop: ${cropWidth}x${cropHeight}`);
          }
        }
      }

      // 2. 计算拉伸偏移后的目标区域
      const targetRect = this.calculateTargetRect(fillRect, containerWidth, containerHeight);
      
      if (enableDebug) {
        console.log(`🎯 Target rect:`, targetRect);
      }

      // 3. 应用 fillRect 拉伸偏移（即使是零偏移也需要处理以确保正确缩放）
      const transformResult = await this.applyFillRectTransform(image, fillRect, targetRect, enableDebug);
      image = transformResult.image;
      
      if (this.hasStretchOffset(fillRect)) {
        appliedEffects.push(`fillRect stretch: ${JSON.stringify(fillRect)}`);
      } else {
        appliedEffects.push(`fillRect resize: ${containerWidth}x${containerHeight}`);
      }

      // 添加透明填充效果记录
      if (transformResult.whitePaddingApplied) {
        appliedEffects.push(`transparent padding: ${transformResult.paddingInfo}`);
      }

      const result = await image.toBuffer();
      const finalMetadata = await this.sharp(result).metadata();

      if (enableDebug) {
        console.log(`✅ Processing complete: ${finalMetadata.width}x${finalMetadata.height}`);
        console.log(`📋 Applied effects:`, appliedEffects);
      }

      return {
        buffer: result,
        width: finalMetadata.width || containerWidth,
        height: finalMetadata.height || containerHeight,
        format: finalMetadata.format || 'unknown',
        processedAt: new Date(),
        appliedEffects
      };

    } catch (error) {
      console.error('❌ PPTXImageProcessor error:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 应用 fillRect 变换（PowerPoint 拉伸偏移的核心逻辑）
   * 
   * PowerPoint fillRect 工作原理：
   * - fillRect 定义图片在容器中的填充区域
   * - 正值 = 向内收缩，负值 = 向外扩展
   * - 实际上是在虚拟的"扩展图片"上裁剪出容器大小的窗口
   */
  private async applyFillRectTransform(
    image: SharpInstance,
    fillRect: StretchOffsetConfig['fillRect'],
    targetRect: { x: number; y: number; width: number; height: number },
    enableDebug?: boolean
  ): Promise<{ image: SharpInstance; whitePaddingApplied: boolean; paddingInfo?: string }> {
    if (!this.sharp) throw new Error('Sharp not available');

    // 获取当前图片尺寸
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Cannot read image metadata');
    }

    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    const containerWidth = targetRect.width;
    const containerHeight = targetRect.height;

    if (enableDebug) {
      console.log(`🔄 Applying fillRect transform on ${imageWidth}x${imageHeight} image`);
      console.log(`📐 Container: ${containerWidth}x${containerHeight}`);
      console.log(`📍 FillRect: L${(fillRect.left * 100).toFixed(3)}% T${(fillRect.top * 100).toFixed(3)}% R${(fillRect.right * 100).toFixed(3)}% B${(fillRect.bottom * 100).toFixed(3)}%`);
    }

    // 计算"虚拟图片"的尺寸 - 这是图片被缩放到的尺寸
    // 虚拟图片尺寸 = 容器尺寸 / (1 - left - right) 和 (1 - top - bottom)
    const virtualWidth = containerWidth / (1 - fillRect.left - fillRect.right);
    const virtualHeight = containerHeight / (1 - fillRect.top - fillRect.bottom);

    if (enableDebug) {
      console.log(`📏 Virtual image size: ${virtualWidth.toFixed(1)}x${virtualHeight.toFixed(1)}`);
    }

    // 1. 将原图缩放到虚拟图片尺寸
    let processedImage = image.resize(Math.round(virtualWidth), Math.round(virtualHeight), {
      fit: 'fill',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    });

    // 2. 计算在虚拟图片上的裁剪区域，以获得容器尺寸的最终图片
    // 裁剪起点 = 虚拟图片尺寸 * fillRect偏移
    const cropLeft = Math.round(virtualWidth * fillRect.left);
    const cropTop = Math.round(virtualHeight * fillRect.top);
    const cropWidth = Math.round(containerWidth);
    const cropHeight = Math.round(containerHeight);

    if (enableDebug) {
      console.log(`✂️ Cropping from virtual image: ${cropWidth}x${cropHeight} at (${cropLeft}, ${cropTop})`);
    }

    // 3. 从虚拟图片中裁剪出最终结果
    processedImage = processedImage.extract({
      left: Math.max(0, cropLeft),
      top: Math.max(0, cropTop),
      width: Math.min(cropWidth, Math.round(virtualWidth) - Math.max(0, cropLeft)),
      height: Math.min(cropHeight, Math.round(virtualHeight) - Math.max(0, cropTop))
    });

    // 4. 检查处理后的图片是否小于容器尺寸，如果是则用白色填充
    const processedMetadata = await processedImage.metadata();
    const actualWidth = processedMetadata.width || 0;
    const actualHeight = processedMetadata.height || 0;

    if (actualWidth < containerWidth || actualHeight < containerHeight) {
      if (enableDebug) {
        console.log(`🔲 Adding transparent padding: image ${actualWidth}x${actualHeight} < container ${containerWidth}x${containerHeight}`);
      }

      // 计算需要填充的区域
      const paddingLeft = Math.max(0, Math.floor((containerWidth - actualWidth) / 2));
      const paddingTop = Math.max(0, Math.floor((containerHeight - actualHeight) / 2));
      const paddingRight = Math.max(0, containerWidth - actualWidth - paddingLeft);
      const paddingBottom = Math.max(0, containerHeight - actualHeight - paddingTop);

      // 使用透明背景填充到容器尺寸
      processedImage = processedImage.extend({
        top: paddingTop,
        bottom: paddingBottom,
        left: paddingLeft,
        right: paddingRight,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });

      if (enableDebug) {
        console.log(`🔲 Applied transparent padding: T${paddingTop}px B${paddingBottom}px L${paddingLeft}px R${paddingRight}px`);
        
        // Debug模式下保存处理后的图片
        try {
          await this.saveDebugImage(processedImage, 'with-transparent-padding', {
            originalSize: `${actualWidth}x${actualHeight}`,
            containerSize: `${containerWidth}x${containerHeight}`,
            padding: `T${paddingTop}px B${paddingBottom}px L${paddingLeft}px R${paddingRight}px`
          });
        } catch (error) {
          console.warn('⚠️ Failed to save debug image:', error);
        }
      }

      return { 
        image: processedImage, 
        whitePaddingApplied: true, 
        paddingInfo: `T${paddingTop}px B${paddingBottom}px L${paddingLeft}px R${paddingRight}px` 
      };
    }

    return { image: processedImage, whitePaddingApplied: false };
  }


  /**
   * 从 ImageStretchInfo 创建处理配置
   */
  public static createConfigFromStretchInfo(
    stretchInfo: ImageStretchInfo,
    containerWidth: number,
    containerHeight: number,
    enableDebug = false
  ): StretchOffsetConfig {
    return {
      containerWidth,
      containerHeight,
      fillRect: stretchInfo.fillRect,
      srcRect: stretchInfo.srcRect || undefined,
      enableDebug
    };
  }

  /**
   * 工具方法：检查是否有裁剪
   */
  private hasCropping(srcRect: NonNullable<StretchOffsetConfig['srcRect']>): boolean {
    return srcRect.left > 0 || srcRect.top > 0 || srcRect.right > 0 || srcRect.bottom > 0;
  }

  /**
   * 工具方法：检查是否有拉伸偏移
   */
  private hasStretchOffset(fillRect: StretchOffsetConfig['fillRect']): boolean {
    return Math.abs(fillRect.left) > 0.001 || 
           Math.abs(fillRect.top) > 0.001 || 
           Math.abs(fillRect.right) > 0.001 || 
           Math.abs(fillRect.bottom) > 0.001;
  }


  /**
   * 计算目标矩形区域
   */
  private calculateTargetRect(
    fillRect: StretchOffsetConfig['fillRect'],
    containerWidth: number,
    containerHeight: number
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: containerWidth * Math.max(0, fillRect.left),
      y: containerHeight * Math.max(0, fillRect.top),
      width: containerWidth * (1 - Math.abs(fillRect.left) - Math.abs(fillRect.right)),
      height: containerHeight * (1 - Math.abs(fillRect.top) - Math.abs(fillRect.bottom))
    };
  }

  /**
   * 确保debug目录存在
   */
  private ensureDebugDirectory(): void {
    try {
      if (!fs.existsSync(this.debugOutputDir)) {
        fs.mkdirSync(this.debugOutputDir, { recursive: true });
        console.log(`📁 Created debug directory: ${this.debugOutputDir}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to create debug directory:', error);
    }
  }

  /**
   * 保存debug图片
   */
  private async saveDebugImage(
    image: SharpInstance, 
    suffix: string, 
    metadata: Record<string, string>
  ): Promise<void> {
    if (!this.isAvailable() || !this.sharp) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `image-${this.debugImageCounter++}-${suffix}-${timestamp}.png`;
    const filepath = path.join(this.debugOutputDir, filename);

    try {
      // 保存图片
      await image.png().toFile(filepath);
      
      // 保存元数据
      const metadataFile = filepath.replace('.png', '.json');
      const debugInfo = {
        filename,
        timestamp: new Date().toISOString(),
        metadata,
        filepath: path.relative(process.cwd(), filepath)
      };
      
      fs.writeFileSync(metadataFile, JSON.stringify(debugInfo, null, 2));
      
      console.log(`💾 Debug image saved: ${path.relative(process.cwd(), filepath)}`);
      console.log(`📄 Metadata saved: ${path.relative(process.cwd(), metadataFile)}`);
      
    } catch (error) {
      console.error('❌ Failed to save debug image:', error);
    }
  }

  /**
   * 批量处理多个图片
   */
  public async processBatch(
    images: Array<{ buffer: Buffer; config: StretchOffsetConfig }>,
    concurrency = 3
  ): Promise<ProcessedImageResult[]> {
    if (!this.isAvailable()) {
      throw new Error('Sharp is not available for batch processing');
    }

    const results: ProcessedImageResult[] = [];

    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchPromises = batch.map(({ buffer, config }) => 
        this.applyStretchOffset(buffer, config)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch processing failed for image ${i + index}:`, result.reason);
          // 可以推入错误占位符或跳过
        }
      });
    }

    return results;
  }
}