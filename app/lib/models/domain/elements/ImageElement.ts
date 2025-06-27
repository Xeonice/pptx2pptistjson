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

  constructor(id: string, src: string) {
    super(id, "image");
    this.src = src;
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
        range: this.crop ? this.convertCropToRange() : [[0, 0], [100, 100]],
      },
      loading: false,
    };

    // 根据是否有图片数据决定输出格式
    if (this.hasImageData()) {
      return {
        ...baseOutput,
        src: this.dataUrl!, // Base64 data URL
        format: this.format,
        mimeType: this.mimeType,
        originalSize: this.originalSize,
        mode: 'base64',
        // 保留原始路径作为备用信息
        originalSrc: this.src,
        alt: this.alt,
      };
    } else {
      // 回退到占位符URL模式
      return {
        ...baseOutput,
        src: this.convertSrcToUrl(),
        mode: 'url',
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
    if (!this.crop) return [[0, 0], [100, 100]];
    
    // 将裁剪信息转换为百分比范围
    return [
      [this.crop.left, this.crop.top],
      [100 - this.crop.right, 100 - this.crop.bottom]
    ];
  }
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
