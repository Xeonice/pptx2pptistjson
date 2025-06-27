import { TextProcessor } from '../../app/lib/services/element/processors/TextProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { colorTestData } from '../fixtures/color-test-data';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';

describe('TextProcessor Color Integration Tests', () => {
  let textProcessor: TextProcessor;
  let xmlParser: XmlParseService;
  let idGenerator: IdGenerator;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    textProcessor = new TextProcessor(xmlParser);
    idGenerator = new IdGenerator();
  });

  // Helper to create mock XML nodes
  const createMockXmlNode = (name: string, attributes: Record<string, string> = {}, children: XmlNode[] = [], content?: string): XmlNode => ({
    name,
    attributes,
    children,
    content
  });

  const createMockTextShapeXml = (colorData: any, text: string = 'Test Text'): XmlNode => {
    return createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' })
      ]),
      createMockXmlNode('p:spPr', {}, [
        createMockXmlNode('a:xfrm', {}, [
          createMockXmlNode('a:off', { x: '100', y: '200' }),
          createMockXmlNode('a:ext', { cx: '300', cy: '400' })
        ])
      ]),
      createMockXmlNode('p:txBody', {}, [
        createMockXmlNode('a:p', {}, [
          createMockXmlNode('a:r', {}, [
            createMockXmlNode('a:rPr', colorData.attrs || {}, colorData.children || []),
            createMockXmlNode('a:t', {}, [], text)
          ])
        ])
      ])
    ]);
  };

  describe('Color extraction from text runs', () => {
    it('should extract direct RGB colors from text', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
    });

    it('should extract theme colors from text', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' })
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' }),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
      expect(textContent[0].style?.themeColorType).toBe('accent1');
    });

    it('should apply transformations to text colors', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
              createMockXmlNode('a:alpha', { val: '50000' })
            ])
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,0.5)');
    });

    it('should handle multiple text runs with different colors', async () => {
      const mockXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:off', { x: '100', y: '200' }),
            createMockXmlNode('a:ext', { cx: '300', cy: '400' })
          ])
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            // First run - red text
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:srgbClr', { val: 'FF0000' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Red ')
            ]),
            // Second run - blue text
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:srgbClr', { val: '0000FF' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Blue')
            ])
          ])
        ])
      ]);

      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(2);
      expect(textContent[0].text).toBe('Red ');
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
      expect(textContent[1].text).toBe('Blue');
      expect(textContent[1].style?.color).toBe('rgba(0,0,255,1)');
    });

    it('should handle complex color transformations in text', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
              createMockXmlNode('a:shade', { val: '25000' }),
              createMockXmlNode('a:alpha', { val: '75000' })
            ])
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(ColorTestUtils.isValidRgbaFormat(textContent[0].style?.color || '')).toBe(true);
      expect(textContent[0].style?.color).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/);
    });
  });

  describe('Theme integration', () => {
    it('should create proper theme content structure', async () => {
      const mockTheme = ColorTestUtils.createMockTheme({
        accent1: '#FF0000',
        accent2: '#00FF00',
        dk1: '#000000',
        lt1: '#FFFFFF'
      });

      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' })
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: mockTheme,
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
      expect(textContent[0].style?.themeColorType).toBe('accent1');
    });

    it('should handle missing theme gracefully', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' })
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: undefined,
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      // Should handle missing theme gracefully
      expect(textContent[0].style?.color).toBeUndefined();
    });

    it('should map all theme colors correctly', async () => {
      const allThemeColors = colorTestData.themeColors.office2019;
      // Map theme data names to PowerPoint XML theme color names
      const mappedThemeColors = {
        ...allThemeColors,
        hlink: allThemeColors.hyperlink,
        folHlink: allThemeColors.followedHyperlink
      };
      const mockTheme = ColorTestUtils.createMockTheme(mappedThemeColors);

      const themeColorTests = [
        'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6',
        'dk1', 'dk2', 'lt1', 'lt2', 'hlink', 'folHlink'
      ];

      for (const themeColor of themeColorTests) {
        const colorData = {
          attrs: { sz: '1800' },
          children: [
            createMockXmlNode('a:solidFill', {}, [
              createMockXmlNode('a:schemeClr', { val: themeColor })
            ])
          ]
        };

        const mockXml = createMockTextShapeXml(colorData);
        const context = {
          idGenerator,
          theme: mockTheme,
          slideSize: { width: 1000, height: 750 }
        };

        const result = await textProcessor.process(mockXml, context);
        const textContent = result.getContent();

        expect(textContent).toHaveLength(1);
        expect(ColorTestUtils.isValidRgbaFormat(textContent[0].style?.color || '')).toBe(true);
        expect(textContent[0].style?.themeColorType).toBe(themeColor);
      }
    });

    it('should handle theme colors with transformations', async () => {
      const mockTheme = ColorTestUtils.createMockTheme({ accent1: '#FF0000' });

      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' }, [
              createMockXmlNode('a:lumMod', { val: '80000' }),
              createMockXmlNode('a:lumOff', { val: '20000' })
            ])
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: mockTheme,
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(ColorTestUtils.isValidRgbaFormat(textContent[0].style?.color || '')).toBe(true);
      expect(textContent[0].style?.themeColorType).toBe('accent1');
    });
  });

  describe('Text formatting integration', () => {
    it('should preserve other text formatting when extracting colors', async () => {
      const colorData = {
        attrs: { 
          sz: '2000',
          b: '1',
          i: '1',
          u: 'sng'
        },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ]),
          createMockXmlNode('a:latin', { typeface: 'Arial' })
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      const style = textContent[0].style;
      expect(style?.color).toBe('rgba(255,0,0,1)');
      expect(style?.fontSize).toBe(Math.round((2000 / 100) * 1.39)); // Font size scaling
      expect(style?.bold).toBe(true);
      expect(style?.italic).toBe(true);
      expect(style?.underline).toBe(true);
      expect(style?.fontFamily).toBe('Arial');
    });

    it('should handle mixed formatting in paragraph', async () => {
      const mockXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' })
        ]),
        createMockXmlNode('p:spPr', {}, [
          createMockXmlNode('a:xfrm', {}, [
            createMockXmlNode('a:off', { x: '100', y: '200' }),
            createMockXmlNode('a:ext', { cx: '300', cy: '400' })
          ])
        ]),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            // Bold red text
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '1800', b: '1' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:srgbClr', { val: 'FF0000' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Bold Red ')
            ]),
            // Italic blue text
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', { sz: '2000', i: '1' }, [
                createMockXmlNode('a:solidFill', {}, [
                  createMockXmlNode('a:srgbClr', { val: '0000FF' })
                ])
              ]),
              createMockXmlNode('a:t', {}, [], 'Italic Blue')
            ])
          ])
        ])
      ]);

      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(2);
      
      // First run: bold red
      expect(textContent[0].text).toBe('Bold Red ');
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
      expect(textContent[0].style?.bold).toBe(true);
      expect(textContent[0].style?.italic).toBeUndefined();
      
      // Second run: italic blue
      expect(textContent[1].text).toBe('Italic Blue');
      expect(textContent[1].style?.color).toBe('rgba(0,0,255,1)');
      expect(textContent[1].style?.bold).toBeUndefined();
      expect(textContent[1].style?.italic).toBe(true);
    });
  });

  describe('XML node conversion', () => {
    it('should convert XML nodes to objects correctly', async () => {
      // Test that the xmlNodeToObject method works correctly for color extraction
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' }, [
              createMockXmlNode('a:alpha', { val: '80000' })
            ])
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,0.8)');
    });

    it('should handle nested color structures', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:schemeClr', { val: 'accent1' }, [
              createMockXmlNode('a:shade', { val: '50000' }),
              createMockXmlNode('a:alpha', { val: '75000' })
            ])
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({ accent1: '#FF0000' }),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(ColorTestUtils.isValidRgbaFormat(textContent[0].style?.color || '')).toBe(true);
      expect(textContent[0].style?.color).toMatch(/rgba\(\d+,\d+,\d+,0\.75\)/);
      expect(textContent[0].style?.themeColorType).toBe('accent1');
    });

    it('should preserve attribute structure', async () => {
      const colorData = {
        attrs: { 
          sz: '1800',
          b: '1',
          customAttr: 'customValue'
        },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000', customColorAttr: 'colorValue' })
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBe('rgba(255,0,0,1)');
      expect(textContent[0].style?.bold).toBe(true);
      // Custom attributes should not interfere with processing
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle text without color formatting', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [] // No color information
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      expect(textContent[0].style?.color).toBeUndefined();
    });

    it('should handle malformed color XML gracefully', async () => {
      const colorData = {
        attrs: { sz: '1800' },
        children: [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', {}) // Missing val attribute
          ])
        ]
      };

      const mockXml = createMockTextShapeXml(colorData);
      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      const textContent = result.getContent();

      expect(textContent).toHaveLength(1);
      // Should handle gracefully without throwing
      expect(textContent[0].text).toBe('Test Text');
    });

    it('should handle empty text runs', async () => {
      const mockXml = createMockXmlNode('p:sp', {}, [
        createMockXmlNode('p:nvSpPr', {}, [
          createMockXmlNode('p:cNvPr', { id: '1', name: 'TextBox 1' })
        ]),
        createMockXmlNode('p:spPr', {}),
        createMockXmlNode('p:txBody', {}, [
          createMockXmlNode('a:p', {}, [
            createMockXmlNode('a:r', {}, [
              createMockXmlNode('a:rPr', {}),
              createMockXmlNode('a:t', {}, [], '') // Empty text
            ])
          ])
        ])
      ]);

      const context = {
        idGenerator,
        theme: ColorTestUtils.createMockTheme({}),
        slideSize: { width: 1000, height: 750 }
      };

      const result = await textProcessor.process(mockXml, context);
      
      // Should handle empty text runs appropriately
      expect(result).toBeDefined();
    });
  });
});