import { Theme } from '../../models/domain/Theme';
import { SlideLayout } from '../../models/domain/Slide';
import { IdGenerator } from '../utils/IdGenerator';
import { ParseOptions } from '../../models/dto/ParseOptions';
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
  options: ParseOptions;

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

  /**
   * Group transformation information when processing elements inside a group
   * Contains scale factors and transformation properties extracted from grpSp xfrm
   */
  groupTransform?: GroupTransform;

  /**
   * Parent group fill color when processing elements inside a group
   * Used for handling grpFill elements that inherit from parent group
   */
  parentGroupFillColor?: string;
}

/**
 * Group transformation information extracted from PowerPoint group shapes
 */
export interface GroupTransform {
  /**
   * Horizontal scale factor (actualCx / childCx)
   */
  scaleX: number;
  
  /**
   * Vertical scale factor (actualCy / childCy)
   */
  scaleY: number;
  
  /**
   * Group position in slide coordinates (a:off)
   */
  offset?: {
    x: number;
    y: number;
  };
  
  /**
   * Child coordinate space offset (a:chOff)
   */
  childOffset?: {
    x: number;
    y: number;
  };
  
  /**
   * Optional rotation in degrees
   */
  rotation?: number;
  
  /**
   * Optional flip transformations
   */
  flip?: {
    horizontal?: boolean;
    vertical?: boolean;
  };
}

export interface RelationshipInfo {
  id: string;
  type: string;
  target: string;
}