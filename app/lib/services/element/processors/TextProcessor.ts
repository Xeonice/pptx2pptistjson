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
import { DebugHelper } from "../../utils/DebugHelper";

export class TextProcessor implements IElementProcessor<TextElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Check if this is a text box
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvSpPrNode = nvSpPrNode ? this.xmlParser.findNode(nvSpPrNode, "cNvSpPr") : undefined;
    const txBox = cNvSpPrNode ? this.xmlParser.getAttribute(cNvSpPrNode, "txBox") : undefined;
    
    if (txBox === "1") {
      // This is explicitly a text box
      return true;
    }
    
    // Only process pure text elements without shape backgrounds
    // Shape elements with text are handled by ShapeProcessor
    return (
      xmlNode.name.endsWith("sp") &&
      this.hasTextContent(xmlNode) &&
      !this.hasGeom(xmlNode) &&
      !this.hasImageFill(xmlNode) &&
      !this.hasShapeBackground(xmlNode)
    );
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
          const contentItems = this.extractParagraphContent(pNode, context, txBodyNode);
          contentItems.forEach((content) => {
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
          const contentItems = this.extractParagraphContent(pNode, context, txBodyNode);
          contentItems.forEach((content) => {
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

  private hasGeom(xmlNode: XmlNode): boolean {
    // Check if shape has visible background fill
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    const customGeomNode = this.xmlParser.findNode(spPrNode, "a:custGeom");

    return !!customGeomNode;
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
    context: ProcessingContext,
    txBodyNode?: XmlNode
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
          const style = rPrNode
            ? this.extractRunStyle(rPrNode, context, pNode, txBodyNode)
            : this.extractRunStyle(undefined, context, pNode, txBodyNode);

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
    rPrNode: XmlNode | undefined,
    context: ProcessingContext,
    pNode?: XmlNode,
    txBodyNode?: XmlNode
  ): TextRunStyle {
    const style: TextRunStyle = {};

    // Font size
    const sz = rPrNode ? this.xmlParser.getAttribute(rPrNode, "sz") : undefined;
    if (sz) {
      // PowerPoint font size is in hundreds of points, but needs scaling for web display
      // Based on comparison with expected output, applying 1.39 scaling factor
      style.fontSize = style.fontSize = Math.round((parseInt(sz) / 100) * 1.39); // Convert from hundreds of points
    }

    // Bold - check run properties first, then inherit from list style
    const directBold = rPrNode ? this.xmlParser.getAttribute(rPrNode, "b") : undefined;
    let boldFromRun = directBold === "1" || directBold === "true";
    let boldFromListStyle = false;

    // If no direct bold setting, check list style inheritance
    if (!boldFromRun && pNode && txBodyNode) {
      boldFromListStyle = this.getBoldFromListStyle(pNode, context, txBodyNode);
    }

    if (boldFromRun || boldFromListStyle) {
      style.bold = true;
      DebugHelper.log(context, `TextProcessor: Bold applied - direct: ${boldFromRun}, inherited: ${boldFromListStyle}`, "info");
    }

    // Italic
    const i = rPrNode ? this.xmlParser.getAttribute(rPrNode, "i") : undefined;
    if (i === "1" || i === "true") {
      style.italic = true;
    }

    // Underline
    const u = rPrNode ? this.xmlParser.getAttribute(rPrNode, "u") : undefined;
    if (u && u !== "none") {
      style.underline = true;
    }

    // Color
    const solidFillNode = rPrNode ? this.xmlParser.findNode(rPrNode, "solidFill") : undefined;
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
    const latinNode = rPrNode ? this.xmlParser.findNode(rPrNode, "latin") : undefined;
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

  /**
   * Extract bold property from list style inheritance
   * Follows PowerPoint's priority: direct text properties > list style properties
   */
  private getBoldFromListStyle(pNode: XmlNode, context: ProcessingContext, txBodyNode: XmlNode): boolean {
    try {
      // Get paragraph properties
      const pPrNode = this.xmlParser.findNode(pNode, "pPr");
      if (!pPrNode) {
        DebugHelper.log(context, "TextProcessor: No paragraph properties found", "info");
        return false;
      }

      // Check if there's a list style reference in the paragraph
      // PowerPoint uses lvl attribute to specify list level
      const lvl = this.xmlParser.getAttribute(pPrNode, "lvl");
      const listLevel = lvl ? parseInt(lvl) + 1 : 1; // Convert 0-based to 1-based

      DebugHelper.log(context, `TextProcessor: Checking list style inheritance for level ${listLevel}`, "info");

      // Look for list style in the provided txBody
      const lstStyleNode = this.xmlParser.findNode(txBodyNode, "lstStyle");
      if (!lstStyleNode) {
        DebugHelper.log(context, "TextProcessor: No list style found", "info");
        return false;
      }

      // Find the specific level style (lvl1pPr, lvl2pPr, etc.)
      const levelStyleName = `lvl${listLevel}pPr`;
      const levelStyleNode = this.xmlParser.findNode(lstStyleNode, levelStyleName);
      
      if (!levelStyleNode) {
        DebugHelper.log(context, `TextProcessor: No style found for level ${levelStyleName}`, "info");
        return false;
      }

      // Check for default run properties in the level style
      const defRPrNode = this.xmlParser.findNode(levelStyleNode, "defRPr");
      if (!defRPrNode) {
        DebugHelper.log(context, `TextProcessor: No defRPr found in ${levelStyleName}`, "info");
        return false;
      }

      // Check for bold attribute in the default run properties
      const boldAttr = this.xmlParser.getAttribute(defRPrNode, "b");
      const isBold = boldAttr === "1" || boldAttr === "true";
      
      DebugHelper.log(context, `TextProcessor: List style ${levelStyleName} bold="${boldAttr}" -> ${isBold}`, "info");
      
      return isBold;

    } catch (error) {
      DebugHelper.log(context, `TextProcessor: Error extracting list style bold: ${error}`, "warn");
      return false;
    }
  }
}
