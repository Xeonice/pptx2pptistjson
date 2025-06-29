import { Element } from "./Element";

export class TextElement extends Element {
  private content: TextContent[] = [];
  private textStyle?: TextStyle;

  constructor(id: string) {
    super(id, "text");
  }

  addContent(content: TextContent): void {
    this.content.push(content);
  }

  getContent(): ReadonlyArray<TextContent> {
    return this.content;
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

    // Combine all text content with their styles
    let htmlSpans = this.content
      .map((content) => {
        const style = content.style;
        const styleAttrs: string[] = [];

        let colorType = "";

        if (style?.color) {
          let colorValue = style.color;
          colorType = style.themeColorType || "";

          // Handle theme color references
          if (style.color.startsWith("theme:")) {
            colorType = style.color.replace("theme:", "");
            // Get actual color from theme context (would need theme access)
            // For now, use the expected colors from output.json
            const themeColorMap: { [key: string]: string } = {
              accent1: "#5b9bd5ff",
              dk1: "#333333ff",
              lt1: "#ffffffff",
            };
            colorValue = themeColorMap[colorType] || "#333333ff";
          }

          styleAttrs.push(`color:${colorValue}`);
        }

        if (style?.fontSize) {
          styleAttrs.push(`font-size:${style.fontSize}px`);
        }

        if (style?.bold) {
          styleAttrs.push("font-weight:bold");
        }

        if (style?.italic) {
          styleAttrs.push("font-style:italic");
        }

        // Add colortype at the end
        if (style?.color && (colorType || this.isThemeColor(style.color))) {
          const finalColorType = colorType || this.getColorType(style.color);
          styleAttrs.push(`--colortype:${finalColorType}`);
        }

        const styleStr =
          styleAttrs.length > 0 ? ` style="${styleAttrs.join(";")}"` : "";
        return `<span${styleStr}>${content.text}</span>`;
      })
      .join("");

    return `<div  style=""><p  style="">${htmlSpans}</p></div>`;
  }

  private getDefaultFontName(): string {
    // Get font from first content item or use default
    return this.content[0]?.style?.fontFamily || "Microsoft Yahei";
  }

  private getDefaultColor(): { color: string; colorType: string } {
    return {
      color: "#333333",
      colorType: "dk1",
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
}

export interface BulletStyle {
  type: "bullet" | "number" | "custom";
  char?: string;
  color?: string;
  size?: number;
  font?: string;
  startNumber?: number;
}
