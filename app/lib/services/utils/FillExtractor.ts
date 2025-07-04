import { ColorUtils } from "./ColorUtils";

export class FillExtractor {
  /**
   * Helper function to get text by path list - enhanced version
   */
  private static getTextByPathList(obj: any, pathList: string[]): any {
    let current = obj;
    for (const path of pathList) {
      if (current && typeof current === "object" && path in current) {
        current = current[path];
      } else {
        return undefined;
      }
    }
    return current;
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
      const schemeClr =
        "a:" + (this.getTextByPathList(clrNode, ["attrs", "val"]) || "");
      color =
        this.getSchemeColorFromTheme(schemeClr, warpObj, clrMap, phClr) || "";
    } else if (solidFill["a:scrgbClr"]) {
      // Percentage RGB color
      clrNode = solidFill["a:scrgbClr"];
      const defBultColorVals = clrNode["attrs"];
      const red =
        defBultColorVals["r"].indexOf("%") !== -1
          ? defBultColorVals["r"].split("%").shift()
          : defBultColorVals["r"];
      const green =
        defBultColorVals["g"].indexOf("%") !== -1
          ? defBultColorVals["g"].split("%").shift()
          : defBultColorVals["g"];
      const blue =
        defBultColorVals["b"].indexOf("%") !== -1
          ? defBultColorVals["b"].split("%").shift()
          : defBultColorVals["b"];

      color =
        ColorUtils.toHex(255 * (Number(red) / 100)) +
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
      const sat =
        Number(
          defBultColorVals["sat"].indexOf("%") !== -1
            ? defBultColorVals["sat"].split("%").shift()
            : defBultColorVals["sat"]
        ) / 100;
      const lum =
        Number(
          defBultColorVals["lum"].indexOf("%") !== -1
            ? defBultColorVals["lum"].split("%").shift()
            : defBultColorVals["lum"]
        ) / 100;

      const rgb = ColorUtils.hslToRgb(hue, sat, lum);
      color =
        ColorUtils.toHex(rgb.r) +
        ColorUtils.toHex(rgb.g) +
        ColorUtils.toHex(rgb.b);
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

    // Check if we need to apply color transformations
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hasTransformations = clrNode && this.hasColorTransformations(clrNode);

    // Always convert to rgba for consistency
    let rgbaColor = ColorUtils.toRgba(color);

    // Apply color transformations in correct order (matching sample-code)
    if (clrNode) {
      // Check if we need to return alpha format
      let isAlpha = false;

      // Alpha (check first to determine output format)
      const alphaVal = this.getTextByPathList(clrNode, [
        "a:alpha",
        "attrs",
        "val",
      ]);
      if (alphaVal) {
        const alpha = parseInt(alphaVal) / 100000;
        if (!isNaN(alpha)) {
          rgbaColor = ColorUtils.applyAlpha(rgbaColor, alpha);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          isAlpha = true;
        }
      }

      // Hue modification
      const hueModVal = this.getTextByPathList(clrNode, [
        "a:hueMod",
        "attrs",
        "val",
      ]);
      if (hueModVal) {
        const hueMod = parseInt(hueModVal) / 100000;
        if (!isNaN(hueMod)) {
          rgbaColor = ColorUtils.applyHueMod(rgbaColor, hueMod);
        }
      }

      // Luminance modification
      const lumModVal = this.getTextByPathList(clrNode, [
        "a:lumMod",
        "attrs",
        "val",
      ]);
      if (lumModVal) {
        const lumMod = parseInt(lumModVal) / 100000;
        if (!isNaN(lumMod)) {
          rgbaColor = ColorUtils.applyLuminanceMod(rgbaColor, lumMod);
        }
      }

      // Luminance offset
      const lumOffVal = this.getTextByPathList(clrNode, [
        "a:lumOff",
        "attrs",
        "val",
      ]);
      if (lumOffVal) {
        const lumOff = parseInt(lumOffVal) / 100000;
        if (!isNaN(lumOff)) {
          rgbaColor = ColorUtils.applyLuminanceOff(rgbaColor, lumOff);
        }
      }

      // Saturation modification
      const satModVal = this.getTextByPathList(clrNode, [
        "a:satMod",
        "attrs",
        "val",
      ]);
      if (satModVal) {
        const satMod = parseInt(satModVal) / 100000;
        if (!isNaN(satMod)) {
          rgbaColor = ColorUtils.applySatMod(rgbaColor, satMod);
        }
      }

      // Shade
      const shadeVal = this.getTextByPathList(clrNode, [
        "a:shade",
        "attrs",
        "val",
      ]);
      if (shadeVal) {
        const shade = parseInt(shadeVal) / 100000;
        if (!isNaN(shade)) {
          rgbaColor = ColorUtils.applyShade(rgbaColor, shade);
        }
      }

      // Tint
      const tintVal = this.getTextByPathList(clrNode, [
        "a:tint",
        "attrs",
        "val",
      ]);
      if (tintVal) {
        const tint = parseInt(tintVal) / 100000;
        if (!isNaN(tint)) {
          rgbaColor = ColorUtils.applyTint(rgbaColor, tint);
        }
      }

      // Always return rgba format for consistency
      // (Removing hex conversion to ensure consistent rgba output)
    }

    return rgbaColor;
  }

  /**
   * Gets scheme color from theme - enhanced version matching sample-code
   */
  private static getSchemeColorFromTheme(
    schemeClr: string,
    warpObj: any,
    clrMap?: any,
    phClr?: string
  ): string | null {
    let color: string | null = null;
    let slideLayoutClrOverride: any;

    // Determine color mapping override
    if (clrMap) {
      slideLayoutClrOverride = clrMap;
    } else {
      // Check slide color map override
      let sldClrMapOvr = this.getTextByPathList(warpObj?.slideContent, [
        "p:sld",
        "p:clrMapOvr",
        "a:overrideClrMapping",
        "attrs",
      ]);
      if (sldClrMapOvr) {
        slideLayoutClrOverride = sldClrMapOvr;
      } else {
        // Check slide layout color map override
        sldClrMapOvr = this.getTextByPathList(warpObj?.slideLayoutContent, [
          "p:sldLayout",
          "p:clrMapOvr",
          "a:overrideClrMapping",
          "attrs",
        ]);
        if (sldClrMapOvr) {
          slideLayoutClrOverride = sldClrMapOvr;
        } else {
          // Use slide master color map
          slideLayoutClrOverride = this.getTextByPathList(
            warpObj?.slideMasterContent,
            ["p:sldMaster", "p:clrMap", "attrs"]
          );
        }
      }
    }

    // Extract scheme color name (remove 'a:' prefix)
    const schmClrName = schemeClr.startsWith("a:")
      ? schemeClr.substring(2)
      : schemeClr;

    // Handle placeholder color
    if (schmClrName === "phClr" && phClr) {
      return phClr;
    }

    let resolvedSchemeClr = schemeClr;

    // Apply color mapping overrides
    if (slideLayoutClrOverride) {
      switch (schmClrName) {
        case "tx1":
        case "tx2":
        case "bg1":
        case "bg2":
          const mappedColor = slideLayoutClrOverride[schmClrName];
          if (mappedColor) {
            resolvedSchemeClr = "a:" + mappedColor;
          }
          break;
        default:
          break;
      }
    } else {
      // Apply default color mappings
      switch (schmClrName) {
        case "tx1":
          resolvedSchemeClr = "a:dk1";
          break;
        case "tx2":
          resolvedSchemeClr = "a:dk2";
          break;
        case "bg1":
          resolvedSchemeClr = "a:lt1";
          break;
        case "bg2":
          resolvedSchemeClr = "a:lt2";
          break;
        default:
          break;
      }
    }

    // Get theme colors
    const themeColors =
      warpObj?.themeContent?.["a:theme"]?.["a:themeElements"]?.["a:clrScheme"];
    if (!themeColors) return null;

    // Get color node from theme
    const colorNode = themeColors[resolvedSchemeClr];
    if (!colorNode) return null;

    // Extract color value
    if (colorNode["a:srgbClr"]) {
      color =
        this.getTextByPathList(colorNode["a:srgbClr"], ["attrs", "val"]) ||
        null;
    } else if (colorNode["a:sysClr"]) {
      color =
        this.getTextByPathList(colorNode["a:sysClr"], ["attrs", "lastClr"]) ||
        null;
    }

    return color;
  }

  /**
   * Gets fill color from shape properties
   */
  static getFillColor(
    spPr: any,
    clrMap?: any,
    phClr?: string,
    warpObj?: any
  ): string {
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
   * Checks if a color node has any transformations that need to be applied
   */
  private static hasColorTransformations(clrNode: any): boolean {
    if (!clrNode) return false;

    // Check for various color transformation attributes
    const transformations = [
      "a:alpha",
      "a:hueMod",
      "a:lumMod",
      "a:lumOff",
      "a:satMod",
      "a:shade",
      "a:tint",
    ];

    return transformations.some((transform) => {
      const val = this.getTextByPathList(clrNode, [transform, "attrs", "val"]);
      return val !== undefined && val !== null;
    });
  }

  /**
   * Adds missing parseRgba method for ColorUtils compatibility
   */
  private static parseRgba(
    color: string
  ): { r: number; g: number; b: number; a: number } | null {
    const match = color.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      return {
        r: parseInt(r),
        g: parseInt(g),
        b: parseInt(b),
        a: parseFloat(a),
      };
    }
    return null;
  }

  /**
   * Gets gradient fill (placeholder for future implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getGradientFill(
    gradFill: any,
    clrMap?: any,
    phClr?: string,
    warpObj?: any
  ): any {
    // TODO: Implement gradient fill extraction
    return null;
  }
}
