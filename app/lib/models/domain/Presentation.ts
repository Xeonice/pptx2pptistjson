import { Slide } from "./Slide";
import { Theme } from "./Theme";

export class Presentation {
  private slides: Slide[] = [];
  private theme: Theme;
  private metadata: PresentationMetadata;
  private slideSize: SlideSize;
  private defaultTextStyle?: DefaultTextStyle;

  constructor(metadata: PresentationMetadata) {
    this.metadata = metadata;
    // Default slide size (16:9 ratio)
    this.slideSize = {
      width: 960,
      height: 540,
    };
  }

  addSlide(slide: Slide): void {
    this.slides.push(slide);
  }

  getSlides(): ReadonlyArray<Slide> {
    return this.slides;
  }

  getSlideById(id: string): Slide | undefined {
    return this.slides.find((slide) => slide.getId() === id);
  }

  getSlideByNumber(number: number): Slide | undefined {
    return this.slides.find((slide) => slide.getNumber() === number);
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
  }

  getTheme(): Theme {
    if (!this.theme) {
      throw new Error("theme is not found");
    }
    return this.theme;
  }

  getMetadata(): PresentationMetadata {
    return this.metadata;
  }

  setSlideSize(size: SlideSize): void {
    this.slideSize = size;
  }

  getSlideSize(): SlideSize {
    return this.slideSize;
  }

  setDefaultTextStyle(style: DefaultTextStyle): void {
    this.defaultTextStyle = style;
  }

  getDefaultTextStyle(): DefaultTextStyle | undefined {
    return this.defaultTextStyle;
  }

  toJSON(): any {
    return {
      metadata: this.metadata,
      slideSize: this.slideSize,
      theme: this.theme?.toJSON(),
      defaultTextStyle: this.defaultTextStyle,
      slides: this.slides.map((s) => s.toJSON()),
    };
  }
}

export interface PresentationMetadata {
  title?: string;
  author?: string;
  company?: string;
  subject?: string;
  keywords?: string;
  created?: Date;
  modified?: Date;
  format: "pptx";
}

export interface SlideSize {
  width: number;
  height: number;
}

export interface DefaultTextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  lineSpacing?: number;
}
