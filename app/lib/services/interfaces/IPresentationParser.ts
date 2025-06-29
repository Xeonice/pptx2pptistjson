import { ParseOptions } from "../../models/dto/ParseOptions";
import { ParseResult } from "../../models/dto/ParseResult";

/**
 * Interface for presentation parsing service
 */
export interface IPresentationParser {
  /**
   * Parse a PowerPoint file and return a Presentation object
   */
  parse(file: ArrayBuffer | Blob, options?: ParseOptions): Promise<ParseResult>;

  /**
   * Parse a PowerPoint file from a stream (for large files)
   */
  parseStream?(
    stream: ReadableStream,
    options?: ParseOptions
  ): Promise<ParseResult>;
}
