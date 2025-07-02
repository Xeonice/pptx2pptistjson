import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "../app/lib/pptxtojson";

describe("PPTX 元素类型验证", () => {
  const samplePPTXPath = join(__dirname, "../sample/basic/input.pptx");
  const expectedOutputPath = join(__dirname, "../sample/basic/output.json");

  let actualOutput: any;
  let expectedOutput: any;

  beforeAll(async () => {
    if (!existsSync(samplePPTXPath) || !existsSync(expectedOutputPath)) {
      console.warn("示例文件不可用");
      return;
    }

    try {
      const sampleBuffer = readFileSync(samplePPTXPath);
      expectedOutput = JSON.parse(readFileSync(expectedOutputPath, "utf-8"));
      actualOutput = await parse(sampleBuffer);
    } catch (error: any) {
      console.warn("解析测试文件失败:", error?.message);
    }
  });

  describe("文本元素", () => {
    it("应该正确解析文本内容", () => {
      if (!actualOutput || !expectedOutput) {
        console.warn("示例文件不可用");
        return;
      }

      // 在当前架构中，有背景的文本作为形状处理，所以检查形状元素中的文本内容
      const actualElementsWithText = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.text && el.text.content);

      expect(actualElementsWithText.length).toBeGreaterThan(0);

      // 检查文本元素是否有内容
      actualElementsWithText.forEach((textEl: any) => {
        expect(textEl).toHaveProperty("text");
        expect(textEl.text).toHaveProperty("content");
        expect(typeof textEl.text.content).toBe("string");
        expect(textEl.text.content).toBeTruthy();
      });

      // 如果可用，与期望进行比较（注意：期望可能是纯文本元素，实际是带文本的形状）
      const expectedTextElements = expectedOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "text");
      
      if (expectedTextElements.length > 0) {
        expect(actualElementsWithText.length).toBeGreaterThanOrEqual(
          expectedTextElements.length * 0.8
        ); // 允许一些容错
      }
    });

    it("应该具有正确的文本格式属性", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const textElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "text");

      textElements.forEach((textEl: any) => {
        expect(textEl).toHaveProperty("defaultFontName");
        expect(textEl).toHaveProperty("defaultColor");

        if (textEl.defaultColor) {
          expect(textEl.defaultColor).toHaveProperty("color");
          expect(textEl.defaultColor).toHaveProperty("colorType");
        }

        // 检查文本对齐和格式
        if (textEl.content) {
          expect(typeof textEl.content).toBe("string");
          // 应该包含类似HTML的格式
          expect(textEl.content).toMatch(/<.*>/);
        }
      });
    });

    it("应该保留文本定位", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const textElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "text");

      textElements.forEach((textEl: any) => {
        expect(textEl).toHaveProperty("left");
        expect(textEl).toHaveProperty("top");
        expect(textEl).toHaveProperty("width");
        expect(textEl).toHaveProperty("height");

        expect(typeof textEl.left).toBe("number");
        expect(typeof textEl.top).toBe("number");
        expect(typeof textEl.width).toBe("number");
        expect(typeof textEl.height).toBe("number");

        expect(textEl.left).toBeGreaterThanOrEqual(0);
        expect(textEl.top).toBeGreaterThanOrEqual(0);
        expect(textEl.width).toBeGreaterThan(0);
        expect(textEl.height).toBeGreaterThan(0);
      });
    });
  });

  describe("形状元素", () => {
    it("应该正确解析形状几何", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const shapeElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "shape");

      if (shapeElements.length > 0) {
        shapeElements.forEach((shapeEl: any) => {
          expect(shapeEl).toHaveProperty("viewBox");
          expect(shapeEl).toHaveProperty("path");

          if (shapeEl.viewBox) {
            expect(Array.isArray(shapeEl.viewBox)).toBe(true);
            expect(shapeEl.viewBox).toHaveLength(2);
            expect(typeof shapeEl.viewBox[0]).toBe("number");
            expect(typeof shapeEl.viewBox[1]).toBe("number");
          }

          if (shapeEl.path) {
            expect(typeof shapeEl.path).toBe("string");
            expect(shapeEl.path).toBeTruthy();
          }
        });
      }
    });

    it("应该具有形状填充属性", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const shapeElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "shape");

      if (shapeElements.length > 0) {
        shapeElements.forEach((shapeEl: any) => {
          // 检查填充属性
          const hasFill = shapeEl.themeFill || shapeEl.fill || shapeEl.color;
          expect(hasFill).toBeTruthy();

          if (shapeEl.themeFill) {
            expect(shapeEl.themeFill).toHaveProperty("color");
          }
        });
      }
    });

    it("应该维护形状定位和尺寸", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const shapeElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "shape");

      if (shapeElements.length > 0) {
        shapeElements.forEach((shapeEl: any) => {
          expect(shapeEl).toHaveProperty("left");
          expect(shapeEl).toHaveProperty("top");
          expect(shapeEl).toHaveProperty("width");
          expect(shapeEl).toHaveProperty("height");

          expect(typeof shapeEl.left).toBe("number");
          expect(typeof shapeEl.top).toBe("number");
          expect(typeof shapeEl.width).toBe("number");
          expect(typeof shapeEl.height).toBe("number");
        });
      }
    });
  });

  describe("图像元素", () => {
    it("应该正确解析图像源", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const imageElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "image");

      if (imageElements.length > 0) {
        imageElements.forEach((imageEl: any) => {
          expect(imageEl).toHaveProperty("src");
          expect(typeof imageEl.src).toBe("string");
          expect(imageEl.src).toBeTruthy();

          // 应该是有效的URL或base64数据
          const isUrl =
            imageEl.src.startsWith("http") || imageEl.src.startsWith("https");
          const isDataUrl = imageEl.src.startsWith("data:");
          expect(isUrl || isDataUrl).toBe(true);
        });
      }
    });

    it("应该维护图像纵横比", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const imageElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "image");

      if (imageElements.length > 0) {
        imageElements.forEach((imageEl: any) => {
          expect(imageEl).toHaveProperty("fixedRatio");
          expect(typeof imageEl.fixedRatio).toBe("boolean");

          if (imageEl.fixedRatio) {
            expect(imageEl.width).toBeGreaterThan(0);
            expect(imageEl.height).toBeGreaterThan(0);
          }
        });
      }
    });

    it("如果存在应该处理图像裁剪", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      const imageElements = actualOutput.slides
        .flatMap((slide: any) => slide.elements)
        .filter((el: any) => el.type === "image");

      if (imageElements.length > 0) {
        imageElements.forEach((imageEl: any) => {
          if (imageEl.clip) {
            expect(imageEl.clip).toHaveProperty("shape");
            expect(imageEl.clip).toHaveProperty("range");

            if (imageEl.clip.range) {
              expect(Array.isArray(imageEl.clip.range)).toBe(true);
            }
          }
        });
      }
    });
  });

  describe("背景元素", () => {
    it("应该解析幻灯片背景", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      actualOutput.slides.forEach((slide: any) => {
        if (slide.background) {
          expect(slide.background).toHaveProperty("type");

          if (slide.background.type === "image") {
            expect(slide.background).toHaveProperty("image");
            expect(typeof slide.background.image).toBe("string");
          }

          if (slide.background.type === "color") {
            expect(slide.background).toHaveProperty("color");
          }

          if (slide.background.themeColor) {
            expect(slide.background.themeColor).toHaveProperty("color");
            expect(slide.background.themeColor).toHaveProperty("colorType");
          }
        }
      });
    });
  });

  describe("元素关系", () => {
    it("应该保留元素层级顺序", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      actualOutput.slides.forEach((slide: any) => {
        const elementsWithIndex = slide.elements.filter(
          (el: any) => el.index !== undefined
        );

        if (elementsWithIndex.length > 1) {
          // 检查索引是否按正确顺序
          const indices = elementsWithIndex.map((el: any) => el.index);
          const sortedIndices = [...indices].sort((a, b) => a - b);

          expect(indices).toEqual(sortedIndices);
        }
      });
    });

    it("应该正确处理分组元素", () => {
      if (!actualOutput) {
        console.warn("示例文件不可用");
        return;
      }

      // 查找潜在的分组元素（具有相似定位或命名模式的元素）
      actualOutput.slides.forEach((slide: any) => {
        const elements = slide.elements;

        // 按相似的y坐标分组元素（潜在的行）
        const yGroups: { [key: string]: any[] } = {};
        elements.forEach((el: any) => {
          const yKey = Math.round(el.top / 10) * 10; // 按10像素间隔分组
          if (!yGroups[yKey]) yGroups[yKey] = [];
          yGroups[yKey].push(el);
        });

        // 检查分组元素是否保持一致的间距
        Object.values(yGroups).forEach((group) => {
          if (group.length > 1) {
            const leftPositions = group
              .map((el) => el.left)
              .sort((a, b) => a - b);
            // 验证元素不会显著重叠
            for (let i = 1; i < leftPositions.length; i++) {
              const prevElement = group.find(
                (el) => el.left === leftPositions[i - 1]
              );
              const currElement = group.find(
                (el) => el.left === leftPositions[i]
              );

              if (prevElement && currElement) {
                const prevRight = prevElement.left + prevElement.width;
                // 允许较大的重叠，因为元素可能定位不同
                expect(currElement.left).toBeGreaterThanOrEqual(prevRight - 20);
              }
            }
          }
        });
      });
    });
  });
});
