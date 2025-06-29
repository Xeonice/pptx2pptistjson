import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData } from '../fixtures/color-test-data';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import JSZip from 'jszip';

describe('ShapeProcessor Fill Integration Tests', () => {
  let shapeProcessor: ShapeProcessor;
  let xmlParser: XmlParseService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    shapeProcessor = new ShapeProcessor(xmlParser);
    idGenerator = new IdGenerator();
  });

  // Helper to create mock XML nodes
  const createMockXmlNode = (name: string, attributes: Record<string, string> = {}, children: XmlNode[] = []): XmlNode => ({
    name,
    attributes,
    children
  });

  // Helper to create mock ProcessingContext
  const createMockContext = (overrides: Partial<ProcessingContext> = {}): ProcessingContext => ({
    zip: {} as JSZip,
    slideNumber: 1,
    slideId: 'slide1',
    relationships: new Map(),
    basePath: '',
    options: {},
    warnings: [],
    idGenerator,
    ...overrides
  });

  const createMockShapeXml = (fillData: any, geometryType: string = 'rect'): XmlNode => {
    const spPrChildren = [
      createMockXmlNode('a:xfrm', {}, [
        createMockXmlNode('a:off', { x: '100', y: '200' }),
        createMockXmlNode('a:ext', { cx: '300', cy: '400' })
      ]),
      createMockXmlNode('a:prstGeom', { prst: geometryType })
    ];

    if (fillData) {
      spPrChildren.push(fillData);
    }

    return createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
      ]),
      createMockXmlNode('p:spPr', {}, spPrChildren)
    ]);
  };

  describe('Fill color extraction', () => {
    it('should extract solid fill colors from shapes', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: 'FF0000' })
      ]);

      const mockXml = createMockShapeXml(solidFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(255,0,0,1)');
    });

    it('should set fill property on ShapeElement', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: '00FF00' })
      ]);

      const mockXml = createMockShapeXml(solidFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      
      expect(result.getFill()).toEqual({ color: 'rgba(0,255,0,1)' });
    });

    it('should handle noFill correctly', async () => {
      const noFill = createMockXmlNode('a:noFill', {});
      const mockXml = createMockShapeXml(noFill);
      
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(0,0,0,0)');
    });

    it('should use actual fill in themeFill output', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: '0000FF' })
      ]);

      const mockXml = createMockShapeXml(solidFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const json = result.toJSON();

      expect(json.themeFill.color).toBe('rgba(0,0,255,1)');
    });

    it('should extract theme colors from shapes', async () => {
      const themeFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:schemeClr', { val: 'accent1' })
      ]);

      const mockXml = createMockShapeXml(themeFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(255,0,0,1)');
    });

    it('should apply transformations to shape fill colors', async () => {
      const fillWithTransform = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
          createMockXmlNode('a:alpha', { val: '75000' }),
          createMockXmlNode('a:shade', { val: '25000' })
        ])
      ]);

      const mockXml = createMockShapeXml(fillWithTransform);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(ColorTestUtils.isValidRgbaFormat(fill?.color || '')).toBe(true);
      expect(fill?.color).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/);
    });

    it('should handle preset colors in shapes', async () => {
      const presetFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:prstClr', { val: 'red' })
      ]);

      const mockXml = createMockShapeXml(presetFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(255,0,0,1)');
    });

    it('should handle HSL colors in shapes', async () => {
      const hslFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:hslClr', {
          hue: '0',
          sat: '100%',
          lum: '50%'
        })
      ]);

      const mockXml = createMockShapeXml(hslFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(255,0,0,1)');
    });
  });

  describe('Shape fill inheritance', () => {
    it('should fallback to default colors when no fill', async () => {
      const mockXml = createMockShapeXml(null); // No fill data
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const json = result.toJSON();

      // Should use fallback color generation
      expect(json.themeFill.color).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
      expect(result.getFill()).toBeUndefined(); // No actual fill set
    });

    it('should prefer actual fill over generated colors', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: '123456' })
      ]);

      const mockXml = createMockShapeXml(solidFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const json = result.toJSON();

      expect(json.themeFill.color).toBe('rgba(18,52,86,1)');
      expect(result.getFill()?.color).toBe('rgba(18,52,86,1)');
    });

    it('should handle different shape types with fills', async () => {
      const shapeTypes = ['rect', 'ellipse', 'triangle', 'diamond'];
      
      for (const shapeType of shapeTypes) {
        const solidFill = createMockXmlNode('a:solidFill', {}, [
          createMockXmlNode('a:srgbClr', { val: 'FF0000' })
        ]);

        const mockXml = createMockShapeXml(solidFill, shapeType);
        const context = createMockContext({
          theme: ColorTestUtils.createMockTheme({})
        });

        const result = await shapeProcessor.process(mockXml, context);
        
        expect(result.getShapeType()).toBe(shapeType);
        expect(result.getFill()?.color).toBe('rgba(255,0,0,1)');
      }
    });
  });

  describe('Complex fill scenarios', () => {
    it('should handle complex theme color transformations', async () => {
      const complexThemeFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:schemeClr', { val: 'accent1' }, [
          createMockXmlNode('a:lumMod', { val: '80000' }),
          createMockXmlNode('a:lumOff', { val: '20000' }),
          createMockXmlNode('a:alpha', { val: '90000' })
        ])
      ]);

      const mockXml = createMockShapeXml(complexThemeFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(ColorTestUtils.isValidRgbaFormat(fill?.color || '')).toBe(true);
      expect(fill?.color).toMatch(/rgba\(\d+,\d+,\d+,0\.9\)/);
    });

    it('should handle multiple transformation chains', async () => {
      const multiTransformFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
          createMockXmlNode('a:shade', { val: '25000' }),
          createMockXmlNode('a:tint', { val: '10000' }),
          createMockXmlNode('a:satMod', { val: '120000' }),
          createMockXmlNode('a:alpha', { val: '85000' })
        ])
      ]);

      const mockXml = createMockShapeXml(multiTransformFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(ColorTestUtils.isValidRgbaFormat(fill?.color || '')).toBe(true);
      expect(fill?.color).toMatch(/rgba\(\d+,\d+,\d+,0\.85\)/);
    });

    it('should handle percentage RGB colors', async () => {
      const percentageFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:scrgbClr', {
          r: '75%',
          g: '50%',
          b: '25%'
        })
      ]);

      const mockXml = createMockShapeXml(percentageFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(ColorTestUtils.isValidRgbaFormat(fill?.color || '')).toBe(true);
      ColorTestUtils.expectColorEqual(fill?.color || '', 'rgba(191,128,64,1)', 2);
    });

    it('should handle system colors', async () => {
      const systemFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:sysClr', {
          val: 'windowText',
          lastClr: '000000'
        })
      ]);

      const mockXml = createMockShapeXml(systemFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const fill = result.getFill();

      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(0,0,0,1)');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed fill data gracefully', async () => {
      const malformedFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', {}) // Missing val attribute
      ]);

      const mockXml = createMockShapeXml(malformedFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      
      // Should handle gracefully without throwing
      expect(result).toBeDefined();
      expect(result.getShapeType()).toBe('rect');
    });

    it('should handle missing theme for theme colors', async () => {
      const themeFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:schemeClr', { val: 'accent1' })
      ]);

      const mockXml = createMockShapeXml(themeFill);
      const context = createMockContext({
        theme: undefined // No theme
      });

      const result = await shapeProcessor.process(mockXml, context);
      
      // Should handle missing theme gracefully
      expect(result).toBeDefined();
      expect(result.getFill()).toBeUndefined();
    });

    it('should handle unknown preset colors', async () => {
      const unknownPresetFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:prstClr', { val: 'unknownColor' })
      ]);

      const mockXml = createMockShapeXml(unknownPresetFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      
      // Should handle unknown preset colors gracefully
      expect(result).toBeDefined();
    });

    it('should handle empty spPr node', async () => {
      const mockXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}) // Empty spPr
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      
      expect(result).toBeDefined();
      expect(result.getShapeType()).toBe('rect'); // Default shape type
      expect(result.getFill()).toBeUndefined();
    });
  });

  describe('Performance and consistency', () => {
    it('should process fill colors consistently', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
          createMockXmlNode('a:alpha', { val: '80000' })
        ])
      ]);

      const mockXml = createMockShapeXml(solidFill);
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      // Process multiple times to ensure consistency
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await shapeProcessor.process(mockXml, context);
        results.push(result.getFill()?.color);
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toBe(firstResult);
      });
      expect(firstResult).toBe('rgba(255,0,0,0.8)');
    });

    it('should handle large number of shapes efficiently', async () => {
      const shapes = Array.from({ length: 100 }, (_, i) => {
        const solidFill = createMockXmlNode('a:solidFill', {}, [
          createMockXmlNode('a:srgbClr', { val: `FF${i.toString(16).padStart(4, '0')}` })
        ]);
        return createMockShapeXml(solidFill);
      });

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const startTime = performance.now();
      
      const results = await Promise.all(
        shapes.map(shape => shapeProcessor.process(shape, context))
      );
      
      const endTime = performance.now();

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.getFill()).toBeDefined();
        expect(ColorTestUtils.isValidRgbaFormat(result.getFill()?.color || '')).toBe(true);
      });

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration with shape geometry', () => {
    it('should preserve geometry while adding fill', async () => {
      const solidFill = createMockXmlNode('a:solidFill', {}, [
        createMockXmlNode('a:srgbClr', { val: 'FF0000' })
      ]);

      const mockXml = createMockShapeXml(solidFill, 'ellipse');
      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(mockXml, context);
      const json = result.toJSON();

      expect(result.getShapeType()).toBe('ellipse');
      expect(result.getFill()?.color).toBe('rgba(255,0,0,1)');
      expect(json.themeFill.color).toBe('rgba(255,0,0,1)');
      expect(json.path).toContain('A'); // Ellipse path should contain arc commands
    });

    it('should handle all supported shape types with fills', async () => {
      const supportedTypes = [
        'rect', 'roundRect', 'ellipse', 'triangle', 'diamond',
        'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon',
        'star5', 'rightArrow', 'callout1'
      ];

      for (const shapeType of supportedTypes) {
        const solidFill = createMockXmlNode('a:solidFill', {}, [
          createMockXmlNode('a:srgbClr', { val: '00FF00' })
        ]);

        const mockXml = createMockShapeXml(solidFill, shapeType);
        const context = createMockContext({
          theme: ColorTestUtils.createMockTheme({})
        });

        const result = await shapeProcessor.process(mockXml, context);
        
        expect(result.getFill()?.color).toBe('rgba(0,255,0,1)');
        expect(result.toJSON().themeFill.color).toBe('rgba(0,255,0,1)');
      }
    });
  });
});