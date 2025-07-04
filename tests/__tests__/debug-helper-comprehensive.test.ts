/**
 * DebugHelper 综合测试套件
 * 测试调试配置管理、日志记录、性能计时和调试功能开关
 */

import { DebugHelper } from '../../app/lib/services/utils/DebugHelper';
import { ParseOptions } from '../../app/lib/models/dto/ParseOptions';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';

describe('DebugHelper - Comprehensive Test Suite', () => {
  let mockContext: ProcessingContext;
  let mockOptions: ParseOptions;
  
  // Mock console to capture log output
  let consoleSpy: jest.SpyInstance;
  let loggedMessages: string[];

  beforeEach(() => {
    // Reset mock context and options
    mockContext = {
      options: {
        enableDebugMode: false,
        debugOptions: {}
      }
    } as ProcessingContext;

    mockOptions = {
      enableDebugMode: false,
      debugOptions: {}
    };

    // Mock console.log to capture output
    loggedMessages = [];
    consoleSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
      loggedMessages.push(args.join(' '));
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Debug Mode Detection', () => {
    describe('isDebugEnabled', () => {
      it('should return false when debug mode is disabled', () => {
        expect(DebugHelper.isDebugEnabled(mockContext)).toBe(false);
      });

      it('should return true when debug mode is enabled', () => {
        mockContext.options!.enableDebugMode = true;
        expect(DebugHelper.isDebugEnabled(mockContext)).toBe(true);
      });

      it('should return false when options are undefined', () => {
        mockContext.options = {} as ParseOptions;
        mockContext.options.enableDebugMode = undefined;
        expect(DebugHelper.isDebugEnabled(mockContext)).toBe(false);
      });

      it('should return false when context is empty', () => {
        const emptyContext = {} as ProcessingContext;
        expect(DebugHelper.isDebugEnabled(emptyContext)).toBe(false);
      });
    });

    describe('isDebugEnabledFromOptions', () => {
      it('should return false when debug mode is disabled', () => {
        expect(DebugHelper.isDebugEnabledFromOptions(mockOptions)).toBe(false);
      });

      it('should return true when debug mode is enabled', () => {
        mockOptions.enableDebugMode = true;
        expect(DebugHelper.isDebugEnabledFromOptions(mockOptions)).toBe(true);
      });

      it('should return false when options are undefined', () => {
        expect(DebugHelper.isDebugEnabledFromOptions(undefined)).toBe(false);
      });

      it('should return false when options are null', () => {
        expect(DebugHelper.isDebugEnabledFromOptions(null as any)).toBe(false);
      });
    });
  });

  describe('Debug Feature Detection', () => {
    beforeEach(() => {
      mockContext.options!.enableDebugMode = true;
      mockOptions.enableDebugMode = true;
    });

    describe('shouldSaveDebugImages', () => {
      it('should return false when debug images are disabled', () => {
        expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
      });

      it('should return true when debug images are enabled', () => {
        mockContext.options!.debugOptions!.saveDebugImages = true;
        expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(true);
      });

      it('should return false when debug mode is disabled even if saveDebugImages is true', () => {
        mockContext.options!.enableDebugMode = false;
        mockContext.options!.debugOptions!.saveDebugImages = true;
        expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
      });

      it('should return false when debugOptions is undefined', () => {
        mockContext.options!.debugOptions = undefined;
        expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
      });
    });

    describe('shouldLogProcessingDetails', () => {
      it('should return false when logging is disabled', () => {
        expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(false);
      });

      it('should return true when logging is enabled', () => {
        mockContext.options!.debugOptions!.logProcessingDetails = true;
        expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(true);
      });

      it('should return false when debug mode is disabled', () => {
        mockContext.options!.enableDebugMode = false;
        mockContext.options!.debugOptions!.logProcessingDetails = true;
        expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(false);
      });
    });

    describe('shouldIncludeTimingInfo', () => {
      it('should return false when timing info is disabled', () => {
        expect(DebugHelper.shouldIncludeTimingInfo(mockContext)).toBe(false);
      });

      it('should return true when timing info is enabled', () => {
        mockContext.options!.debugOptions!.includeTimingInfo = true;
        expect(DebugHelper.shouldIncludeTimingInfo(mockContext)).toBe(true);
      });
    });
  });

  describe('Debug Prefix Generation', () => {
    it('should generate correct prefixes for different log types', () => {
      expect(DebugHelper.getDebugPrefix('info')).toBe('🐛 [DEBUG]');
      expect(DebugHelper.getDebugPrefix('warn')).toBe('⚠️ [DEBUG]');
      expect(DebugHelper.getDebugPrefix('error')).toBe('❌ [DEBUG]');
      expect(DebugHelper.getDebugPrefix('success')).toBe('✅ [DEBUG]');
    });

    it('should default to info prefix', () => {
      expect(DebugHelper.getDebugPrefix()).toBe('🐛 [DEBUG]');
    });
  });

  describe('Debug Logging', () => {
    beforeEach(() => {
      mockContext.options!.enableDebugMode = true;
      mockContext.options!.debugOptions!.logProcessingDetails = true;
      mockOptions.enableDebugMode = true;
      mockOptions.debugOptions!.logProcessingDetails = true;
    });

    describe('log method', () => {
      it('should log messages when debug logging is enabled', () => {
        DebugHelper.log(mockContext, 'Test message');
        expect(loggedMessages).toHaveLength(1);
        expect(loggedMessages[0]).toContain('🐛 [DEBUG] Test message');
      });

      it('should not log messages when debug logging is disabled', () => {
        mockContext.options!.debugOptions!.logProcessingDetails = false;
        DebugHelper.log(mockContext, 'Test message');
        expect(loggedMessages).toHaveLength(0);
      });

      it('should log with different types', () => {
        DebugHelper.log(mockContext, 'Info message', 'info');
        DebugHelper.log(mockContext, 'Warning message', 'warn');
        DebugHelper.log(mockContext, 'Error message', 'error');
        DebugHelper.log(mockContext, 'Success message', 'success');

        expect(loggedMessages).toHaveLength(4);
        expect(loggedMessages[0]).toContain('🐛 [DEBUG] Info message');
        expect(loggedMessages[1]).toContain('⚠️ [DEBUG] Warning message');
        expect(loggedMessages[2]).toContain('❌ [DEBUG] Error message');
        expect(loggedMessages[3]).toContain('✅ [DEBUG] Success message');
      });
    });

    describe('logFromOptions method', () => {
      it('should log messages when debug logging is enabled', () => {
        DebugHelper.logFromOptions(mockOptions, 'Test message from options');
        expect(loggedMessages).toHaveLength(1);
        expect(loggedMessages[0]).toContain('🐛 [DEBUG] Test message from options');
      });

      it('should not log messages when debug logging is disabled', () => {
        mockOptions.debugOptions!.logProcessingDetails = false;
        DebugHelper.logFromOptions(mockOptions, 'Test message');
        expect(loggedMessages).toHaveLength(0);
      });

      it('should handle undefined options', () => {
        DebugHelper.logFromOptions(undefined, 'Test message');
        expect(loggedMessages).toHaveLength(0);
      });
    });
  });

  describe('Timing Wrapper', () => {
    beforeEach(() => {
      mockContext.options!.enableDebugMode = true;
      mockContext.options!.debugOptions!.includeTimingInfo = true;
      mockContext.options!.debugOptions!.logProcessingDetails = true;
    });

    it('should execute function and log timing when timing is enabled', async () => {
      const testFunction = jest.fn().mockResolvedValue('test result');
      
      const result = await DebugHelper.withTiming(mockContext, 'test operation', testFunction);
      
      expect(result).toBe('test result');
      expect(testFunction).toHaveBeenCalled();
      expect(loggedMessages.length).toBeGreaterThanOrEqual(2);
      expect(loggedMessages[0]).toContain('Starting test operation...');
      expect(loggedMessages[1]).toContain('Completed test operation in');
      expect(loggedMessages[1]).toContain('ms');
    });

    it('should execute function without timing when timing is disabled', async () => {
      mockContext.options!.debugOptions!.includeTimingInfo = false;
      const testFunction = jest.fn().mockResolvedValue('test result');
      
      const result = await DebugHelper.withTiming(mockContext, 'test operation', testFunction);
      
      expect(result).toBe('test result');
      expect(testFunction).toHaveBeenCalled();
      expect(loggedMessages).toHaveLength(0);
    });

    it('should handle and log errors in timing wrapper', async () => {
      const error = new Error('Test error');
      const testFunction = jest.fn().mockRejectedValue(error);
      
      await expect(DebugHelper.withTiming(mockContext, 'failing operation', testFunction)).rejects.toThrow('Test error');
      
      expect(testFunction).toHaveBeenCalled();
      expect(loggedMessages.length).toBeGreaterThanOrEqual(2);
      expect(loggedMessages[0]).toContain('Starting failing operation...');
      expect(loggedMessages[1]).toContain('Failed failing operation after');
      expect(loggedMessages[1]).toContain('ms');
    });
  });

  describe('Debug Summary Generation', () => {
    it('should return disabled message when debug is off', () => {
      const summary = DebugHelper.getDebugSummary(mockContext);
      expect(summary).toBe('Debug: disabled');
    });

    it('should return enabled message with no features when debug is on but no features enabled', () => {
      mockContext.options!.enableDebugMode = true;
      const summary = DebugHelper.getDebugSummary(mockContext);
      expect(summary).toBe('Debug: enabled ()');
    });

    it('should list enabled features in summary', () => {
      mockContext.options!.enableDebugMode = true;
      mockContext.options!.debugOptions = {
        saveDebugImages: true,
        logProcessingDetails: true,
        includeTimingInfo: true
      };
      
      const summary = DebugHelper.getDebugSummary(mockContext);
      expect(summary).toContain('Debug: enabled');
      expect(summary).toContain('images');
      expect(summary).toContain('logging');
      expect(summary).toContain('timing');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed context objects', () => {
      const malformedContexts = [
        {} as ProcessingContext,
        { options: null } as any,
        { options: {} } as ProcessingContext
      ];

      malformedContexts.forEach(context => {
        expect(() => DebugHelper.isDebugEnabled(context)).not.toThrow();
        expect(() => DebugHelper.shouldSaveDebugImages(context)).not.toThrow();
        expect(() => DebugHelper.shouldLogProcessingDetails(context)).not.toThrow();
        expect(() => DebugHelper.getDebugSummary(context)).not.toThrow();
      });
    });

    it('should handle very long log messages', () => {
      mockContext.options!.enableDebugMode = true;
      mockContext.options!.debugOptions!.logProcessingDetails = true;

      const longMessage = 'A'.repeat(1000);
      DebugHelper.log(mockContext, longMessage, 'info');
      
      expect(loggedMessages).toHaveLength(1);
      expect(loggedMessages[0]).toContain(longMessage);
    });
  });
});