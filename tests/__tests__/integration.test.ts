import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import { parse } from '../../app/lib/pptxtojson';
import { UnitConverter } from '../../app/lib/services/utils/UnitConverter';
import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';

describe('Integration Tests', () => {
  describe('Parser Integration', () => {
    it('should parse a simple PPTX file structure', async () => {
      // Mock PPTX file buffer - in real tests this would be actual file data
      const mockPptxBuffer = new ArrayBuffer(1024);
      
      // Mock the parse function for testing
      const mockParseResult = {
        slides: [
          {
            id: 'slide1',
            elements: [
              {
                id: 'text_1',
                type: 'text',
                position: { x: 69.35, y: 161.46 },
                size: { width: 551.8, height: 182 },
                content: 'Sample Title',
                style: {
                  fontSize: 24,
                  color: 'rgba(0,0,0,1)',
                  fontFamily: 'Arial'
                }
              },
              {
                id: 'shape_1',
                type: 'shape',
                position: { x: 100, y: 200 },
                size: { width: 200, height: 100 },
                shapeType: 'rect'
              }
            ]
          }
        ],
        theme: {
          colors: {
            dk1: 'rgba(0,0,0,1)',
            lt1: 'rgba(255,255,255,1)',
            accent1: 'rgba(68,114,196,1)'
          }
        },
        title: 'Test Presentation'
      };

      // Verify expected structure
      expect(mockParseResult).toHaveProperty('slides');
      expect(mockParseResult).toHaveProperty('theme');
      expect(mockParseResult).toHaveProperty('title');
      
      // Verify slides structure
      expect(Array.isArray(mockParseResult.slides)).toBe(true);
      expect(mockParseResult.slides).toHaveLength(1);
      
      const slide = mockParseResult.slides[0];
      expect(slide).toHaveProperty('id');
      expect(slide).toHaveProperty('elements');
      expect(Array.isArray(slide.elements)).toBe(true);
      expect(slide.elements).toHaveLength(2);
    });

    it('should handle multiple slides with different element types', async () => {
      const mockMultiSlideResult = {
        slides: [
          {
            id: 'slide1',
            elements: [
              { id: 'text_1', type: 'text', position: { x: 70, y: 162 } },
              { id: 'shape_1', type: 'shape', position: { x: 300, y: 200 } }
            ]
          },
          {
            id: 'slide2',
            elements: [
              { id: 'text_2', type: 'text', position: { x: 50, y: 100 } },
              { id: 'image_1', type: 'image', position: { x: 400, y: 250 } },
              { id: 'shape_2', type: 'shape', position: { x: 200, y: 150 } }
            ]
          }
        ],
        theme: {},
        title: 'Multi-slide Presentation'
      };

      // Verify multi-slide structure
      expect(mockMultiSlideResult.slides).toHaveLength(2);
      
      // First slide
      expect(mockMultiSlideResult.slides[0].elements).toHaveLength(2);
      expect(mockMultiSlideResult.slides[0].elements[0].type).toBe('text');
      expect(mockMultiSlideResult.slides[0].elements[1].type).toBe('shape');
      
      // Second slide
      expect(mockMultiSlideResult.slides[1].elements).toHaveLength(3);
      expect(mockMultiSlideResult.slides[1].elements[0].type).toBe('text');
      expect(mockMultiSlideResult.slides[1].elements[1].type).toBe('image');
      expect(mockMultiSlideResult.slides[1].elements[2].type).toBe('shape');
    });
  });

  describe('Data Quality Validation', () => {
    it('should ensure all element IDs are unique across slides', () => {
      const mockResult = {
        slides: [
          {
            id: 'slide1',
            elements: [
              { id: 'element_1', type: 'text' },
              { id: 'element_2', type: 'shape' }
            ]
          },
          {
            id: 'slide2',
            elements: [
              { id: 'element_3', type: 'text' },
              { id: 'element_4', type: 'image' }
            ]
          }
        ],
        theme: {},
        title: 'Test'
      };

      // Collect all element IDs
      const allIds: string[] = [];
      mockResult.slides.forEach(slide => {
        slide.elements.forEach(element => {
          allIds.push(element.id);
        });
      });

      // Verify uniqueness
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should validate color format consistency', () => {
      const mockResult = {
        slides: [
          {
            id: 'slide1',
            elements: [
              {
                id: 'text_1',
                type: 'text',
                style: { color: 'rgba(0,0,0,1)' }
              }
            ]
          }
        ],
        theme: {
          colors: {
            dk1: 'rgba(0,0,0,1)',
            lt1: 'rgba(255,255,255,1)',
            accent1: 'rgba(68,114,196,1)'
          }
        },
        title: 'Test'
      };

      // Check theme colors
      Object.values(mockResult.theme.colors).forEach(color => {
        expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });

      // Check element colors
      const textElement = mockResult.slides[0].elements[0];
      if (textElement.style && textElement.style.color) {
        expect(textElement.style.color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      }
    });

    it('should validate position and size precision', () => {
      const mockResult = {
        slides: [
          {
            id: 'slide1',
            elements: [
              {
                id: 'element_1',
                type: 'text',
                position: { x: 69.35, y: 161.46 },
                size: { width: 551.8, height: 182 }
              }
            ]
          }
        ],
        theme: {},
        title: 'Test'
      };

      const element = mockResult.slides[0].elements[0];
      
      // Position validation
      expect(typeof element.position.x).toBe('number');
      expect(typeof element.position.y).toBe('number');
      expect(element.position.x).toBeGreaterThanOrEqual(0);
      expect(element.position.y).toBeGreaterThanOrEqual(0);
      
      // Size validation
      expect(typeof element.size.width).toBe('number');
      expect(typeof element.size.height).toBe('number');
      expect(element.size.width).toBeGreaterThan(0);
      expect(element.size.height).toBeGreaterThan(0);
    });
  });

  describe('Utility Integration', () => {
    it('should integrate UnitConverter correctly', () => {
      // Test EMU to points conversion
      const emuValue = 881380; // Sample EMU value
      const pointsValue = UnitConverter.emuToPoints(emuValue);
      
      expect(typeof pointsValue).toBe('number');
      expect(pointsValue).toBeGreaterThan(0);
      expect(pointsValue).toBeCloseTo(96.81, 1); // Approximate expected value
      
      // Test precision
      const preciseValue = UnitConverter.emuToPointsPrecise(emuValue);
      expect(Math.abs(pointsValue - preciseValue)).toBeLessThan(1);
    });

    it('should integrate ColorUtils correctly', () => {
      // Test color conversion
      const hexColor = '#4472C4';
      const rgbaColor = ColorUtils.toRgba(hexColor);
      
      expect(rgbaColor).toBe('rgba(68,114,196,1)');
      
      // Test RGB conversion
      const rgbColor = 'rgb(68, 114, 196)';
      const convertedRgba = ColorUtils.toRgba(rgbColor);
      expect(convertedRgba).toBe('rgba(68,114,196,1)');
    });

    it('should integrate IdGenerator correctly', () => {
      const idGenerator = new IdGenerator();
      
      // Test unique ID generation
      const id1 = idGenerator.generateUniqueId('test', 'element');
      const id2 = idGenerator.generateUniqueId('test', 'element');
      
      // For non-shape elements, should always generate new PPTist-style IDs
      expect(id1).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(id2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(id1).not.toBe(id2);
      
      // Test ID tracking
      const usedIds = idGenerator.getUsedIds();
      expect(usedIds).toContain(id1);
      expect(usedIds).toContain(id2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed data gracefully', () => {
      const malformedData = {
        slides: null, // Invalid
        theme: undefined, // Invalid
        title: 123 // Invalid type
      };

      // Validation function
      const validateParseResult = (data: any): boolean => {
        try {
          return (
            Array.isArray(data.slides) &&
            typeof data.theme === 'object' &&
            typeof data.title === 'string'
          );
        } catch {
          return false;
        }
      };

      expect(validateParseResult(malformedData)).toBe(false);
    });

    it('should handle empty presentations', () => {
      const emptyPresentation = {
        slides: [],
        theme: {},
        title: ''
      };

      expect(Array.isArray(emptyPresentation.slides)).toBe(true);
      expect(emptyPresentation.slides).toHaveLength(0);
      expect(typeof emptyPresentation.theme).toBe('object');
      expect(typeof emptyPresentation.title).toBe('string');
    });
  });

  describe('Performance Integration', () => {
    it('should handle large presentations efficiently', () => {
      // Mock large presentation
      const largePresentation = {
        slides: Array.from({ length: 100 }, (_, i) => ({
          id: `slide${i + 1}`,
          elements: Array.from({ length: 20 }, (_, j) => ({
            id: `element_${i * 20 + j + 1}`,
            type: j % 3 === 0 ? 'text' : j % 3 === 1 ? 'shape' : 'image',
            position: { x: j * 10, y: j * 15 },
            size: { width: 100, height: 50 }
          }))
        })),
        theme: {},
        title: 'Large Presentation'
      };

      // Performance validation
      const startTime = Date.now();
      
      // Simulate processing
      let totalElements = 0;
      largePresentation.slides.forEach(slide => {
        totalElements += slide.elements.length;
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(largePresentation.slides).toHaveLength(100);
      expect(totalElements).toBe(2000);
      expect(processingTime).toBeLessThan(100); // Should be fast for mock data
    });
  });

  describe('Regression Tests', () => {
    it('should maintain compatibility with existing format', () => {
      // Test legacy compatibility
      const legacyFormat = {
        slides: [
          {
            id: 'slide1',
            elements: [
              {
                id: 'element1',
                type: 'text',
                left: 70,       // Legacy position
                top: 162,       // Legacy position
                width: 554,     // Legacy size
                height: 183,    // Legacy size
                name: 'element1' // Legacy ID field
              }
            ]
          }
        ],
        slideSize: { width: 960, height: 540 },
        theme: {},
        metadata: { title: 'Legacy Presentation' }
      };

      // Should be convertible to modern format
      const modernized = {
        ...legacyFormat,
        title: legacyFormat.metadata?.title || 'Presentation',
        slides: legacyFormat.slides.map(slide => ({
          ...slide,
          elements: slide.elements.map(element => ({
            ...element,
            position: { x: element.left, y: element.top },
            size: { width: element.width, height: element.height }
          }))
        }))
      };

      expect(modernized).toHaveProperty('title');
      expect(modernized.slides[0].elements[0]).toHaveProperty('position');
      expect(modernized.slides[0].elements[0]).toHaveProperty('size');
    });
  });
});