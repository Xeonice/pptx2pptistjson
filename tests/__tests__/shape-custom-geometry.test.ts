/**
 * Tests for custom geometry analysis in ShapeProcessor
 */

import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import { Theme } from '../../app/lib/models/domain/Theme';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import JSZip from 'jszip';

describe('ShapeProcessor Custom Geometry Analysis', () => {
  let shapeProcessor: ShapeProcessor;
  let xmlParser: XmlParseService;
  let idGenerator: IdGenerator;
  let mockTheme: Theme;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    shapeProcessor = new ShapeProcessor(xmlParser);
    idGenerator = new IdGenerator();
    mockTheme = new Theme();
  });

  describe('analyzeCustomGeometry', () => {
    it('should detect circular custom geometry with 4 cubic bezier curves', () => {
      // Create mock XML node for circular custom geometry
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: [
          {
            name: 'a:pathLst',
            children: [
              {
                name: 'a:path',
                attributes: { w: '182880', h: '182880' },
                children: [
                  {
                    name: 'a:moveTo',
                    children: [
                      {
                        name: 'a:pt',
                        attributes: { x: '91440', y: '0' }
                      }
                    ]
                  },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] }
                ]
              }
            ]
          }
        ]
      };

      // Use reflection to access private method
      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('ellipse');
    });

    it('should return custom for non-square geometry', () => {
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: [
          {
            name: 'a:pathLst',
            children: [
              {
                name: 'a:path',
                attributes: { w: '200000', h: '100000' }, // Not square
                children: [
                  {
                    name: 'a:moveTo',
                    children: [
                      {
                        name: 'a:pt',
                        attributes: { x: '100000', y: '0' }
                      }
                    ]
                  },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] }
                ]
              }
            ]
          }
        ]
      };

      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('custom');
    });

    it('should return custom for geometry with incorrect number of bezier curves', () => {
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: [
          {
            name: 'a:pathLst',
            children: [
              {
                name: 'a:path',
                attributes: { w: '182880', h: '182880' },
                children: [
                  {
                    name: 'a:moveTo',
                    children: [
                      {
                        name: 'a:pt',
                        attributes: { x: '91440', y: '0' }
                      }
                    ]
                  },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] }
                  // Only 2 cubic bezier curves instead of 4
                ]
              }
            ]
          }
        ]
      };

      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('custom');
    });

    it('should return custom for geometry not starting from center-top', () => {
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: [
          {
            name: 'a:pathLst',
            children: [
              {
                name: 'a:path',
                attributes: { w: '182880', h: '182880' },
                children: [
                  {
                    name: 'a:moveTo',
                    children: [
                      {
                        name: 'a:pt',
                        attributes: { x: '0', y: '0' } // Start from corner, not center-top
                      }
                    ]
                  },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] },
                  { name: 'a:cubicBezTo', children: [] }
                ]
              }
            ]
          }
        ]
      };

      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('custom');
    });

    it('should return custom when pathLst is missing', () => {
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: []
      };

      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('custom');
    });

    it('should return custom when path is missing', () => {
      const mockCustGeomNode: XmlNode = {
        name: 'a:custGeom',
        children: [
          {
            name: 'a:pathLst',
            children: []
          }
        ]
      };

      const result = (shapeProcessor as any).analyzeCustomGeometry(mockCustGeomNode);
      expect(result).toBe('custom');
    });
  });

  describe('Shape processing with custom geometry', () => {
    it('should process shape with custom circular geometry correctly', async () => {
      // Mock shape XML node with custom geometry
      const mockShapeNode: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '6', name: 'Circle 1' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:xfrm',
                children: [
                  {
                    name: 'a:off',
                    attributes: { x: '1000000', y: '1000000' }
                  },
                  {
                    name: 'a:ext',
                    attributes: { cx: '182880', cy: '182880' }
                  }
                ]
              },
              {
                name: 'a:custGeom',
                children: [
                  {
                    name: 'a:pathLst',
                    children: [
                      {
                        name: 'a:path',
                        attributes: { w: '182880', h: '182880' },
                        children: [
                          {
                            name: 'a:moveTo',
                            children: [
                              {
                                name: 'a:pt',
                                attributes: { x: '91440', y: '0' }
                              }
                            ]
                          },
                          { name: 'a:cubicBezTo', children: [] },
                          { name: 'a:cubicBezTo', children: [] },
                          { name: 'a:cubicBezTo', children: [] },
                          { name: 'a:cubicBezTo', children: [] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const context: ProcessingContext = {
        zip: new JSZip(),
        slideNumber: 1,
        slideId: 'test-slide-1',
        theme: mockTheme,
        relationships: new Map(),
        basePath: 'ppt/slides/',
        options: {},
        warnings: [],
        idGenerator
      };

      const result = await shapeProcessor.process(mockShapeNode, context);

      expect(result.getShapeType()).toBe('ellipse');
      
      // The custom geometry processing will use the actual EMU coordinates and dimensions
      // rather than fixed 200x200. The expected path should match the processed custom geometry.
      const shapePath = result.getShapePath();
      
      // Verify it's an ellipse path (contains arc commands)
      expect(shapePath).toMatch(/^M\s+[\d.]+\s+0\s+A\s+[\d.]+\s+[\d.]+\s+0\s+1\s+1\s+[\d.]+\s+[\d.]+\s+A\s+[\d.]+\s+[\d.]+\s+0\s+1\s+1\s+[\d.]+\s+0\s+Z$/);
      
      // Verify it starts from a center position (not 0,0)
      expect(shapePath).toMatch(/^M\s+(?!0\s)[\d.]+/);
      
      // Verify it contains proper arc commands
      expect(shapePath).toContain('A');
    });
  });
});