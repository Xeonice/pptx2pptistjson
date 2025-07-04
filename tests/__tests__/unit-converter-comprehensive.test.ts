/**
 * UnitConverter 综合测试套件
 * 测试所有单位转换功能，包括边界条件、精度处理和性能
 */

import { UnitConverter } from '../../app/lib/services/utils/UnitConverter';

describe('UnitConverter - Comprehensive Test Suite', () => {
  describe('EMU to Points Conversions', () => {
    describe('emuToPoints (with rounding)', () => {
      it('should convert EMU to points with default 2 decimal precision', () => {
        expect(UnitConverter.emuToPoints(12700)).toBe(1.33);
        expect(UnitConverter.emuToPoints(25400)).toBe(2.67);
        expect(UnitConverter.emuToPoints(38100)).toBe(4.00);
        expect(UnitConverter.emuToPoints(50800)).toBe(5.33);
      });

      it('should handle custom precision levels', () => {
        expect(UnitConverter.emuToPoints(12700, 0)).toBe(1);
        expect(UnitConverter.emuToPoints(12700, 1)).toBe(1.3);
        expect(UnitConverter.emuToPoints(12700, 3)).toBe(1.333);
        expect(UnitConverter.emuToPoints(12700, 4)).toBe(1.3333);
        expect(UnitConverter.emuToPoints(12700, 5)).toBe(1.33333);
      });

      it('should handle zero and negative values', () => {
        expect(UnitConverter.emuToPoints(0)).toBe(0);
        expect(UnitConverter.emuToPoints(-12700)).toBe(-1.33);
        expect(UnitConverter.emuToPoints(-25400)).toBe(-2.67);
      });

      it('should handle very large values', () => {
        expect(UnitConverter.emuToPoints(12700000)).toBe(1333.33);
        expect(UnitConverter.emuToPoints(127000000)).toBe(13333.33);
        expect(UnitConverter.emuToPoints(Number.MAX_SAFE_INTEGER)).toBeGreaterThan(0);
      });

      it('should handle very small values', () => {
        expect(UnitConverter.emuToPoints(1)).toBe(0);
        expect(UnitConverter.emuToPoints(10)).toBe(0);
        expect(UnitConverter.emuToPoints(100)).toBe(0.01);
        expect(UnitConverter.emuToPoints(127)).toBe(0.01);
      });

      it('should handle NaN and Infinity', () => {
        expect(UnitConverter.emuToPoints(NaN)).toBe(NaN);
        expect(UnitConverter.emuToPoints(Infinity)).toBe(Infinity);
        expect(UnitConverter.emuToPoints(-Infinity)).toBe(-Infinity);
      });
    });

    describe('emuToPointsPrecise (no rounding)', () => {
      it('should convert EMU to points with full precision', () => {
        const result1 = UnitConverter.emuToPointsPrecise(12700);
        expect(result1).toBeCloseTo(1.3333333, 7);
        
        const result2 = UnitConverter.emuToPointsPrecise(25400);
        expect(result2).toBeCloseTo(2.6666666, 7);
        
        const result3 = UnitConverter.emuToPointsPrecise(6350);
        expect(result3).toBeCloseTo(0.6666666, 6);
      });

      it('should maintain precision for fractional EMU values', () => {
        expect(UnitConverter.emuToPointsPrecise(1270)).toBeCloseTo(0.13333333, 8);
        expect(UnitConverter.emuToPointsPrecise(127)).toBeCloseTo(0.013333333, 9);
        expect(UnitConverter.emuToPointsPrecise(12.7)).toBeCloseTo(0.0013333333, 10);
      });

      it('should handle edge cases', () => {
        expect(UnitConverter.emuToPointsPrecise(0)).toBe(0);
        expect(UnitConverter.emuToPointsPrecise(-12700)).toBeCloseTo(-1.3333333, 7);
        expect(UnitConverter.emuToPointsPrecise(NaN)).toBe(NaN);
      });
    });

    describe('emuToPointsRounded (integer output)', () => {
      it('should round to nearest integer for pixel-perfect positioning', () => {
        expect(UnitConverter.emuToPointsRounded(12700)).toBe(1);
        expect(UnitConverter.emuToPointsRounded(19050)).toBe(2);
        expect(UnitConverter.emuToPointsRounded(25400)).toBe(3);
        expect(UnitConverter.emuToPointsRounded(31750)).toBe(3);
        expect(UnitConverter.emuToPointsRounded(38100)).toBe(4);
      });

      it('should handle rounding edge cases', () => {
        // Test cases that should round properly
        expect(UnitConverter.emuToPointsRounded(9525)).toBe(1); // Should round to 1
        expect(UnitConverter.emuToPointsRounded(19050)).toBe(2); // Should round to 2 (1.5 * 1.3333333 ≈ 2.0)
      });

      it('should handle negative values with proper rounding', () => {
        expect(UnitConverter.emuToPointsRounded(-12700)).toBe(-1);
        expect(UnitConverter.emuToPointsRounded(-19050)).toBe(-2);
        expect(UnitConverter.emuToPointsRounded(-25400)).toBe(-3);
      });
    });
  });

  describe('Points to EMU Conversion', () => {
    it('should convert points back to EMU', () => {
      expect(UnitConverter.pointsToEmu(1)).toBe(9525);
      expect(UnitConverter.pointsToEmu(2)).toBe(19050);
      expect(UnitConverter.pointsToEmu(10)).toBe(95250);
      expect(UnitConverter.pointsToEmu(72)).toBe(685800);
    });

    it('should handle fractional points', () => {
      expect(UnitConverter.pointsToEmu(0.5)).toBe(4763);
      expect(UnitConverter.pointsToEmu(1.5)).toBe(14288);
      expect(UnitConverter.pointsToEmu(2.75)).toBe(26194);
    });

    it('should handle edge cases', () => {
      expect(UnitConverter.pointsToEmu(0)).toBe(0);
      expect(UnitConverter.pointsToEmu(-1)).toBe(-9525);
      expect(UnitConverter.pointsToEmu(NaN)).toBe(NaN);
    });

    it('should have reasonable round-trip accuracy', () => {
      const testValues = [1, 2, 5, 10, 50, 100, 500];
      testValues.forEach(points => {
        const emu = UnitConverter.pointsToEmu(points);
        const backToPoints = UnitConverter.emuToPointsPrecise(emu);
        expect(backToPoints).toBeCloseTo(points, 1);
      });
    });
  });

  describe('Position Tolerance Checking', () => {
    it('should check if values are within default tolerance', () => {
      expect(UnitConverter.isWithinTolerance(100, 100)).toBe(true);
      expect(UnitConverter.isWithinTolerance(100, 103)).toBe(true);
      expect(UnitConverter.isWithinTolerance(100, 97)).toBe(true);
      expect(UnitConverter.isWithinTolerance(100, 104)).toBe(false);
      expect(UnitConverter.isWithinTolerance(100, 96)).toBe(false);
    });

    it('should check with custom tolerance', () => {
      expect(UnitConverter.isWithinTolerance(100, 105, 5)).toBe(true);
      expect(UnitConverter.isWithinTolerance(100, 106, 5)).toBe(false);
      expect(UnitConverter.isWithinTolerance(100, 95, 5)).toBe(true);
      expect(UnitConverter.isWithinTolerance(100, 94, 5)).toBe(false);
    });

    it('should handle zero and negative values', () => {
      expect(UnitConverter.isWithinTolerance(0, 0)).toBe(true);
      expect(UnitConverter.isWithinTolerance(0, 3)).toBe(true);
      expect(UnitConverter.isWithinTolerance(0, -3)).toBe(true);
      expect(UnitConverter.isWithinTolerance(-100, -103)).toBe(true);
      expect(UnitConverter.isWithinTolerance(-100, -97)).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(UnitConverter.isWithinTolerance(NaN, NaN)).toBe(false);
      expect(UnitConverter.isWithinTolerance(100, NaN)).toBe(false);
      expect(UnitConverter.isWithinTolerance(Infinity, Infinity)).toBe(false);
      expect(UnitConverter.isWithinTolerance(100, Infinity)).toBe(false);
    });
  });

  describe('Position Normalization', () => {
    it('should normalize position values with default precision', () => {
      expect(UnitConverter.normalizePosition(1.234567)).toBe(1.23);
      expect(UnitConverter.normalizePosition(1.235)).toBe(1.24);
      expect(UnitConverter.normalizePosition(1.2)).toBe(1.2);
      expect(UnitConverter.normalizePosition(1)).toBe(1);
    });

    it('should normalize with custom precision', () => {
      expect(UnitConverter.normalizePosition(1.234567, 0)).toBe(1);
      expect(UnitConverter.normalizePosition(1.234567, 1)).toBe(1.2);
      expect(UnitConverter.normalizePosition(1.234567, 3)).toBe(1.235);
      expect(UnitConverter.normalizePosition(1.234567, 4)).toBe(1.2346);
    });

    it('should handle negative values', () => {
      expect(UnitConverter.normalizePosition(-1.234567)).toBe(-1.23);
      expect(UnitConverter.normalizePosition(-1.235)).toBe(-1.24);
      expect(UnitConverter.normalizePosition(-1.999)).toBe(-2);
    });

    it('should handle edge cases', () => {
      expect(UnitConverter.normalizePosition(0)).toBe(0);
      expect(UnitConverter.normalizePosition(NaN)).toBe(NaN);
      expect(UnitConverter.normalizePosition(Infinity)).toBe(Infinity);
      expect(UnitConverter.normalizePosition(-Infinity)).toBe(-Infinity);
    });
  });

  describe('Angle Conversions', () => {
    describe('angleToDegreesFromEmu', () => {
      it('should convert PowerPoint angle units to degrees', () => {
        expect(UnitConverter.angleToDegreesFromEmu(0)).toBe(0);
        expect(UnitConverter.angleToDegreesFromEmu(60000)).toBe(1);
        expect(UnitConverter.angleToDegreesFromEmu(5400000)).toBe(90);
        expect(UnitConverter.angleToDegreesFromEmu(10800000)).toBe(180);
        expect(UnitConverter.angleToDegreesFromEmu(21600000)).toBe(360);
      });

      it('should handle fractional degrees', () => {
        expect(UnitConverter.angleToDegreesFromEmu(30000)).toBe(0.5);
        expect(UnitConverter.angleToDegreesFromEmu(15000)).toBe(0.25);
        expect(UnitConverter.angleToDegreesFromEmu(45000)).toBe(0.75);
      });

      it('should handle negative angles', () => {
        expect(UnitConverter.angleToDegreesFromEmu(-60000)).toBe(-1);
        expect(UnitConverter.angleToDegreesFromEmu(-5400000)).toBe(-90);
        expect(UnitConverter.angleToDegreesFromEmu(-10800000)).toBe(-180);
      });

      it('should handle angles beyond 360 degrees', () => {
        expect(UnitConverter.angleToDegreesFromEmu(25200000)).toBe(420);
        expect(UnitConverter.angleToDegreesFromEmu(43200000)).toBe(720);
        expect(UnitConverter.angleToDegreesFromEmu(-25200000)).toBe(-420);
      });
    });

    describe('degreesToAngleEmu', () => {
      it('should convert degrees to PowerPoint angle units', () => {
        expect(UnitConverter.degreesToAngleEmu(0)).toBe(0);
        expect(UnitConverter.degreesToAngleEmu(1)).toBe(60000);
        expect(UnitConverter.degreesToAngleEmu(90)).toBe(5400000);
        expect(UnitConverter.degreesToAngleEmu(180)).toBe(10800000);
        expect(UnitConverter.degreesToAngleEmu(360)).toBe(21600000);
      });

      it('should handle fractional degrees', () => {
        expect(UnitConverter.degreesToAngleEmu(0.5)).toBe(30000);
        expect(UnitConverter.degreesToAngleEmu(0.25)).toBe(15000);
        expect(UnitConverter.degreesToAngleEmu(45.5)).toBe(2730000);
      });

      it('should handle negative degrees', () => {
        expect(UnitConverter.degreesToAngleEmu(-1)).toBe(-60000);
        expect(UnitConverter.degreesToAngleEmu(-90)).toBe(-5400000);
        expect(UnitConverter.degreesToAngleEmu(-180)).toBe(-10800000);
      });
    });

    it('should have accurate round-trip conversion for angles', () => {
      const testAngles = [0, 45, 90, 135, 180, 270, 360, -45, -90, 0.5, 30.25];
      testAngles.forEach(degrees => {
        const emu = UnitConverter.degreesToAngleEmu(degrees);
        const backToDegrees = UnitConverter.angleToDegreesFromEmu(emu);
        expect(backToDegrees).toBeCloseTo(degrees, 10);
      });
    });
  });

  describe('Performance and Precision', () => {
    it('should maintain consistent precision across multiple operations', () => {
      const emu = 12345678;
      const result1 = UnitConverter.emuToPoints(emu);
      const result2 = UnitConverter.emuToPoints(emu);
      expect(result1).toBe(result2);
    });

    it('should handle precision edge cases correctly', () => {
      // Test values that might cause floating point precision issues
      const problematicValues = [
        0.1 * 12700,
        0.2 * 12700,
        0.3 * 12700,
        0.7 * 12700,
        0.9 * 12700
      ];

      problematicValues.forEach(emu => {
        const points = UnitConverter.emuToPoints(emu, 10);
        const precise = UnitConverter.emuToPointsPrecise(emu);
        // Check that rounded version is close to precise version
        expect(Math.abs(points - precise)).toBeLessThan(0.0000000001);
      });
    });
  });
});