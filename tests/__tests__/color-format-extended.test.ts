import { ColorUtils } from '@/lib/services/utils/ColorUtils';
import { TextElement } from '@/lib/models/domain/elements/TextElement';

describe('Color Format Extended Tests', () => {
  describe('Hex Color Format', () => {
    test('should preserve hex format with alpha in ColorUtils', () => {
      // Test 6-digit hex
      expect(ColorUtils.toRgba('#5b9bd5')).toBe('rgba(91,155,213,1)');
      
      // Test 8-digit hex with alpha
      expect(ColorUtils.toRgba('#5b9bd5ff')).toBe('rgba(91,155,213,1)');
      expect(ColorUtils.toRgba('#5b9bd580')).toBe('rgba(91,155,213,0.502)');
    });
    
    test('should handle 3-digit hex colors', () => {
      expect(ColorUtils.toRgba('#f00')).toBe('rgba(255,0,0,1)');
      expect(ColorUtils.toRgba('#abc')).toBe('rgba(170,187,204,1)');
    });
    
    test('should handle 8-digit hex colors with various alpha values', () => {
      expect(ColorUtils.toRgba('#ff000000')).toBe('rgba(255,0,0,0)');
      expect(ColorUtils.toRgba('#ff000080')).toBe('rgba(255,0,0,0.502)');
      expect(ColorUtils.toRgba('#ff0000ff')).toBe('rgba(255,0,0,1)');
    });
    
    test('should handle hex colors in TextElement HTML output', () => {
      const textElement = new TextElement('test-id');
      textElement.addContent({
        text: 'Test Text',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      // Should contain hex color format in HTML
      expect(json.content).toContain('color:#5b9bd5ff');
      expect(json.content).toContain('font-size:54px');
      expect(json.content).toContain('font-weight:bold');
    });
  });

  describe('RGBA Color Format', () => {
    test('should convert rgba to standardized format', () => {
      expect(ColorUtils.toRgba('rgba(91, 155, 213, 1)')).toBe('rgba(91,155,213,1)');
      expect(ColorUtils.toRgba('rgba(91,155,213,0.5)')).toBe('rgba(91,155,213,0.5)');
      expect(ColorUtils.toRgba('rgba(91,155,213,0.502)')).toBe('rgba(91,155,213,0.502)');
    });
    
    test('should handle rgba with transparency', () => {
      expect(ColorUtils.toRgba('rgba(91,155,213,0)')).toBe('rgba(91,155,213,0)');
      expect(ColorUtils.toRgba('rgba(91,155,213,0.25)')).toBe('rgba(91,155,213,0.25)');
      expect(ColorUtils.toRgba('rgba(91,155,213,0.333)')).toBe('rgba(91,155,213,0.333)');
    });
    
    test('should normalize rgba spacing and format', () => {
      // Test various spacing formats
      expect(ColorUtils.toRgba('rgba( 91 , 155 , 213 , 1 )')).toBe('rgba(91,155,213,1)');
      expect(ColorUtils.toRgba('rgba(91,155,213,1.0)')).toBe('rgba(91,155,213,1)');
      expect(ColorUtils.toRgba('rgba(91,155,213,1.000)')).toBe('rgba(91,155,213,1)');
    });
  });

  describe('RGB Color Format', () => {
    test('should convert rgb to rgba format', () => {
      expect(ColorUtils.toRgba('rgb(51,51,51)')).toBe('rgba(51,51,51,1)');
      expect(ColorUtils.toRgba('rgb(255,255,255)')).toBe('rgba(255,255,255,1)');
      expect(ColorUtils.toRgba('rgb(0,0,0)')).toBe('rgba(0,0,0,1)');
    });
    
    test('should handle rgb with various spacing', () => {
      expect(ColorUtils.toRgba('rgb( 51 , 51 , 51 )')).toBe('rgba(51,51,51,1)');
      expect(ColorUtils.toRgba('rgb(51, 51, 51)')).toBe('rgba(51,51,51,1)');
    });
    
    test('should convert rgb to hex format in TextElement HTML', () => {
      const textElement = new TextElement('test-id');
      textElement.addContent({
        text: 'RGB Text',
        style: {
          color: 'rgb(51,51,51)',
          fontSize: 24
        }
      });
      
      const json = textElement.toJSON();
      // Should convert to hex format in HTML output
      expect(json.content).toContain('color:rgb(51,51,51)');
    });
  });

  describe('Color Format Edge Cases', () => {
    test('should handle transparent and none colors', () => {
      expect(ColorUtils.toRgba('transparent')).toBe('rgba(0,0,0,0)');
      expect(ColorUtils.toRgba('none')).toBe('rgba(0,0,0,0)');
    });
    
    test('should handle undefined and empty colors', () => {
      expect(ColorUtils.toRgba(undefined)).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('')).toBe('rgba(0,0,0,1)');
    });
    
    test('should handle invalid color formats', () => {
      expect(ColorUtils.toRgba('invalid-color')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('#zzz')).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba('rgb(300,300,300)')).toBe('rgba(300,300,300,1)'); // Note: doesn't validate ranges
    });
  });

  describe('Color Format Consistency', () => {
    test('should maintain consistent alpha formatting', () => {
      // Test that alpha values are formatted consistently
      expect(ColorUtils.toRgba('#ff000080')).toBe('rgba(255,0,0,0.502)');
      expect(ColorUtils.toRgba('rgba(255,0,0,0.502)')).toBe('rgba(255,0,0,0.502)');
    });
    
    test('should handle edge alpha values', () => {
      expect(ColorUtils.toRgba('#ff000001')).toBe('rgba(255,0,0,0.004)');
      expect(ColorUtils.toRgba('#ff0000fe')).toBe('rgba(255,0,0,0.996)');
    });
    
    test('should format alpha as 1 when alpha is exactly 1', () => {
      expect(ColorUtils.toRgba('#ff0000ff')).toBe('rgba(255,0,0,1)');
      expect(ColorUtils.toRgba('rgba(255,0,0,1.0)')).toBe('rgba(255,0,0,1)');
    });
  });

  describe('Integration with TextElement', () => {
    test('should handle multiple color formats in single text element', () => {
      const textElement = new TextElement('multi-color-test');
      
      // Add content with different color formats
      textElement.addContent({
        text: 'Hex Color',
        style: { color: '#5b9bd5ff', fontSize: 24 }
      });
      
      const json = textElement.toJSON();
      expect(json.content).toContain('color:#5b9bd5ff');
      expect(json.content).toContain('font-size:24px');
    });
    
    test('should preserve color format in HTML output', () => {
      const testCases = [
        { input: '#5b9bd5ff', expected: 'color:#5b9bd5ff' },
        { input: '#333333', expected: 'color:#333333' },
        { input: 'rgba(91,155,213,1)', expected: 'color:rgba(91,155,213,1)' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const textElement = new TextElement(`test-${input}`);
        textElement.addContent({
          text: 'Test',
          style: { color: input }
        });
        
        const json = textElement.toJSON();
        expect(json.content).toContain(expected);
      });
    });
  });
});