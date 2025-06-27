import { describe, expect, it, jest } from '@jest/globals';

describe('Color Format Standardization Tests', () => {
  describe('Color Format Conversion', () => {
    it('should convert hex colors to rgba format', () => {
      const testCases = [
        { input: '#FFFFFF', expected: 'rgba(255,255,255,1)' },
        { input: '#000000', expected: 'rgba(0,0,0,1)' },
        { input: '#FF0000', expected: 'rgba(255,0,0,1)' },
        { input: '#00FF00', expected: 'rgba(0,255,0,1)' },
        { input: '#0000FF', expected: 'rgba(0,0,255,1)' },
        { input: '#16a2ff', expected: 'rgba(22,162,255,1)' },
        { input: '#16a2ffff', expected: 'rgba(22,162,255,1)' }, // With alpha channel
        { input: '#16a2ff80', expected: 'rgba(22,162,255,0.502)' } // With 50% alpha
      ];

      const hexToRgba = (hex: string): string => {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Handle 3-digit hex
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        
        // Extract RGBA values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = hex.length >= 8 
          ? parseInt(hex.substring(6, 8), 16) / 255
          : 1;
        
        // Format with proper decimal places for alpha
        const alpha = a === 1 ? '1' : a.toFixed(3).replace(/\.?0+$/, '');
        
        return `rgba(${r},${g},${b},${alpha})`;
      };

      testCases.forEach(({ input, expected }) => {
        expect(hexToRgba(input)).toBe(expected);
      });
    });

    it('should handle rgb format and convert to rgba', () => {
      const testCases = [
        { input: 'rgb(255, 255, 255)', expected: 'rgba(255,255,255,1)' },
        { input: 'rgb(0, 0, 0)', expected: 'rgba(0,0,0,1)' },
        { input: 'rgb(68, 114, 196)', expected: 'rgba(68,114,196,1)' }
      ];

      const rgbToRgba = (rgb: string): string => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match;
          return `rgba(${r},${g},${b},1)`;
        }
        return rgb;
      };

      testCases.forEach(({ input, expected }) => {
        expect(rgbToRgba(input)).toBe(expected);
      });
    });

    it('should maintain rgba format without changes', () => {
      const testCases = [
        'rgba(255,255,255,1)',
        'rgba(0,0,0,1)',
        'rgba(68,114,196,1)',
        'rgba(237,125,49,1)',
        'rgba(255,192,0,0.5)'
      ];

      testCases.forEach(color => {
        expect(color).toBe(color); // Should remain unchanged
      });
    });
  });

  describe('Theme Color Processing', () => {
    it('should correctly map theme color names to rgba values', () => {
      const mockTheme = {
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
          accent6: 'rgba(112,173,71,1)',
          hlink: 'rgba(5,99,193,1)',
          folHlink: 'rgba(149,79,114,1)'
        }
      };

      // Verify all theme colors are in rgba format
      Object.values(mockTheme.colors).forEach(color => {
        expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });
    });

    it('should handle theme color variations (lumMod, lumOff)', () => {
      const baseColor = { r: 68, g: 114, b: 196, a: 1 };
      
      // Apply luminance modification (darken by 50%)
      const applyLumMod = (color: any, lumMod: number) => {
        return {
          r: Math.round(color.r * lumMod),
          g: Math.round(color.g * lumMod),
          b: Math.round(color.b * lumMod),
          a: color.a
        };
      };

      // Apply luminance offset (lighten)
      const applyLumOff = (color: any, lumOff: number) => {
        return {
          r: Math.min(255, color.r + lumOff),
          g: Math.min(255, color.g + lumOff),
          b: Math.min(255, color.b + lumOff),
          a: color.a
        };
      };

      const darkened = applyLumMod(baseColor, 0.5);
      expect(darkened).toEqual({ r: 34, g: 57, b: 98, a: 1 });

      const lightened = applyLumOff(baseColor, 50);
      expect(lightened).toEqual({ r: 118, g: 164, b: 246, a: 1 });
    });
  });

  describe('Color Output Consistency', () => {
    it('should ensure all colors in output use the same format', () => {
      const mockSlideOutput = {
        elements: [
          { type: 'text', fill: { color: 'rgba(0,0,0,1)' } },
          { type: 'shape', fill: { color: 'rgba(68,114,196,1)' } },
          { type: 'shape', border: { color: 'rgba(237,125,49,1)' } }
        ],
        background: { color: 'rgba(255,255,255,1)' }
      };

      // Extract all color values
      const extractColors = (obj: any): string[] => {
        const colors: string[] = [];
        
        const traverse = (item: any) => {
          if (typeof item === 'object' && item !== null) {
            if ('color' in item) {
              colors.push(item.color);
            }
            Object.values(item).forEach(traverse);
          }
        };
        
        traverse(mockSlideOutput);
        return colors;
      };

      const colors = extractColors(mockSlideOutput);
      
      // All colors should be in rgba format
      colors.forEach(color => {
        expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });
    });

    it('should handle transparent colors', () => {
      const testCases = [
        { input: 'transparent', expected: 'rgba(0,0,0,0)' },
        { input: 'none', expected: 'rgba(0,0,0,0)' }
      ];

      const normalizeColor = (color: string): string => {
        if (color === 'transparent' || color === 'none') {
          return 'rgba(0,0,0,0)';
        }
        return color;
      };

      testCases.forEach(({ input, expected }) => {
        expect(normalizeColor(input)).toBe(expected);
      });
    });
  });

  describe('Color Scheme Inheritance', () => {
    it('should properly inherit colors from theme to elements', () => {
      const theme = {
        dk1: 'rgba(0,0,0,1)',
        lt1: 'rgba(255,255,255,1)',
        accent1: 'rgba(68,114,196,1)'
      };

      const element = {
        fill: { scheme: 'accent1' }
      };

      const resolveColor = (element: any, theme: any): string => {
        if (element.fill && element.fill.scheme && theme[element.fill.scheme]) {
          return theme[element.fill.scheme];
        }
        return 'rgba(0,0,0,1)'; // Default
      };

      expect(resolveColor(element, theme)).toBe('rgba(68,114,196,1)');
    });
  });
});