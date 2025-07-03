import { TextStyleExtractor } from "../../app/lib/services/text/TextStyleExtractor";
import { XmlParseService } from "../../app/lib/services/core/XmlParseService";
import { ProcessingContext } from "../../app/lib/services/interfaces/ProcessingContext";
import { IdGenerator } from "../../app/lib/services/utils/IdGenerator";
import { TextElement } from "../../app/lib/models/domain/elements/TextElement";

describe("TextStyleExtractor - Line Height Extraction", () => {
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

  it("should extract line height from spcPct (percentage-based)", () => {
    // 创建包含 spcPct 行高的 XML 结构
    const xmlWithLineHeight = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="150000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1800">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>测试行高文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithLineHeight);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 应该提取到 1.5 的行高
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0]).toHaveLength(1);
    expect(result.lineHeight).toBe(1.5);
  });

  it("should extract line height from spcPts (points-based)", () => {
    // 创建包含 spcPts 行高的 XML 结构
    const xmlWithPointsLineHeight = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPts val="1800" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1200">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>测试点数行高</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithPointsLineHeight);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 1800 点 = 18 点，相对于 12 点字体 = 1.5 倍行高
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0]).toHaveLength(1);
    expect(result.lineHeight).toBe(1.5);
  });

  it("should handle paragraph without line height", () => {
    // 创建没有行高设置的 XML 结构
    const xmlWithoutLineHeight = `
      <root>
        <a:p>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>没有行高设置的文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithoutLineHeight);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 没有行高设置时，lineHeight 应该是PowerPoint默认值 1.15，但在TextElement级别不会设置
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0]).toHaveLength(1);
    expect(result.lineHeight).toBeUndefined(); // 默认值不会返回
  });

  it("should handle multiple paragraphs with different line heights", () => {
    // 创建包含不同行高的多个段落
    const xmlWithMultipleLineHeights = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="100000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>单倍行高文字</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="200000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="FF0000" />
              </a:solidFill>
            </a:rPr>
            <a:t>双倍行高文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithMultipleLineHeights);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 第一段 1.0 倍行高，取第一个段落的行高作为TextElement级别的行高
    expect(result.paragraphs).toHaveLength(2);
    expect(result.lineHeight).toBe(1.0); // 取第一个段落的行高
  });

  it("should apply line height to all runs in the same paragraph", () => {
    // 创建包含多个文本运行的段落
    const xmlWithMultipleRuns = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="125000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1600" b="1">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>加粗文字</a:t>
          </a:r>
          <a:r>
            <a:rPr sz="1600" i="1">
              <a:solidFill>
                <a:srgbClr val="FF0000" />
              </a:solidFill>
            </a:rPr>
            <a:t>斜体文字</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithMultipleRuns);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 行高会在TextElement级别设置
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0]).toHaveLength(2);
    expect(result.lineHeight).toBe(1.25);
  });

  it("should include line height in TextElement JSON output", () => {
    // 创建 TextElement 并测试 JSON 输出
    const textElement = new TextElement("test-line-height");
    
    const paragraphs = [
      [
        {
          text: "智子云（股票代码：835045）",
          style: {
            fontSize: 17,
            fontFamily: "Impact",
            color: "rgba(0,47,113,1)",
            themeColorType: "accent1"
          }
        }
      ]
    ];

    textElement.setParagraphs(paragraphs);
    textElement.setSize({ width: 430.91, height: 173 });
    textElement.setPosition({ x: 848.88, y: 477.68 });
    
    // 设置行高到textStyle
    textElement.setTextStyle({ lineHeight: 1.5 });

    const json = textElement.toJSON();

    // 验证 JSON 输出包含 lineHeight 属性
    expect(json.lineHeight).toBe(1.5);
    expect(json.type).toBe("text");
    expect(json.width).toBe(430.91);
    expect(json.height).toBe(173);
    expect(json.left).toBe(848.88);
    expect(json.top).toBe(477.68);
  });

  it("should not include line height in JSON output when it's default value", () => {
    // 创建行高为PowerPoint默认值 1.15 的 TextElement
    const textElement = new TextElement("test-default-line-height");
    
    const paragraphs = [
      [
        {
          text: "普通文字",
          style: {
            fontSize: 16,
            fontFamily: "Arial",
            color: "rgba(0,0,0,1)"
          }
        }
      ]
    ];

    textElement.setParagraphs(paragraphs);
    textElement.setSize({ width: 200, height: 100 });
    textElement.setPosition({ x: 100, y: 50 });
    
    // 设置默认行高到textStyle
    textElement.setTextStyle({ lineHeight: 1.15 });

    const json = textElement.toJSON();

    // 验证 JSON 输出不包含 lineHeight 属性（因为是PowerPoint默认值）
    expect(json.lineHeight).toBeUndefined();
    expect(json.type).toBe("text");
  });

  it("should handle edge cases with invalid line height values", () => {
    // 创建包含无效行高值的 XML 结构
    const xmlWithInvalidLineHeight = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="abc" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>无效行高值</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(xmlWithInvalidLineHeight);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证结果 - 无效值应该回退到PowerPoint默认值 1.15，但在TextElement级别不会设置
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0]).toHaveLength(1);
    expect(result.lineHeight).toBeUndefined(); // 默认值不会返回
  });

  it("should extract line height method directly", () => {
    // 测试 extractLineHeight 方法
    const xmlWithLineHeight = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="180000" />
            </a:lnSpc>
          </a:pPr>
        </a:p>
      </root>
    `;

    const rootNode = xmlParser.parse(xmlWithLineHeight);
    if (!rootNode.children || rootNode.children.length === 0) {
      throw new Error("Failed to parse XML");
    }
    const pNode = rootNode.children[0];
    const lineHeight = textStyleExtractor.extractLineHeight(pNode);

    expect(lineHeight).toBe(1.8);
  });

  it("should handle real PowerPoint XML line spacing values", () => {
    // 测试实际PowerPoint文件中的行高值
    const realPowerPointXml = `
      <root>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="100000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1600">
              <a:solidFill>
                <a:srgbClr val="000000" />
              </a:solidFill>
            </a:rPr>
            <a:t>关于智子云</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:pPr>
            <a:lnSpc>
              <a:spcPct val="150000" />
            </a:lnSpc>
          </a:pPr>
          <a:r>
            <a:rPr sz="1700">
              <a:solidFill>
                <a:srgbClr val="002F71" />
              </a:solidFill>
            </a:rPr>
            <a:t>智子云（股票代码：835045）是一家知名的大数据技术公司</a:t>
          </a:r>
        </a:p>
      </root>
    `;

    const txBodyNode = xmlParser.parse(realPowerPointXml);
    const result = textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);

    // 验证PowerPoint实际规则：val="100000" → 100% → 1.0，取第一个段落的行高
    expect(result.paragraphs).toHaveLength(2);
    expect(result.lineHeight).toBe(1.0); // 取第一个段落的行高
    expect(result.paragraphs[0][0].text).toBe("关于智子云");
    expect(result.paragraphs[1][0].text).toBe("智子云（股票代码：835045）是一家知名的大数据技术公司");
  });

  it("should handle PowerPoint default line spacing correctly", () => {
    // 测试PowerPoint默认行高115%
    const textElement = new TextElement("test-powerpoint-default");
    
    const paragraphs = [
      [
        {
          text: "PowerPoint默认行高文字",
          style: {
            fontSize: 16,
            fontFamily: "Arial",
            color: "rgba(0,0,0,1)",
            lineHeight: 1.15 // PowerPoint默认值
          }
        }
      ]
    ];

    textElement.setParagraphs(paragraphs);
    const json = textElement.toJSON();

    // PowerPoint默认值1.15不应该出现在JSON输出中
    expect(json.lineHeight).toBeUndefined();
  });

  it("should include non-default line heights in JSON output", () => {
    // 测试非默认行高会出现在JSON输出中
    const testCases = [
      { lineHeight: 1.0, shouldInclude: true },   // 100% 单倍行距
      { lineHeight: 1.2, shouldInclude: true },   // 120% 
      { lineHeight: 1.5, shouldInclude: true },   // 150% 1.5倍行距
      { lineHeight: 2.0, shouldInclude: true },   // 200% 双倍行距
      { lineHeight: 1.15, shouldInclude: false }, // PowerPoint默认值
      { lineHeight: 1.14, shouldInclude: true },  // 接近但不等于默认值
      { lineHeight: 1.16, shouldInclude: true }   // 接近但不等于默认值
    ];

    testCases.forEach(({ lineHeight, shouldInclude }) => {
      const textElement = new TextElement(`test-${lineHeight}`);
      
      const paragraphs = [
        [
          {
            text: `行高${lineHeight}测试`,
            style: {}
          }
        ]
      ];

      textElement.setParagraphs(paragraphs);
      // 设置行高到textStyle
      textElement.setTextStyle({ lineHeight });
      const json = textElement.toJSON();

      if (shouldInclude) {
        expect(json.lineHeight).toBe(lineHeight);
      } else {
        expect(json.lineHeight).toBeUndefined();
      }
    });
  });
});