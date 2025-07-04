import { TextContent, TextRunStyle } from "../../models/domain/elements/TextElement";

/**
 * Utility class for converting text content to HTML format
 * Provides unified HTML generation logic for all text processors
 */
export class HtmlConverter {
  
  /**
   * Convert text content to HTML with proper paragraph structure
   * @param paragraphs Array of paragraph content items
   * @param options Configuration options for HTML generation
   */
  static convertParagraphsToHtml(
    paragraphs: Array<TextContent[]>, 
    options: HtmlConversionOptions = {}
  ): string {
    if (paragraphs.length === 0) return "";

    const pElements = paragraphs.map(paragraphContent => {
      const spanElements = this.convertContentToSpans(paragraphContent, options);
      const paragraphStyle = this.buildParagraphStyle(paragraphContent, options);
      return `<p${paragraphStyle}>${spanElements}</p>`;
    });

    if (options.wrapInDiv !== false) {
      const divStyle = options.divStyle ? ` style="${options.divStyle}"` : ' style=""';
      return `<div${divStyle}>${pElements.join("")}</div>`;
    }

    return pElements.join("");
  }

  /**
   * Convert single paragraph content to HTML
   * @param contentItems Array of text content items for a single paragraph
   * @param options Configuration options
   */
  static convertSingleParagraphToHtml(
    contentItems: TextContent[], 
    options: HtmlConversionOptions = {}
  ): string {
    const spanElements = this.convertContentToSpans(contentItems, options);
    const paragraphStyle = this.buildParagraphStyle(contentItems, options);
    const pElement = `<p${paragraphStyle}>${spanElements}</p>`;

    if (options.wrapInDiv !== false) {
      const divStyle = options.divStyle ? ` style="${options.divStyle}"` : ' style=""';
      return `<div${divStyle}>${pElement}</div>`;
    }

    return pElement;
  }

  /**
   * Convert text content items to span elements
   */
  private static convertContentToSpans(contentItems: TextContent[], options: HtmlConversionOptions = {}): string {
    return contentItems
      .map(item => this.convertContentItemToSpan(item, options))
      .join("");
  }

  /**
   * Convert a single text content item to a span element
   */
  private static convertContentItemToSpan(item: TextContent, options: HtmlConversionOptions = {}): string {
    const styles = this.buildSpanStyles(item.style);
    const dataAttributes = this.buildDataAttributes(item.style);
    
    let span = "<span";
    
    if (styles.length > 0) {
      span += ` style="${styles.join(";")}"`;
    } else {
      // Always add style attribute even if empty for consistency with old format
      span += ' style=""';
    }
    
    if (dataAttributes.length > 0) {
      span += ` ${dataAttributes.join(" ")}`;
    }
    
    // For compatibility with old behavior, don't escape HTML by default
    // Escape HTML content only if explicitly requested
    const textContent = options.escapeHtml === true ? this.escapeHtml(item.text) : item.text;
    span += `>${textContent}</span>`;
    
    return span;
  }

  /**
   * Build CSS styles for a span element
   */
  private static buildSpanStyles(style?: TextRunStyle): string[] {
    const styles: string[] = [];
    
    if (!style) return styles;

    // Follow the exact order from the old TextElement implementation
    if (style.color) {
      styles.push(`color:${style.color}`);
    }
    
    if (style.fontSize) {
      styles.push(`font-size:${style.fontSize}px`);
    }
    
    if (style.bold) {
      styles.push("font-weight:bold");
    }
    
    if (style.italic) {
      styles.push("font-style:italic");
    }
    
    if (style.underline) {
      styles.push("text-decoration:underline");
    }
    
    if (style.strike) {
      styles.push("text-decoration:line-through");
    }
    
    if (style.fontFamily) {
      styles.push(`font-family:'${style.fontFamily}'`);
    }
    
    if (style.backgroundColor) {
      styles.push(`background-color:${style.backgroundColor}`);
    }

    // Add colortype at the end if color exists
    if (style.color && (style.themeColorType || this.isThemeColor(style.color))) {
      const colorType = style.themeColorType || this.getColorType(style.color);
      styles.push(`--colortype:${colorType}`);
    }

    return styles;
  }

  /**
   * Check if a color is a theme color
   */
  private static isThemeColor(color: string): boolean {
    // Check for theme colors in various formats
    const normalizedColor = color.toUpperCase();

    // Common theme colors in hex format (including actual values from current PPTX)
    const themeColors = [
      "#4472C4",
      "#4472C4FF",
      "#ED7D31",
      "#ED7D31FF",
      "#A5A5A5",
      "#A5A5A5FF",
      "#FFC000",
      "#FFC000FF",
      "#5B9BD5",
      "#5B9BD5FF",
      "#70AD47",
      "#70AD47FF",
      "#333333",
      "#333333FF",
      "#000000",
      "#000000FF",
      "#00070F",
      "#00070FFF", // dk1 color from current file
    ];

    // Also check if it's a dark color that should be treated as dk1
    if (this.isDarkColor(color)) {
      return true;
    }

    return themeColors.includes(normalizedColor);
  }

  /**
   * Check if a color is dark
   */
  private static isDarkColor(color: string): boolean {
    // Parse hex color and check if it's dark (suitable for dk1/dk2)
    let hex = color.replace("#", "").replace("ff", "").replace("FF", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Calculate luminance (0.299*R + 0.587*G + 0.114*B)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Consider colors with luminance < 50 as dark (dk1/dk2)
      return luminance < 50;
    }
    return false;
  }

  /**
   * Get the color type for a given color
   */
  private static getColorType(color: string): string {
    // Map colors to theme types
    const normalizedColor = color.toUpperCase();
    const colorMap: { [key: string]: string } = {
      "#4472C4": "accent1",
      "#4472C4FF": "accent1",
      "#5B9BD5": "accent1",
      "#5B9BD5FF": "accent1",
      "#333333": "dk1",
      "#333333FF": "dk1",
      "#000000": "dk1",
      "#000000FF": "dk1",
      "#00070F": "dk1",
      "#00070FFF": "dk1",
    };

    // Check explicit mapping first
    if (colorMap[normalizedColor]) {
      return colorMap[normalizedColor];
    }

    // For unmapped colors, use luminance to determine type
    if (this.isDarkColor(color)) {
      return "dk1";
    }

    // Default fallback
    return "dk1";
  }

  /**
   * Build data attributes for a span element
   */
  private static buildDataAttributes(style?: TextRunStyle): string[] {
    const attributes: string[] = [];
    
    if (!style) return attributes;

    if (style.themeColorType) {
      attributes.push(`data-theme-color="${style.themeColorType}"`);
    }

    return attributes;
  }

  /**
   * Build paragraph-level styles
   */
  private static buildParagraphStyle(
    contentItems: TextContent[], 
    options: HtmlConversionOptions
  ): string {
    const styles: string[] = [];
    
    // Get text alignment from content items or options
    const textAlign = this.getTextAlignment(contentItems, options);
    if (textAlign) {
      styles.push(`text-align:${textAlign}`);
    }

    // Add custom paragraph styles from options
    if (options.paragraphStyle) {
      styles.push(options.paragraphStyle);
    }

    return styles.length > 0 ? ` style="${styles.join(";")}"` : ' style=""';
  }

  /**
   * Extract text alignment from content items or options
   */
  private static getTextAlignment(
    contentItems: TextContent[], 
    options: HtmlConversionOptions
  ): string | undefined {
    // Priority: explicit option > content style > default
    if (options.textAlign) {
      return options.textAlign;
    }

    // Look for text alignment in content items
    const alignedItem = contentItems.find(item => item.style?.textAlign);
    return alignedItem?.style?.textAlign;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    // Handle null, undefined, or non-string values
    if (text == null || typeof text !== 'string') {
      return '';
    }

    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, (match) => htmlEscapeMap[match]);
  }

  /**
   * Get default font name from content items
   */
  static getDefaultFontName(contentItems: TextContent[]): string {
    const firstFontItem = contentItems.find(item => item.style?.fontFamily);
    return firstFontItem?.style?.fontFamily || "Microsoft Yahei";
  }

  /**
   * Get default color from content items
   */
  static getDefaultColor(contentItems: TextContent[]): string {
    const firstColorItem = contentItems.find(item => item.style?.color);
    return firstColorItem?.style?.color || "#333333";
  }
}

export interface HtmlConversionOptions {
  /**
   * Whether to wrap output in a div element (default: true)
   */
  wrapInDiv?: boolean;

  /**
   * CSS style for the wrapping div element
   */
  divStyle?: string;

  /**
   * CSS style to add to paragraph elements
   */
  paragraphStyle?: string;

  /**
   * Text alignment for paragraphs
   */
  textAlign?: string;

  /**
   * Whether to escape HTML content (default: true)
   */
  escapeHtml?: boolean;
}