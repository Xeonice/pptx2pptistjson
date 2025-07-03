import { TextStyleExtractor } from "../../app/lib/services/text/TextStyleExtractor";
import { XmlParseService } from "../../app/lib/services/core/XmlParseService";
import { XmlNode } from "../../app/lib/models/xml/XmlNode";
import { ProcessingContext } from "../../app/lib/services/interfaces/ProcessingContext";
import { IdGenerator } from "../../app/lib/services/utils/IdGenerator";

describe("TextStyleExtractor - endParaRPr handling", () => {
  let textStyleExtractor: TextStyleExtractor;
  let xmlParser: XmlParseService;
  let context: ProcessingContext;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    textStyleExtractor = new TextStyleExtractor(xmlParser);
    context = {
      relationships: new Map(),
      idGenerator: new IdGenerator(),
      debug: false,
      theme: undefined,
      imageProcessingMode: "url"
    };
  });

  it("should handle endParaRPr with line break correctly", () => {
    // 创建模拟的XML结构，对应你提供的XML片段
    // 注意：第二个run包含一个空格字符
    const paragraphXml = `<a:p><a:r><a:rPr lang="zh-CN" altLang="en-US" sz="8000" b="1" dirty="0"><a:solidFill><a:schemeClr val="accent1" /></a:solidFill><a:latin typeface="+mn-ea" /><a:ea typeface="+mn-ea" /></a:rPr><a:t>智子云</a:t></a:r><a:r><a:rPr lang="zh-CN" altLang="en-US" sz="5400" b="1" dirty="0"><a:solidFill><a:schemeClr val="accent1" /></a:solidFill><a:latin typeface="+mn-ea" /><a:ea typeface="+mn-ea" /></a:rPr><a:t> </a:t></a:r><a:endParaRPr lang="en-US" altLang="zh-CN" sz="5400" b="1" dirty="0"><a:solidFill><a:schemeClr val="accent1" /></a:solidFill><a:latin typeface="+mn-ea" /><a:ea typeface="+mn-ea" /></a:endParaRPr></a:p>`;

    const pNode = xmlParser.parse(paragraphXml);
    const result = textStyleExtractor.extractParagraphContent(pNode, context);
    expect(result).toHaveLength(3); // "智子云" + empty text run + line break from endParaRPr
    expect(result[0].text).toBe("智子云");
    expect(result[0].style.bold).toBe(true);
    expect(result[0].style.fontSize).toBe(Math.round((8000 / 100) * 1.39)); // 111
    
    expect(result[1].text).toBe(""); // 空文本run，但保留样式
    expect(result[1].style.bold).toBe(true);
    expect(result[1].style.fontSize).toBe(Math.round((5400 / 100) * 1.39)); // 75
    
    expect(result[2].text).toBe("\n"); // 换行符来自endParaRPr
    expect(result[2].style.bold).toBe(true);
    expect(result[2].style.fontSize).toBe(Math.round((5400 / 100) * 1.39)); // 75
  });

  it("should add line break for empty paragraph with endParaRPr", () => {
    // 测试只有endParaRPr，没有文本内容的段落
    const emptyParagraphXml = `
      <a:p>
        <a:endParaRPr lang="en-US" sz="2400" b="1">
          <a:solidFill>
            <a:schemeClr val="accent2" />
          </a:solidFill>
          <a:latin typeface="Arial" />
        </a:endParaRPr>
      </a:p>
    `;

    const pNode = xmlParser.parse(emptyParagraphXml);
    const result = textStyleExtractor.extractParagraphContent(pNode, context);

    // 验证结果 - 应该添加一个换行符
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("\n");
    expect(result[0].style.bold).toBe(true);
    expect(result[0].style.fontSize).toBe(Math.round((2400 / 100) * 1.39)); // 33
  });

  it("should not add extra content when paragraph has runs and endParaRPr", () => {
    // 测试有文本内容和endParaRPr的情况，不应该额外添加换行
    const paragraphWithContentXml = `
      <a:p>
        <a:r>
          <a:rPr sz="1800">
            <a:solidFill>
              <a:srgbClr val="000000" />
            </a:solidFill>
          </a:rPr>
          <a:t>测试文本</a:t>
        </a:r>
        <a:endParaRPr sz="1800">
          <a:solidFill>
            <a:srgbClr val="000000" />
          </a:solidFill>
        </a:endParaRPr>
      </a:p>
    `;

    const pNode = xmlParser.parse(paragraphWithContentXml);
    const result = textStyleExtractor.extractParagraphContent(pNode, context);

    // 验证结果 - 应该有文本和换行符（从endParaRPr）
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("测试文本");
    expect(result[0].style.fontSize).toBe(Math.round((1800 / 100) * 1.39)); // 25
    expect(result[1].text).toBe("\n"); // 换行符来自endParaRPr
  });

  it("should preserve whitespace runs correctly", () => {
    // 测试保留空格的情况
    const whitespaceRunXml = `
      <a:p>
        <a:r>
          <a:rPr sz="2000">
            <a:solidFill>
              <a:srgbClr val="FF0000" />
            </a:solidFill>
          </a:rPr>
          <a:t>第一段</a:t>
        </a:r>
        <a:r>
          <a:rPr sz="2000">
            <a:solidFill>
              <a:srgbClr val="FF0000" />
            </a:solidFill>
          </a:rPr>
          <a:t>   </a:t>
        </a:r>
        <a:r>
          <a:rPr sz="2000">
            <a:solidFill>
              <a:srgbClr val="FF0000" />
            </a:solidFill>
          </a:rPr>
          <a:t>第二段</a:t>
        </a:r>
      </a:p>
    `;

    const pNode = xmlParser.parse(whitespaceRunXml);
    const result = textStyleExtractor.extractParagraphContent(pNode, context);

    // 验证结果 - 所有run都应该被保留，包括空字符串run（原空格run）
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("第一段");
    expect(result[1].text).toBe(""); // 原空格run被txml解析为空字符串
    expect(result[2].text).toBe("第二段");
  });
});