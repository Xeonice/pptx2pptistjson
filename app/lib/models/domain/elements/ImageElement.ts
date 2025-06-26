import { Element } from './Element';

export class ImageElement extends Element {
  private src: string;
  private alt?: string;
  private crop?: ImageCrop;

  constructor(id: string, src: string) {
    super(id, 'image');
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

  toJSON(): any {
    return {
      type: this.type,
      id: this.id,
      src: this.convertSrcToUrl(),
      width: this.size?.width || 0,
      height: this.size?.height || 0,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      fixedRatio: true,
      rotate: this.rotation || 0,
      enableShrink: true,
      clip: {
        shape: "rect",
        range: [
          [0, 0],
          [100, 100]
        ]
      },
      loading: false
    };
  }
  
  private convertSrcToUrl(): string {
    // Convert relative paths to placeholder URLs
    if (this.src.startsWith('../media/') || this.src.startsWith('media/')) {
      // Generate a placeholder URL based on filename
      const filename = this.src.split('/').pop() || 'image.jpg';
      return `https://example.com/images/${filename}`;
    }
    return this.src;
  }
}

export interface ImageCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}