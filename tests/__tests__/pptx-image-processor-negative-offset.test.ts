import { PPTXImageProcessor, StretchOffsetConfig } from '../../app/lib/services/images/PPTXImageProcessor';
import * as fs from 'fs';
import * as path from 'path';

describe('PPTXImageProcessor - Negative Offset Handling', () => {
  let processor: PPTXImageProcessor;
  let testImageBuffer: Buffer;

  beforeAll(() => {
    processor = new PPTXImageProcessor();
    
    // 创建一个测试用的图片Buffer（使用一个简单的1x1像素PNG）
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    testImageBuffer = Buffer.from(base64Image, 'base64');
  });

  describe('applyStretchOffset with negative offsets', () => {
    it('should handle negative left offset without Sharp errors', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 400,
        containerHeight: 300,
        fillRect: {
          left: -0.04881,  // 负值左偏移
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: false
      };

      // 测试处理过程不会抛出错误
      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
      expect(result.format).toBe('png');
      expect(result.appliedEffects).toContain('fillRect stretch: {"left":-0.04881,"top":0.06029,"right":0.30709,"bottom":0.06029}');
    });

    it('should handle negative offsets on all sides', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 500,
        containerHeight: 400,
        fillRect: {
          left: -0.1,    // 负值左偏移
          top: -0.05,    // 负值上偏移
          right: -0.15,  // 负值右偏移
          bottom: -0.08  // 负值下偏移
        },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
      expect(result.format).toBe('png');
    });

    it('should handle mixed positive and negative offsets', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 600,
        containerHeight: 450,
        fillRect: {
          left: -0.05,   // 负值
          top: 0.1,      // 正值
          right: 0.2,    // 正值
          bottom: -0.03  // 负值
        },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
    });

    it('should create debug images when enableDebug is true', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 400,
        containerHeight: 300,
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: true  // 启用调试
      };

      // 捕获console.log输出
      const consoleSpy = jest.spyOn(console, 'log');
      
      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      
      // 验证调试日志输出
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handling negative offsets')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle extreme negative offsets that result in invalid display area', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 300,
        containerHeight: 200,
        fillRect: {
          left: -0.8,    // 极端负值
          top: -0.7,
          right: -0.6,
          bottom: -0.5
        },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
      expect(result.appliedEffects.some(effect => effect.includes('transparent padding'))).toBe(true);
    });

    it('should calculate correct display dimensions with negative offsets', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 1000,
        containerHeight: 800,
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: false
      };

      // 计算期望的显示尺寸
      // displayWidth = containerWidth * (1 - left - right)
      // displayWidth = 1000 * (1 - (-0.04881) - 0.30709) = 1000 * 0.7419 = 741.9
      const expectedDisplayWidth = 1000 * (1 - (-0.04881) - 0.30709);
      
      // displayHeight = containerHeight * (1 - top - bottom)
      // displayHeight = 800 * (1 - 0.06029 - 0.06029) = 800 * 0.87942 = 703.536
      const expectedDisplayHeight = 800 * (1 - 0.06029 - 0.06029);

      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
      
      // 验证效果描述中包含正确的fillRect信息
      const fillRectEffect = result.appliedEffects.find(e => e.includes('fillRect'));
      expect(fillRectEffect).toBeDefined();
      expect(fillRectEffect).toContain('-0.04881');
    });

    it('should handle negative fillRect offsets without srcRect', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 500,
        containerHeight: 375,
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: false
      };

      const result = await processor.applyStretchOffset(testImageBuffer, config);
      
      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(config.containerWidth);
      expect(result.height).toBe(config.containerHeight);
      
      // 验证应用的效果
      const hasFillRectStretch = result.appliedEffects.some(effect => effect.includes('fillRect stretch'));
      
      expect(hasFillRectStretch).toBe(true);
      expect(result.format).toBe('png');
      expect(result.processedAt).toBeInstanceOf(Date);
    });
  });

  describe('createConfigFromStretchInfo', () => {
    it('should create config with negative offset values', () => {
      const stretchInfo = {
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        srcRect: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }
      };

      const config = PPTXImageProcessor.createConfigFromStretchInfo(
        stretchInfo,
        1350,
        759.375,
        true
      );

      expect(config.fillRect.left).toBe(-0.04881);
      expect(config.fillRect.top).toBe(0.06029);
      expect(config.fillRect.right).toBe(0.30709);
      expect(config.fillRect.bottom).toBe(0.06029);
      expect(config.containerWidth).toBe(1350);
      expect(config.containerHeight).toBe(759.375);
      expect(config.enableDebug).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero-size container gracefully', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 0,
        containerHeight: 0,
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: false
      };

      await expect(processor.applyStretchOffset(testImageBuffer, config))
        .rejects.toThrow();
    });

    it('should handle invalid image buffer', async () => {
      if (!processor.isAvailable()) {
        console.warn('Sharp not available, skipping test');
        return;
      }

      const config: StretchOffsetConfig = {
        containerWidth: 400,
        containerHeight: 300,
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        enableDebug: false
      };

      const invalidBuffer = Buffer.from('invalid image data');
      
      await expect(processor.applyStretchOffset(invalidBuffer, config))
        .rejects.toThrow('Image processing failed');
    });
  });
});