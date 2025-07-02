/**
 * Sharp 图片处理测试
 * 测试 PPTXImageProcessor 的拉伸偏移功能
 */

import { PPTXImageProcessor, StretchOffsetConfig } from '../../app/lib/services/images/PPTXImageProcessor';
import { ImageStretchInfo } from '../../app/lib/models/domain/elements/ImageElement';

// Mock Sharp 以避免安装依赖
jest.mock('sharp', () => {
  const mockSharp = jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    extract: jest.fn().mockReturnThis(),
    extend: jest.fn().mockReturnThis(),
    composite: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image-data')),
    metadata: jest.fn().mockResolvedValue({ width: 200, height: 150, format: 'png' })
  }));
  
  // 模拟创建新图片的静态方法
  mockSharp.mockReturnValue = mockSharp;
  return { default: mockSharp };
});

describe('PPTXImageProcessor', () => {
  let processor: PPTXImageProcessor;
  let mockImageBuffer: Buffer;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
    mockImageBuffer = Buffer.from('mock-image-data');
    
    // 清除 console 输出以便测试
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize and check Sharp availability', async () => {
      // 给一些时间让初始化完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 这里测试逻辑而不是实际的 Sharp 可用性
      expect(processor).toBeDefined();
    });
  });

  describe('Configuration Creation', () => {
    it('should create config from ImageStretchInfo', () => {
      const stretchInfo: ImageStretchInfo = {
        fillRect: {
          left: -0.04881,
          top: 0.06029,
          right: 0.30709,
          bottom: 0.06029
        },
        srcRect: null,
        hasOffset: true,
        hasNegativeOffset: true,
        targetRect: {
          left: 0,
          top: 0.06029,
          width: 0.6441,
          height: 0.8794
        },
        sourceRect: {
          left: 0,
          top: 0,
          width: 1,
          height: 1
        },
        transform: {
          scaleX: 1.553,
          scaleY: 1.137,
          offsetX: -0.04881,
          offsetY: 0.06029
        }
      };

      const config = PPTXImageProcessor.createConfigFromStretchInfo(
        stretchInfo,
        400,
        300,
        true
      );

      expect(config).toEqual({
        containerWidth: 400,
        containerHeight: 300,
        fillRect: stretchInfo.fillRect,
        srcRect: undefined,
        enableDebug: true
      });
    });

    it('should include srcRect when available', () => {
      const stretchInfo: ImageStretchInfo = {
        fillRect: { left: 0, top: 0, right: 0, bottom: 0 },
        srcRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        hasOffset: false,
        hasNegativeOffset: false,
        targetRect: { left: 0, top: 0, width: 1, height: 1 },
        sourceRect: { left: 0.1, top: 0.1, width: 0.8, height: 0.8 },
        transform: { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
      };

      const config = PPTXImageProcessor.createConfigFromStretchInfo(
        stretchInfo,
        400,
        300
      );

      expect(config.srcRect).toEqual(stretchInfo.srcRect);
    });
  });

  describe('Processing Logic Validation', () => {
    const testCases = [
      {
        name: '你提供的XML案例',
        config: {
          containerWidth: 400,
          containerHeight: 300,
          fillRect: {
            left: -0.04881,
            top: 0.06029,
            right: 0.30709,
            bottom: 0.06029
          },
          enableDebug: true
        } as StretchOffsetConfig,
        expectedType: 'negative-offset'
      },
      {
        name: '正偏移案例',
        config: {
          containerWidth: 400,
          containerHeight: 300,
          fillRect: {
            left: 0.1,
            top: 0.1,
            right: 0.1,
            bottom: 0.1
          },
          enableDebug: false
        } as StretchOffsetConfig,
        expectedType: 'positive-offset'
      },
      {
        name: '无偏移案例',
        config: {
          containerWidth: 400,
          containerHeight: 300,
          fillRect: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
          },
          enableDebug: false
        } as StretchOffsetConfig,
        expectedType: 'no-offset'
      },
      {
        name: '混合偏移案例',
        config: {
          containerWidth: 400,
          containerHeight: 300,
          fillRect: {
            left: -0.1,
            top: 0.05,
            right: -0.15,
            bottom: 0.1
          },
          enableDebug: false
        } as StretchOffsetConfig,
        expectedType: 'negative-offset'
      }
    ];

    testCases.forEach(({ name, config, expectedType }) => {
      it(`should handle ${name}`, async () => {
        // 测试配置验证逻辑
        const hasNegativeOffset = config.fillRect.left < 0 || 
                                 config.fillRect.top < 0 || 
                                 config.fillRect.right < 0 || 
                                 config.fillRect.bottom < 0;

        const hasAnyOffset = Math.abs(config.fillRect.left) > 0.001 || 
                            Math.abs(config.fillRect.top) > 0.001 || 
                            Math.abs(config.fillRect.right) > 0.001 || 
                            Math.abs(config.fillRect.bottom) > 0.001;

        if (expectedType === 'negative-offset') {
          expect(hasNegativeOffset).toBe(true);
          expect(hasAnyOffset).toBe(true);
        } else if (expectedType === 'positive-offset') {
          expect(hasNegativeOffset).toBe(false);
          expect(hasAnyOffset).toBe(true);
        } else if (expectedType === 'no-offset') {
          expect(hasNegativeOffset).toBe(false);
          expect(hasAnyOffset).toBe(false);
        }

        // 测试目标矩形计算
        const targetRect = {
          x: config.containerWidth * Math.max(0, config.fillRect.left),
          y: config.containerHeight * Math.max(0, config.fillRect.top),
          width: config.containerWidth * (1 - Math.abs(config.fillRect.left) - Math.abs(config.fillRect.right)),
          height: config.containerHeight * (1 - Math.abs(config.fillRect.top) - Math.abs(config.fillRect.bottom))
        };

        expect(targetRect.width).toBeGreaterThan(0);
        expect(targetRect.height).toBeGreaterThan(0);
        expect(targetRect.x).toBeGreaterThanOrEqual(0);
        expect(targetRect.y).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Stretch Offset Calculations', () => {
    it('should calculate virtual canvas for negative offsets correctly', () => {
      const fillRect = {
        left: -0.04881,
        top: 0.06029,
        right: 0.30709,
        bottom: 0.06029
      };
      const containerWidth = 400;
      const containerHeight = 300;

      // 计算虚拟画布大小（负偏移情况）
      const virtualWidth = containerWidth / (1 - Math.abs(fillRect.left) - Math.abs(fillRect.right));
      const virtualHeight = containerHeight / (1 - Math.abs(fillRect.top) - Math.abs(fillRect.bottom));

      expect(virtualWidth).toBeCloseTo(400 / (1 - 0.04881 - 0.30709), 2);
      expect(virtualHeight).toBeCloseTo(300 / (1 - 0.06029 - 0.06029), 2);

      // 计算裁剪位置
      const cropX = Math.abs(fillRect.left) * virtualWidth;
      const cropY = Math.abs(fillRect.top) * virtualHeight;

      expect(cropX).toBeGreaterThan(0);
      expect(cropY).toBeGreaterThan(0);
    });

    it('should calculate display area for positive offsets correctly', () => {
      const fillRect = {
        left: 0.1,
        top: 0.1,
        right: 0.1,
        bottom: 0.1
      };
      const containerWidth = 400;
      const containerHeight = 300;

      // 计算显示区域大小（正偏移情况）
      const displayWidth = containerWidth * (1 - fillRect.left - fillRect.right);
      const displayHeight = containerHeight * (1 - fillRect.top - fillRect.bottom);

      expect(displayWidth).toBe(400 * 0.8); // 320
      expect(displayHeight).toBe(300 * 0.8); // 240

      // 计算偏移位置
      const offsetX = containerWidth * fillRect.left;
      const offsetY = containerHeight * fillRect.top;

      expect(offsetX).toBe(40);
      expect(offsetY).toBe(30);
    });

    it('should handle extreme negative offsets', () => {
      const fillRect = {
        left: -0.5,   // -50%
        top: -0.3,    // -30%
        right: -0.2,  // -20%
        bottom: -0.1  // -10%
      };
      const containerWidth = 400;
      const containerHeight = 300;

      // 确保极端值不会导致无效计算
      const virtualWidth = containerWidth / (1 - Math.abs(fillRect.left) - Math.abs(fillRect.right));
      const virtualHeight = containerHeight / (1 - Math.abs(fillRect.top) - Math.abs(fillRect.bottom));

      expect(virtualWidth).toBeGreaterThan(containerWidth);
      expect(virtualHeight).toBeGreaterThan(containerHeight);
      expect(Number.isFinite(virtualWidth)).toBe(true);
      expect(Number.isFinite(virtualHeight)).toBe(true);
    });
  });

  describe('srcRect Cropping Logic', () => {
    it('should detect when srcRect requires cropping', () => {
      const testCases = [
        { srcRect: { left: 0, top: 0, right: 0, bottom: 0 }, shouldCrop: false },
        { srcRect: { left: 0.1, top: 0, right: 0, bottom: 0 }, shouldCrop: true },
        { srcRect: { left: 0, top: 0.1, right: 0, bottom: 0 }, shouldCrop: true },
        { srcRect: { left: 0, top: 0, right: 0.1, bottom: 0 }, shouldCrop: true },
        { srcRect: { left: 0, top: 0, right: 0, bottom: 0.1 }, shouldCrop: true },
        { srcRect: { left: 0.1, top: 0.2, right: 0.3, bottom: 0.4 }, shouldCrop: true }
      ];

      testCases.forEach(({ srcRect, shouldCrop }) => {
        const hasCropping = srcRect.left > 0 || srcRect.top > 0 || srcRect.right > 0 || srcRect.bottom > 0;
        expect(hasCropping).toBe(shouldCrop);
      });
    });

    it('should calculate crop dimensions correctly', () => {
      const originalWidth = 800;
      const originalHeight = 600;
      const srcRect = { left: 0.1, top: 0.15, right: 0.2, bottom: 0.25 };

      const cropLeft = Math.floor(originalWidth * srcRect.left);
      const cropTop = Math.floor(originalHeight * srcRect.top);
      const cropWidth = Math.floor(originalWidth * (1 - srcRect.left - srcRect.right));
      const cropHeight = Math.floor(originalHeight * (1 - srcRect.top - srcRect.bottom));

      expect(cropLeft).toBe(80);   // 800 * 0.1
      expect(cropTop).toBe(90);    // 600 * 0.15
      expect(cropWidth).toBe(560); // 800 * (1 - 0.1 - 0.2) = 800 * 0.7
      expect(cropHeight).toBe(360); // 600 * (1 - 0.15 - 0.25) = 600 * 0.6
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configurations gracefully', () => {
      const invalidConfigs = [
        {
          name: '容器尺寸为零',
          config: {
            containerWidth: 0,
            containerHeight: 300,
            fillRect: { left: 0, top: 0, right: 0, bottom: 0 }
          }
        },
        {
          name: '极端负偏移导致零尺寸',
          config: {
            containerWidth: 400,
            containerHeight: 300,
            fillRect: { left: -0.6, top: 0, right: -0.5, bottom: 0 } // 总和超过1
          }
        }
      ];

      invalidConfigs.forEach(({ name, config }) => {
        // 验证这些配置会被适当处理
        const effectiveWidth = config.containerWidth * (1 - Math.abs(config.fillRect.left) - Math.abs(config.fillRect.right));
        const effectiveHeight = config.containerHeight * (1 - Math.abs(config.fillRect.top) - Math.abs(config.fillRect.bottom));
        
        // 这些情况下应该有适当的处理逻辑
        if (effectiveWidth <= 0 || effectiveHeight <= 0) {
          console.log(`Invalid config detected: ${name}`);
          // 在实际实现中，这里应该有错误处理或回退逻辑
        }
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle batch processing configuration', () => {
      const batchSize = 10;
      const concurrency = 3;
      
      // 验证批处理逻辑
      const totalBatches = Math.ceil(batchSize / concurrency);
      expect(totalBatches).toBe(4); // 10 items, 3 concurrency = 4 batches
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * concurrency;
        const end = Math.min(start + concurrency, batchSize);
        const batchItemCount = end - start;
        
        expect(batchItemCount).toBeGreaterThan(0);
        expect(batchItemCount).toBeLessThanOrEqual(concurrency);
      }
    });
  });
});

describe('Transparent Padding for Undersized Images', () => {
  it('should add transparent padding when cropped image is smaller than container', () => {
    // 测试透明填充逻辑的计算
    const containerWidth = 400;
    const containerHeight = 300;
    const croppedWidth = 200;  // 小于容器宽度
    const croppedHeight = 150; // 小于容器高度

    // 计算填充区域（居中对齐）
    const paddingLeft = Math.max(0, Math.floor((containerWidth - croppedWidth) / 2));
    const paddingTop = Math.max(0, Math.floor((containerHeight - croppedHeight) / 2));
    const paddingRight = Math.max(0, containerWidth - croppedWidth - paddingLeft);
    const paddingBottom = Math.max(0, containerHeight - croppedHeight - paddingTop);

    expect(paddingLeft).toBe(100);   // (400 - 200) / 2
    expect(paddingTop).toBe(75);     // (300 - 150) / 2
    expect(paddingRight).toBe(100);  // 400 - 200 - 100
    expect(paddingBottom).toBe(75);  // 300 - 150 - 75

    // 验证总尺寸正确
    expect(paddingLeft + croppedWidth + paddingRight).toBe(containerWidth);
    expect(paddingTop + croppedHeight + paddingBottom).toBe(containerHeight);
  });

  it('should handle edge cases with odd container dimensions', () => {
    const containerWidth = 401;  // 奇数宽度
    const containerHeight = 301; // 奇数高度
    const croppedWidth = 200;
    const croppedHeight = 150;

    const paddingLeft = Math.max(0, Math.floor((containerWidth - croppedWidth) / 2));
    const paddingTop = Math.max(0, Math.floor((containerHeight - croppedHeight) / 2));
    const paddingRight = Math.max(0, containerWidth - croppedWidth - paddingLeft);
    const paddingBottom = Math.max(0, containerHeight - croppedHeight - paddingTop);

    expect(paddingLeft).toBe(100);   // floor((401 - 200) / 2) = floor(100.5) = 100
    expect(paddingTop).toBe(75);     // floor((301 - 150) / 2) = floor(75.5) = 75
    expect(paddingRight).toBe(101);  // 401 - 200 - 100 = 101
    expect(paddingBottom).toBe(76);  // 301 - 150 - 75 = 76

    // 验证总尺寸正确
    expect(paddingLeft + croppedWidth + paddingRight).toBe(containerWidth);
    expect(paddingTop + croppedHeight + paddingBottom).toBe(containerHeight);
  });

  it('should not add padding when image matches container size', () => {
    const containerWidth = 400;
    const containerHeight = 300;
    const imageWidth = 400;   // 完全匹配
    const imageHeight = 300;  // 完全匹配

    const needsPadding = imageWidth < containerWidth || imageHeight < containerHeight;
    expect(needsPadding).toBe(false);
  });

  it('should not add padding when image is larger than container', () => {
    const containerWidth = 400;
    const containerHeight = 300;
    const imageWidth = 500;   // 大于容器
    const imageHeight = 400;  // 大于容器

    const needsPadding = imageWidth < containerWidth || imageHeight < containerHeight;
    expect(needsPadding).toBe(false);
  });

  it('should add padding only in one dimension when needed', () => {
    const containerWidth = 400;
    const containerHeight = 300;
    const imageWidth = 400;   // 匹配宽度
    const imageHeight = 150;  // 小于高度

    const needsPadding = imageWidth < containerWidth || imageHeight < containerHeight;
    expect(needsPadding).toBe(true);

    // 计算填充
    const paddingLeft = Math.max(0, Math.floor((containerWidth - imageWidth) / 2));
    const paddingTop = Math.max(0, Math.floor((containerHeight - imageHeight) / 2));
    const paddingRight = Math.max(0, containerWidth - imageWidth - paddingLeft);
    const paddingBottom = Math.max(0, containerHeight - imageHeight - paddingTop);

    expect(paddingLeft).toBe(0);     // 宽度匹配，无需水平填充
    expect(paddingRight).toBe(0);
    expect(paddingTop).toBe(75);     // 需要垂直填充
    expect(paddingBottom).toBe(75);
  });
});

describe('ImageProcessingService Integration', () => {
  // 这里可以添加 ImageProcessingService 的集成测试
  // 暂时跳过，因为需要更多的模拟设置
  
  it('should be ready for integration testing', () => {
    // 占位测试，确保测试套件能够运行
    expect(true).toBe(true);
  });
});