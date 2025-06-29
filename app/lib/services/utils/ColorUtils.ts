export class ColorUtils {
  /**
   * Converts any color format to standard rgba format
   */
  static toRgba(color: string | undefined): string {
    // Handle undefined/null/empty - return default black
    if (!color || !color.trim()) {
      return "rgba(0,0,0,1)";
    }

    // Handle transparent/none
    if (color === "transparent" || color === "none") {
      return "rgba(0,0,0,0)";
    }

    try {
      // Handle hex format
      if (color.startsWith("#")) {
        return this.hexToRgba(color);
      }

      // Handle rgb format
      if (color.startsWith("rgb(")) {
        return this.rgbToRgba(color);
      }

      // Handle rgba format - check for complete format first
      if (color.startsWith("rgba(")) {
        // Try malformed rgba without alpha first
        const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if (rgbaMatch) {
          const [, r, g, b] = rgbaMatch;
          return `rgba(${r},${g},${b},1)`;
        }
        // Then try normal rgba with alpha
        return this.normalizeRgba(color);
      }

      // Handle case-insensitive formats
      if (color.toLowerCase().startsWith("rgba(")) {
        const caseInsensitiveMatch = color.toLowerCase().match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
        if (caseInsensitiveMatch) {
          const [, r, g, b, a] = caseInsensitiveMatch;
          const alpha = parseFloat(a) === 1 ? "1" : parseFloat(a).toFixed(3).replace(/\.?0+$/, "");
          return `rgba(${r},${g},${b},${alpha})`;
        }
      }

      // Handle rgb with alpha (malformed)
      if (color.startsWith("rgb(") && color.includes(",") && color.split(",").length >= 4) {
        const parts = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
        if (parts) {
          const [, r, g, b, a] = parts;
          const alpha = parseFloat(a) === 1 ? "1" : parseFloat(a).toFixed(3).replace(/\.?0+$/, "");
          return `rgba(${r},${g},${b},${alpha})`;
        }
      }
    } catch (e) {
      // Fall through to default
    }

    // Return default black for any invalid color
    return "rgba(0,0,0,1)";
  }

  /**
   * Converts hex color to rgba format
   */
  private static hexToRgba(hex: string): string {
    // Remove # if present
    hex = hex.replace("#", "");

    // Validate hex characters
    if (!/^[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?([0-9A-Fa-f]{2})?$/.test(hex)) {
      throw new Error("Invalid hex color");
    }

    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    // Extract RGBA values
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const a = hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

    // Format with proper decimal places for alpha
    const alpha = a === 1 ? "1" : a.toFixed(3).replace(/\.?0+$/, "");

    return `rgba(${r},${g},${b},${alpha})`;
  }

  /**
   * Converts rgb format to rgba format
   */
  private static rgbToRgba(rgb: string): string {
    const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r},${g},${b},1)`;
    }
    throw new Error("Invalid rgb format");
  }

  /**
   * Normalizes rgba format (removes spaces, ensures consistent formatting)
   */
  private static normalizeRgba(rgba: string): string {
    // Strict match for valid rgba format only
    const match = rgba.match(/^rgba\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([\d.]+)\s*\)$/);
    if (match) {
      const [, r, g, b, a] = match;
      const alpha =
        parseFloat(a) === 1
          ? "1"
          : parseFloat(a)
              .toFixed(3)
              .replace(/\.?0+$/, "");
      return `rgba(${Math.round(parseFloat(r))},${Math.round(parseFloat(g))},${Math.round(parseFloat(b))},${alpha})`;
    }
    throw new Error("Invalid rgba format");
  }

  /**
   * Applies luminance modification to a color
   */
  static applyLuminanceMod(color: string, lumMod: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Clamp luminance modifier to reasonable range
    const clampedLumMod = Math.max(0, Math.min(10, lumMod));

    const modified = {
      r: Math.max(0, Math.min(255, Math.round(rgba.r * clampedLumMod))),
      g: Math.max(0, Math.min(255, Math.round(rgba.g * clampedLumMod))),
      b: Math.max(0, Math.min(255, Math.round(rgba.b * clampedLumMod))),
      a: rgba.a,
    };

    return this.formatRgba(modified);
  }

  /**
   * Applies luminance offset to a color
   */
  static applyLuminanceOff(color: string, lumOff: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Clamp luminance offset to reasonable range
    const clampedLumOff = Math.max(-255, Math.min(255, lumOff));

    const modified = {
      r: Math.min(255, Math.max(0, Math.round(rgba.r + clampedLumOff))),
      g: Math.min(255, Math.max(0, Math.round(rgba.g + clampedLumOff))),
      b: Math.min(255, Math.max(0, Math.round(rgba.b + clampedLumOff))),
      a: rgba.a,
    };

    return this.formatRgba(modified);
  }

  /**
   * Parses rgba string to object
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
   * Formats rgba object to string
   */
  private static formatRgba(color: {
    r: number;
    g: number;
    b: number;
    a: number;
  }): string {
    const alpha =
      color.a === 1 ? "1" : color.a.toFixed(3).replace(/\.?0+$/, "");
    return `rgba(${color.r},${color.g},${color.b},${alpha})`;
  }

  /**
   * Converts a color integer to rgba format
   */
  static intToRgba(colorInt: number, alpha: number = 1): string {
    const r = (colorInt >> 16) & 255;
    const g = (colorInt >> 8) & 255;
    const b = colorInt & 255;
    const a = alpha === 1 ? "1" : alpha.toFixed(3).replace(/\.?0+$/, "");
    return `rgba(${r},${g},${b},${a})`;
  }

  /**
   * Converts HSL to RGB
   */
  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Converts hex value to decimal
   */
  static toHex(value: number): string {
    const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  /**
   * Gets preset color by name
   */
  static getPresetColor(name: string): string | null {
    const presetColors: Record<string, string> = {
      'aliceBlue': '#F0F8FF',
      'antiqueWhite': '#FAEBD7',
      'aqua': '#00FFFF',
      'aquamarine': '#7FFFD4',
      'azure': '#F0FFFF',
      'beige': '#F5F5DC',
      'bisque': '#FFE4C4',
      'black': '#000000',
      'blanchedAlmond': '#FFEBCD',
      'blue': '#0000FF',
      'blueViolet': '#8A2BE2',
      'brown': '#A52A2A',
      'burlyWood': '#DEB887',
      'cadetBlue': '#5F9EA0',
      'chartreuse': '#7FFF00',
      'chocolate': '#D2691E',
      'coral': '#FF7F50',
      'cornflowerBlue': '#6495ED',
      'cornsilk': '#FFF8DC',
      'crimson': '#DC143C',
      'cyan': '#00FFFF',
      'darkBlue': '#00008B',
      'darkCyan': '#008B8B',
      'darkGoldenrod': '#B8860B',
      'darkGray': '#A9A9A9',
      'darkGrey': '#A9A9A9',
      'darkGreen': '#006400',
      'darkKhaki': '#BDB76B',
      'darkMagenta': '#8B008B',
      'darkOliveGreen': '#556B2F',
      'darkOrange': '#FF8C00',
      'darkOrchid': '#9932CC',
      'darkRed': '#8B0000',
      'darkSalmon': '#E9967A',
      'darkSeaGreen': '#8FBC8F',
      'darkSlateBlue': '#483D8B',
      'darkSlateGray': '#2F4F4F',
      'darkSlateGrey': '#2F4F4F',
      'darkTurquoise': '#00CED1',
      'darkViolet': '#9400D3',
      'deepPink': '#FF1493',
      'deepSkyBlue': '#00BFFF',
      'dimGray': '#696969',
      'dimGrey': '#696969',
      'dodgerBlue': '#1E90FF',
      'firebrick': '#B22222',
      'floralWhite': '#FFFAF0',
      'forestGreen': '#228B22',
      'fuchsia': '#FF00FF',
      'gainsboro': '#DCDCDC',
      'ghostWhite': '#F8F8FF',
      'gold': '#FFD700',
      'goldenrod': '#DAA520',
      'gray': '#808080',
      'grey': '#808080',
      'green': '#008000',
      'greenYellow': '#ADFF2F',
      'honeydew': '#F0FFF0',
      'hotPink': '#FF69B4',
      'indianRed': '#CD5C5C',
      'indigo': '#4B0082',
      'ivory': '#FFFFF0',
      'khaki': '#F0E68C',
      'lavender': '#E6E6FA',
      'lavenderBlush': '#FFF0F5',
      'lawnGreen': '#7CFC00',
      'lemonChiffon': '#FFFACD',
      'lightBlue': '#ADD8E6',
      'lightCoral': '#F08080',
      'lightCyan': '#E0FFFF',
      'lightGoldenrodYellow': '#FAFAD2',
      'lightGray': '#D3D3D3',
      'lightGrey': '#D3D3D3',
      'lightGreen': '#90EE90',
      'lightPink': '#FFB6C1',
      'lightSalmon': '#FFA07A',
      'lightSeaGreen': '#20B2AA',
      'lightSkyBlue': '#87CEFA',
      'lightSlateGray': '#778899',
      'lightSlateGrey': '#778899',
      'lightSteelBlue': '#B0C4DE',
      'lightYellow': '#FFFFE0',
      'lime': '#00FF00',
      'limeGreen': '#32CD32',
      'linen': '#FAF0E6',
      'magenta': '#FF00FF',
      'maroon': '#800000',
      'medAquamarine': '#66CDAA',
      'medBlue': '#0000CD',
      'medOrchid': '#BA55D3',
      'medPurple': '#9370DB',
      'medSeaGreen': '#3CB371',
      'medSlateBlue': '#7B68EE',
      'medSpringGreen': '#00FA9A',
      'medTurquoise': '#48D1CC',
      'medVioletRed': '#C71585',
      'midnightBlue': '#191970',
      'mintCream': '#F5FFFA',
      'mistyRose': '#FFE4E1',
      'moccasin': '#FFE4B5',
      'navajoWhite': '#FFDEAD',
      'navy': '#000080',
      'oldLace': '#FDF5E6',
      'olive': '#808000',
      'oliveDrab': '#6B8E23',
      'orange': '#FFA500',
      'orangeRed': '#FF4500',
      'orchid': '#DA70D6',
      'paleGoldenrod': '#EEE8AA',
      'paleGreen': '#98FB98',
      'paleTurquoise': '#AFEEEE',
      'paleVioletRed': '#DB7093',
      'papayaWhip': '#FFEFD5',
      'peachPuff': '#FFDAB9',
      'peru': '#CD853F',
      'pink': '#FFC0CB',
      'plum': '#DDA0DD',
      'powderBlue': '#B0E0E6',
      'purple': '#800080',
      'red': '#FF0000',
      'rosyBrown': '#BC8F8F',
      'royalBlue': '#4169E1',
      'saddleBrown': '#8B4513',
      'salmon': '#FA8072',
      'sandyBrown': '#F4A460',
      'seaGreen': '#2E8B57',
      'seaShell': '#FFF5EE',
      'sienna': '#A0522D',
      'silver': '#C0C0C0',
      'skyBlue': '#87CEEB',
      'slateBlue': '#6A5ACD',
      'slateGray': '#708090',
      'slateGrey': '#708090',
      'snow': '#FFFAFA',
      'springGreen': '#00FF7F',
      'steelBlue': '#4682B4',
      'tan': '#D2B48C',
      'teal': '#008080',
      'thistle': '#D8BFD8',
      'tomato': '#FF6347',
      'turquoise': '#40E0D0',
      'violet': '#EE82EE',
      'wheat': '#F5DEB3',
      'white': '#FFFFFF',
      'whiteSmoke': '#F5F5F5',
      'yellow': '#FFFF00',
      'yellowGreen': '#9ACD32'
    };

    return presetColors[name] || null;
  }

  /**
   * Applies shade transformation (darker)
   */
  static applyShade(color: string, factor: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Clamp factor to reasonable range
    const clampedFactor = Math.max(0, Math.min(1, factor));

    const modified = {
      r: Math.max(0, Math.min(255, Math.round(rgba.r * (1 - clampedFactor)))),
      g: Math.max(0, Math.min(255, Math.round(rgba.g * (1 - clampedFactor)))),
      b: Math.max(0, Math.min(255, Math.round(rgba.b * (1 - clampedFactor)))),
      a: rgba.a,
    };

    return this.formatRgba(modified);
  }

  /**
   * Applies tint transformation (lighter)
   */
  static applyTint(color: string, factor: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Clamp factor to reasonable range
    const clampedFactor = Math.max(0, Math.min(1, factor));

    const modified = {
      r: Math.max(0, Math.min(255, Math.round(rgba.r + (255 - rgba.r) * clampedFactor))),
      g: Math.max(0, Math.min(255, Math.round(rgba.g + (255 - rgba.g) * clampedFactor))),
      b: Math.max(0, Math.min(255, Math.round(rgba.b + (255 - rgba.b) * clampedFactor))),
      a: rgba.a,
    };

    return this.formatRgba(modified);
  }

  /**
   * Applies saturation modification
   */
  static applySatMod(color: string, factor: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Convert RGB to HSL
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    // Apply saturation modification
    s = Math.min(1, Math.max(0, s * factor));

    // Convert back to RGB
    const rgb = this.hslToRgb(h, s, l);
    return this.formatRgba({ ...rgb, a: rgba.a });
  }

  /**
   * Applies hue modification
   */
  static applyHueMod(color: string, factor: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Convert RGB to HSL
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    // Apply hue modification
    h = (h + factor) % 1;
    if (h < 0) h += 1;

    // Convert back to RGB
    const rgb = this.hslToRgb(h, s, l);
    return this.formatRgba({ ...rgb, a: rgba.a });
  }

  /**
   * Applies alpha transparency
   */
  static applyAlpha(color: string, alpha: number): string {
    const rgba = this.parseRgba(this.toRgba(color));
    if (!rgba) return color;

    // Clamp alpha to valid range [0, 1]
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    return this.formatRgba({ ...rgba, a: clampedAlpha });
  }
}
