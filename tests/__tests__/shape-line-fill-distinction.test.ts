import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { ColorTestUtils } from '../helpers/color-test-utils';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import JSZip from 'jszip';

describe('ShapeProcessor Line vs Fill Distinction', () => {
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

  it('should ignore noFill inside a:ln (line properties) and use shape solidFill', async () => {
    // Create XML structure with solidFill for shape and noFill inside a:ln for line
    const mockXml = createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
      ]),
      createMockXmlNode('p:spPr', {}, [
        createMockXmlNode('a:xfrm', {}, [
          createMockXmlNode('a:off', { x: '100', y: '200' }),
          createMockXmlNode('a:ext', { cx: '300', cy: '400' })
        ]),
        createMockXmlNode('a:prstGeom', { prst: 'roundRect' }),
        // Shape fill - this should be used
        createMockXmlNode('a:solidFill', {}, [
          createMockXmlNode('a:schemeClr', { val: 'accent4' })
        ]),
        // Line properties with noFill - this should be ignored for shape fill extraction
        createMockXmlNode('a:ln', {}, [
          createMockXmlNode('a:noFill', {})
        ])
      ])
    ]);

    const realThemeColors = {
      "accent1": "#002F71",
      "accent2": "#FBAE01", 
      "accent3": "#002F71",
      "accent4": "#FBAE01",
      "accent5": "#002F71",
      "accent6": "#FBAE01",
      "dk1": "#000000",
      "dk2": "#002F71",
      "lt1": "#FFFFFF",
      "lt2": "#E7E6E6",
      "hyperlink": "#002F71",
      "followedHyperlink": "#FBAE01"
    };

    const context = createMockContext({
      theme: ColorTestUtils.createMockTheme(realThemeColors)
    });

    const result = await shapeProcessor.process(mockXml, context);
    const fill = result.getFill();

    // Should extract accent4 color from shape solidFill, not be affected by a:ln/a:noFill
    expect(fill).toBeDefined();
    expect(fill?.color).toBe('rgba(251,174,1,1)'); // accent4 #FBAE01
  });

  it('should use noFill from shape properties (direct child of spPr)', async () => {
    // Create XML structure with noFill as direct child of spPr
    const mockXml = createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
      ]),
      createMockXmlNode('p:spPr', {}, [
        createMockXmlNode('a:xfrm', {}, [
          createMockXmlNode('a:off', { x: '100', y: '200' }),
          createMockXmlNode('a:ext', { cx: '300', cy: '400' })
        ]),
        createMockXmlNode('a:prstGeom', { prst: 'roundRect' }),
        // Shape noFill - this should be used
        createMockXmlNode('a:noFill', {}),
        // Line properties with solidFill - this should be ignored for shape fill extraction
        createMockXmlNode('a:ln', {}, [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ])
        ])
      ])
    ]);

    const context = createMockContext({
      theme: ColorTestUtils.createMockTheme({})
    });

    const result = await shapeProcessor.process(mockXml, context);
    const fill = result.getFill();

    // Should extract noFill from shape properties, resulting in transparent
    expect(fill).toBeDefined();
    expect(fill?.color).toBe('rgba(0,0,0,0)'); // Transparent due to noFill
  });

  it('should ignore both solidFill and noFill inside a:ln when shape has no fill', async () => {
    // Create XML structure with no shape fill but line properties
    const mockXml = createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
      ]),
      createMockXmlNode('p:spPr', {}, [
        createMockXmlNode('a:xfrm', {}, [
          createMockXmlNode('a:off', { x: '100', y: '200' }),
          createMockXmlNode('a:ext', { cx: '300', cy: '400' })
        ]),
        createMockXmlNode('a:prstGeom', { prst: 'roundRect' }),
        // No shape fill properties
        // Line properties - these should be ignored for shape fill extraction
        createMockXmlNode('a:ln', {}, [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ]),
          createMockXmlNode('a:noFill', {})
        ])
      ])
    ]);

    const context = createMockContext({
      theme: ColorTestUtils.createMockTheme({})
    });

    const result = await shapeProcessor.process(mockXml, context);
    const fill = result.getFill();

    // Should not extract any fill (no shape fill properties), line properties should be ignored
    expect(fill).toBeUndefined();
  });

  it('should prioritize shape solidFill over line solidFill', async () => {
    // Create XML structure with different colors for shape and line
    const mockXml = createMockXmlNode('p:sp', {}, [
      createMockXmlNode('p:nvSpPr', {}, [
        createMockXmlNode('p:cNvPr', { id: '1', name: 'Shape 1' })
      ]),
      createMockXmlNode('p:spPr', {}, [
        createMockXmlNode('a:xfrm', {}, [
          createMockXmlNode('a:off', { x: '100', y: '200' }),
          createMockXmlNode('a:ext', { cx: '300', cy: '400' })
        ]),
        createMockXmlNode('a:prstGeom', { prst: 'roundRect' }),
        // Shape fill - blue - this should be used
        createMockXmlNode('a:solidFill', {}, [
          createMockXmlNode('a:srgbClr', { val: '0000FF' })
        ]),
        // Line fill - red - this should be ignored for shape fill extraction
        createMockXmlNode('a:ln', {}, [
          createMockXmlNode('a:solidFill', {}, [
            createMockXmlNode('a:srgbClr', { val: 'FF0000' })
          ])
        ])
      ])
    ]);

    const context = createMockContext({
      theme: ColorTestUtils.createMockTheme({})
    });

    const result = await shapeProcessor.process(mockXml, context);
    const fill = result.getFill();

    // Should extract blue color from shape solidFill, not red from line solidFill
    expect(fill).toBeDefined();
    expect(fill?.color).toBe('rgba(0,0,255,1)'); // Blue from shape, not red from line
  });
});