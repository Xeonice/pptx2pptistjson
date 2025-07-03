import { FontSizeCalculator } from "../../app/lib/services/utils/FontSizeCalculator";

describe("FontSizeCalculator", () => {
  describe("convertPowerPointToWebSize", () => {
    it("should convert PowerPoint font sizes to web sizes with correct precision", () => {
      // 测试常见的字体大小值
      const testCases = [
        { input: "1200", expected: 16 },      // 12pt → 16px
        { input: "1400", expected: 18.66 },   // 14pt → 18.66px
        { input: "1600", expected: 21.33 },   // 16pt → 21.33px
        { input: "1800", expected: 23.99 },   // 18pt → 23.99px (精确计算)
        { input: "2000", expected: 26.66 },   // 20pt → 26.66px
        { input: "2400", expected: 31.99 },   // 24pt → 31.99px (精确计算)
        { input: "3600", expected: 47.99 },   // 36pt → 47.99px (精确计算)
        { input: "4800", expected: 63.98 },   // 48pt → 63.98px (精确计算)
        { input: "7200", expected: 95.98 },   // 72pt → 95.98px (精确计算)
      ];

      testCases.forEach(({ input, expected }) => {
        const result = FontSizeCalculator.convertPowerPointToWebSize(input);
        expect(result).toBe(expected);
      });
    });

    it("should handle numeric inputs", () => {
      const result = FontSizeCalculator.convertPowerPointToWebSize(1800);
      expect(result).toBe(23.99);
    });

    it("should handle decimal inputs correctly", () => {
      // 测试带小数的输入
      const result = FontSizeCalculator.convertPowerPointToWebSize("1850");
      expect(result).toBe(24.66); // (1850 / 100) * 1.333013 ≈ 24.66
    });

    it("should round to 2 decimal places using half-up rounding", () => {
      // 测试舍入规则
      const testCases = [
        { input: "1234", expected: 16.45 },  // 实际计算: 16.449... → 16.45
        { input: "1235", expected: 16.46 },  // 实际计算: 16.463... → 16.46
        { input: "1236", expected: 16.48 },  // 实际计算: 16.476... → 16.48
      ];

      testCases.forEach(({ input, expected }) => {
        const result = FontSizeCalculator.convertPowerPointToWebSize(input);
        expect(result).toBe(expected);
      });
    });

    it("should maintain consistency with old calculation method", () => {
      // 验证与旧方法的一致性
      const oldMethod = (sz: string) => Math.round((parseInt(sz) / 100) * 1.333013 * 100) / 100;
      
      const testValues = ["1200", "1600", "1800", "2400", "3600"];
      
      testValues.forEach(value => {
        const newResult = FontSizeCalculator.convertPowerPointToWebSize(value);
        const oldResult = oldMethod(value);
        
        // 允许微小的误差（由于浮点数精度）
        expect(Math.abs(newResult - oldResult)).toBeLessThan(0.01);
      });
    });
  });

  describe("isValidSize", () => {
    it("should validate correct sizes", () => {
      expect(FontSizeCalculator.isValidSize("1200")).toBe(true);
      expect(FontSizeCalculator.isValidSize(1200)).toBe(true);
      expect(FontSizeCalculator.isValidSize("0.5")).toBe(true);
    });

    it("should reject invalid sizes", () => {
      expect(FontSizeCalculator.isValidSize("")).toBe(false);
      expect(FontSizeCalculator.isValidSize("abc")).toBe(false);
      expect(FontSizeCalculator.isValidSize("0")).toBe(false);
      expect(FontSizeCalculator.isValidSize("-100")).toBe(false);
      expect(FontSizeCalculator.isValidSize(NaN)).toBe(false);
      expect(FontSizeCalculator.isValidSize(Infinity)).toBe(false);
    });
  });

  describe("batchConvert", () => {
    it("should convert multiple sizes", () => {
      const sizes = ["1200", "1600", "2400"];
      const results = FontSizeCalculator.batchConvert(sizes);
      
      expect(results).toEqual([16, 21.33, 31.99]);
    });

    it("should handle mixed string and number inputs", () => {
      const sizes = ["1200", 1600, "2400"];
      const results = FontSizeCalculator.batchConvert(sizes);
      
      expect(results).toEqual([16, 21.33, 31.99]);
    });
  });

  describe("getScalingFactor", () => {
    it("should return the correct scaling factor", () => {
      expect(FontSizeCalculator.getScalingFactor()).toBe(1.333013);
    });
  });

  describe("precision and edge cases", () => {
    it("should handle very small values", () => {
      const result = FontSizeCalculator.convertPowerPointToWebSize("100");
      expect(result).toBe(1.33); // (100 / 100) * 1.333013 ≈ 1.33
    });

    it("should handle very large values", () => {
      const result = FontSizeCalculator.convertPowerPointToWebSize("10000");
      expect(result).toBe(133.3); // (10000 / 100) * 1.333013 ≈ 133.30
    });

    it("should handle values that result in many decimal places", () => {
      const result = FontSizeCalculator.convertPowerPointToWebSize("1111");
      expect(result).toBe(14.81); // (1111 / 100) * 1.333013 ≈ 14.809...
    });
  });
});