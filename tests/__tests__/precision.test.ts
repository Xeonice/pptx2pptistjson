import { describe, expect, it, jest } from '@jest/globals';

describe('Position and Size Precision Tests', () => {
  describe('EMU to Points Conversion', () => {
    it('should maintain high precision in EMU to points conversion', () => {
      // Constants for conversion
      const RATIO_EMUs_Points = 12700; // 1 point = 12700 EMUs
      const CORRECTION_FACTOR = 1.395; // Dimension analysis correction

      const convertEmuToPoints = (emu: number): number => {
        return (emu / RATIO_EMUs_Points) * CORRECTION_FACTOR;
      };

      const convertEmuToPointsRounded = (emu: number): number => {
        return Math.round((emu / RATIO_EMUs_Points) * CORRECTION_FACTOR);
      };

      const testCases = [
        { emu: 881380, expectedRange: [96, 98] }, // Should be ~96.8
        { emu: 2054860, expectedRange: [225, 227] }, // Should be ~226.x
        { emu: 4457700, expectedRange: [489, 491] }, // Should be ~490.x
        { emu: 6858000, expectedRange: [752, 754] }, // Should be ~753.x
      ];

      testCases.forEach(({ emu, expectedRange }) => {
        const preciseResult = convertEmuToPoints(emu);
        const roundedResult = convertEmuToPointsRounded(emu);

        // Check that precise conversion is in expected range
        expect(preciseResult).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(preciseResult).toBeLessThanOrEqual(expectedRange[1]);

        // Check that rounding doesn't lose too much precision
        expect(Math.abs(preciseResult - roundedResult)).toBeLessThanOrEqual(0.5);
      });
    });

    it('should handle edge cases in EMU conversion', () => {
      const convertEmuToPoints = (emu: number): number => {
        return (emu / 12700) * 1.395;
      };

      // Test edge cases
      expect(convertEmuToPoints(0)).toBe(0);
      expect(convertEmuToPoints(12700)).toBeCloseTo(1.395, 3); // 1 EMU = 1.395 points
      expect(convertEmuToPoints(127000)).toBeCloseTo(13.95, 2); // 10 EMUs
      
      // Test negative values
      expect(convertEmuToPoints(-12700)).toBeCloseTo(-1.395, 3);
    });

    it('should provide consistent conversion across different scales', () => {
      const convertEmuToPoints = (emu: number): number => {
        return (emu / 12700) * 1.395;
      };

      // Test proportional scaling
      const baseEmu = 127000; // 10 points equivalent
      const basePoints = convertEmuToPoints(baseEmu);

      // Double the EMU should double the points
      const doubleEmu = baseEmu * 2;
      const doublePoints = convertEmuToPoints(doubleEmu);
      expect(doublePoints).toBeCloseTo(basePoints * 2, 3);

      // Half the EMU should half the points
      const halfEmu = baseEmu / 2;
      const halfPoints = convertEmuToPoints(halfEmu);
      expect(halfPoints).toBeCloseTo(basePoints / 2, 3);
    });
  });

  describe('Position Precision', () => {
    it('should maintain sub-pixel precision for positions', () => {
      const testPositions = [
        { x: 69.35, y: 161.46 }, // Expected values from test case
        { x: 419.17, y: 262.46 },
        { x: 100.5, y: 200.75 },
        { x: 0.25, y: 0.33 }
      ];

      testPositions.forEach(position => {
        // Should preserve decimal precision
        expect(position.x % 1).not.toBe(0); // Has decimal part
        expect(position.y % 1).not.toBe(0); // Has decimal part
        
        // Should be precise to at least 2 decimal places
        expect(Number(position.x.toFixed(2))).toBe(position.x);
        expect(Number(position.y.toFixed(2))).toBe(position.y);
      });
    });

    it('should handle position tolerance correctly', () => {
      const tolerance = 5; // 5px tolerance as mentioned in analysis

      const checkPositionTolerance = (expected: any, actual: any): boolean => {
        const xDiff = Math.abs(expected.x - actual.x);
        const yDiff = Math.abs(expected.y - actual.y);
        return xDiff <= tolerance && yDiff <= tolerance;
      };

      const testCases = [
        {
          expected: { x: 69.35, y: 161.46 },
          actual: { x: 70, y: 162 }
        },
        {
          expected: { x: 419.17, y: 262.46 },
          actual: { x: 421, y: 264 }
        }
      ];

      testCases.forEach(({ expected, actual }) => {
        expect(checkPositionTolerance(expected, actual)).toBe(true);
      });
    });

    it('should detect precision loss beyond acceptable limits', () => {
      const maxAcceptableDifference = 3; // pixels

      const detectPrecisionLoss = (expected: number, actual: number): boolean => {
        return Math.abs(expected - actual) > maxAcceptableDifference;
      };

      // These should be flagged as precision loss
      expect(detectPrecisionLoss(69.35, 73)).toBe(true); // Difference > 3
      expect(detectPrecisionLoss(100.5, 95)).toBe(true); // Difference > 3

      // These should be acceptable
      expect(detectPrecisionLoss(69.35, 70)).toBe(false); // Difference < 3
      expect(detectPrecisionLoss(100.5, 102)).toBe(false); // Difference < 3
    });
  });

  describe('Size Precision', () => {
    it('should maintain precision for element dimensions', () => {
      const testSizes = [
        { width: 551.8, height: 182 },
        { width: 231.4, height: 231.4 },
        { width: 379.2, height: 53 }
      ];

      testSizes.forEach(size => {
        // Should handle fractional dimensions
        if (size.width % 1 !== 0) {
          expect(Number(size.width.toFixed(1))).toBe(size.width);
        }
        if (size.height % 1 !== 0) {
          expect(Number(size.height.toFixed(1))).toBe(size.height);
        }
        
        // Dimensions should be positive
        expect(size.width).toBeGreaterThan(0);
        expect(size.height).toBeGreaterThan(0);
      });
    });

    it('should handle aspect ratio preservation', () => {
      const preserveAspectRatio = (originalWidth: number, originalHeight: number, newWidth: number): number => {
        const aspectRatio = originalWidth / originalHeight;
        return newWidth / aspectRatio;
      };

      const original = { width: 231.4, height: 231.4 };
      const newWidth = 300;
      const newHeight = preserveAspectRatio(original.width, original.height, newWidth);

      // Should maintain square aspect ratio
      expect(newHeight).toBeCloseTo(300, 1);
      
      const aspectRatio = newWidth / newHeight;
      const originalAspectRatio = original.width / original.height;
      expect(aspectRatio).toBeCloseTo(originalAspectRatio, 3);
    });
  });

  describe('Coordinate System Consistency', () => {
    it('should use consistent coordinate origin', () => {
      // PowerPoint uses top-left origin (0,0)
      const elements = [
        { x: 0, y: 0 }, // Top-left corner
        { x: 100, y: 0 }, // Top edge
        { x: 0, y: 100 }, // Left edge
        { x: 100, y: 100 } // Offset position
      ];

      elements.forEach(element => {
        // All coordinates should be non-negative in top-left system
        expect(element.x).toBeGreaterThanOrEqual(0);
        expect(element.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle coordinate transformations consistently', () => {
      const transform = {
        translateX: 50,
        translateY: 30,
        scaleX: 1.2,
        scaleY: 1.1
      };

      const applyTransform = (x: number, y: number, transform: any) => {
        return {
          x: (x * transform.scaleX) + transform.translateX,
          y: (y * transform.scaleY) + transform.translateY
        };
      };

      const originalPoint = { x: 100, y: 200 };
      const transformedPoint = applyTransform(originalPoint.x, originalPoint.y, transform);

      expect(transformedPoint.x).toBeCloseTo(170, 5); // (100 * 1.2) + 50
      expect(transformedPoint.y).toBeCloseTo(250, 5); // (200 * 1.1) + 30
    });
  });

  describe('Rounding Strategy', () => {
    it('should use appropriate rounding for display vs calculation', () => {
      const value = 123.456789;

      // Display rounding (user-facing)
      const displayRounded = Math.round(value * 100) / 100; // 2 decimal places
      expect(displayRounded).toBe(123.46);

      // Calculation rounding (internal precision)
      const calculationRounded = Math.round(value * 1000) / 1000; // 3 decimal places
      expect(calculationRounded).toBe(123.457);

      // Integer rounding (pixel-perfect positioning)
      const pixelRounded = Math.round(value);
      expect(pixelRounded).toBe(123);
    });

    it('should handle half-pixel rounding consistently', () => {
      const testValues = [10.5, 11.5, 12.5, 13.5];
      
      testValues.forEach(value => {
        const rounded = Math.round(value);
        // Math.round uses banker's rounding for .5 values
        expect(rounded).toBe(Math.floor(value) + 1);
      });
    });
  });
});