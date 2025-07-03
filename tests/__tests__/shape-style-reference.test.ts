import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { IXmlParseService } from '../../app/lib/services/interfaces/IXmlParseService';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { Theme } from '../../app/lib/models/domain/Theme';
import JSZip from 'jszip';

// Mock XML Parse Service
class MockXmlParseService implements IXmlParseService {
  findNode(parent: XmlNode, name: string): XmlNode | undefined {
    return parent.children?.find(child => 
      child.name === name || child.name.endsWith(`:${name}`)
    );
  }

  findNodes(parent: XmlNode, name: string): XmlNode[] {
    return parent.children?.filter(child => 
      child.name === name || child.name.endsWith(`:${name}`)
    ) || [];
  }

  getAttribute(node: XmlNode, name: string): string | undefined {
    return node.attributes?.[name];
  }

  parse(xmlString: string): XmlNode {
    throw new Error('Not implemented for tests');
  }

  parseXmlFromString(xmlString: string): XmlNode {
    throw new Error('Not implemented for tests');
  }

  parseDocumentFromString(xmlString: string): any {
    throw new Error('Not implemented for tests');
  }

  getChildNodes(node: XmlNode): XmlNode[] {
    return node.children || [];
  }

  getTextContent(node: XmlNode): string {
    return '';
  }

  stringify(node: XmlNode): string {
    return '';
  }
}

describe('ShapeProcessor Style Reference Support', () => {
  let processor: ShapeProcessor;
  let mockContext: ProcessingContext;
  let xmlParseService: MockXmlParseService;

  beforeEach(() => {
    xmlParseService = new MockXmlParseService();
    processor = new ShapeProcessor(xmlParseService);

    // Create mock theme with accent1 color
    const mockTheme = new Theme();
    mockTheme.setColorScheme({
      accent1: '#002F71',
      accent2: '#FF5733',
      accent3: '#FFA500',
      accent4: '#800080',
      accent5: '#008000',
      accent6: '#FFB6C1',
      dk1: '#000000',
      dk2: '#333333',
      lt1: '#FFFFFF',
      lt2: '#F0F0F0',
      hyperlink: '#0000FF',
      followedHyperlink: '#800080'
    });

    mockContext = {
      zip: new JSZip(),
      slideNumber: 1,
      slideId: 'slide1',
      theme: mockTheme,
      relationships: new Map(),
      basePath: 'ppt/slides',
      options: {
        enableDebugMode: true,
        debugOptions: {
          logProcessingDetails: true,
          includeColorResolutionTrace: true
        }
      },
      warnings: [],
      idGenerator: new IdGenerator()
    };
  });

  it('should process shape with style reference (fillRef)', async () => {
    // Create XML structure similar to the provided example
    const shapeXml: XmlNode = {
      name: 'sp',
      attributes: {},
      children: [
        {
          name: 'nvSpPr',
          attributes: {},
          children: [
            {
              name: 'cNvPr',
              attributes: { id: '6', name: '圆角矩形 5' },
              children: []
            }
          ]
        },
        {
          name: 'spPr',
          attributes: {},
          children: [
            {
              name: 'xfrm',
              attributes: {},
              children: [
                {
                  name: 'off',
                  attributes: { x: '746760', y: '2141220' },
                  children: []
                },
                {
                  name: 'ext',
                  attributes: { cx: '2120265', cy: '652145' },
                  children: []
                }
              ]
            },
            {
              name: 'prstGeom',
              attributes: { prst: 'roundRect' },
              children: [
                {
                  name: 'avLst',
                  attributes: {},
                  children: [
                    {
                      name: 'gd',
                      attributes: { name: 'adj', fmla: 'val 50000' },
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'style',
          attributes: {},
          children: [
            {
              name: 'fillRef',
              attributes: { idx: '1' },
              children: [
                {
                  name: 'schemeClr',
                  attributes: { val: 'accent1' },
                  children: []
                }
              ]
            },
            {
              name: 'lnRef',
              attributes: { idx: '2' },
              children: [
                {
                  name: 'schemeClr',
                  attributes: { val: 'accent1' },
                  children: [
                    {
                      name: 'lumMod',
                      attributes: { val: '75000' },
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

    // Spy on console.log to capture debug output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Process the shape
    const result = await processor.process(shapeXml, mockContext);

    // Verify the shape was processed
    expect(result).toBeDefined();
    expect(result.getShapeType()).toBe('roundRect');
    expect(result.getPathFormula()).toBe('roundRect');

    // Verify position and size were set
    const position = result.getPosition();
    expect(position).toBeDefined();
    expect(position!.x).toBeGreaterThan(50); // Approximate position
    expect(position!.y).toBeGreaterThan(150); // Approximate position

    const size = result.getSize();
    expect(size).toBeDefined();
    expect(size!.width).toBeGreaterThan(150); // Approximate size
    expect(size!.height).toBeGreaterThan(40); // Approximate size

    // Verify fill color was resolved from style reference
    const fill = result.getFill();
    expect(fill).toBeDefined();
    expect(fill?.color).toBeDefined();
    
    // Check that debug logging occurred
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Starting Shape Processing')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Shape geometry: roundRect')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Processing shape style references')
    );

    consoleSpy.mockRestore();
  });

  it('should fall back to direct fill when no style reference', async () => {
    const shapeXmlWithDirectFill: XmlNode = {
      name: 'sp',
      attributes: {},
      children: [
        {
          name: 'nvSpPr',
          attributes: {},
          children: [
            {
              name: 'cNvPr',
              attributes: { id: '7', name: 'Direct Fill Shape' },
              children: []
            }
          ]
        },
        {
          name: 'spPr',
          attributes: {},
          children: [
            {
              name: 'xfrm',
              attributes: {},
              children: [
                {
                  name: 'off',
                  attributes: { x: '100000', y: '100000' },
                  children: []
                },
                {
                  name: 'ext',
                  attributes: { cx: '1000000', cy: '1000000' },
                  children: []
                }
              ]
            },
            {
              name: 'prstGeom',
              attributes: { prst: 'rect' },
              children: []
            },
            {
              name: 'solidFill',
              attributes: {},
              children: [
                {
                  name: 'srgbClr',
                  attributes: { val: 'FF0000' },
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await processor.process(shapeXmlWithDirectFill, mockContext);

    expect(result).toBeDefined();
    expect(result.getShapeType()).toBe('rect');

    // Should use direct fill, not style reference
    const fill = result.getFill();
    expect(fill?.color).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('should handle missing theme gracefully', async () => {
    // Remove theme from context
    mockContext.theme = undefined;

    const shapeXmlWithStyleRef: XmlNode = {
      name: 'sp',
      attributes: {},
      children: [
        {
          name: 'nvSpPr',
          attributes: {},
          children: [
            {
              name: 'cNvPr',
              attributes: { id: '8', name: 'No Theme Shape' },
              children: []
            }
          ]
        },
        {
          name: 'spPr',
          attributes: {},
          children: [
            {
              name: 'xfrm',
              attributes: {},
              children: [
                {
                  name: 'off',
                  attributes: { x: '100000', y: '100000' },
                  children: []
                },
                {
                  name: 'ext',
                  attributes: { cx: '1000000', cy: '1000000' },
                  children: []
                }
              ]
            },
            {
              name: 'prstGeom',
              attributes: { prst: 'rect' },
              children: []
            }
          ]
        },
        {
          name: 'style',
          attributes: {},
          children: [
            {
              name: 'fillRef',
              attributes: { idx: '1' },
              children: [
                {
                  name: 'schemeClr',
                  attributes: { val: 'accent1' },
                  children: []
                }
              ]
            }
          ]
        }
      ]
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await processor.process(shapeXmlWithStyleRef, mockContext);

    expect(result).toBeDefined();
    
    // Should log error about missing theme
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No theme available for scheme color resolution')
    );

    consoleSpy.mockRestore();
  });
});