/**
 * Internal PPTX Parser for app usage
 * Simplified version without complex export interfaces
 */

import { Presentation } from "../models/domain/Presentation";
import { Theme } from "../models/domain/Theme";
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
  enableDebugMode?: boolean;
  debugOptions?: {
    saveDebugImages?: boolean;
    logProcessingDetails?: boolean;
    preserveIntermediateSteps?: boolean;
    includeColorResolutionTrace?: boolean;
    includeTimingInfo?: boolean;
    saveXmlFiles?: boolean;
  };
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
 * Slide data structure for JSON output
 */
export interface SlideJSON {
  id: string;
  elements: ElementJSON[];
  background?: {
    type: string;
    color?: string;
    image?: string;
    [key: string]: unknown;
  };
  remark?: string;
}

/**
 * Element data structure for JSON output
 */
export interface ElementJSON {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

/**
 * Theme data structure for JSON output
 */
export interface ThemeJSON {
  fontName: string;
  themeColor?: Record<string, string>;
}

/**
 * PPTist compatible JSON format
 */
export interface PPTistJSON {
  width: number;
  height: number;
  slides: SlideJSON[];
  theme: ThemeJSON;
  title: string;
}

/**
 * Display format for rendering
 */
export interface DisplayFormat {
  slides: Array<{
    id: string;
    number: number;
    elements: Array<Record<string, unknown>>;
    background?: unknown;
  }>;
  slideSize: { width: number; height: number };
  theme?: Record<string, unknown>;
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
        enableDebugMode: options?.enableDebugMode,
        debugOptions: options?.debugOptions,
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
  ): Promise<PPTistJSON> {
    const result = await this.parse(file, options);
    const slideSize = result.presentation.getSlideSize();

    // Convert to the expected PPTist format with top-level width/height
    return {
      width: slideSize.width,
      height: slideSize.height,
      slides: result.presentation.getSlides().map((slide) => slide.toJSON()),
      theme: this.convertTheme(result.presentation.getTheme()),
      title: result.presentation.getMetadata().title || "Presentation",
    };
  }

  private convertTheme(theme: Theme): ThemeJSON {
    const colorScheme = theme.getColorScheme();
    const themeColor: Record<string, string> = {};
    
    if (colorScheme) {
      Object.entries(colorScheme).forEach(([key, value]) => {
        themeColor[key] = value;
      });
    }
    
    return {
      fontName: theme.getFontScheme()?.majorFont?.latin || "Microsoft Yahei",
      themeColor: Object.keys(themeColor).length > 0 ? themeColor : undefined,
    };
  }


  /**
   * Get only slide data for rendering
   */
  async parseForDisplay(file: ArrayBuffer | Blob): Promise<DisplayFormat> {
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
