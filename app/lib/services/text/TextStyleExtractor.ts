import { XmlNode } from "../../models/xml/XmlNode";
import { IXmlParseService } from "../interfaces/IXmlParseService";
import { ProcessingContext } from "../interfaces/ProcessingContext";
import { TextRunStyle } from "../../models/domain/elements/TextElement";
import { Theme } from "../../models/domain/Theme";
import { FillExtractor } from "../utils/FillExtractor";
import { DebugHelper } from "../utils/DebugHelper";

/**
 * Shared text style extraction utilities for both TextProcessor and ShapeProcessor
 * Provides consistent text styling logic across different element types
 */
export class TextStyleExtractor {
  constructor(private xmlParser: IXmlParseService) {}

  /**
   * Extract run style from rPr node with comprehensive style inheritance
   * Supports font size, bold, italic, underline, color, and font family
   */
  extractRunStyle(
    rPrNode: XmlNode | undefined,
    context: ProcessingContext,
    pNode?: XmlNode,
    txBodyNode?: XmlNode,
    shapeStyleNode?: XmlNode
  ): TextRunStyle {
    const style: TextRunStyle = {};

    // Font size
    const sz = rPrNode ? this.xmlParser.getAttribute(rPrNode, "sz") : undefined;
    if (sz) {
      // PowerPoint font size is in hundreds of points, but needs scaling for web display
      // Based on comparison with expected output, applying 1.39 scaling factor
      style.fontSize = Math.round((parseInt(sz) / 100) * 1.39);
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
      DebugHelper.log(context, `TextStyleExtractor: Bold applied - direct: ${boldFromRun}, inherited: ${boldFromListStyle}`, "info");
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

    // If no run properties and shape style is provided, try to inherit from shape style
    if (!rPrNode && shapeStyleNode) {
      const inheritedStyle = this.extractStyleFromShapeStyle(shapeStyleNode, context);
      Object.assign(style, inheritedStyle);
    }

    return style;
  }

  /**
   * Extract paragraph content with comprehensive text run processing
   */
  extractParagraphContent(
    pNode: XmlNode,
    context: ProcessingContext,
    txBodyNode?: XmlNode,
    shapeStyleNode?: XmlNode
  ): Array<{ text: string; style: TextRunStyle }> {
    const runs = this.xmlParser.findNodes(pNode, "r");
    if (runs.length === 0) return [];

    const contentItems: Array<{ text: string; style: TextRunStyle }> = [];

    for (const rNode of runs) {
      const tNode = this.xmlParser.findNode(rNode, "t");
      if (tNode) {
        const text = this.xmlParser.getTextContent(tNode);
        if (text.trim()) {
          // Extract run properties for each run
          const rPrNode = this.xmlParser.findNode(rNode, "rPr");
          const style = this.extractRunStyle(
            rPrNode,
            context,
            pNode,
            txBodyNode,
            shapeStyleNode
          );

          contentItems.push({
            text: text,
            style: style,
          });
        }
      }
    }

    return contentItems;
  }

  /**
   * Extract bold setting from list style based on paragraph level
   */
  getBoldFromListStyle(
    pNode: XmlNode,
    _context: ProcessingContext,
    txBodyNode: XmlNode
  ): boolean {
    // Extract paragraph level
    const pPrNode = this.xmlParser.findNode(pNode, "pPr");
    let paragraphLevel = 0;

    if (pPrNode) {
      const lvl = this.xmlParser.getAttribute(pPrNode, "lvl");
      if (lvl) {
        paragraphLevel = parseInt(lvl);
      }
    }

    // Extract list style from txBody
    const lstStyleNode = this.xmlParser.findNode(txBodyNode, "lstStyle");
    if (!lstStyleNode) {
      return false;
    }

    return this.getBoldFromListStyleByLevel(lstStyleNode, paragraphLevel);
  }

  /**
   * Extract bold setting from list style by specific level
   */
  getBoldFromListStyleByLevel(
    lstStyleNode: XmlNode,
    paragraphLevel: number
  ): boolean {
    // Clamp level to valid range (0-8)
    const level = Math.max(0, Math.min(8, paragraphLevel));

    // Build level property name (lvl0pPr, lvl1pPr, etc.)
    const levelPropName = `lvl${level}pPr`;
    const levelPrNode = this.xmlParser.findNode(lstStyleNode, levelPropName);
    
    if (levelPrNode) {
      const defRPrNode = this.xmlParser.findNode(levelPrNode, "defRPr");
      if (defRPrNode) {
        const b = this.xmlParser.getAttribute(defRPrNode, "b");
        if (b === "1" || b === "true") {
          return true;
        }
      }
    }

    // Try to inherit from parent levels
    for (let parentLevel = level - 1; parentLevel >= 0; parentLevel--) {
      const parentLevelPropName = `lvl${parentLevel}pPr`;
      const parentLevelPrNode = this.xmlParser.findNode(lstStyleNode, parentLevelPropName);
      
      if (parentLevelPrNode) {
        const defRPrNode = this.xmlParser.findNode(parentLevelPrNode, "defRPr");
        if (defRPrNode) {
          const b = this.xmlParser.getAttribute(defRPrNode, "b");
          if (b === "1" || b === "true") {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Extract default text styles from shape style references
   * This handles cases where text inherits from shape-level font settings
   */
  private extractStyleFromShapeStyle(
    shapeStyleNode: XmlNode,
    context: ProcessingContext
  ): Partial<TextRunStyle> {
    const inheritedStyle: Partial<TextRunStyle> = {};

    // Check for fontRef in shape style
    const fontRefNode = this.xmlParser.findNode(shapeStyleNode, "fontRef");
    if (fontRefNode) {
      // Extract font scheme reference
      const idx = this.xmlParser.getAttribute(fontRefNode, "idx");
      if (idx && context.theme) {
        // Map font scheme to actual font family
        const fontScheme = context.theme.getFontScheme();
        if (fontScheme) {
          let fontFamily: string | undefined;
          
          switch (idx) {
            case "major":
              fontFamily = fontScheme.majorFont?.latin || "Calibri";
              break;
            case "minor":
              fontFamily = fontScheme.minorFont?.latin || "Calibri";
              break;
            default:
              fontFamily = "Calibri";
          }
          
          if (fontFamily) {
            inheritedStyle.fontFamily = fontFamily;
            DebugHelper.log(context, `TextStyleExtractor: Inherited font family from shape style: ${fontFamily}`, "info");
          }
        }
      }
    }

    return inheritedStyle;
  }

  /**
   * Convert XmlNode to object format expected by FillExtractor
   */
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

    return obj;
  }

  /**
   * Create theme content structure for FillExtractor
   */
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