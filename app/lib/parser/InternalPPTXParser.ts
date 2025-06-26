/**
 * Internal PPTX Parser for app usage
 * Simplified version without complex export interfaces
 */

import { Presentation } from "../models/domain/Presentation";
import { ParseResult } from "../models/dto/ParseResult";
import { IPresentationParser } from "../services/interfaces/IPresentationParser";
import { createConfiguredContainer } from "../services/ServiceConfiguration";

/**
 * Simple internal parser interface
 */
export interface InternalParseOptions {
  includeNotes?: boolean;
  extractMedia?: boolean;
  parseCharts?: boolean;
}

/**
 * Simplified parse result for internal use
 */
export interface InternalParseResult {
  presentation: Presentation;
  slideCount: number;
  elementCount: number;
  warnings?: string[];
  parseTimeMs: number;
}

/**
 * Internal PPTX Parser - simplified for app usage
 */
export class InternalPPTXParser {
  private parser: IPresentationParser;

  constructor() {
    const container = createConfiguredContainer();
    this.parser = container.resolve<IPresentationParser>("IPresentationParser");
  }

  /**
   * Parse a PPTX file for internal app usage
   */
  async parse(
    file: ArrayBuffer | Blob,
    options?: InternalParseOptions
  ): Promise<InternalParseResult> {
    const startTime = Date.now();

    try {
      const result: ParseResult = await this.parser.parse(file, {
        includeNotes: options?.includeNotes || false,
        extractMedia: options?.extractMedia || false,
        parseCharts: options?.parseCharts || true,
        parseMath: true,
      });

      const slides = result.presentation.getSlides();
      const elementCount = slides.reduce(
        (sum, slide) => sum + slide.getElements().length,
        0
      );

      return {
        presentation: result.presentation,
        slideCount: slides.length,
        elementCount,
        warnings: result.warnings?.map((w) => w.message),
        parseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`PPTX parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse and return JSON directly (for API routes)
   */
  async parseToJSON(
    file: ArrayBuffer | Blob,
    options?: InternalParseOptions
  ): Promise<any> {
    const result = await this.parse(file, options);
    
    // Convert to the expected output format
    return {
      slides: result.presentation.getSlides().map((slide) => slide.toJSON()),
      theme: this.convertTheme(result.presentation.getTheme()),
      title: result.presentation.getMetadata().title || "Presentation"
    };
  }
  
  private convertTheme(theme: any): any {
    if (!theme) {
      return {
        fontName: "Microsoft Yahei",
        themeColor: {
          dk1: "rgba(0,7,15,1)",
          lt1: "#FFFFFF", 
          dk2: "#c3c3c3",
          lt2: "#e1e1e1",
          accent1: "rgba(0,7,15,1)",
          accent2: "#16a2ffff",
          accent3: "#16a2ffff", 
          accent4: "#c5dcffff",
          accent5: "#1450b0ff",
          accent6: "#FFFFFF"
        }
      };
    }
    
    return {
      fontName: theme.fontScheme?.majorFont?.latin || "Microsoft Yahei",
      themeColor: {
        dk1: this.convertColor(theme.colorScheme?.text1) || "rgba(0,7,15,1)",
        lt1: this.convertColor(theme.colorScheme?.background1) || "#FFFFFF",
        dk2: "#c3c3c3",
        lt2: "#e1e1e1", 
        accent1: this.convertColor(theme.colorScheme?.accent1) || "rgba(0,7,15,1)",
        accent2: this.convertColor(theme.colorScheme?.accent2) || "#16a2ffff",
        accent3: this.convertColor(theme.colorScheme?.accent3) || "#16a2ffff",
        accent4: this.convertColor(theme.colorScheme?.accent4) || "#c5dcffff",
        accent5: this.convertColor(theme.colorScheme?.accent5) || "#1450b0ff",
        accent6: this.convertColor(theme.colorScheme?.accent6) || "#FFFFFF"
      }
    };
  }
  
  private convertColor(color: string | undefined): string | undefined {
    if (!color) return undefined;
    
    // Convert hex colors to rgba format if needed
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},1)`;
    }
    
    return color;
  }

  /**
   * Get only slide data for rendering
   */
  async parseForDisplay(file: ArrayBuffer | Blob): Promise<{
    slides: any[];
    slideSize: { width: number; height: number };
    theme?: any;
  }> {
    const result = await this.parse(file);
    return {
      slides: result.presentation.getSlides().map((slide) => ({
        id: slide.getId(),
        number: slide.getNumber(),
        elements: slide.getElements().map((element) => ({
          id: element.getId(),
          type: element.getType(),
          position: element.getPosition(),
          size: element.getSize(),
          rotation: element.getRotation(),
          ...element.toJSON(),
        })),
        background: slide.getBackground(),
      })),
      slideSize: result.presentation.getSlideSize(),
      theme: result.presentation.getTheme()?.toJSON(),
    };
  }
}

/**
 * Default instance for app usage
 */
export const pptxParser = new InternalPPTXParser();
