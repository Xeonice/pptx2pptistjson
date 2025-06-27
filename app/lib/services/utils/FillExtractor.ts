import { ColorUtils } from "./ColorUtils";

export class FillExtractor {
  /**
   * Helper function to get text by path list
   */
  private static getTextByPathList(obj: any, pathList: string[]): string | undefined {
    let current = obj;
    for (const path of pathList) {
      if (current && typeof current === 'object' && path in current) {
        current = current[path];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  }
  /**
   * Extracts solid fill color from PowerPoint XML node
   */
  static getSolidFill(
    solidFill: any,
    clrMap?: any,
    phClr?: string,
    warpObj?: any
  ): string {
    if (!solidFill) return "";

    let color = "";
    let clrNode: any;

    // Handle different color types
    if (solidFill["a:srgbClr"]) {
      // Direct RGB color
      clrNode = solidFill["a:srgbClr"];
      color = this.getTextByPathList(clrNode, ["attrs", "val"]) || "";
    } else if (solidFill["a:schemeClr"]) {
      // Theme color reference
      clrNode = solidFill["a:schemeClr"];
      const schemeClr = "a:" + (this.getTextByPathList(clrNode, ["attrs", "val"]) || "");
      color = this.getSchemeColorFromTheme(schemeClr, warpObj, clrMap, phClr) || "";
    } else if (solidFill["a:scrgbClr"]) {
      // Percentage RGB color
      clrNode = solidFill["a:scrgbClr"];
      const defBultColorVals = clrNode["attrs"];
      const red = defBultColorVals["r"].indexOf("%") !== -1 
        ? defBultColorVals["r"].split("%").shift() 
        : defBultColorVals["r"];
      const green = defBultColorVals["g"].indexOf("%") !== -1 
        ? defBultColorVals["g"].split("%").shift() 
        : defBultColorVals["g"];
      const blue = defBultColorVals["b"].indexOf("%") !== -1 
        ? defBultColorVals["b"].split("%").shift() 
        : defBultColorVals["b"];
      
      color = ColorUtils.toHex(255 * (Number(red) / 100)) + 
              ColorUtils.toHex(255 * (Number(green) / 100)) + 
              ColorUtils.toHex(255 * (Number(blue) / 100));
    } else if (solidFill["a:prstClr"]) {
      // Preset color
      clrNode = solidFill["a:prstClr"];
      const prstClr = this.getTextByPathList(clrNode, ["attrs", "val"]) || "";
      color = ColorUtils.getPresetColor(prstClr) || "";
    } else if (solidFill["a:hslClr"]) {
      // HSL color
      clrNode = solidFill["a:hslClr"];
      const defBultColorVals = clrNode["attrs"];
      const hue = Number(defBultColorVals["hue"]) / 100000;
      const sat = Number(
        defBultColorVals["sat"].indexOf("%") !== -1 
          ? defBultColorVals["sat"].split("%").shift() 
          : defBultColorVals["sat"]
      ) / 100;
      const lum = Number(
        defBultColorVals["lum"].indexOf("%") !== -1 
          ? defBultColorVals["lum"].split("%").shift() 
          : defBultColorVals["lum"]
      ) / 100;
      
      const rgb = ColorUtils.hslToRgb(hue, sat, lum);
      color = ColorUtils.toHex(rgb.r) + ColorUtils.toHex(rgb.g) + ColorUtils.toHex(rgb.b);
    } else if (solidFill["a:sysClr"]) {
      // System color
      clrNode = solidFill["a:sysClr"];
      const sysClr = this.getTextByPathList(clrNode, ["attrs", "lastClr"]);
      if (sysClr) color = sysClr;
    }

    // Ensure we have a valid color before applying transformations
    if (!color) return "";

    // Add # prefix if needed
    if (color && color.indexOf("#") === -1) {
      color = "#" + color;
    }

    // Convert to rgba for transformations
    let rgbaColor = ColorUtils.toRgba(color);

    // Apply color transformations
    if (clrNode) {
      // Alpha
      const alphaVal = this.getTextByPathList(clrNode, ["a:alpha", "attrs", "val"]);
      if (alphaVal) {
        const alpha = parseInt(alphaVal) / 100000;
        if (!isNaN(alpha)) {
          rgbaColor = ColorUtils.applyAlpha(rgbaColor, alpha);
        }
      }

      // Hue modification
      const hueModVal = this.getTextByPathList(clrNode, ["a:hueMod", "attrs", "val"]);
      if (hueModVal) {
        const hueMod = parseInt(hueModVal) / 100000;
        if (!isNaN(hueMod)) {
          rgbaColor = ColorUtils.applyHueMod(rgbaColor, hueMod);
        }
      }

      // Luminance modification
      const lumModVal = this.getTextByPathList(clrNode, ["a:lumMod", "attrs", "val"]);
      if (lumModVal) {
        const lumMod = parseInt(lumModVal) / 100000;
        if (!isNaN(lumMod)) {
          rgbaColor = ColorUtils.applyLuminanceMod(rgbaColor, lumMod);
        }
      }

      // Luminance offset
      const lumOffVal = this.getTextByPathList(clrNode, ["a:lumOff", "attrs", "val"]);
      if (lumOffVal) {
        const lumOff = parseInt(lumOffVal) / 100000;
        if (!isNaN(lumOff)) {
          rgbaColor = ColorUtils.applyLuminanceOff(rgbaColor, lumOff * 255);
        }
      }

      // Saturation modification
      const satModVal = this.getTextByPathList(clrNode, ["a:satMod", "attrs", "val"]);
      if (satModVal) {
        const satMod = parseInt(satModVal) / 100000;
        if (!isNaN(satMod)) {
          rgbaColor = ColorUtils.applySatMod(rgbaColor, satMod);
        }
      }

      // Shade
      const shadeVal = this.getTextByPathList(clrNode, ["a:shade", "attrs", "val"]);
      if (shadeVal) {
        const shade = parseInt(shadeVal) / 100000;
        if (!isNaN(shade)) {
          rgbaColor = ColorUtils.applyShade(rgbaColor, shade);
        }
      }

      // Tint
      const tintVal = this.getTextByPathList(clrNode, ["a:tint", "attrs", "val"]);
      if (tintVal) {
        const tint = parseInt(tintVal) / 100000;
        if (!isNaN(tint)) {
          rgbaColor = ColorUtils.applyTint(rgbaColor, tint);
        }
      }
    }

    return rgbaColor;
  }

  /**
   * Gets scheme color from theme
   */
  private static getSchemeColorFromTheme(
    schemeClr: string,
    warpObj: any,
    clrMap?: any,
    phClr?: string
  ): string | null {
    // Handle placeholder color
    if (schemeClr === "a:phClr" && phClr) {
      return phClr;
    }

    // Get theme colors
    const themeColors = warpObj?.themeContent?.["a:theme"]?.["a:themeElements"]?.["a:clrScheme"];
    if (!themeColors) return null;

    // Map scheme color name if clrMap is provided
    let colorName = schemeClr;
    if (clrMap && clrMap[schemeClr]) {
      colorName = clrMap[schemeClr];
    }

    // Get color from theme
    const colorNode = themeColors[colorName];
    if (!colorNode) return null;

    // Extract color value
    if (colorNode["a:srgbClr"]) {
      return this.getTextByPathList(colorNode["a:srgbClr"], ["attrs", "val"]) || null;
    } else if (colorNode["a:sysClr"]) {
      return this.getTextByPathList(colorNode["a:sysClr"], ["attrs", "lastClr"]) || null;
    }

    return null;
  }

  /**
   * Gets fill color from shape properties
   */
  static getFillColor(spPr: any, clrMap?: any, phClr?: string, warpObj?: any): string {
    // Check for solid fill
    const solidFill = spPr?.["a:solidFill"];
    if (solidFill) {
      return this.getSolidFill(solidFill, clrMap, phClr, warpObj);
    }

    // Check for no fill
    const noFill = spPr?.["a:noFill"];
    if (noFill) {
      return "rgba(0,0,0,0)";
    }

    // Default to transparent if no fill is specified
    return "";
  }

  /**
   * Gets gradient fill (placeholder for future implementation)
   */
  static getGradientFill(gradFill: any, clrMap?: any, phClr?: string, warpObj?: any): any {
    // TODO: Implement gradient fill extraction
    return null;
  }
}