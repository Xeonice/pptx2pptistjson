import { XmlNode } from "../../models/xml/XmlNode";
import { IXmlParseService } from "../interfaces/IXmlParseService";
import { ProcessingContext } from "../interfaces/ProcessingContext";
import { TextRunStyle } from "../../models/domain/elements/TextElement";
import { Theme } from "../../models/domain/Theme";
import { FillExtractor } from "../utils/FillExtractor";
import { DebugHelper } from "../utils/DebugHelper";
import { FontSizeCalculator } from "../utils/FontSizeCalculator";

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

    // Get list style inheritance first if available
    let listStyleDefRPr: XmlNode | undefined;
    if (pNode && txBodyNode) {
      listStyleDefRPr = this.getListStyleDefRPr(pNode, txBodyNode);
    }

    // Font size - check run properties first, then list style inheritance
    const sz = rPrNode ? this.xmlParser.getAttribute(rPrNode, "sz") : undefined;
    if (sz) {
      // PowerPoint font size is in hundreds of points, but needs scaling for web display
      // Using FontSizeCalculator for precise decimal calculations
      style.fontSize = FontSizeCalculator.convertPowerPointToWebSize(sz);
    } else if (listStyleDefRPr) {
      // Inherit font size from list style
      const listSz = this.xmlParser.getAttribute(listStyleDefRPr, "sz");
      if (listSz) {
        style.fontSize = FontSizeCalculator.convertPowerPointToWebSize(listSz);
        DebugHelper.log(
          context,
          `TextStyleExtractor: Font size inherited from list style: ${style.fontSize}`,
          "info"
        );
      }
    }

    // Bold - check run properties first, then inherit from list style
    const directBold = rPrNode
      ? this.xmlParser.getAttribute(rPrNode, "b")
      : undefined;
    let boldFromRun = directBold === "1" || directBold === "true";
    let boldFromListStyle = false;

    // If no direct bold setting, check list style inheritance
    if (!boldFromRun && listStyleDefRPr) {
      const listBold = this.xmlParser.getAttribute(listStyleDefRPr, "b");
      boldFromListStyle = listBold === "1" || listBold === "true";
    }

    if (boldFromRun || boldFromListStyle) {
      style.bold = true;
      DebugHelper.log(
        context,
        `TextStyleExtractor: Bold applied - direct: ${boldFromRun}, inherited: ${boldFromListStyle}`,
        "info"
      );
    }

    // Italic - check run properties first, then inherit from list style
    const directItalic = rPrNode
      ? this.xmlParser.getAttribute(rPrNode, "i")
      : undefined;
    let italicFromRun = directItalic === "1" || directItalic === "true";
    let italicFromListStyle = false;

    if (!italicFromRun && listStyleDefRPr) {
      const listItalic = this.xmlParser.getAttribute(listStyleDefRPr, "i");
      italicFromListStyle = listItalic === "1" || listItalic === "true";
    }

    if (italicFromRun || italicFromListStyle) {
      style.italic = true;
      if (italicFromListStyle) {
        DebugHelper.log(
          context,
          `TextStyleExtractor: Italic inherited from list style`,
          "info"
        );
      }
    }

    // Underline - check run properties first, then inherit from list style
    const directUnderline = rPrNode
      ? this.xmlParser.getAttribute(rPrNode, "u")
      : undefined;
    let underlineFromRun = !!(directUnderline && directUnderline !== "none");
    let underlineFromListStyle = false;

    if (!underlineFromRun && listStyleDefRPr) {
      const listUnderline = this.xmlParser.getAttribute(listStyleDefRPr, "u");
      underlineFromListStyle = !!(listUnderline && listUnderline !== "none");
    }

    if (underlineFromRun || underlineFromListStyle) {
      style.underline = true;
      if (underlineFromListStyle) {
        DebugHelper.log(
          context,
          `TextStyleExtractor: Underline inherited from list style`,
          "info"
        );
      }
    }

    // Color - check run properties first, then inherit from list style
    const solidFillNode = rPrNode
      ? this.xmlParser.findNode(rPrNode, "solidFill")
      : undefined;
    if (solidFillNode) {
      const colorResult = this.extractColorFromSolidFill(
        solidFillNode,
        context
      );
      if (colorResult) {
        style.color = colorResult.color;
        if (colorResult.themeColorType) {
          style.themeColorType = colorResult.themeColorType;
        }
      }
    } else if (listStyleDefRPr) {
      // Inherit color from list style
      const listSolidFillNode = this.xmlParser.findNode(
        listStyleDefRPr,
        "solidFill"
      );
      if (listSolidFillNode) {
        const colorResult = this.extractColorFromSolidFill(
          listSolidFillNode,
          context
        );
        if (colorResult) {
          style.color = colorResult.color;
          if (colorResult.themeColorType) {
            style.themeColorType = colorResult.themeColorType;
          }
          DebugHelper.log(
            context,
            `TextStyleExtractor: Color inherited from list style: ${style.color}`,
            "info"
          );
        }
      }
    }

    // Font family - check run properties first, then inherit from list style
    const latinNode = rPrNode
      ? this.xmlParser.findNode(rPrNode, "latin")
      : undefined;
    if (latinNode) {
      const typeface = this.xmlParser.getAttribute(latinNode, "typeface");
      if (typeface) {
        style.fontFamily = typeface;
      }
    } else if (listStyleDefRPr) {
      // Inherit font family from list style
      const listLatinNode = this.xmlParser.findNode(listStyleDefRPr, "latin");
      if (listLatinNode) {
        const listTypeface = this.xmlParser.getAttribute(
          listLatinNode,
          "typeface"
        );
        if (listTypeface) {
          style.fontFamily = listTypeface;
          DebugHelper.log(
            context,
            `TextStyleExtractor: Font family inherited from list style: ${style.fontFamily}`,
            "info"
          );
        }
      }
    }

    // If no run properties and shape style is provided, try to inherit from shape style
    if (!rPrNode && shapeStyleNode) {
      const inheritedStyle = this.extractStyleFromShapeStyle(
        shapeStyleNode,
        context
      );
      Object.assign(style, inheritedStyle);
    }

    return style;
  }

  /**
   * Extract text content from multiple paragraphs grouped by paragraph
   * Returns array of paragraph content arrays for proper HTML p tag generation
   * Also extracts the line height from the first paragraph for the TextElement
   */
  extractTextContentByParagraphs(
    txBodyNode: XmlNode,
    context: ProcessingContext,
    shapeStyleNode?: XmlNode
  ): {
    paragraphs: Array<Array<{ text: string; style: TextRunStyle }>>;
    lineHeight?: number;
  } {
    const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
    const allParagraphs: Array<Array<{ text: string; style: TextRunStyle }>> =
      [];
    let documentLineHeight: number | undefined;

    for (const pNode of paragraphs) {
      // Extract line height from the first paragraph for the entire TextElement
      if (!documentLineHeight) {
        const extractedLineHeight = this.extractLineHeight(pNode);
        // Only set if it's not the default value
        if (Math.abs(extractedLineHeight - 1.15) > 0.01) {
          documentLineHeight = extractedLineHeight;
        }
      }

      // Extract content for each paragraph (without individual line heights)
      const paragraphContent = this.extractParagraphContentWithoutLineHeight(
        pNode,
        context,
        txBodyNode,
        shapeStyleNode
      );

      // Only add non-empty paragraphs
      if (paragraphContent.length > 0) {
        allParagraphs.push(paragraphContent);
      }
    }

    return {
      paragraphs: allParagraphs,
      lineHeight: documentLineHeight,
    };
  }

  /**
   * Extract text content from multiple paragraphs (legacy method for compatibility)
   * @deprecated Use extractTextContentByParagraphs for better paragraph structure
   */
  extractTextContent(
    txBodyNode: XmlNode,
    context: ProcessingContext,
    shapeStyleNode?: XmlNode
  ): Array<{ text: string; style: TextRunStyle }> {
    const result = this.extractTextContentByParagraphs(
      txBodyNode,
      context,
      shapeStyleNode
    );
    const paragraphGroups = result.paragraphs;

    // Flatten paragraphs into a single array (legacy behavior)
    const allTextContent: Array<{ text: string; style: TextRunStyle }> = [];

    for (let i = 0; i < paragraphGroups.length; i++) {
      const paragraphContent = paragraphGroups[i];
      allTextContent.push(...paragraphContent);

      // Add line break between paragraphs (except for the last one)
      if (i < paragraphGroups.length - 1) {
        allTextContent.push({
          text: "\n",
          style: {},
        });
      }
    }

    return allTextContent;
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
    const contentItems: Array<{ text: string; style: TextRunStyle }> = [];

    // Extract paragraph-level line spacing
    const paragraphLineHeight = this.extractLineHeight(pNode);

    // Process all text runs
    for (const rNode of runs) {
      const tNode = this.xmlParser.findNode(rNode, "t");
      if (tNode) {
        const text = this.xmlParser.getTextContent(tNode);
        // Include all text content, including empty strings from valid text nodes
        // PowerPoint preserves spaces and they can be significant for formatting
        if (text !== undefined && text !== null) {
          // Extract run properties for each run
          const rPrNode = this.xmlParser.findNode(rNode, "rPr");
          const style = this.extractRunStyle(
            rPrNode,
            context,
            pNode,
            txBodyNode,
            shapeStyleNode
          );

          // Add line height to the style (always available now with default 1.0)
          style.lineHeight = paragraphLineHeight;

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
   * Extract paragraph content without line height (for use with TextElement-level line height)
   */
  extractParagraphContentWithoutLineHeight(
    pNode: XmlNode,
    context: ProcessingContext,
    txBodyNode?: XmlNode,
    shapeStyleNode?: XmlNode
  ): Array<{ text: string; style: TextRunStyle }> {
    const runs = this.xmlParser.findNodes(pNode, "r");
    const contentItems: Array<{ text: string; style: TextRunStyle }> = [];

    // Process all text runs without paragraph-level line spacing
    for (const rNode of runs) {
      const tNode = this.xmlParser.findNode(rNode, "t");
      if (tNode) {
        const text = this.xmlParser.getTextContent(tNode);
        // Include all text content, including empty strings from valid text nodes
        // PowerPoint preserves spaces and they can be significant for formatting
        if (text !== undefined && text !== null) {
          // Extract run properties for each run
          const rPrNode = this.xmlParser.findNode(rNode, "rPr");
          const style = this.extractRunStyle(
            rPrNode,
            context,
            pNode,
            txBodyNode,
            shapeStyleNode
          );

          // Do not add line height to individual runs - it will be set on TextElement level

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
   * Extract line height from paragraph properties
   * Handles PowerPoint's line spacing rules according to XML specification:
   * - spcPct: percentage spacing (val / 1000 = %)
   * - spcPts: fixed point spacing (val / 100 = pt)
   * Returns 1.15 as PowerPoint's default if no line spacing is specified
   */
  extractLineHeight(pNode: XmlNode): number {
    const pPrNode = this.xmlParser.findNode(pNode, "pPr");
    if (!pPrNode) return 1.15; // PowerPoint默认行高为115%

    const lnSpcNode = this.xmlParser.findNode(pPrNode, "lnSpc");
    if (!lnSpcNode) return 1.15;

    // 1. 优先处理百分比行间距 (spcPct) - 最常用
    const spcPctNode = this.xmlParser.findNode(lnSpcNode, "spcPct");
    if (spcPctNode) {
      const val = this.xmlParser.getAttribute(spcPctNode, "val");
      if (val) {
        // PowerPoint规则：val值 ÷ 1000 = 百分比
        // 例如：val="150000" → 150% → 1.5
        const parsedVal = parseInt(val);
        if (!isNaN(parsedVal)) {
          const percentage = parsedVal / 1000;
          return percentage / 100; // 转换为小数，150% → 1.5
        }
      }
    }

    // 2. 处理固定点数行间距 (spcPts)
    const spcPtsNode = this.xmlParser.findNode(lnSpcNode, "spcPts");
    if (spcPtsNode) {
      const val = this.xmlParser.getAttribute(spcPtsNode, "val");
      if (val) {
        // PowerPoint规则：val值 ÷ 100 = 点数
        // 例如：val="2400" → 24pt
        const parsedVal = parseInt(val);
        if (!isNaN(parsedVal)) {
          const points = parsedVal / 100;
          // 固定点数转换为相对行高：基于12pt字体计算
          // 这是近似值，实际转换依赖字体大小
          return points / 12;
        }
      }
    }

    // 3. 检查最小行间距 (spcAft, spcBef) - 段前段后间距
    // 这些通常不影响行高，但可以记录用于调试
    const spcAfterNode = this.xmlParser.findNode(lnSpcNode, "spcAft");
    const spcBeforeNode = this.xmlParser.findNode(lnSpcNode, "spcBef");

    if (spcAfterNode || spcBeforeNode) {
      // 如果只有段前段后间距，使用默认行高
      return 1.15;
    }

    // 默认返回PowerPoint标准行高115%
    return 1.15;
  }

  /**
   * Get defRPr node from list style for current paragraph level
   * This is used for comprehensive style inheritance from list styles
   */
  getListStyleDefRPr(pNode: XmlNode, txBodyNode: XmlNode): XmlNode | undefined {
    // Extract paragraph level
    const pPrNode = this.xmlParser.findNode(pNode, "pPr");
    let paragraphLevel = 0;

    if (pPrNode) {
      const lvl = this.xmlParser.getAttribute(pPrNode, "lvl");
      if (lvl) {
        paragraphLevel = parseInt(lvl === "0" ? "1" : lvl);
      }
    }

    // Extract list style from txBody
    const lstStyleNode = this.xmlParser.findNode(txBodyNode, "lstStyle");
    if (!lstStyleNode) {
      return undefined;
    }

    // Clamp level to valid range (1-8)
    const level = Math.max(1, Math.min(8, paragraphLevel));

    // Build level property name (lvl0pPr, lvl1pPr, etc.)
    const levelPropName = `lvl${level}pPr`;
    const levelPrNode = this.xmlParser.findNode(lstStyleNode, levelPropName);

    if (levelPrNode) {
      const defRPrNode = this.xmlParser.findNode(levelPrNode, "defRPr");
      if (defRPrNode) {
        return defRPrNode;
      }
    }

    // Try to inherit from parent levels
    for (let parentLevel = level - 1; parentLevel >= 0; parentLevel--) {
      const parentLevelPropName = `lvl${parentLevel}pPr`;
      const parentLevelPrNode = this.xmlParser.findNode(
        lstStyleNode,
        parentLevelPropName
      );

      if (parentLevelPrNode) {
        const defRPrNode = this.xmlParser.findNode(parentLevelPrNode, "defRPr");
        if (defRPrNode) {
          return defRPrNode;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract color information from solidFill node
   */
  extractColorFromSolidFill(
    solidFillNode: XmlNode,
    context: ProcessingContext
  ): { color: string; themeColorType?: string } | undefined {
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
      const result: { color: string; themeColorType?: string } = { color };

      // Extract theme color type if present
      const schemeClrNode = this.xmlParser.findNode(solidFillNode, "schemeClr");
      if (schemeClrNode) {
        const val = this.xmlParser.getAttribute(schemeClrNode, "val");
        if (val) {
          result.themeColorType = val;
        }
      }

      return result;
    }

    return undefined;
  }

  /**
   * Extract bold setting from list style based on paragraph level
   * This method is kept for backward compatibility
   */
  getBoldFromListStyle(
    pNode: XmlNode,
    _context: ProcessingContext,
    txBodyNode: XmlNode
  ): boolean {
    const defRPrNode = this.getListStyleDefRPr(pNode, txBodyNode);
    if (defRPrNode) {
      const b = this.xmlParser.getAttribute(defRPrNode, "b");
      return b === "1" || b === "true";
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
            DebugHelper.log(
              context,
              `TextStyleExtractor: Inherited font family from shape style: ${fontFamily}`,
              "info"
            );
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
