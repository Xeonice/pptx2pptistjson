import { TextProcessor } from '../../app/lib/services/element/processors/TextProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import JSZip from 'jszip';

describe('TextProcessor Advanced Coverage Tests', () => {
  let textProcessor: TextProcessor;
  let xmlParser: XmlParseService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    textProcessor = new TextProcessor(xmlParser);
    idGenerator = new IdGenerator();
  });

  const createMockXmlNode = (name: string, attributes: Record<string, string> = {}, children: XmlNode[] = [], value?: string): XmlNode => ({
    name,
    attributes,
    children,
    value
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
    theme: ColorTestUtils.createMockTheme({}),
    ...overrides
  });

  describe('Text box detection', () => {
    it('should detect text boxes with txBox="1"', () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Text content')
            ])
          ])
        ])
      ]);

      expect(textProcessor.canProcess(textBoxXml)).toBe(true);
    });

    it('should not process shapes without txBox', () => {
      const regularShapeXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Regular Shape' }),
          createMockXmlNode('p:cNvSpPr', {}) // No txBox attribute
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:prstGeom', { prst: 'rect' })
        ])
      ]);

      expect(textProcessor.canProcess(regularShapeXml)).toBe(false);
    });

    it('should not process shapes with txBox="0"', () => {
      const nonTextBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'Non-TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '0' })
        ])
      ]);

      expect(textProcessor.canProcess(nonTextBoxXml)).toBe(false);
    });

    it('should not process shapes without txBody', () => {
      const noTextXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox Without Content' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ])
        // No txBody
      ]);

      expect(textProcessor.canProcess(noTextXml)).toBe(false);
    });

    it('should handle missing nvSpPr', () => {
      const malformedXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Text content')
            ])
          ])
        ])
      ]);

      expect(textProcessor.canProcess(malformedXml)).toBe(false);
    });

    it('should handle missing cNvSpPr', () => {
      const malformedXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox' })
          // No cNvSpPr
        ]),
        createMockXmlNode('p:txBody', {})
      ]);

      expect(textProcessor.canProcess(malformedXml)).toBe(false);
    });
  });

  describe('Text processing', () => {
    it('should process basic text box with content', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Sample TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:off', { x: '1000', y: '2000' }),
            createMockXmlNode('a:ext', { cx: '3000', cy: '1500' })
          ])
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800', b: '1' }),
              createMockXmlNode('a:t', {}, [], 'Bold text content')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getId()).toMatch(/^text_\d+$/);
      expect(result.getType()).toBe('text');
      expect(result.getPosition()).toEqual({ x: 0.79, y: 1.57 }); // EMU to points conversion
      expect(result.getSize()).toEqual({ width: 2.36, height: 1.18 });
      
      const content = result.getContent();
      expect(content).toContain('Bold text content');
      expect(content).toContain('font-weight: bold');
    });

    it('should handle text with multiple paragraphs and styles', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Multi-paragraph TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:pPr', { algn: 'ctr' }),
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '2400', b: '1' }),
              createMockXmlNode('a:t', {}, [], 'Title')
            ])
          ]),
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1600', i: '1' }),
              createMockXmlNode('a:t', {}, [], 'Subtitle in italic')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      const content = result.getContent();
      expect(content).toContain('Title');
      expect(content).toContain('Subtitle in italic');
      expect(content).toContain('text-align: center');
      expect(content).toContain('font-weight: bold');
      expect(content).toContain('font-style: italic');
    });

    it('should handle text with theme colors', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Colored TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:schemeClr', { val: 'accent1' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Theme colored text')
            ])
          ])
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('color: rgba(255,0,0,1)');
    });

    it('should handle text with direct RGB colors', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'RGB Colored TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:srgbClr', { val: '00FF00' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Green text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('color: rgba(0,255,0,1)');
    });

    it('should handle text with font families', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Font TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }, [
                createMockXmlNode('a:latin', { typeface: 'Times New Roman' })
              ]),
              createMockXmlNode('a:t', {}, [], 'Times font text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('font-family: Times New Roman');
    });

    it('should handle vertical alignment from bodyPr', async () => {
      const alignmentCases = [
        { anchor: 't', expected: 'top' },
        { anchor: 'ctr', expected: 'middle' },
        { anchor: 'b', expected: 'bottom' }
      ];

      for (const testCase of alignmentCases) {
        const textBoxXml = createMockXmlNode('p:sp', {}, [
          createMockXmlNode('p:nvSpPr', {}, [
            createMockXmlNode('p:cNvPr', { id: '5', name: 'Aligned TextBox' }),
            createMockXmlNode('p:cNvSpPr', { txBox: '1' })
          ]),
          createMockXmlNode('p:txBody', {}, [
            createMockXmlNode('a:bodyPr', { anchor: testCase.anchor }),
            createMockXmlNode('a:p', {}, [
              createMockXmlNode('a:r', {}, [
                createMockXmlNode('a:t', {}, [], 'Aligned text')
              ])
            ])
          ])
        ]);

        const context = createMockContext();
        const result = await textProcessor.process(textBoxXml, context);

        expect(result.getVerticalAlign()).toBe(testCase.expected);
      }
    });

    it('should use default vertical alignment when not specified', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Default Align TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Default aligned text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getVerticalAlign()).toBe('middle');
    });

    it('should generate unique IDs for text elements', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Test TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Test text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      
      const result1 = await textProcessor.process(textBoxXml, context);
      const result2 = await textProcessor.process(textBoxXml, context);

      expect(result1.getId()).not.toBe(result2.getId());
      expect(result1.getId()).toMatch(/^text_\d+$/);
      expect(result2.getId()).toMatch(/^text_\d+$/);
    });

    it('should handle missing transform information', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'No Transform TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:spPr', {}), // No xfrm
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'No transform text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getPosition()).toEqual({ x: 0, y: 0 });
      expect(result.getSize()).toEqual({ width: 0, height: 0 });
    });

    it('should handle missing spPr node', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'No spPr TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'No spPr text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getPosition()).toEqual({ x: 0, y: 0 });
      expect(result.getSize()).toEqual({ width: 0, height: 0 });
    });

    it('should handle rotation from transform', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Rotated TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', { rot: '1800000' }, [
            createMockXmlNode('a:off', { x: '1000', y: '2000' }),
            createMockXmlNode('a:ext', { cx: '3000', cy: '1500' })
          ])
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Rotated text')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getRotation()).toBe(30); // 1800000 / 60000 = 30 degrees
    });
  });

  describe('Element type identification', () => {
    it('should return correct element type', () => {
      expect(textProcessor.getElementType()).toBe('text');
    });
  });

  describe('Error handling', () => {
    it('should handle empty text content gracefully', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Empty TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}) // Empty paragraph
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);

      expect(result.getContent()).toBeDefined();
      expect(result.getContent()).toContain('<div');
    });

    it('should throw error when using theme colors without theme', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Theme TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', {}, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:schemeClr', { val: 'accent1' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Theme text')
            ])
          ])
        ])
      ]);

      const context = createMockContext({ theme: undefined });

      await expect(textProcessor.process(textBoxXml, context))
        .rejects
        .toThrow(/ProcessingContext\.theme is null\/undefined.*cannot process scheme colors/);
    });

    it('should handle malformed XML structure gracefully', async () => {
      const malformedXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Malformed TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}) // No children
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(malformedXml, context);

      expect(result).toBeDefined();
      expect(result.getContent()).toBeDefined();
    });
  });

  describe('Style inheritance', () => {
    it('should apply shape style to text elements', async () => {
      const shapeStyleNode = createMockXmlNode('p:style', {}, [
        createMockXmlNode('a:fontRef', { idx: '1' }, [
          createMockXmlNode('a:schemeClr', { val: 'accent1' })
        ])
      ]);

      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Styled TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        shapeStyleNode,
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }), // No explicit color
              createMockXmlNode('a:t', {}, [], 'Styled text')
            ])
          ])
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('color: rgba(255,0,0,1)');
    });
  });

  describe('Complex text formatting', () => {
    it('should handle line breaks within paragraphs', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Line Break TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Line 1')
            ]),
            createMockXmlNode('a:br'),
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:t', {}, [], 'Line 2')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('Line 1');
      expect(content).toContain('<br/>');
      expect(content).toContain('Line 2');
    });

    it('should handle mixed formatting within a paragraph', async () => {
      const textBoxXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '5', name: 'Mixed Format TextBox' }),
          createMockXmlNode('p:cNvSpPr', { txBox: '1' })
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { b: '1' }),
              createMockXmlNode('a:t', {}, [], 'Bold ')
            ]),
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { i: '1' }),
              createMockXmlNode('a:t', {}, [], 'italic ')
            ]),
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { u: 'sng' }),
              createMockXmlNode('a:t', {}, [], 'underlined')
            ])
          ])
        ])
      ]);

      const context = createMockContext();
      const result = await textProcessor.process(textBoxXml, context);
      const content = result.getContent();

      expect(content).toContain('font-weight: bold');
      expect(content).toContain('font-style: italic');
      expect(content).toContain('Bold ');
      expect(content).toContain('italic ');
      expect(content).toContain('underlined');
    });
  });
});