import { TextElement } from '@/lib/models/domain/elements/TextElement';

describe('HTML Output Integrity Tests', () => {
  describe('HTML Structure Validation', () => {
    test('should generate correct basic HTML structure', () => {
      const textElement = new TextElement('basic-structure-test');
      textElement.addContent({
        text: 'Basic Text',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should have proper div > p > span structure
      expect(json.content).toMatch(/^<div\s+style=""><p\s+style=""><span\s+style="[^"]*">.*<\/span><\/p><\/div>$/);
      
      // Should contain expected content
      expect(json.content).toContain('Basic Text');
    });
    
    test('should generate correct HTML for expected output format', () => {
      const textElement = new TextElement('expected-format-test');
      textElement.addContent({
        text: '党建宣传策略实战方法论',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Expected format from output.json
      const expectedPattern = '<div  style=""><p  style=""><span  style="color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1;">党建宣传策略实战方法论</span></p></div>';
      
      // Check key components
      expect(json.content).toContain('<div  style="">');
      expect(json.content).toContain('<p  style="">');
      expect(json.content).toContain('党建宣传策略实战方法论');
      expect(json.content).toContain('</span></p></div>');
    });
    
    test('should handle empty text content', () => {
      const textElement = new TextElement('empty-content-test');
      textElement.addContent({
        text: '',
        style: { fontSize: 12 }
      });
      
      const json = textElement.toJSON();
      
      // Should still generate structure for empty content
      expect(json.content).toContain('<div  style="">');
      expect(json.content).toContain('<p  style="">');
      expect(json.content).toContain('<span');
      expect(json.content).toContain('</span></p></div>');
    });
  });

  describe('Multiple Text Runs Handling', () => {
    test('should handle multiple text runs in single element', () => {
      const textElement = new TextElement('multi-run-test');
      
      // Add multiple content pieces
      textElement.addContent({
        text: '选题到传播的',
        style: {
          color: '#333333ff',
          fontSize: 22,
          bold: true
        }
      });
      
      textElement.addContent({
        text: '全流程解析',
        style: {
          color: '#5b9bd5ff',
          fontSize: 22,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should contain both text runs
      expect(json.content).toContain('选题到传播的');
      expect(json.content).toContain('全流程解析');
      
      // Should handle different colors in same element
      expect(json.content).toContain('color:#333333ff');
      expect(json.content).toContain('color:#5b9bd5ff');
    });
    
    test('should preserve text run order', () => {
      const textElement = new TextElement('run-order-test');
      
      textElement.addContent({
        text: 'First',
        style: { color: '#ff0000' }
      });
      
      textElement.addContent({
        text: ' Second',
        style: { color: '#00ff00' }
      });
      
      textElement.addContent({
        text: ' Third',
        style: { color: '#0000ff' }
      });
      
      const json = textElement.toJSON();
      
      // Should maintain order in output
      const content = json.content;
      const firstPos = content.indexOf('First');
      const secondPos = content.indexOf('Second');
      const thirdPos = content.indexOf('Third');
      
      expect(firstPos).toBeLessThan(secondPos);
      expect(secondPos).toBeLessThan(thirdPos);
    });
    
    test('should handle mixed formatting in multiple runs', () => {
      const textElement = new TextElement('mixed-format-test');
      
      textElement.addContent({
        text: 'Bold text',
        style: { bold: true, fontSize: 20 }
      });
      
      textElement.addContent({
        text: ' italic text',
        style: { italic: true, fontSize: 18 }
      });
      
      textElement.addContent({
        text: ' colored text',
        style: { color: '#ff0000', fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain('font-weight:bold');
      expect(json.content).toContain('font-style:italic');
      expect(json.content).toContain('color:#ff0000');
      expect(json.content).toContain('font-size:20px');
      expect(json.content).toContain('font-size:18px');
      expect(json.content).toContain('font-size:16px');
    });
  });

  describe('Style Attribute Combination', () => {
    test('should combine all style attributes correctly', () => {
      const textElement = new TextElement('combined-style-test');
      textElement.addContent({
        text: 'Full Style Text',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true,
          italic: true,
          fontFamily: 'Microsoft Yahei'
        }
      });
      
      const json = textElement.toJSON();
      
      // Check all style attributes are present
      expect(json.content).toContain('color:#5b9bd5ff');
      expect(json.content).toContain('font-size:54px');
      expect(json.content).toContain('font-weight:bold');
      expect(json.content).toContain('font-style:italic');
      expect(json.content).toContain('--colortype:accent1');
    });
    
    test('should handle partial style attributes', () => {
      const testCases = [
        {
          style: { color: '#ff0000' },
          expected: ['color:#ff0000'],
          notExpected: ['font-size', 'font-weight', 'font-style']
        },
        {
          style: { fontSize: 24, bold: true },
          expected: ['font-size:24px', 'font-weight:bold'],
          notExpected: ['color:', 'font-style']
        },
        {
          style: { italic: true },
          expected: ['font-style:italic'],
          notExpected: ['color:', 'font-size', 'font-weight']
        }
      ];
      
      testCases.forEach((testCase, index) => {
        const textElement = new TextElement(`partial-style-${index}`);
        textElement.addContent({
          text: 'Partial Style',
          style: testCase.style as any
        });
        
        const json = textElement.toJSON();
        
        testCase.expected.forEach(expectedStyle => {
          expect(json.content).toContain(expectedStyle);
        });
        
        testCase.notExpected.forEach(notExpectedStyle => {
          expect(json.content).not.toContain(notExpectedStyle);
        });
      });
    });
    
    test('should maintain consistent style attribute order', () => {
      const textElement = new TextElement('style-order-test');
      textElement.addContent({
        text: 'Ordered Styles',
        style: {
          fontSize: 40,
          color: '#5b9bd5ff',
          bold: true,
          italic: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Extract style attribute from span
      const spanMatch = json.content.match(/<span\s+style="([^"]*)">/);
      expect(spanMatch).toBeTruthy();
      
      if (spanMatch) {
        const styleAttr = spanMatch[1];
        
        // Check that attributes are separated by semicolons
        expect(styleAttr).toMatch(/^[^;]+(;[^;]+)*$/);
        
        // Should contain all expected attributes
        expect(styleAttr).toContain('color:#5b9bd5ff');
        expect(styleAttr).toContain('font-size:40px');
        expect(styleAttr).toContain('font-weight:bold');
        expect(styleAttr).toContain('font-style:italic');
        expect(styleAttr).toContain('--colortype:accent1');
      }
    });
  });

  describe('Text Formatting Hierarchy', () => {
    test('should preserve paragraph level formatting', () => {
      const textElement = new TextElement('paragraph-test');
      textElement.addContent({
        text: 'Paragraph text with formatting',
        style: {
          color: '#333333ff',
          fontSize: 22,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should have proper paragraph structure
      expect(json.content).toContain('<p  style="">');
      expect(json.content).toContain('</p>');
      
      // Paragraph should contain span with formatting
      expect(json.content).toMatch(/<p\s+style=""><span\s+style="[^"]*">.*<\/span><\/p>/);
    });
    
    test('should handle complex nested formatting', () => {
      const textElement = new TextElement('nested-format-test');
      
      // Simulate complex PowerPoint formatting
      textElement.addContent({
        text: 'Complex',
        style: { bold: true, color: '#ff0000' }
      });
      
      textElement.addContent({
        text: ' formatting',
        style: { italic: true, color: '#00ff00' }
      });
      
      textElement.addContent({
        text: ' example',
        style: { bold: true, italic: true, color: '#0000ff' }
      });
      
      const json = textElement.toJSON();
      
      // Should handle all formatting correctly
      expect(json.content).toContain('font-weight:bold');
      expect(json.content).toContain('font-style:italic');
      expect(json.content).toContain('color:#ff0000');
      expect(json.content).toContain('color:#00ff00');
      expect(json.content).toContain('color:#0000ff');
    });
  });

  describe('Special Characters and Encoding', () => {
    test('should handle Chinese characters', () => {
      const textElement = new TextElement('chinese-test');
      textElement.addContent({
        text: '党建宣传策略实战方法论',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain('党建宣传策略实战方法论');
      expect(json.content).toContain('color:#5b9bd5ff');
    });
    
    test('should handle special HTML characters', () => {
      const textElement = new TextElement('special-chars-test');
      textElement.addContent({
        text: 'Text with <>&" special chars',
        style: { fontSize: 16 }
      });
      
      const json = textElement.toJSON();
      
      // Should contain the raw text (HTML escaping is typically handled at render time)
      expect(json.content).toContain('Text with <>&" special chars');
    });
    
    test('should handle empty and whitespace text', () => {
      const testCases = [
        { text: '', description: 'empty string' },
        { text: ' ', description: 'single space' },
        { text: '   ', description: 'multiple spaces' },
        { text: '\n', description: 'newline' },
        { text: '\t', description: 'tab' }
      ];
      
      testCases.forEach(({ text, description }) => {
        const textElement = new TextElement(`whitespace-${description.replace(' ', '-')}`);
        textElement.addContent({
          text: text,
          style: { fontSize: 12 }
        });
        
        const json = textElement.toJSON();
        
        // Should handle whitespace appropriately
        expect(json.content).toContain('<span');
        expect(json.content).toContain('font-size:12px');
      });
    });
  });

  describe('Output Format Consistency', () => {
    test('should match expected output.json format exactly', () => {
      const textElement = new TextElement('exact-match-test');
      textElement.addContent({
        text: '党建宣传策略实战方法论',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Key format requirements from output.json
      expect(json.content).toContain('<div  style="">'); // Note: double space
      expect(json.content).toContain('<p  style="">'); // Note: double space
      expect(json.content).toContain('color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1;');
    });
    
    test('should generate consistent output across multiple instances', () => {
      const createTextElement = (id: string) => {
        const element = new TextElement(id);
        element.addContent({
          text: '选题到传播的全流程解析',
          style: {
            color: '#333333ff',
            fontSize: 22,
            bold: true
          }
        });
        return element;
      };
      
      const element1 = createTextElement('consistency-1');
      const element2 = createTextElement('consistency-2');
      
      const json1 = element1.toJSON();
      const json2 = element2.toJSON();
      
      // Content should be identical (except for id)
      expect(json1.content).toBe(json2.content);
      expect(json1.defaultColor).toEqual(json2.defaultColor);
      expect(json1.defaultFontName).toBe(json2.defaultFontName);
    });
  });

  describe('Integration with Element Properties', () => {
    test('should integrate HTML content with element properties', () => {
      const textElement = new TextElement('integration-test');
      textElement.setPosition({ x: 69.65, y: 162.17 });
      textElement.setSize({ width: 554.19, height: 182.8 });
      textElement.setRotation(0);
      
      textElement.addContent({
        text: 'Integrated Content',
        style: {
          color: '#5b9bd5ff',
          fontSize: 54,
          bold: true
        }
      });
      
      const json = textElement.toJSON();
      
      // Should have all properties
      expect(json.type).toBe('text');
      expect(json.left).toBe(69.65);
      expect(json.top).toBe(162.17);
      expect(json.width).toBe(554.19);
      expect(json.height).toBe(182.8);
      expect(json.rotate).toBe(0);
      expect(json.content).toContain('Integrated Content');
      expect(json.defaultFontName).toBe('Microsoft Yahei');
      expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
    });
  });
});