import { Element } from "./Element";

export class ImageElement extends Element {
  private src: string;
  private alt?: string;
  private crop?: ImageCrop;
  private imageData?: ImageData;
  private dataUrl?: string;
  private format?: string;
  private mimeType?: string;
  private originalSize?: number;
  private aspectRatio?: number;
  private offsetInfo?: ImageOffsetInfo;
  private stretchInfo?: ImageStretchInfo;
  private embedId?: string;

  constructor(id: string, src: string, embedId?: string) {
    super(id, "image");
    this.src = src;
    this.embedId = embedId;
  }

  getSrc(): string {
    return this.src;
  }

  setAlt(alt: string): void {
    this.alt = alt;
  }

  getAlt(): string | undefined {
    return this.alt;
  }

  setCrop(crop: ImageCrop): void {
    this.crop = crop;
  }

  getCrop(): ImageCrop | undefined {
    return this.crop;
  }

  setImageData(imageData: ImageData, dataUrl: string): void {
    this.imageData = imageData;
    this.dataUrl = dataUrl;
    this.format = imageData.format;
    this.mimeType = imageData.mimeType;
    this.originalSize = imageData.size;
  }

  getDataUrl(): string | undefined {
    return this.dataUrl;
  }

  getFormat(): string | undefined {
    return this.format;
  }

  getMimeType(): string | undefined {
    return this.mimeType;
  }

  getOriginalSize(): number | undefined {
    return this.originalSize;
  }

  hasImageData(): boolean {
    return !!(this.imageData && this.dataUrl);
  }

  setAspectRatio(ratio: number): void {
    this.aspectRatio = ratio;
  }

  getAspectRatio(): number | undefined {
    return this.aspectRatio;
  }

  setOffsetInfo(offsetInfo: ImageOffsetInfo): void {
    this.offsetInfo = offsetInfo;
  }

  getOffsetInfo(): ImageOffsetInfo | undefined {
    return this.offsetInfo;
  }

  setStretchInfo(stretchInfo: ImageStretchInfo): void {
    this.stretchInfo = stretchInfo;
  }

  getStretchInfo(): ImageStretchInfo | undefined {
    // 优先使用从XML解析的拉伸信息
    if (this.stretchInfo) {
      return this.stretchInfo;
    }
    
    // 如果有偏移信息，转换为拉伸信息
    if (this.offsetInfo) {
      // 验证偏移百分比值
      const leftPercent = this.offsetInfo.leftOffsetPercent;
      const topPercent = this.offsetInfo.topOffsetPercent;
      const rightPercent = this.offsetInfo.rightOffsetPercent;
      const bottomPercent = this.offsetInfo.bottomOffsetPercent;
      
      // 检查是否有无效值（NaN或Infinity）
      if (!isFinite(leftPercent) || !isFinite(topPercent) || 
          !isFinite(rightPercent) || !isFinite(bottomPercent)) {
        console.warn(`Invalid offset percentages in ImageElement ${this.id}:`, {
          left: leftPercent, top: topPercent, right: rightPercent, bottom: bottomPercent
        });
        return undefined;
      }
      
      // PowerPoint fillRect 的工作原理：
      // - 负值表示图片超出容器边界（向外扩展）
      // - 正值表示图片在容器内部（向内收缩）
      // 直接转换百分比为小数，保持负值
      const left = leftPercent / 100;
      const top = topPercent / 100;
      const right = rightPercent / 100;
      const bottom = bottomPercent / 100;
      
      // 检查分母是否会导致除零
      const widthDenominator = 1 - left - right;
      const heightDenominator = 1 - top - bottom;
      
      if (widthDenominator <= 0.001 || heightDenominator <= 0.001) {
        console.warn(`FillRect would cause division by zero in ImageElement ${this.id}:`, {
          left, top, right, bottom,
          widthDenominator, heightDenominator
        });
        return undefined;
      }
      
      return {
        fillRect: {
          left,
          top,
          right,
          bottom,
        },
      };
    }
    return undefined;
  }

  setEmbedId(embedId: string): void {
    this.embedId = embedId;
  }

  getEmbedId(): string | undefined {
    return this.embedId;
  }

  toJSON(): any {
    const baseOutput = {
      type: this.type,
      id: this.id,
      width: this.size?.width || 0,
      height: this.size?.height || 0,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      fixedRatio: true,
      rotate: this.rotation || 0,
      clip: {
        shape: "rect",
        range: this.crop
          ? this.convertCropToRange()
          : [
              [0, 0],
              [100, 100],
            ],
      },
      loading: false,
      // 偏移信息 - 供编辑器使用
      offsetInfo: this.offsetInfo
        ? {
            // 绝对偏移量(points)
            leftOffset: this.offsetInfo.leftOffset,
            topOffset: this.offsetInfo.topOffset,
            rightOffset: this.offsetInfo.rightOffset,
            bottomOffset: this.offsetInfo.bottomOffset,
            // 百分比偏移量(类似PowerPoint Stretch Offset)
            leftOffsetPercent: this.offsetInfo.leftOffsetPercent,
            topOffsetPercent: this.offsetInfo.topOffsetPercent,
            rightOffsetPercent: this.offsetInfo.rightOffsetPercent,
            bottomOffsetPercent: this.offsetInfo.bottomOffsetPercent,
            // 原始和转换后位置
            originalPosition: {
              x: this.offsetInfo.originalX,
              y: this.offsetInfo.originalY,
            },
            convertedPosition: {
              x: this.offsetInfo.convertedX,
              y: this.offsetInfo.convertedY,
            },
          }
        : undefined,
      // 拉伸信息 - PowerPoint原生fillRect
      stretchInfo: this.stretchInfo
        ? {
            fillRect: this.stretchInfo.fillRect,
            srcRect: this.stretchInfo.srcRect,
            fromXml: this.stretchInfo.fromXml,
          }
        : undefined,
    };

    // 根据是否有图片数据决定输出格式
    if (this.hasImageData()) {
      return {
        ...baseOutput,
        src: this.dataUrl!, // Base64 data URL
        format: this.format,
        mimeType: this.mimeType,
        originalSize: this.originalSize,
        mode: "base64",
        // 保留原始路径作为备用信息
        originalSrc: this.src,
        alt: this.alt,
      };
    } else {
      // 回退到占位符URL模式
      return {
        ...baseOutput,
        src: this.convertSrcToUrl(),
        mode: "url",
        alt: this.alt,
      };
    }
  }

  private convertSrcToUrl(): string {
    // Convert relative paths to placeholder URLs
    if (this.src.startsWith("../media/") || this.src.startsWith("media/")) {
      // Generate a placeholder URL based on filename
      const filename = this.src.split("/").pop() || "image.jpg";
      return `https://example.com/images/${filename}`;
    }
    return this.src;
  }

  private convertCropToRange(): number[][] {
    if (!this.crop)
      return [
        [0, 0],
        [100, 100],
      ];

    // 将裁剪信息转换为百分比范围
    return [
      [this.crop.left, this.crop.top],
      [100 - this.crop.right, 100 - this.crop.bottom],
    ];
  }
}

export interface ImageOffsetInfo {
  originalX: number; // 原始EMU单位的X坐标
  originalY: number; // 原始EMU单位的Y坐标
  convertedX: number; // 转换后的X坐标(points)
  convertedY: number; // 转换后的Y坐标(points)
  adjustedX?: number; // 调整后的X坐标(points)
  adjustedY?: number; // 调整后的Y坐标(points)
  leftOffset: number; // 向左偏移量(points)
  topOffset: number; // 向上偏移量(points)
  rightOffset: number; // 向右偏移量(points)
  bottomOffset: number; // 向下偏移量(points)
  leftOffsetPercent: number; // 向左偏移百分比
  topOffsetPercent: number; // 向上偏移百分比
  rightOffsetPercent: number; // 向右偏移百分比
  bottomOffsetPercent: number; // 向下偏移百分比
}

export interface ImageCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ImageData {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  format: string;
  size: number;
  hash: string;
  dimensions?: { width: number; height: number };
}

export interface ImageStretchInfo {
  fillRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  srcRect?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  fromXml?: boolean; // 标记是否来自XML解析
}
