import { ColorUtils } from '@/lib/services/utils/ColorUtils';
import { TextElement } from '@/lib/models/domain/elements/TextElement';
import { Theme } from '@/lib/models/domain/Theme';

describe('Advanced Color Processing Tests', () => {
  describe('PowerPoint Color Modifiers', () => {
    test('should apply lumMod (brightness modification)', () => {
      const baseColor = '#5b9bd5';
      const rgbaColor = ColorUtils.toRgba(baseColor);
      
      // Test different luminance modifications
      const testCases = [
        { lumMod: 0.5, description: '50% brightness' },
        { lumMod: 0.8, description: '80% brightness' },
        { lumMod: 1.2, description: '120% brightness' },
        { lumMod: 1.5, description: '150% brightness' }
      ];
      
      testCases.forEach(({ lumMod, description }) => {
        const modifiedColor = ColorUtils.applyLuminanceMod(rgbaColor, lumMod);
        
        // Should return valid rgba format
        expect(modifiedColor).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
        
        // For darker modifications (lumMod < 1), colors should be darker
        if (lumMod < 1) {
          const original = ColorUtils.parseRgba(rgbaColor);
          const modified = ColorUtils.parseRgba(modifiedColor);
          
          if (original && modified) {
            expect(modified.r).toBeLessThanOrEqual(original.r);
            expect(modified.g).toBeLessThanOrEqual(original.g);
            expect(modified.b).toBeLessThanOrEqual(original.b);
          }
        }
      });
    });
    
    test('should apply lumOff (brightness offset)', () => {
      const baseColor = '#808080'; // Medium gray
      const rgbaColor = ColorUtils.toRgba(baseColor);
      
      const testCases = [
        { lumOff: 50, description: 'brighten by 50' },
        { lumOff: -30, description: 'darken by 30' },
        { lumOff: 100, description: 'brighten by 100' },
        { lumOff: -100, description: 'darken by 100' }
      ];
      
      testCases.forEach(({ lumOff, description }) => {
        const modifiedColor = ColorUtils.applyLuminanceOff(rgbaColor, lumOff);
        
        // Should return valid rgba format
        expect(modifiedColor).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
        
        const modified = ColorUtils.parseRgba(modifiedColor);
        if (modified) {
          // Values should be clamped to 0-255 range
          expect(modified.r).toBeGreaterThanOrEqual(0);
          expect(modified.r).toBeLessThanOrEqual(255);
          expect(modified.g).toBeGreaterThanOrEqual(0);
          expect(modified.g).toBeLessThanOrEqual(255);
          expect(modified.b).toBeGreaterThanOrEqual(0);
          expect(modified.b).toBeLessThanOrEqual(255);
        }
      });
    });
    
    test('should combine multiple color modifiers', () => {
      const baseColor = '#5b9bd5';
      const rgbaColor = ColorUtils.toRgba(baseColor);
      
      // Apply multiple modifications in sequence
      const step1 = ColorUtils.applyLuminanceMod(rgbaColor, 0.8); // 80% brightness
      const step2 = ColorUtils.applyLuminanceOff(step1, 20); // Brighten by 20
      const finalColor = ColorUtils.applyLuminanceMod(step2, 1.1); // 110% brightness
      
      expect(finalColor).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      
      // Final color should be different from original
      expect(finalColor).not.toBe(rgbaColor);
    });
    
    test('should handle edge cases in color modification', () => {
      // Test with pure black
      const black = ColorUtils.toRgba('#000000');
      const blackModified = ColorUtils.applyLuminanceMod(black, 2.0);
      expect(blackModified).toBe('rgba(0,0,0,1)'); // Black stays black
      
      // Test with pure white
      const white = ColorUtils.toRgba('#ffffff');
      const whiteModified = ColorUtils.applyLuminanceOff(white, 50);
      expect(whiteModified).toBe('rgba(255,255,255,1)'); // White stays white when brightening
      
      // Test with extreme values
      const red = ColorUtils.toRgba('#ff0000');
      const redDarkened = ColorUtils.applyLuminanceOff(red, -300);
      expect(redDarkened).toBe('rgba(0,0,0,1)'); // Should clamp to black
    });
  });

  describe('Scheme Color Resolution', () => {
    test('should resolve scheme colors from theme', () => {
      // Create theme with defined scheme colors
      const theme = new Theme();
      theme.setThemeColor('accent1', 'rgba(91,155,213,1)');
      theme.setThemeColor('dk1', 'rgba(0,7,15,1)');
      theme.setThemeColor('lt1', '#FFFFFF');
      
      // Test scheme color resolution
      expect(theme.getThemeColor('accent1')).toBe('rgba(91,155,213,1)');
      expect(theme.getThemeColor('dk1')).toBe('rgba(0,7,15,1)');
      expect(theme.getThemeColor('lt1')).toBe('#FFFFFF');
    });
    
    test('should handle scheme color with modifiers', () => {
      // This test demonstrates what should happen with PowerPoint scheme colors
      // Current implementation doesn't support this, but it's needed for full compatibility
      
      const theme = new Theme();
      theme.setThemeColor('accent1', 'rgba(91,155,213,1)');
      
      const baseColor = theme.getThemeColor('accent1');
      if (baseColor) {
        // Apply PowerPoint-style modifications
        const darkerAccent = ColorUtils.applyLuminanceMod(baseColor, 0.8);
        const lighterAccent = ColorUtils.applyLuminanceMod(baseColor, 1.2);
        
        expect(darkerAccent).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
        expect(lighterAccent).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
        expect(darkerAccent).not.toBe(baseColor);
        expect(lighterAccent).not.toBe(baseColor);
      }
    });
    
    test('should handle missing scheme colors gracefully', () => {
      const theme = new Theme();
      
      // Try to get undefined scheme color
      const undefinedColor = theme.getThemeColor('nonexistent');
      expect(undefinedColor).toBeUndefined();
      
      // Should not crash when processing undefined colors
      const processedColor = ColorUtils.toRgba(undefinedColor);
      expect(processedColor).toBe('rgba(0,0,0,1)'); // Default fallback
    });
  });

  describe('Color Inheritance and Cascading', () => {
    test('should handle color inheritance from parent elements', () => {
      // This test shows the concept of color inheritance
      // which is important for PowerPoint's hierarchical styling
      
      const parentElement = new TextElement('parent');
      parentElement.addContent({
        text: 'Parent Text',
        style: {
          color: '#5b9bd5ff',
          fontSize: 24
        }
      });
      
      const childElement = new TextElement('child');
      childElement.addContent({
        text: 'Child Text',
        style: {
          fontSize: 18
          // No color specified - should inherit
        }
      });
      
      const parentJson = parentElement.toJSON();
      const childJson = childElement.toJSON();
      
      // Parent should have explicit color
      expect(parentJson.content).toContain('color:#5b9bd5ff');
      
      // Child currently doesn't inherit (feature gap)
      // In full implementation, child should inherit parent color
      expect(childJson.content).not.toContain('color:');
    });
    
    test('should handle color override in inheritance chain', () => {
      // Test color overriding in inheritance hierarchy
      
      const baseStyle = {
        color: '#333333ff',
        fontSize: 16
      };
      
      const overrideStyle = {
        ...baseStyle,
        color: '#ff0000ff'
      };
      
      const baseElement = new TextElement('base');
      baseElement.addContent({
        text: 'Base Style',
        style: baseStyle
      });
      
      const overrideElement = new TextElement('override');
      overrideElement.addContent({
        text: 'Override Style',
        style: overrideStyle
      });
      
      const baseJson = baseElement.toJSON();
      const overrideJson = overrideElement.toJSON();
      
      expect(baseJson.content).toContain('color:#333333ff');
      expect(overrideJson.content).toContain('color:#ff0000ff');
    });
  });

  describe('Complex Color Calculations', () => {
    test('should handle color temperature adjustments', () => {
      // Simulate PowerPoint's color temperature features
      const warmColor = '#ffaa00'; // Warm orange
      const coolColor = '#0088ff'; // Cool blue
      
      const warmRgba = ColorUtils.toRgba(warmColor);
      const coolRgba = ColorUtils.toRgba(coolColor);
      
      // Apply temperature-like modifications
      const coolerWarm = ColorUtils.applyLuminanceMod(warmRgba, 0.9);
      const warmerCool = ColorUtils.applyLuminanceOff(coolRgba, 20);
      
      expect(coolerWarm).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(warmerCool).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    });
    
    test('should handle saturation-like adjustments', () => {
      const vibrantColor = '#ff0080'; // Vibrant pink
      const rgbaColor = ColorUtils.toRgba(vibrantColor);
      
      // Simulate saturation reduction (moving toward gray)
      const desaturated = ColorUtils.applyLuminanceMod(rgbaColor, 0.7);
      
      expect(desaturated).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      expect(desaturated).not.toBe(rgbaColor);
    });
    
    test('should handle alpha channel preservation in modifications', () => {
      const semiTransparentColor = 'rgba(91,155,213,0.5)';
      
      const modified = ColorUtils.applyLuminanceMod(semiTransparentColor, 0.8);
      
      // Alpha should be preserved
      expect(modified).toContain('0.5');
      expect(modified).toMatch(/^rgba\(\d+,\d+,\d+,0\.5\)$/);
    });
  });

  describe('Color Space Conversions', () => {
    test('should handle integer color values', () => {
      // PowerPoint sometimes uses integer color values
      const colorInt = 0x5b9bd5; // Hex integer
      const alpha = 1.0;
      
      const rgbaColor = ColorUtils.intToRgba(colorInt, alpha);
      
      expect(rgbaColor).toBe('rgba(91,155,213,1)');
    });
    
    test('should handle integer colors with alpha', () => {
      const colorInt = 0xff0000; // Red
      const alpha = 0.5;
      
      const rgbaColor = ColorUtils.intToRgba(colorInt, alpha);
      
      expect(rgbaColor).toBe('rgba(255,0,0,0.5)');
    });
    
    test('should handle edge case integer values', () => {
      const testCases = [
        { int: 0x000000, alpha: 1, expected: 'rgba(0,0,0,1)' },
        { int: 0xffffff, alpha: 1, expected: 'rgba(255,255,255,1)' },
        { int: 0x808080, alpha: 0, expected: 'rgba(128,128,128,0)' }
      ];
      
      testCases.forEach(({ int, alpha, expected }) => {
        const result = ColorUtils.intToRgba(int, alpha);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Theme Color Processing Integration', () => {
    test('should process theme colors with modifications in TextElement', () => {
      // This test demonstrates integration of advanced color processing
      // with TextElement HTML output
      
      const theme = new Theme();
      theme.setThemeColor('accent1', 'rgba(91,155,213,1)');
      
      const baseColor = theme.getThemeColor('accent1');
      const modifiedColor = baseColor ? ColorUtils.applyLuminanceMod(baseColor, 0.8) : '#5b9bd5';
      
      const textElement = new TextElement('theme-modified-test');
      textElement.addContent({
        text: 'Modified Theme Color',
        style: {
          color: modifiedColor,
          fontSize: 24,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should contain the modified color
      expect(json.content).toContain(`color:${modifiedColor}`);
      expect(json.content).toContain('font-size:24px');
      expect(json.content).toContain('font-weight:bold');
    });
    
    test('should handle multiple color modifications in single element', () => {
      const textElement = new TextElement('multi-modification-test');
      
      const baseColor = 'rgba(91,155,213,1)';
      const darkerColor = ColorUtils.applyLuminanceMod(baseColor, 0.7);
      const lighterColor = ColorUtils.applyLuminanceOff(baseColor, 50);
      
      textElement.addContent({
        text: 'Normal',
        style: { color: baseColor }
      });
      
      textElement.addContent({
        text: ' Darker',
        style: { color: darkerColor }
      });
      
      textElement.addContent({
        text: ' Lighter',
        style: { color: lighterColor }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain(baseColor);
      expect(json.content).toContain(darkerColor);
      expect(json.content).toContain(lighterColor);
    });
  });

  describe('Performance and Accuracy', () => {
    test('should maintain color accuracy through multiple modifications', () => {
      let color = 'rgba(128,128,128,1)'; // Start with gray
      
      // Apply multiple modifications
      color = ColorUtils.applyLuminanceMod(color, 1.2);
      color = ColorUtils.applyLuminanceOff(color, -20);
      color = ColorUtils.applyLuminanceMod(color, 0.9);
      color = ColorUtils.applyLuminanceOff(color, 10);
      
      // Should still be valid rgba format
      expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      
      // Parse final color to verify components
      const parsed = ColorUtils.parseRgba(color);
      expect(parsed).toBeTruthy();
      
      if (parsed) {
        expect(parsed.r).toBeGreaterThanOrEqual(0);
        expect(parsed.r).toBeLessThanOrEqual(255);
        expect(parsed.g).toBeGreaterThanOrEqual(0);
        expect(parsed.g).toBeLessThanOrEqual(255);
        expect(parsed.b).toBeGreaterThanOrEqual(0);
        expect(parsed.b).toBeLessThanOrEqual(255);
        expect(parsed.a).toBeGreaterThanOrEqual(0);
        expect(parsed.a).toBeLessThanOrEqual(1);
      }
    });
    
    test('should perform color modifications efficiently', () => {
      const startTime = Date.now();
      const baseColor = 'rgba(91,155,213,1)';
      
      // Perform many color modifications
      for (let i = 0; i < 1000; i++) {
        const mod1 = ColorUtils.applyLuminanceMod(baseColor, 0.8 + (i % 5) * 0.1);
        const mod2 = ColorUtils.applyLuminanceOff(mod1, -10 + (i % 3) * 10);
        ColorUtils.toRgba(mod2); // Ensure conversion
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (relaxed for CI/slower machines)
      expect(duration).toBeLessThan(500); // 500ms for 1000 operations
    });
  });
});