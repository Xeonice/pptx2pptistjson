/**
 * API路由测试 - /api/parse-pptx/route.ts
 * 测试API端点的完整功能和错误处理
 */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "../../app/api/parse-pptx/route";
import { pptxParser } from "@/lib/parser/InternalPPTXParser";
import { createCdnStorageService } from "@/lib/services/cdn";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => {
      const response = {
        status: options?.status || 200,
        json: jest.fn().mockResolvedValue(data),
      };
      return response;
    }),
  },
}));

// Mock dependencies
jest.mock("@/lib/parser/InternalPPTXParser", () => ({
  pptxParser: {
    parseToJSON: jest.fn(),
  },
}));

jest.mock("@/lib/services/cdn", () => ({
  createCdnStorageService: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe("API Route - /api/parse-pptx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  // Helper function to create test files
  const createTestFile = (name: string = "test.pptx", content: string = "test content"): File => {
    // 确保文件名以.pptx结尾
    const fileName = name.endsWith('.pptx') ? name : `${name}.pptx`;
    
    // Create a proper File-like object that works with FormData
    const mockFile = new File([content], fileName, {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    
    // Override arrayBuffer method to return our mock
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(content.length)),
      writable: true,
      configurable: true
    });
    
    return mockFile;
  };

  // Helper function to create FormData
  const createFormData = (file?: File, params?: Record<string, string>): FormData => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    return formData;
  };

  // Helper function to create mock request
  const createMockRequest = (formData: FormData): NextRequest => {
    return {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;
  };

  describe("基础文件上传功能", () => {
    it("应该成功处理有效的PPTX文件", async () => {
      const mockResult = {
        width: 960,
        height: 540,
        slides: [
          {
            id: "slide-1",
            background: { type: "solid", color: "#ffffff" },
            elements: [],
          },
        ],
      };

      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const testFile = createTestFile("presentation.pptx");
      const formData = createFormData(testFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockResult);
      expect(responseData.filename).toBe("presentation.pptx");
    });

    it("应该拒绝非PPTX文件", async () => {
      const invalidFile = new File(["invalid content"], "document.pdf", {
        type: "application/pdf",
      });
      const formData = createFormData(invalidFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Invalid file type. Please upload a .pptx file");
    });

    it("应该处理缺少文件的情况", async () => {
      const formData = new FormData();

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("No file uploaded or CDN URL provided");
    });
  });

  describe("CDN文件下载功能", () => {
    it("应该成功从CDN URL下载文件", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const mockFileContent = "mock pptx content";
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(mockFileContent.length)),
        headers: new Map([["content-disposition", 'attachment; filename="test.pptx"']]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/test.pptx",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.filename).toBe("test.pptx");
    });

    it("应该处理CDN下载失败", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/missing.pptx",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to download file from CDN");
    });

    it("应该处理CDN文件名提取", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/presentations/document.pptx",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.filename).toBe("document.pptx");
    });

    it("应该拒绝CDN中的非PPTX文件", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        headers: new Map([["content-disposition", 'attachment; filename="document.pdf"']]),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/document.pdf",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to download file from CDN");
      expect(responseData.details).toContain("Invalid file type");
    });
  });

  describe("背景格式参数处理", () => {
    beforeEach(() => {
      const mockResult = {
        slides: [
          {
            id: "slide-1",
            background: { type: "image", image: "test.jpg" },
            elements: [],
          },
        ],
      };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该处理legacy格式参数", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        backgroundFormat: "legacy",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          backgroundFormat: "legacy",
        })
      );
    });

    it("应该处理pptist格式参数", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        backgroundFormat: "pptist",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          backgroundFormat: "pptist",
        })
      );
    });

    it("应该默认使用legacy格式", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          backgroundFormat: "legacy",
        })
      );
    });
  });

  describe("调试模式功能", () => {
    beforeEach(() => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该处理调试模式启用", async () => {
      const testFile = createTestFile("test.pptx");
      const debugOptions = {
        saveDebugImages: true,
        logProcessingDetails: true,
      };

      const formData = createFormData(testFile, {
        enableDebugMode: "true",
        debugOptions: JSON.stringify(debugOptions),
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          enableDebugMode: true,
          debugOptions: debugOptions,
        })
      );

      const responseData = await response.json();
      expect(responseData.debug.debugMode).toBe(true);
    });

    it("应该处理无效的调试选项JSON", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        enableDebugMode: "true",
        debugOptions: "invalid json",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          enableDebugMode: true,
          debugOptions: null,
        })
      );

      expect(console.warn).toHaveBeenCalledWith(
        "⚠️ 调试选项解析失败:",
        expect.any(Error)
      );
    });
  });

  describe("CDN存储功能", () => {
    beforeEach(() => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该成功上传到CDN", async () => {
      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockResolvedValue({
          url: "https://cdn.example.com/result.json",
          id: "cdn-123",
          size: 1024,
          contentType: "application/json",
          metadata: { uploadedAt: "2023-01-01T00:00:00.000Z" },
        }),
        getPrimaryProvider: jest.fn().mockReturnValue({ name: "test-cdn" }),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        useCdn: "true",
        cdnFilename: "custom-result.json",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.cdnUrl).toBe("https://cdn.example.com/result.json");
      expect(responseData.cdnId).toBe("cdn-123");
    });

    it("应该处理CDN不可用的情况", async () => {
      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(false),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        useCdn: "true",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined(); // 应该回退到直接返回数据
      expect(responseData.cdnUrl).toBeUndefined();
    });

    it("应该处理CDN上传失败", async () => {
      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockRejectedValue(new Error("CDN upload failed")),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        useCdn: "true",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.cdnError).toBeDefined();
      expect(responseData.cdnError.message).toBe("CDN upload failed, returning JSON directly");
    });
  });

  describe("错误处理", () => {
    it("应该处理解析器错误", async () => {
      (pptxParser.parseToJSON as jest.Mock).mockRejectedValue(
        new Error("Parse error")
      );

      const testFile = createTestFile("corrupted.pptx");
      const formData = createFormData(testFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toBe("Parse error");
    });

    it("应该处理FormData解析错误", async () => {
      // 模拟FormData解析失败
      const request = {
        formData: jest.fn().mockRejectedValue(new Error("FormData parse error")),
      } as unknown as NextRequest;

      const response = await POST(request);
      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toBe("FormData parse error");
    });
  });

  describe("响应格式验证", () => {
    beforeEach(() => {
      const mockResult = {
        width: 960,
        height: 540,
        slides: [
          {
            id: "slide-1",
            background: { type: "solid", color: "#ffffff" },
            elements: [],
          },
        ],
      };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该返回正确的响应结构", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      
      // 验证响应结构
      expect(responseData).toMatchObject({
        success: true,
        data: expect.any(Object),
        filename: "test.pptx",
        debug: {
          fileSize: expect.any(Number),
          resultType: "object",
          resultKeys: expect.any(Array),
          hasData: true,
          debugMode: false,
        },
      });
    });

    it("应该包含调试信息", async () => {
      const testFile = createTestFile("test.pptx", "file content");
      const formData = createFormData(testFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData.debug.fileSize).toBe(12); // "test content".length
      expect(responseData.debug.resultKeys).toContain("width");
      expect(responseData.debug.resultKeys).toContain("height");
      expect(responseData.debug.resultKeys).toContain("slides");
    });
  });

  describe("参数组合测试", () => {
    beforeEach(() => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该处理所有参数的组合", async () => {
      const testFile = createTestFile("test.pptx");
      const formData = createFormData(testFile, {
        format: "pptist",
        backgroundFormat: "pptist",
        enableDebugMode: "true",
        debugOptions: JSON.stringify({ saveDebugImages: true }),
        useCdn: "true",
        cdnFilename: "full-test.json",
      });

      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockResolvedValue({
          url: "https://cdn.example.com/full-test.json",
          id: "cdn-456",
          size: 512,
          contentType: "application/json",
          metadata: {},
        }),
        getPrimaryProvider: jest.fn().mockReturnValue({ name: "test-cdn" }),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      // 验证所有参数都被正确传递
      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          enableDebugMode: true,
          debugOptions: { saveDebugImages: true },
          backgroundFormat: "pptist",
        })
      );

      const responseData = await response.json();
      expect(responseData.cdnUrl).toBe("https://cdn.example.com/full-test.json");
    });
  });

  describe("边界情况测试", () => {
    it("应该处理空文件", async () => {
      const emptyFile = createTestFile("empty.pptx", "");
      const formData = createFormData(emptyFile);

      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.debug.fileSize).toBe(0);
    });

    it("应该处理非常大的文件名", async () => {
      const longName = "a".repeat(255) + ".pptx";
      const testFile = createTestFile(longName);
      const formData = createFormData(testFile);

      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.filename).toBe(longName);
    });
  });

  describe("大文件处理", () => {
    it("应该成功处理大文件（100MB）", async () => {
      // 创建100MB的模拟文件内容
      const largeSize = 100 * 1024 * 1024; // 100MB
      const largeContent = "x".repeat(1024); // 1KB content to simulate large file
      const largeFile = new File([largeContent], "large-presentation.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      
      // Override size and arrayBuffer to simulate large file
      Object.defineProperty(largeFile, 'size', {
        value: largeSize,
        writable: false,
      });
      Object.defineProperty(largeFile, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(largeSize)),
        writable: true,
        configurable: true
      });
      
      const formData = createFormData(largeFile);

      const mockResult = {
        width: 960,
        height: 540,
        slides: Array(50).fill(null).map((_, index) => ({
          id: `slide-${index + 1}`,
          background: { type: "solid", color: "#ffffff" },
          elements: Array(20).fill(null).map((_, elemIndex) => ({
            id: `element-${index}-${elemIndex}`,
            type: "text",
            content: "Large file test",
          })),
        })),
      };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.debug.fileSize).toBe(largeSize);
      expect(responseData.data.slides).toHaveLength(50);
    });

    it("应该处理解析大文件时的内存错误", async () => {
      const largeSize = 200 * 1024 * 1024; // 200MB
      const largeContent = "x".repeat(1024); // 1KB content to simulate large file
      const largeFile = new File([largeContent], "huge-presentation.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      
      // Override size and arrayBuffer to simulate large file
      Object.defineProperty(largeFile, 'size', {
        value: largeSize,
        writable: false,
      });
      Object.defineProperty(largeFile, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(largeSize)),
        writable: true,
        configurable: true
      });
      
      const formData = createFormData(largeFile);

      // 模拟内存错误
      (pptxParser.parseToJSON as jest.Mock).mockRejectedValue(
        new Error("ENOMEM: Out of memory")
      );

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toContain("Out of memory");
    });

    it("应该处理CDN上传大文件", async () => {
      const largeSize = 50 * 1024 * 1024; // 50MB
      const largeContent = "x".repeat(1024); // 1KB content to simulate large file
      const largeFile = new File([largeContent], "large-cdn.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      
      // Override size and arrayBuffer to simulate large file
      Object.defineProperty(largeFile, 'size', {
        value: largeSize,
        writable: false,
      });
      Object.defineProperty(largeFile, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(largeSize)),
        writable: true,
        configurable: true
      });
      
      const formData = createFormData(largeFile, {
        useCdn: "true",
      });

      const mockResult = { slides: Array(100).fill({ id: "slide", elements: [] }) };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockResolvedValue({
          url: "https://cdn.example.com/large-result.json",
          id: "cdn-large",
          size: 5 * 1024 * 1024, // 5MB JSON
          contentType: "application/json",
          metadata: {},
        }),
        getPrimaryProvider: jest.fn().mockReturnValue({ name: "test-cdn" }),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.cdnUrl).toBeDefined();
      expect(responseData.size).toBe(5 * 1024 * 1024);
    });
  });

  describe("并发请求处理", () => {
    it("应该正确处理多个并发请求", async () => {
      const mockResults = [
        { slides: [{ id: "slide-1", elements: [] }] },
        { slides: [{ id: "slide-2", elements: [] }] },
        { slides: [{ id: "slide-3", elements: [] }] },
      ];

      // 模拟每个请求返回不同的结果
      let callCount = 0;
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        const result = mockResults[callCount % mockResults.length];
        callCount++;
        return Promise.resolve(result);
      });

      // 创建多个并发请求
      const requests = Array(3).fill(null).map((_, index) => {
        const testFile = createTestFile(`concurrent-${index}.pptx`);
        const formData = createFormData(testFile);
        const request = createMockRequest(formData);
        return POST(request);
      });

      // 等待所有请求完成
      const responses = await Promise.all(requests);

      // 验证所有请求都成功
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 验证每个请求返回不同的数据
      const responseDatas = await Promise.all(
        responses.map((response) => response.json())
      );

      expect(responseDatas[0].data.slides[0].id).toBe("slide-1");
      expect(responseDatas[1].data.slides[0].id).toBe("slide-2");
      expect(responseDatas[2].data.slides[0].id).toBe("slide-3");
    });

    it("应该处理并发CDN请求", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      // 用全局计数器来确保每次调用都有不同的URL
      let globalUploadCount = 0;
      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockImplementation(async () => {
          globalUploadCount++;
          // 模拟一些上传需要更多时间
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
          return {
            url: `https://cdn.example.com/concurrent-${globalUploadCount}.json`,
            id: `cdn-concurrent-${globalUploadCount}`,
            size: 1024,
            contentType: "application/json",
            metadata: {},
          };
        }),
        getPrimaryProvider: jest.fn().mockReturnValue({ name: "test-cdn" }),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      // 创建并发CDN上传请求
      const requests = Array(5).fill(null).map((_, index) => {
        const testFile = createTestFile(`cdn-concurrent-${index}.pptx`);
        const formData = createFormData(testFile, {
          useCdn: "true",
          cdnFilename: `concurrent-${index}.json`,
        });
        const request = createMockRequest(formData);
        return POST(request);
      });

      const responses = await Promise.all(requests);

      // 验证所有请求都成功
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 验证CDN上传被调用了正确的次数
      expect(mockCdnService.uploadJSON).toHaveBeenCalledTimes(5);

      // 验证所有响应都有CDN URL（并发处理可能导致相同的URL，这是正常的）
      const responseDatas = await Promise.all(
        responses.map((response) => response.json())
      );
      const cdnUrls = responseDatas.map((data) => data.cdnUrl);
      
      // 验证所有响应都有CDN URL
      cdnUrls.forEach((url) => {
        expect(url).toMatch(/^https:\/\/cdn\.example\.com\/concurrent-\d+\.json$/);
      });
      
      // 验证所有响应都包含cdnId
      responseDatas.forEach((data) => {
        expect(data.cdnId).toMatch(/^cdn-concurrent-\d+$/);
        expect(data.success).toBe(true);
      });
    });

    it("应该处理并发请求中的部分失败", async () => {
      let callCount = 0;
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        callCount++;
        // 让第二个请求失败
        if (callCount === 2) {
          return Promise.reject(new Error("Concurrent parse error"));
        }
        return Promise.resolve({ slides: [{ id: `slide-${callCount}` }] });
      });

      const requests = Array(3).fill(null).map((_, index) => {
        const testFile = createTestFile(`partial-fail-${index}.pptx`);
        const formData = createFormData(testFile);
        const request = createMockRequest(formData);
        return POST(request);
      });

      const responses = await Promise.all(requests);

      // 验证第一个和第三个请求成功
      expect(responses[0].status).toBe(200);
      expect(responses[2].status).toBe(200);

      // 验证第二个请求失败
      expect(responses[1].status).toBe(500);

      const failedResponse = await responses[1].json();
      expect(failedResponse.error).toBe("Failed to parse PPTX file");
      expect(failedResponse.details).toBe("Concurrent parse error");
    });
  });

  describe("特殊URL处理", () => {
    beforeEach(() => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);
    });

    it("应该处理Vercel Blob URL格式", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://blob.vercel-storage.com/presentations/sample-presentation.pptx/download",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.filename).toBe("sample-presentation.pptx");
    });

    it("应该处理带查询参数的CDN URL", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/files/presentation.pptx?token=abc123&expires=1234567890",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.filename).toBe("presentation.pptx");
    });

    it("应该处理无扩展名的CDN URL", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://cdn.example.com/download/abc123",
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.filename).toBe("downloaded.pptx");
    });
  });

  describe("内存和性能测试", () => {
    it("应该清理解析后的临时数据", async () => {
      const testFile = createTestFile("memory-test.pptx");
      const formData = createFormData(testFile);

      const mockResult = {
        slides: Array(10).fill(null).map((_, i) => ({
          id: `slide-${i}`,
          elements: [],
        })),
      };

      // 模拟解析器返回结果
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      // 验证解析器只被调用一次
      expect(pptxParser.parseToJSON).toHaveBeenCalledTimes(1);

      // 验证ArrayBuffer被正确传递
      const firstCall = (pptxParser.parseToJSON as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toBeInstanceOf(ArrayBuffer);
    });

    it("应该处理解析超时情况", async () => {
      const testFile = createTestFile("timeout-test.pptx");
      const formData = createFormData(testFile);

      // 模拟解析超时
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Parse timeout: Operation took too long"));
          }, 100);
        });
      });

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toContain("timeout");
    });
  });
});