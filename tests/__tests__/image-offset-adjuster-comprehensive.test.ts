/**
 * ImageOffsetAdjuster 偏移调整综合测试用例
 * 测试偏移调整策略和坐标计算
 */

import { ImageOffsetAdjuster } from "../../app/lib/services/element/processors/ImageOffsetAdjuster";

describe("ImageOffsetAdjuster 偏移调整综合测试", () => {
  describe("基础偏移调整测试", () => {
    it("应该在默认情况下保持原始坐标", () => {
      const originalX = 100;
      const originalY = 50;
      const width = 200;
      const height = 150;
      const slideWidth = 800;
      const slideHeight = 600;

      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        originalX,
        originalY,
        width,
        height,
        slideWidth,
        slideHeight
        // 不提供策略，使用默认行为
      );

      expect(result.x).toBe(originalX);
      expect(result.y).toBe(originalY);
    });

    it("应该处理各种输入参数组合", () => {
      const testCases = [
        // 正常情况
        { x: 100, y: 50, w: 200, h: 150, sw: 800, sh: 600 },
        // 零坐标
        { x: 0, y: 0, w: 100, h: 100, sw: 800, sh: 600 },
        // 负坐标
        { x: -50, y: -30, w: 200, h: 150, sw: 800, sh: 600 },
        // 大尺寸
        { x: 500, y: 400, w: 1000, h: 800, sw: 1920, sh: 1080 },
      ];

      testCases.forEach((testCase, index) => {
        const result = ImageOffsetAdjuster.applyOffsetAdjustment(
          testCase.x,
          testCase.y,
          testCase.w,
          testCase.h,
          testCase.sw,
          testCase.sh
        );

        expect(result.x).toBe(testCase.x);
        expect(result.y).toBe(testCase.y);
        expect(typeof result.x).toBe("number");
        expect(typeof result.y).toBe("number");
      });
    });
  });

  describe("边界情况和异常处理", () => {
    it("应该处理零尺寸输入", () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 50, 0, 0, 800, 600
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
    });

    it("应该处理零尺寸幻灯片", () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 50, 200, 150, 0, 0
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
    });

    it("应该处理负尺寸输入", () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 50, -200, -150, 800, 600
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
    });

    it("应该处理极大的数值", () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        Number.MAX_SAFE_INTEGER / 2,
        Number.MAX_SAFE_INTEGER / 2,
        1000,
        800,
        1920,
        1080
      );

      expect(typeof result.x).toBe("number");
      expect(typeof result.y).toBe("number");
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });
  });

  describe("数值精度和类型安全", () => {
    it("应该处理浮点数输入", () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100.5,
        50.3,
        200.7,
        150.9,
        800.1,
        600.2
      );

      expect(result.x).toBe(100.5);
      expect(result.y).toBe(50.3);
    });

    it("应该保持数值精度", () => {
      const preciseX = 123.456789;
      const preciseY = 987.654321;
      
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        preciseX,
        preciseY,
        200,
        150,
        800,
        600
      );

      expect(result.x).toBe(preciseX);
      expect(result.y).toBe(preciseY);
    });

    it("应该处理NaN和Infinity输入", () => {
      const testCases = [
        { x: NaN, y: 50 },
        { x: 100, y: NaN },
        { x: Infinity, y: 50 },
        { x: 100, y: -Infinity },
      ];

      testCases.forEach(testCase => {
        expect(() => {
          ImageOffsetAdjuster.applyOffsetAdjustment(
            testCase.x,
            testCase.y,
            200,
            150,
            800,
            600
          );
        }).not.toThrow();
      });
    });
  });

  describe("性能测试", () => {
    it("应该在合理时间内处理大量调整请求", () => {
      const startTime = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        ImageOffsetAdjuster.applyOffsetAdjustment(
          i % 1000,
          (i * 2) % 800,
          200,
          150,
          1920,
          1080
        );
      }

      const duration = Date.now() - startTime;
      
      // 10000次调整应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });

    it("应该有效使用内存", () => {
      const initialMemory = process.memoryUsage();
      const results = [];

      // 执行大量操作
      for (let i = 0; i < 1000; i++) {
        const result = ImageOffsetAdjuster.applyOffsetAdjustment(
          i,
          i * 2,
          100 + i,
          80 + i,
          1920,
          1080
        );
        results.push(result);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 内存增长应该在合理范围内（不超过10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      expect(results.length).toBe(1000);
    });
  });

  describe("实际使用场景", () => {
    it("应该在典型PPT转换场景中正常工作", () => {
      // 模拟典型的PowerPoint图片位置
      const typicalScenarios = [
        { x: 127.5, y: 85.2, w: 284.6, h: 192.3, sw: 720, sh: 540 }, // 标准4:3幻灯片
        { x: 256.8, y: 144.7, w: 320.5, h: 180.2, sw: 1280, sh: 720 }, // 16:9幻灯片
        { x: 50.0, y: 50.0, w: 620.0, h: 440.0, sw: 720, sh: 540 }, // 大图片
        { x: 600.5, y: 450.3, w: 80.0, h: 60.0, sw: 720, sh: 540 }, // 小图片
      ];

      typicalScenarios.forEach((scenario, index) => {
        const result = ImageOffsetAdjuster.applyOffsetAdjustment(
          scenario.x,
          scenario.y,
          scenario.w,
          scenario.h,
          scenario.sw,
          scenario.sh
        );

        expect(result.x).toBe(scenario.x);
        expect(result.y).toBe(scenario.y);
      });
    });

    it("应该处理多种幻灯片尺寸", () => {
      const slideSizes = [
        { width: 720, height: 540 },   // 标准4:3
        { width: 1280, height: 720 },  // 16:9 HD
        { width: 1920, height: 1080 }, // 16:9 FHD
        { width: 1024, height: 768 },  // XGA
        { width: 800, height: 600 },   // SVGA
      ];

      const imageX = 100;
      const imageY = 50;
      const imageW = 200;
      const imageH = 150;

      slideSizes.forEach(slideSize => {
        const result = ImageOffsetAdjuster.applyOffsetAdjustment(
          imageX,
          imageY,
          imageW,
          imageH,
          slideSize.width,
          slideSize.height
        );

        expect(result.x).toBe(imageX);
        expect(result.y).toBe(imageY);
      });
    });
  });
});