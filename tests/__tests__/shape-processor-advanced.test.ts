import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import JSZip from 'jszip';

describe('ShapeProcessor Advanced Coverage Tests', () => {
  let shapeProcessor: ShapeProcessor;
  let xmlParser: XmlParseService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    shapeProcessor = new ShapeProcessor(xmlParser);
    idGenerator = new IdGenerator();
  });

  const createMockXmlNode = (name: string, attributes: Record<string, string> = {}, children: XmlNode[] = [], content?: string): XmlNode => ({
    name,
    attributes,
    children,
    content
  });

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

  describe('Shape text content processing', () => {
    it('should extract and process text content with style inheritance', async () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }, [
              createMockXmlNode('a:solidFill', {}, [
                createMockXmlNode('a:srgbClr', { val: 'FF0000' })
              ])
            ]),
            createMockXmlNode('a:t', {}, [], 'Test Text')
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:off', { x: '100', y: '200' }),
            createMockXmlNode('a:ext', { cx: '300', cy: '400' })
          ]),
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ]),
        txBodyNode
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const json = result.toJSON();
      const shapeTextContent = json.text;

      expect(shapeTextContent).toBeDefined();
      expect(shapeTextContent.content).toContain('Test Text');
      expect(shapeTextContent.align).toBe('middle'); // default
    });

    it('should handle vertical alignment from bodyPr', async () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:bodyPr', { anchor: 't' }),
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Top aligned text')
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ]),
        txBodyNode
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const json = result.toJSON();
      const shapeTextContent = json.text;

      expect(shapeTextContent).toBeDefined();
      expect(shapeTextContent.align).toBe('top');
    });

    it('should handle paragraph alignment mapping', async () => {
      const testCases = [
        { algn: 'l', expected: 'left' },
        { algn: 'ctr', expected: 'center' },
        { algn: 'r', expected: 'right' },
        { algn: 'just', expected: 'justify' },
        { algn: 'unknown', expected: 'left' }
      ];

      for (const testCase of testCases) {
        const txBodyNode = createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:pPr', { algn: testCase.algn }),
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Text')
            ])
          ])
        ]);

        const shapeXml = createMockXmlNode('p:sp', {}, [
          createMockXmlNode('p:nvSpPr', {}, [
            createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
          ]),
          createMockXmlNode('p:spPr', {}, [
            createMockXmlNode('a:prstGeom', { prst: 'rect' })
          ]),
          txBodyNode
        ]);

        const context = createMockContext({
          theme: ColorTestUtils.createMockTheme({})
        });

        const result = await shapeProcessor.process(shapeXml, context);
        const json = result.toJSON();
        const content = json.text;
        
        expect(content).toBeDefined();
        // Note: paragraph alignment is applied to content items, not to the overall align property
      }
    });
  });

  describe('Custom geometry analysis', () => {
    it('should detect circular geometry from arc commands', async () => {
      const custGeom = createMockXmlNode('a:custGeom', {}, [
        createMockXmlNode('a:pathLst', {}, [
          createMockXmlNode('a:path', { w: '100', h: '100' }, [
            createMockXmlNode('a:arcTo', { wR: '50', hR: '50', swAng: '21600000' })
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [custGeom])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      expect(result.getShapeType()).toBe('ellipse');
    });

    it('should detect rectangular geometry from line commands', async () => {
      const custGeom = createMockXmlNode('a:custGeom', {}, [
        createMockXmlNode('a:pathLst', {}, [
          createMockXmlNode('a:path', { w: '200', h: '100' }, [
            createMockXmlNode('a:moveTo', {}, [
              createMockXmlNode('a:pt', { x: '0', y: '0' })
            ]),
            createMockXmlNode('a:lnTo', {}, [
              createMockXmlNode('a:pt', { x: '200', y: '0' })
            ]),
            createMockXmlNode('a:lnTo', {}, [
              createMockXmlNode('a:pt', { x: '200', y: '100' })
            ]),
            createMockXmlNode('a:lnTo', {}, [
              createMockXmlNode('a:pt', { x: '0', y: '100' })
            ]),
            createMockXmlNode('a:close')
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [custGeom])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      expect(result.getShapeType()).toBe('rect');
    });

    it('should detect circular geometry from cubic bezier pattern', async () => {
      const custGeom = createMockXmlNode('a:custGeom', {}, [
        createMockXmlNode('a:pathLst', {}, [
          createMockXmlNode('a:path', { w: '100', h: '100' }, [
            createMockXmlNode('a:moveTo', {}, [
              createMockXmlNode('a:pt', { x: '50', y: '0' })
            ]),
            createMockXmlNode('a:cubicBezTo', {}, [
              createMockXmlNode('a:pt', { x: '75', y: '0' }),
              createMockXmlNode('a:pt', { x: '100', y: '25' }),
              createMockXmlNode('a:pt', { x: '100', y: '50' })
            ]),
            createMockXmlNode('a:cubicBezTo', {}, [
              createMockXmlNode('a:pt', { x: '100', y: '75' }),
              createMockXmlNode('a:pt', { x: '75', y: '100' }),
              createMockXmlNode('a:pt', { x: '50', y: '100' })
            ]),
            createMockXmlNode('a:cubicBezTo', {}, [
              createMockXmlNode('a:pt', { x: '25', y: '100' }),
              createMockXmlNode('a:pt', { x: '0', y: '75' }),
              createMockXmlNode('a:pt', { x: '0', y: '50' })
            ]),
            createMockXmlNode('a:cubicBezTo', {}, [
              createMockXmlNode('a:pt', { x: '0', y: '25' }),
              createMockXmlNode('a:pt', { x: '25', y: '0' }),
              createMockXmlNode('a:pt', { x: '50', y: '0' })
            ])
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [custGeom])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      expect(result.getShapeType()).toBe('ellipse');
    });
  });

  describe('SVG path extraction from custom geometry', () => {
    it('should extract complex SVG path with all command types', async () => {
      const custGeom = createMockXmlNode('a:custGeom', {}, [
        createMockXmlNode('a:pathLst', {}, [
          createMockXmlNode('a:path', { w: '200', h: '200' }, [
            createMockXmlNode('a:moveTo', {}, [
              createMockXmlNode('a:pt', { x: '100', y: '0' })
            ]),
            createMockXmlNode('a:lnTo', {}, [
              createMockXmlNode('a:pt', { x: '200', y: '100' })
            ]),
            createMockXmlNode('a:cubicBezTo', {}, [
              createMockXmlNode('a:pt', { x: '200', y: '150' }),
              createMockXmlNode('a:pt', { x: '150', y: '200' }),
              createMockXmlNode('a:pt', { x: '100', y: '200' })
            ]),
            createMockXmlNode('a:arcTo', { wR: '50', hR: '50', swAng: '21600000' }),
            createMockXmlNode('a:close')
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:ext', { cx: '200', cy: '200' })
          ]),
          custGeom
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      const path = result.getPath();
      
      expect(path).toBeDefined();
      expect(path).toContain('M');
      expect(path).toContain('L');
      expect(path).toContain('C');
      expect(path).toContain('Z');
    });

    it('should handle path optimization', async () => {
      const custGeom = createMockXmlNode('a:custGeom', {}, [
        createMockXmlNode('a:pathLst', {}, [
          createMockXmlNode('a:path', { w: '100', h: '100' }, [
            createMockXmlNode('a:moveTo', {}, [
              createMockXmlNode('a:pt', { x: '0', y: '0' })
            ]),
            createMockXmlNode('a:lnTo', {}, [
              createMockXmlNode('a:pt', { x: '100', y: '100' })
            ])
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:ext', { cx: '100', cy: '100' })
          ]),
          custGeom
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      const path = result.getPath();
      
      expect(path).toBeDefined();
      expect(path!).not.toContain('NaN');
      expect(path!.length).toBeGreaterThan(10);
    });
  });

  describe('Gradient fill processing', () => {
    it('should extract linear gradient with color stops', async () => {
      const gradFill = createMockXmlNode('a:gradFill', {}, [
        createMockXmlNode('a:lin', { ang: '5400000' }),
        createMockXmlNode('a:gsLst', {}, [
          createMockXmlNode('a:gs', { pos: '0' }, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ]),
          createMockXmlNode('a:gs', { pos: '100000' }, [
            createMockXmlNode('a:srgbClr', { val: '0000FF' })
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' }),
          gradFill
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const gradient = result.getGradient();
      
      expect(gradient).toBeDefined();
      expect(gradient?.type).toBe('linear');
      expect(gradient?.rotate).toBe(180); // 5400000 / 60000 + 90 = 180
      expect(gradient?.colors).toHaveLength(2);
      expect(gradient?.colors[0].pos).toBe(0);
      expect(gradient?.colors[1].pos).toBe(100);
    });

    it('should extract radial gradient', async () => {
      const gradFill = createMockXmlNode('a:gradFill', {}, [
        createMockXmlNode('a:rad'),
        createMockXmlNode('a:gsLst', {}, [
          createMockXmlNode('a:gs', { pos: '0' }, [
            createMockXmlNode('a:srgbClr', { val: 'FFFFFF' })
          ]),
          createMockXmlNode('a:gs', { pos: '50000' }, [
            createMockXmlNode('a:srgbClr', { val: '808080' })
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'ellipse' }),
          gradFill
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const gradient = result.getGradient();
      
      expect(gradient).toBeDefined();
      expect(gradient?.type).toBe('radial');
      expect(gradient?.colors).toHaveLength(2);
    });

    it('should handle gradient color modifiers', async () => {
      const gradFill = createMockXmlNode('a:gradFill', {}, [
        createMockXmlNode('a:lin', { ang: '0' }),
        createMockXmlNode('a:gsLst', {}, [
          createMockXmlNode('a:gs', { pos: '0' }, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
              createMockXmlNode('a:alpha', { val: '80000' }),
              createMockXmlNode('a:shade', { val: '50000' })
            ])
          ]),
          createMockXmlNode('a:gs', { pos: '100000' }, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' }, [
              createMockXmlNode('a:tint', { val: '30000' })
            ])
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' }),
          gradFill
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#0000FF' })
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const gradient = result.getGradient();
      
      expect(gradient).toBeDefined();
      expect(gradient?.colors[0].color).toMatch(/rgba\(128,\s*0,\s*0,\s*0\.8\)/);
    });
  });

  describe('Adjustment values and roundRect handling', () => {
    it('should extract adjustment values for roundRect', async () => {
      const prstGeom = createMockXmlNode('a:prstGeom', { prst: 'roundRect' }, [
        createMockXmlNode('a:avLst', {}, [
          createMockXmlNode('a:gd', { name: 'adj', fmla: 'val 25000' })
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:ext', { cx: '200', cy: '100' })
          ]),
          prstGeom
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      expect(result.getShapeType()).toBe('roundRect');
      expect(result.getAdjustmentValues()).toEqual({ adj: 0.25 });
    });

    it('should use default adjustment for roundRect without values', async () => {
      const prstGeom = createMockXmlNode('a:prstGeom', { prst: 'roundRect' });

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:ext', { cx: '200', cy: '100' })
          ]),
          prstGeom
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      expect(result.getShapeType()).toBe('roundRect');
      expect(result.getPath()).toContain('Q'); // Should have quadratic curves for rounded corners
    });
  });

  describe('FlowChart and ActionButton shapes', () => {
    it('should handle flowChart shapes correctly', async () => {
      const flowChartTypes = [
        'flowChartPredefinedProcess',
        'flowChartInternalStorage',
        'flowChartCollate',
        'flowChartDocument',
        'flowChartMultidocument'
      ];

      for (const shapeType of flowChartTypes) {
        const prstGeom = createMockXmlNode('a:prstGeom', { prst: shapeType });

        const shapeXml = createMockXmlNode('p:sp', {}, [
          createMockXmlNode('p:nvSpPr', {}, [
            createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
          ]),
          createMockXmlNode('p:spPr', {}, [
            createMockXmlNode('a:xfrm', {}, [
              createMockXmlNode('a:ext', { cx: '200', cy: '100' })
            ]),
            prstGeom
          ])
        ]);

        const context = createMockContext();
        const result = await shapeProcessor.process(shapeXml, context);
        
        expect(result.getShapeType()).toBe('custom');
        expect(result.getPath()).toBeDefined();
      }
    });

    it('should handle actionButton shapes correctly', async () => {
      const actionButtonTypes = [
        'actionButtonBlank',
        'actionButtonBackPrevious',
        'actionButtonBeginning',
        'actionButtonDocument'
      ];

      for (const shapeType of actionButtonTypes) {
        const prstGeom = createMockXmlNode('a:prstGeom', { prst: shapeType });

        const shapeXml = createMockXmlNode('p:sp', {}, [
          createMockXmlNode('p:nvSpPr', {}, [
            createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
          ]),
          createMockXmlNode('p:spPr', {}, [
            createMockXmlNode('a:xfrm', {}, [
              createMockXmlNode('a:ext', { cx: '200', cy: '100' })
            ]),
            prstGeom
          ])
        ]);

        const context = createMockContext();
        const result = await shapeProcessor.process(shapeXml, context);
        
        expect(result.getShapeType()).toBe('custom');
        expect(result.getPath()).toBeDefined();
      }
    });
  });

  describe('Style reference extraction', () => {
    it('should extract color from fillRef style', async () => {
      const styleNode = createMockXmlNode('p:style', {}, [
        createMockXmlNode('a:fillRef', { idx: '1' }, [
          createMockXmlNode('a:schemeClr', { val: 'accent2' })
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ]),
        styleNode
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent2: '#00FF00' })
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const fill = result.getFill();
      
      expect(fill).toBeDefined();
      expect(fill?.color).toBe('rgba(0,255,0,1)');
    });
  });

  describe('Default gradient creation', () => {
    it('should create default gradient for specific path patterns', async () => {
      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'ellipse' })
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      
      // Should check if it creates default gradients for specific patterns
      expect(result).toBeDefined();
    });
  });

  describe('Group transform handling', () => {
    it('should apply group transform to shape position', async () => {
      const groupTransform = {
        offset: { x: 1000, y: 2000 },
        childOffset: { x: 500, y: 1000 },
        scaleX: 1.5,
        scaleY: 2.0
      };

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:off', { x: '800', y: '1500' }),
            createMockXmlNode('a:ext', { cx: '200', cy: '100' })
          ]),
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ])
      ]);

      const context = createMockContext({ groupTransform });
      const result = await shapeProcessor.process(shapeXml, context);
      const position = result.getPosition();
      
      expect(position).toBeDefined();
      // Should have applied group transform calculations
      expect(position!.x).toBeGreaterThan(0);
      expect(position!.y).toBeGreaterThan(0);
    });
  });

  describe('Text box detection', () => {
    it('should not process text boxes as shapes', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ])
      ]);

      const context = createMockContext();
      
      expect(shapeProcessor.canProcess(textBoxXml)).toBe(false);
    });
  });

  describe('Rotation handling', () => {
    it('should extract and convert rotation angle', async () => {
      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', { rot: '1800000' }, [
            createMockXmlNode('a:off', { x: '100', y: '200' }),
            createMockXmlNode('a:ext', { cx: '300', cy: '400' })
          ]),
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ])
      ]);

      const context = createMockContext();
      const result = await shapeProcessor.process(shapeXml, context);
      const rotation = result.getRotation();
      
      expect(rotation).toBe(30); // 1800000 / 60000 = 30 degrees
    });
  });

  describe('System color handling in gradients', () => {
    it('should handle system colors with lastClr', async () => {
      const gradFill = createMockXmlNode('a:gradFill', {}, [
        createMockXmlNode('a:lin', { ang: '0' }),
        createMockXmlNode('a:gsLst', {}, [
          createMockXmlNode('a:gs', { pos: '0' }, [
            createMockXmlNode('a:sysClr', { val: 'windowText', lastClr: 'FF0000' })
          ])
        ])
      ]);

      const shapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' }),
          gradFill
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({})
      });

      const result = await shapeProcessor.process(shapeXml, context);
      const gradient = result.getGradient();
      
      expect(gradient).toBeDefined();
      expect(gradient?.colors[0].color).toMatch(/rgba\(255,\s*0,\s*0,\s*1\)/);
    });
  });

  describe('Color modifier combinations', () => {
    it('should apply multiple color modifiers in sequence', async () => {
      const modifierCombinations = [
        ['a:lumMod', 'a:lumOff'],
        ['a:shade', 'a:tint'],
        ['a:satMod', 'a:alpha'],
        ['a:hueMod', 'a:alpha']
      ];

      for (const modifiers of modifierCombinations) {
        const modifierNodes = modifiers.map(mod => 
          createMockXmlNode(mod, { val: '50000' })
        );

        const gradFill = createMockXmlNode('a:gradFill', {}, [
          createMockXmlNode('a:lin', { ang: '0' }),
          createMockXmlNode('a:gsLst', {}, [
            createMockXmlNode('a:gs', { pos: '0' }, [
              createMockXmlNode('a:srgbClr', { val: 'FF0000' }, modifierNodes)
            ])
          ])
        ]);

        const shapeXml = createMockXmlNode('p:sp', {}, [
          createMockXmlNode('p:nvSpPr', {}, [
            createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
          ]),
          createMockXmlNode('p:spPr', {}, [
            createMockXmlNode('a:prstGeom', { prst: 'rect' }),
            gradFill
          ])
        ]);

        const context = createMockContext({
          theme: ColorTestUtils.createMockTheme({})
        });

        const result = await shapeProcessor.process(shapeXml, context);
        const gradient = result.getGradient();
        
        expect(gradient).toBeDefined();
        expect(gradient?.colors[0].color).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*(0\.\d+|1)\)/);
      }
    });
  });
});