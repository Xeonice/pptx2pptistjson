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

    const result = {
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
      lineHeight: this.getLineHeight(),
    };
    return result;
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
    return {
      color: "#333333",
      colorType: "dk1",
    };
  }

  private getLineHeight(): number | undefined {
    const lineHeight = this.textStyle?.lineHeight;
    return lineHeight ?? 1;
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
  lineHeight?: number;
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
  lineHeight?: number; // Line height as a multiplier (e.g., 1.5 for 150%)
}

export interface BulletStyle {
  type: "bullet" | "number" | "custom";
  char?: string;
  color?: string;
  size?: number;
  font?: string;
  startNumber?: number;
}
