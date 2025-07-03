/**
 * PPTX 图片处理器 - 基于 Sharp 的服务端图像处理
 * 专门处理 PowerPoint 的拉伸偏移（Stretch Offset）效果
 */

import { ImageStretchInfo } from "../../models/domain/elements/ImageElement";
import * as fs from "fs";
import * as path from "path";

// 当 Sharp 可用时的接口定义
interface SharpInstance {
  resize(width?: number, height?: number, options?: any): SharpInstance;
  extract(options: {
    left: number;
    top: number;
    width: number;
    height: number;
  }): SharpInstance;
  extend(options: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    background?: any;
  }): SharpInstance;
  composite(
    images: Array<{ input: Buffer | string; left: number; top: number }>
  ): SharpInstance;
  png(): SharpInstance;
  toFile(path: string): Promise<any>;
  toBuffer(): Promise<Buffer>;
  metadata(): Promise<{ width?: number; height?: number; format?: string }>;
}

interface SharpStatic {
  (
    input?:
      | Buffer
      | string
      | {
          create: {
            width: number;
            height: number;
            channels: number;
            background?: any;
          };
        }
  ): SharpInstance;
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
    left: number; // 左偏移 (0-1 范围，可为负值)
    top: number; // 上偏移 (0-1 范围，可为负值)
    right: number; // 右偏移 (0-1 范围，可为负值)
    bottom: number; // 下偏移 (0-1 范围，可为负值)
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
  private debugOutputDir = path.join(process.cwd(), "debug-images");

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
      const sharpModule = await import("sharp" as any);
      this.sharp = sharpModule.default as SharpStatic;
      this.isSharpAvailable = true;
      console.log("✅ Sharp initialized successfully for image processing");
    } catch (error) {
      console.warn(
        "⚠️ Sharp not available, image processing will be limited:",
        error
      );
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
      throw new Error("Sharp is not available for image processing");
    }

    const { fillRect, srcRect, containerWidth, containerHeight, enableDebug } =
      config;
    const appliedEffects: string[] = [];

    try {
      let image = this.sharp(imageBuffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error("Unable to read image dimensions");
      }

      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      if (enableDebug) {
        console.log(
          `🔧 PPTXImageProcessor: Processing image ${originalWidth}x${originalHeight}`
        );
        console.log(`📐 Container size: ${containerWidth}x${containerHeight}`);
        console.log(`📍 FillRect offsets:`, fillRect);
        if (srcRect) console.log(`✂️ SrcRect crop:`, srcRect);

        // Debug模式下保存原始图片
        try {
          await this.saveDebugImage(image, "original", {
            originalSize: `${originalWidth}x${originalHeight}`,
            containerSize: `${containerWidth}x${containerHeight}`,
            fillRect: JSON.stringify(fillRect),
            srcRect: srcRect ? JSON.stringify(srcRect) : "none",
          });
        } catch (error) {
          console.warn("⚠️ Failed to save original debug image:", error);
        }
      }

      // 1. 首先处理 srcRect（源图裁剪）
      if (srcRect && this.hasCropping(srcRect)) {
        const cropLeft = Math.floor(originalWidth * srcRect.left);
        const cropTop = Math.floor(originalHeight * srcRect.top);
        const cropWidth = Math.floor(
          originalWidth * (1 - srcRect.left - srcRect.right)
        );
        const cropHeight = Math.floor(
          originalHeight * (1 - srcRect.top - srcRect.bottom)
        );

        if (cropWidth > 0 && cropHeight > 0) {
          image = image.extract({
            left: Math.max(0, cropLeft),
            top: Math.max(0, cropTop),
            width: Math.min(cropWidth, originalWidth - cropLeft),
            height: Math.min(cropHeight, originalHeight - cropTop),
          });

          appliedEffects.push(
            `srcRect crop: ${cropWidth}x${cropHeight} from (${cropLeft},${cropTop})`
          );
          if (enableDebug) {
            console.log(`✂️ Applied srcRect crop: ${cropWidth}x${cropHeight}`);
          }
        }
      }

      // 2. 目标区域就是整个容器
      const targetRect = {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
      };

      if (enableDebug) {
        console.log(`🎯 Target rect:`, targetRect);
      }

      // 3. 应用 fillRect 拉伸偏移（即使是零偏移也需要处理以确保正确缩放）
      const transformResult = await this.applyFillRectTransform(
        image,
        fillRect,
        targetRect,
        enableDebug
      );
      image = transformResult.image;

      if (this.hasStretchOffset(fillRect)) {
        appliedEffects.push(`fillRect stretch: ${JSON.stringify(fillRect)}`);
      } else {
        appliedEffects.push(
          `fillRect resize: ${containerWidth}x${containerHeight}`
        );
      }

      // 添加透明填充效果记录
      if (transformResult.whitePaddingApplied) {
        appliedEffects.push(
          `transparent padding: ${transformResult.paddingInfo}`
        );
      }

      const result = await image.png().toBuffer();

      if (enableDebug) {
        console.log(
          `✅ Processing complete: ${containerWidth}x${containerHeight}`
        );
        console.log(`📋 Applied effects:`, appliedEffects);
      }

      if (enableDebug) {
        // Debug模式下保存原始图片
        try {
          await this.saveDebugImage(image, "processed", {
            originalSize: `${originalWidth}x${originalHeight}`,
            containerSize: `${containerWidth}x${containerHeight}`,
            fillRect: JSON.stringify(fillRect),
            srcRect: srcRect ? JSON.stringify(srcRect) : "none",
          });
        } catch (error) {
          console.warn("⚠️ Failed to save original debug image:", error);
        }
      }

      return {
        buffer: result,
        width: Math.round(containerWidth),
        height: Math.round(containerHeight),
        format: "png",
        processedAt: new Date(),
        appliedEffects,
      };
    } catch (error) {
      console.error("❌ PPTXImageProcessor error:", error);
      throw new Error(
        `Image processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 应用 fillRect 变换（PowerPoint 拉伸偏移的核心逻辑）
   *
   * 基于 target-result.png 对比分析的正确 PowerPoint fillRect 行为：
   * fillRect 定义图片相对于容器的偏移量，用于创建"裁剪视口"效果
   *
   * 修正后的算法：
   * 1. 正确处理正负偏移量：负值表示向外扩展，正值表示向内收缩
   * 2. 计算图片实际显示区域的尺寸
   * 3. 将图片缩放到显示区域尺寸
   * 4. 在容器中正确定位图片
   * 5. 添加透明填充确保最终尺寸与容器一致
   */
  private async applyFillRectTransform(
    image: SharpInstance,
    fillRect: StretchOffsetConfig["fillRect"],
    targetRect: { x: number; y: number; width: number; height: number },
    enableDebug?: boolean
  ): Promise<{
    image: SharpInstance;
    whitePaddingApplied: boolean;
    paddingInfo?: string;
  }> {
    if (!this.sharp) throw new Error("Sharp not available");

    // 获取当前图片尺寸
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Cannot read image metadata");
    }

    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    const containerWidth = targetRect.width;
    const containerHeight = targetRect.height;

    if (enableDebug) {
      console.log(
        `🔄 Applying fillRect transform on ${imageWidth}x${imageHeight} image`
      );
      console.log(`📐 Container: ${containerWidth}x${containerHeight}`);
      console.log(
        `📍 FillRect: L${(fillRect.left * 100).toFixed(3)}% T${(
          fillRect.top * 100
        ).toFixed(3)}% R${(fillRect.right * 100).toFixed(3)}% B${(
          fillRect.bottom * 100
        ).toFixed(3)}%`
      );
    }

    // 修正后的算法：
    // PowerPoint fillRect 的工作原理：
    // - 负值：向外扩展（图片会被拉伸到容器外）
    // - 正值：向内收缩（图片会被压缩到容器内）

    // 1. 计算图片实际显示区域的尺寸
    // 注意：这里使用的是 (1 - left - right) 而不是简单的减法
    const displayWidth = containerWidth * (1 - fillRect.left - fillRect.right);
    const displayHeight =
      containerHeight * (1 - fillRect.top - fillRect.bottom);

    // 2. 计算图片在容器中的位置偏移
    const leftOffset = Math.round(containerWidth * fillRect.left);
    const topOffset = Math.round(containerHeight * fillRect.top);

    if (enableDebug) {
      console.log(
        `📏 Display area: ${displayWidth.toFixed(1)}x${displayHeight.toFixed(
          1
        )}`
      );
      console.log(`📍 Position offset: L${leftOffset}px T${topOffset}px`);
    }

    // 3. 验证显示区域有效性
    if (displayWidth <= 0 || displayHeight <= 0) {
      if (enableDebug) {
        console.log(
          `⚠️ Invalid display area: ${displayWidth.toFixed(
            1
          )}x${displayHeight.toFixed(1)}, creating transparent image`
        );
      }
      // 创建透明图片
      return {
        image: this.sharp({
          create: {
            width: containerWidth,
            height: containerHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        }),
        whitePaddingApplied: true,
        paddingInfo: `Invalid display area: ${displayWidth.toFixed(
          1
        )}x${displayHeight.toFixed(1)}`,
      };
    }

    // 4. 将图片缩放到显示区域尺寸
    let processedImage = image.resize(
      Math.round(displayWidth),
      Math.round(displayHeight)
    );

    if (enableDebug) {
      console.log(
        `🔄 Resized image to display area: ${Math.round(
          displayWidth
        )}x${Math.round(displayHeight)}`
      );
    }

    // 5. 处理负值偏移的情况
    // 当偏移为负值时，需要调整策略：
    // - 负值偏移意味着图片需要被"拉出"容器边界
    // - 我们需要创建一个合适的画布来处理这种情况

    let finalImage: SharpInstance;

    // 确保偏移值是整数，避免Sharp的浮点数问题
    const roundedLeftOffset = Math.round(leftOffset);
    const roundedTopOffset = Math.round(topOffset);
    const roundedDisplayWidth = Math.round(displayWidth);
    const roundedDisplayHeight = Math.round(displayHeight);

    if (enableDebug) {
      console.log(
        `🔧 Rounded values: offset(${roundedLeftOffset}, ${roundedTopOffset}), display(${roundedDisplayWidth}x${roundedDisplayHeight})`
      );
    }

    // 创建目标容器大小的透明背景
    // 确保容器尺寸是整数
    const roundedContainerWidth = Math.round(containerWidth);
    const roundedContainerHeight = Math.round(containerHeight);

    const transparentBackground = this.sharp({
      create: {
        width: roundedContainerWidth,
        height: roundedContainerHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    if (roundedLeftOffset < 0 || roundedTopOffset < 0) {
      // 有负值偏移，需要特殊处理
      if (enableDebug) {
        console.log(
          `🔧 Handling negative offsets: L${roundedLeftOffset}px T${roundedTopOffset}px`
        );
      }

      // 计算需要裁剪的区域
      // 如果偏移为负，说明图片的一部分在容器外，需要裁剪掉
      const cropLeft = roundedLeftOffset < 0 ? -roundedLeftOffset : 0;
      const cropTop = roundedTopOffset < 0 ? -roundedTopOffset : 0;

      // 计算裁剪后的尺寸
      const croppedWidth = Math.min(
        roundedDisplayWidth - cropLeft,
        roundedContainerWidth
      );
      const croppedHeight = Math.min(
        roundedDisplayHeight - cropTop,
        roundedContainerHeight
      );

      if (
        croppedWidth > 0 &&
        croppedHeight > 0 &&
        cropLeft < roundedDisplayWidth &&
        cropTop < roundedDisplayHeight
      ) {
        // 先裁剪图片
        const croppedImage = processedImage.extract({
          left: cropLeft,
          top: cropTop,
          width: Math.min(croppedWidth, roundedDisplayWidth - cropLeft),
          height: Math.min(croppedHeight, roundedDisplayHeight - cropTop),
        });

        // 计算合成位置（负偏移时从0开始）
        const compositeLeft = Math.max(0, roundedLeftOffset);
        const compositeTop = Math.max(0, roundedTopOffset);

        finalImage = transparentBackground.composite([
          {
            input: await croppedImage.toBuffer(),
            left: compositeLeft,
            top: compositeTop,
          },
        ]);

        if (enableDebug) {
          console.log(
            `✂️ Cropped image: ${croppedWidth}x${croppedHeight} from (${cropLeft},${cropTop})`
          );
          console.log(
            `🔲 Composited at: L${compositeLeft}px T${compositeTop}px`
          );
        }
      } else {
        // 图片完全在容器外，返回透明背景
        finalImage = transparentBackground;
        if (enableDebug) {
          console.log(
            `⚠️ Image completely outside container, using transparent background`
          );
        }
      }
    } else {
      // 正常情况（无负偏移），直接合成
      // 但需要确保不超出容器边界
      const validLeft = Math.min(roundedLeftOffset, roundedContainerWidth - 1);
      const validTop = Math.min(roundedTopOffset, roundedContainerHeight - 1);

      // 如果图片部分超出容器，需要裁剪
      if (
        roundedLeftOffset + roundedDisplayWidth > roundedContainerWidth ||
        roundedTopOffset + roundedDisplayHeight > roundedContainerHeight
      ) {
        const availableWidth = Math.max(
          0,
          roundedContainerWidth - roundedLeftOffset
        );
        const availableHeight = Math.max(
          0,
          roundedContainerHeight - roundedTopOffset
        );
        const cropWidth = Math.min(roundedDisplayWidth, availableWidth);
        const cropHeight = Math.min(roundedDisplayHeight, availableHeight);

        if (cropWidth > 0 && cropHeight > 0) {
          const croppedImage = processedImage.extract({
            left: 0,
            top: 0,
            width: cropWidth,
            height: cropHeight,
          });

          finalImage = transparentBackground.composite([
            {
              input: await croppedImage.toBuffer(),
              left: validLeft,
              top: validTop,
            },
          ]);

          if (enableDebug) {
            console.log(`✂️ Cropped to fit: ${cropWidth}x${cropHeight}`);
            console.log(`🔲 Composited at: L${validLeft}px T${validTop}px`);
          }
        } else {
          finalImage = transparentBackground;
        }
      } else {
        // 图片完全在容器内
        finalImage = transparentBackground.composite([
          {
            input: await processedImage.toBuffer(),
            left: validLeft,
            top: validTop,
          },
        ]);

        if (enableDebug) {
          console.log(
            `🔲 Composited image at position: L${validLeft}px T${validTop}px`
          );
        }
      }
    }

    processedImage = finalImage;

    // 6. 验证最终尺寸（composite操作应该确保正确的尺寸）
    if (enableDebug) {
      const finalMetadata = await processedImage.metadata();
      console.log(
        `📋 Final image size: ${finalMetadata.width}x${finalMetadata.height}`
      );
    }

    // composite操作确保了正确的尺寸，直接返回
    return {
      image: processedImage,
      whitePaddingApplied: this.hasStretchOffset(fillRect),
      paddingInfo: this.hasStretchOffset(fillRect)
        ? `Applied fillRect transform`
        : "Direct resize",
    };
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
      enableDebug,
    };
  }

  /**
   * 工具方法：检查是否有裁剪
   */
  private hasCropping(
    srcRect: NonNullable<StretchOffsetConfig["srcRect"]>
  ): boolean {
    return (
      srcRect.left > 0 ||
      srcRect.top > 0 ||
      srcRect.right > 0 ||
      srcRect.bottom > 0
    );
  }

  /**
   * 工具方法：检查是否有拉伸偏移
   */
  private hasStretchOffset(fillRect: StretchOffsetConfig["fillRect"]): boolean {
    return (
      Math.abs(fillRect.left) > 0.001 ||
      Math.abs(fillRect.top) > 0.001 ||
      Math.abs(fillRect.right) > 0.001 ||
      Math.abs(fillRect.bottom) > 0.001
    );
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
      console.warn("⚠️ Failed to create debug directory:", error);
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `image-${this
      .debugImageCounter++}-${suffix}-${timestamp}.png`;
    const filepath = path.join(this.debugOutputDir, filename);

    try {
      // 保存图片
      await image.png().toFile(filepath);

      // 保存元数据
      const metadataFile = filepath.replace(".png", ".json");
      const debugInfo = {
        filename,
        timestamp: new Date().toISOString(),
        metadata,
        filepath: path.relative(process.cwd(), filepath),
      };

      fs.writeFileSync(metadataFile, JSON.stringify(debugInfo, null, 2));

      console.log(
        `💾 Debug image saved: ${path.relative(process.cwd(), filepath)}`
      );
      console.log(
        `📄 Metadata saved: ${path.relative(process.cwd(), metadataFile)}`
      );
    } catch (error) {
      console.error("❌ Failed to save debug image:", error);
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
      throw new Error("Sharp is not available for batch processing");
    }

    const results: ProcessedImageResult[] = [];

    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchPromises = batch.map(({ buffer, config }) =>
        this.applyStretchOffset(buffer, config)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error(
            `Batch processing failed for image ${i + index}:`,
            result.reason
          );
          // 可以推入错误占位符或跳过
        }
      });
    }

    return results;
  }
}
