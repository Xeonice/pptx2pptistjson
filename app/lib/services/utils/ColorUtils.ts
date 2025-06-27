export class ColorUtils {
  /**
   * Converts any color format to standard rgba format
   */
  static toRgba(color: string | undefined): string {
    if (!color) {
      return 'rgba(0,0,0,1)';
    }

    // Handle transparent/none
    if (color === 'transparent' || color === 'none') {
      return 'rgba(0,0,0,0)';
    }

    // Handle hex format
    if (color.startsWith('#')) {
      return this.hexToRgba(color);
    }

    // Handle rgb format
    if (color.startsWith('rgb(')) {
      return this.rgbToRgba(color);
    }

    // Handle rgba format (already standard)
    if (color.startsWith('rgba(')) {
      return this.normalizeRgba(color);
    }

    // Default fallback
    return 'rgba(0,0,0,1)';
  }

  /**
   * Converts hex color to rgba format
   */
  private static hexToRgba(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Extract RGBA values
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const a = hex.length >= 8 
      ? parseInt(hex.substring(6, 8), 16) / 255
      : 1;
    
    // Format with proper decimal places for alpha
    const alpha = a === 1 ? '1' : a.toFixed(3).replace(/\.?0+$/, '');
    
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /**
   * Converts rgb format to rgba format
   */
  private static rgbToRgba(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r},${g},${b},1)`;
    }
    return 'rgba(0,0,0,1)';
  }

  /**
   * Normalizes rgba format (removes spaces, ensures consistent formatting)
   */
  private static normalizeRgba(rgba: string): string {
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      const alpha = parseFloat(a) === 1 ? '1' : parseFloat(a).toFixed(3).replace(/\.?0+$/, '');
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return rgba;
  }

  /**
   * Applies luminance modification to a color
   */
  static applyLuminanceMod(color: string, lumMod: number): string {
    const rgba = this.parseRgba(color);
    if (!rgba) return color;

    const modified = {
      r: Math.round(rgba.r * lumMod),
      g: Math.round(rgba.g * lumMod),
      b: Math.round(rgba.b * lumMod),
      a: rgba.a
    };

    return this.formatRgba(modified);
  }

  /**
   * Applies luminance offset to a color
   */
  static applyLuminanceOff(color: string, lumOff: number): string {
    const rgba = this.parseRgba(color);
    if (!rgba) return color;

    const modified = {
      r: Math.min(255, Math.max(0, rgba.r + lumOff)),
      g: Math.min(255, Math.max(0, rgba.g + lumOff)),
      b: Math.min(255, Math.max(0, rgba.b + lumOff)),
      a: rgba.a
    };

    return this.formatRgba(modified);
  }

  /**
   * Parses rgba string to object
   */
  private static parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
    const match = color.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
    if (match) {
      const [, r, g, b, a] = match;
      return {
        r: parseInt(r),
        g: parseInt(g),
        b: parseInt(b),
        a: parseFloat(a)
      };
    }
    return null;
  }

  /**
   * Formats rgba object to string
   */
  private static formatRgba(color: { r: number; g: number; b: number; a: number }): string {
    const alpha = color.a === 1 ? '1' : color.a.toFixed(3).replace(/\.?0+$/, '');
    return `rgba(${color.r},${color.g},${color.b},${alpha})`;
  }

  /**
   * Converts a color integer to rgba format
   */
  static intToRgba(colorInt: number, alpha: number = 1): string {
    const r = (colorInt >> 16) & 255;
    const g = (colorInt >> 8) & 255;
    const b = colorInt & 255;
    const a = alpha === 1 ? '1' : alpha.toFixed(3).replace(/\.?0+$/, '');
    return `rgba(${r},${g},${b},${a})`;
  }
}