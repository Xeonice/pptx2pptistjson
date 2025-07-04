/**
 * TextValidator 综合测试套件
 * 测试文本验证和HTML处理功能，包括边界条件和实际使用场景
 */

import { hasValidText, extractTextFromHtml } from '../../app/lib/services/utils/TextValidator';

describe('TextValidator - Comprehensive Test Suite', () => {
  describe('hasValidText Function', () => {
    describe('Valid Text Cases', () => {
      it('should return true for simple text', () => {
        expect(hasValidText('Hello World')).toBe(true);
        expect(hasValidText('Simple text')).toBe(true);
        expect(hasValidText('A')).toBe(true);
        expect(hasValidText('123')).toBe(true);
      });

      it('should return true for text with special characters', () => {
        expect(hasValidText('Hello, World!')).toBe(true);
        expect(hasValidText('Text with émojis 🎉')).toBe(true);
        expect(hasValidText('Special chars: @#$%^&*()')).toBe(true);
        expect(hasValidText('Line\nbreak')).toBe(true);
        expect(hasValidText('Tab\there')).toBe(true);
      });

      it('should return true for text with numbers and symbols', () => {
        expect(hasValidText('Price: $19.99')).toBe(true);
        expect(hasValidText('Email: test@example.com')).toBe(true);
        expect(hasValidText('Math: 2 + 2 = 4')).toBe(true);
        expect(hasValidText('Date: 2023-12-25')).toBe(true);
      });

      it('should return true for text with leading/trailing whitespace but meaningful content', () => {
        expect(hasValidText('  Hello  ')).toBe(true);
        expect(hasValidText('\nHello\n')).toBe(true);
        expect(hasValidText('\t\tHello\t\t')).toBe(true);
        expect(hasValidText('   Hello World   ')).toBe(true);
      });

      it('should return true for HTML with text content', () => {
        expect(hasValidText('<p>Hello World</p>')).toBe(true);
        expect(hasValidText('<span style="color:red">Red text</span>')).toBe(true);
        expect(hasValidText('<div><p>Nested <strong>content</strong></p></div>')).toBe(true);
        expect(hasValidText('<a href="link">Link text</a>')).toBe(true);
      });

      it('should return true for complex HTML structures with content', () => {
        expect(hasValidText('<div class="content"><h1>Title</h1><p>Paragraph</p></div>')).toBe(true);
        expect(hasValidText('<table><tr><td>Cell</td></tr></table>')).toBe(true);
        expect(hasValidText('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe(true);
      });

      it('should return true for HTML with mixed content', () => {
        expect(hasValidText('Text before <b>bold</b> text after')).toBe(true);
        expect(hasValidText('Start <span>middle</span> end')).toBe(true);
        expect(hasValidText('<p>Para 1</p>Text between<p>Para 2</p>')).toBe(true);
      });
    });

    describe('Invalid Text Cases', () => {
      it('should return false for undefined and null', () => {
        expect(hasValidText(undefined)).toBe(false);
        expect(hasValidText(null as any)).toBe(false);
      });

      it('should return false for empty strings', () => {
        expect(hasValidText('')).toBe(false);
        expect(hasValidText('  ')).toBe(false);
        expect(hasValidText('\n\n')).toBe(false);
        expect(hasValidText('\t\t')).toBe(false);
        expect(hasValidText('   \n  \t  ')).toBe(false);
      });

      it('should return false for empty HTML tags', () => {
        expect(hasValidText('<p></p>')).toBe(false);
        expect(hasValidText('<div></div>')).toBe(false);
        expect(hasValidText('<span></span>')).toBe(false);
        expect(hasValidText('<strong></strong>')).toBe(false);
      });

      it('should return false for HTML with only whitespace content', () => {
        expect(hasValidText('<p>   </p>')).toBe(false);
        expect(hasValidText('<div>\n\n</div>')).toBe(false);
        expect(hasValidText('<span>\t\t</span>')).toBe(false);
        expect(hasValidText('<p>  \n  \t  </p>')).toBe(false);
      });

      it('should return false for nested empty HTML', () => {
        expect(hasValidText('<div><p></p></div>')).toBe(false);
        expect(hasValidText('<div><p>   </p></div>')).toBe(false);
        expect(hasValidText('<div><span></span><p></p></div>')).toBe(false);
        expect(hasValidText('<ul><li></li><li>  </li></ul>')).toBe(false);
      });

      it('should return false for self-closing tags without content', () => {
        expect(hasValidText('<br>')).toBe(false);
        expect(hasValidText('<hr>')).toBe(false);
        expect(hasValidText('<img src="test.jpg">')).toBe(false);
        expect(hasValidText('<br/><hr/>')).toBe(false);
      });

      it('should return false for HTML with only structural elements', () => {
        expect(hasValidText('<table></table>')).toBe(false);
        expect(hasValidText('<tr></tr>')).toBe(false);
        expect(hasValidText('<td></td>')).toBe(false);
        expect(hasValidText('<table><tr><td></td></tr></table>')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle malformed HTML', () => {
        expect(hasValidText('<p>Unclosed tag')).toBe(true);
        expect(hasValidText('Text with <unopened tag')).toBe(true);
        expect(hasValidText('<>Empty brackets</>')).toBe(true);
        expect(hasValidText('<<double brackets>>')).toBe(true);
      });

      it('should handle HTML with attributes but no content', () => {
        expect(hasValidText('<div class="test" id="myid"></div>')).toBe(false);
        expect(hasValidText('<span style="color:red;"></span>')).toBe(false);
        expect(hasValidText('<p data-test="value">   </p>')).toBe(false);
      });

      it('should handle mixed valid and invalid content', () => {
        expect(hasValidText('<p></p>Valid text<div></div>')).toBe(true);
        expect(hasValidText('<br>Text after break')).toBe(true);
        expect(hasValidText('Text before<hr>')).toBe(true);
      });

      it('should handle very long strings', () => {
        const longText = 'A'.repeat(10000);
        expect(hasValidText(longText)).toBe(true);
        
        const longHtml = '<p>' + 'A'.repeat(10000) + '</p>';
        expect(hasValidText(longHtml)).toBe(true);
        
        const longEmptyHtml = '<div>' + '   '.repeat(1000) + '</div>';
        expect(hasValidText(longEmptyHtml)).toBe(false);
      });

      it('should handle unicode and special characters', () => {
        expect(hasValidText('中文文本')).toBe(true);
        expect(hasValidText('Русский текст')).toBe(true);
        expect(hasValidText('العربية')).toBe(true);
        expect(hasValidText('🎉🎊🎈')).toBe(true);
        expect(hasValidText('<p>中文</p>')).toBe(true);
      });
    });
  });

  describe('extractTextFromHtml Function', () => {
    describe('Basic HTML Extraction', () => {
      it('should extract text from simple HTML tags', () => {
        expect(extractTextFromHtml('<p>Hello World</p>')).toBe('Hello World');
        expect(extractTextFromHtml('<div>Test content</div>')).toBe('Test content');
        expect(extractTextFromHtml('<span>Span text</span>')).toBe('Span text');
        expect(extractTextFromHtml('<strong>Bold text</strong>')).toBe('Bold text');
      });

      it('should extract text from nested HTML', () => {
        expect(extractTextFromHtml('<div><p>Nested content</p></div>')).toBe('Nested content');
        expect(extractTextFromHtml('<p>Start <strong>bold</strong> end</p>')).toBe('Start bold end');
        expect(extractTextFromHtml('<div><span>Span</span> and <em>emphasis</em></div>')).toBe('Span and emphasis');
      });

      it('should handle multiple paragraphs and elements', () => {
        expect(extractTextFromHtml('<p>Para 1</p><p>Para 2</p>')).toBe('Para 1Para 2');
        expect(extractTextFromHtml('<h1>Title</h1><p>Content</p>')).toBe('TitleContent');
        expect(extractTextFromHtml('<div>Div 1</div><div>Div 2</div>')).toBe('Div 1Div 2');
      });

      it('should handle list elements', () => {
        expect(extractTextFromHtml('<ul><li>Item 1</li><li>Item 2</li></ul>')).toBe('Item 1Item 2');
        expect(extractTextFromHtml('<ol><li>First</li><li>Second</li></ol>')).toBe('FirstSecond');
      });

      it('should handle table elements', () => {
        expect(extractTextFromHtml('<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>')).toBe('Cell 1Cell 2');
        expect(extractTextFromHtml('<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>')).toBe('HeaderData');
      });
    });

    describe('HTML Entity Decoding', () => {
      it('should decode common HTML entities', () => {
        expect(extractTextFromHtml('&amp;')).toBe('&');
        expect(extractTextFromHtml('&lt;')).toBe('<');
        expect(extractTextFromHtml('&gt;')).toBe('>');
        expect(extractTextFromHtml('&quot;')).toBe('"');
        expect(extractTextFromHtml('&#039;')).toBe("'");
        expect(extractTextFromHtml('&nbsp;')).toBe(''); // trimmed to empty
      });

      it('should decode multiple entities in text', () => {
        expect(extractTextFromHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
        expect(extractTextFromHtml('&lt;tag&gt;')).toBe('<tag>');
        expect(extractTextFromHtml('&quot;quoted text&quot;')).toBe('"quoted text"');
        expect(extractTextFromHtml('It&#039;s working')).toBe("It's working");
      });

      it('should decode entities within HTML tags', () => {
        expect(extractTextFromHtml('<p>Tom &amp; Jerry</p>')).toBe('Tom & Jerry');
        expect(extractTextFromHtml('<div>&lt;script&gt;alert()&lt;/script&gt;</div>')).toBe('<script>alert()</script>');
        expect(extractTextFromHtml('<span>&quot;Hello&quot;</span>')).toBe('"Hello"');
      });

      it('should handle mixed entities and regular text', () => {
        expect(extractTextFromHtml('Mix &amp; match &lt;test&gt;')).toBe('Mix & match <test>');
        expect(extractTextFromHtml('<p>Data: &quot;value&quot; &amp; more</p>')).toBe('Data: "value" & more');
      });

      it('should handle non-breaking spaces', () => {
        expect(extractTextFromHtml('Word&nbsp;spacing')).toBe('Word spacing');
        expect(extractTextFromHtml('<p>Multiple&nbsp;&nbsp;&nbsp;spaces</p>')).toBe('Multiple   spaces');
      });

      it('should handle malformed entities gracefully', () => {
        expect(extractTextFromHtml('&invalid;')).toBe('&invalid;');
        expect(extractTextFromHtml('&amp')).toBe('&amp');
        expect(extractTextFromHtml('&;')).toBe('&;');
      });
    });

    describe('Whitespace and Formatting', () => {
      it('should trim leading and trailing whitespace', () => {
        expect(extractTextFromHtml('   <p>Text</p>   ')).toBe('Text');
        expect(extractTextFromHtml('\n<div>Content</div>\n')).toBe('Content');
        expect(extractTextFromHtml('\t<span>Span</span>\t')).toBe('Span');
      });

      it('should preserve internal whitespace', () => {
        expect(extractTextFromHtml('<p>Multiple   spaces</p>')).toBe('Multiple   spaces');
        expect(extractTextFromHtml('<div>Line\nbreaks</div>')).toBe('Line\nbreaks');
        expect(extractTextFromHtml('<span>Tab\there</span>')).toBe('Tab\there');
      });

      it('should handle whitespace between elements', () => {
        expect(extractTextFromHtml('<p>Para 1</p> <p>Para 2</p>')).toBe('Para 1 Para 2');
        expect(extractTextFromHtml('<span>Text 1</span>\n<span>Text 2</span>')).toBe('Text 1\nText 2');
      });
    });

    describe('Complex HTML Structures', () => {
      it('should extract text from complex nested structures', () => {
        const complexHtml = `
          <div class="container">
            <header>
              <h1>Title</h1>
              <nav><a href="#">Link</a></nav>
            </header>
            <main>
              <article>
                <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                </ul>
              </article>
            </main>
          </div>
        `;
        
        const extracted = extractTextFromHtml(complexHtml);
        expect(extracted).toContain('Title');
        expect(extracted).toContain('Link');
        expect(extracted).toContain('bold');
        expect(extracted).toContain('italic');
        expect(extracted).toContain('List item 1');
        expect(extracted).toContain('List item 2');
      });

      it('should handle HTML with attributes', () => {
        expect(extractTextFromHtml('<p class="text" id="para1">Content</p>')).toBe('Content');
        expect(extractTextFromHtml('<a href="http://example.com" target="_blank">Link</a>')).toBe('Link');
        expect(extractTextFromHtml('<img src="image.jpg" alt="Image text">')).toBe('');
      });

      it('should handle self-closing tags', () => {
        expect(extractTextFromHtml('Before<br>After')).toBe('BeforeAfter');
        expect(extractTextFromHtml('Text<hr>More text')).toBe('TextMore text');
        expect(extractTextFromHtml('Image: <img src="test.jpg"> here')).toBe('Image:  here');
      });

      it('should handle comments and CDATA', () => {
        expect(extractTextFromHtml('<!-- comment -->Text')).toBe('Text');
        expect(extractTextFromHtml('Text<!-- comment -->More')).toBe('TextMore');
        expect(extractTextFromHtml('<![CDATA[data]]>Text')).toBe('Text');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle empty and whitespace strings', () => {
        expect(extractTextFromHtml('')).toBe('');
        expect(extractTextFromHtml('   ')).toBe('');
        expect(extractTextFromHtml('\n\t\n')).toBe('');
      });

      it('should handle malformed HTML', () => {
        expect(extractTextFromHtml('<p>Unclosed tag')).toBe('Unclosed tag');
        expect(extractTextFromHtml('Text <unopened tag')).toBe('Text <unopened tag');
        expect(extractTextFromHtml('<>Empty brackets</>')).toBe('Empty brackets');
        expect(extractTextFromHtml('<<double>> brackets')).toBe('> brackets');
      });

      it('should handle HTML with no text content', () => {
        expect(extractTextFromHtml('<div></div>')).toBe('');
        expect(extractTextFromHtml('<p><span></span></p>')).toBe('');
        expect(extractTextFromHtml('<table><tr><td></td></tr></table>')).toBe('');
      });

      it('should handle very long HTML strings', () => {
        const longText = 'A'.repeat(1000);
        const longHtml = `<p>${longText}</p>`;
        expect(extractTextFromHtml(longHtml)).toBe(longText);
      });

      it('should handle HTML with special characters', () => {
        expect(extractTextFromHtml('<p>中文内容</p>')).toBe('中文内容');
        expect(extractTextFromHtml('<div>Русский</div>')).toBe('Русский');
        expect(extractTextFromHtml('<span>🎉🎊</span>')).toBe('🎉🎊');
      });

      it('should handle HTML with script and style tags', () => {
        expect(extractTextFromHtml('<script>alert("test")</script>Text')).toBe('alert("test")Text');
        expect(extractTextFromHtml('<style>.class{color:red;}</style>Content')).toBe('.class{color:red;}Content');
        expect(extractTextFromHtml('Before<script>code</script>After')).toBe('BeforecodeAfter');
      });
    });

    describe('Real-world HTML Examples', () => {
      it('should handle PowerPoint-generated HTML', () => {
        const pptHtml = `
          <div style="">
            <p style="text-align:center">
              <span style="color:rgba(255,0,0,1);font-size:16px;font-weight:bold">
                PowerPoint Title
              </span>
            </p>
          </div>
        `;
        
        expect(extractTextFromHtml(pptHtml)).toBe('PowerPoint Title');
      });

      it('should handle email-style HTML', () => {
        const emailHtml = `
          <html>
            <body>
              <p>Dear Customer,</p>
              <p>Thank you for your order. Your order number is <strong>#12345</strong>.</p>
              <p>Best regards,<br>Support Team</p>
            </body>
          </html>
        `;
        
        const extracted = extractTextFromHtml(emailHtml);
        expect(extracted).toContain('Dear Customer');
        expect(extracted).toContain('#12345');
        expect(extracted).toContain('Support Team');
      });

      it('should handle form HTML', () => {
        const formHtml = `
          <form>
            <label for="name">Name:</label>
            <input type="text" id="name" placeholder="Enter your name">
            <button type="submit">Submit</button>
          </form>
        `;
        
        const extracted = extractTextFromHtml(formHtml);
        expect(extracted).toContain('Name:');
        expect(extracted).toContain('Submit');
        expect(extracted).not.toContain('Enter your name'); // placeholder is an attribute
      });

      it('should handle table data', () => {
        const tableHtml = `
          <table border="1">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Widget A</td>
                <td>$10.00</td>
                <td>5</td>
              </tr>
              <tr>
                <td>Widget B</td>
                <td>$15.00</td>
                <td>3</td>
              </tr>
            </tbody>
          </table>
        `;
        
        const extracted = extractTextFromHtml(tableHtml);
        expect(extracted).toContain('Product');
        expect(extracted).toContain('Widget A');
        expect(extracted).toContain('$10.00');
        expect(extracted).toContain('Widget B');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should work together for text validation workflow', () => {
      const testCases = [
        {
          input: '<p>Valid content</p>',
          hasValid: true,
          extracted: 'Valid content'
        },
        {
          input: '<div></div>',
          hasValid: false,
          extracted: ''
        },
        {
          input: '<p>Text with &amp; entities</p>',
          hasValid: true,
          extracted: 'Text with & entities'
        },
        {
          input: '   <span>  Whitespace  </span>   ',
          hasValid: true,
          extracted: 'Whitespace'
        },
        {
          input: '<p><strong></strong></p>',
          hasValid: false,
          extracted: ''
        }
      ];

      testCases.forEach(({ input, hasValid, extracted }) => {
        expect(hasValidText(input)).toBe(hasValid);
        expect(extractTextFromHtml(input)).toBe(extracted);
      });
    });

    it('should handle PowerPoint conversion workflow', () => {
      // Simulate text elements from PowerPoint conversion
      const pptElements = [
        '<p style="">Title Text</p>',                    // Valid title
        '<div style=""><p style=""></p></div>',          // Empty text box
        '<span style="color:red">Colored text</span>',   // Styled text
        '   ',                                           // Whitespace only
        '<p>Bullet &bull; Point</p>',                   // Bullet with entity
        '<div><br></div>',                              // Line break only
      ];

      const results = pptElements.map(element => ({
        hasValid: hasValidText(element),
        text: extractTextFromHtml(element)
      }));

      expect(results[0]).toEqual({ hasValid: true, text: 'Title Text' });
      expect(results[1]).toEqual({ hasValid: false, text: '' });
      expect(results[2]).toEqual({ hasValid: true, text: 'Colored text' });
      expect(results[3]).toEqual({ hasValid: false, text: '' });
      expect(results[4]).toEqual({ hasValid: true, text: 'Bullet &bull; Point' });
      expect(results[5]).toEqual({ hasValid: false, text: '' });
    });
  });
});