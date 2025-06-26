import { Presentation } from '../../models/domain/Presentation';
import { ExportOptions } from '../../models/dto/ExportOptions';

/**
 * Interface for exporters
 */
export interface IExporter<T = any> {
  /**
   * Export a presentation to the target format
   */
  export(presentation: Presentation, options?: ExportOptions): Promise<T>;

  /**
   * Get the format this exporter handles
   */
  getFormat(): string;

  /**
   * Validate if the presentation can be exported
   */
  canExport(presentation: Presentation): boolean;
}