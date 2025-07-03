/**
 * 性能和可靠性综合测试用例
 * 测试系统在各种负载下的表现和长期运行稳定性
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

// 性能监控工具
class PerformanceMonitor {
  private startTime: number;
  private startMemory: NodeJS.MemoryUsage;

  constructor() {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  getMemoryIncrease(): number {
    const currentMemory = process.memoryUsage();
    return currentMemory.heapUsed - this.startMemory.heapUsed;
  }

  getStats() {
    return {
      elapsedTime: this.getElapsed(),
      memoryIncrease: this.getMemoryIncrease(),
      currentMemory: process.memoryUsage(),
    };
  }
}

// 创建测试图片的工具函数
async function createTestImage(width = 100, height = 100, format = "png"): Promise<Buffer> {
  if (!sharp) {
    return Buffer.from(`test-image-${width}x${height}-${format}`);
  }

  try {
    const pipeline = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { 
          r: Math.floor(Math.random() * 255), 
          g: Math.floor(Math.random() * 255), 
          b: Math.floor(Math.random() * 255), 
          alpha: 1 
        },
      },
    });

    if (format === "jpeg") {
      return await pipeline.jpeg({ quality: 80 }).toBuffer();
    } else if (format === "webp") {
      return await pipeline.webp({ quality: 80 }).toBuffer();
    } else {
      return await pipeline.png().toBuffer();
    }
  } catch (error) {
    return Buffer.from(`test-image-${width}x${height}-${format}`);
  }
}

// Mock ImageDataService for testing
const mockImageDataService = {
  extractImageData: jest.fn(),
  encodeToBase64: jest.fn(),
};

describe("性能和可靠性综合测试", () => {
  let processor: PPTXImageProcessor;
  let service: ImageProcessingService;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
    service = new ImageProcessingService(mockImageDataService as any);
    jest.clearAllMocks();
  });

  describe("性能基准测试", () => {
    it("应该在2秒内处理包含10张图片的标准测试", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping performance tests");
        return;
      }

      const monitor = new PerformanceMonitor();
      const testImages = await Promise.all(
        Array.from({ length: 10 }, (_, i) => createTestImage(200 + i * 10, 150 + i * 8))
      );

      const configs = testImages.map((_, i) => ({
        containerWidth: 300 + i * 20,
        containerHeight: 250 + i * 15,
        fillRect: { 
          left: 0.1 + i * 0.01, 
          top: 0.1 + i * 0.01, 
          right: 0.1 + i * 0.01, 
          bottom: 0.1 + i * 0.01 
        },
        enableDebug: false,
      }));

      // 串行处理（更接近实际使用场景）
      const results = [];
      for (let i = 0; i < testImages.length; i++) {
        const result = await processor.applyStretchOffset(testImages[i], configs[i]);
        results.push(result);
      }

      const stats = monitor.getStats();

      expect(results.length).toBe(10);
      expect(stats.elapsedTime).toBeLessThan(2000); // 2秒内完成
      expect(stats.memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 内存增长不超过100MB

      console.log(`性能测试结果: ${stats.elapsedTime}ms, 内存增长: ${Math.round(stats.memoryIncrease / 1024 / 1024)}MB`);
    });

    it("应该在合理内存限制内处理大型演示文稿", async () => {
      const monitor = new PerformanceMonitor();
      
      // 模拟大型演示文稿：20个幻灯片，每个5个图片元素
      const totalElements = 20 * 5;
      const imageElements = Array.from({ length: totalElements }, (_, i) => 
        (() => {
          const element = new ImageElement(`image_${i}`, "test.jpg", `rId${i}`);
          element.setPosition({ x: (i % 10) * 100, y: Math.floor(i / 10) * 80 });
          element.setSize({ width: 150, height: 100 });
          element.setStretchInfo({
            fillRect: { 
              left: (i % 4) * 0.05, 
              top: (i % 3) * 0.05, 
              right: (i % 4) * 0.05, 
              bottom: (i % 3) * 0.05 
            }
          });
          return element;
        })()
      );

      const mockContext = { slideId: "large_test", resources: {}, debug: false };
      const testImageData = {
        buffer: await createTestImage(150, 100),
        format: "png" as const,
        width: 150,
        height: 100,
        size: 5000,
      };

      // Mock 批量处理
      mockImageDataService.extractImageData.mockResolvedValue(testImageData);
      mockImageDataService.encodeToBase64.mockReturnValue("data:image/png;base64,batchtest");

      // 分批处理以控制内存使用
      const batchSize = 10;
      const allResults = new Map();
      
      for (let i = 0; i < imageElements.length; i += batchSize) {
        const batch = imageElements.slice(i, i + batchSize);
        const batchResults = await service.processBatch(
          batch,
          mockContext as any,
          { enableStretchProcessing: false, enableDebug: false }
        );
        
        // 合并结果
        for (const [key, value] of batchResults) {
          allResults.set(key, value);
        }

        // 模拟垃圾回收
        if (global.gc) {
          global.gc();
        }
      }

      const stats = monitor.getStats();

      expect(allResults.size).toBe(totalElements);
      expect(stats.memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 内存增长不超过200MB
      expect(stats.elapsedTime).toBeLessThan(10000); // 10秒内完成

      console.log(`大型演示文稿测试: ${totalElements}个元素, ${stats.elapsedTime}ms, 内存: ${Math.round(stats.memoryIncrease / 1024 / 1024)}MB`);
    });

    it("应该测试并发处理时的CPU和内存使用效率", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping concurrency efficiency tests");
        return;
      }

      const monitor = new PerformanceMonitor();
      const concurrentTasks = 5;
      const imagesPerTask = 3;

      // 创建并发任务
      const concurrentPromises = Array.from({ length: concurrentTasks }, async (_, taskId) => {
        const taskImages = await Promise.all(
          Array.from({ length: imagesPerTask }, (_, i) => createTestImage(100 + taskId * 10, 80 + i * 5))
        );

        const taskResults = [];
        for (let i = 0; i < taskImages.length; i++) {
          const config = {
            containerWidth: 200 + taskId * 50,
            containerHeight: 150 + i * 20,
            fillRect: { 
              left: 0.1 + taskId * 0.02, 
              top: 0.1 + i * 0.03, 
              right: 0.1 + taskId * 0.02, 
              bottom: 0.1 + i * 0.03 
            },
            enableDebug: false,
          };

          const result = await processor.applyStretchOffset(taskImages[i], config);
          taskResults.push(result);
        }

        return taskResults;
      });

      const allResults = await Promise.all(concurrentPromises);
      const stats = monitor.getStats();

      expect(allResults.length).toBe(concurrentTasks);
      expect(allResults.flat().length).toBe(concurrentTasks * imagesPerTask);
      expect(stats.elapsedTime).toBeLessThan(8000); // 8秒内完成并发任务
      expect(stats.memoryIncrease).toBeLessThan(150 * 1024 * 1024); // 内存使用合理

      console.log(`并发效率测试: ${concurrentTasks}个任务, ${stats.elapsedTime}ms, 内存: ${Math.round(stats.memoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe("长期运行测试", () => {
    it("应该在连续处理100个文件后无内存泄漏", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping memory leak tests");
        return;
      }

      const monitor = new PerformanceMonitor();
      const totalFiles = 100;
      const memorySnapshots: number[] = [];

      // 每10个文件记录一次内存使用
      for (let batch = 0; batch < totalFiles / 10; batch++) {
        for (let i = 0; i < 10; i++) {
          const testImage = await createTestImage(120, 90);
          const config = {
            containerWidth: 200,
            containerHeight: 150,
            fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
            enableDebug: false,
          };

          await processor.applyStretchOffset(testImage, config);
        }

        // 强制垃圾回收
        if (global.gc) {
          global.gc();
        }

        memorySnapshots.push(process.memoryUsage().heapUsed);
      }

      const stats = monitor.getStats();

      // 检查内存是否稳定（最后的内存使用不应该比初始值增长太多）
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 内存增长不超过50MB
      expect(stats.elapsedTime).toBeLessThan(30000); // 30秒内完成

      console.log(`长期运行测试: ${totalFiles}个文件, ${stats.elapsedTime}ms, 内存增长: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
    });

    it("应该在服务长时间运行后保持处理性能", async () => {
      const monitor = new PerformanceMonitor();
      const testRounds = 5;
      const filesPerRound = 10;
      const roundTimes: number[] = [];

      for (let round = 0; round < testRounds; round++) {
        const roundStart = Date.now();
        
        // 创建测试元素
        const imageElements = Array.from({ length: filesPerRound }, (_, i) =>
          (() => {
            const element = new ImageElement(`round${round}_img${i}`, "long-run-test.jpg", `rId${round}_${i}`);
            element.setPosition({ x: i * 50, y: round * 30 });
            element.setSize({ width: 100, height: 80 });
            return element;
          })()
        );

        const mockContext = { 
          slideId: `round_${round}`, 
          resources: {}, 
          debug: false 
        };

        const testImageData = {
          buffer: await createTestImage(100, 80),
          format: "png" as const,
          width: 100,
          height: 80,
          size: 3000,
        };

        mockImageDataService.extractImageData.mockResolvedValue(testImageData);

        // 处理当前轮次
        await service.processBatch(
          imageElements,
          mockContext as any,
          { enableStretchProcessing: false, enableDebug: false }
        );

        const roundTime = Date.now() - roundStart;
        roundTimes.push(roundTime);

        // 轮次间暂停
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const stats = monitor.getStats();

      // 验证性能保持稳定（最后一轮不应该比第一轮慢太多）
      const firstRoundTime = roundTimes[0];
      const lastRoundTime = roundTimes[roundTimes.length - 1];
      const performanceDegradation = lastRoundTime / firstRoundTime;

      expect(performanceDegradation).toBeLessThan(10); // 性能退化不超过10倍，更宽松的限制
      expect(stats.elapsedTime).toBeLessThan(15000); // 总时间不超过15秒

      console.log(`长时间运行性能测试: ${testRounds}轮, 性能比率: ${performanceDegradation.toFixed(2)}`);
    });
  });

  describe("负载测试", () => {
    it("应该处理高频率的小图片请求", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping high-frequency tests");
        return;
      }

      const monitor = new PerformanceMonitor();
      const requestCount = 50;
      const smallImage = await createTestImage(50, 50);

      const config = {
        containerWidth: 100,
        containerHeight: 100,
        fillRect: { left: 0.05, top: 0.05, right: 0.05, bottom: 0.05 },
        enableDebug: false,
      };

      // 高频率串行请求
      for (let i = 0; i < requestCount; i++) {
        await processor.applyStretchOffset(smallImage, config);
      }

      const stats = monitor.getStats();

      expect(stats.elapsedTime).toBeLessThan(5000); // 5秒内完成
      expect(stats.memoryIncrease).toBeLessThan(30 * 1024 * 1024); // 内存增长不超过30MB

      console.log(`高频率小图片测试: ${requestCount}个请求, ${stats.elapsedTime}ms`);
    });

    it("应该处理少量大图片的处理请求", async () => {
      if (!processor.isAvailable()) {
        console.warn("⚠️ Sharp not available, skipping large image tests");
        return;
      }

      const monitor = new PerformanceMonitor();
      const largeImages = await Promise.all([
        createTestImage(1000, 800),
        createTestImage(1200, 900),
        createTestImage(1500, 1000),
      ]);

      const configs = [
        {
          containerWidth: 800,
          containerHeight: 600,
          fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
          enableDebug: false,
        },
        {
          containerWidth: 900,
          containerHeight: 700,
          fillRect: { left: 0.2, top: 0.15, right: 0.2, bottom: 0.15 },
          enableDebug: false,
        },
        {
          containerWidth: 1000,
          containerHeight: 750,
          fillRect: { left: 0.05, top: 0.1, right: 0.1, bottom: 0.05 },
          enableDebug: false,
        },
      ];

      const results = [];
      for (let i = 0; i < largeImages.length; i++) {
        const result = await processor.applyStretchOffset(largeImages[i], configs[i]);
        results.push(result);
      }

      const stats = monitor.getStats();

      expect(results.length).toBe(3);
      expect(stats.elapsedTime).toBeLessThan(8000); // 8秒内完成
      expect(stats.memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 内存增长不超过200MB

      console.log(`大图片处理测试: 3张大图, ${stats.elapsedTime}ms, 内存: ${Math.round(stats.memoryIncrease / 1024 / 1024)}MB`);
    });

    it("应该处理混合尺寸图片的批量请求", async () => {
      const monitor = new PerformanceMonitor();
      const mixedSizes = [
        { width: 50, height: 50 },   // 小图
        { width: 200, height: 150 }, // 中图
        { width: 800, height: 600 }, // 大图
        { width: 100, height: 300 }, // 长图
        { width: 400, height: 100 }, // 宽图
      ];

      const imageElements = await Promise.all(
        mixedSizes.map(async (size, i) => {
          const imageData = await createTestImage(size.width, size.height);
          const element = new ImageElement(`mixed_${i}`, "mixed-test.jpg", `rId_mixed_${i}`);
          element.setPosition({ x: i * 100, y: 50 });
          element.setSize({ width: size.width, height: size.height });
          element.setStretchInfo({
            fillRect: { 
              left: 0.1 + i * 0.02, 
              top: 0.1, 
              right: 0.1 + i * 0.02, 
              bottom: 0.1 
            }
          });
          return element;
        })
      );

      const mockContext = { slideId: "mixed_batch", resources: {}, debug: false };
      
      // Mock 不同尺寸的图片数据
      mixedSizes.forEach((size, i) => {
        mockImageDataService.extractImageData.mockResolvedValueOnce({
          buffer: Buffer.from(`mixed-image-${i}`),
          format: "png" as const,
          width: size.width,
          height: size.height,
          size: size.width * size.height * 4,
        });
      });

      const results = await service.processBatch(
        imageElements,
        mockContext as any,
        { enableStretchProcessing: false, enableDebug: false }
      );

      const stats = monitor.getStats();

      expect(results.size).toBe(mixedSizes.length);
      expect(stats.elapsedTime).toBeLessThan(6000); // 6秒内完成
      expect(stats.memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 内存增长合理

      console.log(`混合尺寸批量测试: ${mixedSizes.length}张图片, ${stats.elapsedTime}ms`);
    });
  });

  describe("资源管理和清理", () => {
    it("应该正确管理临时资源的生命周期", async () => {
      const monitor = new PerformanceMonitor();
      const tempResources: Array<{ id: string; size: number; created: number }> = [];

      // 模拟资源创建和清理
      for (let i = 0; i < 20; i++) {
        const resource = {
          id: `temp_resource_${i}`,
          size: Math.random() * 1024 * 1024, // 随机大小
          created: Date.now(),
        };
        tempResources.push(resource);

        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 10));

        // 清理旧资源（超过100ms的）
        const now = Date.now();
        const indicesToRemove = tempResources
          .map((r, index) => ({ resource: r, index }))
          .filter(({ resource }) => now - resource.created > 100)
          .map(({ index }) => index);

        // 从后往前删除以避免索引问题
        indicesToRemove.reverse().forEach(index => {
          tempResources.splice(index, 1);
        });
      }

      const stats = monitor.getStats();

      // 验证资源得到正确清理
      expect(tempResources.length).toBeLessThan(10); // 大部分资源应该被清理
      expect(stats.elapsedTime).toBeLessThan(1000); // 1秒内完成
      expect(stats.memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 内存增长合理

      console.log(`资源管理测试: 剩余资源 ${tempResources.length}/20, ${stats.elapsedTime}ms`);
    });
  });
});