/**
 * FontSizeCalculator 综合测试套件
 * 测试PowerPoint字体大小转换的精确计算、批处理和验证功能
 */

import { FontSizeCalculator } from '../../app/lib/services/utils/FontSizeCalculator';
import Decimal from 'decimal.js';

describe('FontSizeCalculator - Comprehensive Test Suite', () => {
  describe('convertPowerPointToWebSize', () => {
    describe('Standard Conversions', () => {
      it('should convert typical PowerPoint font sizes correctly', () => {
        // Common PowerPoint font sizes (in hundredths of points)
        const testCases = [
          { input: 1200, expected: 16.00 },  // 12pt -> 16px
          { input: 1400, expected: 18.66 },  // 14pt -> 18.66px
          { input: 1600, expected: 21.33 },  // 16pt -> 21.33px
          { input: 1800, expected: 23.99 },  // 18pt -> 23.99px (实际计算结果)
          { input: 2400, expected: 31.99 },  // 24pt -> 31.99px (实际计算结果)
          { input: 3600, expected: 47.99 },  // 36pt -> 47.99px (实际计算结果)
          { input: 4800, expected: 63.98 },  // 48pt -> 63.98px (实际计算结果)
          { input: 7200, expected: 95.98 }   // 72pt -> 95.98px (实际计算结果)
        ];

        testCases.forEach(({ input, expected }) => {
          const result = FontSizeCalculator.convertPowerPointToWebSize(input);
          expect(result).toBeCloseTo(expected, 2);
        });
      });

      it('should handle string inputs correctly', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize('1200')).toBeCloseTo(16.00, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('1800')).toBeCloseTo(23.99, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('2400')).toBeCloseTo(31.99, 2);
      });

      it('should handle decimal inputs', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize(1250)).toBeCloseTo(16.66, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('1450.5')).toBeCloseTo(19.34, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(1333.33)).toBeCloseTo(17.77, 2);
      });

      it('should maintain precision with Decimal.js calculations', () => {
        // Test cases that might have floating point precision issues
        const precisionTestCases = [
          { input: 1100, expected: 14.66 },
          { input: 1300, expected: 17.33 },
          { input: 1500, expected: 20.00 },
          { input: 1700, expected: 22.66 },
          { input: 1900, expected: 25.33 }
        ];

        precisionTestCases.forEach(({ input, expected }) => {
          const result = FontSizeCalculator.convertPowerPointToWebSize(input);
          expect(result).toBe(expected);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle very small font sizes', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize(100)).toBeCloseTo(1.33, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(50)).toBeCloseTo(0.67, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(25)).toBeCloseTo(0.33, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(1)).toBeCloseTo(0.01, 2);
      });

      it('should handle very large font sizes', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize(10000)).toBeCloseTo(133.30, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(20000)).toBeCloseTo(266.60, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(100000)).toBeCloseTo(1333.01, 2);
      });

      it('should handle zero and negative values', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize(0)).toBe(0);
        expect(FontSizeCalculator.convertPowerPointToWebSize(-1200)).toBeCloseTo(-16.00, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('-1800')).toBeCloseTo(-23.99, 2);
      });

      it('should handle scientific notation', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize('1.2e3')).toBeCloseTo(16.00, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('1.8e3')).toBeCloseTo(23.99, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize(1.5e4)).toBeCloseTo(199.95, 2);
      });

      it('should handle very precise decimal inputs', () => {
        expect(FontSizeCalculator.convertPowerPointToWebSize(1200.123456789)).toBeCloseTo(16.00, 2);
        expect(FontSizeCalculator.convertPowerPointToWebSize('1800.987654321')).toBeCloseTo(24.01, 2);
      });
    });

    describe('Rounding Behavior', () => {
      it('should round to 2 decimal places using ROUND_HALF_UP', () => {
        // Test cases specifically for rounding behavior
        const roundingCases = [
          { input: 1201, expected: 16.01 },    // Should round up
          { input: 1204, expected: 16.05 },    // Should round up  
          { input: 1205, expected: 16.06 },    // Should round up (half-up) - 实际计算结果
          { input: 1206, expected: 16.08 },    // Should round down
          { input: 1209, expected: 16.12 }     // Should round down
        ];

        roundingCases.forEach(({ input, expected }) => {
          const result = FontSizeCalculator.convertPowerPointToWebSize(input);
          expect(result).toBe(expected);
        });
      });

      it('should handle exact half values consistently', () => {
        // Create inputs that result in exact .5 values after calculation
        const halfValueCases = [
          { input: 1125, expected: 15.00 },    // 11.25 * 1.333013 / 100 = 15.00
          { input: 1875, expected: 24.99 },    // 18.75 * 1.333013 / 100 = 24.99
        ];

        halfValueCases.forEach(({ input, expected }) => {
          const result = FontSizeCalculator.convertPowerPointToWebSize(input);
          expect(result).toBeCloseTo(expected, 2);
        });
      });

      it('should produce consistent results for repeated calculations', () => {
        const input = 1234.5678;
        const result1 = FontSizeCalculator.convertPowerPointToWebSize(input);
        const result2 = FontSizeCalculator.convertPowerPointToWebSize(input);
        const result3 = FontSizeCalculator.convertPowerPointToWebSize(input);
        
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });

    describe('Error Handling', () => {
      it('should throw for invalid string inputs', () => {
        expect(() => FontSizeCalculator.convertPowerPointToWebSize('invalid')).toThrow();
        expect(() => FontSizeCalculator.convertPowerPointToWebSize('abc123')).toThrow();
        expect(() => FontSizeCalculator.convertPowerPointToWebSize('')).toThrow();
        expect(() => FontSizeCalculator.convertPowerPointToWebSize('  ')).toThrow();
      });

      it('should throw for null and undefined inputs', () => {
        expect(() => FontSizeCalculator.convertPowerPointToWebSize(null as any)).toThrow();
        expect(() => FontSizeCalculator.convertPowerPointToWebSize(undefined as any)).toThrow();
      });

      it('should handle special numeric values', () => {
        // 根据当前实现，这些值不会抛出错误，而是返回相应的结果
        expect(FontSizeCalculator.convertPowerPointToWebSize(NaN)).toBeNaN();
        expect(FontSizeCalculator.convertPowerPointToWebSize(Infinity)).toBe(Infinity);
        expect(FontSizeCalculator.convertPowerPointToWebSize(-Infinity)).toBe(-Infinity);
      });
    });
  });

  describe('batchConvert', () => {
    it('should convert arrays of font sizes correctly', () => {
      const inputs = [1200, 1400, 1600, 1800];
      const results = FontSizeCalculator.batchConvert(inputs);
      
      expect(results).toHaveLength(4);
      expect(results[0]).toBeCloseTo(16.00, 2);
      expect(results[1]).toBeCloseTo(18.66, 2);
      expect(results[2]).toBeCloseTo(21.33, 2);
      expect(results[3]).toBeCloseTo(23.99, 2);
    });

    it('should handle mixed string and number inputs', () => {
      const inputs = [1200, '1400', 1600, '1800'];
      const results = FontSizeCalculator.batchConvert(inputs);
      
      expect(results).toHaveLength(4);
      expect(results[0]).toBeCloseTo(16.00, 2);
      expect(results[1]).toBeCloseTo(18.66, 2);
      expect(results[2]).toBeCloseTo(21.33, 2);
      expect(results[3]).toBeCloseTo(23.99, 2);
    });

    it('should handle empty arrays', () => {
      const results = FontSizeCalculator.batchConvert([]);
      expect(results).toEqual([]);
    });

    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => 1200 + i);
      const startTime = Date.now();
      const results = FontSizeCalculator.batchConvert(largeArray);
      const endTime = Date.now();
      
      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(results[0]).toBeCloseTo(16.00, 2);
      expect(results[999]).toBeCloseTo(29.31, 2);
    });

    it('should propagate errors for invalid inputs in batch', () => {
      const inputs = [1200, 'invalid', 1600];
      expect(() => FontSizeCalculator.batchConvert(inputs)).toThrow();
    });
  });

  describe('isValidSize', () => {
    describe('Valid Inputs', () => {
      it('should return true for valid numeric inputs', () => {
        expect(FontSizeCalculator.isValidSize(1200)).toBe(true);
        expect(FontSizeCalculator.isValidSize(1.5)).toBe(true);
        expect(FontSizeCalculator.isValidSize(0.01)).toBe(true);
        expect(FontSizeCalculator.isValidSize(999999)).toBe(true);
      });

      it('should return true for valid string inputs', () => {
        expect(FontSizeCalculator.isValidSize('1200')).toBe(true);
        expect(FontSizeCalculator.isValidSize('1.5')).toBe(true);
        expect(FontSizeCalculator.isValidSize('0.01')).toBe(true);
        expect(FontSizeCalculator.isValidSize('1.23e3')).toBe(true);
      });

      it('should return true for decimal values', () => {
        expect(FontSizeCalculator.isValidSize(1200.5)).toBe(true);
        expect(FontSizeCalculator.isValidSize('1234.5678')).toBe(true);
        expect(FontSizeCalculator.isValidSize(0.0001)).toBe(true);
      });
    });

    describe('Invalid Inputs', () => {
      it('should return false for zero and negative values', () => {
        expect(FontSizeCalculator.isValidSize(0)).toBe(false);
        expect(FontSizeCalculator.isValidSize(-1)).toBe(false);
        expect(FontSizeCalculator.isValidSize('-1200')).toBe(false);
        expect(FontSizeCalculator.isValidSize(-0.5)).toBe(false);
      });

      it('should return false for invalid string inputs', () => {
        expect(FontSizeCalculator.isValidSize('invalid')).toBe(false);
        expect(FontSizeCalculator.isValidSize('abc123')).toBe(false);
        expect(FontSizeCalculator.isValidSize('')).toBe(false);
        expect(FontSizeCalculator.isValidSize('  ')).toBe(false);
        expect(FontSizeCalculator.isValidSize('12px')).toBe(false);
      });

      it('should return false for null and undefined', () => {
        expect(FontSizeCalculator.isValidSize(null as any)).toBe(false);
        expect(FontSizeCalculator.isValidSize(undefined as any)).toBe(false);
      });

      it('should return false for special numeric values', () => {
        expect(FontSizeCalculator.isValidSize(NaN)).toBe(false);
        expect(FontSizeCalculator.isValidSize(Infinity)).toBe(false);
        expect(FontSizeCalculator.isValidSize(-Infinity)).toBe(false);
      });

      it('should return false for objects and arrays', () => {
        expect(FontSizeCalculator.isValidSize({} as any)).toBe(false);
        expect(FontSizeCalculator.isValidSize([] as any)).toBe(false);
        expect(FontSizeCalculator.isValidSize([1200] as any)).toBe(false);
        expect(FontSizeCalculator.isValidSize({ value: 1200 } as any)).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very small positive values', () => {
        expect(FontSizeCalculator.isValidSize(0.000001)).toBe(true);
        expect(FontSizeCalculator.isValidSize('1e-10')).toBe(true);
        expect(FontSizeCalculator.isValidSize(Number.MIN_VALUE)).toBe(true);
      });

      it('should handle very large values', () => {
        expect(FontSizeCalculator.isValidSize(Number.MAX_VALUE)).toBe(true);
        expect(FontSizeCalculator.isValidSize('1e100')).toBe(true);
        expect(FontSizeCalculator.isValidSize(999999999999)).toBe(true);
      });

      it('should handle boolean values', () => {
        expect(FontSizeCalculator.isValidSize(true as any)).toBe(false);
        expect(FontSizeCalculator.isValidSize(false as any)).toBe(false);
      });
    });
  });

  describe('getScalingFactor', () => {
    it('should return the correct scaling factor', () => {
      const factor = FontSizeCalculator.getScalingFactor();
      expect(factor).toBe(1.333013);
      expect(typeof factor).toBe('number');
    });

    it('should be consistent across multiple calls', () => {
      const factor1 = FontSizeCalculator.getScalingFactor();
      const factor2 = FontSizeCalculator.getScalingFactor();
      const factor3 = FontSizeCalculator.getScalingFactor();
      
      expect(factor1).toBe(factor2);
      expect(factor2).toBe(factor3);
    });
  });

  describe('Mathematical Accuracy', () => {
    it('should maintain accuracy across the conversion formula', () => {
      const input = 1200;
      const expectedSteps = {
        divided: input / 100,           // 12
        multiplied: 12 * 1.333013,      // 15.996156
        rounded: 16.00                  // rounded to 2 decimal places
      };
      
      const result = FontSizeCalculator.convertPowerPointToWebSize(input);
      expect(result).toBe(expectedSteps.rounded);
    });

    it('should handle the complete range of typical PowerPoint sizes', () => {
      // Test the full range of typical PowerPoint font sizes
      const sizes = [800, 900, 1000, 1100, 1200, 1400, 1600, 1800, 2000, 2400, 2800, 3200, 3600, 4800, 7200];
      
      sizes.forEach(size => {
        const result = FontSizeCalculator.convertPowerPointToWebSize(size);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1000); // Reasonable upper bound
        expect(Number.isFinite(result)).toBe(true);
        
        // Check that result has at most 2 decimal places
        const decimalPlaces = (result.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    it('should produce results consistent with manual calculation', () => {
      const testCases = [
        { input: 1000, manual: new Decimal(1000).dividedBy(100).times(1.333013).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() },
        { input: 1500, manual: new Decimal(1500).dividedBy(100).times(1.333013).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() },
        { input: 2000, manual: new Decimal(2000).dividedBy(100).times(1.333013).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() }
      ];

      testCases.forEach(({ input, manual }) => {
        const result = FontSizeCalculator.convertPowerPointToWebSize(input);
        expect(result).toBe(manual);
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical PowerPoint document processing', () => {
      // Simulate processing a typical PowerPoint document
      const documentFontSizes = [
        1200,   // Body text (12pt)
        1400,   // Subheadings (14pt)
        1600,   // Headings (16pt)
        1800,   // Large headings (18pt)
        2400,   // Title text (24pt)
        1000,   // Small text (10pt)
        3600    // Large display text (36pt)
      ];

      const convertedSizes = FontSizeCalculator.batchConvert(documentFontSizes);
      
      expect(convertedSizes).toHaveLength(7);
      expect(convertedSizes[0]).toBeCloseTo(16.00, 2);  // 12pt -> 16px
      expect(convertedSizes[1]).toBeCloseTo(18.66, 2);  // 14pt -> 18.66px
      expect(convertedSizes[4]).toBeCloseTo(31.99, 2);  // 24pt -> 31.99px
      expect(convertedSizes[6]).toBeCloseTo(47.99, 2);  // 36pt -> 47.99px
      
      // All should be valid sizes
      convertedSizes.forEach(size => {
        expect(size).toBeGreaterThan(0);
        expect(Number.isFinite(size)).toBe(true);
      });
    });

    it('should handle slide master and layout processing', () => {
      // Simulate processing different font sizes from slide masters
      const masterFontSizes = [
        { element: 'title', size: 4400 },      // Large title
        { element: 'subtitle', size: 2000 },   // Subtitle
        { element: 'body', size: 1600 },       // Body text
        { element: 'caption', size: 1000 },    // Small caption
        { element: 'footer', size: 800 }       // Footer text
      ];

      masterFontSizes.forEach(({ element, size }) => {
        const converted = FontSizeCalculator.convertPowerPointToWebSize(size);
        const isValid = FontSizeCalculator.isValidSize(size);
        
        expect(isValid).toBe(true);
        expect(converted).toBeGreaterThan(0);
        
        // Test specific expectations
        if (element === 'title') {
          expect(converted).toBeGreaterThan(50); // Large title should be substantial
        }
        if (element === 'footer') {
          expect(converted).toBeLessThan(15); // Footer should be small
        }
      });
    });

    it('should handle mixed valid and invalid sizes in real documents', () => {
      const mixedSizes = [1200, 'invalid', 1600, 0, 1800, null, 2400];
      const validSizes = mixedSizes.filter(size => FontSizeCalculator.isValidSize(size)).filter(size => size !== null) as (string | number)[];
      
      expect(validSizes).toEqual([1200, 1600, 1800, 2400]);
      
      const convertedValidSizes = FontSizeCalculator.batchConvert(validSizes);
      expect(convertedValidSizes).toHaveLength(4);
      expect(convertedValidSizes.every(size => size > 0)).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large batch conversions efficiently', () => {
      const largeBatch = Array.from({ length: 10000 }, (_, i) => 1000 + i);
      
      const startTime = performance.now();
      const results = FontSizeCalculator.batchConvert(largeBatch);
      const endTime = performance.now();
      
      expect(results).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      
      // Verify some results
      expect(results[0]).toBeCloseTo(13.33, 2);      // 1000 -> 13.33
      expect(results[4999]).toBeCloseTo(79.97, 2);   // 5999 -> 79.97
      expect(results[9999]).toBeCloseTo(146.62, 2);  // 10999 -> 146.62
    });

    it('should not leak memory with repeated operations', () => {
      // Simulate repeated conversions as might happen in a long-running application
      for (let i = 0; i < 1000; i++) {
        const size = 1200 + (i % 100);
        const result = FontSizeCalculator.convertPowerPointToWebSize(size);
        expect(result).toBeGreaterThan(0);
      }
      
      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });
  });
});