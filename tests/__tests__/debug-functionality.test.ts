import { DebugHelper } from '../../app/lib/services/utils/DebugHelper';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { ParseOptions } from '../../app/lib/models/dto/ParseOptions';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import JSZip from 'jszip';

describe('Debug Functionality Integration', () => {
  let mockContext: ProcessingContext;

  beforeEach(() => {
    mockContext = {
      zip: new JSZip(),
      slideNumber: 1,
      slideId: 'slide1',
      relationships: new Map(),
      basePath: 'ppt/slides',
      options: {},
      warnings: [],
      idGenerator: new IdGenerator()
    };
  });

  describe('Debug options propagation', () => {
    it('should correctly detect debug options from ParseOptions', () => {
      const options: ParseOptions = {
        enableDebugMode: true,
        debugOptions: {
          saveDebugImages: true,
          logProcessingDetails: true,
          includeColorResolutionTrace: true,
          includeTimingInfo: true,
          preserveIntermediateSteps: false,
          saveXmlFiles: false
        }
      };

      mockContext.options = options;

      expect(DebugHelper.isDebugEnabled(mockContext)).toBe(true);
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(true);
      expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(true);
      expect(DebugHelper.shouldIncludeColorTrace(mockContext)).toBe(true);
      expect(DebugHelper.shouldIncludeTimingInfo(mockContext)).toBe(true);
      expect(DebugHelper.shouldPreserveIntermediateSteps(mockContext)).toBe(false);
      expect(DebugHelper.shouldSaveXmlFiles(mockContext)).toBe(false);
    });

    it('should handle disabled debug mode', () => {
      const options: ParseOptions = {
        enableDebugMode: false,
        debugOptions: {
          saveDebugImages: true,
          logProcessingDetails: true
        }
      };

      mockContext.options = options;

      expect(DebugHelper.isDebugEnabled(mockContext)).toBe(false);
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
      expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(false);
    });

    it('should handle partial debug options', () => {
      const options: ParseOptions = {
        enableDebugMode: true,
        debugOptions: {
          saveDebugImages: true,
          // Other options undefined
        }
      };

      mockContext.options = options;

      expect(DebugHelper.isDebugEnabled(mockContext)).toBe(true);
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(true);
      expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(false);
      expect(DebugHelper.shouldIncludeColorTrace(mockContext)).toBe(false);
    });
  });

  describe('Debug logging', () => {
    it('should log when debug logging is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockContext.options = {
        enableDebugMode: true,
        debugOptions: {
          logProcessingDetails: true
        }
      };

      DebugHelper.log(mockContext, 'Test debug message', 'info');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );

      consoleSpy.mockRestore();
    });

    it('should not log when debug logging is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockContext.options = {
        enableDebugMode: false,
        debugOptions: {
          logProcessingDetails: true
        }
      };

      DebugHelper.log(mockContext, 'Test debug message', 'info');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should provide correct debug summary', () => {
      mockContext.options = {
        enableDebugMode: true,
        debugOptions: {
          saveDebugImages: true,
          logProcessingDetails: true,
          includeColorResolutionTrace: true
        }
      };

      const summary = DebugHelper.getDebugSummary(mockContext);

      expect(summary).toContain('Debug: enabled');
      expect(summary).toContain('images');
      expect(summary).toContain('logging');
      expect(summary).toContain('colors');
    });
  });

  describe('Debug timing functionality', () => {
    it('should execute and time operations when timing is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockContext.options = {
        enableDebugMode: true,
        debugOptions: {
          includeTimingInfo: true,
          logProcessingDetails: true
        }
      };

      const testOperation = jest.fn().mockResolvedValue('test result');
      
      const result = await DebugHelper.withTiming(
        mockContext,
        'test operation',
        testOperation
      );

      expect(result).toBe('test result');
      expect(testOperation).toHaveBeenCalledTimes(1);
      
      // Should have logged start and completion
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting test operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completed test operation')
      );

      consoleSpy.mockRestore();
    });

    it('should handle timing errors correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockContext.options = {
        enableDebugMode: true,
        debugOptions: {
          includeTimingInfo: true,
          logProcessingDetails: true
        }
      };

      const testOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        DebugHelper.withTiming(mockContext, 'failing operation', testOperation)
      ).rejects.toThrow('Test error');

      // Should have logged start and failure
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting failing operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed failing operation'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});