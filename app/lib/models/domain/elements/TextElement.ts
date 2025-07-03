import { Element } from "./Element";
import { HtmlConverter } from "../../../services/utils/HtmlConverter";

export class TextElement extends Element {
  private content: TextContent[] = [];
  private paragraphs: TextContent[][] = [];
  private textStyle?: TextStyle;

  constructor(id: string) {
    super(id, "text");
  }

  addContent(content: TextContent): void {
    this.content.push(content);
  }

  /**
   * Set content organized by paragraphs
   */
  setParagraphs(paragraphs: TextContent[][]): void {
    this.paragraphs = paragraphs;
    // Also flatten to maintain compatibility with legacy content access
    this.content = paragraphs.flat();
  }

  /**
   * Add a single paragraph
   */
  addParagraph(paragraphContent: TextContent[]): void {
    this.paragraphs.push(paragraphContent);
    this.content.push(...paragraphContent);
  }

  getContent(): ReadonlyArray<TextContent> {
    return this.content;
  }

  getParagraphs(): ReadonlyArray<ReadonlyArray<TextContent>> {
    return this.paragraphs;
  }

  setTextStyle(style: TextStyle): void {
    this.textStyle = style;
  }

  getTextStyle(): TextStyle | undefined {
    return this.textStyle;
  }

  toJSON(): any {
    // Convert text content to HTML format like the expected output
    const htmlContent = this.convertToHTML();

    return {
      type: this.type,
      id: this.id,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      width: this.size?.width || 0,
      height: this.size?.height || 0,
      content: htmlContent,
      rotate: this.rotation || 0,
      defaultFontName: this.getDefaultFontName(),
      defaultColor: this.getDefaultColor(),
      vertical: false,
      fit: "resize",
      enableShrink: true,
    };
  }

  private convertToHTML(): string {
    if (this.content.length === 0) return "";

    // Use paragraph structure if available, otherwise fall back to single paragraph
    if (this.paragraphs.length > 0) {
      return HtmlConverter.convertParagraphsToHtml(this.paragraphs);
    } else {
      // Legacy single paragraph support
      return HtmlConverter.convertSingleParagraphToHtml(this.content);
    }
  }

  private getDefaultFontName(): string {
    return HtmlConverter.getDefaultFontName(this.content);
  }

  private getDefaultColor(): { color: string; colorType: string } {
    const color = HtmlConverter.getDefaultColor(this.content);
    return {
      color: color,
      colorType: this.getColorType(color),
    };
  }

  private isThemeColor(color: string): boolean {
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

  private isDarkColor(color: string): boolean {
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

  private getColorType(color: string): string {
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
}

export interface TextContent {
  text: string;
  style?: TextRunStyle;
}

export interface TextStyle {
  align?: "left" | "center" | "right" | "justify";
  valign?: "top" | "middle" | "bottom";
  margin?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  lineSpacing?: number;
  beforeSpacing?: number;
  afterSpacing?: number;
  indent?: number;
  bulletStyle?: BulletStyle;
}

export interface TextRunStyle {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  backgroundColor?: string;
  subscript?: boolean;
  superscript?: boolean;
  link?: string;
  themeColorType?: string; // Store the original theme color type (e.g., 'accent1', 'dk1')
  textAlign?: string; // For paragraph-level alignment
}

export interface BulletStyle {
  type: "bullet" | "number" | "custom";
  char?: string;
  color?: string;
  size?: number;
  font?: string;
  startNumber?: number;
}
