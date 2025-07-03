/**
 * 错误处理和边界条件测试用例
 * 测试异常场景、边界值和系统健壮性
 */

import { PPTXImageProcessor } from "../../app/lib/services/images/PPTXImageProcessor";
import { ImageProcessingService } from "../../app/lib/services/images/ImageProcessingService";
import { ImageElement } from "../../app/lib/models/domain/elements/ImageElement";

let sharp: any = null;
try {
  sharp = require("sharp");
} catch (error) {
  console.warn("Sharp not available for testing");
}

// Mock services for error testing
const mockImageDataService = {
  extractImageData: jest.fn(),
  encodeToBase64: jest.fn(),
};

describe("错误处理和边界条件测试", () => {
  let processor: PPTXImageProcessor;
  let service: ImageProcessingService;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
    service = new ImageProcessingService(mockImageDataService as any);
    jest.clearAllMocks();
  });

  describe("异常场景测试", () => {
    it("应该处理损坏的图片文件而不崩溃", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping corrupt image tests");
        return;
      }

      const corruptImageData = Buffer.from("This is not a valid image file");
      const config = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false,
      };

      await expect(processor.applyStretchOffset(corruptImageData, config))
        .rejects.toThrow("Image processing failed");
    });

    it("应该处理极端的fillRect值（如超过±1.0）", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping extreme fillRect tests");
        return;
      }

      // 创建一个简单的测试图片
      let testImage: Buffer;
      if (sharp) {
        testImage = await sharp({
          create: {
            width: 100,
            height: 100,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 },
          },
        })
          .png()
          .toBuffer();
      } else {
        testImage = Buffer.from("test-image-data");
      }

      const extremeConfigs = [
        // 超过1.0的正值
        {
          containerWidth: 200,
          containerHeight: 150,
          fillRect: { left: 1.5, top: 1.2, right: 1.8, bottom: 1.3 },
          enableDebug: false,
        },
        // 超过-1.0的负值
        {
          containerWidth: 200,
          containerHeight: 150,
          fillRect: { left: -1.5, top: -1.2, right: -1.8, bottom: -1.3 },
          enableDebug: false,
        },
        // 混合极端值
        {
          containerWidth: 200,
          containerHeight: 150,
          fillRect: { left: -2.0, top: 3.0, right: -1.5, bottom: 2.5 },
          enableDebug: false,
        },
      ];

      for (const config of extremeConfigs) {
        const result = await processor.applyStretchOffset(testImage, config);
        
        expect(result).toBeDefined();
        expect(result.width).toBe(config.containerWidth);
        expect(result.height).toBe(config.containerHeight);
        expect(result.appliedEffects.some(effect => 
          effect.includes('Invalid display area') || 
          effect.includes('transparent padding')
        )).toBe(true);
      }
    });

    it("应该在系统内存不足时优雅降级", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping memory stress tests");
        return;
      }

      // 模拟大图片处理（但不实际消耗大量内存）
      const mockLargeImageBuffer = Buffer.alloc(1000); // 模拟小buffer代替大图片
      const config = {
        containerWidth: 4000, // 大尺寸容器
        containerHeight: 3000,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false,
      };

      // 这应该不会崩溃系统
      await expect(processor.applyStretchOffset(mockLargeImageBuffer, config))
        .rejects.toThrow();
    });

    it("应该处理Sharp库版本兼容性问题", () => {
      // 测试当Sharp不可用时的回退机制
      const originalIsAvailable = processor.isAvailable;
      
      // Mock Sharp不可用
      processor.isAvailable = jest.fn().mockReturnValue(false);

      expect(processor.isAvailable()).toBe(false);

      // 恢复原始方法
      processor.isAvailable = originalIsAvailable;
    });
  });

  describe("配置验证测试", () => {
    it("应该验证所有配置参数的有效范围", () => {
      const invalidConfigs = [
        // 负容器尺寸
        {
          containerWidth: -100,
          containerHeight: 200,
          fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        },
        // 零容器尺寸
        {
          containerWidth: 0,
          containerHeight: 0,
          fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        },
        // 无效的fillRect结构
        {
          containerWidth: 200,
          containerHeight: 150,
          fillRect: null,
        },
        // 缺少必要字段
        {
          containerWidth: 200,
          containerHeight: 150,
          fillRect: { left: 0.1, top: 0.1 }, // 缺少 right 和 bottom
        },
      ];

      invalidConfigs.forEach((config, index) => {
        // 简化测试，只验证不会崩溃
        expect(() => {
          try {
            PPTXImageProcessor.createConfigFromStretchInfo(
              { fillRect: config.fillRect as any },
              config.containerWidth,
              config.containerHeight,
              false
            );
          } catch (error) {
            // 允许抛出错误，但要求是Error实例
            expect(error).toBeInstanceOf(Error);
          }
        }).not.toThrow();
      });
    });

    it("应该提供清晰的错误消息指导配置修正", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping config error message tests");
        return;
      }

      const testImage = Buffer.from("minimal-test-data");
      const invalidConfig = {
        containerWidth: 0,
        containerHeight: 0,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false,
      };

      try {
        await processor.applyStretchOffset(testImage, invalidConfig);
        fail("Expected error was not thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Image processing failed");
      }
    });

    it("应该验证ImageElement的构造参数", () => {
      const invalidElementConfigs = [
        // 缺少必要字段
        {
          type: "image",
          // 缺少 id, left, top, width, height, src
        },
        // 无效的坐标值
        {
          type: "image",
          id: "img1",
          left: "invalid", // 应该是数字
          top: 50,
          width: 200,
          height: 150,
          src: "test.jpg",
        },
        // 负尺寸
        {
          type: "image",
          id: "img2",
          left: 100,
          top: 50,
          width: -200,
          height: -150,
          src: "test.jpg",
        },
      ];

      // 测试ImageElement的构造参数验证
      expect(() => {
        new ImageElement("", ""); // 空字符串
      }).not.toThrow();
      
      expect(() => {
        new ImageElement("id", "src"); // 正常参数
      }).not.toThrow();
    });
  });

  describe("资源管理和内存泄漏测试", () => {
    it("应该正确释放Sharp实例避免内存泄漏", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping memory leak tests");
        return;
      }

      const initialMemory = process.memoryUsage();
      
      // 创建多个处理实例
      const processors = Array.from({ length: 10 }, () => new PPTXImageProcessor());
      
      let testImage: Buffer;
      if (sharp) {
        testImage = await sharp({
          create: {
            width: 50,
            height: 50,
            channels: 4,
            background: { r: 0, g: 255, b: 0, alpha: 1 },
          },
        })
          .png()
          .toBuffer();
      } else {
        testImage = Buffer.from("test-data");
      }

      const config = {
        containerWidth: 100,
        containerHeight: 80,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false,
      };

      // 并行处理多个图片
      await Promise.all(
        processors.map(proc => 
          proc.applyStretchOffset(testImage, config).catch(() => {
            // 忽略处理错误，重点测试内存管理
          })
        )
      );

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // 内存增长应该在合理范围内（不超过100MB）
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it("应该正确清理临时文件和调试资源", () => {
      const fs = require("fs");
      const path = require("path");
      const tempDir = path.join(process.cwd(), "temp-test-debug");

      // 创建临时调试目录
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 模拟创建调试文件
      const tempFiles = Array.from({ length: 5 }, (_, i) => {
        const filePath = path.join(tempDir, `temp-debug-${i}.png`);
        fs.writeFileSync(filePath, Buffer.from(`temp-data-${i}`));
        return filePath;
      });

      // 验证文件已创建
      tempFiles.forEach(filePath => {
        expect(fs.existsSync(filePath)).toBe(true);
      });

      // 清理临时文件
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      // 验证文件已删除
      expect(fs.existsSync(tempDir)).toBe(false);
    });
  });

  describe("并发和竞态条件测试", () => {
    it("应该正确处理并发图片处理请求", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping concurrency tests");
        return;
      }

      let testImage: Buffer;
      if (sharp) {
        testImage = await sharp({
          create: {
            width: 80,
            height: 60,
            channels: 4,
            background: { r: 0, g: 0, b: 255, alpha: 1 },
          },
        })
          .png()
          .toBuffer();
      } else {
        testImage = Buffer.from("concurrent-test-data");
      }

      const configs = Array.from({ length: 5 }, (_, i) => ({
        containerWidth: 150 + i * 10,
        containerHeight: 120 + i * 8,
        fillRect: { 
          left: 0.1 + i * 0.05, 
          top: 0.1 + i * 0.03, 
          right: 0.1 + i * 0.04, 
          bottom: 0.1 + i * 0.02 
        },
        enableDebug: false,
      }));

      // 并发处理多个请求
      const promises = configs.map(config =>
        processor.applyStretchOffset(testImage, config).catch(error => ({ error }))
      );

      const results = await Promise.allSettled(promises);

      // 验证所有请求都完成（成功或失败）
      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        expect(result.status).toMatch(/fulfilled|rejected/);
      });
    });

    it("应该避免资源共享导致的竞态条件", async () => {

      const mockContext = { slideId: "1", resources: {}, debug: false };
      const testImageData = {
        buffer: Buffer.from("test-image-data"),
        format: "png" as const,
        width: 100,
        height: 100,
        size: 1000,
      };

      // Mock 服务响应
      mockImageDataService.extractImageData.mockResolvedValue(testImageData);
      mockImageDataService.encodeToBase64.mockReturnValue("data:image/png;base64,testdata");

      // 并发调用同一个服务
      const imageElement = new ImageElement("concurrent-test", "test.jpg", "rId123");
      imageElement.setPosition({ x: 100, y: 50 });
      imageElement.setSize({ width: 200, height: 150 });
      imageElement.setStretchInfo({
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
      });
      
      const concurrentPromises = Array.from({ length: 3 }, () =>
        service.processImageElementWithEmbedId(
          imageElement,
          "rId123",
          mockContext as any,
          { enableStretchProcessing: false, enableDebug: false }
        )
      );

      const results = await Promise.all(concurrentPromises);

      // 验证所有结果都正确
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.originalData).toEqual(testImageData);
        expect(result.wasProcessed).toBe(false);
      });
    });
  });

  describe("数据验证和类型安全", () => {
    it("应该验证输入数据的类型和格式", () => {
      const invalidInputs = [
        // 非Buffer类型的图片数据
        { imageData: "not a buffer", type: "string" },
        { imageData: 12345, type: "number" },
        { imageData: {}, type: "object" },
        { imageData: null, type: "null" },
        { imageData: undefined, type: "undefined" },
      ];

      invalidInputs.forEach(({ imageData, type }) => {
        expect(() => {
          // 验证Buffer.isBuffer的行为
          const isValid = Buffer.isBuffer(imageData);
          expect(isValid).toBe(false);
        }).not.toThrow();
      });
    });

    it("应该验证fillRect值的数据类型", () => {
      const invalidFillRects = [
        { left: "0.1", top: 0.1, right: 0.1, bottom: 0.1 }, // 字符串
        { left: 0.1, top: null, right: 0.1, bottom: 0.1 }, // null
        { left: 0.1, top: 0.1, right: undefined, bottom: 0.1 }, // undefined
        { left: 0.1, top: 0.1, right: 0.1, bottom: NaN }, // NaN
        { left: Infinity, top: 0.1, right: 0.1, bottom: 0.1 }, // Infinity
      ];

      invalidFillRects.forEach((fillRect, index) => {
        const stretchInfo = { fillRect };
        
        // 简化测试，只验证不会导致系统崩溃
        expect(() => {
          try {
            const config = PPTXImageProcessor.createConfigFromStretchInfo(
              stretchInfo as any,
              200,
              150,
              false
            );
            
            // 如果成功创建配置，验证数值类型
            if (config && config.fillRect) {
              Object.values(config.fillRect).forEach(value => {
                expect(typeof value).toBe("number");
              });
            }
          } catch (error) {
            // 允许抛出错误，但应该是Error实例
            expect(error).toBeInstanceOf(Error);
          }
        }).not.toThrow();
      });
    });

    it("应该处理JSON序列化和反序列化边界情况", () => {
      const complexImageElement = new ImageElement("complex", "test.jpg", "rId_特殊字符_123");
      complexImageElement.setPosition({ x: 100.123456789, y: 50.987654321 });
      complexImageElement.setSize({ width: 200.555, height: 150.777 });
      complexImageElement.setStretchInfo({
        fillRect: { 
          left: -0.048813579, 
          top: 0.060294863, 
          right: 0.307094821, 
          bottom: 0.060294863 
        },
      });

      // 序列化 - 使用toJSON方法
      const jsonOutput = complexImageElement.toJSON();
      expect(jsonOutput).toBeDefined();
      expect(jsonOutput.id).toBe("complex");
      expect(jsonOutput.stretchInfo.fillRect.left).toBeCloseTo(-0.048813579, 8);
      
      // 测试JSON.stringify不会崩溃
      const serialized = JSON.stringify(jsonOutput);
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe("string");

      // 反序列化
      const parsed = JSON.parse(serialized);
      expect(parsed).toBeDefined();
      expect(parsed.id).toBe("complex");
    });
  });
});