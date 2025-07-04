/**
 * ColorUtils 综合测试套件
 * 测试所有颜色转换和处理功能，包括格式标准化、色彩变换和边界条件
 */

import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';

describe('ColorUtils - Comprehensive Test Suite', () => {
  describe('toRgba - Color Format Normalization', () => {
    describe('Hex Color Conversion', () => {
      it('should convert 6-digit hex colors to rgba', () => {
        expect(ColorUtils.toRgba('#FF0000')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('#00FF00')).toBe('rgba(0,255,0,1)');
        expect(ColorUtils.toRgba('#0000FF')).toBe('rgba(0,0,255,1)');
        expect(ColorUtils.toRgba('#FFFFFF')).toBe('rgba(255,255,255,1)');
        expect(ColorUtils.toRgba('#000000')).toBe('rgba(0,0,0,1)');
      });

      it('should convert 3-digit hex colors to rgba', () => {
        expect(ColorUtils.toRgba('#F00')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('#0F0')).toBe('rgba(0,255,0,1)');
        expect(ColorUtils.toRgba('#00F')).toBe('rgba(0,0,255,1)');
        expect(ColorUtils.toRgba('#FFF')).toBe('rgba(255,255,255,1)');
        expect(ColorUtils.toRgba('#000')).toBe('rgba(0,0,0,1)');
      });

      it('should convert 8-digit hex colors with alpha to rgba', () => {
        expect(ColorUtils.toRgba('#FF0000FF')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('#00FF0080')).toBe('rgba(0,255,0,0.502)');
        expect(ColorUtils.toRgba('#0000FF00')).toBe('rgba(0,0,255,0)');
        expect(ColorUtils.toRgba('#FFFFFF33')).toBe('rgba(255,255,255,0.2)');
      });

      it('should handle hex colors without # prefix', () => {
        expect(ColorUtils.toRgba('FF0000')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('00FF00')).toBe('rgba(0,255,0,1)');
        expect(ColorUtils.toRgba('F00')).toBe('rgba(255,0,0,1)');
      });

      it('should handle invalid hex colors', () => {
        expect(ColorUtils.toRgba('#GGGGGG')).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('#12345')).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('#XXXXXXXXX')).toBe('rgba(0,0,0,1)');
      });

      it('should handle lowercase hex colors', () => {
        expect(ColorUtils.toRgba('#ff0000')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('#abcdef')).toBe('rgba(171,205,239,1)');
        expect(ColorUtils.toRgba('#abc')).toBe('rgba(170,187,204,1)');
      });
    });

    describe('RGB Color Conversion', () => {
      it('should convert rgb colors to rgba', () => {
        expect(ColorUtils.toRgba('rgb(255,0,0)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgb(0,255,0)')).toBe('rgba(0,255,0,1)');
        expect(ColorUtils.toRgba('rgb(0,0,255)')).toBe('rgba(0,0,255,1)');
        expect(ColorUtils.toRgba('rgb(128,128,128)')).toBe('rgba(128,128,128,1)');
      });

      it('should handle rgb colors with spaces', () => {
        expect(ColorUtils.toRgba('rgb( 255 , 0 , 0 )')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgb(255 ,0,0)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgb(255,0, 0)')).toBe('rgba(255,0,0,1)');
      });

      it('should handle malformed rgb with alpha', () => {
        expect(ColorUtils.toRgba('rgb(255,0,0,0.5)')).toBe('rgba(255,0,0,0.5)');
        expect(ColorUtils.toRgba('rgb(255,0,0,1)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgb(255,0,0,0)')).toBe('rgba(255,0,0,0)');
      });

      it('should handle invalid rgb colors', () => {
        expect(ColorUtils.toRgba('rgb(256,0,0)')).toBe('rgba(256,0,0,1)');
        expect(ColorUtils.toRgba('rgb(-1,0,0)')).toBe('rgba(-1,0,0,1)');
        expect(ColorUtils.toRgba('rgb(a,b,c)')).toBe('rgba(0,0,0,1)');
      });
    });

    describe('RGBA Color Normalization', () => {
      it('should normalize valid rgba colors', () => {
        expect(ColorUtils.toRgba('rgba(255,0,0,1)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgba(0,255,0,0.5)')).toBe('rgba(0,255,0,0.5)');
        expect(ColorUtils.toRgba('rgba(0,0,255,0)')).toBe('rgba(0,0,255,0)');
      });

      it('should handle rgba with spaces', () => {
        expect(ColorUtils.toRgba('rgba( 255 , 0 , 0 , 1 )')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgba(255 ,0,0, 0.5)')).toBe('rgba(255,0,0,0.5)');
      });

      it('should handle rgba with float RGB values', () => {
        expect(ColorUtils.toRgba('rgba(255.5,0.5,0.5,1)')).toBe('rgba(256,1,1,1)');
        expect(ColorUtils.toRgba('rgba(128.9,64.1,32.7,0.8)')).toBe('rgba(129,64,33,0.8)');
      });

      it('should handle malformed rgba without alpha', () => {
        expect(ColorUtils.toRgba('rgba(255,0,0)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgba(128,128,128)')).toBe('rgba(128,128,128,1)');
      });

      it('should handle case-insensitive rgba', () => {
        expect(ColorUtils.toRgba('RGBA(255,0,0,1)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('RgBa(255,0,0,0.5)')).toBe('rgba(255,0,0,0.5)');
      });

      it('should format alpha values correctly', () => {
        expect(ColorUtils.toRgba('rgba(255,0,0,1.0)')).toBe('rgba(255,0,0,1)');
        expect(ColorUtils.toRgba('rgba(255,0,0,0.5000)')).toBe('rgba(255,0,0,0.5)');
        expect(ColorUtils.toRgba('rgba(255,0,0,0.1230)')).toBe('rgba(255,0,0,0.123)');
      });
    });

    describe('Special Color Values', () => {
      it('should handle transparent and none values', () => {
        expect(ColorUtils.toRgba('transparent')).toBe('rgba(0,0,0,0)');
        expect(ColorUtils.toRgba('none')).toBe('rgba(0,0,0,0)');
      });

      it('should handle undefined, null, and empty values', () => {
        expect(ColorUtils.toRgba(undefined)).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('')).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('  ')).toBe('rgba(0,0,0,1)');
      });

      it('should handle invalid color formats', () => {
        expect(ColorUtils.toRgba('invalid')).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('color: red')).toBe('rgba(0,0,0,1)');
        expect(ColorUtils.toRgba('123')).toBe('rgba(0,0,0,1)');
      });
    });
  });

  describe('Color Integer Conversion', () => {
    it('should convert color integers to rgba', () => {
      expect(ColorUtils.intToRgba(0xFF0000)).toBe('rgba(255,0,0,1)');
      expect(ColorUtils.intToRgba(0x00FF00)).toBe('rgba(0,255,0,1)');
      expect(ColorUtils.intToRgba(0x0000FF)).toBe('rgba(0,0,255,1)');
      expect(ColorUtils.intToRgba(0xFFFFFF)).toBe('rgba(255,255,255,1)');
      expect(ColorUtils.intToRgba(0x000000)).toBe('rgba(0,0,0,1)');
    });

    it('should handle alpha values for integer colors', () => {
      expect(ColorUtils.intToRgba(0xFF0000, 0.5)).toBe('rgba(255,0,0,0.5)');
      expect(ColorUtils.intToRgba(0x00FF00, 0)).toBe('rgba(0,255,0,0)');
      expect(ColorUtils.intToRgba(0x0000FF, 0.75)).toBe('rgba(0,0,255,0.75)');
    });

    it('should handle edge cases for integer colors', () => {
      expect(ColorUtils.intToRgba(0)).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.intToRgba(16777215)).toBe('rgba(255,255,255,1)');
      expect(ColorUtils.intToRgba(0x808080)).toBe('rgba(128,128,128,1)');
    });
  });

  describe('HSL Color Conversion', () => {
    describe('rgbToHsl', () => {
      it('should convert RGB to HSL correctly', () => {
        expect(ColorUtils.rgbToHsl(1, 0, 0)).toEqual({ h: 0, s: 1, l: 0.5 });
        expect(ColorUtils.rgbToHsl(0, 1, 0)).toEqual({ h: 1/3, s: 1, l: 0.5 });
        expect(ColorUtils.rgbToHsl(0, 0, 1)).toEqual({ h: 2/3, s: 1, l: 0.5 });
        expect(ColorUtils.rgbToHsl(1, 1, 1)).toEqual({ h: 0, s: 0, l: 1 });
        expect(ColorUtils.rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
      });

      it('should handle grayscale colors', () => {
        expect(ColorUtils.rgbToHsl(0.5, 0.5, 0.5)).toEqual({ h: 0, s: 0, l: 0.5 });
        expect(ColorUtils.rgbToHsl(0.25, 0.25, 0.25)).toEqual({ h: 0, s: 0, l: 0.25 });
        expect(ColorUtils.rgbToHsl(0.75, 0.75, 0.75)).toEqual({ h: 0, s: 0, l: 0.75 });
      });

      it('should handle mixed colors', () => {
        const hsl = ColorUtils.rgbToHsl(0.5, 0.25, 0.75);
        expect(hsl.h).toBeCloseTo(0.75, 2);
        expect(hsl.s).toBeCloseTo(0.5, 2);
        expect(hsl.l).toBeCloseTo(0.5, 2);
      });
    });

    describe('hslToRgb', () => {
      it('should convert HSL to RGB correctly', () => {
        expect(ColorUtils.hslToRgb(0, 1, 0.5)).toEqual({ r: 255, g: 0, b: 0 });
        expect(ColorUtils.hslToRgb(1/3, 1, 0.5)).toEqual({ r: 0, g: 255, b: 0 });
        expect(ColorUtils.hslToRgb(2/3, 1, 0.5)).toEqual({ r: 0, g: 0, b: 255 });
        expect(ColorUtils.hslToRgb(0, 0, 1)).toEqual({ r: 255, g: 255, b: 255 });
        expect(ColorUtils.hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
      });

      it('should handle grayscale colors', () => {
        expect(ColorUtils.hslToRgb(0, 0, 0.5)).toEqual({ r: 128, g: 128, b: 128 });
        expect(ColorUtils.hslToRgb(0.5, 0, 0.25)).toEqual({ r: 64, g: 64, b: 64 });
        expect(ColorUtils.hslToRgb(0.8, 0, 0.75)).toEqual({ r: 191, g: 191, b: 191 });
      });

      it('should handle mixed colors', () => {
        const rgb = ColorUtils.hslToRgb(0.75, 0.5, 0.5);
        expect(rgb.r).toBeCloseTo(127, 0);
        expect(rgb.g).toBeCloseTo(64, 0);
        expect(rgb.b).toBeCloseTo(191, 0);
      });
    });

    it('should maintain round-trip accuracy between RGB and HSL', () => {
      const testColors = [
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
        [1, 1, 0], [1, 0, 1], [0, 1, 1],
        [0.5, 0.5, 0.5], [0.25, 0.75, 0.1]
      ];

      testColors.forEach(([r, g, b]) => {
        const hsl = ColorUtils.rgbToHsl(r, g, b);
        const rgb = ColorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);
        // Allow 1 unit difference due to rounding in HSL conversion
        expect(Math.abs(rgb.r - r * 255)).toBeLessThanOrEqual(1);
        expect(Math.abs(rgb.g - g * 255)).toBeLessThanOrEqual(1);
        expect(Math.abs(rgb.b - b * 255)).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Color Transformations', () => {
    describe('applyLuminanceMod', () => {
      it('should apply luminance modification correctly', () => {
        const red = 'rgba(255,0,0,1)';
        const darkerRed = ColorUtils.applyLuminanceMod(red, 0.5);
        expect(darkerRed).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
        
        const lighterRed = ColorUtils.applyLuminanceMod(red, 1.5);
        expect(lighterRed).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      });

      it('should handle boundary values', () => {
        const color = 'rgba(128,128,128,0.5)';
        const noneChange = ColorUtils.applyLuminanceMod(color, 1);
        expect(noneChange).toBe('rgba(128,128,128,0.5)');
        
        const maxDark = ColorUtils.applyLuminanceMod(color, 0);
        expect(maxDark).toBe('rgba(0,0,0,0.5)');
      });

      it('should preserve alpha channel', () => {
        const color = 'rgba(255,0,0,0.5)';
        const result = ColorUtils.applyLuminanceMod(color, 0.8);
        expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.5\)/);
      });
    });

    describe('applyLuminanceOff', () => {
      it('should apply luminance offset correctly', () => {
        const darkGray = 'rgba(64,64,64,1)';
        const lighter = ColorUtils.applyLuminanceOff(darkGray, 0.2);
        expect(lighter).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
        
        const darker = ColorUtils.applyLuminanceOff(darkGray, -0.1);
        expect(darker).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      });

      it('should clamp values to valid range', () => {
        const white = 'rgba(255,255,255,1)';
        const stillWhite = ColorUtils.applyLuminanceOff(white, 0.5);
        expect(stillWhite).toBe('rgba(255,255,255,1)');
        
        const black = 'rgba(0,0,0,1)';
        const stillBlack = ColorUtils.applyLuminanceOff(black, -0.5);
        expect(stillBlack).toBe('rgba(0,0,0,1)');
      });
    });

    describe('applyShade', () => {
      it('should apply shade transformation (darker)', () => {
        const red = 'rgba(255,0,0,1)';
        const darkerRed = ColorUtils.applyShade(red, 0.5);
        expect(darkerRed).toBe('rgba(128,0,0,1)');
        
        const evenDarker = ColorUtils.applyShade(red, 0.75);
        expect(evenDarker).toBe('rgba(64,0,0,1)');
      });

      it('should handle boundary values', () => {
        const color = 'rgba(200,100,50,0.8)';
        const noChange = ColorUtils.applyShade(color, 0);
        expect(noChange).toBe('rgba(200,100,50,0.8)');
        
        const black = ColorUtils.applyShade(color, 1);
        expect(black).toBe('rgba(0,0,0,0.8)');
      });

      it('should clamp factor to valid range', () => {
        const color = 'rgba(100,100,100,1)';
        const negativeShade = ColorUtils.applyShade(color, -0.5);
        expect(negativeShade).toBe('rgba(100,100,100,1)');
        
        const excessiveShade = ColorUtils.applyShade(color, 1.5);
        expect(excessiveShade).toBe('rgba(0,0,0,1)');
      });
    });

    describe('applyTint', () => {
      it('should apply tint transformation (lighter)', () => {
        const red = 'rgba(255,0,0,1)';
        const lighterRed = ColorUtils.applyTint(red, 0.5);
        expect(lighterRed).toBe('rgba(255,128,128,1)');
        
        const evenLighter = ColorUtils.applyTint(red, 0.75);
        expect(evenLighter).toBe('rgba(255,191,191,1)');
      });

      it('should handle boundary values', () => {
        const color = 'rgba(100,50,25,0.6)';
        const noChange = ColorUtils.applyTint(color, 0);
        expect(noChange).toBe('rgba(100,50,25,0.6)');
        
        const white = ColorUtils.applyTint(color, 1);
        expect(white).toBe('rgba(255,255,255,0.6)');
      });

      it('should clamp factor to valid range', () => {
        const color = 'rgba(100,100,100,1)';
        const negativeTint = ColorUtils.applyTint(color, -0.5);
        expect(negativeTint).toBe('rgba(100,100,100,1)');
        
        const excessiveTint = ColorUtils.applyTint(color, 1.5);
        expect(excessiveTint).toBe('rgba(255,255,255,1)');
      });
    });

    describe('applySatMod', () => {
      it('should apply saturation modification', () => {
        const red = 'rgba(255,0,0,1)';
        const desaturated = ColorUtils.applySatMod(red, 0.5);
        expect(desaturated).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
        
        const supersaturated = ColorUtils.applySatMod(red, 1.5);
        expect(supersaturated).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      });

      it('should handle boundary values', () => {
        const color = 'rgba(200,100,50,0.7)';
        const noChange = ColorUtils.applySatMod(color, 1);
        expect(color).toBe('rgba(200,100,50,0.7)');
        
        const grayscale = ColorUtils.applySatMod(color, 0);
        expect(grayscale).toMatch(/rgba\(\d+,\d+,\d+,0\.7\)/);
      });
    });

    describe('applyHueMod', () => {
      it('should apply hue modification', () => {
        const red = 'rgba(255,0,0,1)';
        const shiftedHue = ColorUtils.applyHueMod(red, 0.33);
        expect(shiftedHue).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
        
        const oppositeHue = ColorUtils.applyHueMod(red, 0.5);
        expect(oppositeHue).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      });

      it('should handle wrap-around hue values', () => {
        const color = 'rgba(255,0,0,1)';
        const wrapped = ColorUtils.applyHueMod(color, 1.5);
        expect(wrapped).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
        
        const negativeWrapped = ColorUtils.applyHueMod(color, -0.5);
        expect(negativeWrapped).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      });
    });

    describe('applyAlpha', () => {
      it('should apply alpha transparency', () => {
        const red = 'rgba(255,0,0,1)';
        const semiTransparent = ColorUtils.applyAlpha(red, 0.5);
        expect(semiTransparent).toBe('rgba(255,0,0,0.5)');
        
        const transparent = ColorUtils.applyAlpha(red, 0);
        expect(transparent).toBe('rgba(255,0,0,0)');
      });

      it('should clamp alpha to valid range', () => {
        const color = 'rgba(100,100,100,0.8)';
        const negativeAlpha = ColorUtils.applyAlpha(color, -0.5);
        expect(negativeAlpha).toBe('rgba(100,100,100,0)');
        
        const excessiveAlpha = ColorUtils.applyAlpha(color, 1.5);
        expect(excessiveAlpha).toBe('rgba(100,100,100,1)');
      });
    });
  });

  describe('Preset Colors', () => {
    it('should get standard preset colors', () => {
      expect(ColorUtils.getPresetColor('red')).toBe('#FF0000');
      expect(ColorUtils.getPresetColor('green')).toBe('#008000');
      expect(ColorUtils.getPresetColor('blue')).toBe('#0000FF');
      expect(ColorUtils.getPresetColor('white')).toBe('#FFFFFF');
      expect(ColorUtils.getPresetColor('black')).toBe('#000000');
    });

    it('should handle case-sensitive preset color names', () => {
      expect(ColorUtils.getPresetColor('Red')).toBe(null);
      expect(ColorUtils.getPresetColor('RED')).toBe(null);
      expect(ColorUtils.getPresetColor('rEd')).toBe(null);
    });

    it('should get extended preset colors', () => {
      expect(ColorUtils.getPresetColor('aliceBlue')).toBe('#F0F8FF');
      expect(ColorUtils.getPresetColor('antiqueWhite')).toBe('#FAEBD7');
      expect(ColorUtils.getPresetColor('mediumVioletRed')).toBe('#C71585');
      expect(ColorUtils.getPresetColor('darkSlateGray')).toBe('#2F4F4F');
    });

    it('should handle both gray and grey variants', () => {
      expect(ColorUtils.getPresetColor('gray')).toBe('#808080');
      expect(ColorUtils.getPresetColor('grey')).toBe('#808080');
      expect(ColorUtils.getPresetColor('darkGray')).toBe('#A9A9A9');
      expect(ColorUtils.getPresetColor('darkGrey')).toBe('#A9A9A9');
    });

    it('should return null for invalid preset colors', () => {
      expect(ColorUtils.getPresetColor('invalidColor')).toBe(null);
      expect(ColorUtils.getPresetColor('')).toBe(null);
      expect(ColorUtils.getPresetColor('123')).toBe(null);
    });
  });

  describe('Utility Functions', () => {
    describe('toHex', () => {
      it('should convert values to hex format', () => {
        expect(ColorUtils.toHex(0)).toBe('00');
        expect(ColorUtils.toHex(15)).toBe('0f');
        expect(ColorUtils.toHex(255)).toBe('ff');
        expect(ColorUtils.toHex(128)).toBe('80');
      });

      it('should handle out-of-range values', () => {
        expect(ColorUtils.toHex(-10)).toBe('00');
        expect(ColorUtils.toHex(300)).toBe('ff');
        expect(ColorUtils.toHex(256)).toBe('ff');
      });

      it('should handle fractional values', () => {
        expect(ColorUtils.toHex(15.7)).toBe('10');
        expect(ColorUtils.toHex(128.3)).toBe('80');
        expect(ColorUtils.toHex(255.9)).toBe('ff');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined colors gracefully', () => {
      expect(ColorUtils.toRgba(null as any)).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba(undefined)).toBe('rgba(0,0,0,1)');
    });

    it('should handle empty and whitespace-only strings', () => {
      expect(ColorUtils.toRgba('')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('   ')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('\n\t')).toBe('rgba(0,0,0,1)');
    });

    it('should handle malformed color strings', () => {
      expect(ColorUtils.toRgba('rgb(')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('rgba(')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('#')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('color: red;')).toBe('rgba(0,0,0,1)');
    });

    it('should handle invalid transformations gracefully', () => {
      expect(ColorUtils.applyShade('invalid', 0.5)).toBe('invalid');
      expect(ColorUtils.applyTint('invalid', 0.5)).toBe('invalid');
      expect(ColorUtils.applyAlpha('invalid', 0.5)).toBe('invalid');
    });
  });
});