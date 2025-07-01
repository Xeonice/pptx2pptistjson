/**
 * Tests for ConnectionShapeProcessor
 */

import { ConnectionShapeProcessor } from '../../app/lib/services/element/processors/ConnectionShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';

describe('ConnectionShapeProcessor', () => {
  let processor: ConnectionShapeProcessor;
  let xmlParser: XmlParseService;
  let context: ProcessingContext;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    processor = new ConnectionShapeProcessor(xmlParser);
    
    context = {
      zip: {} as any,
      slideNumber: 1,
      slideId: 'slide1',
      theme: {
        colorScheme: {
          accent1: '#FF0000',
          dk1: '#000000',
          lt1: '#FFFFFF'
        }
      } as any,
      relationships: new Map(),
      basePath: 'ppt/slides',
      options: {},
      warnings: [],
      idGenerator: new IdGenerator()
    };
  });

  describe('canProcess', () => {
    it('should return true for p:cxnSp nodes', () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: []
      };

      expect(processor.canProcess(node)).toBe(true);
    });

    it('should return false for non-connection shape nodes', () => {
      const node: XmlNode = {
        name: 'p:sp',
        attributes: {},
        children: []
      };

      expect(processor.canProcess(node)).toBe(false);
    });
  });

  describe('getElementType', () => {
    it('should return connection-shape', () => {
      expect(processor.getElementType()).toBe('connection-shape');
    });
  });

  describe('process', () => {
    it('should process basic connection shape with straight line', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '5', name: 'Connector 1' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:xfrm',
                attributes: {},
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '1270000', y: '635000' },
                    children: []
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '2540000', cy: '635000' },
                    children: []
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'line' },
                children: []
              },
              {
                name: 'a:ln',
                attributes: { w: '25400' },
                children: [
                  {
                    name: 'a:solidFill',
                    attributes: {},
                    children: [
                      {
                        name: 'a:srgbClr',
                        attributes: { val: '000000' },
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result).toBeDefined();
      expect(result.getType()).toBe('shape');
      expect(result.getShapeType()).toBe('line');
      expect(result.getPosition()).toEqual({
        x: expect.any(Number),
        y: expect.any(Number)
      });
      expect(result.getSize()).toEqual({
        width: expect.any(Number),
        height: expect.any(Number)
      });
      expect(result.getPath()).toContain('M 0');
      expect(result.getPathFormula()).toBe('line');
    });

    it('should process bent connector', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '6', name: 'Bent Connector' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:xfrm',
                attributes: {},
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '1270000', y: '635000' },
                    children: []
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '2540000', cy: '1270000' },
                    children: []
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'bentConnector2' },
                children: []
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result.getShapeType()).toBe('bentConnector');
      expect(result.getPathFormula()).toBe('bentConnector2');
      expect(result.getPath()).toContain('L'); // Should have line segments
    });

    it('should process arrow connector with head and tail', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '7', name: 'Arrow Connector' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:xfrm',
                attributes: {},
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '1270000', y: '635000' },
                    children: []
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '2540000', cy: '635000' },
                    children: []
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'rightArrow' },
                children: []
              },
              {
                name: 'a:ln',
                attributes: { w: '25400' },
                children: [
                  {
                    name: 'a:headEnd',
                    attributes: { type: 'triangle', w: 'med', len: 'med' },
                    children: []
                  },
                  {
                    name: 'a:tailEnd',
                    attributes: { type: 'none' },
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result.getShapeType()).toBe('arrow');
      expect(result.getStroke()).toBeDefined();
      expect(result.getStroke()?.headArrow).toEqual({
        type: 'triangle',
        width: 'med',
        length: 'med'
      });
    });

    it('should process connection with rotation and flip', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '8', name: 'Rotated Connector' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:xfrm',
                attributes: { rot: '1800000', flipH: '1' }, // 30 degrees, flipped horizontally
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '1270000', y: '635000' },
                    children: []
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '2540000', cy: '635000' },
                    children: []
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'line' },
                children: []
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result.getRotation()).toBe(30); // 1800000 / 60000 = 30
      expect(result.getFlip()).toEqual({ horizontal: true, vertical: false });
    });

    it('should process connection with start and end connections', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '9', name: 'Connected Line' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:prstGeom',
                attributes: { prst: 'line' },
                children: []
              }
            ]
          },
          {
            name: 'p:stCxn',
            attributes: { id: '2', idx: '0' },
            children: []
          },
          {
            name: 'p:endCxn',
            attributes: { id: '3', idx: '1' },
            children: []
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result.getConnectionInfo()).toEqual({
        startConnection: { id: '2', index: '0' },
        endConnection: { id: '3', index: '1' }
      });
    });

    it('should handle missing nvCxnSpPr gracefully', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:prstGeom',
                attributes: { prst: 'line' },
                children: []
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result).toBeDefined();
      expect(result.getShapeType()).toBe('line');
    });

    it('should handle custom geometry connections', async () => {
      const node: XmlNode = {
        name: 'p:cxnSp',
        attributes: {},
        children: [
          {
            name: 'p:nvCxnSpPr',
            attributes: {},
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '10', name: 'Custom Connector' },
                children: []
              }
            ]
          },
          {
            name: 'p:spPr',
            attributes: {},
            children: [
              {
                name: 'a:xfrm',
                attributes: {},
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '0', y: '0' },
                    children: []
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '1270000', cy: '635000' },
                    children: []
                  }
                ]
              },
              {
                name: 'a:custGeom',
                attributes: {},
                children: [
                  // Custom geometry would be here
                ]
              }
            ]
          }
        ]
      };

      const result = await processor.process(node, context);

      expect(result.getShapeType()).toBe('custom');
      expect(result.getPathFormula()).toBe('custom');
    });
  });

  describe('geometry mapping', () => {
    it('should map various connection geometries correctly', () => {
      const testCases = [
        { prst: 'line', expected: 'line' },
        { prst: 'straightConnector1', expected: 'line' },
        { prst: 'bentConnector2', expected: 'bentConnector' },
        { prst: 'curvedConnector3', expected: 'curvedConnector' },
        { prst: 'rightArrow', expected: 'arrow' },
        { prst: 'leftRightArrow', expected: 'doubleArrow' },
        { prst: 'unknownShape', expected: 'line' } // fallback
      ];

      testCases.forEach(({ prst, expected }) => {
        // We need to access the private method indirectly through processing
        const node: XmlNode = {
          name: 'p:cxnSp',
          attributes: {},
          children: [
            {
              name: 'p:nvCxnSpPr',
              attributes: {},
              children: [
                {
                  name: 'p:cNvPr',
                  attributes: { id: '1', name: 'Test' },
                  children: []
                }
              ]
            },
            {
              name: 'p:spPr',
              attributes: {},
              children: [
                {
                  name: 'a:prstGeom',
                  attributes: { prst },
                  children: []
                }
              ]
            }
          ]
        };

        processor.process(node, context).then(result => {
          expect(result.getShapeType()).toBe(expected);
        });
      });
    });
  });
});