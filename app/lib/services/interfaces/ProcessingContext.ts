import { Theme } from '../../models/domain/Theme';
import { SlideLayout } from '../../models/domain/Slide';
import { IdGenerator } from '../utils/IdGenerator';
import JSZip from 'jszip';

/**
 * Context passed to processors during parsing
 */
export interface ProcessingContext {
  /**
   * The ZIP file being processed
   */
  zip: JSZip;

  /**
   * Current slide number
   */
  slideNumber: number;

  /**
   * Current slide ID
   */
  slideId: string;

  /**
   * Theme information
   */
  theme?: Theme;

  /**
   * Slide layout information
   */
  layout?: SlideLayout;

  /**
   * Master slide information
   */
  master?: any;

  /**
   * Relationships for the current slide
   */
  relationships: Map<string, RelationshipInfo>;

  /**
   * Base path for the current slide
   */
  basePath: string;

  /**
   * Options passed to the parser
   */
  options: any;

  /**
   * Warnings collected during parsing
   */
  warnings: any[];

  /**
   * ID generator for ensuring unique element IDs
   */
  idGenerator: IdGenerator;

  /**
   * Slide size information
   */
  slideSize?: {
    width: number;
    height: number;
  };
}

export interface RelationshipInfo {
  id: string;
  type: string;
  target: string;
}