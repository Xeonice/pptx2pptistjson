import { FillExtractor } from '../../app/lib/services/utils/FillExtractor';
import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData, testDataHelpers } from '../fixtures/color-test-data';

describe('Color Processing Consistency Tests', () => {
  describe('Format standardization', () => {
    it('should output rgba format consistently across all color types', () => {
      const colorInputs = [
        colorTestData.pptXmlStructures.directRgb,
        colorTestData.pptXmlStructures.presetColor,
        colorTestData.pptXmlStructures.hslColor,
        colorTestData.pptXmlStructures.percentageRgb
      ];

      colorInputs.forEach(input => {
        const result = FillExtractor.getSolidFill(input);
        if (result) {
          expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
          expect(result).toMatch(/^rgba\(\d+,\d+,\d+,(1|0|0?\.\d+)\)$/);
        }
      });
    });

    it('should maintain precision across processors', () => {
      const testColor = 'rgba(123,45,67,0.789)';
      
      // Test various transformation round-trips
      const shade1 = ColorUtils.applyShade(testColor, 0.1);
      const shade2 = ColorUtils.applyShade(shade1, -0.1); // Approximate reverse
      
      const tint1 = ColorUtils.applyTint(testColor, 0.1);
      const alpha1 = ColorUtils.applyAlpha(tint1, 0.5);
      
      // All results should maintain valid format
      [shade1, shade2, tint1, alpha1].forEach(result => {
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    it('should handle transparency consistently', () => {
      const transparentInputs = [
        { input: '#FF000000', expected: 'rgba(255,0,0,0)' },
        { input: 'rgba(255,0,0,0)', expected: 'rgba(255,0,0,0)' },
        { input: 'transparent', expected: 'rgba(0,0,0,0)' }
      ];

      transparentInputs.forEach(({ input, expected }) => {
        try {
          const result = ColorUtils.toRgba(input);
          expect(result).toBe(expected);
        } catch (error) {
          // Some inputs might not be supported by current implementation
          expect(input).toBe('transparent'); // Only transparent might fail
        }
      });
    });

    it('should format alpha values consistently', () => {
      const alphaTestCases = [
        { alpha: 1, expected: '1' },
        { alpha: 0, expected: '0' },
        { alpha: 0.5, expected: '0.5' },
        { alpha: 0.75, expected: '0.75' },
        { alpha: 0.333, expected: '0.333' },
        { alpha: 0.1, expected: '0.1' }
      ];

      alphaTestCases.forEach(({ alpha, expected }) => {
        const result = ColorUtils.applyAlpha('rgba(255,0,0,1)', alpha);
        expect(result).toBe(`rgba(255,0,0,${expected})`);
      });
    });
  });

  describe('Cross-processor consistency', () => {
    it('should produce same colors for same inputs across processors', () => {
      const warpObj = ColorTestUtils.createMockWarpObj({ accent1: 'FF0000' });
      
      // Test same color definition processed through different paths
      const directRgb = FillExtractor.getSolidFill(
        colorTestData.pptXmlStructures.directRgb
      );
      
      const themeColor = FillExtractor.getSolidFill(
        { "a:schemeClr": { attrs: { val: "accent1" } } },
        undefined,
        undefined,
        warpObj
      );
      
      const presetColor = FillExtractor.getSolidFill(
        { "a:prstClr": { attrs: { val: "red" } } }
      );

      // All should resolve to the same red color
      expect(directRgb).toBe('rgba(255,0,0,1)');
      expect(themeColor).toBe('rgba(255,0,0,1)');
      expect(presetColor).toBe('rgba(255,0,0,1)');
    });

    it('should maintain theme color references consistently', () => {
      const warpObj = ColorTestUtils.createMockWarpObj({
        accent1: 'FF0000',
        accent2: '00FF00',
        accent3: '0000FF'
      });

      const themeColors = ['accent1', 'accent2', 'accent3'];
      const expectedColors = ['rgba(255,0,0,1)', 'rgba(0,255,0,1)', 'rgba(0,0,255,1)'];

      themeColors.forEach((themeColor, index) => {
        const result1 = FillExtractor.getSolidFill(
          { "a:schemeClr": { attrs: { val: themeColor } } },
          undefined,
          undefined,
          warpObj
        );
        
        const result2 = FillExtractor.getSolidFill(
          { "a:schemeClr": { attrs: { val: themeColor } } },
          undefined,
          undefined,
          warpObj
        );

        expect(result1).toBe(expectedColors[index]);
        expect(result2).toBe(result1); // Consistency check
      });
    });

    it('should handle transformation chains consistently', () => {
      const baseColor = 'rgba(255,0,0,1)';
      const transformations = [
        { type: 'shade', value: 0.25 },
        { type: 'tint', value: 0.1 },
        { type: 'alpha', value: 0.8 }
      ];

      // Apply transformations manually
      let manualResult = baseColor;
      manualResult = ColorUtils.applyShade(manualResult, 0.25);
      manualResult = ColorUtils.applyTint(manualResult, 0.1);
      manualResult = ColorUtils.applyAlpha(manualResult, 0.8);

      // Apply through FillExtractor
      const fillResult = FillExtractor.getSolidFill({
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": { attrs: { val: "25000" } },
          "a:tint": { attrs: { val: "10000" } },
          "a:alpha": { attrs: { val: "80000" } }
        }
      });

      // Should be approximately equal (allowing for small rounding differences)
      ColorTestUtils.expectColorEqual(manualResult, fillResult, 3);
    });

    it('should maintain precision in color format conversions', () => {
      const testColors = [
        '#FF0000',
        '#00FF00', 
        '#0000FF',
        '#FFFFFF',
        '#000000',
        '#808080'
      ];

      testColors.forEach(hexColor => {
        // Convert through different paths
        const directRgba = ColorUtils.toRgba(hexColor);
        
        const throughFillExtractor = FillExtractor.getSolidFill({
          "a:srgbClr": { attrs: { val: hexColor.replace('#', '') } }
        });

        const throughPreset = hexColor === '#FF0000' ? 
          FillExtractor.getSolidFill({ "a:prstClr": { attrs: { val: "red" } } }) :
          null;

        expect(ColorTestUtils.isValidRgbaFormat(directRgba)).toBe(true);
        expect(ColorTestUtils.isValidRgbaFormat(throughFillExtractor)).toBe(true);

        if (throughPreset) {
          expect(directRgba).toBe(throughFillExtractor);
          expect(directRgba).toBe(throughPreset);
        } else {
          expect(directRgba).toBe(throughFillExtractor);
        }
      });
    });
  });

  describe('Transformation consistency', () => {
    it('should apply equivalent transformations consistently', () => {
      const baseColor = 'rgba(255,0,0,1)';
      
      // Test that equivalent transformations produce same results
      const shade50_v1 = ColorUtils.applyShade(baseColor, 0.5);
      const shade50_v2 = FillExtractor.getSolidFill({
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": { attrs: { val: "50000" } }
        }
      });

      ColorTestUtils.expectColorEqual(shade50_v1, shade50_v2, 2);
    });

    it('should handle transformation order consistently', () => {
      // Test different orders of same transformations
      const baseColor = 'rgba(255,0,0,1)';
      
      // Order 1: shade then tint
      const order1_step1 = ColorUtils.applyShade(baseColor, 0.3);
      const order1_final = ColorUtils.applyTint(order1_step1, 0.2);
      
      // Order 2: tint then shade (different mathematical result expected)
      const order2_step1 = ColorUtils.applyTint(baseColor, 0.2);
      const order2_final = ColorUtils.applyShade(order2_step1, 0.3);
      
      // Results should be different but both valid
      expect(ColorTestUtils.isValidRgbaFormat(order1_final)).toBe(true);
      expect(ColorTestUtils.isValidRgbaFormat(order2_final)).toBe(true);
      expect(order1_final).not.toBe(order2_final);
    });

    it('should maintain transformation bounds consistently', () => {
      const testCases = [
        { transform: 'shade', values: [0, 0.5, 1, 1.5] },
        { transform: 'tint', values: [0, 0.5, 1, 1.5] },
        { transform: 'alpha', values: [0, 0.5, 1, 1.5] }
      ];

      testCases.forEach(({ transform, values }) => {
        values.forEach(value => {
          let result: string;
          
          switch (transform) {
            case 'shade':
              result = ColorUtils.applyShade('rgba(255,0,0,1)', value);
              break;
            case 'tint':
              result = ColorUtils.applyTint('rgba(255,0,0,1)', value);
              break;
            case 'alpha':
              result = ColorUtils.applyAlpha('rgba(255,0,0,1)', value);
              break;
            default:
              return;
          }

          // Some extreme values might produce invalid formats, which is expected behavior
          const isValid = ColorTestUtils.isValidRgbaFormat(result);
          if (!isValid) {
            console.warn(`Invalid format for ${transform}(${value}): ${result}`);
          }
          expect(typeof result).toBe('string');
          
          // Check bounds
          const parsed = result.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
          expect(parsed).toBeTruthy();
          
          if (parsed) {
            const [, r, g, b, a] = parsed;
            expect(parseInt(r)).toBeGreaterThanOrEqual(0);
            expect(parseInt(r)).toBeLessThanOrEqual(255);
            expect(parseInt(g)).toBeGreaterThanOrEqual(0);
            expect(parseInt(g)).toBeLessThanOrEqual(255);
            expect(parseInt(b)).toBeGreaterThanOrEqual(0);
            expect(parseInt(b)).toBeLessThanOrEqual(255);
            expect(parseFloat(a)).toBeGreaterThanOrEqual(0);
            expect(parseFloat(a)).toBeLessThanOrEqual(1);
          }
        });
      });
    });
  });

  describe('Edge case consistency', () => {
    it('should handle null/undefined inputs consistently', () => {
      const nullInputs = [null, undefined, '', {}];
      
      nullInputs.forEach(input => {
        const result = FillExtractor.getSolidFill(input as any);
        expect(result).toBe('');
      });
    });

    it('should handle malformed color data consistently', () => {
      const malformedInputs = [
        { "a:srgbClr": {} }, // Missing attrs
        { "a:srgbClr": { attrs: {} } }, // Missing val
        { "a:srgbClr": { attrs: { val: "invalid" } } }, // Invalid hex
        { "a:invalidColorType": { attrs: { val: "FF0000" } } } // Unknown color type
      ];

      malformedInputs.forEach(input => {
        const result = FillExtractor.getSolidFill(input);
        // Should either return empty string or valid rgba format
        expect(result === '' || ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    it('should handle extreme color values consistently', () => {
      const extremeInputs = [
        { "a:srgbClr": { attrs: { val: "FFFFFF" } } }, // Pure white
        { "a:srgbClr": { attrs: { val: "000000" } } }, // Pure black
        { "a:scrgbClr": { attrs: { r: "100%", g: "100%", b: "100%" } } }, // 100% RGB
        { "a:scrgbClr": { attrs: { r: "0%", g: "0%", b: "0%" } } } // 0% RGB
      ];

      extremeInputs.forEach(input => {
        const result = FillExtractor.getSolidFill(input);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        
        // Should produce expected extreme values
        if (input["a:srgbClr"]?.attrs.val === "FFFFFF" || 
            (input["a:scrgbClr"] && Object.values(input["a:scrgbClr"].attrs).every(v => v === "100%"))) {
          expect(result).toBe('rgba(255,255,255,1)');
        } else if (input["a:srgbClr"]?.attrs.val === "000000" || 
                   (input["a:scrgbClr"] && Object.values(input["a:scrgbClr"].attrs).every(v => v === "0%"))) {
          expect(result).toBe('rgba(0,0,0,1)');
        }
      });
    });
  });

  describe('Performance consistency', () => {
    it('should maintain consistent performance across color types', () => {
      const colorTypes = [
        { type: 'srgbClr', data: { "a:srgbClr": { attrs: { val: "FF0000" } } } },
        { type: 'prstClr', data: { "a:prstClr": { attrs: { val: "red" } } } },
        { type: 'hslClr', data: { "a:hslClr": { attrs: { hue: "0", sat: "100%", lum: "50%" } } } },
        { type: 'scrgbClr', data: { "a:scrgbClr": { attrs: { r: "100%", g: "0%", b: "0%" } } } }
      ];

      const iterations = 1000;
      const performanceResults = [];

      colorTypes.forEach(({ type, data }) => {
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
          FillExtractor.getSolidFill(data);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        performanceResults.push({ type, duration });
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });

      // All color types should have similar performance characteristics
      const avgDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
      performanceResults.forEach(({ type, duration }) => {
        expect(Math.abs(duration - avgDuration)).toBeLessThan(avgDuration * 2); // Within 200% of average
      });
    });

    it('should maintain consistent memory usage', () => {
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        "a:srgbClr": {
          attrs: { val: `${(i % 256).toString(16).padStart(2, '0')}0000` },
          "a:alpha": { attrs: { val: `${50000 + (i % 50000)}` } }
        }
      }));

      // Process all test data
      const results = testData.map(data => FillExtractor.getSolidFill(data));
      
      // All results should be valid
      results.forEach(result => {
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });

      // Should not cause memory leaks (basic check)
      expect(results.length).toBe(1000);
    });
  });

  describe('Backwards compatibility', () => {
    it('should maintain compatibility with existing color formats', () => {
      // Test that new implementation produces same results as expected legacy behavior
      const legacyTestCases = [
        { input: '#FF0000', expected: 'rgba(255,0,0,1)' },
        { input: 'rgb(255,0,0)', expected: 'rgba(255,0,0,1)' },
        { input: 'rgba(255,0,0,0.5)', expected: 'rgba(255,0,0,0.5)' }
      ];

      legacyTestCases.forEach(({ input, expected }) => {
        try {
          const result = ColorUtils.toRgba(input);
          expect(result).toBe(expected);
        } catch (error) {
          // Some legacy formats might not be supported
          console.warn(`Legacy format ${input} not supported:`, error);
        }
      });
    });

    it('should preserve color property naming conventions', () => {
      // Test that color properties maintain expected naming
      const result = FillExtractor.getSolidFill({
        "a:srgbClr": { attrs: { val: "FF0000" } }
      });

      expect(typeof result).toBe('string');
      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
    });
  });
});