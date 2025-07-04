import { ProcessingContext } from "../interfaces/ProcessingContext";
import { IXmlParseService } from "../interfaces/IXmlParseService";

export interface OutlineResult {
  color: string;
  width: number;
  style: string;
  strokeDasharray?: string;
}

/**
 * Independent outline extractor for shape elements
 * Based on PowerPoint line (a:ln) element processing
 */
export class OutlineExtractor {
  /**
   * Extract outline properties from XML node
   * @param xmlNode - The shape XML node
   * @param xmlParser - XML parser service
   * @param context - Processing context
   * @returns Outline properties or undefined if no outline
   */
  static extractOutline(
    xmlNode: any,
    xmlParser: IXmlParseService,
    context: ProcessingContext
  ): OutlineResult | undefined {
    // Find spPr node first
    const spPrNode = xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) {
      return undefined;
    }

    // Try to get line node from spPr/a:ln
    let lineNode = xmlParser.findNode(spPrNode, "ln");

    // If no direct line node, check for style reference
    if (!lineNode) {
      const styleNode = xmlParser.findNode(xmlNode, "style");
      if (styleNode) {
        const lnRefNode = xmlParser.findNode(styleNode, "lnRef");
        if (lnRefNode) {
          const lnIdx = xmlParser.getAttribute(lnRefNode, "idx");
          if (lnIdx && context.theme) {
            // Get line style from theme based on index
            const themeContent = this.createThemeContent(context.theme);
            const lnStyleLst =
              themeContent?.["a:theme"]?.["a:themeElements"]?.["a:fmtScheme"]?.[
                "a:lnStyleLst"
              ];
            if (lnStyleLst && lnStyleLst["a:ln"]) {
              const lineStyles = lnStyleLst["a:ln"];
              const index = parseInt(lnIdx) - 1;
              if (index >= 0 && index < lineStyles.length) {
                lineNode = lineStyles[index];
              }
            }
          }
        }
      }
    }

    // If still no line node, fallback to the main node
    if (!lineNode) {
      lineNode = spPrNode;
    }

    // Check for noFill
    const noFillNode = xmlParser.findNode(lineNode, "noFill");
    if (noFillNode) {
      return undefined; // No outline if noFill is present
    }

    const result: OutlineResult = {
      color: "#000000",
      width: 1,
      style: "solid",
    };

    // Extract width (convert from EMU to points, then to CSS pixels)
    const width = xmlParser.getAttribute(lineNode, "w");
    if (width) {
      // Convert EMU to points: EMU / 12700 ≈ points
      const widthPoints = parseInt(width) / 12700;
      result.width = Math.round(widthPoints * 100) / 100; // Round to 2 decimal places
    } else {
      result.width = 0; // Default when no width specified
    }

    // Extract color
    result.color = this.extractLineColor(lineNode, xmlNode, xmlParser, context);

    // Extract dash style
    const dashResult = this.extractDashStyle(lineNode, xmlParser);
    result.style = dashResult.style;
    if (dashResult.strokeDasharray) {
      result.strokeDasharray = dashResult.strokeDasharray;
    }

    // Only return outline if width > 0 or color is not default
    if (result.width > 0 || result.color !== "#000000") {
      return result;
    }

    return undefined;
  }

  /**
   * Extract line color from various sources
   */
  private static extractLineColor(
    lineNode: any,
    xmlNode: any,
    xmlParser: IXmlParseService,
    context: ProcessingContext
  ): string {
    // Try direct solidFill first
    const solidFillNode = xmlParser.findNode(lineNode, "solidFill");
    if (solidFillNode) {
      // Check for srgbClr
      const srgbClrNode = xmlParser.findNode(solidFillNode, "srgbClr");
      if (srgbClrNode) {
        const val = xmlParser.getAttribute(srgbClrNode, "val");
        if (val) {
          return `#${val}`;
        }
      }

      // Check for schemeClr
      const schemeClrNode = xmlParser.findNode(solidFillNode, "schemeClr");
      if (schemeClrNode && context.theme) {
        const schemeClr = xmlParser.getAttribute(schemeClrNode, "val");
        if (schemeClr) {
          const themeContent = this.createThemeContent(context.theme);
          const color = this.getSchemeColorFromTheme(
            `a:${schemeClr}`,
            themeContent
          );
          if (color) {
            return `#${color}`;
          }
        }
      }
    }

    // Try style reference color
    const styleNode = xmlParser.findNode(xmlNode, "style");
    if (styleNode && context.theme) {
      const lnRefNode = xmlParser.findNode(styleNode, "lnRef");
      if (lnRefNode) {
        const schemeClrNode = xmlParser.findNode(lnRefNode, "schemeClr");
        if (schemeClrNode) {
          const schemeClr = xmlParser.getAttribute(schemeClrNode, "val");
          if (schemeClr) {
            const themeContent = this.createThemeContent(context.theme);
            let color = this.getSchemeColorFromTheme(
              `a:${schemeClr}`,
              themeContent
            );

            if (color) {
              // Apply shade transformation if present
              const shadeNode = xmlParser.findNode(schemeClrNode, "shade");
              if (shadeNode) {
                const shade = xmlParser.getAttribute(shadeNode, "val");
                if (shade) {
                  const shadeVal = parseInt(shade) / 100000;
                  color = this.applyShade(color, shadeVal);
                }
              }
              return `#${color}`;
            }
          }
        }
      }
    }

    return "#000000"; // Default black
  }

  /**
   * Extract dash style and stroke dash array
   */
  private static extractDashStyle(
    lineNode: any,
    xmlParser: IXmlParseService
  ): { style: string; strokeDasharray?: string } {
    const prstDashNode = xmlParser.findNode(lineNode, "prstDash");
    if (!prstDashNode) {
      return { style: "solid", strokeDasharray: "0" };
    }

    const type = xmlParser.getAttribute(prstDashNode, "val");

    switch (type) {
      case "solid":
        return { style: "solid", strokeDasharray: "0" };
      case "dash":
        return { style: "dashed", strokeDasharray: "5" };
      case "dashDot":
        return { style: "dashed", strokeDasharray: "5, 5, 1, 5" };
      case "dot":
        return { style: "dotted", strokeDasharray: "1, 5" };
      case "lgDash":
        return { style: "dashed", strokeDasharray: "10, 5" };
      case "lgDashDotDot":
        return { style: "dotted", strokeDasharray: "10, 5, 1, 5, 1, 5" };
      case "sysDash":
        return { style: "dashed", strokeDasharray: "5, 2" };
      case "sysDashDot":
        return { style: "dotted", strokeDasharray: "5, 2, 1, 5" };
      case "sysDashDotDot":
        return { style: "dotted", strokeDasharray: "5, 2, 1, 5, 1, 5" };
      case "sysDot":
        return { style: "dotted", strokeDasharray: "2, 5" };
      default:
        return { style: "solid", strokeDasharray: "0" };
    }
  }

  /**
   * Create theme content wrapper
   */
  private static createThemeContent(theme: any): any {
    return {
      "a:theme": {
        "a:themeElements": theme,
      },
    };
  }

  /**
   * Get scheme color from theme
   */
  private static getSchemeColorFromTheme(
    schemeClr: string,
    themeContent: any
  ): string | undefined {
    const colorScheme =
      themeContent?.["a:theme"]?.["a:themeElements"]?.["a:clrScheme"];
    if (!colorScheme) {
      return undefined;
    }

    const colorNode = colorScheme[schemeClr];
    if (!colorNode) {
      return undefined;
    }

    // Try srgbClr first
    if (colorNode["a:srgbClr"]) {
      return colorNode["a:srgbClr"]["attrs"]?.["val"];
    }

    // Try sysClr
    if (colorNode["a:sysClr"]) {
      return colorNode["a:sysClr"]["attrs"]?.["lastClr"];
    }

    return undefined;
  }

  /**
   * Apply shade transformation to color
   */
  private static applyShade(hexColor: string, shade: number): string {
    try {
      // Convert hex to RGB
      const r = parseInt(hexColor.substring(0, 2), 16);
      const g = parseInt(hexColor.substring(2, 4), 16);
      const b = parseInt(hexColor.substring(4, 6), 16);

      // Apply shade (darken)
      const newR = Math.round(r * shade);
      const newG = Math.round(g * shade);
      const newB = Math.round(b * shade);

      // Convert back to hex
      const toHex = (val: number) =>
        Math.min(255, Math.max(0, val)).toString(16).padStart(2, "0");
      return toHex(newR) + toHex(newG) + toHex(newB);
    } catch (error) {
      return hexColor; // Return original on error
    }
  }
}
