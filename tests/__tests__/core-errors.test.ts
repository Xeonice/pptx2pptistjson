/**
 * 核心错误处理测试 - app/lib/services/core/errors.ts
 * 测试所有错误类的功能和继承关系
 */

import {
  PPTXParseError,
  XMLParseError,
  FileOperationError,
  ElementProcessingError,
  ValidationError,
} from "@/lib/services/core/errors";

describe("核心错误处理", () => {
  describe("PPTXParseError - 基础错误类", () => {
    it("应该创建基础错误实例", () => {
      const error = new PPTXParseError("Test error", "TEST_ERROR");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error.name).toBe("PPTXParseError");
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.context).toBeUndefined();
    });

    it("应该支持上下文信息", () => {
      const context = { 
        file: "test.pptx", 
        line: 42,
        additionalData: { type: "shape", id: "123" }
      };
      const error = new PPTXParseError("Test error with context", "TEST_ERROR", context);
      
      expect(error.context).toEqual(context);
      expect(error.context.file).toBe("test.pptx");
      expect(error.context.line).toBe(42);
      expect(error.context.additionalData).toEqual({ type: "shape", id: "123" });
    });

    it("应该支持嵌套错误信息", () => {
      const nestedContext = {
        originalError: new Error("Original error"),
        processingStep: "validation",
        retryCount: 3,
      };
      const error = new PPTXParseError("Nested error", "NESTED_ERROR", nestedContext);
      
      expect(error.context.originalError).toBeInstanceOf(Error);
      expect(error.context.originalError.message).toBe("Original error");
      expect(error.context.processingStep).toBe("validation");
      expect(error.context.retryCount).toBe(3);
    });

    it("应该正确处理空上下文", () => {
      const error = new PPTXParseError("Error without context", "NO_CONTEXT", null);
      
      expect(error.context).toBe(null);
    });

    it("应该正确处理复杂上下文对象", () => {
      const complexContext = {
        metadata: {
          version: "1.0",
          author: "test",
          timestamps: {
            created: new Date("2023-01-01"),
            modified: new Date("2023-01-02"),
          },
        },
        processing: {
          stage: "parsing",
          progress: 0.5,
          flags: ["debug", "verbose"],
        },
      };
      const error = new PPTXParseError("Complex context error", "COMPLEX_ERROR", complexContext);
      
      expect(error.context.metadata.version).toBe("1.0");
      expect(error.context.metadata.timestamps.created).toEqual(new Date("2023-01-01"));
      expect(error.context.processing.flags).toContain("debug");
    });
  });

  describe("XMLParseError - XML解析错误", () => {
    it("应该创建XML解析错误实例", () => {
      const error = new XMLParseError("Invalid XML syntax");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(XMLParseError);
      expect(error.name).toBe("XMLParseError");
      expect(error.message).toBe("Invalid XML syntax");
      expect(error.code).toBe("XML_PARSE_ERROR");
    });

    it("应该支持XML特定的上下文信息", () => {
      const xmlContext = {
        xmlContent: '<invalid><unclosed>',
        line: 5,
        column: 12,
        xpath: "/presentation/slide[1]/shape[3]",
        namespace: "http://schemas.openxmlformats.org/presentationml/2006/main",
      };
      const error = new XMLParseError("Unclosed XML tag", xmlContext);
      
      expect(error.context).toEqual(xmlContext);
      expect(error.context.line).toBe(5);
      expect(error.context.column).toBe(12);
      expect(error.context.xpath).toBe("/presentation/slide[1]/shape[3]");
    });

    it("应该处理XML命名空间错误", () => {
      const namespaceContext = {
        expectedNamespace: "http://schemas.openxmlformats.org/presentationml/2006/main",
        actualNamespace: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        element: "p:slide",
      };
      const error = new XMLParseError("Invalid namespace", namespaceContext);
      
      expect(error.context.expectedNamespace).toContain("presentationml");
      expect(error.context.actualNamespace).toContain("wordprocessingml");
      expect(error.context.element).toBe("p:slide");
    });

    it("应该处理XML字符编码错误", () => {
      const encodingContext = {
        encoding: "UTF-8",
        invalidCharacter: "\\u0000",
        position: 1024,
        suggestion: "Remove null characters from XML content",
      };
      const error = new XMLParseError("Invalid character in XML", encodingContext);
      
      expect(error.context.encoding).toBe("UTF-8");
      expect(error.context.invalidCharacter).toBe("\\u0000");
      expect(error.context.suggestion).toContain("Remove null characters");
    });
  });

  describe("FileOperationError - 文件操作错误", () => {
    it("应该创建文件操作错误实例", () => {
      const error = new FileOperationError("File not found");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(FileOperationError);
      expect(error.name).toBe("FileOperationError");
      expect(error.message).toBe("File not found");
      expect(error.code).toBe("FILE_OPERATION_ERROR");
    });

    it("应该支持文件特定的上下文信息", () => {
      const fileContext = {
        filename: "presentation.pptx",
        operation: "read",
        size: 1024576,
        permissions: "r--r--r--",
        path: "/tmp/uploads/presentation.pptx",
      };
      const error = new FileOperationError("Permission denied", fileContext);
      
      expect(error.context).toEqual(fileContext);
      expect(error.context.filename).toBe("presentation.pptx");
      expect(error.context.operation).toBe("read");
      expect(error.context.size).toBe(1024576);
    });

    it("应该处理ZIP文件相关错误", () => {
      const zipContext = {
        zipFile: "presentation.pptx",
        entry: "ppt/slides/slide1.xml",
        compressed: true,
        compressionMethod: "deflate",
        crc32: "A1B2C3D4",
        uncompressedSize: 4096,
        compressedSize: 1024,
      };
      const error = new FileOperationError("ZIP entry corrupt", zipContext);
      
      expect(error.context.zipFile).toBe("presentation.pptx");
      expect(error.context.entry).toBe("ppt/slides/slide1.xml");
      expect(error.context.compressed).toBe(true);
      expect(error.context.crc32).toBe("A1B2C3D4");
    });

    it("应该处理网络相关的文件错误", () => {
      const networkContext = {
        url: "https://cdn.example.com/files/presentation.pptx",
        method: "GET",
        status: 404,
        statusText: "Not Found",
        timeout: 30000,
        retryCount: 3,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      };
      const error = new FileOperationError("Network download failed", networkContext);
      
      expect(error.context.url).toContain("cdn.example.com");
      expect(error.context.status).toBe(404);
      expect(error.context.retryCount).toBe(3);
      expect(error.context.headers["Content-Type"]).toContain("presentationml");
    });
  });

  describe("ElementProcessingError - 元素处理错误", () => {
    it("应该创建元素处理错误实例", () => {
      const error = new ElementProcessingError("Failed to process shape", "shape");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(ElementProcessingError);
      expect(error.name).toBe("ElementProcessingError");
      expect(error.message).toBe("Failed to process shape");
      expect(error.code).toBe("ELEMENT_PROCESSING_ERROR");
      expect(error.context.elementType).toBe("shape");
    });

    it("应该支持元素特定的上下文信息", () => {
      const elementContext = {
        elementId: "shape_123",
        slideId: "slide_1",
        position: { x: 100, y: 200 },
        size: { width: 300, height: 150 },
        properties: {
          fill: "#FF0000",
          stroke: "#000000",
          rotation: 45,
        },
      };
      const error = new ElementProcessingError("Shape processing failed", "shape", elementContext);
      
      expect(error.context.elementType).toBe("shape");
      expect(error.context.elementId).toBe("shape_123");
      expect(error.context.slideId).toBe("slide_1");
      expect(error.context.position).toEqual({ x: 100, y: 200 });
      expect(error.context.properties.fill).toBe("#FF0000");
    });

    it("应该处理文本元素错误", () => {
      const textContext = {
        text: "Sample text content",
        fontFamily: "Arial",
        fontSize: 14,
        fontColor: "#000000",
        formatting: {
          bold: true,
          italic: false,
          underline: true,
        },
        paragraphs: 3,
        words: 15,
      };
      const error = new ElementProcessingError("Text formatting error", "text", textContext);
      
      expect(error.context.elementType).toBe("text");
      expect(error.context.text).toBe("Sample text content");
      expect(error.context.fontFamily).toBe("Arial");
      expect(error.context.formatting.bold).toBe(true);
      expect(error.context.paragraphs).toBe(3);
    });

    it("应该处理图像元素错误", () => {
      const imageContext = {
        src: "images/logo.png",
        format: "PNG",
        width: 800,
        height: 600,
        fileSize: 256000,
        base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        transparency: true,
        colorDepth: 24,
      };
      const error = new ElementProcessingError("Image processing failed", "image", imageContext);
      
      expect(error.context.elementType).toBe("image");
      expect(error.context.src).toBe("images/logo.png");
      expect(error.context.format).toBe("PNG");
      expect(error.context.transparency).toBe(true);
      expect(error.context.base64).toContain("data:image/png;base64");
    });

    it("应该处理表格元素错误", () => {
      const tableContext = {
        rows: 5,
        columns: 3,
        cellData: [
          ["Header 1", "Header 2", "Header 3"],
          ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
        ],
        styles: {
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: "#000000",
        },
        mergedCells: [
          { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
        ],
      };
      const error = new ElementProcessingError("Table processing failed", "table", tableContext);
      
      expect(error.context.elementType).toBe("table");
      expect(error.context.rows).toBe(5);
      expect(error.context.columns).toBe(3);
      expect(error.context.cellData[0]).toEqual(["Header 1", "Header 2", "Header 3"]);
      expect(error.context.mergedCells).toHaveLength(1);
    });
  });

  describe("ValidationError - 验证错误", () => {
    it("应该创建验证错误实例", () => {
      const error = new ValidationError("Invalid width value", "width");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PPTXParseError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Invalid width value");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.context.field).toBe("width");
    });

    it("应该支持验证特定的上下文信息", () => {
      const validationContext = {
        value: -100,
        expectedType: "number",
        actualType: "number",
        constraints: {
          min: 0,
          max: 10000,
          required: true,
        },
        suggestion: "Width must be a positive number",
      };
      const error = new ValidationError("Width out of range", "width", validationContext);
      
      expect(error.context.field).toBe("width");
      expect(error.context.value).toBe(-100);
      expect(error.context.expectedType).toBe("number");
      expect(error.context.constraints.min).toBe(0);
      expect(error.context.suggestion).toContain("positive number");
    });

    it("应该处理字符串验证错误", () => {
      const stringContext = {
        value: "",
        expectedPattern: /^[a-zA-Z0-9_]+$/,
        actualLength: 0,
        minLength: 1,
        maxLength: 50,
        allowedChars: "a-z, A-Z, 0-9, underscore",
      };
      const error = new ValidationError("Invalid identifier", "id", stringContext);
      
      expect(error.context.field).toBe("id");
      expect(error.context.value).toBe("");
      expect(error.context.actualLength).toBe(0);
      expect(error.context.minLength).toBe(1);
      expect(error.context.allowedChars).toContain("underscore");
    });

    it("应该处理复杂对象验证错误", () => {
      const objectContext = {
        value: { x: "invalid", y: 200 },
        expectedSchema: {
          x: "number",
          y: "number",
        },
        validationErrors: [
          { field: "x", message: "Expected number, got string" },
        ],
        requiredFields: ["x", "y"],
        optionalFields: ["z"],
      };
      const error = new ValidationError("Position validation failed", "position", objectContext);
      
      expect(error.context.field).toBe("position");
      expect(error.context.value.x).toBe("invalid");
      expect(error.context.validationErrors).toHaveLength(1);
      expect(error.context.validationErrors[0].field).toBe("x");
      expect(error.context.requiredFields).toContain("x");
      expect(error.context.requiredFields).toContain("y");
    });

    it("应该处理数组验证错误", () => {
      const arrayContext = {
        value: [1, 2, "invalid", 4],
        expectedItemType: "number",
        invalidIndices: [2],
        actualLength: 4,
        minLength: 2,
        maxLength: 10,
        itemValidation: {
          min: 0,
          max: 100,
        },
      };
      const error = new ValidationError("Array contains invalid items", "coordinates", arrayContext);
      
      expect(error.context.field).toBe("coordinates");
      expect(error.context.value).toEqual([1, 2, "invalid", 4]);
      expect(error.context.invalidIndices).toContain(2);
      expect(error.context.expectedItemType).toBe("number");
      expect(error.context.itemValidation.max).toBe(100);
    });
  });

  describe("错误继承和多态性", () => {
    it("应该正确处理错误继承链", () => {
      const xmlError = new XMLParseError("XML error");
      const fileError = new FileOperationError("File error");
      const elementError = new ElementProcessingError("Element error", "shape");
      const validationError = new ValidationError("Validation error", "width");
      
      // 所有错误都应该是 PPTXParseError 的实例
      expect(xmlError).toBeInstanceOf(PPTXParseError);
      expect(fileError).toBeInstanceOf(PPTXParseError);
      expect(elementError).toBeInstanceOf(PPTXParseError);
      expect(validationError).toBeInstanceOf(PPTXParseError);
      
      // 所有错误都应该是 Error 的实例
      expect(xmlError).toBeInstanceOf(Error);
      expect(fileError).toBeInstanceOf(Error);
      expect(elementError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
    });

    it("应该支持错误类型检查", () => {
      const errors = [
        new XMLParseError("XML error"),
        new FileOperationError("File error"),
        new ElementProcessingError("Element error", "shape"),
        new ValidationError("Validation error", "width"),
      ];
      
      const xmlErrors = errors.filter(e => e instanceof XMLParseError);
      const fileErrors = errors.filter(e => e instanceof FileOperationError);
      const elementErrors = errors.filter(e => e instanceof ElementProcessingError);
      const validationErrors = errors.filter(e => e instanceof ValidationError);
      
      expect(xmlErrors).toHaveLength(1);
      expect(fileErrors).toHaveLength(1);
      expect(elementErrors).toHaveLength(1);
      expect(validationErrors).toHaveLength(1);
    });

    it("应该支持错误聚合", () => {
      const errors = [
        new XMLParseError("XML syntax error", { line: 1 }),
        new FileOperationError("File not found", { filename: "test.xml" }),
        new ElementProcessingError("Shape processing failed", "shape", { id: "shape1" }),
        new ValidationError("Invalid width", "width", { value: -1 }),
      ];
      
      const errorSummary = errors.map(error => ({
        type: error.name,
        code: error.code,
        message: error.message,
        hasContext: !!error.context,
      }));
      
      expect(errorSummary).toHaveLength(4);
      expect(errorSummary[0].type).toBe("XMLParseError");
      expect(errorSummary[0].code).toBe("XML_PARSE_ERROR");
      expect(errorSummary[1].type).toBe("FileOperationError");
      expect(errorSummary[2].type).toBe("ElementProcessingError");
      expect(errorSummary[3].type).toBe("ValidationError");
      
      // 所有错误都应该有上下文
      expect(errorSummary.every(e => e.hasContext)).toBe(true);
    });
  });

  describe("错误序列化和反序列化", () => {
    it("应该支持错误的JSON序列化", () => {
      const error = new ElementProcessingError("Shape processing failed", "shape", {
        elementId: "shape_123",
        position: { x: 100, y: 200 },
      });
      
      // 手动创建可序列化的错误对象
      const serializableError = {
        name: error.name,
        message: error.message,
        code: error.code,
        context: error.context,
      };
      
      const errorJson = JSON.stringify(serializableError);
      const parsedError = JSON.parse(errorJson);
      
      expect(parsedError.name).toBe("ElementProcessingError");
      expect(parsedError.message).toBe("Shape processing failed");
      expect(parsedError.code).toBe("ELEMENT_PROCESSING_ERROR");
      expect(parsedError.context.elementType).toBe("shape");
      expect(parsedError.context.elementId).toBe("shape_123");
    });

    it("应该处理循环引用的上下文", () => {
      const circularContext: any = {
        elementId: "shape_123",
        parent: null,
      };
      circularContext.parent = circularContext;
      
      const error = new ElementProcessingError("Circular reference", "shape", circularContext);
      
      // 应该能够创建错误，即使有循环引用
      expect(error).toBeInstanceOf(ElementProcessingError);
      expect(error.context.elementId).toBe("shape_123");
      expect(error.context.parent).toBe(circularContext);
    });
  });

  describe("错误堆栈跟踪", () => {
    it("应该保留完整的堆栈跟踪信息", () => {
      const error = new PPTXParseError("Test error", "TEST_ERROR");
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("PPTXParseError");
      expect(error.stack).toContain("Test error");
    });

    it("应该在继承的错误类中保留堆栈信息", () => {
      const xmlError = new XMLParseError("XML parsing failed");
      const fileError = new FileOperationError("File operation failed");
      
      expect(xmlError.stack).toBeDefined();
      expect(xmlError.stack).toContain("XMLParseError");
      expect(fileError.stack).toBeDefined();
      expect(fileError.stack).toContain("FileOperationError");
    });
  });
});