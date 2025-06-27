import { FillExtractor } from '../../app/lib/services/utils/FillExtractor';
import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData } from '../fixtures/color-test-data';

describe('Color Transformation Chain Tests', () => {
  describe('PowerPoint Transformation Order', () => {
    it('should apply transformations in PowerPoint-compatible order', () => {
      // PowerPoint applies transformations in a specific order:
      // 1. Base color extraction
      // 2. Hue modifications
      // 3. Saturation modifications  
      // 4. Luminance modifications (lumMod, then lumOff)
      // 5. Shade/Tint
      // 6. Alpha

      const complexTransformFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "80000" } },      // 80% alpha (applied last)
          "a:shade": { attrs: { val: "25000" } },      // 25% shade 
          "a:lumMod": { attrs: { val: "90000" } },     // 90% luminance
          "a:lumOff": { attrs: { val: "5000" } },      // +5% luminance offset
          "a:satMod": { attrs: { val: "120000" } },    // 120% saturation
          "a:hueMod": { attrs: { val: "10000" } }      // 10% hue shift
        }
      };

      const result = FillExtractor.getSolidFill(complexTransformFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.8\)/); // Should have alpha=0.8
    });

    it('should handle lumMod + lumOff combination correctly', () => {
      // This is a very common PowerPoint combination
      const lumModOffFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:lumMod": { attrs: { val: "80000" } },  // 80% of original brightness
          "a:lumOff": { attrs: { val: "20000" } }   // +20% brightness offset
        }
      };

      const result = FillExtractor.getSolidFill(lumModOffFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      
      // The result should be: (original * 0.8) + (255 * 0.2) for each component
      // Red: (255 * 0.8) + (255 * 0.2) = 204 + 51 = 255 (clamped)
      // For pure red, this should still be predominantly red
      const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
      expect(parsed).toBeTruthy();
      if (parsed) {
        const [, r, g, b] = parsed.map(x => parseInt(x));
        expect(r).toBeGreaterThan(g);
        expect(r).toBeGreaterThan(b);
      }
    });

    it('should handle shade + tint combination', () => {
      const shadeTintFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": { attrs: { val: "50000" } },  // 50% darker
          "a:tint": { attrs: { val: "25000" } }    // 25% lighter
        }
      };

      const result = FillExtractor.getSolidFill(shadeTintFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      
      // Should be darker than original but lighter than pure shade
      const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
      expect(parsed).toBeTruthy();
      if (parsed) {
        const [, r] = parsed.map(x => parseInt(x));
        expect(r).toBeLessThan(255); // Darker than original
        expect(r).toBeGreaterThan(128); // Lighter than pure 50% shade
      }
    });

    it('should handle saturation + hue modifications', () => {
      const satHueFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:satMod": { attrs: { val: "150000" } }, // 150% saturation
          "a:hueMod": { attrs: { val: "16667" } }   // ~60° hue shift (toward yellow)
        }
      };

      const result = FillExtractor.getSolidFill(satHueFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      
      // Should have shifted toward yellow with increased saturation
      const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
      expect(parsed).toBeTruthy();
      if (parsed) {
        const [, r, g, b] = parsed.map(x => parseInt(x));
        expect(g).toBeGreaterThan(50); // Should have significant green component (yellow = red + green)
        expect(b).toBeLessThan(100); // Should have minimal blue
      }
    });
  });

  describe('Transformation Accuracy', () => {
    it('should maintain mathematical precision through transformation chains', () => {
      // Test precise mathematical operations
      const precisionTestFill = {
        "a:srgbClr": {
          attrs: { val: "808080" }, // Mid gray (128,128,128)
          "a:lumMod": { attrs: { val: "75000" } },  // 75% = 96,96,96
          "a:lumOff": { attrs: { val: "25000" } },  // +25% = +64 = 160,160,160
          "a:alpha": { attrs: { val: "87500" } }    // 87.5% alpha
        }
      };

      const result = FillExtractor.getSolidFill(precisionTestFill);
      expect(result).toMatch(/rgba\(160,160,160,0\.875\)/);
    });

    it('should handle cumulative precision errors gracefully', () => {
      // Multiple small transformations that could accumulate errors
      const cumulativeTestFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": { attrs: { val: "1000" } },    // 1% shade
          "a:tint": { attrs: { val: "500" } },      // 0.5% tint  
          "a:lumMod": { attrs: { val: "99500" } },  // 99.5% luminance
          "a:alpha": { attrs: { val: "99000" } }    // 99% alpha
        }
      };

      const result = FillExtractor.getSolidFill(cumulativeTestFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.99\)/);
    });

    it('should clamp intermediate values to valid ranges', () => {
      const extremeValuesFill = {
        "a:srgbClr": {
          attrs: { val: "FFFFFF" }, // White
          "a:tint": { attrs: { val: "50000" } },    // +50% (already at max)
          "a:lumOff": { attrs: { val: "50000" } },  // +50% more
          "a:alpha": { attrs: { val: "120000" } }   // 120% alpha (should clamp to 100%)
        }
      };

      const result = FillExtractor.getSolidFill(extremeValuesFill);
      expect(result).toBe('rgba(255,255,255,1)'); // Should clamp to valid values
    });
  });

  describe('Common PowerPoint Patterns', () => {
    it('should handle accent color with subtle modifications', () => {
      // Common pattern: accent color with slight darkening
      const warpObj = ColorTestUtils.createMockWarpObj({ accent1: '5B9BD5' });
      const accentWithModFill = {
        "a:schemeClr": {
          attrs: { val: "accent1" },
          "a:lumMod": { attrs: { val: "85000" } }, // 85% luminance (slightly darker)
          "a:satMod": { attrs: { val: "110000" } } // 110% saturation (slightly more vivid)
        }
      };

      const result = FillExtractor.getSolidFill(accentWithModFill, undefined, undefined, warpObj);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      
      // Should be predominantly blue but darker and more saturated
      const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
      expect(parsed).toBeTruthy();
      if (parsed) {
        const [, r, g, b] = parsed.map(x => parseInt(x));
        expect(b).toBeGreaterThan(r); // Blue should dominate
        expect(b).toBeGreaterThan(g);
        expect(b).toBeLessThan(213); // Should be darker than original (213)
      }
    });

    it('should handle dark color with lightening', () => {
      // Common pattern: dark color made lighter for backgrounds
      const warpObj = ColorTestUtils.createMockWarpObj({ dk1: '000000' });
      const darkWithLightFill = {
        "a:schemeClr": {
          attrs: { val: "dk1" },
          "a:tint": { attrs: { val: "95000" } } // 95% tint (very light)
        }
      };

      const result = FillExtractor.getSolidFill(darkWithLightFill, undefined, undefined, warpObj);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      
      // Should be very light gray
      const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
      expect(parsed).toBeTruthy();
      if (parsed) {
        const [, r, g, b] = parsed.map(x => parseInt(x));
        expect(r).toBeGreaterThan(200); // Very light
        expect(r).toEqual(g); // Should be gray
        expect(g).toEqual(b);
      }
    });

    it('should handle text color with transparency', () => {
      // Common pattern: text color with slight transparency
      const textColorFill = {
        "a:srgbClr": {
          attrs: { val: "333333" }, // Dark gray
          "a:alpha": { attrs: { val: "85000" } } // 85% opacity
        }
      };

      const result = FillExtractor.getSolidFill(textColorFill);
      expect(result).toBe('rgba(51,51,51,0.85)');
    });

    it('should handle gradient stop colors', () => {
      // Common pattern: gradient stops with different luminance
      const gradientStops = [
        {
          "a:schemeClr": {
            attrs: { val: "accent1" },
            "a:lumMod": { attrs: { val: "40000" } } // Dark stop
          }
        },
        {
          "a:schemeClr": {
            attrs: { val: "accent1" },
            "a:lumMod": { attrs: { val: "90000" } } // Light stop
          }
        }
      ];

      const warpObj = ColorTestUtils.createMockWarpObj({ accent1: 'FF0000' });
      
      const darkStop = FillExtractor.getSolidFill(gradientStops[0], undefined, undefined, warpObj);
      const lightStop = FillExtractor.getSolidFill(gradientStops[1], undefined, undefined, warpObj);

      expect(ColorTestUtils.isValidRgbaFormat(darkStop)).toBe(true);
      expect(ColorTestUtils.isValidRgbaFormat(lightStop)).toBe(true);
      
      // Dark stop should be darker than light stop
      const darkParsed = darkStop.match(/rgba\((\d+),/);
      const lightParsed = lightStop.match(/rgba\((\d+),/);
      
      if (darkParsed && lightParsed) {
        expect(parseInt(darkParsed[1])).toBeLessThan(parseInt(lightParsed[1]));
      }
    });
  });

  describe('ColorUtils Integration', () => {
    it('should produce consistent results between FillExtractor and direct ColorUtils calls', () => {
      // Test that FillExtractor's transformation chain produces same results as manual ColorUtils calls
      const baseColor = 'rgba(255,0,0,1)';
      
      // Manual transformation chain
      const manual1 = ColorUtils.applyShade(baseColor, 0.5);
      const manual2 = ColorUtils.applyTint(manual1, 0.25);
      const manual3 = ColorUtils.applyAlpha(manual2, 0.8);
      
      // FillExtractor transformation chain
      const fillExtractorFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": { attrs: { val: "50000" } },
          "a:tint": { attrs: { val: "25000" } },
          "a:alpha": { attrs: { val: "80000" } }
        }
      };
      const fillExtractorResult = FillExtractor.getSolidFill(fillExtractorFill);
      
      // Results should be very close (allowing for small rounding differences)
      ColorTestUtils.expectColorEqual(manual3, fillExtractorResult, 3);
    });

    it('should handle HSL-based transformations consistently', () => {
      const baseColor = 'rgba(255,0,0,1)';
      
      // Manual HSL-based transformations
      const manualSat = ColorUtils.applySatMod(baseColor, 1.5);
      const manualHue = ColorUtils.applyHueMod(manualSat, 0.1);
      
      // FillExtractor equivalent
      const hslTransformFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:satMod": { attrs: { val: "150000" } },
          "a:hueMod": { attrs: { val: "10000" } }
        }
      };
      const fillExtractorResult = FillExtractor.getSolidFill(hslTransformFill);
      
      // Should be approximately equal (HSL conversions may have small differences)
      ColorTestUtils.expectColorEqual(manualHue, fillExtractorResult, 5);
    });
  });

  describe('Performance with Transformation Chains', () => {
    it('should handle complex transformation chains efficiently', () => {
      const complexChainFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "90000" } },
          "a:shade": { attrs: { val: "10000" } },
          "a:tint": { attrs: { val: "5000" } },
          "a:lumMod": { attrs: { val: "95000" } },
          "a:lumOff": { attrs: { val: "2000" } },
          "a:satMod": { attrs: { val: "110000" } },
          "a:hueMod": { attrs: { val: "3000" } }
        }
      };

      const startTime = performance.now();
      const result = FillExtractor.getSolidFill(complexChainFill);
      const endTime = performance.now();

      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5); // Should complete quickly
    });

    it('should be efficient with repeated theme color lookups', () => {
      const warpObj = ColorTestUtils.createMockWarpObj({
        accent1: 'FF0000',
        accent2: '00FF00',
        accent3: '0000FF'
      });

      const themeColorFills = [
        { "a:schemeClr": { attrs: { val: "accent1" }, "a:alpha": { attrs: { val: "90000" } } } },
        { "a:schemeClr": { attrs: { val: "accent2" }, "a:shade": { attrs: { val: "25000" } } } },
        { "a:schemeClr": { attrs: { val: "accent3" }, "a:tint": { attrs: { val: "50000" } } } }
      ];

      const startTime = performance.now();
      const results = themeColorFills.map(fill => 
        FillExtractor.getSolidFill(fill, undefined, undefined, warpObj)
      );
      const endTime = performance.now();

      results.forEach(result => {
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
      expect(endTime - startTime).toBeLessThan(10); // Batch should be efficient
    });
  });

  describe('Edge Cases in Transformation Chains', () => {
    it('should handle chains with missing transformation values', () => {
      const partialTransformFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "75000" } },
          "a:shade": { attrs: {} }, // Missing val
          "a:tint": { attrs: { val: "25000" } }
        }
      };

      const result = FillExtractor.getSolidFill(partialTransformFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/); // Should apply alpha and tint, skip shade
    });

    it('should handle chains with invalid transformation values', () => {
      const invalidTransformFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "invalid" } },
          "a:shade": { attrs: { val: "not_a_number" } },
          "a:tint": { attrs: { val: "25000" } } // This should still work
        }
      };

      const result = FillExtractor.getSolidFill(invalidTransformFill);
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      // Should apply only the valid tint transformation
      ColorTestUtils.expectColorEqual(result, 'rgba(255,64,64,1)', 5);
    });

    it('should handle empty transformation chain gracefully', () => {
      const noTransformFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" }
          // No transformations
        }
      };

      const result = FillExtractor.getSolidFill(noTransformFill);
      expect(result).toBe('rgba(255,0,0,1)'); // Should return base color unchanged
    });
  });
});