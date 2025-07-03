import { Element } from './elements/Element';

export class Slide {
  private id: string;
  private number: number;
  private elements: Element[] = [];
  private background?: SlideBackground;
  private layout?: SlideLayout;
  private notes?: string;
  private transition?: SlideTransition;

  constructor(id: string, number: number) {
    this.id = id;
    this.number = number;
  }

  getId(): string {
    return this.id;
  }

  getNumber(): number {
    return this.number;
  }

  addElement(element: Element): void {
    this.elements.push(element);
  }

  getElements(): ReadonlyArray<Element> {
    return this.elements;
  }

  setBackground(background: SlideBackground): void {
    this.background = background;
  }

  getBackground(): SlideBackground | undefined {
    return this.background;
  }

  setLayout(layout: SlideLayout): void {
    this.layout = layout;
  }

  getLayout(): SlideLayout | undefined {
    return this.layout;
  }

  setNotes(notes: string): void {
    this.notes = notes;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  setTransition(transition: SlideTransition): void {
    this.transition = transition;
  }

  getTransition(): SlideTransition | undefined {
    return this.transition;
  }

  toJSON(): any {
    return {
      id: this.generateSlideId(),
      elements: this.elements.map(e => e.toJSON()),
      background: this.convertBackground(),
      remark: this.notes || ""
    };
  }
  
  private generateSlideId(): string {
    // Generate a random ID similar to the expected format
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private convertBackground(): any {
    if (!this.background) {
      return {
        type: "image",
        themeColor: {
          color: "#F4F7FF",
          colorType: "lt1"
        },
        image: "https://example.com/background.png",
        imageSize: "cover"
      };
    }
    
    switch (this.background.type) {
      case 'image':
        return this.convertImageBackground(this.background);
      case 'solid':
        return {
          type: "solid",
          color: this.background.color || "#FFFFFF"
        };
      case 'gradient':
        return {
          type: "gradient",
          colors: this.background.colors || []
        };
      default:
        return {
          type: "image",
          themeColor: {
            color: "#F4F7FF",
            colorType: "lt1"
          },
          image: "https://example.com/background.png",
          imageSize: "cover"
        };
    }
  }

  private convertImageBackground(background: SlideBackground): any {
    const baseResult = {
      type: "image",
      themeColor: {
        color: "#F4F7FF",
        colorType: "lt1"
      },
      imageSize: "cover"
    };

    // Priority 1: Use base64 data URL if available (current implementation)
    if (background.imageUrl && background.imageUrl.startsWith('data:')) {
      return {
        ...baseResult,
        image: background.imageUrl
      };
    }

    // Priority 2: Cloud service URL (extension point for future implementation)
    if (background.imageData && this.shouldUseCloudStorage()) {
      const cloudUrl = this.uploadToCloudService(background.imageData);
      if (cloudUrl) {
        return {
          ...baseResult,
          image: cloudUrl
        };
      }
    }

    // Priority 3: Fallback to relationship-based URL or placeholder
    const fallbackImage = background.imageUrl ? 
      `https://example.com/backgrounds/${background.imageUrl}.png` : 
      "https://example.com/background.png";
    
    return {
      ...baseResult,
      image: fallbackImage
    };
  }

  // Extension point: Override this method to enable cloud storage
  private shouldUseCloudStorage(): boolean {
    // TODO: Implement cloud storage configuration check
    // return process.env.ENABLE_CLOUD_STORAGE === 'true' || this.cloudConfig?.enabled;
    return false;
  }

  // Extension point: Override this method to implement cloud upload
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private uploadToCloudService(_imageData: any): string | null {
    // TODO: Implement cloud service upload logic
    // Examples:
    // - Upload to AWS S3 and return public URL
    // - Upload to Alibaba Cloud OSS and return CDN URL  
    // - Upload to custom image service and return hosted URL
    console.warn('Cloud storage not implemented yet, falling back to base64');
    return null;
  }
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  colors?: Array<{ color: string; position: number }>;
  imageUrl?: string;
  imageData?: any; // Raw image data for cloud upload extension
}

export interface SlideLayout {
  type: string;
  master?: string;
}

export interface SlideTransition {
  type: string;
  duration?: number;
  direction?: string;
}