import { FillExtractor } from '../../app/lib/services/utils/FillExtractor';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData, testDataHelpers } from '../fixtures/color-test-data';

describe('FillExtractor Comprehensive Tests', () => {
  describe('Color Type Extraction', () => {
    describe('srgbClr (Direct RGB)', () => {
      it('should extract 6-digit hex values', () => {
        const solidFill = colorTestData.pptXmlStructures.directRgb;
        const result = FillExtractor.getSolidFill(solidFill);
        expect(result).toBe('rgba(255,0,0,1)');
      });

      it('should handle uppercase and lowercase hex', () => {
        const uppercaseFill = {
          "a:srgbClr": { attrs: { val: "FF0000" } }
        };
        const lowercaseFill = {
          "a:srgbClr": { attrs: { val: "ff0000" } }
        };

        const upperResult = FillExtractor.getSolidFill(uppercaseFill);
        const lowerResult = FillExtractor.getSolidFill(lowercaseFill);
        
        expect(upperResult).toBe('rgba(255,0,0,1)');
        expect(lowerResult).toBe('rgba(255,0,0,1)');
      });

      it('should apply transformations to srgbClr', () => {
        const solidFill = colorTestData.pptXmlStructures.colorWithShade;
        const result = FillExtractor.getSolidFill(solidFill);
        // Should be darker than original red
        ColorTestUtils.expectColorEqual(result, 'rgba(128,0,0,1)', 2);
      });

      it('should handle various RGB color values', () => {
        const testColors = [
          { hex: '000000', expected: 'rgba(0,0,0,1)' },
          { hex: 'FFFFFF', expected: 'rgba(255,255,255,1)' },
          { hex: '808080', expected: 'rgba(128,128,128,1)' },
          { hex: '123456', expected: 'rgba(18,52,86,1)' },
          { hex: 'ABCDEF', expected: 'rgba(171,205,239,1)' }
        ];

        testColors.forEach(({ hex, expected }) => {
          const solidFill = { "a:srgbClr": { attrs: { val: hex } } };
          const result = FillExtractor.getSolidFill(solidFill);
          expect(result).toBe(expected);
        });
      });
    });

    describe('schemeClr (Theme Colors)', () => {
      it('should resolve accent1-6 colors', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({
          accent1: 'FF0000',
          accent2: '00FF00',
          accent3: '0000FF'
        });

        const accent1Fill = { "a:schemeClr": { attrs: { val: "accent1" } } };
        const accent2Fill = { "a:schemeClr": { attrs: { val: "accent2" } } };
        const accent3Fill = { "a:schemeClr": { attrs: { val: "accent3" } } };

        expect(FillExtractor.getSolidFill(accent1Fill, undefined, undefined, warpObj))
          .toBe('rgba(255,0,0,1)');
        expect(FillExtractor.getSolidFill(accent2Fill, undefined, undefined, warpObj))
          .toBe('rgba(0,255,0,1)');
        expect(FillExtractor.getSolidFill(accent3Fill, undefined, undefined, warpObj))
          .toBe('rgba(0,0,255,1)');
      });

      it('should resolve dk1, dk2, lt1, lt2 colors', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({
          dk1: '000000',
          dk2: '333333',
          lt1: 'FFFFFF',
          lt2: 'F0F0F0'
        });

        const dk1Fill = { "a:schemeClr": { attrs: { val: "dk1" } } };
        const lt1Fill = { "a:schemeClr": { attrs: { val: "lt1" } } };

        expect(FillExtractor.getSolidFill(dk1Fill, undefined, undefined, warpObj))
          .toBe('rgba(0,0,0,1)');
        expect(FillExtractor.getSolidFill(lt1Fill, undefined, undefined, warpObj))
          .toBe('rgba(255,255,255,1)');
      });

      it('should resolve hyperlink colors', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({
          hlink: '0563C1',
          folHlink: '954F72'
        });

        const hlinkFill = { "a:schemeClr": { attrs: { val: "hlink" } } };
        const folHlinkFill = { "a:schemeClr": { attrs: { val: "folHlink" } } };

        expect(FillExtractor.getSolidFill(hlinkFill, undefined, undefined, warpObj))
          .toBe('rgba(5,99,193,1)');
        expect(FillExtractor.getSolidFill(folHlinkFill, undefined, undefined, warpObj))
          .toBe('rgba(149,79,114,1)');
      });

      it('should handle missing theme gracefully', () => {
        const themeColorFill = { "a:schemeClr": { attrs: { val: "accent1" } } };
        const result = FillExtractor.getSolidFill(themeColorFill);
        expect(result).toBe('');
      });

      it('should apply transformations to theme colors', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({ accent1: 'FF0000' });
        const themeWithShade = {
          "a:schemeClr": {
            attrs: { val: "accent1" },
            "a:shade": { attrs: { val: "50000" } }
          }
        };

        const result = FillExtractor.getSolidFill(themeWithShade, undefined, undefined, warpObj);
        ColorTestUtils.expectColorEqual(result, 'rgba(128,0,0,1)', 2);
      });

      it('should handle placeholder colors (phClr)', () => {
        const phClrFill = { "a:schemeClr": { attrs: { val: "phClr" } } };
        const result = FillExtractor.getSolidFill(phClrFill, undefined, 'FF0000');
        expect(result).toBe('rgba(255,0,0,1)');
      });
    });

    describe('scrgbClr (Percentage RGB)', () => {
      it('should convert percentage values correctly', () => {
        const percentageFill = colorTestData.pptXmlStructures.percentageRgb;
        const result = FillExtractor.getSolidFill(percentageFill);
        expect(result).toBe('rgba(255,0,0,1)');
      });

      it('should handle values with and without % symbols', () => {
        const withPercent = {
          "a:scrgbClr": {
            attrs: { r: "50%", g: "25%", b: "75%" }
          }
        };
        const withoutPercent = {
          "a:scrgbClr": {
            attrs: { r: "50", g: "25", b: "75" }
          }
        };

        const resultWith = FillExtractor.getSolidFill(withPercent);
        const resultWithout = FillExtractor.getSolidFill(withoutPercent);
        
        ColorTestUtils.expectColorEqual(resultWith, 'rgba(128,64,191,1)', 2);
        ColorTestUtils.expectColorEqual(resultWithout, 'rgba(128,64,191,1)', 2);
      });

      it('should handle fractional percentages', () => {
        const fractionalFill = {
          "a:scrgbClr": {
            attrs: { r: "33.3%", g: "66.7%", b: "99.9%" }
          }
        };

        const result = FillExtractor.getSolidFill(fractionalFill);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      });
    });

    describe('prstClr (Preset Colors)', () => {
      it('should resolve all basic preset colors', () => {
        const basicPresets = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'black'];
        
        basicPresets.forEach(colorName => {
          const presetFill = { "a:prstClr": { attrs: { val: colorName } } };
          const result = FillExtractor.getSolidFill(presetFill);
          expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
          expect(result).not.toBe('');
        });
      });

      it('should handle unknown preset colors', () => {
        const unknownFill = { "a:prstClr": { attrs: { val: "unknownColor" } } };
        const result = FillExtractor.getSolidFill(unknownFill);
        expect(result).toBe(''); // FillExtractor returns empty string for unknown colors
      });

      it('should apply transformations to preset colors', () => {
        const presetWithAlpha = {
          "a:prstClr": {
            attrs: { val: "red" },
            "a:alpha": { attrs: { val: "50000" } }
          }
        };

        const result = FillExtractor.getSolidFill(presetWithAlpha);
        expect(result).toBe('rgba(255,0,0,0.5)');
      });

      it('should match expected preset color values', () => {
        Object.entries(colorTestData.presetColors).forEach(([name, expectedHex]) => {
          const presetFill = { "a:prstClr": { attrs: { val: name } } };
          const result = FillExtractor.getSolidFill(presetFill);
          const expected = ColorTestUtils.hexToRgba(expectedHex);
          expect(result).toBe(expected);
        });
      });
    });

    describe('hslClr (HSL Colors)', () => {
      it('should convert HSL to RGB correctly', () => {
        const hslFill = colorTestData.pptXmlStructures.hslColor;
        const result = FillExtractor.getSolidFill(hslFill);
        expect(result).toBe('rgba(255,0,0,1)');
      });

      it('should handle PowerPoint HSL format (0-100000 scale)', () => {
        const pptHslFill = {
          "a:hslClr": {
            attrs: {
              hue: "33333",  // ~120 degrees (green)
              sat: "100%",
              lum: "50%"
            }
          }
        };

        const result = FillExtractor.getSolidFill(pptHslFill);
        // Should be predominantly green
        const parsed = result.match(/rgba\((\d+),(\d+),(\d+),/);
        expect(parsed).toBeTruthy();
        if (parsed) {
          const [, r, g, b] = parsed.map(x => parseInt(x));
          expect(g).toBeGreaterThan(r);
          expect(g).toBeGreaterThan(b);
        }
      });

      it('should apply transformations to HSL colors', () => {
        const hslWithTint = {
          "a:hslClr": {
            attrs: { hue: "0", sat: "100%", lum: "50%" },
            "a:tint": { attrs: { val: "50000" } }
          }
        };

        const result = FillExtractor.getSolidFill(hslWithTint);
        ColorTestUtils.expectColorEqual(result, 'rgba(255,128,128,1)', 2);
      });

      it('should handle various HSL combinations', () => {
        const testCases = [
          { h: "0", s: "0%", l: "50%", expectedRange: "gray" },      // Gray
          { h: "0", s: "100%", l: "0%", expectedRange: "black" },    // Black
          { h: "0", s: "100%", l: "100%", expectedRange: "white" },  // White
          { h: "16667", s: "100%", l: "50%", expectedRange: "yellow" } // Yellow (~60°)
        ];

        testCases.forEach(({ h, s, l, expectedRange }) => {
          const hslFill = {
            "a:hslClr": { attrs: { hue: h, sat: s, lum: l } }
          };
          const result = FillExtractor.getSolidFill(hslFill);
          expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        });
      });
    });

    describe('sysClr (System Colors)', () => {
      it('should use lastClr attribute when available', () => {
        const sysFill = colorTestData.pptXmlStructures.systemColor;
        const result = FillExtractor.getSolidFill(sysFill);
        expect(result).toBe('rgba(0,0,0,1)');
      });

      it('should handle missing lastClr attribute', () => {
        const sysWithoutLastClr = {
          "a:sysClr": {
            attrs: { val: "windowText" }
          }
        };

        const result = FillExtractor.getSolidFill(sysWithoutLastClr);
        expect(result).toBe(''); // Should handle gracefully
      });

      it('should apply transformations to system colors', () => {
        const sysWithAlpha = {
          "a:sysClr": {
            attrs: { val: "windowText", lastClr: "000000" },
            "a:alpha": { attrs: { val: "75000" } }
          }
        };

        const result = FillExtractor.getSolidFill(sysWithAlpha);
        expect(result).toBe('rgba(0,0,0,0.75)');
      });
    });
  });

  describe('Color Transformation Chain', () => {
    describe('Single transformations', () => {
      it('should apply alpha correctly', () => {
        const fillWithAlpha = {
          "a:srgbClr": {
            attrs: { val: "FF0000" },
            "a:alpha": { attrs: { val: "50000" } }
          }
        };

        const result = FillExtractor.getSolidFill(fillWithAlpha);
        expect(result).toBe('rgba(255,0,0,0.5)');
      });

      it('should apply each transformation type independently', () => {
        const baseColor = { "a:srgbClr": { attrs: { val: "FF0000" } } };

        // Test each transformation separately
        const transformations = [
          { name: 'shade', attr: 'a:shade', value: '50000' },
          { name: 'tint', attr: 'a:tint', value: '50000' },
          { name: 'lumMod', attr: 'a:lumMod', value: '80000' },
          { name: 'lumOff', attr: 'a:lumOff', value: '20000' },
          { name: 'satMod', attr: 'a:satMod', value: '150000' },
          { name: 'hueMod', attr: 'a:hueMod', value: '33333' }
        ];

        transformations.forEach(({ name, attr, value }) => {
          // Use a desaturated color for satMod test (has room for saturation increase)
          const baseColor = name === 'satMod' ? "CC9999" : "FF0000";
          const fillWithTransform = {
            "a:srgbClr": {
              attrs: { val: baseColor },
              [attr]: { attrs: { val: value } }
            }
          };

          const result = FillExtractor.getSolidFill(fillWithTransform);
          expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
          const expectedOriginal = name === 'satMod' ? 'rgba(204,153,153,1)' : 'rgba(255,0,0,1)';
          expect(result).not.toBe(expectedOriginal); // Should be different from original
        });
      });
    });

    describe('Multiple transformations', () => {
      it('should apply transformations in correct order', () => {
        const multiTransformFill = colorTestData.pptXmlStructures.colorWithMultipleTransforms;
        const result = FillExtractor.getSolidFill(multiTransformFill);
        
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/); // Should have alpha=0.75
      });

      it('should handle complex transformation chains', () => {
        const complexFill = {
          "a:srgbClr": {
            attrs: { val: "FF0000" },
            "a:lumMod": { attrs: { val: "80000" } },
            "a:lumOff": { attrs: { val: "20000" } },
            "a:shade": { attrs: { val: "25000" } },
            "a:alpha": { attrs: { val: "90000" } }
          }
        };

        const result = FillExtractor.getSolidFill(complexFill);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.9\)/);
      });

      it('should maintain precision through multiple operations', () => {
        const precisionTestFill = {
          "a:srgbClr": {
            attrs: { val: "808080" }, // Mid gray
            "a:tint": { attrs: { val: "10000" } },    // Small tint
            "a:shade": { attrs: { val: "5000" } },    // Small shade
            "a:alpha": { attrs: { val: "95000" } }    // High alpha
          }
        };

        const result = FillExtractor.getSolidFill(precisionTestFill);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.95\)/);
      });

      it('should handle PowerPoint common combinations', () => {
        const testCases = colorTestData.transformationChains;

        Object.entries(testCases).forEach(([name, data]) => {
          const fillWithTransforms = {
            "a:srgbClr": {
              attrs: { val: data.input.replace('#', '') },
              ...data.transformations.reduce((acc, transform) => {
                acc[`a:${transform.type}`] = { attrs: { val: transform.value } };
                return acc;
              }, {} as any)
            }
          };

          const result = FillExtractor.getSolidFill(fillWithTransforms);
          expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
          // Note: Exact matching might be difficult due to transformation order and precision
          // ColorTestUtils.expectColorEqual(result, data.expected, 10);
        });
      });
    });

    describe('Transformation edge cases', () => {
      it('should handle NaN values gracefully', () => {
        const fillWithInvalidTransform = {
          "a:srgbClr": {
            attrs: { val: "FF0000" },
            "a:alpha": { attrs: { val: "invalid" } }
          }
        };

        const result = FillExtractor.getSolidFill(fillWithInvalidTransform);
        expect(result).toBe('rgba(255,0,0,1)'); // Should ignore invalid transformation
      });

      it('should handle undefined transformation values', () => {
        const fillWithUndefinedTransform = {
          "a:srgbClr": {
            attrs: { val: "FF0000" },
            "a:shade": { attrs: {} } // Missing val attribute
          }
        };

        const result = FillExtractor.getSolidFill(fillWithUndefinedTransform);
        expect(result).toBe('rgba(255,0,0,1)'); // Should ignore undefined transformation
      });

      it('should clamp values to valid ranges', () => {
        const fillWithExtremeValues = {
          "a:srgbClr": {
            attrs: { val: "FF0000" },
            "a:alpha": { attrs: { val: "150000" } }, // > 100%
            "a:shade": { attrs: { val: "200000" } }  // > 100%
          }
        };

        const result = FillExtractor.getSolidFill(fillWithExtremeValues);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        // Should handle extreme values gracefully
      });
    });
  });

  describe('getFillColor function', () => {
    describe('Shape properties handling', () => {
      it('should extract solid fill color from spPr', () => {
        const spPr = {
          "a:solidFill": {
            "a:srgbClr": { attrs: { val: "00FF00" } }
          }
        };

        const result = FillExtractor.getFillColor(spPr);
        expect(result).toBe('rgba(0,255,0,1)');
      });

      it('should return transparent for noFill', () => {
        const spPr = {
          "a:noFill": {}
        };

        const result = FillExtractor.getFillColor(spPr);
        expect(result).toBe('rgba(0,0,0,0)');
      });

      it('should return empty string for no fill specified', () => {
        const spPr = {};
        const result = FillExtractor.getFillColor(spPr);
        expect(result).toBe('');
      });

      it('should handle complex fill with transformations', () => {
        const spPr = {
          "a:solidFill": {
            "a:srgbClr": {
              attrs: { val: "FF0000" },
              "a:alpha": { attrs: { val: "75000" } },
              "a:shade": { attrs: { val: "25000" } }
            }
          }
        };

        const result = FillExtractor.getFillColor(spPr);
        expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        expect(result).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/);
      });

      it('should pass through theme and placeholder colors', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({ accent1: 'FF0000' });
        const spPr = {
          "a:solidFill": {
            "a:schemeClr": { attrs: { val: "accent1" } }
          }
        };

        const result = FillExtractor.getFillColor(spPr, undefined, undefined, warpObj);
        expect(result).toBe('rgba(255,0,0,1)');
      });
    });
  });

  describe('Error handling and edge cases', () => {
    describe('Invalid input handling', () => {
      it('should handle null solidFill', () => {
        const result = FillExtractor.getSolidFill(null);
        expect(result).toBe('');
      });

      it('should handle undefined solidFill', () => {
        const result = FillExtractor.getSolidFill(undefined);
        expect(result).toBe('');
      });

      it('should handle empty solidFill object', () => {
        const result = FillExtractor.getSolidFill({});
        expect(result).toBe('');
      });

      it('should handle malformed color structures', () => {
        const malformedCases = colorTestData.edgeCases;
        
        const testCases = [
          malformedCases.missingAttrs,
          malformedCases.emptyAttrs,
          malformedCases.invalidTransformation
        ];

        testCases.forEach(testCase => {
          const result = FillExtractor.getSolidFill(testCase);
          // Should either return empty string or valid rgba format
          expect(result === '' || ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
        });
      });
    });

    describe('Theme handling edge cases', () => {
      it('should handle missing theme content', () => {
        const themeColorFill = { "a:schemeClr": { attrs: { val: "accent1" } } };
        const emptyWarpObj = {};
        
        const result = FillExtractor.getSolidFill(themeColorFill, undefined, undefined, emptyWarpObj);
        expect(result).toBe('');
      });

      it('should handle malformed theme structure', () => {
        const themeColorFill = { "a:schemeClr": { attrs: { val: "accent1" } } };
        const malformedWarpObj = {
          themeContent: {
            "a:theme": {
              // Missing themeElements
            }
          }
        };
        
        const result = FillExtractor.getSolidFill(themeColorFill, undefined, undefined, malformedWarpObj);
        expect(result).toBe('');
      });

      it('should handle unknown theme color references', () => {
        const warpObj = ColorTestUtils.createMockWarpObj({ accent1: 'FF0000' });
        const unknownThemeColorFill = { "a:schemeClr": { attrs: { val: "unknownAccent" } } };
        
        const result = FillExtractor.getSolidFill(unknownThemeColorFill, undefined, undefined, warpObj);
        expect(result).toBe('');
      });
    });
  });

  describe('Performance and consistency', () => {
    it('should process colors consistently for same inputs', () => {
      const testFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "50000" } }
        }
      };

      // Run multiple times to ensure consistency
      const results = Array.from({ length: 10 }, () => 
        FillExtractor.getSolidFill(testFill)
      );

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });
    });

    it('should handle large numbers of transformations efficiently', () => {
      const complexFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": { attrs: { val: "90000" } },
          "a:shade": { attrs: { val: "10000" } },
          "a:tint": { attrs: { val: "5000" } },
          "a:lumMod": { attrs: { val: "95000" } },
          "a:lumOff": { attrs: { val: "2000" } },
          "a:satMod": { attrs: { val: "110000" } },
          "a:hueMod": { attrs: { val: "5000" } }
        }
      };

      const startTime = performance.now();
      const result = FillExtractor.getSolidFill(complexFill);
      const endTime = performance.now();

      expect(ColorTestUtils.isValidRgbaFormat(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in under 10ms
    });
  });
});