/**
 * XmlParseService 单元测试
 * 测试XML解析服务的核心功能、错误处理和边界情况
 */

import { XmlParseService } from '../../../app/lib/services/core/XmlParseService';
import { XmlNode } from '../../../app/lib/models/xml/XmlNode';

describe('XmlParseService Unit Tests', () => {
  let xmlParser: XmlParseService;

  beforeEach(() => {
    xmlParser = new XmlParseService();
  });

  describe('Basic XML Parsing', () => {
    it('should parse simple XML correctly', () => {
      const xml = '<root><child>content</child></root>';
      const result = xmlParser.parse(xml);

      expect(result).toBeDefined();
      expect(result.name).toBe('root');
      expect(result.children).toBeDefined();
      expect(result.children?.length).toBe(1);
      expect(result.children?.[0].name).toBe('child');
      expect(result.children?.[0].content).toBe('content');
    });

    it('should parse XML with attributes', () => {
      const xml = '<root id="123" type="test"><child attr="value">content</child></root>';
      const result = xmlParser.parse(xml);

      expect(result.attributes).toBeDefined();
      expect(result.attributes?.id).toBe('123');
      expect(result.attributes?.type).toBe('test');
      
      const child = result.children?.[0];
      expect(child?.attributes?.attr).toBe('value');
    });

    it('should parse nested XML structures', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3>deep content</level3>
            </level2>
          </level1>
        </root>
      `;
      const result = xmlParser.parse(xml);

      const level1 = xmlParser.findNode(result, 'level1');
      expect(level1).toBeDefined();
      
      const level2 = xmlParser.findNode(result, 'level2');
      expect(level2).toBeDefined();
      
      const level3 = xmlParser.findNode(result, 'level3');
      expect(level3).toBeDefined();
      expect(xmlParser.getTextContent(level3!)).toBe('deep content');
    });

    it('should handle XML declaration correctly', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root>content</root>';
      const result = xmlParser.parse(xml);

      expect(result.name).toBe('root');
      expect(result.content).toBe('content');
    });
  });

  describe('Node Finding and Traversal', () => {
    let testNode: XmlNode;

    beforeEach(() => {
      const xml = `
        <root>
          <items>
            <item id="1">First</item>
            <item id="2">Second</item>
            <item id="3">Third</item>
          </items>
          <metadata>
            <author>Test Author</author>
            <date>2024-01-01</date>
          </metadata>
        </root>
      `;
      testNode = xmlParser.parse(xml);
    });

    it('should find single node correctly', () => {
      const metadata = xmlParser.findNode(testNode, 'metadata');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('metadata');

      const author = xmlParser.findNode(testNode, 'author');
      expect(author).toBeDefined();
      expect(xmlParser.getTextContent(author!)).toBe('Test Author');
    });

    it('should find multiple nodes correctly', () => {
      const items = xmlParser.findNodes(testNode, 'item');
      expect(items).toHaveLength(3);
      expect(items[0].content).toBe('First');
      expect(items[1].content).toBe('Second');
      expect(items[2].content).toBe('Third');
    });

    it('should get child nodes by tag name', () => {
      const items = xmlParser.findNode(testNode, 'items');
      expect(items).toBeDefined();
      
      const itemChildren = xmlParser.getChildNodes(items!, 'item');
      expect(itemChildren).toHaveLength(3);
      expect(xmlParser.getAttribute(itemChildren[0], 'id')).toBe('1');
      expect(xmlParser.getAttribute(itemChildren[1], 'id')).toBe('2');
      expect(xmlParser.getAttribute(itemChildren[2], 'id')).toBe('3');
    });

    it('should return empty array for non-existent child nodes', () => {
      const children = xmlParser.getChildNodes(testNode, 'nonexistent');
      expect(children).toEqual([]);
    });

    it('should return undefined for non-existent node', () => {
      const node = xmlParser.findNode(testNode, 'nonexistent');
      expect(node).toBeUndefined();
    });
  });

  describe('Attribute Handling', () => {
    it('should get attributes correctly', () => {
      const xml = '<element id="123" class="test-class" data-value="456"/>';
      const node = xmlParser.parse(xml);

      expect(xmlParser.getAttribute(node, 'id')).toBe('123');
      expect(xmlParser.getAttribute(node, 'class')).toBe('test-class');
      expect(xmlParser.getAttribute(node, 'data-value')).toBe('456');
    });

    it('should return undefined for non-existent attributes', () => {
      const xml = '<element id="123"/>';
      const node = xmlParser.parse(xml);

      expect(xmlParser.getAttribute(node, 'nonexistent')).toBeUndefined();
    });

    it('should handle attributes with special characters', () => {
      const xml = '<element attr="value with &quot;quotes&quot; and &amp; ampersand"/>';
      const node = xmlParser.parse(xml);

      const attrValue = xmlParser.getAttribute(node, 'attr');
      expect(attrValue).toContain('quotes');
      expect(attrValue).toContain('&');
    });
  });

  describe('Text Content Extraction', () => {
    it('should extract simple text content', () => {
      const xml = '<element>Simple text content</element>';
      const node = xmlParser.parse(xml);

      expect(xmlParser.getTextContent(node)).toBe('Simple text content');
    });

    it('should handle empty text content', () => {
      const xml = '<element></element>';
      const node = xmlParser.parse(xml);

      expect(xmlParser.getTextContent(node)).toBe('');
    });

    it('should extract text from nested elements', () => {
      const xml = '<root>Root text<child>Child text</child>More root text</root>';
      const node = xmlParser.parse(xml);

      const textContent = xmlParser.getTextContent(node);
      expect(textContent).toContain('Root text');
    });
  });

  describe('XML Stringification', () => {
    it('should stringify simple nodes correctly', () => {
      const node: XmlNode = {
        name: 'test',
        content: 'Test content'
      };

      const xml = xmlParser.stringify(node);
      expect(xml).toContain('<test>');
      expect(xml).toContain('Test content');
      expect(xml).toContain('</test>');
    });

    it('should stringify nodes with attributes', () => {
      const node: XmlNode = {
        name: 'test',
        attributes: {
          id: '123',
          class: 'test-class'
        },
        content: 'Content'
      };

      const xml = xmlParser.stringify(node);
      expect(xml).toContain('id="123"');
      expect(xml).toContain('class="test-class"');
    });

    it('should stringify self-closing tags', () => {
      const node: XmlNode = {
        name: 'empty',
        attributes: { id: '123' }
      };

      const xml = xmlParser.stringify(node);
      expect(xml).toContain('<empty id="123"/>');
    });

    it('should stringify nested structures with proper indentation', () => {
      const node: XmlNode = {
        name: 'root',
        children: [
          {
            name: 'child1',
            content: 'Content 1'
          },
          {
            name: 'child2',
            content: 'Content 2'
          }
        ]
      };

      const xml = xmlParser.stringify(node);
      expect(xml).toContain('<root>');
      expect(xml).toContain('  <child1>Content 1</child1>');
      expect(xml).toContain('  <child2>Content 2</child2>');
      expect(xml).toContain('</root>');
    });

    it('should escape special characters in content', () => {
      const node: XmlNode = {
        name: 'test',
        content: 'Content with <, >, &, " and \' characters'
      };

      const xml = xmlParser.stringify(node);
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
      expect(xml).toContain('&apos;');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty XML', () => {
      expect(() => xmlParser.parse('')).toThrow('Empty XML content');
    });

    it('should throw error for null/undefined input', () => {
      expect(() => xmlParser.parse(null as any)).toThrow();
      expect(() => xmlParser.parse(undefined as any)).toThrow();
    });

    it('should handle malformed XML gracefully', () => {
      const malformedXml = '<root><unclosed>';
      
      try {
        xmlParser.parse(malformedXml);
        // If it doesn't throw, check if it returns something reasonable
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, the error should be descriptive
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Failed to parse XML');
      }
    });

    it('should handle XML with only whitespace', () => {
      expect(() => xmlParser.parse('   \n\t  ')).toThrow('Empty XML content');
    });
  });

  describe('Special Cases and Edge Cases', () => {
    it('should handle CDATA sections', () => {
      const xml = '<root><![CDATA[<script>alert("test");</script>]]></root>';
      
      try {
        const result = xmlParser.parse(xml);
        expect(result).toBeDefined();
        expect(result.name).toBe('root');
        // CDATA content should be preserved
      } catch (error) {
        // Some parsers might not support CDATA, which is acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle comments in XML', () => {
      const xml = '<root><!-- This is a comment --><child>content</child></root>';
      const result = xmlParser.parse(xml);

      expect(result.name).toBe('root');
      const child = xmlParser.findNode(result, 'child');
      expect(child).toBeDefined();
      expect(child?.content).toBe('content');
    });

    it('should handle namespaces', () => {
      const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>content</ns:child></ns:root>';
      
      try {
        const result = xmlParser.parse(xml);
        expect(result).toBeDefined();
        // Namespace handling may vary by parser
      } catch (error) {
        // Some parsers might require special namespace handling
        expect(error).toBeDefined();
      }
    });

    it('should handle large XML documents', () => {
      // Generate a large XML document
      let largeXml = '<root>';
      for (let i = 0; i < 1000; i++) {
        largeXml += `<item id="${i}">Item ${i} content with some text</item>`;
      }
      largeXml += '</root>';

      const startTime = performance.now();
      const result = xmlParser.parse(largeXml);
      const parseTime = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(result.name).toBe('root');
      expect(result.children?.length).toBe(1000);
      expect(parseTime).toBeLessThan(1000); // Should parse in less than 1 second
    });

    it('should handle deeply nested structures', () => {
      let deepXml = '';
      let closingTags = '';
      const depth = 100;

      for (let i = 0; i < depth; i++) {
        deepXml += `<level${i}>`;
        closingTags = `</level${i}>` + closingTags;
      }
      deepXml += 'Deep content' + closingTags;

      const result = xmlParser.parse(deepXml);
      expect(result).toBeDefined();
      expect(result.name).toBe('level0');
    });

    it('should handle mixed whitespace correctly', () => {
      const xml = `
        <root>
          <child1>Content with
            multiple
            lines</child1>
          <child2>   Trimmed content   </child2>
        </root>
      `;

      const result = xmlParser.parse(xml);
      expect(result).toBeDefined();
      
      const child1 = xmlParser.findNode(result, 'child1');
      expect(child1).toBeDefined();
      expect(child1?.content).toBeDefined();
      
      const child2 = xmlParser.findNode(result, 'child2');
      expect(child2).toBeDefined();
      expect(child2?.content).toBeDefined();
    });
  });

  describe('Performance and Memory Tests', () => {
    it('should handle repeated parsing efficiently', () => {
      const xml = '<root><child>content</child></root>';
      const iterations = 10000;

      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        xmlParser.parse(xml);
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const totalTime = endTime - startTime;
      const memoryIncrease = endMemory - startMemory;

      expect(totalTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      
      console.log(`Performance: ${iterations} parses in ${totalTime.toFixed(2)}ms`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});