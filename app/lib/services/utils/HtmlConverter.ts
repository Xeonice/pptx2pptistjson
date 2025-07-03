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
      const spanElements = this.convertContentToSpans(paragraphContent);
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
    const spanElements = this.convertContentToSpans(contentItems);
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
  private static convertContentToSpans(contentItems: TextContent[]): string {
    return contentItems
      .map(item => this.convertContentItemToSpan(item))
      .join("");
  }

  /**
   * Convert a single text content item to a span element
   */
  private static convertContentItemToSpan(item: TextContent): string {
    const styles = this.buildSpanStyles(item.style);
    const dataAttributes = this.buildDataAttributes(item.style);
    
    let span = "<span";
    
    if (styles.length > 0) {
      span += ` style="${styles.join("; ")}"`;
    }
    
    if (dataAttributes.length > 0) {
      span += ` ${dataAttributes.join(" ")}`;
    }
    
    // Escape HTML content
    const escapedText = this.escapeHtml(item.text);
    span += `>${escapedText}</span>`;
    
    return span;
  }

  /**
   * Build CSS styles for a span element
   */
  private static buildSpanStyles(style?: TextRunStyle): string[] {
    const styles: string[] = [];
    
    if (!style) return styles;

    if (style.fontSize) {
      styles.push(`font-size: ${style.fontSize}px`);
    }
    
    if (style.color) {
      styles.push(`color: ${style.color}`);
    }
    
    if (style.fontFamily) {
      styles.push(`font-family: '${style.fontFamily}'`);
    }
    
    if (style.bold) {
      styles.push("font-weight: bold");
    }
    
    if (style.italic) {
      styles.push("font-style: italic");
    }
    
    if (style.underline) {
      styles.push("text-decoration: underline");
    }
    
    if (style.strike) {
      styles.push("text-decoration: line-through");
    }
    
    if (style.backgroundColor) {
      styles.push(`background-color: ${style.backgroundColor}`);
    }

    return styles;
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
      styles.push(`text-align: ${textAlign}`);
    }

    // Add custom paragraph styles from options
    if (options.paragraphStyle) {
      styles.push(options.paragraphStyle);
    }

    return styles.length > 0 ? ` style="${styles.join("; ")}"` : ' style=""';
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