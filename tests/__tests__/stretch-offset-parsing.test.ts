/**
 * 拉伸偏移解析测试
 * 测试从XML中解析a:stretch和a:fillRect元素的功能
 */

import { ImageProcessor } from '../../app/lib/services/element/processors/ImageProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { Theme } from '../../app/lib/models/domain/Theme';
import JSZip from 'jszip';

describe('拉伸偏移解析测试', () => {
  let imageProcessor: ImageProcessor;
  let xmlParser: XmlParseService;
  let context: ProcessingContext;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    imageProcessor = new ImageProcessor(xmlParser);
    context = {
      zip: new JSZip(),
      slideNumber: 1,
      slideId: 'slide1',
      theme: new Theme('test-theme'),
      relationships: new Map(),
      basePath: '',
      options: {
        enableDebugMode: false,
        debugOptions: {
          saveDebugImages: false
        }
      },
      warnings: [],
      idGenerator: new IdGenerator(),
      slideSize: { width: 1350, height: 759.375 }
    };
  });

  describe('extractStretchInfo', () => {
    it('应该能够解析基本的fillRect信息', () => {
      // 创建模拟的XML节点结构
      const blipFillXml = `
        <a:blipFill>
          <a:blip r:embed="rId1" />
          <a:stretch>
            <a:fillRect l="-4881" t="6029" r="30709" b="6029" />
          </a:stretch>
        </a:blipFill>
      `;

      const blipFillNode = xmlParser.parse(blipFillXml);
      
      // 使用反射访问私有方法进行测试
      const extractStretchInfo = (imageProcessor as any).extractStretchInfo.bind(imageProcessor);
      const result = extractStretchInfo(blipFillNode);

      expect(result).toBeDefined();
      expect(result.fromXml).toBe(true);
      expect(result.fillRect).toBeDefined();
      
      // 验证转换后的数值 (原始值除以100000)
      expect(result.fillRect.left).toBeCloseTo(-0.04881, 5);
      expect(result.fillRect.top).toBeCloseTo(0.06029, 5);
      expect(result.fillRect.right).toBeCloseTo(0.30709, 5);
      expect(result.fillRect.bottom).toBeCloseTo(0.06029, 5);
    });

    it('应该在没有stretch元素时返回undefined', () => {
      const blipFillXml = `
        <a:blipFill>
          <a:blip r:embed="rId1" />
          <a:srcRect />
        </a:blipFill>
      `;

      const blipFillNode = xmlParser.parse(blipFillXml);
      
      const extractStretchInfo = (imageProcessor as any).extractStretchInfo.bind(imageProcessor);
      const result = extractStretchInfo(blipFillNode);

      expect(result).toBeUndefined();
    });

    it('应该在没有fillRect元素时返回undefined', () => {
      const blipFillXml = `
        <a:blipFill>
          <a:blip r:embed="rId1" />
          <a:stretch />
        </a:blipFill>
      `;

      const blipFillNode = xmlParser.parse(blipFillXml);
      
      const extractStretchInfo = (imageProcessor as any).extractStretchInfo.bind(imageProcessor);
      const result = extractStretchInfo(blipFillNode);

      expect(result).toBeUndefined();
    });

    it('应该正确处理零值和负值', () => {
      const blipFillXml = `
        <a:blipFill>
          <a:blip r:embed="rId1" />
          <a:stretch>
            <a:fillRect l="0" t="-10000" r="5000" b="0" />
          </a:stretch>
        </a:blipFill>
      `;

      const blipFillNode = xmlParser.parse(blipFillXml);
      
      const extractStretchInfo = (imageProcessor as any).extractStretchInfo.bind(imageProcessor);
      const result = extractStretchInfo(blipFillNode);

      expect(result).toBeDefined();
      expect(result.fillRect.left).toBe(0);
      expect(result.fillRect.top).toBeCloseTo(-0.1, 5);
      expect(result.fillRect.right).toBeCloseTo(0.05, 5);
      expect(result.fillRect.bottom).toBe(0);
    });
  });

  describe('完整的shape处理', () => {
    it('应该在处理带有拉伸偏移的shape时设置stretchInfo', async () => {
      const shapeXml = `
        <p:sp>
          <p:nvSpPr>
            <p:cNvPr id="7" name="矩形 6" />
            <p:cNvSpPr />
            <p:nvPr />
          </p:nvSpPr>
          <p:spPr>
            <a:xfrm>
              <a:off x="177" y="397" />
              <a:ext cx="12858397" cy="7232253" />
            </a:xfrm>
            <a:prstGeom prst="rect">
              <a:avLst />
            </a:prstGeom>
            <a:blipFill dpi="0" rotWithShape="1">
              <a:blip r:embed="rId1" />
              <a:srcRect />
              <a:stretch>
                <a:fillRect l="-4881" t="6029" r="30709" b="6029" />
              </a:stretch>
            </a:blipFill>
            <a:ln>
              <a:noFill />
            </a:ln>
          </p:spPr>
        </p:sp>
      `;

      // 设置关系映射
      context.relationships.set('rId1', {
        id: 'rId1',
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
        target: 'media/image1.png'
      });

      const shapeNode = xmlParser.parse(shapeXml);
      
      const imageElement = await imageProcessor.process(shapeNode, context);
      
      expect(imageElement).toBeDefined();
      expect(imageElement.getStretchInfo()).toBeDefined();
      
      const stretchInfo = imageElement.getStretchInfo();
      expect(stretchInfo?.fromXml).toBe(true);
      expect(stretchInfo?.fillRect).toBeDefined();
      expect(stretchInfo?.fillRect.left).toBeCloseTo(-0.04881, 5);
      expect(stretchInfo?.fillRect.top).toBeCloseTo(0.06029, 5);
      expect(stretchInfo?.fillRect.right).toBeCloseTo(0.30709, 5);
      expect(stretchInfo?.fillRect.bottom).toBeCloseTo(0.06029, 5);
    });
  });
});