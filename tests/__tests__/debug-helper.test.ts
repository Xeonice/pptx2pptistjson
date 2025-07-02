import { DebugHelper } from '../../app/lib/services/utils/DebugHelper';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { ParseOptions } from '../../app/lib/models/dto/ParseOptions';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';
import JSZip from 'jszip';

describe('DebugHelper', () => {
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

  describe('isDebugEnabled', () => {
    it('should return false when debug mode is not enabled', () => {
      expect(DebugHelper.isDebugEnabled(mockContext)).toBe(false);
    });

    it('should return true when debug mode is enabled', () => {
      mockContext.options.enableDebugMode = true;
      expect(DebugHelper.isDebugEnabled(mockContext)).toBe(true);
    });
  });

  describe('shouldSaveDebugImages', () => {
    it('should return false when debug mode is disabled', () => {
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
    });

    it('should return false when debug mode is enabled but saveDebugImages is false', () => {
      mockContext.options.enableDebugMode = true;
      mockContext.options.debugOptions = { saveDebugImages: false };
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(false);
    });

    it('should return true when debug mode is enabled and saveDebugImages is true', () => {
      mockContext.options.enableDebugMode = true;
      mockContext.options.debugOptions = { saveDebugImages: true };
      expect(DebugHelper.shouldSaveDebugImages(mockContext)).toBe(true);
    });
  });

  describe('shouldLogProcessingDetails', () => {
    it('should return true when debug mode and logging are enabled', () => {
      mockContext.options.enableDebugMode = true;
      mockContext.options.debugOptions = { logProcessingDetails: true };
      expect(DebugHelper.shouldLogProcessingDetails(mockContext)).toBe(true);
    });
  });

  describe('fromOptions methods', () => {
    it('should work with ParseOptions directly', () => {
      const options: ParseOptions = {
        enableDebugMode: true,
        debugOptions: {
          saveDebugImages: true,
          logProcessingDetails: true
        }
      };

      expect(DebugHelper.isDebugEnabledFromOptions(options)).toBe(true);
      expect(DebugHelper.shouldSaveDebugImagesFromOptions(options)).toBe(true);
      expect(DebugHelper.shouldLogProcessingDetailsFromOptions(options)).toBe(true);
    });
  });

  describe('getDebugSummary', () => {
    it('should return disabled message when debug is off', () => {
      const summary = DebugHelper.getDebugSummary(mockContext);
      expect(summary).toBe('Debug: disabled');
    });

    it('should return enabled features when debug is on', () => {
      mockContext.options.enableDebugMode = true;
      mockContext.options.debugOptions = {
        saveDebugImages: true,
        logProcessingDetails: true
      };
      
      const summary = DebugHelper.getDebugSummary(mockContext);
      expect(summary).toContain('Debug: enabled');
      expect(summary).toContain('images');
      expect(summary).toContain('logging');
    });
  });

  describe('withTiming', () => {
    it('should execute function normally when timing is disabled', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const result = await DebugHelper.withTiming(mockContext, 'test operation', mockFn);
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute function and log timing when enabled', async () => {
      mockContext.options.enableDebugMode = true;
      mockContext.options.debugOptions = { 
        includeTimingInfo: true,
        logProcessingDetails: true 
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockFn = jest.fn().mockResolvedValue('result');
      
      const result = await DebugHelper.withTiming(mockContext, 'test operation', mockFn);
      
      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting test operation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Completed test operation')
      );
      
      consoleSpy.mockRestore();
    });
  });
});