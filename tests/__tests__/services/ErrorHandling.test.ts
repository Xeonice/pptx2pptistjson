/**
 * 错误处理服务单元测试
 * 测试自定义错误类型、错误上下文和错误处理机制
 */

import { 
  PPTXParseError, 
  XMLParseError, 
  FileOperationError, 
  ElementProcessingError, 
  ValidationError 
} from '../../../app/lib/services/core/errors';

describe('Error Handling Service Unit Tests', () => {
  describe('PPTXParseError Base Class', () => {
    it('should create PPTXParseError with basic properties', () => {
      const error = new PPTXParseError('Test error message', 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error.name).toBe('PPTXParseError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should create PPTXParseError with context', () => {
      const context = {
        slideId: 'slide1',
        elementId: 'element1',
        additionalInfo: 'test context'
      };
      
      const error = new PPTXParseError('Test error with context', 'TEST_ERROR', context);
      
      expect(error.context).toEqual(context);
      expect(error.context.slideId).toBe('slide1');
      expect(error.context.elementId).toBe('element1');
      expect(error.context.additionalInfo).toBe('test context');
    });

    it('should have correct stack trace', () => {
      const error = new PPTXParseError('Stack trace test', 'STACK_ERROR');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PPTXParseError');
      expect(error.stack).toContain('Stack trace test');
    });

    it('should handle null/undefined context', () => {
      const errorWithNull = new PPTXParseError('Test', 'TEST', null);
      const errorWithUndefined = new PPTXParseError('Test', 'TEST', undefined);
      
      expect(errorWithNull.context).toBeNull();
      expect(errorWithUndefined.context).toBeUndefined();
    });

    it('should handle empty string message and code', () => {
      const error = new PPTXParseError('', '');
      
      expect(error.message).toBe('');
      expect(error.code).toBe('');
    });
  });

  describe('XMLParseError', () => {
    it('should create XMLParseError with correct properties', () => {
      const error = new XMLParseError('XML parsing failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(XMLParseError);
      expect(error.name).toBe('XMLParseError');
      expect(error.message).toBe('XML parsing failed');
      expect(error.code).toBe('XML_PARSE_ERROR');
    });

    it('should create XMLParseError with context', () => {
      const context = {
        xmlContent: '<invalid>xml</unclosed>',
        lineNumber: 1,
        columnNumber: 15
      };
      
      const error = new XMLParseError('Malformed XML', context);
      
      expect(error.context).toEqual(context);
      expect(error.context.xmlContent).toBe('<invalid>xml</unclosed>');
      expect(error.context.lineNumber).toBe(1);
    });

    it('should handle complex XML parsing scenarios', () => {
      const scenarios = [
        {
          message: 'Empty XML document',
          context: { xmlContent: '' }
        },
        {
          message: 'Invalid XML characters',
          context: { xmlContent: '<root>invalid&char</root>' }
        },
        {
          message: 'Unclosed tags',
          context: { xmlContent: '<root><child></root>' }
        },
        {
          message: 'Namespace errors',
          context: { xmlContent: '<ns:root><child></ns:root>' }
        }
      ];

      scenarios.forEach(scenario => {
        const error = new XMLParseError(scenario.message, scenario.context);
        
        expect(error.message).toBe(scenario.message);
        expect(error.context).toEqual(scenario.context);
        expect(error.code).toBe('XML_PARSE_ERROR');
      });
    });
  });

  describe('FileOperationError', () => {
    it('should create FileOperationError with correct properties', () => {
      const error = new FileOperationError('File not found');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(FileOperationError);
      expect(error.name).toBe('FileOperationError');
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FILE_OPERATION_ERROR');
    });

    it('should create FileOperationError with file context', () => {
      const context = {
        filePath: 'ppt/slides/slide1.xml',
        operation: 'read',
        fileSize: 1024,
        permissions: 'r--'
      };
      
      const error = new FileOperationError('Permission denied', context);
      
      expect(error.context).toEqual(context);
      expect(error.context.filePath).toBe('ppt/slides/slide1.xml');
      expect(error.context.operation).toBe('read');
    });

    it('should handle various file operation scenarios', () => {
      const scenarios = [
        {
          message: 'File not found in ZIP',
          context: { filePath: 'missing.xml', operation: 'extract' }
        },
        {
          message: 'Corrupted ZIP file',
          context: { filePath: 'presentation.pptx', operation: 'load' }
        },
        {
          message: 'Access denied',
          context: { filePath: 'protected.xml', operation: 'read' }
        },
        {
          message: 'File too large',
          context: { filePath: 'huge.xml', operation: 'extract', fileSize: 100 * 1024 * 1024 }
        }
      ];

      scenarios.forEach(scenario => {
        const error = new FileOperationError(scenario.message, scenario.context);
        
        expect(error.message).toBe(scenario.message);
        expect(error.context).toEqual(scenario.context);
        expect(error.code).toBe('FILE_OPERATION_ERROR');
      });
    });
  });

  describe('ElementProcessingError', () => {
    it('should create ElementProcessingError with correct properties', () => {
      const error = new ElementProcessingError('Failed to process shape', 'shape');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(ElementProcessingError);
      expect(error.name).toBe('ElementProcessingError');
      expect(error.message).toBe('Failed to process shape');
      expect(error.code).toBe('ELEMENT_PROCESSING_ERROR');
      expect(error.context.elementType).toBe('shape');
    });

    it('should create ElementProcessingError with additional context', () => {
      const additionalContext = {
        elementId: 'shape1',
        slideId: 'slide1',
        elementData: { width: 100, height: 50 }
      };
      
      const error = new ElementProcessingError('Invalid shape geometry', 'shape', additionalContext);
      
      expect(error.context.elementType).toBe('shape');
      expect(error.context.elementId).toBe('shape1');
      expect(error.context.slideId).toBe('slide1');
      expect(error.context.elementData).toEqual({ width: 100, height: 50 });
    });

    it('should handle different element types', () => {
      const elementTypes = [
        'shape',
        'text',
        'image',
        'table',
        'chart',
        'connector',
        'group'
      ];

      elementTypes.forEach(elementType => {
        const error = new ElementProcessingError(`Failed to process ${elementType}`, elementType);
        
        expect(error.context.elementType).toBe(elementType);
        expect(error.message).toBe(`Failed to process ${elementType}`);
      });
    });

    it('should handle complex element processing scenarios', () => {
      const scenarios = [
        {
          message: 'Invalid shape path',
          elementType: 'shape',
          context: { shapeType: 'custom', pathData: 'M 0 0 L 100 100' }
        },
        {
          message: 'Missing image source',
          elementType: 'image',
          context: { embedId: 'rId1', imagePath: null }
        },
        {
          message: 'Unsupported text formatting',
          elementType: 'text',
          context: { formatType: 'unknown', formatData: {} }
        }
      ];

      scenarios.forEach(scenario => {
        const error = new ElementProcessingError(scenario.message, scenario.elementType, scenario.context);
        
        expect(error.message).toBe(scenario.message);
        expect(error.context.elementType).toBe(scenario.elementType);
        expect(error.context).toMatchObject(scenario.context);
      });
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid field value', 'width');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid field value');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context.field).toBe('width');
    });

    it('should create ValidationError with additional context', () => {
      const additionalContext = {
        value: -100,
        expectedRange: [0, 1000],
        validationType: 'numeric'
      };
      
      const error = new ValidationError('Value out of range', 'width', additionalContext);
      
      expect(error.context.field).toBe('width');
      expect(error.context.value).toBe(-100);
      expect(error.context.expectedRange).toEqual([0, 1000]);
      expect(error.context.validationType).toBe('numeric');
    });

    it('should handle different validation scenarios', () => {
      const scenarios = [
        {
          message: 'Required field missing',
          field: 'title',
          context: { required: true, provided: null }
        },
        {
          message: 'Invalid format',
          field: 'email',
          context: { format: 'email', value: 'invalid-email' }
        },
        {
          message: 'Value too long',
          field: 'description',
          context: { maxLength: 100, actualLength: 150 }
        },
        {
          message: 'Invalid enum value',
          field: 'status',
          context: { validValues: ['active', 'inactive'], provided: 'unknown' }
        }
      ];

      scenarios.forEach(scenario => {
        const error = new ValidationError(scenario.message, scenario.field, scenario.context);
        
        expect(error.message).toBe(scenario.message);
        expect(error.context.field).toBe(scenario.field);
        expect(error.context).toMatchObject(scenario.context);
      });
    });
  });

  describe('Error Hierarchy and Inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const xmlError = new XMLParseError('XML error');
      const fileError = new FileOperationError('File error');
      const elementError = new ElementProcessingError('Element error', 'shape');
      const validationError = new ValidationError('Validation error', 'field');

      // Check instanceof relationships
      expect(xmlError instanceof Error).toBe(true);
      expect(xmlError instanceof PPTXParseError).toBe(true);
      expect(xmlError instanceof XMLParseError).toBe(true);

      expect(fileError instanceof Error).toBe(true);
      expect(fileError instanceof PPTXParseError).toBe(true);
      expect(fileError instanceof FileOperationError).toBe(true);

      expect(elementError instanceof Error).toBe(true);
      expect(elementError instanceof PPTXParseError).toBe(true);
      expect(elementError instanceof ElementProcessingError).toBe(true);

      expect(validationError instanceof Error).toBe(true);
      expect(validationError instanceof PPTXParseError).toBe(true);
      expect(validationError instanceof ValidationError).toBe(true);
    });

    it('should have unique error codes', () => {
      const errors = [
        new PPTXParseError('Test', 'CUSTOM_ERROR'),
        new XMLParseError('Test'),
        new FileOperationError('Test'),
        new ElementProcessingError('Test', 'element'),
        new ValidationError('Test', 'field')
      ];

      const codes = errors.map(error => error.code);
      const uniqueCodes = [...new Set(codes)];
      
      expect(codes.length).toBe(uniqueCodes.length);
      expect(codes).toContain('CUSTOM_ERROR');
      expect(codes).toContain('XML_PARSE_ERROR');
      expect(codes).toContain('FILE_OPERATION_ERROR');
      expect(codes).toContain('ELEMENT_PROCESSING_ERROR');
      expect(codes).toContain('VALIDATION_ERROR');
    });
  });

  describe('Error Serialization and Logging', () => {
    it('should serialize error information for logging', () => {
      const context = {
        slideId: 'slide1',
        elementId: 'shape1',
        timestamp: new Date().toISOString()
      };
      
      const error = new ElementProcessingError('Shape processing failed', 'shape', context);
      
      // Simulate serialization
      const serialized = JSON.parse(JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        context: error.context,
        stack: error.stack
      }));

      expect(serialized.name).toBe('ElementProcessingError');
      expect(serialized.message).toBe('Shape processing failed');
      expect(serialized.code).toBe('ELEMENT_PROCESSING_ERROR');
      expect(serialized.context).toEqual({ ...context, elementType: 'shape' });
    });

    it('should handle circular references in context', () => {
      const contextWithCircular: any = {
        slideId: 'slide1',
        elementId: 'shape1'
      };
      
      // Create circular reference
      contextWithCircular.self = contextWithCircular;
      
      const error = new ElementProcessingError('Test error', 'shape', contextWithCircular);
      
      // Should not throw when accessing properties
      expect(error.context.slideId).toBe('slide1');
      expect(error.context.elementId).toBe('shape1');
      expect(error.context.self).toBe(contextWithCircular);
    });

    it('should handle large context objects', () => {
      const largeContext = {
        data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }))
      };
      
      const error = new ValidationError('Large context test', 'data', largeContext);
      
      expect(error.context.data).toHaveLength(10000);
      expect(error.context.data[0]).toEqual({ id: 0, value: 'item0' });
    });
  });

  describe('Error Handling in Try-Catch Blocks', () => {
    it('should be properly caught and handled', () => {
      const testFunction = () => {
        throw new XMLParseError('Test XML error');
      };

      try {
        testFunction();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(XMLParseError);
        expect((error as XMLParseError).message).toBe('Test XML error');
        expect((error as XMLParseError).code).toBe('XML_PARSE_ERROR');
      }
    });

    it('should distinguish between different error types', () => {
      const throwXMLError = () => { throw new XMLParseError('XML error'); };
      const throwFileError = () => { throw new FileOperationError('File error'); };
      const throwElementError = () => { throw new ElementProcessingError('Element error', 'shape'); };
      const throwValidationError = () => { throw new ValidationError('Validation error', 'field'); };

      const functions = [throwXMLError, throwFileError, throwElementError, throwValidationError];
      const expectedTypes = [XMLParseError, FileOperationError, ElementProcessingError, ValidationError];

      functions.forEach((func, index) => {
        try {
          func();
          fail(`Function ${index} should have thrown an error`);
        } catch (error) {
          expect(error).toBeInstanceOf(expectedTypes[index]);
        }
      });
    });

    it('should handle error chaining', () => {
      const originalError = new Error('Original error');
      const wrappedError = new PPTXParseError('Wrapped error', 'WRAPPED_ERROR', {
        originalError: originalError.message,
        originalStack: originalError.stack
      });

      expect(wrappedError.context.originalError).toBe('Original error');
      expect(wrappedError.context.originalStack).toBeDefined();
    });
  });

  describe('Error Message Formatting', () => {
    it('should support message templates', () => {
      const createFormattedError = (template: string, params: Record<string, any>) => {
        let message = template;
        Object.entries(params).forEach(([key, value]) => {
          message = message.replace(`{${key}}`, String(value));
        });
        return new ElementProcessingError(message, 'shape', params);
      };

      const error = createFormattedError(
        'Failed to process {elementType} with ID {elementId} on slide {slideId}',
        { elementType: 'rectangle', elementId: 'rect1', slideId: 'slide1' }
      );

      expect(error.message).toBe('Failed to process rectangle with ID rect1 on slide slide1');
    });

    it('should handle multilingual error messages', () => {
      const messages = {
        en: 'File not found',
        zh: '文件未找到',
        es: 'Archivo no encontrado'
      };

      const createLocalizedError = (language: string) => {
        const message = messages[language as keyof typeof messages] || messages.en;
        return new FileOperationError(message, { language });
      };

      const englishError = createLocalizedError('en');
      const chineseError = createLocalizedError('zh');
      const spanishError = createLocalizedError('es');

      expect(englishError.message).toBe('File not found');
      expect(chineseError.message).toBe('文件未找到');
      expect(spanishError.message).toBe('Archivo no encontrado');
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory when creating many errors', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create many errors
      const errors = [];
      for (let i = 0; i < 10000; i++) {
        errors.push(new XMLParseError(`Error ${i}`, { index: i }));
      }

      // Clear references
      errors.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    it('should create errors efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        new ValidationError(`Error ${i}`, 'field', { index: i });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200); // Should complete in less than 200ms
    });
  });
});