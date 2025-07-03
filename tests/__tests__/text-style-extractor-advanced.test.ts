import { TextStyleExtractor } from '../../app/lib/services/text/TextStyleExtractor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import JSZip from 'jszip';

describe('TextStyleExtractor Advanced Coverage Tests', () => {
  let textStyleExtractor: TextStyleExtractor;
  let xmlParser: XmlParseService;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    textStyleExtractor = new TextStyleExtractor(xmlParser);
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
    idGenerator: new IdGenerator(),
    theme: ColorTestUtils.createMockTheme({}),
    ...overrides
  });

  describe('Text content extraction by paragraphs', () => {
    it('should extract multiple paragraphs with different styles', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800', b: '1' }),
            createMockXmlNode('a:t', {}, [], 'First paragraph')
          ])
        ]),
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1600', i: '1' }),
            createMockXmlNode('a:t', {}, [], 'Second paragraph')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs).toHaveLength(2);
      expect(result.paragraphs[0]).toHaveLength(1);
      expect(result.paragraphs[1]).toHaveLength(1);
      
      expect(result.paragraphs[0][0].content).toBe('First paragraph');
      expect(result.paragraphs[0][0].style?.bold).toBe(true);
      expect(result.paragraphs[0][0].style?.fontSize).toBe(18);
      
      expect(result.paragraphs[1][0].content).toBe('Second paragraph');
      expect(result.paragraphs[1][0].style?.italic).toBe(true);
      expect(result.paragraphs[1][0].style?.fontSize).toBe(16);
    });

    it('should handle paragraphs with multiple runs', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { b: '1' }),
            createMockXmlNode('a:t', {}, [], 'Bold text ')
          ]),
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { i: '1' }),
            createMockXmlNode('a:t', {}, [], 'italic text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs).toHaveLength(1);
      expect(result.paragraphs[0]).toHaveLength(2);
      
      expect(result.paragraphs[0][0].content).toBe('Bold text ');
      expect(result.paragraphs[0][0].style?.bold).toBe(true);
      
      expect(result.paragraphs[0][1].content).toBe('italic text');
      expect(result.paragraphs[0][1].style?.italic).toBe(true);
    });

    it('should handle empty paragraphs', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}),
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Non-empty paragraph')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs).toHaveLength(2);
      expect(result.paragraphs[0]).toHaveLength(0);
      expect(result.paragraphs[1]).toHaveLength(1);
      expect(result.paragraphs[1][0].content).toBe('Non-empty paragraph');
    });

    it('should handle paragraphs with line breaks', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Line 1')
          ]),
          createMockXmlNode('a:br'),
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Line 2')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0]).toHaveLength(3); // text, br, text
      expect(result.paragraphs[0][0].content).toBe('Line 1');
      expect(result.paragraphs[0][1].content).toBe('<br/>');
      expect(result.paragraphs[0][2].content).toBe('Line 2');
    });
  });

  describe('Style inheritance from shape style', () => {
    it('should apply shape style color to text without explicit color', () => {
      const shapeStyleNode = createMockXmlNode('p:style', {}, [
        createMockXmlNode('a:fontRef', { idx: '1' }, [
          createMockXmlNode('a:schemeClr', { val: 'accent1' })
        ])
      ]);

      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }), // No color specified
            createMockXmlNode('a:t', {}, [], 'Styled text')
          ])
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = textStyleExtractor.extractTextContentByParagraphs(
        txBodyNode,
        context,
        shapeStyleNode
      );

      expect(result.paragraphs[0][0].style?.color).toBe('rgba(255,0,0,1)');
    });

    it('should prioritize explicit text color over shape style', () => {
      const shapeStyleNode = createMockXmlNode('p:style', {}, [
        createMockXmlNode('a:fontRef', { idx: '1' }, [
          createMockXmlNode('a:schemeClr', { val: 'accent1' })
        ])
      ]);

      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }, [
              createMockXmlNode('a:solidFill', {}, [
                createMockXmlNode('a:srgbClr', { val: '00FF00' })
              ])
            ]),
            createMockXmlNode('a:t', {}, [], 'Explicitly colored text')
          ])
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' })
      });

      const result = textStyleExtractor.extractTextContentByParagraphs(
        txBodyNode,
        context,
        shapeStyleNode
      );

      expect(result.paragraphs[0][0].style?.color).toBe('rgba(0,255,0,1)');
    });
  });

  describe('Font handling', () => {
    it('should extract font family from latin typeface', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:latin', { typeface: 'Times New Roman' })
            ]),
            createMockXmlNode('a:t', {}, [], 'Times font text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.fontFamily).toBe('Times New Roman');
    });

    it('should extract font family from ea typeface for Asian languages', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:ea', { typeface: 'MS Gothic' })
            ]),
            createMockXmlNode('a:t', {}, [], 'Asian font text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.fontFamily).toBe('MS Gothic');
    });

    it('should extract font family from cs typeface for complex scripts', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:cs', { typeface: 'Arial Unicode MS' })
            ]),
            createMockXmlNode('a:t', {}, [], 'Complex script text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.fontFamily).toBe('Arial Unicode MS');
    });

    it('should prioritize latin over ea and cs typefaces', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:latin', { typeface: 'Arial' }),
              createMockXmlNode('a:ea', { typeface: 'MS Gothic' }),
              createMockXmlNode('a:cs', { typeface: 'Arial Unicode MS' })
            ]),
            createMockXmlNode('a:t', {}, [], 'Multi-script text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.fontFamily).toBe('Arial');
    });
  });

  describe('Text formatting attributes', () => {
    it('should extract all text formatting attributes', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {
              sz: '2400',
              b: '1',
              i: '1',
              u: 'sng',
              strike: 'sngStrike',
              cap: 'all'
            }),
            createMockXmlNode('a:t', {}, [], 'Fully formatted text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      const style = result.paragraphs[0][0].style;
      expect(style?.fontSize).toBe(24);
      expect(style?.bold).toBe(true);
      expect(style?.italic).toBe(true);
    });

    it('should handle false values for boolean attributes', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {
              b: '0',
              i: '0'
            }),
            createMockXmlNode('a:t', {}, [], 'Non-formatted text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      const style = result.paragraphs[0][0].style;
      expect(style?.bold).toBe(false);
      expect(style?.italic).toBe(false);
    });

    it('should handle missing rPr node', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Text without properties')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].content).toBe('Text without properties');
      expect(result.paragraphs[0][0].style).toBeDefined(); // Should still have style object
    });
  });

  describe('Color extraction', () => {
    it('should extract srgbClr colors', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:solidFill', {}, [
                createMockXmlNode('a:srgbClr', { val: 'FF0000' })
              ])
            ]),
            createMockXmlNode('a:t', {}, [], 'Red text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.color).toBe('rgba(255,0,0,1)');
    });

    it('should extract schemeClr colors with theme resolution', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:solidFill', {}, [
                createMockXmlNode('a:schemeClr', { val: 'accent2' })
              ])
            ]),
            createMockXmlNode('a:t', {}, [], 'Theme colored text')
          ])
        ])
      ]);

      const context = createMockContext({
        theme: ColorTestUtils.createMockTheme({ accent2: '#00FF00' })
      });

      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.color).toBe('rgba(0,255,0,1)');
    });

    it('should handle color transformations', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', {}, [
              createMockXmlNode('a:solidFill', {}, [
                createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
                  createMockXmlNode('a:alpha', { val: '50000' })
                ])
              ])
            ]),
            createMockXmlNode('a:t', {}, [], 'Semi-transparent red text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.color).toBe('rgba(255,0,0,0.5)');
    });
  });

  describe('Theme requirements validation', () => {
    it('should throw error when theme colors are used without theme', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
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
      ]);

      const context = createMockContext({ theme: undefined });

      expect(() => {
        textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);
      }).toThrow(/ProcessingContext\.theme is null\/undefined.*cannot process scheme colors/);
    });

    it('should throw error when shape style uses theme colors without theme', () => {
      const shapeStyleNode = createMockXmlNode('p:style', {}, [
        createMockXmlNode('a:fontRef', { idx: '1' }, [
          createMockXmlNode('a:schemeClr', { val: 'accent1' })
        ])
      ]);

      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }),
            createMockXmlNode('a:t', {}, [], 'Text')
          ])
        ])
      ]);

      const context = createMockContext({ theme: undefined });

      expect(() => {
        textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context, shapeStyleNode);
      }).toThrow(/ProcessingContext\.theme is null\/undefined.*cannot process scheme colors/);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing txBody', () => {
      const emptyNode = createMockXmlNode('p:txBody', {});

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(emptyNode, context);

      expect(result.paragraphs).toHaveLength(0);
    });

    it('should handle paragraphs without runs', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {})
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs).toHaveLength(1);
      expect(result.paragraphs[0]).toHaveLength(0);
    });

    it('should handle runs without text nodes', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' })
            // No text node
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0]).toHaveLength(0);
    });

    it('should handle empty text nodes', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }),
            createMockXmlNode('a:t', {}, [], '')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0]).toHaveLength(1);
      expect(result.paragraphs[0][0].content).toBe('');
    });

    it('should handle invalid font size values', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: 'invalid' }),
            createMockXmlNode('a:t', {}, [], 'Text with invalid font size')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0][0].style?.fontSize).toBeNaN();
    });

    it('should handle missing shape style fontRef', () => {
      const shapeStyleNode = createMockXmlNode('p:style', {}); // No fontRef

      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', { sz: '1800' }),
            createMockXmlNode('a:t', {}, [], 'Text')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(
        txBodyNode,
        context,
        shapeStyleNode
      );

      expect(result.paragraphs[0][0].content).toBe('Text');
      // Should not throw error, just not apply shape style
    });
  });

  describe('Mixed content handling', () => {
    it('should handle paragraph with mixed content types', () => {
      const txBodyNode = createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], 'Text before ')
          ]),
          createMockXmlNode('a:br'),
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:t', {}, [], ' text after')
          ]),
          createMockXmlNode('a:fld', { type: 'datetime1' }, [
            createMockXmlNode('a:t', {}, [], '2023-12-01')
          ])
        ])
      ]);

      const context = createMockContext();
      const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

      expect(result.paragraphs[0]).toHaveLength(2);
      expect(result.paragraphs[0][0].content).toBe('Text before ');
      expect(result.paragraphs[0][1].content).toBe(' text after');
    });
  });
});