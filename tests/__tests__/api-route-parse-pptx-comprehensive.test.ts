/**
 * API路由综合测试 - /api/parse-pptx/route.ts
 * 专注于大文件处理、并发请求处理和边界情况测试
 */

import { NextRequest, NextResponse } from "next/server";
import { POST } from "../../app/api/parse-pptx/route";
import { pptxParser } from "@/lib/parser/InternalPPTXParser";
import { createCdnStorageService } from "@/lib/services/cdn";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      status: options?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
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

describe("API Route Comprehensive Tests - /api/parse-pptx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  // Helper function to create mock files with proper structure
  const createMockFile = (name: string, sizeInBytes: number = 1024): File => {
    // Ensure file name ends with .pptx
    const fileName = name.endsWith('.pptx') ? name : `${name}.pptx`;
    
    // Create a proper File object that works with FormData
    const content = "x".repeat(Math.min(sizeInBytes, 1024)); // Simulate content
    const mockFile = new File([content], fileName, {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    
    // Override size and arrayBuffer method to simulate large files
    Object.defineProperty(mockFile, 'size', {
      value: sizeInBytes,
      writable: false,
    });
    Object.defineProperty(mockFile, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(sizeInBytes)),
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

  describe("大文件处理测试", () => {
    it("应该处理大文件（10MB）的上传", async () => {
      const mockResult = {
        slides: Array(20).fill(null).map((_, index) => ({
          id: `slide-${index + 1}`,
          background: { type: "solid", color: "#ffffff" },
          elements: [],
        })),
      };

      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const largeFile = createMockFile("large-presentation.pptx", 10 * 1024 * 1024); // 10MB
      const formData = createFormData(largeFile);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.debug.fileSize).toBe(10 * 1024 * 1024);
    });

    it("应该处理内存不足错误", async () => {
      (pptxParser.parseToJSON as jest.Mock).mockRejectedValue(
        new Error("ENOMEM: not enough memory")
      );

      const largeFile = createMockFile("huge-presentation.pptx", 50 * 1024 * 1024); // 50MB
      const formData = createFormData(largeFile);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toContain("not enough memory");
    });
  });

  describe("并发请求处理测试", () => {
    it("应该正确处理多个并发请求", async () => {
      const mockResults = [
        { slides: [{ id: "slide-1", elements: [] }] },
        { slides: [{ id: "slide-2", elements: [] }] },
        { slides: [{ id: "slide-3", elements: [] }] },
      ];

      let callCount = 0;
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        const result = mockResults[callCount % mockResults.length];
        callCount++;
        return Promise.resolve(result);
      });

      // 创建多个并发请求
      const requests = await Promise.all([
        POST(createMockRequest(createFormData(createMockFile("file1.pptx")))),
        POST(createMockRequest(createFormData(createMockFile("file2.pptx")))),
        POST(createMockRequest(createFormData(createMockFile("file3.pptx")))),
      ]);

      // 验证所有请求都成功
      requests.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 验证解析器被调用了正确的次数
      expect(pptxParser.parseToJSON).toHaveBeenCalledTimes(3);
    });

    it("应该处理并发请求中的部分失败", async () => {
      let callCount = 0;
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("Parse error"));
        }
        return Promise.resolve({ slides: [] });
      });

      const requests = await Promise.all([
        POST(createMockRequest(createFormData(createMockFile("file1.pptx")))),
        POST(createMockRequest(createFormData(createMockFile("file2.pptx")))),
        POST(createMockRequest(createFormData(createMockFile("file3.pptx")))),
      ]);

      // 验证第一个和第三个请求成功
      expect(requests[0].status).toBe(200);
      expect(requests[2].status).toBe(200);

      // 验证第二个请求失败
      expect(requests[1].status).toBe(500);
    });
  });

  describe("CDN存储并发测试", () => {
    it("应该处理并发CDN上传", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      let uploadCount = 0;
      const mockCdnService = {
        isAvailable: jest.fn().mockReturnValue(true),
        uploadJSON: jest.fn().mockImplementation(async () => {
          uploadCount++;
          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            url: `https://cdn.example.com/file-${uploadCount}.json`,
            id: `cdn-${uploadCount}`,
            size: 1024,
            contentType: "application/json",
            metadata: {},
          };
        }),
        getPrimaryProvider: jest.fn().mockReturnValue({ name: "test-cdn" }),
      };

      (createCdnStorageService as jest.Mock).mockReturnValue(mockCdnService);

      // 创建并发CDN上传请求
      const formDataWithCdn = (filename: string) => 
        createFormData(createMockFile(filename), { useCdn: "true" });

      const requests = await Promise.all([
        POST(createMockRequest(formDataWithCdn("file1.pptx"))),
        POST(createMockRequest(formDataWithCdn("file2.pptx"))),
        POST(createMockRequest(formDataWithCdn("file3.pptx"))),
      ]);

      // 验证所有请求都成功
      requests.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 验证CDN上传被调用了正确的次数
      expect(mockCdnService.uploadJSON).toHaveBeenCalledTimes(3);
    });
  });

  describe("边界情况和性能测试", () => {
    it("应该处理空文件", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const emptyFile = createMockFile("empty.pptx", 0);
      const formData = createFormData(emptyFile);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.debug.fileSize).toBe(0);
    });

    it("应该处理非常长的文件名", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const longName = "a".repeat(250) + ".pptx";
      const file = createMockFile(longName);
      const formData = createFormData(file);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.filename).toBe(longName);
    });

    it("应该处理解析超时", async () => {
      (pptxParser.parseToJSON as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Parsing timeout after 30 seconds"));
          }, 50); // Use shorter timeout for test
        });
      });

      const file = createMockFile("timeout-test.pptx");
      const formData = createFormData(file);
      const request = createMockRequest(formData);

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to parse PPTX file");
      expect(responseData.details).toContain("timeout");
    });
  });

  describe("特殊URL处理测试", () => {
    beforeEach(() => {
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue({ slides: [] });
    });

    it("应该处理Vercel Blob URL", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://abc123.public.blob.vercel-storage.com/presentations/sample.pptx",
      });

      const request = createMockRequest(formData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.filename).toBe("sample.pptx");
    });

    it("应该处理带查询参数的URL", async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
        headers: new Map(),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const formData = createFormData(undefined, {
        cdnUrl: "https://storage.googleapis.com/bucket/presentation.pptx?token=abc&expires=123",
      });

      const request = createMockRequest(formData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.filename).toBe("presentation.pptx");
    });
  });

  describe("调试和日志测试", () => {
    it("应该在调试模式下提供详细信息", async () => {
      const mockResult = { slides: [] };
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue(mockResult);

      const file = createMockFile("debug-test.pptx");
      const formData = createFormData(file, {
        enableDebugMode: "true",
        debugOptions: JSON.stringify({
          saveDebugImages: true,
          logProcessingDetails: true,
        }),
      });

      const request = createMockRequest(formData);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.debug.debugMode).toBe(true);
      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          enableDebugMode: true,
          debugOptions: {
            saveDebugImages: true,
            logProcessingDetails: true,
          },
        })
      );
    });
  });

  describe("背景格式测试", () => {
    beforeEach(() => {
      (pptxParser.parseToJSON as jest.Mock).mockResolvedValue({ slides: [] });
    });

    it("应该正确传递legacy背景格式", async () => {
      const file = createMockFile("legacy-test.pptx");
      const formData = createFormData(file, {
        backgroundFormat: "legacy",
      });

      const request = createMockRequest(formData);
      await POST(request);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          backgroundFormat: "legacy",
        })
      );
    });

    it("应该正确传递pptist背景格式", async () => {
      const file = createMockFile("pptist-test.pptx");
      const formData = createFormData(file, {
        backgroundFormat: "pptist",
      });

      const request = createMockRequest(formData);
      await POST(request);

      expect(pptxParser.parseToJSON).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          backgroundFormat: "pptist",
        })
      );
    });
  });
});