import { TextStyleExtractor } from "../../app/lib/services/text/TextStyleExtractor";
import { XmlParseService } from "../../app/lib/services/core/XmlParseService";
import { ProcessingContext } from "../../app/lib/services/interfaces/ProcessingContext";
import { IdGenerator } from "../../app/lib/services/utils/IdGenerator";
import { TextElement } from "../../app/lib/models/domain/elements/TextElement";

describe("TextStyleExtractor - Multi-paragraph handling", () => {
  let textStyleExtractor: TextStyleExtractor;
  let xmlParser: XmlParseService;
  let context: ProcessingContext;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    textStyleExtractor = new TextStyleExtractor(xmlParser);
    context = {
      zip: {} as any,
      slideNumber: 1,
      slideId: "slide1",
      relationships: new Map(),
      basePath: "ppt/slides",
      options: { imageProcessingMode: "url" } as any,
      warnings: [],
      idGenerator: new IdGenerator(),
      theme: undefined
    };
  });

  it("should extract paragraphs separately for proper p tag generation", () => {
    // 创建包含两个段落的XML结构
    const multiParagraphXml = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="2000">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>第一段文字</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr sz="2000">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>第二段文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(multiParagraphXml);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 应该有2个段落，每个段落包含1个文本项
    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0]).toHaveLength(1);
    expect(result.paragraphs[0][0].text).toBe("第一段文字");
    expect(result.paragraphs[1]).toHaveLength(1);
    expect(result.paragraphs[1][0].text).toBe("第二段文字");
  });

  it("should handle single paragraph without adding extra line breaks", () => {
    // 创建单个段落的XML结构
    const singleParagraphXml = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="1800">
              <a:solidFill>
                <a:srgbClr val="FF0000" />
              </a:solidFill>
            </a:rPr>
            <a:t>单段文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(singleParagraphXml);
    const result = textStyleExtractor.extractTextContent(txBodyNode, context);

    // 验证结果 - 应该只有1个项目，没有额外的换行符
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("单段文字");
  });

  it("should handle three paragraphs with proper line breaks", () => {
    // 创建包含三个段落的XML结构
    const threeParagraphsXml = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="0000FF" />
              </a:solidFill>
            </a:rPr>
            <a:t>段落一</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="0000FF" />
              </a:solidFill>
            </a:rPr>
            <a:t>段落二</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="0000FF" />
              </a:solidFill>
            </a:rPr>
            <a:t>段落三</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(threeParagraphsXml);
    const result = textStyleExtractor.extractTextContent(txBodyNode, context);

    // 验证结果 - 应该有5个项目：段落一 + 换行 + 段落二 + 换行 + 段落三
    expect(result).toHaveLength(5);
    expect(result[0].text).toBe("段落一");
    expect(result[1].text).toBe("\n"); // 第一个换行符
    expect(result[2].text).toBe("段落二");
    expect(result[3].text).toBe("\n"); // 第二个换行符
    expect(result[4].text).toBe("段落三");
  });

  it("should handle empty paragraphs correctly", () => {
    // 创建包含空段落的XML结构
    const emptyParagraphXml = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="1400">
              <a:solidFill>
                <a:srgbClr val="008000" />
              </a:solidFill>
            </a:rPr>
            <a:t>有内容的段落</a:t>
          </a:r>
        </a:p>
        <a:p>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr sz="1400">
              <a:solidFill>
                <a:srgbClr val="008000" />
              </a:solidFill>
            </a:rPr>
            <a:t>另一个有内容的段落</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(emptyParagraphXml);
    const result = textStyleExtractor.extractTextContent(txBodyNode, context);

    // 验证结果 - 空段落应该被过滤掉，只保留有内容的段落
    // 第一段 + 换行 + 第三段 = 3个项目（空段落被过滤）
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("有内容的段落");
    expect(result[1].text).toBe("\n"); // 段落间的换行符
    expect(result[2].text).toBe("另一个有内容的段落");
    // 注意：空段落被过滤掉了
  });

  it("should preserve styles when adding line breaks between paragraphs", () => {
    // 创建包含不同样式的两个段落
    const styledParagraphsXml = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="2000" b="1">
              <a:solidFill>
                <a:srgbClr val="FF0000" />
              </a:solidFill>
            </a:rPr>
            <a:t>加粗红色文字</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr sz="1600" i="1">
              <a:solidFill>
                <a:srgbClr val="0000FF" />
              </a:solidFill>
            </a:rPr>
            <a:t>斜体蓝色文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(styledParagraphsXml);
    const result = textStyleExtractor.extractTextContent(txBodyNode, context);

    // 验证结果
    expect(result).toHaveLength(3);
    
    // 第一段：加粗红色
    expect(result[0].text).toBe("加粗红色文字");
    expect(result[0].style.bold).toBe(true);
    expect(result[0].style.color).toBe("rgba(255,0,0,1)");
    
    // 换行符
    expect(result[1].text).toBe("\n");
    
    // 第二段：斜体蓝色
    expect(result[2].text).toBe("斜体蓝色文字");
    expect(result[2].style.italic).toBe(true);
    expect(result[2].style.color).toBe("rgba(0,0,255,1)");
  });

  it("should generate correct HTML with multiple p tags in TextElement", () => {
    // 创建 TextElement 并设置多段落内容
    const textElement = new TextElement("test-text-1");
    
    const paragraphs = [
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

    textElement.setParagraphs(paragraphs);
    textElement.setSize({ width: 400, height: 200 });
    textElement.setPosition({ x: 100, y: 50 });

    const json = textElement.toJSON();

    // 验证生成的 HTML 包含多个 p 标签
    expect(json.content).toContain('<div  style="">');
    expect(json.content).toMatch(/<p[^>]*>.*智子云.*<\/p>/);
    expect(json.content).toMatch(/<p[^>]*>.*数据驱动未来.*<\/p>/);
    
    // 验证样式
    expect(json.content).toContain('font-size:107px');
    expect(json.content).toContain('font-size:72px');
    expect(json.content).toContain('font-weight:bold');
    expect(json.content).toContain('color:rgb(0, 47, 113)');

    // 验证结构：应该有两个独立的 p 标签
    const pTagMatches = json.content.match(/<p[^>]*>/g);
    expect(pTagMatches).toHaveLength(2);

    // 验证其他 JSON 属性
    expect(json.type).toBe("text");
    expect(json.width).toBe(400);
    expect(json.height).toBe(200);
    expect(json.left).toBe(100);
    expect(json.top).toBe(50);
  });
});