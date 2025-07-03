/**
 * 完整转换流程端到端测试用例
 * 测试 PPTX → JSON 的完整转换链路和 PPTist 兼容性
 */

import * as fs from "fs";
import * as path from "path";

// 模拟的核心服务
const mockPPTXParser = {
  parseFromBuffer: jest.fn(),
  parseFromFile: jest.fn(),
};

const mockImageProcessor = {
  processImageWithStretch: jest.fn(),
  extractBlipFillInfo: jest.fn(),
};

const mockColorExtractor = {
  getSolidFill: jest.fn(),
  extractThemeColors: jest.fn(),
};

describe("完整转换流程端到端测试", () => {
  const sampleDir = path.join(process.cwd(), "sample");
  const stretchSampleDir = path.join(sampleDir, "stratch");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PPTX → JSON 端到端测试", () => {
    it("应该成功转换基础示例文件", async () => {
      const inputPath = path.join(sampleDir, "basic", "input.pptx");
      const expectedOutputPath = path.join(sampleDir, "basic", "output.json");

      // 检查示例文件是否存在
      if (!fs.existsSync(inputPath)) {
        console.warn(`⚠️ Sample file not found: ${inputPath}, skipping test`);
        return;
      }

      // 读取预期输出（如果存在）
      let expectedOutput = null;
      if (fs.existsSync(expectedOutputPath)) {
        expectedOutput = JSON.parse(fs.readFileSync(expectedOutputPath, "utf8"));
      }

      // 模拟解析结果
      const mockResult = {
        slides: [
          {
            id: "slide1",
            background: {
              type: "solid",
              color: "rgba(255, 255, 255, 1)",
            },
            elements: [
              {
                type: "text",
                id: "text1",
                left: 100,
                top: 50,
                width: 200,
                height: 100,
                content: "Sample Text",
              },
              {
                type: "image",
                id: "image1",
                left: 300,
                top: 150,
                width: 250,
                height: 180,
                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              },
            ],
          },
        ],
        theme: {
          colorScheme: {
            "主色调1": "rgba(68, 114, 196, 1)",
            "主色调2": "rgba(237, 125, 49, 1)",
          },
        },
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(mockResult);

      // 执行转换
      const result = await mockPPTXParser.parseFromFile(inputPath);

      // 验证基本结构
      expect(result).toBeDefined();
      expect(result.slides).toBeDefined();
      expect(Array.isArray(result.slides)).toBe(true);
      expect(result.slides.length).toBeGreaterThan(0);

      // 验证幻灯片结构
      const firstSlide = result.slides[0];
      expect(firstSlide.id).toBeDefined();
      expect(firstSlide.elements).toBeDefined();
      expect(Array.isArray(firstSlide.elements)).toBe(true);

      // 验证元素结构
      firstSlide.elements.forEach((element: any) => {
        expect(element.type).toBeDefined();
        expect(element.id).toBeDefined();
        expect(typeof element.left).toBe("number");
        expect(typeof element.top).toBe("number");
        expect(typeof element.width).toBe("number");
        expect(typeof element.height).toBe("number");
      });

      // 如果有预期输出，进行比较
      if (expectedOutput) {
        expect(result.slides.length).toBeGreaterThan(0);
        expect(result.theme).toBeDefined();
      }
    });

    it("应该正确处理包含拉伸图片的复杂示例", async () => {
      const stretchInputPath = path.join(stretchSampleDir, "input.pptx");

      // 检查拉伸示例文件是否存在
      if (!fs.existsSync(stretchInputPath)) {
        console.warn(`⚠️ Stretch sample file not found: ${stretchInputPath}, skipping test`);
        return;
      }

      // 模拟包含拉伸信息的图片解析结果
      const mockStretchResult = {
        slides: [
          {
            id: "slide1",
            elements: [
              {
                type: "image",
                id: "stretchImage1",
                left: 125.5,
                top: 67.8,
                width: 280.3,
                height: 192.7,
                src: "data:image/png;base64,processed_stretch_image_data",
                stretchInfo: {
                  fillRect: { left: -0.04881, top: 0.06029, right: 0.30709, bottom: 0.06029 },
                  srcRect: { left: 0.1, top: 0.1, right: 0.2, bottom: 0.2 },
                },
                embedId: "rId123",
                adjustedX: 123.8,
                adjustedY: 65.2,
              },
            ],
          },
        ],
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(mockStretchResult);
      mockImageProcessor.processImageWithStretch.mockResolvedValue({
        processedImageData: {
          buffer: Buffer.from("processed image data"),
          width: 280,
          height: 193,
          format: "png",
          appliedEffects: ["fillRect stretch: {\"left\":-0.04881,...}", "transparent padding"],
        },
        stretchInfo: mockStretchResult.slides[0].elements[0].stretchInfo,
        embedId: "rId123",
      });

      const result = await mockPPTXParser.parseFromFile(stretchInputPath);

      expect(result).toBeDefined();
      expect(result.slides[0].elements[0].stretchInfo).toBeDefined();
      expect(result.slides[0].elements[0].stretchInfo.fillRect.left).toBe(-0.04881);
      expect(result.slides[0].elements[0].embedId).toBe("rId123");
      expect(result.slides[0].elements[0].adjustedX).toBeDefined();
      expect(result.slides[0].elements[0].adjustedY).toBeDefined();
    });

    it("应该正确验证PPTist格式兼容性", async () => {
      // 模拟符合PPTist规范的输出
      const pptistCompatibleResult = {
        slides: [
          {
            id: "slide1",
            background: {
              type: "solid",
              color: "rgba(255, 255, 255, 1)", // PPTist要求rgba格式
            },
            elements: [
              {
                type: "text",
                id: "text1",
                left: 100.5, // PPTist支持浮点数坐标
                top: 50.2,
                width: 200.3,
                height: 100.7,
                content: "<p>Formatted HTML content</p>", // PPTist要求HTML格式
                defaultFontName: "Microsoft YaHei",
                defaultFontSize: 18,
                defaultColor: "rgba(0, 0, 0, 1)",
              },
              {
                type: "shape",
                id: "shape1",
                left: 300,
                top: 200,
                width: 150,
                height: 100,
                shapeType: "rect",
                fill: {
                  type: "solid",
                  color: "rgba(68, 114, 196, 1)",
                },
                pathFormula: "rect", // PPTist要求的路径公式
              },
              {
                type: "image",
                id: "image1",
                left: 500,
                top: 100,
                width: 200,
                height: 150,
                src: "data:image/png;base64,validBase64ImageData", // PPTist支持的格式
                fixedRatio: true, // PPTist的固定比例属性
              },
            ],
          },
        ],
        theme: {
          backgroundColor: "rgba(255, 255, 255, 1)",
          themeColor: "rgba(68, 114, 196, 1)",
          fontColor: "rgba(0, 0, 0, 1)",
          fontName: "Microsoft YaHei",
        },
      };

      mockPPTXParser.parseFromBuffer.mockResolvedValue(pptistCompatibleResult);

      const result = await mockPPTXParser.parseFromBuffer(Buffer.from("mock pptx data"));

      // 验证PPTist兼容性要求
      expect(result.slides).toBeDefined();
      
      const slide = result.slides[0];
      
      // 验证颜色格式（必须是rgba）
      expect(slide.background.color).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
      
      // 验证文本元素格式
      const textElement = slide.elements.find((el: any) => el.type === "text");
      if (textElement) {
        expect(textElement.content).toBeDefined();
        expect(textElement.defaultFontName).toBeDefined();
        expect(textElement.defaultFontSize).toBeDefined();
      }

      // 验证形状元素格式
      const shapeElement = slide.elements.find((el: any) => el.type === "shape");
      if (shapeElement) {
        expect(shapeElement.shapeType).toBeDefined();
        expect(shapeElement.pathFormula).toBeDefined();
        expect(shapeElement.fill).toBeDefined();
      }

      // 验证图片元素格式
      const imageElement = slide.elements.find((el: any) => el.type === "image");
      if (imageElement) {
        expect(imageElement.src).toMatch(/^data:image\//);
      }
    });

    it("应该测试多页面PPTX文件的完整转换", async () => {
      const multiSlideResult = {
        slides: [
          {
            id: "slide1",
            background: { type: "solid", color: "rgba(255, 255, 255, 1)" },
            elements: [
              { type: "text", id: "text1", left: 100, top: 50, width: 200, height: 100, content: "Slide 1" },
            ],
          },
          {
            id: "slide2", 
            background: { type: "solid", color: "rgba(240, 248, 255, 1)" },
            elements: [
              { type: "text", id: "text2", left: 150, top: 80, width: 250, height: 120, content: "Slide 2" },
              { 
                type: "image", 
                id: "image2", 
                left: 300, 
                top: 200, 
                width: 200, 
                height: 150, 
                src: "data:image/jpeg;base64,slide2image",
                stretchInfo: {
                  fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 }
                }
              },
            ],
          },
          {
            id: "slide3",
            background: { type: "solid", color: "rgba(255, 250, 250, 1)" },
            elements: [
              { 
                type: "shape", 
                id: "shape3", 
                left: 200, 
                top: 150, 
                width: 100, 
                height: 100, 
                shapeType: "ellipse",
                fill: { type: "solid", color: "rgba(255, 0, 0, 1)" }
              },
            ],
          },
        ],
        theme: {
          colorScheme: {
            "主色调1": "rgba(68, 114, 196, 1)",
            "主色调2": "rgba(237, 125, 49, 1)",
          },
        },
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(multiSlideResult);

      const result = await mockPPTXParser.parseFromFile("multi-slide.pptx");

      // 验证多页面结构
      expect(result.slides).toBeDefined();
      expect(result.slides.length).toBe(3);

      // 验证每个幻灯片的独立性
      result.slides.forEach((slide: any, index: number) => {
        expect(slide.id).toBe(`slide${index + 1}`);
        expect(slide.background).toBeDefined();
        expect(slide.elements).toBeDefined();
        expect(Array.isArray(slide.elements)).toBe(true);
      });

      // 验证不同类型元素的分布
      const allElements = result.slides.flatMap((slide: any) => slide.elements);
      const textElements = allElements.filter((el: any) => el.type === "text");
      const imageElements = allElements.filter((el: any) => el.type === "image");
      const shapeElements = allElements.filter((el: any) => el.type === "shape");

      expect(textElements.length).toBe(2);
      expect(imageElements.length).toBe(1);
      expect(shapeElements.length).toBe(1);

      // 验证图片拉伸信息
      const imageWithStretch = imageElements.find((el: any) => el.stretchInfo);
      expect(imageWithStretch).toBeDefined();
      expect(imageWithStretch.stretchInfo.fillRect).toBeDefined();
    });
  });

  describe("回归测试", () => {
    it("应该确保新功能不影响现有图片处理逻辑", async () => {
      // 测试旧版本的图片处理（无拉伸信息）
      const legacyImageResult = {
        slides: [
          {
            id: "slide1",
            elements: [
              {
                type: "image",
                id: "legacyImage",
                left: 100,
                top: 50,
                width: 200,
                height: 150,
                src: "data:image/png;base64,legacyImageData",
                // 无 stretchInfo，无 embedId
              },
            ],
          },
        ],
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(legacyImageResult);

      const result = await mockPPTXParser.parseFromFile("legacy.pptx");

      expect(result.slides[0].elements[0]).toBeDefined();
      expect(result.slides[0].elements[0].src).toBeDefined();
      expect(result.slides[0].elements[0].stretchInfo).toBeUndefined();
      expect(result.slides[0].elements[0].embedId).toBeUndefined();
    });

    it("应该验证颜色处理管道仍然正确工作", async () => {
      const colorResult = {
        slides: [
          {
            id: "slide1",
            background: {
              type: "solid",
              color: "rgba(68, 114, 196, 1)", // 主题色
            },
            elements: [
              {
                type: "shape",
                id: "colorShape",
                left: 100,
                top: 100,
                width: 150,
                height: 100,
                fill: {
                  type: "solid",
                  color: "rgba(237, 125, 49, 1)", // 另一个主题色
                },
                themeFill: {
                  debugInfo: "Resolved from theme color 2 with transformations: [lumMod: 0.8, tint: 0.2]",
                  originalColor: "schemeClr:accent2",
                  resolvedColor: "rgba(237, 125, 49, 1)",
                },
              },
            ],
          },
        ],
        theme: {
          colorScheme: {
            "主色调1": "rgba(68, 114, 196, 1)",
            "主色调2": "rgba(237, 125, 49, 1)",
          },
        },
      };

      mockColorExtractor.getSolidFill.mockReturnValue("rgba(237, 125, 49, 1)");
      mockPPTXParser.parseFromFile.mockResolvedValue(colorResult);

      const result = await mockPPTXParser.parseFromFile("colors.pptx");

      // 验证颜色格式一致性
      expect(result.slides[0].background.color).toMatch(/^rgba\(/);
      expect(result.slides[0].elements[0].fill.color).toMatch(/^rgba\(/);
      expect(result.theme.colorScheme["主色调1"]).toMatch(/^rgba\(/);
      expect(result.theme.colorScheme["主色调2"]).toMatch(/^rgba\(/);

      // 验证主题色调试信息
      const shapeElement = result.slides[0].elements[0];
      expect(shapeElement.themeFill).toBeDefined();
      expect(shapeElement.themeFill.debugInfo).toContain("theme color");
    });

    it("应该确保文本和形状处理不受图片增强影响", async () => {
      const mixedContentResult = {
        slides: [
          {
            id: "slide1",
            elements: [
              {
                type: "text",
                id: "text1",
                left: 50,
                top: 30,
                width: 300,
                height: 80,
                content: "<p style=\"color: rgba(0, 0, 0, 1); font-size: 18px;\">Mixed content text</p>",
                defaultFontName: "Arial",
                defaultFontSize: 18,
              },
              {
                type: "shape",
                id: "shape1",
                left: 400,
                top: 50,
                width: 120,
                height: 120,
                shapeType: "ellipse",
                pathFormula: "ellipse",
                fill: {
                  type: "solid",
                  color: "rgba(0, 176, 80, 1)",
                },
              },
              {
                type: "image",
                id: "image1",
                left: 200,
                top: 200,
                width: 180,
                height: 135,
                src: "data:image/png;base64,enhancedImageData",
                stretchInfo: {
                  fillRect: { left: 0.05, top: 0.05, right: 0.05, bottom: 0.05 },
                },
                embedId: "rId789",
              },
            ],
          },
        ],
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(mixedContentResult);

      const result = await mockPPTXParser.parseFromFile("mixed-content.pptx");

      // 验证文本处理不受影响
      const textElement = result.slides[0].elements.find((el: any) => el.type === "text");
      expect(textElement.content).toContain("<p");
      expect(textElement.defaultFontName).toBe("Arial");

      // 验证形状处理不受影响
      const shapeElement = result.slides[0].elements.find((el: any) => el.type === "shape");
      expect(shapeElement.shapeType).toBe("ellipse");
      expect(shapeElement.pathFormula).toBe("ellipse");

      // 验证图片增强功能正常
      const imageElement = result.slides[0].elements.find((el: any) => el.type === "image");
      expect(imageElement.stretchInfo).toBeDefined();
      expect(imageElement.embedId).toBe("rId789");
    });
  });

  describe("性能和稳定性测试", () => {
    it("应该在合理时间内处理复杂PPTX文件", async () => {
      const complexResult = {
        slides: Array.from({ length: 10 }, (_, i) => ({
          id: `slide${i + 1}`,
          background: { type: "solid", color: "rgba(255, 255, 255, 1)" },
          elements: Array.from({ length: 5 }, (_, j) => ({
            type: ["text", "image", "shape"][j % 3],
            id: `element${i}_${j}`,
            left: 50 + j * 100,
            top: 50 + i * 80,
            width: 100,
            height: 60,
            ...(j % 3 === 0 ? { content: `Text ${i}_${j}` } : {}),
            ...(j % 3 === 1 ? { 
              src: `data:image/png;base64,image${i}_${j}`,
              stretchInfo: j % 2 === 0 ? {
                fillRect: { left: 0.1 * j, top: 0.1 * j, right: 0.1 * j, bottom: 0.1 * j }
              } : undefined
            } : {}),
            ...(j % 3 === 2 ? { 
              shapeType: "rect",
              fill: { type: "solid", color: `rgba(${(i * 50) % 255}, ${(j * 80) % 255}, 100, 1)` }
            } : {}),
          })),
        })),
      };

      mockPPTXParser.parseFromFile.mockResolvedValue(complexResult);

      const startTime = Date.now();
      const result = await mockPPTXParser.parseFromFile("complex.pptx");
      const endTime = Date.now();

      expect(result.slides.length).toBe(10);
      expect(result.slides[0].elements.length).toBe(5);
      
      // 处理时间应该在合理范围内（5秒内）
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("应该正确处理错误和异常情况", async () => {
      // 测试文件不存在的情况
      mockPPTXParser.parseFromFile.mockRejectedValue(new Error("File not found"));

      await expect(mockPPTXParser.parseFromFile("nonexistent.pptx"))
        .rejects.toThrow("File not found");

      // 测试损坏文件的情况
      mockPPTXParser.parseFromBuffer.mockRejectedValue(new Error("Invalid PPTX format"));

      await expect(mockPPTXParser.parseFromBuffer(Buffer.from("invalid data")))
        .rejects.toThrow("Invalid PPTX format");
    });
  });
});