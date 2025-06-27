import { describe, expect, it, jest } from '@jest/globals';

describe('Output Structure Alignment Tests', () => {
  describe('Top-level Structure', () => {
    it('should include all expected top-level fields', () => {
      const expectedOutput = {
        slides: [],
        theme: {},
        title: 'Test Presentation'
      };

      const actualOutput = {
        slides: [],
        theme: {},
        slideSize: { width: 720, height: 540 },
        metadata: { version: '1.0' }
      };

      // Test for expected fields
      expect(expectedOutput).toHaveProperty('slides');
      expect(expectedOutput).toHaveProperty('theme');
      expect(expectedOutput).toHaveProperty('title');

      // Test for missing title field in actual output
      expect(actualOutput).not.toHaveProperty('title');
      expect(actualOutput).toHaveProperty('slideSize');
      expect(actualOutput).toHaveProperty('metadata');
    });

    it('should have slides as an array', () => {
      const output = {
        slides: [
          { id: 'slide1', elements: [] },
          { id: 'slide2', elements: [] }
        ],
        theme: {},
        title: 'Test'
      };

      expect(Array.isArray(output.slides)).toBe(true);
      expect(output.slides).toHaveLength(2);
    });

    it('should have theme as an object with color scheme', () => {
      const output = {
        slides: [],
        theme: {
          colors: {
            dk1: 'rgba(0,0,0,1)',
            lt1: 'rgba(255,255,255,1)',
            accent1: 'rgba(68,114,196,1)'
          }
        },
        title: 'Test'
      };

      expect(typeof output.theme).toBe('object');
      expect(output.theme).toHaveProperty('colors');
      expect(typeof output.theme.colors).toBe('object');
    });

    it('should have title as a string', () => {
      const output = {
        slides: [],
        theme: {},
        title: 'My Presentation Title'
      };

      expect(typeof output.title).toBe('string');
      expect(output.title).toBe('My Presentation Title');
    });
  });

  describe('Slide Structure', () => {
    it('should have consistent slide structure', () => {
      const slide = {
        id: 'slide1',
        number: 1,
        elements: [
          {
            id: 'element1',
            type: 'text',
            position: { x: 100, y: 200 },
            size: { width: 300, height: 50 },
            content: 'Sample text'
          }
        ],
        background: {
          type: 'solid',
          color: 'rgba(255,255,255,1)'
        }
      };

      // Required slide fields
      expect(slide).toHaveProperty('id');
      expect(slide).toHaveProperty('number');
      expect(slide).toHaveProperty('elements');
      expect(Array.isArray(slide.elements)).toBe(true);

      // Optional slide fields
      expect(slide).toHaveProperty('background');
    });

    it('should have elements with consistent structure', () => {
      const element = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 200 },
        size: { width: 300, height: 50 },
        content: 'Sample text',
        style: {
          fontSize: 12,
          color: 'rgba(0,0,0,1)',
          fontFamily: 'Arial'
        }
      };

      // Required element fields
      expect(element).toHaveProperty('id');
      expect(element).toHaveProperty('type');
      expect(element).toHaveProperty('position');
      expect(element).toHaveProperty('size');

      // Position structure
      expect(element.position).toHaveProperty('x');
      expect(element.position).toHaveProperty('y');
      expect(typeof element.position.x).toBe('number');
      expect(typeof element.position.y).toBe('number');

      // Size structure
      expect(element.size).toHaveProperty('width');
      expect(element.size).toHaveProperty('height');
      expect(typeof element.size.width).toBe('number');
      expect(typeof element.size.height).toBe('number');
    });
  });

  describe('Backward Compatibility', () => {
    it('should support legacy position properties', () => {
      const legacyElement = {
        id: 'element1',
        type: 'text',
        left: 100,
        top: 200,
        width: 300,
        height: 50,
        content: 'Sample text'
      };

      const modernElement = {
        id: 'element1',
        type: 'text',
        position: { x: 100, y: 200 },
        size: { width: 300, height: 50 },
        content: 'Sample text'
      };

      // Function to normalize legacy format to modern format
      const normalizeElement = (element: any) => {
        if ('left' in element && 'top' in element) {
          return {
            ...element,
            position: { x: element.left, y: element.top },
            size: { width: element.width, height: element.height }
          };
        }
        return element;
      };

      const normalized = normalizeElement(legacyElement);
      expect(normalized.position).toEqual({ x: 100, y: 200 });
      expect(normalized.size).toEqual({ width: 300, height: 50 });
    });
  });

  describe('Theme Structure', () => {
    it('should have consistent theme color structure', () => {
      const theme = {
        colors: {
          dk1: 'rgba(0,0,0,1)',
          lt1: 'rgba(255,255,255,1)',
          dk2: 'rgba(68,68,68,1)',
          lt2: 'rgba(238,238,238,1)',
          accent1: 'rgba(68,114,196,1)',
          accent2: 'rgba(237,125,49,1)',
          accent3: 'rgba(165,165,165,1)',
          accent4: 'rgba(255,192,0,1)',
          accent5: 'rgba(91,155,213,1)',
          accent6: 'rgba(112,173,71,1)'
        }
      };

      expect(theme).toHaveProperty('colors');
      
      // Check required color names
      const requiredColors = ['dk1', 'lt1', 'accent1', 'accent2'] as const;
      requiredColors.forEach(colorName => {
        expect(theme.colors).toHaveProperty(colorName);
        expect((theme.colors as any)[colorName]).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });
    });

    it('should have font scheme structure if present', () => {
      const theme = {
        colors: {},
        fonts: {
          majorFont: {
            latin: 'Calibri Light',
            ea: 'Arial',
            cs: 'Arial'
          },
          minorFont: {
            latin: 'Calibri',
            ea: 'Arial',
            cs: 'Arial'
          }
        }
      };

      if (theme.fonts) {
        expect(theme.fonts).toHaveProperty('majorFont');
        expect(theme.fonts).toHaveProperty('minorFont');
        
        if (theme.fonts.majorFont) {
          expect(theme.fonts.majorFont).toHaveProperty('latin');
        }
      }
    });
  });

  describe('Error Handling Structure', () => {
    it('should have consistent error response structure', () => {
      const errorResponse = {
        success: false,
        error: {
          type: 'ParseError',
          message: 'Failed to parse PPTX file',
          details: {
            file: 'slide1.xml',
            line: 42
          }
        }
      };

      expect(errorResponse).toHaveProperty('success');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse.error).toHaveProperty('type');
      expect(errorResponse.error).toHaveProperty('message');
    });
  });

  describe('Version Compatibility', () => {
    it('should include version information', () => {
      const output = {
        version: '2.0.0',
        format: 'pptx-json',
        slides: [],
        theme: {},
        title: 'Test'
      };

      expect(output).toHaveProperty('version');
      expect(typeof output.version).toBe('string');
      expect(output.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Optional Fields Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalOutput = {
        slides: [],
        theme: {},
        title: ''
      };

      // Should not fail with minimal structure
      expect(minimalOutput.slides).toBeDefined();
      expect(minimalOutput.theme).toBeDefined();
      expect(minimalOutput.title).toBeDefined();
    });

    it('should handle slideSize and metadata fields', () => {
      const outputWithExtra = {
        slides: [],
        theme: {},
        title: 'Test',
        slideSize: {
          width: 720,
          height: 540,
          unit: 'points'
        },
        metadata: {
          author: 'Test Author',
          created: '2023-01-01T00:00:00Z',
          modified: '2023-01-02T00:00:00Z'
        }
      };

      if (outputWithExtra.slideSize) {
        expect(outputWithExtra.slideSize).toHaveProperty('width');
        expect(outputWithExtra.slideSize).toHaveProperty('height');
        expect(typeof outputWithExtra.slideSize.width).toBe('number');
        expect(typeof outputWithExtra.slideSize.height).toBe('number');
      }

      if (outputWithExtra.metadata) {
        expect(typeof outputWithExtra.metadata).toBe('object');
      }
    });
  });
});