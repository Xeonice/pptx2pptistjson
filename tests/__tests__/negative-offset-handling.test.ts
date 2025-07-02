import { PPTXImageProcessor } from '../../app/lib/services/images/PPTXImageProcessor';

describe('负值偏移处理测试', () => {
  let processor: PPTXImageProcessor;

  beforeEach(() => {
    processor = new PPTXImageProcessor();
  });

  it('应该正确处理实际案例中的负值偏移', async () => {
    // 创建测试图片 Buffer (1600x1067)
    const imageWidth = 1600;
    const imageHeight = 1067;
    const testImage = Buffer.from(
      `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${imageWidth}" height="${imageHeight}" fill="#ff0000"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="100" fill="white">TEST</text>
      </svg>`
    );

    const config = {
      containerWidth: 1349.9629058834726,
      containerHeight: 759.2916345610157,
      fillRect: {
        left: -0.04881,
        top: 0.06029,
        right: 0.30709,
        bottom: 0.06029
      },
      enableDebug: true
    };

    // 执行处理
    const result = await processor.applyStretchOffset(testImage, config);

    // 验证结果
    expect(result).toBeDefined();
    expect(result.width).toBe(Math.round(config.containerWidth));
    expect(result.height).toBe(Math.round(config.containerHeight));
    expect(result.buffer).toBeInstanceOf(Buffer);
    
    // 验证应用的效果
    expect(result.appliedEffects).toContain(`fillRect stretch: ${JSON.stringify(config.fillRect)}`);
  });

  it('应该正确处理左上角都是负值的情况', async () => {
    const testImage = Buffer.from(
      `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#00ff00"/>
      </svg>`
    );

    const config = {
      containerWidth: 200,
      containerHeight: 150,
      fillRect: {
        left: -0.1,    // 负值，向左扩展
        top: -0.2,     // 负值，向上扩展
        right: 0.1,
        bottom: 0.1
      },
      enableDebug: true
    };

    const result = await processor.applyStretchOffset(testImage, config);

    expect(result).toBeDefined();
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
    expect(result.appliedEffects.some(effect => effect.includes('fillRect stretch'))).toBe(true);
  });

  it('应该正确处理所有边都是负值的情况', async () => {
    const testImage = Buffer.from(
      `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0000ff"/>
      </svg>`
    );

    const config = {
      containerWidth: 200,
      containerHeight: 150,
      fillRect: {
        left: -0.1,
        top: -0.1,
        right: -0.1,
        bottom: -0.1
      },
      enableDebug: true
    };

    const result = await processor.applyStretchOffset(testImage, config);

    expect(result).toBeDefined();
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
  });
});