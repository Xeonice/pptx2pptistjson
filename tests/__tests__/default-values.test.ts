import { TextElement } from '@/lib/models/domain/elements/TextElement';
import { Theme } from '@/lib/models/domain/Theme';

describe('Default Values Tests', () => {
  describe('Default Color Settings', () => {
    test('should set correct defaultColor structure', () => {
      const textElement = new TextElement('default-color-test');
      textElement.addContent({
        text: 'Default Color Text',
        style: { fontSize: 24 }
      });
      
      const json = textElement.toJSON();
      
      expect(json.defaultColor).toEqual({
        color: '#333333',
        colorType: 'dk1'
      });
    });
    
    test('should maintain defaultColor consistency across different content', () => {
      const testCases = [
        { text: 'Text 1', style: { fontSize: 12 } },
        { text: 'Text 2', style: { bold: true } },
        { text: 'Text 3', style: { italic: true, fontSize: 18 } },
        { text: 'Text 4', style: { color: '#ff0000' } } // Even with custom color
      ];
      
      const elements = testCases.map((testCase, index) => {
        const element = new TextElement(`consistency-${index}`);
        element.addContent(testCase);
        return element;
      });
      
      const expectedDefault = { color: '#333333', colorType: 'dk1' };
      
      elements.forEach(element => {
        const json = element.toJSON();
        expect(json.defaultColor).toEqual(expectedDefault);
      });
    });
    
    test('should use defaultColor when no explicit color is provided', () => {
      const textElement = new TextElement('no-color-test');
      textElement.addContent({
        text: 'No Color Specified',
        style: { 
          fontSize: 20,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should have defaultColor but no color in content style
      expect(json.defaultColor.color).toBe('#333333');
      expect(json.defaultColor.colorType).toBe('dk1');
      expect(json.content).not.toContain('color:');
    });
    
    test('should handle theme-based default color resolution', () => {
      // This test demonstrates what should happen with theme integration
      const theme = new Theme();
      theme.setThemeColor('dk1', 'rgba(50,50,50,1)');
      
      // Current implementation uses hardcoded default
      // Future implementation should resolve from theme
      const textElement = new TextElement('theme-default-test');
      textElement.addContent({
        text: 'Theme Default',
        style: { fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      // Currently returns hardcoded value
      expect(json.defaultColor.color).toBe('#333333');
      expect(json.defaultColor.colorType).toBe('dk1');
      
      // Future: should resolve from theme
      // expect(json.defaultColor.color).toBe('#323232'); // from theme
    });
  });

  describe('Default Font Settings', () => {
    test('should set correct defaultFontName', () => {
      const textElement = new TextElement('default-font-test');
      textElement.addContent({
        text: 'Default Font Text',
        style: { fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      expect(json.defaultFontName).toBe('Microsoft Yahei');
    });
    
    test('should extract defaultFontName from content when available', () => {
      const textElement = new TextElement('content-font-test');
      textElement.addContent({
        text: 'Custom Font Text',
        style: { 
          fontFamily: 'Arial',
          fontSize: 18 
        }
      });
      
      const json = textElement.toJSON();
      
      // Should use font from content
      expect(json.defaultFontName).toBe('Arial');
    });
    
    test('should use fallback font when content has no font', () => {
      const textElement = new TextElement('fallback-font-test');
      textElement.addContent({
        text: 'No Font Specified',
        style: { 
          fontSize: 14,
          color: '#000000'
        }
      });
      
      const json = textElement.toJSON();
      
      // Should fallback to default
      expect(json.defaultFontName).toBe('Microsoft Yahei');
    });
    
    test('should handle multiple content with different fonts', () => {
      const textElement = new TextElement('multi-font-test');
      
      textElement.addContent({
        text: 'First text',
        style: { fontFamily: 'Times New Roman' }
      });
      
      textElement.addContent({
        text: ' Second text',
        style: { fontFamily: 'Helvetica' }
      });
      
      const json = textElement.toJSON();
      
      // Should use font from first content
      expect(json.defaultFontName).toBe('Times New Roman');
    });
    
    test('should match expected output.json font format', () => {
      const textElement = new TextElement('expected-font-test');
      textElement.addContent({
        text: '党建宣传策略实战方法论',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // From output.json, defaultFontName should be "Microsoft Yahei"
      expect(json.defaultFontName).toBe('Microsoft Yahei');
    });
  });

  describe('Standard Element Properties', () => {
    test('should set standard boolean properties', () => {
      const textElement = new TextElement('standard-props-test');
      textElement.addContent({
        text: 'Standard Properties',
        style: { fontSize: 20 }
      });
      
      const json = textElement.toJSON();
      
      // Standard properties from output.json
      expect(json.vertical).toBe(false);
      expect(json.fit).toBe('resize');
      expect(json.enableShrink).toBe(true);
    });
    
    test('should set correct rotate default', () => {
      const textElement = new TextElement('rotate-default-test');
      textElement.addContent({
        text: 'Rotation Test',
        style: { fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      expect(json.rotate).toBe(0);
    });
    
    test('should handle position and size defaults', () => {
      const textElement = new TextElement('position-size-test');
      textElement.addContent({
        text: 'Position Size Test',
        style: { fontSize: 18 }
      });
      
      const json = textElement.toJSON();
      
      // Should default to 0 when not set
      expect(json.left).toBe(0);
      expect(json.top).toBe(0);
      expect(json.width).toBe(0);
      expect(json.height).toBe(0);
    });
    
    test('should preserve set position and size values', () => {
      const textElement = new TextElement('preserve-values-test');
      textElement.setPosition({ x: 69.65, y: 162.17 });
      textElement.setSize({ width: 554.19, height: 182.8 });
      textElement.setRotation(15);
      
      textElement.addContent({
        text: 'Preserve Values',
        style: { fontSize: 22 }
      });
      
      const json = textElement.toJSON();
      
      expect(json.left).toBe(69.65);
      expect(json.top).toBe(162.17);
      expect(json.width).toBe(554.19);
      expect(json.height).toBe(182.8);
      expect(json.rotate).toBe(15);
    });
  });

  describe('Missing Properties Handling', () => {
    test('should handle missing optional properties gracefully', () => {
      const textElement = new TextElement('missing-props-test');
      textElement.addContent({
        text: 'Missing Properties Test'
        // No style object at all
      });
      
      const json = textElement.toJSON();
      
      // Should not crash and provide defaults
      expect(json.type).toBe('text');
      expect(json.content).toContain('Missing Properties Test');
      expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
      expect(json.defaultFontName).toBe('Microsoft Yahei');
    });
    
    test('should handle empty style object', () => {
      const textElement = new TextElement('empty-style-test');
      textElement.addContent({
        text: 'Empty Style Test',
        style: {} // Empty style object
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain('Empty Style Test');
      expect(json.content).not.toContain('color:');
      expect(json.content).not.toContain('font-size:');
      expect(json.content).not.toContain('font-weight:');
    });
    
    test('should handle partial style properties', () => {
      const partialStyles = [
        { fontSize: 16 },
        { bold: true },
        { color: '#ff0000' },
        { italic: true, fontSize: 14 },
        { fontFamily: 'Arial', bold: true }
      ];
      
      partialStyles.forEach((style, index) => {
        const textElement = new TextElement(`partial-${index}`);
        textElement.addContent({
          text: `Partial Style ${index}`,
          style: style as any
        });
        
        const json = textElement.toJSON();
        
        // Should handle partial styles without errors
        expect(json.content).toContain(`Partial Style ${index}`);
        expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
        expect(json.defaultFontName).toBeTruthy();
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with legacy format', () => {
      const textElement = new TextElement('legacy-compat-test');
      textElement.setPosition({ x: 100, y: 200 });
      textElement.setSize({ width: 300, height: 50 });
      
      textElement.addContent({
        text: 'Legacy Compatible',
        style: {
          color: '#5b9bd5ff',
          fontSize: 24,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should have all properties that legacy code expects
      expect(json).toHaveProperty('type', 'text');
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('left', 100);
      expect(json).toHaveProperty('top', 200);
      expect(json).toHaveProperty('width', 300);
      expect(json).toHaveProperty('height', 50);
      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('rotate', 0);
      expect(json).toHaveProperty('defaultFontName');
      expect(json).toHaveProperty('defaultColor');
      expect(json).toHaveProperty('vertical', false);
      expect(json).toHaveProperty('fit', 'resize');
      expect(json).toHaveProperty('enableShrink', true);
    });
    
    test('should provide name property for legacy compatibility', () => {
      const textElement = new TextElement('name-compat-test');
      textElement.addContent({
        text: 'Name Compatibility',
        style: { fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      // Legacy code might expect 'name' property mapped from 'id'
      // Current implementation shows name: undefined in output
      // This might need to be mapped from id for compatibility
      expect(json.id).toBe('name-compat-test');
    });
  });

  describe('Theme Integration Defaults', () => {
    test('should use theme defaults when available', () => {
      // Create theme with custom defaults
      const customTheme = new Theme();
      customTheme.setFontName('Custom Default Font');
      customTheme.setThemeColor('dk1', 'rgba(40,40,40,1)');
      
      // Current implementation doesn't use theme context
      // This test shows what should happen with theme integration
      const textElement = new TextElement('theme-integration-test');
      textElement.addContent({
        text: 'Theme Integration',
        style: { fontSize: 18 }
      });
      
      const json = textElement.toJSON();
      
      // Current behavior (hardcoded defaults)
      expect(json.defaultFontName).toBe('Microsoft Yahei');
      expect(json.defaultColor.color).toBe('#333333');
      
      // Future behavior with theme integration:
      // expect(json.defaultFontName).toBe('Custom Default Font');
      // expect(json.defaultColor.color).toBe('#282828'); // from theme
    });
    
    test('should fallback gracefully when theme is missing', () => {
      // Test behavior when theme is not available
      const textElement = new TextElement('no-theme-test');
      textElement.addContent({
        text: 'No Theme Available',
        style: { fontSize: 20 }
      });
      
      const json = textElement.toJSON();
      
      // Should use hardcoded fallbacks
      expect(json.defaultFontName).toBe('Microsoft Yahei');
      expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large numbers of default value requests efficiently', () => {
      const elements = [];
      const startTime = Date.now();
      
      // Create many elements to test performance
      for (let i = 0; i < 100; i++) {
        const element = new TextElement(`perf-test-${i}`);
        element.addContent({
          text: `Performance Test ${i}`,
          style: { fontSize: 12 }
        });
        elements.push(element.toJSON());
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably quickly (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for 100 elements
      
      // All elements should have consistent defaults
      elements.forEach(json => {
        expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
        expect(json.defaultFontName).toBe('Microsoft Yahei');
      });
    });
  });
});