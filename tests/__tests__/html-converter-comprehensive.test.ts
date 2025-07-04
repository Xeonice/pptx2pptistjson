/**
 * HtmlConverter 综合测试套件
 * 测试HTML转换功能，包括段落结构、样式处理、主题色彩映射和边界条件
 */

import { HtmlConverter, HtmlConversionOptions } from '../../app/lib/services/utils/HtmlConverter';
import { TextContent, TextRunStyle } from '../../app/lib/models/domain/elements/TextElement';

describe('HtmlConverter - Comprehensive Test Suite', () => {
  describe('Single Paragraph Conversion', () => {
    it('should convert simple text content to HTML', () => {
      const content: TextContent[] = [
        { text: 'Hello World', style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // 现在 HtmlConverter 始终包含默认字体大小 (23.99px)
      expect(html).toBe('<div style=""><p style=""><span style="font-size:23.99px">Hello World</span></p></div>');
    });

    it('should handle text with basic styling', () => {
      const content: TextContent[] = [
        { 
          text: 'Styled Text',
          style: {
            color: 'rgba(255,0,0,1)',
            fontSize: 16,
            bold: true,
            italic: true,
            underline: true
          }
        }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('color:rgba(255,0,0,1)');
      expect(html).toContain('font-size:16px');
      expect(html).toContain('font-weight:bold');
      expect(html).toContain('font-style:italic');
      expect(html).toContain('text-decoration:underline');
    });

    it('should handle text with font family', () => {
      const content: TextContent[] = [
        { 
          text: 'Font Text',
          style: {
            fontFamily: 'Arial',
            backgroundColor: 'rgba(0,255,0,0.5)'
          }
        }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain("font-family:'Arial'");
      expect(html).toContain('background-color:rgba(0,255,0,0.5)');
    });

    it('should handle strikethrough text', () => {
      const content: TextContent[] = [
        { 
          text: 'Strikethrough Text',
          style: {
            strike: true
          }
        }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('text-decoration:line-through');
    });

    it('should handle multiple text runs in a paragraph', () => {
      const content: TextContent[] = [
        { text: 'Normal ', style: {} },
        { text: 'Bold ', style: { bold: true } },
        { text: 'Italic', style: { italic: true } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // 每个 span 都包含默认字体大小
      expect(html).toContain('<span style="font-size:23.99px">Normal </span>');
      expect(html).toContain('<span style="font-size:23.99px;font-weight:bold">Bold </span>');
      expect(html).toContain('<span style="font-size:23.99px;font-style:italic">Italic</span>');
    });

    it('should handle options without wrapping div', () => {
      const content: TextContent[] = [
        { text: 'No Wrapper', style: {} }
      ];
      
      const options: HtmlConversionOptions = { wrapInDiv: false };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      // 即使不包含 div wrapper，也有默认字体大小
      expect(html).toBe('<p style=""><span style="font-size:23.99px">No Wrapper</span></p>');
    });

    it('should handle custom div style', () => {
      const content: TextContent[] = [
        { text: 'Custom Div', style: {} }
      ];
      
      const options: HtmlConversionOptions = { divStyle: 'margin: 10px; padding: 5px' };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      expect(html).toContain('style="margin: 10px; padding: 5px"');
      // 也应该包含默认字体大小
      expect(html).toContain('font-size:23.99px');
    });

    it('should handle custom paragraph style', () => {
      const content: TextContent[] = [
        { text: 'Custom Paragraph', style: {} }
      ];
      
      const options: HtmlConversionOptions = { paragraphStyle: 'line-height: 1.5' };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      expect(html).toContain('<p style="line-height: 1.5">');
    });

    it('should handle text alignment', () => {
      const content: TextContent[] = [
        { text: 'Centered', style: { textAlign: 'center' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('text-align:center');
    });

    it('should handle text alignment from options', () => {
      const content: TextContent[] = [
        { text: 'Right Aligned', style: {} }
      ];
      
      const options: HtmlConversionOptions = { textAlign: 'right' };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      expect(html).toContain('text-align:right');
    });
  });

  describe('Multiple Paragraphs Conversion', () => {
    it('should convert multiple paragraphs to HTML', () => {
      const paragraphs = [
        [{ text: 'First paragraph', style: {} }],
        [{ text: 'Second paragraph', style: {} }],
        [{ text: 'Third paragraph', style: {} }]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      // 多段落转换中每个 span 都应包含默认字体大小
      expect(html).toContain('<p style=""><span style="font-size:23.99px">First paragraph</span></p>');
      expect(html).toContain('<p style=""><span style="font-size:23.99px">Second paragraph</span></p>');
      expect(html).toContain('<p style=""><span style="font-size:23.99px">Third paragraph</span></p>');
    });

    it('should handle mixed paragraph styles', () => {
      const paragraphs = [
        [{ text: 'Normal', style: {} }],
        [{ text: 'Bold', style: { bold: true } }],
        [{ text: 'Italic', style: { italic: true } }]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      // 样式现在包含默认字体大小
      expect(html).toContain('<span style="font-size:23.99px">Normal</span>');
      expect(html).toContain('<span style="font-size:23.99px;font-weight:bold">Bold</span>');
      expect(html).toContain('<span style="font-size:23.99px;font-style:italic">Italic</span>');
    });

    it('should handle complex multi-run paragraphs', () => {
      const paragraphs = [
        [
          { text: 'First ', style: { bold: true } },
          { text: 'paragraph ', style: { italic: true } },
          { text: 'complete', style: { underline: true } }
        ],
        [
          { text: 'Second ', style: { color: 'rgba(255,0,0,1)' } },
          { text: 'paragraph', style: { fontSize: 18 } }
        ]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      expect(html).toContain('font-weight:bold');
      expect(html).toContain('font-style:italic');
      expect(html).toContain('text-decoration:underline');
      expect(html).toContain('color:rgba(255,0,0,1)');
      expect(html).toContain('font-size:18px');
    });

    it('should handle empty paragraphs array', () => {
      const html = HtmlConverter.convertParagraphsToHtml([]);
      expect(html).toBe('');
    });

    it('should handle options without wrapping div for multiple paragraphs', () => {
      const paragraphs = [
        [{ text: 'Para 1', style: {} }],
        [{ text: 'Para 2', style: {} }]
      ];
      
      const options: HtmlConversionOptions = { wrapInDiv: false };
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs, options);
      // 无 wrapper 的多段落也包含默认字体大小
      expect(html).toBe('<p style=""><span style="font-size:23.99px">Para 1</span></p><p style=""><span style="font-size:23.99px">Para 2</span></p>');
    });
  });

  describe('Theme Color Handling', () => {
    it('should detect and add colortype for theme colors', () => {
      const content: TextContent[] = [
        { text: 'Theme Color', style: { color: '#4472C4' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('--colortype:accent1');
    });

    it('should handle explicit theme color types', () => {
      const content: TextContent[] = [
        { text: 'Theme Color', style: { color: 'rgba(255,0,0,1)', themeColorType: 'accent2' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('--colortype:accent2');
    });

    it('should add data attributes for theme colors', () => {
      const content: TextContent[] = [
        { text: 'Theme Color', style: { themeColorType: 'dk1' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('data-theme-color="dk1"');
    });

    it('should detect dark colors as dk1', () => {
      const darkColors = ['#000000', '#333333', '#00070F'];
      
      darkColors.forEach(color => {
        const content: TextContent[] = [
          { text: 'Dark Color', style: { color } }
        ];
        
        const html = HtmlConverter.convertSingleParagraphToHtml(content);
        expect(html).toContain('--colortype:dk1');
      });
    });

    it('should handle accent colors correctly', () => {
      const accentColors = ['#4472C4', '#5B9BD5'];
      
      accentColors.forEach(color => {
        const content: TextContent[] = [
          { text: 'Accent Color', style: { color } }
        ];
        
        const html = HtmlConverter.convertSingleParagraphToHtml(content);
        expect(html).toContain('--colortype:accent1');
      });
    });

    it('should handle colors with alpha channels', () => {
      const content: TextContent[] = [
        { text: 'Alpha Color', style: { color: '#4472C4FF' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('--colortype:accent1');
    });

    it('should handle non-theme colors without colortype', () => {
      const content: TextContent[] = [
        { text: 'Regular Color', style: { color: 'rgba(123,45,67,1)' } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).not.toContain('--colortype');
    });
  });

  describe('HTML Escaping', () => {
    it('should not escape HTML by default', () => {
      const content: TextContent[] = [
        { text: '<script>alert("test")</script>', style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('<script>alert("test")</script>');
    });

    it('should escape HTML when requested', () => {
      const content: TextContent[] = [
        { text: '<script>alert("test")</script>', style: {} }
      ];
      
      const options: HtmlConversionOptions = { escapeHtml: true };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      expect(html).toContain('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
    });

    it('should handle all HTML special characters', () => {
      const content: TextContent[] = [
        { text: '&<>"\'', style: {} }
      ];
      
      const options: HtmlConversionOptions = { escapeHtml: true };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      expect(html).toContain('&amp;&lt;&gt;&quot;&#39;');
    });

    it('should handle null and undefined text gracefully', () => {
      const content: TextContent[] = [
        { text: null as any, style: {} }
      ];
      
      const options: HtmlConversionOptions = { escapeHtml: true };
      const html = HtmlConverter.convertSingleParagraphToHtml(content, options);
      // 即使文本为 null，也应包含默认字体大小
      expect(html).toContain('<span style="font-size:23.99px"></span>');
    });
  });

  describe('Style Ordering and Formatting', () => {
    it('should maintain correct style order', () => {
      const content: TextContent[] = [
        { 
          text: 'All Styles',
          style: {
            fontFamily: 'Arial',
            backgroundColor: 'rgba(0,255,0,1)',
            strike: true,
            underline: true,
            italic: true,
            bold: true,
            fontSize: 16,
            color: 'rgba(255,0,0,1)',
            themeColorType: 'accent1'
          }
        }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      
      // Check that styles appear in the expected order
      const styleContent = html.match(/style="([^"]+)"/)?.[1] || '';
      const styles = styleContent.split(';');
      
      // 样式顺序：font-size 现在总是首先出现（因为默认值），然后是其他样式
      expect(styles[0]).toContain('font-size:');
      expect(styles[1]).toContain('color:');
      expect(styles[2]).toContain('font-weight:');
      expect(styles[3]).toContain('font-style:');
      expect(styles[4]).toContain('text-decoration:');
      expect(styles[5]).toContain('text-decoration:');
      expect(styles[6]).toContain('font-family:');
      expect(styles[7]).toContain('background-color:');
      expect(styles[8]).toContain('--colortype:');
    });

    it('should handle combined text decorations', () => {
      const content: TextContent[] = [
        { 
          text: 'Underline and Strike',
          style: {
            underline: true,
            strike: true
          }
        }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('text-decoration:underline');
      expect(html).toContain('text-decoration:line-through');
    });

    it('should handle empty styles gracefully', () => {
      const content: TextContent[] = [
        { text: 'No Style', style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // "空"样式现在包含默认字体大小
      expect(html).toContain('style="font-size:23.99px"');
    });

    it('should handle undefined styles', () => {
      const content: TextContent[] = [
        { text: 'Undefined Style', style: undefined as any }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // undefined 样式也会有默认字体大小
      expect(html).toContain('style="font-size:23.99px"');
    });
  });

  describe('Utility Functions', () => {
    describe('getDefaultFontName', () => {
      it('should return first font family found', () => {
        const content: TextContent[] = [
          { text: 'Text 1', style: {} },
          { text: 'Text 2', style: { fontFamily: 'Arial' } },
          { text: 'Text 3', style: { fontFamily: 'Times' } }
        ];
        
        const fontName = HtmlConverter.getDefaultFontName(content);
        expect(fontName).toBe('Arial');
      });

      it('should return default font when no font family found', () => {
        const content: TextContent[] = [
          { text: 'Text 1', style: {} },
          { text: 'Text 2', style: { color: 'red' } }
        ];
        
        const fontName = HtmlConverter.getDefaultFontName(content);
        expect(fontName).toBe('Microsoft Yahei');
      });

      it('should handle empty content array', () => {
        const fontName = HtmlConverter.getDefaultFontName([]);
        expect(fontName).toBe('Microsoft Yahei');
      });
    });

    describe('getDefaultColor', () => {
      it('should return first color found', () => {
        const content: TextContent[] = [
          { text: 'Text 1', style: {} },
          { text: 'Text 2', style: { color: 'rgba(255,0,0,1)' } },
          { text: 'Text 3', style: { color: 'rgba(0,255,0,1)' } }
        ];
        
        const color = HtmlConverter.getDefaultColor(content);
        expect(color).toBe('rgba(255,0,0,1)');
      });

      it('should return default color when no color found', () => {
        const content: TextContent[] = [
          { text: 'Text 1', style: {} },
          { text: 'Text 2', style: { fontSize: 16 } }
        ];
        
        const color = HtmlConverter.getDefaultColor(content);
        expect(color).toBe('#333333');
      });

      it('should handle empty content array', () => {
        const color = HtmlConverter.getDefaultColor([]);
        expect(color).toBe('#333333');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle content with only empty text', () => {
      const content: TextContent[] = [
        { text: '', style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // 空文本内容也会有默认字体大小
      expect(html).toBe('<div style=""><p style=""><span style="font-size:23.99px"></span></p></div>');
    });

    it('should handle content with only whitespace', () => {
      const content: TextContent[] = [
        { text: '   ', style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      // 仅包含空格的内容也有默认字体大小
      expect(html).toContain('<span style="font-size:23.99px">   </span>');
    });

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(10000);
      const content: TextContent[] = [
        { text: longText, style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain(longText);
    });

    it('should handle special characters in text', () => {
      const specialText = 'Text with émojis 🎉 and spéciál chäräctërs';
      const content: TextContent[] = [
        { text: specialText, style: {} }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain(specialText);
    });

    it('should handle malformed style objects', () => {
      const content: TextContent[] = [
        { text: 'Test', style: { fontSize: 'invalid' as any } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).toContain('font-size:invalidpx');
    });

    it('should handle null color values', () => {
      const content: TextContent[] = [
        { text: 'Test', style: { color: null as any } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).not.toContain('color:');
    });

    it('should handle boolean false values for text decoration', () => {
      const content: TextContent[] = [
        { text: 'Test', style: { bold: false, italic: false, underline: false, strike: false } }
      ];
      
      const html = HtmlConverter.convertSingleParagraphToHtml(content);
      expect(html).not.toContain('font-weight:');
      expect(html).not.toContain('font-style:');
      expect(html).not.toContain('text-decoration:');
    });
  });

  describe('Complex Real-world Scenarios', () => {
    it('should handle rich text with mixed formatting', () => {
      const paragraphs = [
        [
          { text: 'Title: ', style: { bold: true, fontSize: 18, color: '#4472C4' } },
          { text: 'PowerPoint to PPTist Converter', style: { italic: true, fontSize: 16 } }
        ],
        [
          { text: 'Description: ', style: { underline: true, color: '#333333' } },
          { text: 'This tool converts ', style: {} },
          { text: 'PPTX files', style: { bold: true, backgroundColor: 'rgba(255,255,0,0.3)' } },
          { text: ' to ', style: {} },
          { text: 'PPTist-compatible JSON', style: { italic: true, fontFamily: 'Courier New' } },
          { text: ' format.', style: {} }
        ]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      
      // Check that all expected styles are present
      expect(html).toContain('font-weight:bold');
      expect(html).toContain('font-size:18px');
      expect(html).toContain('--colortype:accent1');
      expect(html).toContain('font-style:italic');
      expect(html).toContain('text-decoration:underline');
      expect(html).toContain('background-color:rgba(255,255,0,0.3)');
      expect(html).toContain("font-family:'Courier New'");
    });

    it('should handle table-like structured text', () => {
      const paragraphs = [
        [
          { text: 'Header 1', style: { bold: true } },
          { text: '\t', style: {} },
          { text: 'Header 2', style: { bold: true } },
          { text: '\t', style: {} },
          { text: 'Header 3', style: { bold: true } }
        ],
        [
          { text: 'Data 1', style: {} },
          { text: '\t', style: {} },
          { text: 'Data 2', style: {} },
          { text: '\t', style: {} },
          { text: 'Data 3', style: {} }
        ]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      expect(html).toContain('Header 1');
      expect(html).toContain('Data 1');
      expect(html).toContain('\t');
    });

    it('should handle presentation slide with title and bullet points', () => {
      const paragraphs = [
        [{ text: 'Main Title', style: { bold: true, fontSize: 24, color: '#4472C4' } }],
        [{ text: '• First bullet point', style: { fontSize: 16 } }],
        [{ text: '• Second bullet point with ', style: { fontSize: 16 } }, { text: 'emphasis', style: { italic: true, fontSize: 16 } }],
        [{ text: '• Third bullet point', style: { fontSize: 16 } }]
      ];
      
      const html = HtmlConverter.convertParagraphsToHtml(paragraphs);
      expect(html).toContain('Main Title');
      expect(html).toContain('• First bullet point');
      expect(html).toContain('emphasis');
      expect(html).toContain('font-size:24px');
      expect(html).toContain('font-size:16px');
    });
  });
});