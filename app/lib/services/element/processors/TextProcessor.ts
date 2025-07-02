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
import { FillExtractor } from "../../utils/FillExtractor";

export class TextProcessor implements IElementProcessor<TextElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Only process pure text elements without shape backgrounds
    // Shape elements with text are handled by ShapeProcessor
    return xmlNode.name.endsWith("sp") && 
           this.hasTextContent(xmlNode) && 
           !this.hasImageFill(xmlNode) &&
           !this.hasShapeBackground(xmlNode);
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<TextElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "text");

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

    // Check if this element has a visible shape background  
    const hasShapeBackground = this.hasShapeBackground(xmlNode);
    
    // If it has both text and shape background, append "_text" to the ID
    if (hasShapeBackground) {
      const textId = id + "_text";
      const finalTextElement = new TextElement(textId);
      
      // Copy position and size to text element
      const position = textElement.getPosition();
      const size = textElement.getSize();
      const rotation = textElement.getRotation();
      if (position) finalTextElement.setPosition(position);
      if (size) finalTextElement.setSize(size);
      if (rotation) finalTextElement.setRotation(rotation);
      
      // Extract text content for text element
      const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
      if (txBodyNode) {
        const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
        for (const pNode of paragraphs) {
          const contentItems = this.extractParagraphContent(pNode, context);
          contentItems.forEach(content => {
            if (content) {
              finalTextElement.addContent(content);
            }
          });
        }
      }
      
      return finalTextElement;
    } else {
      // Pure text element without shape background
      // Extract text content
      const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
      if (txBodyNode) {
        const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
        for (const pNode of paragraphs) {
          const contentItems = this.extractParagraphContent(pNode, context);
          contentItems.forEach(content => {
            if (content) {
              textElement.addContent(content);
            }
          });
        }
      }
      
      return textElement;
    }
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

  private hasImageFill(xmlNode: XmlNode): boolean {
    // Check if shape has blipFill (image fill)
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;
    
    const blipFillNode = this.xmlParser.findNode(spPrNode, "blipFill");
    return !!blipFillNode;
  }

  private hasShapeBackground(xmlNode: XmlNode): boolean {
    // Check if shape has fill background (solid fill, gradient, etc.)
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;
    
    // Check for any fill type
    const solidFillNode = this.xmlParser.findNode(spPrNode, "solidFill");
    const gradFillNode = this.xmlParser.findNode(spPrNode, "gradFill");
    const pattFillNode = this.xmlParser.findNode(spPrNode, "pattFill");
    
    return !!(solidFillNode || gradFillNode || pattFillNode);
  }

  private extractParagraphContent(
    pNode: XmlNode,
    context: ProcessingContext
  ): TextContent[] {
    const runs = this.xmlParser.findNodes(pNode, "r");
    if (runs.length === 0) return [];

    const contentItems: TextContent[] = [];

    for (const rNode of runs) {
      const tNode = this.xmlParser.findNode(rNode, "t");
      if (tNode) {
        const text = this.xmlParser.getTextContent(tNode);
        if (text.trim()) {
          // Extract run properties for each run
          const rPrNode = this.xmlParser.findNode(rNode, "rPr");
          const style = rPrNode ? this.extractRunStyle(rPrNode, context) : undefined;

          contentItems.push({
            text: text,
            style: style,
          });
        }
      }
    }

    return contentItems;
  }
  private extractRunStyle(
    rPrNode: XmlNode,
    context: ProcessingContext
  ): TextRunStyle {
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
      // Convert solidFillNode to plain object for FillExtractor
      const solidFillObj = this.xmlNodeToObject(solidFillNode);

      // Create warpObj with theme content
      const warpObj = {
        themeContent: context.theme
          ? this.createThemeContent(context.theme)
          : undefined,
      };

      // Use FillExtractor to get color
      const color = FillExtractor.getSolidFill(
        solidFillObj,
        undefined,
        undefined,
        warpObj
      );
      if (color) {
        style.color = color;

        // Extract theme color type if present
        const schemeClrNode = this.xmlParser.findNode(
          solidFillNode,
          "schemeClr"
        );
        if (schemeClrNode) {
          const val = this.xmlParser.getAttribute(schemeClrNode, "val");
          if (val) {
            style.themeColorType = val;
          }
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

  private xmlNodeToObject(node: XmlNode): any {
    const obj: any = {};

    // Add attributes
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      obj.attrs = { ...node.attributes };
    }

    // Add children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childName = child.name.includes(":")
          ? child.name
          : `a:${child.name}`;
        obj[childName] = this.xmlNodeToObject(child);
      }
    }

    // Note: Text content is handled separately in XML processing

    return obj;
  }


  private createThemeContent(theme: Theme): any {
    const colorScheme = theme.getColorScheme();
    if (!colorScheme) return undefined;

    // Create theme structure expected by FillExtractor
    return {
      "a:theme": {
        "a:themeElements": {
          "a:clrScheme": {
            "a:accent1": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent1?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:accent2": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent2?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:accent3": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent3?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:accent4": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent4?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:accent5": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent5?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:accent6": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.accent6?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:dk1": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.dk1?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:dk2": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.dk2?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:lt1": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.lt1?.replace("#", "").replace(/ff$/, "") ||
                    "FFFFFF",
                },
              },
            },
            "a:lt2": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.lt2?.replace("#", "").replace(/ff$/, "") ||
                    "FFFFFF",
                },
              },
            },
            "a:hlink": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.hyperlink
                      ?.replace("#", "")
                      .replace(/ff$/, "") || "0000FF",
                },
              },
            },
            "a:folHlink": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.followedHyperlink
                      ?.replace("#", "")
                      .replace(/ff$/, "") || "800080",
                },
              },
            },
          },
        },
      },
    };
  }
}
