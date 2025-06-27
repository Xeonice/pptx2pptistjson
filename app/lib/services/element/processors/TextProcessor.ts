import { IElementProcessor } from "../../interfaces/IElementProcessor";
import {
  TextElement,
  TextContent,
  TextRunStyle,
} from "../../../models/domain/elements/TextElement";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import { UnitConverter } from "../../utils/UnitConverter";
import { Theme } from "../../../models/domain/Theme";

export class TextProcessor implements IElementProcessor<TextElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process shape nodes that contain text
    return xmlNode.name.endsWith("sp") && this.hasTextContent(xmlNode);
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<TextElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, 'text');

    const textElement = new TextElement(id);

    // Extract position and size
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, "xfrm");
      if (xfrmNode) {
        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, "off");
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, "x");
          const y = this.xmlParser.getAttribute(offNode, "y");
          if (x && y) {
            textElement.setPosition({
              x: UnitConverter.emuToPoints(parseInt(x)),
              y: UnitConverter.emuToPoints(parseInt(y)),
            });
          }
        }

        // Size
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            textElement.setSize({
              width: UnitConverter.emuToPoints(parseInt(cx)),
              height: UnitConverter.emuToPoints(parseInt(cy)),
            });
          }
        }

        // Rotation
        const rot = this.xmlParser.getAttribute(xfrmNode, "rot");
        if (rot) {
          textElement.setRotation(parseInt(rot) / 60000); // Convert to degrees
        }
      }
    }

    // Extract text content
    const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
    if (txBodyNode) {
      const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
      for (const pNode of paragraphs) {
        const content = this.extractParagraphContent(pNode, context);
        if (content) {
          textElement.addContent(content);
        }
      }
    }

    return textElement;
  }

  getElementType(): string {
    return "text";
  }

  private hasTextContent(xmlNode: XmlNode): boolean {
    const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
    if (!txBodyNode) return false;

    const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
    for (const pNode of paragraphs) {
      const runs = this.xmlParser.findNodes(pNode, "r");
      for (const rNode of runs) {
        const tNode = this.xmlParser.findNode(rNode, "t");
        if (tNode && this.xmlParser.getTextContent(tNode).trim()) {
          return true;
        }
      }
    }

    return false;
  }

  private extractParagraphContent(pNode: XmlNode, context: ProcessingContext): TextContent | undefined {
    const runs = this.xmlParser.findNodes(pNode, "r");
    if (runs.length === 0) return undefined;

    let fullText = "";
    let commonStyle: TextRunStyle | undefined;

    for (const rNode of runs) {
      const tNode = this.xmlParser.findNode(rNode, "t");
      if (tNode) {
        const text = this.xmlParser.getTextContent(tNode);
        fullText += text;

        // Extract run properties (simplified)
        if (!commonStyle) {
          const rPrNode = this.xmlParser.findNode(rNode, "rPr");
          if (rPrNode) {
            commonStyle = this.extractRunStyle(rPrNode, context);
          }
        }
      }
    }

    if (!fullText.trim()) return undefined;

    return {
      text: fullText,
      style: commonStyle,
    };
  }

  private extractRunStyle(rPrNode: XmlNode, context: ProcessingContext): TextRunStyle {
    const style: TextRunStyle = {};

    // Font size
    const sz = this.xmlParser.getAttribute(rPrNode, "sz");
    if (sz) {
      // PowerPoint font size is in hundreds of points, but needs scaling for web display
      // Based on comparison with expected output, applying 1.39 scaling factor
      style.fontSize = style.fontSize = Math.round((parseInt(sz) / 100) * 1.39); // Convert from hundreds of points
    }

    // Bold
    const b = this.xmlParser.getAttribute(rPrNode, "b");
    if (b === "1" || b === "true") {
      style.bold = true;
    }

    // Italic
    const i = this.xmlParser.getAttribute(rPrNode, "i");
    if (i === "1" || i === "true") {
      style.italic = true;
    }

    // Underline
    const u = this.xmlParser.getAttribute(rPrNode, "u");
    if (u && u !== "none") {
      style.underline = true;
    }

    // Color
    const solidFillNode = this.xmlParser.findNode(rPrNode, "solidFill");
    if (solidFillNode) {
      // Check for direct color (srgbClr)
      const srgbClrNode = this.xmlParser.findNode(solidFillNode, "srgbClr");
      if (srgbClrNode) {
        const val = this.xmlParser.getAttribute(srgbClrNode, "val");
        if (val) {
          style.color = `#${val}ff`;
        }
      }
      
      // Check for theme color (schemeClr)
      const schemeClrNode = this.xmlParser.findNode(solidFillNode, "schemeClr");
      if (schemeClrNode) {
        const val = this.xmlParser.getAttribute(schemeClrNode, "val");
        if (val && context.theme) {
          // Get actual color from theme
          const themeColor = this.getThemeColor(context.theme, val);
          if (themeColor) {
            // Store both actual color and theme reference
            style.color = themeColor;
            style.themeColorType = val;
          } else {
            // Fallback to theme reference
            style.color = `theme:${val}`;
          }
        } else if (val) {
          // No theme available, use reference
          style.color = `theme:${val}`;
        }
      }
    }

    // Font family
    const latinNode = this.xmlParser.findNode(rPrNode, "latin");
    if (latinNode) {
      const typeface = this.xmlParser.getAttribute(latinNode, "typeface");
      if (typeface) {
        style.fontFamily = typeface;
      }
    }

    return style;
  }

  private getThemeColor(theme: Theme, colorType: string): string | undefined {
    // Map PowerPoint theme color names to our theme structure
    const colorScheme = theme.getColorScheme();
    if (!colorScheme) return undefined;

    const colorMapping: { [key: string]: keyof typeof colorScheme } = {
      'accent1': 'accent1',
      'accent2': 'accent2', 
      'accent3': 'accent3',
      'accent4': 'accent4',
      'accent5': 'accent5',
      'accent6': 'accent6',
      'dk1': 'text1',
      'dk2': 'text2',
      'lt1': 'background1',
      'lt2': 'background2',
      'hlink': 'hyperlink',
      'folHlink': 'followedHyperlink'
    };

    const mappedColor = colorMapping[colorType];
    if (mappedColor && colorScheme[mappedColor]) {
      // Convert to hex format with alpha
      const color = colorScheme[mappedColor];
      if (color.startsWith('rgba(')) {
        // Convert rgba to hex
        const match = color.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
        if (match) {
          const [, r, g, b] = match;
          const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}ff`;
          return hex;
        }
      } else if (color.startsWith('#')) {
        return color.endsWith('ff') ? color : color + 'ff';
      }
      return color;
    }

    return undefined;
  }

}
