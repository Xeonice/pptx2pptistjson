import { Element, ElementType } from './Element';

export class TextElement extends Element {
  private content: TextContent[] = [];
  private textStyle?: TextStyle;

  constructor(id: string) {
    super(id, 'text');
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
      enableShrink: true
    };
  }

  private convertToHTML(): string {
    if (this.content.length === 0) return "";
    
    // Combine all text content with their styles
    let htmlSpans = this.content.map(content => {
      const style = content.style;
      const styleAttrs: string[] = [];
      
      if (style?.color) {
        const colorHex = style.color.replace('#', '') + 'ff'; // Add alpha
        styleAttrs.push(`color:${style.color}`);
        if (this.isThemeColor(style.color)) {
          styleAttrs.push(`--colortype:${this.getColorType(style.color)}`);
        }
      }
      
      if (style?.fontSize) {
        styleAttrs.push(`font-size:${style.fontSize}px`);
      }
      
      if (style?.bold) {
        styleAttrs.push('font-weight:bold');
      }
      
      if (style?.italic) {
        styleAttrs.push('font-style:italic');
      }
      
      const styleStr = styleAttrs.length > 0 ? ` style="${styleAttrs.join(';')}"` : '';
      return `<span${styleStr}>${content.text}</span>`;
    }).join('');
    
    return `<div  style=""><p  style="">${htmlSpans}</p></div>`;
  }
  
  private getDefaultFontName(): string {
    // Get font from first content item or use default
    return this.content[0]?.style?.fontFamily || "Microsoft Yahei";
  }
  
  private getDefaultColor(): { color: string; colorType: string } {
    return {
      color: "#333333",
      colorType: "dk1"
    };
  }
  
  private isThemeColor(color: string): boolean {
    // Simple check for common theme colors
    const themeColors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'];
    return themeColors.includes(color.toUpperCase());
  }
  
  private getColorType(color: string): string {
    // Map colors to theme types
    const colorMap: { [key: string]: string } = {
      '#4472C4': 'accent1',
      '#5B9BD5': 'accent1',
      '#333333': 'dk1',
      '#000000': 'dk1'
    };
    return colorMap[color.toUpperCase()] || 'dk1';
  }
}

export interface TextContent {
  text: string;
  style?: TextRunStyle;
}

export interface TextStyle {
  align?: 'left' | 'center' | 'right' | 'justify';
  valign?: 'top' | 'middle' | 'bottom';
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
}

export interface BulletStyle {
  type: 'bullet' | 'number' | 'custom';
  char?: string;
  color?: string;
  size?: number;
  font?: string;
  startNumber?: number;
}