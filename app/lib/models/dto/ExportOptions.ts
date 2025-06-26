export interface ExportOptions {
  /**
   * Output format
   */
  format: ExportFormat;

  /**
   * Whether to include metadata
   */
  includeMetadata?: boolean;

  /**
   * Whether to minify the output
   */
  minify?: boolean;

  /**
   * Custom formatting options for specific formats
   */
  formatOptions?: FormatSpecificOptions;
}

export type ExportFormat = 'json' | 'pptist' | 'html' | 'markdown';

export interface FormatSpecificOptions {
  /**
   * JSON format options
   */
  json?: {
    indent?: number;
    dateFormat?: string;
  };

  /**
   * PPTist format options
   */
  pptist?: {
    version?: string;
    includeAnimations?: boolean;
  };

  /**
   * HTML format options
   */
  html?: {
    template?: string;
    cssFile?: string;
    inlineStyles?: boolean;
    slideWrapper?: string;
  };

  /**
   * Markdown format options
   */
  markdown?: {
    imageFormat?: 'base64' | 'url' | 'file';
    headingLevel?: number;
  };
}