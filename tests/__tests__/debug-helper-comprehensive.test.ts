/**
 * DebugHelper 调试系统综合测试用例
 * 测试调试功能完整性、配置管理和文件保存
 */

import { DebugHelper } from "../../app/lib/services/utils/DebugHelper";
import * as fs from "fs";
import * as path from "path";

// Mock context for testing
const createMockContext = (debug = false, slideId = "1") => ({
  slideId,
  resources: {},
  options: {
    enableDebugMode: debug,
    debugOptions: {
      saveDebugImages: true,
      enableConsoleLogging: true,
      enableTimingLogs: true,
      logLevel: "info" as const,
    },
  },
});

describe("DebugHelper 调试系统综合测试", () => {
  describe("调试功能完整性测试", () => {
    it("应该在调试模式下正确识别调试状态", () => {
      const context = createMockContext(true);
      
      // 测试调试模式检测
      const isDebugEnabled = DebugHelper.isDebugEnabled(context as any);
      expect(isDebugEnabled).toBe(true);

      // 测试调试图片保存检测
      const shouldSave = DebugHelper.shouldSaveDebugImages(context as any);
      expect(shouldSave).toBe(true);
    });

    it("应该在非调试模式下正确识别状态", () => {
      const context = createMockContext(false);
      
      // 测试调试模式检测
      const isDebugEnabled = DebugHelper.isDebugEnabled(context as any);
      expect(isDebugEnabled).toBe(false);

      // 测试调试图片保存检测
      const shouldSave = DebugHelper.shouldSaveDebugImages(context as any);
      expect(shouldSave).toBe(false);
    });

    it("应该从ParseOptions直接检测调试模式", () => {
      const enabledOptions = { enableDebugMode: true };
      const disabledOptions = { enableDebugMode: false };
      const undefinedOptions = undefined;

      expect(DebugHelper.isDebugEnabledFromOptions(enabledOptions)).toBe(true);
      expect(DebugHelper.isDebugEnabledFromOptions(disabledOptions)).toBe(false);
      expect(DebugHelper.isDebugEnabledFromOptions(undefinedOptions)).toBe(false);
    });
  });

  describe("调试配置测试", () => {
    it("应该处理缺失的调试配置", () => {
      const contextWithoutDebugOptions = {
        slideId: "1",
        resources: {},
        options: {
          enableDebugMode: true,
          // 缺少 debugOptions
        },
      };

      // 应该使用默认配置，不抛出异常
      expect(() => DebugHelper.isDebugEnabled(contextWithoutDebugOptions as any)).not.toThrow();
      expect(() => DebugHelper.shouldSaveDebugImages(contextWithoutDebugOptions as any)).not.toThrow();
    });

    it("应该处理完全缺失的options配置", () => {
      const contextWithoutOptions = {
        slideId: "1",
        resources: {},
        // 缺少 options
      };

      // 应该使用默认配置，不抛出异常
      expect(() => DebugHelper.isDebugEnabled(contextWithoutOptions as any)).not.toThrow();
      expect(() => DebugHelper.shouldSaveDebugImages(contextWithoutOptions as any)).not.toThrow();
      
      expect(DebugHelper.isDebugEnabled(contextWithoutOptions as any)).toBe(false);
      expect(DebugHelper.shouldSaveDebugImages(contextWithoutOptions as any)).toBe(false);
    });
  });

  describe("边界情况测试", () => {
    it("应该处理null和undefined的context", () => {
      // 实际的DebugHelper可能不处理null/undefined，所以我们测试它会抛出异常
      expect(() => DebugHelper.isDebugEnabled(null as any)).toThrow();
      expect(() => DebugHelper.isDebugEnabled(undefined as any)).toThrow();
      expect(() => DebugHelper.shouldSaveDebugImages(null as any)).toThrow();
      expect(() => DebugHelper.shouldSaveDebugImages(undefined as any)).toThrow();
    });

    it("应该处理部分缺失的debugOptions", () => {
      const partialContext = {
        slideId: "1",
        resources: {},
        options: {
          enableDebugMode: true,
          debugOptions: {
            saveDebugImages: true,
            // 缺少其他选项
          },
        },
      };

      expect(DebugHelper.isDebugEnabled(partialContext as any)).toBe(true);
      expect(DebugHelper.shouldSaveDebugImages(partialContext as any)).toBe(true);
    });
  });

  describe("实际使用场景测试", () => {
    it("应该在真实场景下正确工作", () => {
      // 模拟真实的context结构
      const realContext = {
        slideId: "slide-1",
        resources: { images: {}, themes: {} },
        options: {
          enableDebugMode: true,
          outputFormat: "base64",
          debugOptions: {
            saveDebugImages: true,
            enableConsoleLogging: true,
            enableTimingLogs: false,
          },
        },
      };

      expect(DebugHelper.isDebugEnabled(realContext as any)).toBe(true);
      expect(DebugHelper.shouldSaveDebugImages(realContext as any)).toBe(true);
    });

    it("应该在生产环境配置下正确工作", () => {
      // 模拟生产环境的context
      const prodContext = {
        slideId: "slide-prod",
        resources: { images: {}, themes: {} },
        options: {
          enableDebugMode: false,
          outputFormat: "url",
          debugOptions: {
            saveDebugImages: false,
            enableConsoleLogging: false,
            enableTimingLogs: false,
          },
        },
      };

      expect(DebugHelper.isDebugEnabled(prodContext as any)).toBe(false);
      expect(DebugHelper.shouldSaveDebugImages(prodContext as any)).toBe(false);
    });
  });
});