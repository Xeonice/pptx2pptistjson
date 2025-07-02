import { ParseOptions } from '../../models/dto/ParseOptions';
import { ProcessingContext } from '../interfaces/ProcessingContext';

/**
 * Debug utility for centralized debug configuration handling
 */
export class DebugHelper {
  /**
   * Check if debug mode is enabled
   */
  static isDebugEnabled(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode || false;
  }

  /**
   * Check if debug mode is enabled from ParseOptions directly
   */
  static isDebugEnabledFromOptions(options?: ParseOptions): boolean {
    return options?.enableDebugMode || false;
  }

  /**
   * Check if debug images should be saved
   */
  static shouldSaveDebugImages(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.saveDebugImages || false;
  }

  /**
   * Check if debug images should be saved from ParseOptions directly
   */
  static shouldSaveDebugImagesFromOptions(options?: ParseOptions): boolean {
    return options?.enableDebugMode && 
           options?.debugOptions?.saveDebugImages || false;
  }

  /**
   * Check if detailed processing logs should be enabled
   */
  static shouldLogProcessingDetails(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.logProcessingDetails || false;
  }

  /**
   * Check if detailed processing logs should be enabled from ParseOptions directly
   */
  static shouldLogProcessingDetailsFromOptions(options?: ParseOptions): boolean {
    return options?.enableDebugMode && 
           options?.debugOptions?.logProcessingDetails || false;
  }

  /**
   * Check if intermediate processing steps should be preserved
   */
  static shouldPreserveIntermediateSteps(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.preserveIntermediateSteps || false;
  }

  /**
   * Check if color resolution trace should be included
   */
  static shouldIncludeColorTrace(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.includeColorResolutionTrace || false;
  }

  /**
   * Check if timing information should be included
   */
  static shouldIncludeTimingInfo(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.includeTimingInfo || false;
  }

  /**
   * Check if XML files should be saved
   */
  static shouldSaveXmlFiles(context: ProcessingContext): boolean {
    return context.options?.enableDebugMode && 
           context.options?.debugOptions?.saveXmlFiles || false;
  }

  /**
   * Get debug prefix for console logging
   */
  static getDebugPrefix(type: 'info' | 'warn' | 'error' | 'success' = 'info'): string {
    const prefixes = {
      info: '🐛',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };
    return `${prefixes[type]} [DEBUG]`;
  }

  /**
   * Log debug message if debug logging is enabled
   */
  static log(context: ProcessingContext, message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info', ...args: any[]): void {
    if (this.shouldLogProcessingDetails(context)) {
      const prefix = this.getDebugPrefix(type);
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Log debug message from ParseOptions directly
   */
  static logFromOptions(options: ParseOptions | undefined, message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info', ...args: any[]): void {
    if (this.shouldLogProcessingDetailsFromOptions(options)) {
      const prefix = this.getDebugPrefix(type);
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Create a timing wrapper that logs execution time if timing debug is enabled
   */
  static async withTiming<T>(
    context: ProcessingContext,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.shouldIncludeTimingInfo(context)) {
      return fn();
    }

    const startTime = Date.now();
    this.log(context, `Starting ${operation}...`, 'info');
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.log(context, `Completed ${operation} in ${duration}ms`, 'success');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(context, `Failed ${operation} after ${duration}ms`, 'error', error);
      throw error;
    }
  }

  /**
   * Get debug configuration summary
   */
  static getDebugSummary(context: ProcessingContext): string {
    if (!this.isDebugEnabled(context)) {
      return 'Debug: disabled';
    }

    const options = context.options?.debugOptions;
    const enabledFeatures = [];
    
    if (options?.saveDebugImages) enabledFeatures.push('images');
    if (options?.logProcessingDetails) enabledFeatures.push('logging');
    if (options?.preserveIntermediateSteps) enabledFeatures.push('intermediate');
    if (options?.includeColorResolutionTrace) enabledFeatures.push('colors');
    if (options?.includeTimingInfo) enabledFeatures.push('timing');
    if (options?.saveXmlFiles) enabledFeatures.push('xml');

    return `Debug: enabled (${enabledFeatures.join(', ')})`;
  }
}