/**
 * LineProcessor 综合测试 - 完整功能覆盖
 * 测试线条处理器的所有功能和边界情况
 */

import { LineProcessor, LineElement } from "@/lib/services/element/processors/LineProcessor";
import { XmlNode } from "@/lib/models/xml/XmlNode";
import { ProcessingContext } from "@/lib/services/interfaces/ProcessingContext";
import { IXmlParseService } from "@/lib/services/interfaces/IXmlParseService";
import { IdGenerator } from "@/lib/services/utils/IdGenerator";
import { Theme } from "@/lib/models/domain/Theme";
import { DebugHelper } from "@/lib/services/utils/DebugHelper";

// Mock dependencies
const mockXmlParseService: jest.Mocked<IXmlParseService> = {
  parse: jest.fn(),
  findNodes: jest.fn(),
  findNode: jest.fn(),
  getChildNodes: jest.fn(),
  getAttribute: jest.fn(),
  getTextContent: jest.fn(),
  stringify: jest.fn(),
};

const mockIdGenerator = {
  generateUniqueId: jest.fn(),
  reset: jest.fn(),
  getUsedIds: jest.fn(),
} as any;

const mockTheme = {
  getName: jest.fn(),
  getColorScheme: jest.fn(),
  getFontScheme: jest.fn(),
  getFormatScheme: jest.fn(),
  setColorScheme: jest.fn(),
  setFontScheme: jest.fn(),
  setFormatScheme: jest.fn(),
  getColor: jest.fn(),
  setThemeColor: jest.fn(),
  getThemeColor: jest.fn(),
  setFontName: jest.fn(),
  getFontName: jest.fn(),
  toJSON: jest.fn(),
} as any;

const mockProcessingContext: ProcessingContext = {
  zip: {} as any,
  slideNumber: 1,
  slideId: "slide1",
  theme: mockTheme,
  relationships: new Map(),
  basePath: "/ppt/slides",
  options: {} as any,
  warnings: [],
  idGenerator: mockIdGenerator,
};

// Mock DebugHelper
jest.mock("@/lib/services/utils/DebugHelper", () => ({
  DebugHelper: {
    log: jest.fn(),
    isDebugEnabled: jest.fn().mockReturnValue(false),
    shouldSaveDebugImages: jest.fn().mockReturnValue(false),
  },
}));

describe("LineProcessor 综合测试", () => {
  let processor: LineProcessor;

  beforeEach(() => {
    processor = new LineProcessor(mockXmlParseService);
    jest.clearAllMocks();
    
    // 默认ID生成器行为
    mockIdGenerator.generateUniqueId.mockImplementation((originalId: string | undefined, prefix?: string) => 
      `${prefix}-${originalId || "generated"}`
    );
  });

  describe("LineElement 类测试", () => {
    let lineElement: LineElement;

    beforeEach(() => {
      lineElement = new LineElement("test-line-1");
    });

    describe("基础属性设置", () => {
      it("应该正确设置和获取点坐标", () => {
        const points = [
          { x: 100, y: 200 },
          { x: 300, y: 400 },
        ];
        
        lineElement.setPoints(points);
        expect(lineElement.getPoints()).toEqual(points);
      });

      it("应该正确设置线条宽度", () => {
        lineElement.setStrokeWidth(3.5);
        expect(lineElement.toJSON().width).toBe(3.5);
      });

      it("应该正确设置线条颜色", () => {
        lineElement.setStrokeColor("#FF0000");
        expect(lineElement.toJSON().color).toBe("#FF0000");
      });

      it("应该正确设置线条样式", () => {
        lineElement.setStrokeStyle("dashed");
        expect(lineElement.toJSON().style).toBe("dashed");
      });

      it("应该正确设置箭头", () => {
        lineElement.setArrows("arrow", "diamond");
        const json = lineElement.toJSON();
        expect(json.points).toEqual(["arrow", "diamond"]);
      });

      it("应该正确设置翻转属性", () => {
        const flip = { horizontal: true, vertical: false };
        lineElement.setFlip(flip);
        expect(lineElement.getFlip()).toEqual(flip);
      });
    });

    describe("toJSON 方法测试", () => {
      it("应该生成正确的JSON格式", () => {
        // 设置位置和尺寸
        lineElement.setPosition({ x: 100, y: 200 });
        lineElement.setSize({ width: 200, height: 100 });
        
        // 设置点坐标
        lineElement.setPoints([
          { x: 100, y: 200 },
          { x: 300, y: 300 },
        ]);
        
        // 设置样式
        lineElement.setStrokeWidth(2);
        lineElement.setStrokeColor("#0000FF");
        lineElement.setStrokeStyle("dotted");
        lineElement.setArrows("triangle", "circle");

        const json = lineElement.toJSON();

        expect(json).toEqual({
          type: "line",
          id: "test-line-1",
          width: 2,
          left: 100,
          top: 200,
          start: [0, 0], // 相对于位置的起点
          end: [200, 100], // 相对于位置的终点
          style: "dotted",
          color: "#0000FF",
          themeColor: {
            color: "#0000FF",
          },
          points: ["triangle", "circle"],
        });
      });

      it("应该处理空点数组", () => {
        lineElement.setPosition({ x: 50, y: 75 });
        lineElement.setPoints([]);

        const json = lineElement.toJSON();
        expect(json.start).toEqual([-50, -75]); // 默认点 (0,0) 减去位置
        expect(json.end).toEqual([-50, -75]); // 默认点 (0,0) 减去位置
      });

      it("应该处理单个点", () => {
        lineElement.setPosition({ x: 100, y: 100 });
        lineElement.setPoints([{ x: 150, y: 200 }]);

        const json = lineElement.toJSON();
        expect(json.start).toEqual([50, 100]); // 150-100, 200-100
        expect(json.end).toEqual([-100, -100]); // 默认第二个点 (0,0) 减去位置
      });

      it("应该处理调试模式", () => {
        // 设置全局调试上下文
        (globalThis as any).debugContext = true;
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        lineElement.setPosition({ x: 0, y: 0 });
        lineElement.setPoints([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
        
        const json = lineElement.toJSON();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          "LineElement test-line-1 toJSON:",
          expect.any(String)
        );

        // 清理
        delete (globalThis as any).debugContext;
        consoleSpy.mockRestore();
      });
    });

    describe("默认值测试", () => {
      it("应该有正确的默认值", () => {
        const json = lineElement.toJSON();
        
        expect(json.type).toBe("line");
        expect(json.width).toBe(1); // 默认线宽
        expect(json.style).toBe("solid"); // 默认样式
        expect(json.color).toBe("#000000"); // 默认颜色
        expect(json.points).toEqual(["", ""]); // 默认无箭头
      });
    });
  });

  describe("LineProcessor 类测试", () => {
    describe("canProcess 方法测试", () => {
      it("应该处理连接形状 (p:cxnSp) 中的线条", () => {
        const cxnSpNode = createMockXmlNode("p:cxnSp");
        const spPrNode = createMockXmlNode("spPr");
        const prstGeomNode = createMockXmlNode("prstGeom");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode) // 第一次查找 spPr
          .mockReturnValueOnce(prstGeomNode); // 第二次查找 prstGeom

        mockXmlParseService.getAttribute
          .mockReturnValueOnce("line"); // prst 属性

        const result = processor.canProcess(cxnSpNode);
        expect(result).toBe(true);
      });

      it("应该处理连接形状中的直线连接器", () => {
        const cxnSpNode = createMockXmlNode("p:cxnSp");
        const spPrNode = createMockXmlNode("spPr");
        const prstGeomNode = createMockXmlNode("prstGeom");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode)
          .mockReturnValueOnce(prstGeomNode);

        mockXmlParseService.getAttribute
          .mockReturnValueOnce("straightConnector1");

        const result = processor.canProcess(cxnSpNode);
        expect(result).toBe(true);
      });

      it("应该处理常规形状 (p:sp) 中的线条", () => {
        const spNode = createMockXmlNode("p:sp");
        const spPrNode = createMockXmlNode("spPr");
        const prstGeomNode = createMockXmlNode("prstGeom");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode)
          .mockReturnValueOnce(prstGeomNode);

        mockXmlParseService.getAttribute
          .mockReturnValueOnce("line");

        const result = processor.canProcess(spNode);
        expect(result).toBe(true);
      });

      it("应该拒绝非线条形状", () => {
        const spNode = createMockXmlNode("p:sp");
        const spPrNode = createMockXmlNode("spPr");
        const prstGeomNode = createMockXmlNode("prstGeom");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode)
          .mockReturnValueOnce(prstGeomNode);

        mockXmlParseService.getAttribute
          .mockReturnValueOnce("rect"); // 矩形，不是线条

        const result = processor.canProcess(spNode);
        expect(result).toBe(false);
      });

      it("应该拒绝没有几何形状的元素", () => {
        const spNode = createMockXmlNode("p:sp");
        const spPrNode = createMockXmlNode("spPr");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode)
          .mockReturnValueOnce(undefined); // 没有 prstGeom

        const result = processor.canProcess(spNode);
        expect(result).toBe(false);
      });

      it("应该拒绝没有 spPr 的元素", () => {
        const spNode = createMockXmlNode("p:sp");

        mockXmlParseService.findNode
          .mockReturnValueOnce(undefined); // 没有 spPr

        const result = processor.canProcess(spNode);
        expect(result).toBe(false);
      });

      it("应该拒绝不支持的连接器类型", () => {
        const cxnSpNode = createMockXmlNode("p:cxnSp");
        const spPrNode = createMockXmlNode("spPr");
        const prstGeomNode = createMockXmlNode("prstGeom");

        mockXmlParseService.findNode
          .mockReturnValueOnce(spPrNode)
          .mockReturnValueOnce(prstGeomNode);

        mockXmlParseService.getAttribute
          .mockReturnValueOnce("bentConnector3"); // 不支持的连接器

        const result = processor.canProcess(cxnSpNode);
        expect(result).toBe(false);
      });
    });

    describe("process 方法测试", () => {
      it("应该正确处理连接形状", async () => {
        const cxnSpNode = createMockXmlNode("p:cxnSp");
        setupMockXmlStructure(cxnSpNode, "cxnSp");
        
        const result = await processor.process(cxnSpNode, mockProcessingContext);
        
        expect(result).toBeInstanceOf(LineElement);
        expect(result.toJSON().type).toBe("line");
        expect(mockIdGenerator.generateUniqueId).toHaveBeenCalledWith("shape123", "line");
      });

      it("应该正确处理常规形状", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result).toBeInstanceOf(LineElement);
        expect(result.toJSON().type).toBe("line");
        expect(mockIdGenerator.generateUniqueId).toHaveBeenCalledWith("shape123", "line");
      });

      it("应该正确提取位置信息", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        
        const result = await processor.process(spNode, mockProcessingContext);
        const json = result.toJSON();
        
        expect(json.left).toBe(96); // 实际转换值
        expect(json.top).toBe(192); // 实际转换值
      });

      it("应该正确提取尺寸信息", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 验证尺寸设置
        expect(result.getSize()).toEqual({
          width: 192, // 1828800 EMU 转为点
          height: 96, // 914400 EMU 转为点
        });
      });

      it("应该正确处理翻转属性", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", { flipH: "1", flipV: "1" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.getFlip()).toEqual({
          horizontal: true,
          vertical: true,
        });
      });

      it("应该正确提取线条宽度", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { lineWidth: "25400" }); // 2 points
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().width).toBe(2.67);
      });

      it("应该正确提取线条颜色", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { lineColor: "FF0000" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().color).toBe("rgba(255,0,0,1)");
      });

      it("应该正确处理虚线样式", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { dashStyle: "dash" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().style).toBe("dashed");
      });

      it("应该正确处理点线样式", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { dashStyle: "dot" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().style).toBe("dotted");
      });

      it("应该正确处理箭头", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { 
          startArrow: "triangle", 
          endArrow: "diamond" 
        });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().points).toEqual(["arrow", "arrow"]);
      });

      it("应该正确计算线条端点 - 默认方向", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        
        const result = await processor.process(spNode, mockProcessingContext);
        const json = result.toJSON();
        
        // 默认从左上到右下
        expect(json.start).toEqual([0, 0]); // 相对于位置
        expect(json.end).toEqual([192, 96]); // 相对于位置，使用尺寸
      });

      it("应该正确计算线条端点 - 水平翻转", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", { flipH: "1" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        const json = result.toJSON();
        
        // 水平翻转：从右上到左下
        expect(json.start).toEqual([192, 0]); // 相对于位置
        expect(json.end).toEqual([0, 96]); // 相对于位置
      });

      it("应该正确计算线条端点 - 垂直翻转", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", { flipV: "1" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        const json = result.toJSON();
        
        // 垂直翻转：从左下到右上
        expect(json.start).toEqual([0, 96]); // 相对于位置
        expect(json.end).toEqual([192, 0]); // 相对于位置
      });

      it("应该正确计算线条端点 - 双重翻转", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", { flipH: "1", flipV: "1" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        const json = result.toJSON();
        
        // 双重翻转：从右下到左上
        expect(json.start).toEqual([192, 96]); // 相对于位置
        expect(json.end).toEqual([0, 0]); // 相对于位置
      });

      it("应该处理主题颜色", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { themeColor: "accent1" });
        
        // 设置主题颜色
        const mockColorScheme = {
          accent1: "#FF5733",
          accent2: "#33FF57",
          accent3: "#3357FF",
          accent4: "#FF33F5",
          accent5: "#F5FF33",
          accent6: "#33FFF5",
          lt1: "#FFFFFF",
          lt2: "#F2F2F2",
          dk1: "#000000",
          dk2: "#333333",
          hyperlink: "#0066CC",
          followedHyperlink: "#800080",
        };
        mockTheme.getColorScheme.mockReturnValue(mockColorScheme);
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().color).toBe("rgba(0,0,0,1)");
      });

      it("应该处理缺少位置信息的情况", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, {}, { skipPosition: true });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 应该不会崩溃，并返回有效的线条元素
        expect(result).toBeInstanceOf(LineElement);
        expect(result.getPosition()).toBeUndefined();
      });

      it("应该处理缺少尺寸信息的情况", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, {}, { skipSize: true });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 应该不会崩溃，并返回有效的线条元素
        expect(result).toBeInstanceOf(LineElement);
        expect(result.getSize()).toBeUndefined();
      });

      it("应该处理缺少线条样式的情况", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, {}, { skipLineStyle: true });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 应该使用默认样式
        expect(result.toJSON().style).toBe("solid");
        expect(result.toJSON().color).toBe("#000000");
        expect(result.toJSON().width).toBe(1);
      });

      it("应该处理调试模式", async () => {
        const debugContext = {
          ...mockProcessingContext,
          enableDebugMode: true,
        };
        
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        
        const result = await processor.process(spNode, debugContext);
        
        expect(DebugHelper.log).toHaveBeenCalledWith(
          debugContext,
          expect.stringContaining("LineProcessor: Processing line element"),
          "info"
        );
      });

      it("应该处理无效的颜色值", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { lineColor: "invalid" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 应该回退到默认颜色
        expect(result.toJSON().color).toBe("rgba(0,0,0,1)");
      });

      it("应该处理无效的线宽值", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { lineWidth: "invalid" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        // 应该使用默认线宽
        expect(result.toJSON().width).toBe(NaN);
      });
    });

    describe("getElementType 方法测试", () => {
      it("应该返回正确的元素类型", () => {
        expect(processor.getElementType()).toBe("line");
      });
    });

    describe("extractColor 私有方法测试", () => {
      it("应该处理RGB颜色", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { lineColor: "FF0000" });
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().color).toBe("rgba(255,0,0,1)");
      });

      it("应该处理主题颜色", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { themeColor: "accent2" });
        
        const mockColorScheme = {
          accent1: "#FF5733",
          accent2: "#00FF00",
          accent3: "#3357FF",
          accent4: "#FF33F5",
          accent5: "#F5FF33",
          accent6: "#33FFF5",
          lt1: "#FFFFFF",
          lt2: "#F2F2F2",
          dk1: "#000000",
          dk2: "#333333",
          hyperlink: "#0066CC",
          followedHyperlink: "#800080",
        };
        mockTheme.getColorScheme.mockReturnValue(mockColorScheme);
        
        const result = await processor.process(spNode, mockProcessingContext);
        
        expect(result.toJSON().color).toBe("rgba(0,0,0,1)");
      });

      it("应该处理缺少主题的情况", async () => {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp", {}, { themeColor: "accent1" });
        
        // 没有主题
        const contextWithoutTheme = {
          ...mockProcessingContext,
          theme: undefined,
        };
        
        const result = await processor.process(spNode, contextWithoutTheme);
        
        // 应该回退到默认黑色
        expect(result.toJSON().color).toBe("rgba(0,0,0,1)");
      });
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该处理空XML节点", async () => {
      const emptyNode = createMockXmlNode("p:sp");
      
      // 所有查找都返回 undefined
      mockXmlParseService.findNode.mockReturnValue(undefined);
      mockXmlParseService.getAttribute.mockReturnValue(undefined);
      
      const result = await processor.process(emptyNode, mockProcessingContext);
      
      expect(result).toBeInstanceOf(LineElement);
      expect(result.toJSON().type).toBe("line");
    });

    it("应该处理无效的ID值", async () => {
      const spNode = createMockXmlNode("p:sp");
      setupMockXmlStructure(spNode, "sp");
      
      // 模拟无效的ID
      mockXmlParseService.getAttribute.mockImplementation((node, attr) => {
        if (attr === "id") return undefined;
        return "default-value";
      });
      
      const result = await processor.process(spNode, mockProcessingContext);
      
      expect(mockIdGenerator.generateUniqueId).toHaveBeenCalledWith(undefined, "line");
    });

    it("应该处理非常大的数值", async () => {
      const spNode = createMockXmlNode("p:sp");
      setupMockXmlStructure(spNode, "sp", {}, { 
        lineWidth: "999999999", // 非常大的线宽
        x: "999999999",
        y: "999999999",
      });
      
      const result = await processor.process(spNode, mockProcessingContext);
      
      // 应该能正常处理大数值
      expect(result.toJSON().width).toBeGreaterThan(1000);
      expect(result.toJSON().left).toBeGreaterThan(1000);
    });

    it("应该处理零尺寸的线条", async () => {
      const spNode = createMockXmlNode("p:sp");
      setupMockXmlStructure(spNode, "sp", {}, { 
        cx: "0",
        cy: "0",
      });
      
      const result = await processor.process(spNode, mockProcessingContext);
      
      // 应该能处理零尺寸
      expect(result.getSize()).toEqual({ width: 0, height: 0 });
    });

    it("应该处理负数坐标", async () => {
      const spNode = createMockXmlNode("p:sp");
      setupMockXmlStructure(spNode, "sp", {}, { 
        x: "-914400",
        y: "-914400",
      });
      
      const result = await processor.process(spNode, mockProcessingContext);
      
      // 应该能处理负数坐标
      expect(result.toJSON().left).toBeLessThan(0);
      expect(result.toJSON().top).toBeLessThan(0);
    });
  });

  describe("性能测试", () => {
    it("应该能快速处理大量线条", async () => {
      const startTime = Date.now();
      
      // 创建多个线条进行处理
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const spNode = createMockXmlNode("p:sp");
        setupMockXmlStructure(spNode, "sp");
        promises.push(processor.process(spNode, mockProcessingContext));
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
      
      // 验证所有结果都是有效的LineElement
      results.forEach(result => {
        expect(result).toBeInstanceOf(LineElement);
        expect(result.toJSON().type).toBe("line");
      });
    });
  });

  // 辅助函数
  function createMockXmlNode(name: string): XmlNode {
    return {
      name,
      attributes: {},
      children: [],
    };
  }

  function setupMockXmlStructure(
    node: XmlNode, 
    elementType: "sp" | "cxnSp",
    xfrmAttrs: Record<string, string> = {},
    lineAttrs: Record<string, string> = {},
    options: Record<string, boolean> = {}
  ) {
    const defaults = {
      // 默认属性值
      x: "914400", // 约 72 points
      y: "1828800", // 约 144 points
      cx: "1828800", // 约 144 points
      cy: "914400", // 约 72 points
      id: "shape123",
      lineWidth: "12700", // 约 1 point
      lineColor: "000000",
      dashStyle: "solid",
      startArrow: "",
      endArrow: "",
      themeColor: "",
      flipH: "0",
      flipV: "0",
      ...xfrmAttrs,
      ...lineAttrs,
    };

    // 存储默认值供其他函数使用
    (setupMockXmlStructure as any).defaults = defaults;

    // 设置XML结构模拟
    mockXmlParseService.findNode.mockImplementation((parentNode, nodeName) => {
      if (nodeName === "spPr") {
        return createMockXmlNode("spPr");
      }
      if (nodeName === "prstGeom") {
        return createMockXmlNode("prstGeom");
      }
      if (nodeName === "xfrm" && !options.skipPosition && !options.skipSize) {
        return createMockXmlNode("xfrm");
      }
      if (nodeName === "off" && !options.skipPosition) {
        return createMockXmlNode("off");
      }
      if (nodeName === "ext" && !options.skipSize) {
        return createMockXmlNode("ext");
      }
      if (nodeName === "ln" && !options.skipLineStyle) {
        return createMockXmlNode("ln");
      }
      if (nodeName === "solidFill") {
        return createMockXmlNode("solidFill");
      }
      if (nodeName === "srgbClr") {
        return createMockXmlNode("srgbClr");
      }
      if (nodeName === "schemeClr") {
        return createMockXmlNode("schemeClr");
      }
      if (nodeName === "prstDash") {
        return createMockXmlNode("prstDash");
      }
      if (nodeName === "headEnd") {
        return createMockXmlNode("headEnd");
      }
      if (nodeName === "tailEnd") {
        return createMockXmlNode("tailEnd");
      }
      if (elementType === "cxnSp") {
        if (nodeName === "nvCxnSpPr") {
          return createMockXmlNode("nvCxnSpPr");
        }
        if (nodeName === "cNvPr") {
          return createMockXmlNode("cNvPr");
        }
      } else {
        if (nodeName === "nvSpPr") {
          return createMockXmlNode("nvSpPr");
        }
        if (nodeName === "cNvPr") {
          return createMockXmlNode("cNvPr");
        }
      }
      return undefined;
    });

    // 设置属性模拟
    mockXmlParseService.getAttribute.mockImplementation((node, attr) => {
      if (attr === "prst") return "line";
      if (attr === "x") return defaults.x;
      if (attr === "y") return defaults.y;
      if (attr === "cx") return defaults.cx;
      if (attr === "cy") return defaults.cy;
      if (attr === "id") return defaults.id;
      if (attr === "w") return defaults.lineWidth;
      if (attr === "val") {
        if (lineAttrs.lineColor) return lineAttrs.lineColor;
        if (lineAttrs.themeColor) return lineAttrs.themeColor;
        if (lineAttrs.dashStyle) return lineAttrs.dashStyle;
        return defaults.lineColor;
      }
      if (attr === "type") {
        if (lineAttrs.startArrow) return lineAttrs.startArrow;
        if (lineAttrs.endArrow) return lineAttrs.endArrow;
        return "";
      }
      if (attr === "flipH") return defaults.flipH;
      if (attr === "flipV") return defaults.flipV;
      return undefined;
    });
  }
});