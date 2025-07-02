/**
 * 透明填充处理测试
 * 测试裁剪后图片的透明背景填充功能，确保与容器尺寸一致
 */

import { PPTXImageProcessor, StretchOffsetConfig } from '../../app/lib/services/images/PPTXImageProcessor';
import fs from 'fs';
import path from 'path';

let sharp: any = null;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available for testing');
}

// 使用Sharp创建测试图片
async function createTestImageBuffer(): Promise<Buffer> {
  if (!sharp) {
    // 如果Sharp不可用，返回一个占位符buffer
    return Buffer.from('test-image-placeholder');
  }
  
  try {
    // 直接使用Sharp创建一个简单的20x20红色图片，不使用样本文件
    return await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();
    
  } catch (error) {
    console.warn('Failed to create test image with Sharp:', error);
    // 如果Sharp创建失败，返回占位符
    return Buffer.from('test-image-placeholder');
  }
}

// 创建一个较大的测试图片 Buffer
async function createLargeTestImageBuffer(): Promise<Buffer> {
  if (!sharp) {
    return Buffer.from('large-test-image-placeholder');
  }
  
  try {
    // 创建一个100x100的蓝色图片
    return await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
  } catch (error) {
    console.warn('Failed to create large test image with Sharp:', error);
    return Buffer.from('large-test-image-placeholder');
  }
}

describe('透明填充处理测试', () => {
  let processor: PPTXImageProcessor;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
  });

  describe('基本透明填充功能', () => {
    it('应该将小图片用透明背景填充到容器尺寸', async () => {
      // 跳过没有Sharp的环境
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping transparent fill tests');
        return;
      }

      const testImage = await createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 }, // 无偏移
        enableDebug: true // 启用调试查看处理过程
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.format).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.appliedEffects).toContain('transparent padding');
    });

    it('应该处理带有拉伸偏移的图片并保持容器尺寸', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping stretch offset tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 300,
        containerHeight: 200,
        fillRect: { left: -0.1, top: 0.05, right: 0.15, bottom: -0.05 }, // 有偏移
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(300);
      expect(result.height).toBe(200);
      expect(result.appliedEffects).toContain('fillRect stretch');
    });

    it('应该处理源图裁剪并用透明背景填充', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping srcRect tests');
        return;
      }

      const testImage = createLargeTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 250,
        containerHeight: 180,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        srcRect: { left: 0.1, top: 0.1, right: 0.2, bottom: 0.2 }, // 裁剪20%
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(250);
      expect(result.height).toBe(180);
      expect(result.appliedEffects).toContain('srcRect crop');
    });
  });

  describe('边界情况处理', () => {
    it('应该处理极小容器尺寸', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping edge case tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 10,
        containerHeight: 10,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
    });

    it('应该处理非常大的容器尺寸', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping large container tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 1000,
        containerHeight: 800,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(1000);
      expect(result.height).toBe(800);
    });

    it('应该处理零偏移值', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping zero offset tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 100,
        containerHeight: 100,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('复合效果测试', () => {
    it('应该同时处理srcRect裁剪和fillRect拉伸偏移', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping composite effects tests');
        return;
      }

      const testImage = createLargeTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 400,
        containerHeight: 300,
        fillRect: { left: -0.05, top: 0.1, right: 0.05, bottom: -0.1 },
        srcRect: { left: 0.05, top: 0.05, right: 0.1, bottom: 0.1 },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
      expect(result.appliedEffects).toContain('srcRect crop');
      expect(result.appliedEffects).toContain('fillRect stretch');
    });

    it('应该在调试模式下提供详细信息', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping debug mode tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 150,
        containerHeight: 100,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: true // 启用调试模式
      };

      // 捕获控制台输出
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(150);
      expect(result.height).toBe(100);
      expect(result.appliedEffects.length).toBeGreaterThan(0);

      // 验证调试输出
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PPTXImageProcessor: Processing image')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的fillRect值', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping error handling tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 100,
        containerHeight: 100,
        fillRect: { left: 0.6, top: 0.5, right: 0.6, bottom: 0.5 }, // 总和超过1，会导致除零
        enableDebug: false
      };

      await expect(processor.applyStretchOffset(testImage, config))
        .rejects.toThrow('Invalid fillRect values');
    });

    it('应该处理无效的容器尺寸', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping invalid container tests');
        return;
      }

      const testImage = createTestImageBuffer();
      const config: StretchOffsetConfig = {
        containerWidth: 0,
        containerHeight: 100,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        enableDebug: false
      };

      await expect(processor.applyStretchOffset(testImage, config))
        .rejects.toThrow('Invalid container dimensions');
    });
  });
});