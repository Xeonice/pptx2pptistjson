import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData, testDataHelpers } from '../fixtures/color-test-data';

describe('ColorUtils Enhanced Functions', () => {
  describe('applyShade', () => {
    describe('Basic functionality', () => {
      it('should apply 50% shade to red color', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,1)', 0.5);
        ColorTestUtils.expectColorEqual(result, 'rgba(128,0,0,1)', 1);
      });

      it('should apply 25% shade to blue color', () => {
        const result = ColorUtils.applyShade('rgba(0,0,255,1)', 0.25);
        ColorTestUtils.expectColorEqual(result, 'rgba(0,0,191,1)', 1);
      });

      it('should apply 75% shade to green color', () => {
        const result = ColorUtils.applyShade('rgba(0,255,0,1)', 0.75);
        ColorTestUtils.expectColorEqual(result, 'rgba(0,64,0,1)', 1);
      });

      it('should preserve alpha when applying shade', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,0.5)', 0.5);
        ColorTestUtils.expectColorEqual(result, 'rgba(128,0,0,0.5)', 1);
      });
    });

    describe('Boundary value tests', () => {
      it('should handle 0% shade (no change)', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,1)', 0);
        expect(result).toBe('rgba(255,0,0,1)');
      });

      it('should handle 100% shade (black)', () => {
        const result = ColorUtils.applyShade('rgba(255,255,255,1)', 1);
        expect(result).toBe('rgba(0,0,0,1)');
      });

      it('should handle shade > 1 (clamped behavior)', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,1)', 1.5);
        // Should clamp to black or very dark
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          expect(parseInt(parsed[1])).toBeLessThanOrEqual(255); // Should be valid RGB value
        }
      });

      it('should handle negative shade values gracefully', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,1)', -0.1);
        // Should either clamp to original or brighten
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    describe('Precision tests', () => {
      it('should maintain precision for small shade values', () => {
        const result = ColorUtils.applyShade('rgba(255,0,0,1)', 0.01);
        ColorTestUtils.expectColorEqual(result, 'rgba(252,0,0,1)', 2);
      });

      it('should round properly for decimal results', () => {
        const result = ColorUtils.applyShade('rgba(255,255,255,1)', 0.333);
        // Should handle floating point arithmetic correctly
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    describe('Test data validation', () => {
      testDataHelpers.getAllTransformations()
        .filter(t => t.type === 'shade')
        .forEach(({ name, data }) => {
          it(`should correctly apply shade transformation: ${name}`, () => {
            const inputRgba = ColorTestUtils.hexToRgba(data.input);
            const result = ColorUtils.applyShade(inputRgba, data.factor);
            ColorTestUtils.expectColorEqual(result, data.expected, 2);
          });
        });
    });
  });

  describe('applyTint', () => {
    describe('Basic functionality', () => {
      it('should apply 50% tint to red color', () => {
        const result = ColorUtils.applyTint('rgba(255,0,0,1)', 0.5);
        ColorTestUtils.expectColorEqual(result, 'rgba(255,128,128,1)', 1);
      });

      it('should apply tint to already light colors', () => {
        const result = ColorUtils.applyTint('rgba(200,200,200,1)', 0.5);
        ColorTestUtils.expectColorEqual(result, 'rgba(228,228,228,1)', 2);
      });

      it('should handle 100% tint (white)', () => {
        const result = ColorUtils.applyTint('rgba(255,0,0,1)', 1);
        expect(result).toBe('rgba(255,255,255,1)');
      });

      it('should preserve alpha when applying tint', () => {
        const result = ColorUtils.applyTint('rgba(255,0,0,0.7)', 0.5);
        ColorTestUtils.expectColorEqual(result, 'rgba(255,128,128,0.7)', 1);
      });
    });

    describe('Tint + Shade combination', () => {
      it('should handle tint after shade application', () => {
        const shaded = ColorUtils.applyShade('rgba(255,0,0,1)', 0.5);
        const result = ColorUtils.applyTint(shaded, 0.25);
        // Should be lighter than pure shade but darker than original
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    describe('Test data validation', () => {
      testDataHelpers.getAllTransformations()
        .filter(t => t.type === 'tint')
        .forEach(({ name, data }) => {
          it(`should correctly apply tint transformation: ${name}`, () => {
            const inputRgba = ColorTestUtils.hexToRgba(data.input);
            const result = ColorUtils.applyTint(inputRgba, data.factor);
            ColorTestUtils.expectColorEqual(result, data.expected, 2);
          });
        });
    });
  });

  describe('applySatMod', () => {
    describe('HSL operations', () => {
      it('should increase saturation correctly', () => {
        // Pink color with some saturation
        const result = ColorUtils.applySatMod('rgba(255,128,128,1)', 2);
        // Should become more saturated (more red)
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          expect(r).toBeGreaterThan(g); // Red should dominate more
          expect(r).toBeGreaterThan(b);
        }
      });

      it('should decrease saturation correctly', () => {
        const result = ColorUtils.applySatMod('rgba(255,0,0,1)', 0.5);
        // Should become less saturated (more gray)
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          expect(g).toBeGreaterThan(0); // Should have some green/blue now
          expect(b).toBeGreaterThan(0);
        }
      });

      it('should handle grayscale colors (0 saturation)', () => {
        const result = ColorUtils.applySatMod('rgba(128,128,128,1)', 2);
        // Gray should remain gray regardless of saturation modification
        ColorTestUtils.expectColorEqual(result, 'rgba(128,128,128,1)', 1);
      });

      it('should preserve hue and lightness', () => {
        const original = 'rgba(255,0,0,1)'; // Pure red
        const result = ColorUtils.applySatMod(original, 0.8);
        // Should still be predominantly red
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          expect(r).toBeGreaterThan(g);
          expect(r).toBeGreaterThan(b);
        }
      });
    });
  });

  describe('applyHueMod', () => {
    describe('Hue rotation', () => {
      it('should rotate hue correctly', () => {
        const result = ColorUtils.applyHueMod('rgba(255,0,0,1)', 1/3); // Red to green
        // Should be predominantly green
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          expect(g).toBeGreaterThan(r);
          expect(g).toBeGreaterThan(b);
        }
      });

      it('should handle full rotation (360°)', () => {
        const original = 'rgba(255,0,0,1)';
        const result = ColorUtils.applyHueMod(original, 1);
        // Should return to approximately original color
        ColorTestUtils.expectColorEqual(result, original, 5);
      });

      it('should handle negative rotation', () => {
        const result = ColorUtils.applyHueMod('rgba(255,0,0,1)', -1/3);
        // Should rotate in opposite direction
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });

      it('should preserve saturation and lightness', () => {
        const result = ColorUtils.applyHueMod('rgba(255,0,0,1)', 0.5);
        // Total brightness should be approximately preserved
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          const totalBrightness = r + g + b;
          expect(totalBrightness).toBeGreaterThan(200); // Should maintain overall brightness
        }
      });
    });
  });

  describe('hslToRgb', () => {
    describe('Standard color conversion', () => {
      it('should convert pure red (0°, 100%, 50%)', () => {
        const result = ColorUtils.hslToRgb(0, 1, 0.5);
        expect(result).toEqual({ r: 255, g: 0, b: 0 });
      });

      it('should convert pure green (120°, 100%, 50%)', () => {
        const result = ColorUtils.hslToRgb(1/3, 1, 0.5);
        expect(result).toEqual({ r: 0, g: 255, b: 0 });
      });

      it('should convert pure blue (240°, 100%, 50%)', () => {
        const result = ColorUtils.hslToRgb(2/3, 1, 0.5);
        expect(result).toEqual({ r: 0, g: 0, b: 255 });
      });
    });

    describe('Special cases', () => {
      it('should handle grayscale (any hue, 0% saturation)', () => {
        const result1 = ColorUtils.hslToRgb(0, 0, 0.5);
        const result2 = ColorUtils.hslToRgb(0.5, 0, 0.5);
        expect(result1).toEqual({ r: 128, g: 128, b: 128 });
        expect(result2).toEqual({ r: 128, g: 128, b: 128 });
      });

      it('should handle white (any hue, any saturation, 100% lightness)', () => {
        const result1 = ColorUtils.hslToRgb(0, 1, 1);
        const result2 = ColorUtils.hslToRgb(0.5, 0.5, 1);
        expect(result1).toEqual({ r: 255, g: 255, b: 255 });
        expect(result2).toEqual({ r: 255, g: 255, b: 255 });
      });

      it('should handle black (any hue, any saturation, 0% lightness)', () => {
        const result1 = ColorUtils.hslToRgb(0, 1, 0);
        const result2 = ColorUtils.hslToRgb(0.5, 0.5, 0);
        expect(result1).toEqual({ r: 0, g: 0, b: 0 });
        expect(result2).toEqual({ r: 0, g: 0, b: 0 });
      });
    });

    describe('Precision tests', () => {
      it('should maintain RGB precision within tolerance', () => {
        // Test various HSL combinations
        const testCases = [
          { h: 0.1, s: 0.8, l: 0.3 },
          { h: 0.7, s: 0.6, l: 0.7 },
          { h: 0.9, s: 0.4, l: 0.9 }
        ];

        testCases.forEach(({ h, s, l }) => {
          const result = ColorUtils.hslToRgb(h, s, l);
          expect(result.r).toBeGreaterThanOrEqual(0);
          expect(result.r).toBeLessThanOrEqual(255);
          expect(result.g).toBeGreaterThanOrEqual(0);
          expect(result.g).toBeLessThanOrEqual(255);
          expect(result.b).toBeGreaterThanOrEqual(0);
          expect(result.b).toBeLessThanOrEqual(255);
          expect(Number.isInteger(result.r)).toBe(true);
          expect(Number.isInteger(result.g)).toBe(true);
          expect(Number.isInteger(result.b)).toBe(true);
        });
      });
    });

    describe('Test data validation', () => {
      testDataHelpers.getAllStandardColors().forEach(({ name, data }) => {
        it(`should correctly convert ${name} HSL to RGB`, () => {
          const result = ColorUtils.hslToRgb(data.hsl.h, data.hsl.s, data.hsl.l);
          const expected = data.rgba.match(/rgba\((\d+),(\d+),(\d+),/);
          expect(expected).toBeTruthy();
          if (expected) {
            const [, r, g, b] = expected.map(x => parseInt(x));
            expect(Math.abs(result.r - r)).toBeLessThanOrEqual(2);
            expect(Math.abs(result.g - g)).toBeLessThanOrEqual(2);
            expect(Math.abs(result.b - b)).toBeLessThanOrEqual(2);
          }
        });
      });
    });
  });

  describe('getPresetColor', () => {
    describe('Basic color retrieval', () => {
      it('should return correct hex for basic colors', () => {
        expect(ColorUtils.getPresetColor('red')).toBe('#FF0000');
        expect(ColorUtils.getPresetColor('green')).toBe('#008000');
        expect(ColorUtils.getPresetColor('blue')).toBe('#0000FF');
        expect(ColorUtils.getPresetColor('white')).toBe('#FFFFFF');
        expect(ColorUtils.getPresetColor('black')).toBe('#000000');
      });

      it('should return correct hex for named colors', () => {
        expect(ColorUtils.getPresetColor('crimson')).toBe('#DC143C');
        expect(ColorUtils.getPresetColor('navy')).toBe('#000080');
        expect(ColorUtils.getPresetColor('olive')).toBe('#808000');
        expect(ColorUtils.getPresetColor('silver')).toBe('#C0C0C0');
      });

      it('should handle case sensitivity', () => {
        expect(ColorUtils.getPresetColor('RED')).toBeNull();
        expect(ColorUtils.getPresetColor('Red')).toBeNull();
        expect(ColorUtils.getPresetColor('red')).toBe('#FF0000');
      });

      it('should return null for unknown colors', () => {
        expect(ColorUtils.getPresetColor('unknownColor')).toBeNull();
        expect(ColorUtils.getPresetColor('')).toBeNull();
        expect(ColorUtils.getPresetColor('invalidColorName123')).toBeNull();
      });
    });

    describe('Completeness tests', () => {
      it('should have all basic CSS named colors', () => {
        const basicColors = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black'];
        basicColors.forEach(color => {
          expect(ColorUtils.getPresetColor(color)).toBeTruthy();
          expect(ColorUtils.getPresetColor(color)).toMatch(/^#[0-9A-F]{6}$/);
        });
      });

      it('should return properly formatted hex values', () => {
        Object.entries(colorTestData.presetColors).forEach(([name, expectedHex]) => {
          const result = ColorUtils.getPresetColor(name);
          expect(result).toBe(expectedHex);
          if (result) {
            expect(result).toMatch(/^#[0-9A-F]{6}$/);
          }
        });
      });
    });
  });

  describe('applyAlpha', () => {
    describe('Alpha application', () => {
      it('should apply alpha correctly', () => {
        const result = ColorUtils.applyAlpha('rgba(255,0,0,1)', 0.5);
        expect(result).toBe('rgba(255,0,0,0.5)');
      });

      it('should handle zero alpha (transparent)', () => {
        const result = ColorUtils.applyAlpha('rgba(255,0,0,1)', 0);
        expect(result).toBe('rgba(255,0,0,0)');
      });

      it('should handle full alpha (opaque)', () => {
        const result = ColorUtils.applyAlpha('rgba(255,0,0,0.5)', 1);
        expect(result).toBe('rgba(255,0,0,1)');
      });

      it('should preserve RGB values', () => {
        const result = ColorUtils.applyAlpha('rgba(123,45,67,1)', 0.7);
        expect(result).toBe('rgba(123,45,67,0.7)');
      });
    });

    describe('Test data validation', () => {
      testDataHelpers.getAllTransformations()
        .filter(t => t.type === 'alpha')
        .forEach(({ name, data }) => {
          it(`should correctly apply alpha transformation: ${name}`, () => {
            const inputRgba = ColorTestUtils.hexToRgba(data.input);
            const result = ColorUtils.applyAlpha(inputRgba, data.factor);
            expect(result).toBe(data.expected);
          });
        });
    });
  });

  describe('toHex utility', () => {
    it('should convert numbers to hex correctly', () => {
      expect(ColorUtils.toHex(0)).toBe('00');
      expect(ColorUtils.toHex(255)).toBe('ff');
      expect(ColorUtils.toHex(128)).toBe('80');
      expect(ColorUtils.toHex(15)).toBe('0f');
    });

    it('should clamp values to valid range', () => {
      expect(ColorUtils.toHex(-10)).toBe('00');
      expect(ColorUtils.toHex(300)).toBe('ff');
      expect(ColorUtils.toHex(256)).toBe('ff');
    });

    it('should handle decimal values', () => {
      expect(ColorUtils.toHex(127.7)).toBe('80');
      expect(ColorUtils.toHex(127.3)).toBe('7f');
    });
  });

  describe('Integration with existing toRgba', () => {
    it('should work seamlessly with color transformation chain', () => {
      const color = '#FF0000';
      const rgba = ColorUtils.toRgba(color);
      const shaded = ColorUtils.applyShade(rgba, 0.5);
      const tinted = ColorUtils.applyTint(shaded, 0.25);
      const withAlpha = ColorUtils.applyAlpha(tinted, 0.8);
      
      expect(ColorTestUtils.isValidRgbaFormat(withAlpha)).toBe(true);
      expect(withAlpha).toMatch(/rgba\(\d+,\d+,\d+,0\.8\)/);
    });
  });
});