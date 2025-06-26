/**
 * Base error class for PPTX parsing errors
 */
export class PPTXParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'PPTXParseError';
  }
}

/**
 * Error thrown when XML parsing fails
 */
export class XMLParseError extends PPTXParseError {
  constructor(message: string, context?: any) {
    super(message, 'XML_PARSE_ERROR', context);
    this.name = 'XMLParseError';
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends PPTXParseError {
  constructor(message: string, context?: any) {
    super(message, 'FILE_OPERATION_ERROR', context);
    this.name = 'FileOperationError';
  }
}

/**
 * Error thrown when element processing fails
 */
export class ElementProcessingError extends PPTXParseError {
  constructor(message: string, elementType: string, context?: any) {
    super(message, 'ELEMENT_PROCESSING_ERROR', { ...context, elementType });
    this.name = 'ElementProcessingError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends PPTXParseError {
  constructor(message: string, field: string, context?: any) {
    super(message, 'VALIDATION_ERROR', { ...context, field });
    this.name = 'ValidationError';
  }
}