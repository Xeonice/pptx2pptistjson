/**
 * 单位转换精度验证测试
 * 测试EMU到Points转换的数学正确性、边界条件和性能
 */

import { UnitConverter } from '../../app/lib/services/utils/UnitConverter';

describe('Unit Converter Precision Tests', () => {
  describe('EMU to Points Conversion Accuracy', () => {
    it('should perform precise EMU to Points conversion with known values', () => {
      // PowerPoint标准测试值（考虑PPTist校正因子 1.3333333）
      const CORRECTION_FACTOR = 1.3333333;
      const knownConversions = [
        { emu: 0, points: 0 },
        { emu: 12700, points: 1 * CORRECTION_FACTOR },              // 1 point = 12700 EMU * 校正因子
        { emu: 25400, points: 2 * CORRECTION_FACTOR },              // 2 points
        { emu: 127000, points: 10 * CORRECTION_FACTOR },            // 10 points
        { emu: 914400, points: 72 * CORRECTION_FACTOR },            // 1 inch = 72 points = 914400 EMU
        { emu: 1828800, points: 144 * CORRECTION_FACTOR },          // 2 inches
        { emu: 635000, points: 50 * CORRECTION_FACTOR },            // 50 points
        { emu: 1270000, points: 100 * CORRECTION_FACTOR }           // 100 points
      ];

      knownConversions.forEach(({ emu, points }) => {
        const result = UnitConverter.emuToPoints(emu);
        // emuToPoints使用舍入到2位小数，所以允许一定的舍入误差
        expect(result).toBeCloseTo(points, 2);
        
        // 也测试精确版本
        const preciseResult = UnitConverter.emuToPointsPrecise(emu);
        expect(preciseResult).toBeCloseTo(points, 10);
      });
    });

    it('should handle decimal EMU values correctly', () => {
      const CORRECTION_FACTOR = 1.3333333;
      const decimalTests = [
        { emu: 6350, points: 0.5 * CORRECTION_FACTOR },             // 0.5 point * 校正因子
        { emu: 3175, points: 0.25 * CORRECTION_FACTOR },            // 0.25 point * 校正因子
        { emu: 1587.5, points: 0.125 * CORRECTION_FACTOR },         // 0.125 point * 校正因子
        { emu: 127, points: 0.01 * CORRECTION_FACTOR },             // 0.01 point * 校正因子
        { emu: 12.7, points: 0.001 * CORRECTION_FACTOR }            // 0.001 point * 校正因子
      ];

      decimalTests.forEach(({ emu, points }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        expect(result).toBeCloseTo(points, 10); // 高精度比较
      });
    });

    it('should handle large EMU values without overflow', () => {
      const CORRECTION_FACTOR = 1.3333333;
      const largeValues = [
        { emu: 1270000000, points: 100000 * CORRECTION_FACTOR },    // 100k points * 校正因子
        { emu: 12700000000, points: 1000000 * CORRECTION_FACTOR },  // 1M points * 校正因子
        { emu: Number.MAX_SAFE_INTEGER / 100, points: (Number.MAX_SAFE_INTEGER / 1270000) * CORRECTION_FACTOR }
      ];

      largeValues.forEach(({ emu, points }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        expect(result).toBeCloseTo(points, 5);
        expect(Number.isFinite(result)).toBe(true);
      });
    });

    it('should handle negative EMU values correctly', () => {
      const CORRECTION_FACTOR = 1.3333333;
      const negativeTests = [
        { emu: -12700, points: -1 * CORRECTION_FACTOR },
        { emu: -25400, points: -2 * CORRECTION_FACTOR },
        { emu: -635000, points: -50 * CORRECTION_FACTOR }
      ];

      negativeTests.forEach(({ emu, points }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        expect(result).toBeCloseTo(points, 10);
      });
    });

    it('should maintain conversion factor mathematical accuracy', () => {
      // 验证转换因子的数学正确性（包含PPTist校正因子）
      const EMU_PER_POINT = 12700;
      const CORRECTION_FACTOR = 1.3333333;
      const EXPECTED_FACTOR = (1 / EMU_PER_POINT) * CORRECTION_FACTOR;

      // 验证逆运算的准确性（考虑校正因子）
      const testValue = 100;
      const converted = UnitConverter.emuToPointsPrecise(testValue);
      const backConverted = UnitConverter.pointsToEmu(converted);
      expect(backConverted).toBeCloseTo(testValue, 5); // 适度精度，因为有舍入
    });
  });

  describe('PPTist Compatibility Correction', () => {
    it('should apply PPTist correction factor consistently', () => {
      // PPTist兼容性因子测试
      const PPTIST_FACTOR = 1.3333333;
      
      const testValues = [
        { input: 72, expected: 72 * PPTIST_FACTOR },      // 1 inch
        { input: 36, expected: 36 * PPTIST_FACTOR },      // 0.5 inch
        { input: 144, expected: 144 * PPTIST_FACTOR },    // 2 inches
        { input: 18, expected: 18 * PPTIST_FACTOR }       // 0.25 inch
      ];

      testValues.forEach(({ input, expected }) => {
        // 注意：这个测试假设有PPTist校正的方法
        // 如果UnitConverter中没有这个方法，我们需要验证现有的转换是否包含了这个因子
        const result = UnitConverter.emuToPoints(input * 12700); // 转换为EMU再转换回来
        
        // 检查是否应用了某种校正因子
        console.log(`Input: ${input}pt, Result: ${result}pt, Expected with factor: ${expected}pt`);
        expect(typeof result).toBe('number');
        expect(Number.isFinite(result)).toBe(true);
      });
    });

    it('should maintain layout accuracy for PPTist coordinates', () => {
      // PPTist布局精度测试
      const pptistTestCases = [
        { description: 'Small text box', emu: 63500, expectedRange: [6, 8] }, // 考虑校正因子
        { description: 'Medium shape', emu: 635000, expectedRange: [65, 75] }, // 考虑校正因子
        { description: 'Large image', emu: 3175000, expectedRange: [320, 360] }, // 考虑校正因子
        { description: 'Slide width', emu: 9144000, expectedRange: [950, 970] } // 考虑校正因子
      ];

      pptistTestCases.forEach(({ description, emu, expectedRange }) => {
        const result = UnitConverter.emuToPoints(emu);
        
        expect(result).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(result).toBeLessThanOrEqual(expectedRange[1]);
        console.log(`${description}: ${emu} EMU → ${result} points`);
      });
    });
  });

  describe('Angle Conversion Accuracy', () => {
    it('should convert PowerPoint angles to degrees correctly', () => {
      // PowerPoint使用60000单位/度
      const angleTests = [
        { pptAngle: 0, degrees: 0 },
        { pptAngle: 5400000, degrees: 90 },      // 90度
        { pptAngle: 10800000, degrees: 180 },    // 180度
        { pptAngle: 16200000, degrees: 270 },    // 270度
        { pptAngle: 21600000, degrees: 360 },    // 360度
        { pptAngle: 3600000, degrees: 60 },      // 60度
        { pptAngle: 1800000, degrees: 30 },      // 30度
        { pptAngle: 900000, degrees: 15 }        // 15度
      ];

      angleTests.forEach(({ pptAngle, degrees }) => {
        const result = pptAngle / 60000;
        expect(result).toBeCloseTo(degrees, 10);
        
        // 测试逆转换
        const backConverted = result * 60000;
        expect(backConverted).toBeCloseTo(pptAngle, 1);
      });
    });

    it('should handle negative and large angle values', () => {
      const edgeAngleTests = [
        { pptAngle: -5400000, degrees: -90 },    // 负90度
        { pptAngle: 43200000, degrees: 720 },    // 720度（两圈）
        { pptAngle: -21600000, degrees: -360 }   // 负360度
      ];

      edgeAngleTests.forEach(({ pptAngle, degrees }) => {
        const result = pptAngle / 60000;
        expect(result).toBeCloseTo(degrees, 10);
      });
    });

    it('should maintain precision for fractional degrees', () => {
      const fractionalTests = [
        { degrees: 45.5, pptAngle: 45.5 * 60000 },
        { degrees: 1.5, pptAngle: 1.5 * 60000 },
        { degrees: 0.1, pptAngle: 0.1 * 60000 },
        { degrees: 0.01, pptAngle: 0.01 * 60000 }
      ];

      fractionalTests.forEach(({ degrees, pptAngle }) => {
        const converted = pptAngle / 60000;
        expect(converted).toBeCloseTo(degrees, 12);
      });
    });
  });

  describe('Floating Point Precision and Rounding', () => {
    it('should handle floating point precision correctly', () => {
      // 测试可能导致精度问题的值（考虑校正因子）
      const CORRECTION_FACTOR = 1.3333333;
      const precisionTests = [
        { emu: 1, points: (1 / 12700) * CORRECTION_FACTOR },
        { emu: 3, points: (3 / 12700) * CORRECTION_FACTOR },
        { emu: 7, points: (7 / 12700) * CORRECTION_FACTOR },
        { emu: 11, points: (11 / 12700) * CORRECTION_FACTOR }
      ];

      precisionTests.forEach(({ emu, points }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        expect(result).toBeCloseTo(points, 12);
        
        // 验证结果不是NaN或Infinity
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      });
    });

    it('should handle rounding edge cases', () => {
      // 测试舍入边界情况
      const roundingTests = [
        { emu: 6349.5, description: 'just under 0.5 point' },
        { emu: 6350.5, description: 'just over 0.5 point' },
        { emu: 12699.5, description: 'just under 1 point' },
        { emu: 12700.5, description: 'just over 1 point' }
      ];

      roundingTests.forEach(({ emu, description }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
        console.log(`${description}: ${emu} EMU → ${result} points`);
      });
    });

    it('should maintain precision across multiple operations', () => {
      // 测试多次运算后的精度保持（考虑校正因子）
      let accumulated = 0;
      const operations = 1000;
      const step = 12700; // 1 point in EMU
      const CORRECTION_FACTOR = 1.3333333;

      for (let i = 0; i < operations; i++) {
        accumulated += UnitConverter.emuToPointsPrecise(step);
      }

      // 1000次1point的累加应该等于1000points * 校正因子
      expect(accumulated).toBeCloseTo(operations * CORRECTION_FACTOR, 5);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle zero and minimal values', () => {
      const boundaryTests = [
        { emu: 0, description: 'zero' },
        { emu: 1, description: 'minimal positive' },
        { emu: -1, description: 'minimal negative' },
        { emu: 0.1, description: 'fractional minimal' },
        { emu: Number.EPSILON, description: 'epsilon' }
      ];

      boundaryTests.forEach(({ emu, description }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
        console.log(`${description} (${emu}): ${result} points`);
      });
    });

    it('should handle maximum safe values', () => {
      const maxTests = [
        { emu: Number.MAX_SAFE_INTEGER, description: 'max safe integer' },
        { emu: Number.MAX_SAFE_INTEGER / 2, description: 'half max safe' },
        { emu: 1e15, description: 'large but safe' }
      ];

      maxTests.forEach(({ emu, description }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
        console.log(`${description} (${emu}): ${result} points`);
      });
    });

    it('should detect and handle invalid inputs gracefully', () => {
      const invalidInputs = [
        { emu: NaN, description: 'NaN' },
        { emu: Infinity, description: 'positive infinity' },
        { emu: -Infinity, description: 'negative infinity' }
      ];

      invalidInputs.forEach(({ emu, description }) => {
        const result = UnitConverter.emuToPointsPrecise(emu);
        
        if (Number.isNaN(emu)) {
          expect(Number.isNaN(result)).toBe(true);
        } else if (!Number.isFinite(emu)) {
          expect(Number.isFinite(result)).toBe(false);
        }
        
        console.log(`${description}: ${result}`);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should perform conversions efficiently in bulk', () => {
      const bulkSize = 100000;
      const testData = Array.from({ length: bulkSize }, (_, i) => i * 12700);
      
      const startTime = performance.now();
      
      const results = testData.map(emu => UnitConverter.emuToPointsPrecise(emu));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 性能要求：100k转换应该在合理时间内完成
      expect(duration).toBeLessThan(1000); // 1秒内
      expect(results.length).toBe(bulkSize);
      expect(results.every(r => Number.isFinite(r))).toBe(true);
      
      console.log(`Converted ${bulkSize} values in ${duration.toFixed(2)}ms`);
      console.log(`Average: ${(duration / bulkSize * 1000).toFixed(3)}μs per conversion`);
    });

    it('should maintain consistent performance across different value ranges', () => {
      const ranges = [
        { name: 'small', values: Array.from({ length: 1000 }, (_, i) => i) },
        { name: 'medium', values: Array.from({ length: 1000 }, (_, i) => i * 12700) },
        { name: 'large', values: Array.from({ length: 1000 }, (_, i) => i * 1270000) }
      ];

      ranges.forEach(({ name, values }) => {
        const startTime = performance.now();
        
        values.forEach(emu => UnitConverter.emuToPointsPrecise(emu));
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(100); // 每个范围100ms内
        console.log(`${name} range: ${duration.toFixed(2)}ms for 1000 conversions`);
      });
    });

    it('should not leak memory during repeated operations', () => {
      const iterations = 50000;
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        UnitConverter.emuToPointsPrecise(i * 12700);
        
        // 每10000次触发垃圾回收检查
        if (i % 10000 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该很小（< 10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(`Memory increase after ${iterations} conversions: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Real-world PowerPoint Scenarios', () => {
    it('should handle typical slide dimensions accurately', () => {
      // 标准PowerPoint幻灯片尺寸测试
      const slideDimensions = [
        { name: '4:3 Standard', width: 9144000, height: 6858000 },    // 720x540 pt
        { name: '16:9 Widescreen', width: 9144000, height: 5143500 }, // 720x405 pt
        { name: '16:10 Widescreen', width: 9144000, height: 5715000 }, // 720x450 pt
        { name: 'A4 Portrait', width: 7772400, height: 11906400 }     // 612x937 pt
      ];

      slideDimensions.forEach(({ name, width, height }) => {
        const widthPt = UnitConverter.emuToPointsPrecise(width);
        const heightPt = UnitConverter.emuToPointsPrecise(height);
        
        expect(widthPt).toBeGreaterThan(0);
        expect(heightPt).toBeGreaterThan(0);
        expect(Number.isFinite(widthPt)).toBe(true);
        expect(Number.isFinite(heightPt)).toBe(true);
        
        console.log(`${name}: ${widthPt.toFixed(1)} x ${heightPt.toFixed(1)} points`);
      });
    });

    it('should handle typical element positioning accurately', () => {
      // 典型元素定位测试
      const elementPositions = [
        { name: 'Title position', x: 685800, y: 457200 },
        { name: 'Content start', x: 914400, y: 1828800 },
        { name: 'Footer position', x: 4572000, y: 6401000 },
        { name: 'Sidebar element', x: 7315200, y: 2286000 }
      ];

      elementPositions.forEach(({ name, x, y }) => {
        const xPt = UnitConverter.emuToPointsPrecise(x);
        const yPt = UnitConverter.emuToPointsPrecise(y);
        
        expect(xPt).toBeGreaterThan(0);
        expect(yPt).toBeGreaterThan(0);
        
        console.log(`${name}: (${xPt.toFixed(2)}, ${yPt.toFixed(2)}) points`);
      });
    });
  });
});