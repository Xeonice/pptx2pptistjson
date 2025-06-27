/**
 * Color testing utilities for handling precision and format comparisons
 */
export class ColorTestUtils {
  /**
   * Compare two colors with tolerance for floating point precision
   */
  static expectColorEqual(actual: string, expected: string, tolerance: number = 1): void {
    const actualRgba = this.parseRgba(actual);
    const expectedRgba = this.parseRgba(expected);

    if (!actualRgba || !expectedRgba) {
      expect(actual).toBe(expected);
      return;
    }

    expect(Math.abs(actualRgba.r - expectedRgba.r)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(actualRgba.g - expectedRgba.g)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(actualRgba.b - expectedRgba.b)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(actualRgba.a - expectedRgba.a)).toBeLessThanOrEqual(tolerance / 255);
  }

  /**
   * Parse rgba string to component values
   */
  private static parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
    const match = color.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: parseFloat(match[4])
      };
    }
    return null;
  }

  /**
   * Create PowerPoint color XML node structure
   */
  static createPPTColorNode(type: string, value: string, transformations?: Record<string, string>): any {
    const colorNode: any = {
      attrs: { val: value }
    };

    if (transformations) {
      Object.entries(transformations).forEach(([key, val]) => {
        colorNode[`a:${key}`] = { attrs: { val } };
      });
    }

    return {
      [`a:${type}`]: colorNode
    };
  }

  /**
   * Create mock theme with specified colors
   */
  static createMockTheme(colors: Record<string, string>): any {
    return {
      getColorScheme: () => colors
    };
  }

  /**
   * Create mock warpObj for theme testing
   */
  static createMockWarpObj(themeColors: Record<string, string>): any {
    const clrScheme: any = {};
    
    Object.entries(themeColors).forEach(([key, value]) => {
      clrScheme[`a:${key}`] = {
        "a:srgbClr": {
          attrs: { val: value.replace('#', '') }
        }
      };
    });

    return {
      themeContent: {
        "a:theme": {
          "a:themeElements": {
            "a:clrScheme": clrScheme
          }
        }
      }
    };
  }

  /**
   * Create mock shape XML node with fill
   */
  static createMockShapeWithFill(fillType: string, fillData: any): any {
    return {
      name: "p:sp",
      children: [
        {
          name: "p:spPr",
          children: [
            {
              name: fillType,
              ...fillData
            }
          ]
        }
      ]
    };
  }

  /**
   * Validate rgba format string
   */
  static isValidRgbaFormat(color: string): boolean {
    return /^rgba\(\d+,\d+,\d+,(1|0|0?\.\d+)\)$/.test(color);
  }

  /**
   * Convert hex to rgba for comparison
   */
  static hexToRgba(hex: string, alpha: number = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = alpha === 1 ? "1" : alpha.toFixed(3).replace(/\.?0+$/, "");
    return `rgba(${r},${g},${b},${a})`;
  }

  /**
   * Generate test color variations
   */
  static generateColorVariations(baseColor: string): Record<string, string> {
    return {
      original: baseColor,
      shade25: `${baseColor}_shade_25000`,
      shade50: `${baseColor}_shade_50000`,
      shade75: `${baseColor}_shade_75000`,
      tint25: `${baseColor}_tint_25000`,
      tint50: `${baseColor}_tint_50000`,
      tint75: `${baseColor}_tint_75000`,
      alpha50: `${baseColor}_alpha_50000`,
      alpha75: `${baseColor}_alpha_75000`
    };
  }
}