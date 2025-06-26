import { Presentation } from '../domain/Presentation';

export interface ParseResult {
  /**
   * The parsed presentation object
   */
  presentation: Presentation;

  /**
   * Any warnings generated during parsing
   */
  warnings?: ParseWarning[];

  /**
   * Parsing statistics
   */
  stats?: ParseStats;

  /**
   * Extracted media files (if requested)
   */
  media?: MediaFile[];
}

export interface ParseWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
  slideNumber?: number;
  elementId?: string;
  details?: any;
}

export interface ParseStats {
  totalSlides: number;
  totalElements: number;
  elementCounts: Record<string, number>;
  parseTimeMs: number;
  fileSizeBytes: number;
}

export interface MediaFile {
  id: string;
  filename: string;
  mimeType: string;
  data: string; // base64 or URL
  sizeBytes: number;
}