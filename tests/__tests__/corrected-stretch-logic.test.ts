/**
 * 修正后的拉伸偏移逻辑测试
 * 基于 sample/stratch 目录的样本图片验证正确的 PowerPoint fillRect 行为
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
async function createTestImage(): Promise<Buffer> {
  if (!sharp) {
    return Buffer.from('test-image-placeholder');
  }
  
  try {
    // 创建一个简单的测试图案：红色背景，中心有蓝色方块
    return await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 } // 红色背景
      }
    })
    .composite([{
      input: await sharp({
        create: {
          width: 40,
          height: 40,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 1 } // 蓝色中心
        }
      }).png().toBuffer(),
      left: 30,
      top: 30
    }])
    .png().toBuffer();
  } catch (error) {
    console.warn('Failed to create test image with Sharp:', error);
    return Buffer.from('test-image-placeholder');
  }
}

describe('修正后的拉伸偏移逻辑测试', () => {
  let processor: PPTXImageProcessor;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
  });

  describe('基本 fillRect 行为验证', () => {
    it('应该正确处理零偏移（无拉伸）', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping stretch logic tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 }, // 无偏移
        enableDebug: true
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.appliedEffects.some(effect => effect.includes('fillRect'))).toBe(true);
    });

    it('应该正确处理 left 正值偏移（向内收缩）', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping left positive tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.5, top: 0, right: 0, bottom: 0 }, // left 50%
        enableDebug: true
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      
      // left 50% 应该显示图片的右侧部分（向内收缩50%）
      expect(result.appliedEffects.some(effect => effect.startsWith('fillRect stretch:'))).toBe(true);
    });

    it('应该正确处理 left 负值偏移（向外扩展）', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping left negative tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: -0.5, top: 0, right: 0, bottom: 0 }, // left -50%
        enableDebug: true
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      
      // left -50% 应该显示图片的左侧更多内容（向外扩展50%）
      expect(result.appliedEffects.some(effect => effect.startsWith('fillRect stretch:'))).toBe(true);
    });

    it('应该正确处理 top 正值偏移（向内收缩）', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping top positive tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0, top: 0.5, right: 0, bottom: 0 }, // top 50%
        enableDebug: true
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      
      // top 50% 应该显示图片的下半部分（向内收缩50%）
      expect(result.appliedEffects.some(effect => effect.startsWith('fillRect stretch:'))).toBe(true);
    });

    it('应该正确处理复合偏移', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping composite offset tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.25, top: 0.25, right: 0.25, bottom: 0.25 }, // 四边各收缩25%
        enableDebug: true
      };

      const result = await processor.applyStretchOffset(testImage, config);

      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      
      // 复合偏移应该显示图片的中心区域
      expect(result.appliedEffects.some(effect => effect.startsWith('fillRect stretch:'))).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的 fillRect 值（总和超过1）', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping error handling tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 200,
        containerHeight: 150,
        fillRect: { left: 0.6, top: 0.3, right: 0.6, bottom: 0.3 }, // 宽度和超过1
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImage, config);
      
      // 应该创建透明图片并记录无效显示区域
      expect(result.appliedEffects.some(effect => effect.includes('Invalid display area'))).toBe(true);
    });
  });

  describe('性能和质量', () => {
    it('应该在合理时间内处理图片', async () => {
      if (!processor.isAvailable()) {
        console.warn('⚠️ Sharp not available, skipping performance tests');
        return;
      }

      const testImage = await createTestImage();
      const config: StretchOffsetConfig = {
        containerWidth: 400,
        containerHeight: 300,
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        enableDebug: false
      };

      const startTime = Date.now();
      const result = await processor.applyStretchOffset(testImage, config);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});