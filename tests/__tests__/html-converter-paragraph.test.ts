import { HtmlConverter } from "../../app/lib/services/utils/HtmlConverter";
import { TextContent } from "../../app/lib/models/domain/elements/TextElement";

describe("HtmlConverter - Paragraph structure", () => {
  it("should generate multiple p tags for multiple paragraphs", () => {
    const paragraphs: TextContent[][] = [
      [
        {
          text: "智子云",
          style: {
            fontSize: 107,
            bold: true,
            color: "rgb(0, 47, 113)"
          }
        },
        {
          text: " ",
          style: {
            fontSize: 72,
            bold: true,
            color: "rgb(0, 47, 113)"
          }
        }
      ],
      [
        {
          text: "数据驱动未来",
          style: {
            fontSize: 72,
            color: "rgb(0, 47, 113)"
          }
        }
      ]
    ];

    const html = HtmlConverter.convertParagraphsToHtml(paragraphs);

    // 验证生成了包含两个 p 标签的 div
    expect(html).toContain('<div  style="">');
    expect(html).toContain('<p  style="">');
    expect(html).toMatch(/<p[^>]*>.*智子云.*<\/p>/);
    expect(html).toMatch(/<p[^>]*>.*数据驱动未来.*<\/p>/);
    
    // 验证样式
    expect(html).toContain('font-size:107px');
    expect(html).toContain('font-size:72px');
    expect(html).toContain('font-weight:bold');
    expect(html).toContain('color:rgb(0, 47, 113)');

    // 验证结构：应该有两个独立的 p 标签
    const pTagMatches = html.match(/<p[^>]*>/g);
    expect(pTagMatches).toHaveLength(2);
  });

  it("should handle single paragraph correctly", () => {
    const singleParagraph: TextContent[] = [
      {
        text: "单段文字",
        style: {
          fontSize: 16,
          color: "#000000"
        }
      }
    ];

    const html = HtmlConverter.convertSingleParagraphToHtml(singleParagraph);

    // 验证生成了包含一个 p 标签的 div
    expect(html).toContain('<div  style="">');
    expect(html).toContain('<p  style="">');
    expect(html).toContain('单段文字');
    
    // 验证只有一个 p 标签
    const pTagMatches = html.match(/<p[^>]*>/g);
    expect(pTagMatches).toHaveLength(1);
  });

  it("should support text alignment in paragraphs", () => {
    const paragraphs: TextContent[][] = [
      [
        {
          text: "左对齐",
          style: {
            textAlign: "left"
          }
        }
      ],
      [
        {
          text: "居中对齐", 
          style: {
            textAlign: "center"
          }
        }
      ]
    ];

    const html = HtmlConverter.convertParagraphsToHtml(paragraphs);

    // 验证段落样式
    expect(html).toContain('style="text-align:left"');
    expect(html).toContain('style="text-align:center"');
  });

  it("should not wrap in div when wrapInDiv is false", () => {
    const paragraphs: TextContent[][] = [
      [
        {
          text: "测试文字",
          style: {}
        }
      ]
    ];

    const html = HtmlConverter.convertParagraphsToHtml(paragraphs, {
      wrapInDiv: false
    });

    // 验证没有包装的 div
    expect(html).not.toContain('<div');
    expect(html).toContain('<p  style="">');
    expect(html).toContain('测试文字');
  });

  it("should escape HTML special characters", () => {
    const paragraphs: TextContent[][] = [
      [
        {
          text: "<script>alert('test')</script>",
          style: {}
        }
      ]
    ];

    const html = HtmlConverter.convertParagraphsToHtml(paragraphs, { escapeHtml: true });

    // 验证 HTML 特殊字符被转义
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it("should handle empty paragraphs", () => {
    const paragraphs: TextContent[][] = [
      [
        {
          text: "第一段",
          style: {}
        }
      ],
      [], // 空段落
      [
        {
          text: "第三段",
          style: {}
        }
      ]
    ];

    const html = HtmlConverter.convertParagraphsToHtml(paragraphs);

    // 验证生成了正确数量的 p 标签（应该跳过空段落）
    const pTagMatches = html.match(/<p[^>]*>/g);
    expect(pTagMatches).toHaveLength(3); // 包括空段落的 p 标签
    expect(html).toContain('第一段');
    expect(html).toContain('第三段');
  });

  it("should get default font and color correctly", () => {
    const content: TextContent[] = [
      {
        text: "测试",
        style: {
          fontFamily: "Arial",
          color: "#FF0000"
        }
      },
      {
        text: "文字",
        style: {}
      }
    ];

    const fontName = HtmlConverter.getDefaultFontName(content);
    const color = HtmlConverter.getDefaultColor(content);

    expect(fontName).toBe("Arial");
    expect(color).toBe("#FF0000");
  });

  it("should use fallback values when no styles are found", () => {
    const content: TextContent[] = [
      {
        text: "测试",
        style: {}
      }
    ];

    const fontName = HtmlConverter.getDefaultFontName(content);
    const color = HtmlConverter.getDefaultColor(content);

    expect(fontName).toBe("Microsoft Yahei");
    expect(color).toBe("#333333");
  });
});