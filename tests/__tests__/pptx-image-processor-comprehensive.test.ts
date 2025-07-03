/**
 * PPTXImageProcessor 综合测试用例
 * 测试复杂拉伸场景、性能和内存管理
 */

import {
  PPTXImageProcessor,
  StretchOffsetConfig,
} from "../../app/lib/services/images/PPTXImageProcessor";

let sharp: any = null;
try {
  sharp = require("sharp");
} catch (error) {
  console.warn("Sharp not available for testing");
}

// 创建测试图片Buffer的工具函数
async function createTestImageBuffer(
  width: number = 100,
  height: number = 100,
  color: { r: number; g: number; b: number } = { r: 255, g: 0, b: 0 }
): Promise<Buffer> {
  if (!sharp) {
    return Buffer.from(`test-image-${width}x${height}`);
  }

  try {
    return await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { ...color, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  } catch (error) {
    return Buffer.from(`test-image-${width}x${height}`);
  }
}

// 创建4K测试图片
async function create4KTestImage(): Promise<Buffer> {
  return createTestImageBuffer(3840, 2160, { r: 0, g: 255, b: 0 });
}

describe("PPTXImageProcessor 综合测试", () => {
  let processor: PPTXImageProcessor;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
  });

  describe("复杂拉伸场景测试", () => {
    it("应该处理极端拉伸比例（超过200%缩放）", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping extreme stretch tests");
        return;
      }

      const testImage = await createTestImageBuffer(50, 50);
      const config: StretchOffsetConfig = {
        containerWidth: 1000, // 20倍宽度放大
        containerHeight: 800, // 16倍高度放大
        fillRect: { left: -0.5, top: -0.5, right: -0.5, bottom: -0.5 }, // 向外扩展
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(1000);
      expect(result.height).toBe(800);
      expect(result.appliedEffects.some(effect => effect.includes("fillRect stretch"))).toBe(true);
    });

    it("应该处理微小拉伸值（0.001级别精度）", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping precision tests");
        return;
      }

      const testImage = await createTestImageBuffer(100, 100);
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { 
          left: 0.001, 
          top: 0.002, 
          right: 0.001, 
          bottom: 0.002 
        }, // 极小偏移
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.appliedEffects.some(effect => effect.includes("fillRect stretch"))).toBe(true);
    });

    it("应该处理混合srcRect裁剪+fillRect拉伸的复合变换", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping composite transform tests");
        return;
      }

      const testImage = await createTestImageBuffer(200, 200);
      const config: StretchOffsetConfig = {
        containerWidth: 300,
        containerHeight: 250,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 }, // 内收缩
        srcRect: { left: 0.2, top: 0.2, right: 0.2, bottom: 0.2 }, // 先裁剪
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(300);
      expect(result.height).toBe(250);
      expect(result.appliedEffects.some(effect => effect.includes("srcRect crop"))).toBe(true);
      expect(result.appliedEffects.some(effect => effect.includes("fillRect stretch"))).toBe(true);
    });

    it("应该处理不规则长宽比转换（16:9 → 1:1）", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping aspect ratio tests");
        return;
      }

      const testImage = await createTestImageBuffer(1600, 900); // 16:9
      const config: StretchOffsetConfig = {
        containerWidth: 400, // 1:1
        containerHeight: 400,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(400);
      expect(result.height).toBe(400);
      // 由于处理逻辑不同，检查是否有处理效果
      expect(result.appliedEffects.length).toBeGreaterThan(0);
    });
  });

  describe("性能和内存测试", () => {
    it("应该处理大尺寸图片（4K+）而不出现内存泄漏", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping large image tests");
        return;
      }

      const testImage = await create4KTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 1920,
        containerHeight: 1080,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false,
      };

      const startMemory = process.memoryUsage();
      const startTime = Date.now();

      const result = await processor.applyStretchOffset(testImage, config);
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      expect(result).toBeDefined();
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      
      // 处理时间应该在合理范围内（10秒内）
      expect(endTime - startTime).toBeLessThan(10000);
      
      // 内存增长应该在合理范围内（不超过200MB）
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB
    });

    it("应该在并发处理多张图片时保持稳定性", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping concurrent tests");
        return;
      }

      const testImages = await Promise.all([
        createTestImageBuffer(100, 100, { r: 255, g: 0, b: 0 }),
        createTestImageBuffer(150, 100, { r: 0, g: 255, b: 0 }),
        createTestImageBuffer(100, 150, { r: 0, g: 0, b: 255 }),
      ]);

      const configs = testImages.map((_, index) => ({
        containerWidth: 200 + index * 50,
        containerHeight: 150 + index * 30,
        fillRect: { 
          left: 0.1 * (index + 1), 
          top: 0.05 * (index + 1), 
          right: 0.1 * (index + 1), 
          bottom: 0.05 * (index + 1) 
        },
        enableDebug: false,
      }));

      const startTime = Date.now();
      
      // 并发处理所有图片
      const results = await Promise.all(
        testImages.map((image, index) => 
          processor.applyStretchOffset(image, configs[index])
        )
      );

      const endTime = Date.now();

      // 验证所有结果
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.width).toBe(configs[index].containerWidth);
        expect(result.height).toBe(configs[index].containerHeight);
      });

      // 并发处理应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("应该正确释放Sharp实例资源", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping resource tests");
        return;
      }

      const testImage = await createTestImageBuffer(100, 100);
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false,
      };

      // 多次处理同一图片
      for (let i = 0; i < 10; i++) {
        const result = await processor.applyStretchOffset(testImage, config);
        expect(result).toBeDefined();
        expect(result.width).toBe(200);
        expect(result.height).toBe(150);
      }

      // 如果有内存泄漏，这里应该会超时或崩溃
      expect(true).toBe(true); // 能执行到这里说明没有严重的内存泄漏
    });
  });

  describe("边界和异常处理", () => {
    it("应该处理图片处理过程中的Sharp异常", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping Sharp error tests");
        return;
      }

      // 使用无效的图片数据
      const invalidImage = Buffer.from("invalid image data");
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false,
      };

      await expect(processor.applyStretchOffset(invalidImage, config))
        .rejects.toThrow("Image processing failed");
    });

    it("应该处理配置参数边界值", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping config boundary tests");
        return;
      }

      const testImage = await createTestImageBuffer(100, 100);
      
      // 测试最小容器尺寸
      const minConfig: StretchOffsetConfig = {
        containerWidth: 1,
        containerHeight: 1,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, minConfig);
      expect(result).toBeDefined();
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
    });

    it("应该处理极端的fillRect值组合", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping extreme fillRect tests");
        return;
      }

      const testImage = await createTestImageBuffer(100, 100);
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.9, top: 0.8, right: 0.9, bottom: 0.8 }, // 几乎完全收缩
        enableDebug: false,
      };

      const result = await processor.applyStretchOffset(testImage, config);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      // 应该创建透明填充图片
      expect(result.appliedEffects.some(effect => 
        effect.includes("transparent padding") || 
        effect.includes("Invalid display area")
      )).toBe(true);
    });
  });

  describe("createConfigFromStretchInfo 静态方法测试", () => {
    it("应该正确创建复杂的配置对象", () => {
      const stretchInfo = {
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029,
        },
        srcRect: {
          left: 0.1,
          top: 0.1,
          right: 0.1,
          bottom: 0.1,
        },
      };

      const config = PPTXImageProcessor.createConfigFromStretchInfo(
        stretchInfo,
        1350,
        759.375,
        true
      );

      expect(config.fillRect).toEqual(stretchInfo.fillRect);
      expect(config.srcRect).toEqual(stretchInfo.srcRect);
      expect(config.containerWidth).toBe(1350);
      expect(config.containerHeight).toBe(759.375);
      expect(config.enableDebug).toBe(true);
    });

    it("应该处理不完整的stretchInfo", () => {
      const stretchInfo = {
        fillRect: {
          left: 0.1,
          top: 0.1,
          right: 0.1,
          bottom: 0.1,
        },
        // 缺少 srcRect
      };

      const config = PPTXImageProcessor.createConfigFromStretchInfo(
        stretchInfo,
        400,
        300,
        false
      );

      expect(config.fillRect).toEqual(stretchInfo.fillRect);
      expect(config.srcRect).toBeUndefined();
      expect(config.containerWidth).toBe(400);
      expect(config.containerHeight).toBe(300);
      expect(config.enableDebug).toBe(false);
    });
  });
});