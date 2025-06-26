// Core XML Node Structure
export interface XmlNode {
  attrs?: {
    [key: string]: any;
    order?: number;
  };
  [key: string]: any;
}

export interface XmlAttributes {
  [key: string]: string;
}

// Position and Size Interfaces
export interface Position {
  left: number;
  top: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Size {}

// Color and Fill Interfaces
export interface Shadow {
  h: number;
  v: number;
  blur: number;
  color: string;
}

export interface ColorFill {
  type: 'color';
  value: string;
}

export interface ImageFill {
  type: 'image';
  value: {
    picBase64: string;
    opacity: number;
  };
}

export interface GradientColor {
  pos: string;
  color: string;
}

export interface GradientFill {
  type: 'gradient';
  value: {
    path: 'line' | 'circle' | 'rect' | 'shape';
    rot: number;
    colors: GradientColor[];
  };
}

export type Fill = ColorFill | ImageFill | GradientFill | '';

// Border Interface
export interface Border {
  borderColor: string;
  borderWidth: number;
  borderType: 'solid' | 'dashed' | 'dotted';
  borderStrokeDasharray: string;
}

// Base Element Interface
export interface BaseElement extends Rectangle, Partial<Border> {
  type: string;
  id?: string;
  order?: number;
  rotate?: number;
  isFlipV?: boolean;
  isFlipH?: boolean;
  name?: string;
  shadow?: Shadow;
}

// Text Element
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fill?: Fill;
  vAlign?: 'top' | 'mid' | 'bottom';
  isVertical?: boolean;
}

// Shape Element
export interface ShapeElement extends BaseElement {
  type: 'shape';
  content?: string;
  fill?: Fill;
  shapType: string;
  path?: string;
  vAlign?: 'top' | 'mid' | 'bottom';
}

// Image Element
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  rect?: {
    t?: number;
    b?: number;
    l?: number;
    r?: number;
  };
  geom?: string;
}

// Video Element
export interface VideoElement extends BaseElement {
  type: 'video';
  src?: string;
  blob?: string;
}

// Audio Element
export interface AudioElement extends BaseElement {
  type: 'audio';
  blob?: string;
}

// Math Element
export interface MathElement extends BaseElement {
  type: 'math';
  latex: string;
  picBase64: string;
  text?: string;
}

// Table Element
export interface TableCell {
  text: string;
  rowSpan?: number;
  colSpan?: number;
  vMerge?: boolean;
  hMerge?: boolean;
  fontBold?: boolean;
  fontColor?: string;
  fillColor?: string;
  borders?: Border;
}

export interface TableElement extends BaseElement {
  type: 'table';
  data: TableCell[][];
  borders?: Border;
  rowHeights: number[];
  colWidths: number[];
}

// Chart Element
export interface ChartElement extends BaseElement {
  type: 'chart';
  data: any[];
  colors: string[];
  chartType: string;
  barDir?: string;
  marker?: boolean;
  holeSize?: number;
  grouping?: string;
  style?: any;
}

// Group Element
export interface GroupElement extends BaseElement {
  type: 'group';
  elements: SlideElement[];
}

// Diagram Element
export interface DiagramElement extends BaseElement {
  type: 'diagram';
  elements: SlideElement[];
}

// Union of all element types
export type SlideElement = 
  | TextElement 
  | ShapeElement 
  | ImageElement 
  | VideoElement 
  | AudioElement 
  | MathElement 
  | TableElement 
  | ChartElement 
  | GroupElement 
  | DiagramElement;

// Slide Interface
export interface Slide {
  fill?: Fill;
  elements: SlideElement[];
  layoutElements: SlideElement[];
  note: string;
  slideName?: string;
  elementCount?: number;
}

// Legacy Parse Result Interface (for backward compatibility)
export interface ParseResult {
  slides: Slide[];
  themeColors: string[];
  size: Size;
}

// New Output Format Interfaces (PPTist compatible)
export interface PPTistColor {
  color: string;
  colorType: string;
  colorIndex?: number;
}

export interface PPTistThemeFill {
  color: string;
  colorType: string;
}

export interface PPTistBackground {
  type: 'color' | 'image' | 'gradient';
  themeColor?: PPTistColor;
  image?: string;
  imageSize?: 'cover' | 'contain' | 'repeat';
  gradient?: {
    type: string;
    color: string[];
    rotate: number;
  };
}

export interface PPTistElement {
  tag?: string;
  index?: number;
  type: 'text' | 'shape' | 'image' | 'table' | 'chart';
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  content?: string; // HTML format for text
  rotate?: number;
  defaultFontName?: string;
  defaultColor?: PPTistColor;
  vertical?: boolean;
  lineHeight?: number;
  wordSpace?: number;
  isDefault?: boolean;
  fit?: 'resize' | 'autofit';
  opacity?: number;
  
  // Shape specific
  viewBox?: number[];
  path?: string;
  themeFill?: PPTistThemeFill;
  fixedRatio?: boolean;
  pathFormula?: string;
  keypoint?: number;
  
  // Image specific
  src?: string;
  
  // Table specific
  data?: any[][];
  
  // Chart specific
  chartType?: string;
  chartData?: any;
}

export interface PPTistSlide {
  id: string;
  tag?: string; // title, catalogue, content, thanks, etc.
  elements: PPTistElement[];
  background?: PPTistBackground;
  remark?: string;
  pageId?: string;
  aiImageStatus?: any;
}

export interface PPTistTheme {
  fontName: string;
  themeColor: {
    lt1: string;    // light1
    dk1: string;    // dark1
    lt2: string;    // light2
    dk2: string;    // dark2
    accent1: string;
    accent2: string;
    accent3: string;
    accent4: string;
    accent5: string;
    accent6: string;
  };
}

export interface PPTistResult {
  slides: PPTistSlide[];
  theme: PPTistTheme;
  title?: string;
}

// Processing Context Interface
export interface ProcessingContext {
  zip: any; // JSZip instance
  slideFileName?: string;
  slideLayoutContent: XmlNode | null;
  slideLayoutTables: NodeTables;
  slideMasterContent: XmlNode | null;
  slideMasterTables: NodeTables;
  slideContent: XmlNode;
  tableStyles: XmlNode;
  slideResObj: ResourceObject;
  slideMasterTextStyles: XmlNode;
  layoutResObj: ResourceObject;
  masterResObj: ResourceObject;
  themeContent: XmlNode;
  themeResObj: ResourceObject;
  digramFileContent: XmlNode;
  diagramResObj: ResourceObject;
  defaultTextStyle: XmlNode;
  slideRelationshipFile?: XmlNode | null;
}

// Resource Object Interface
export interface ResourceObject {
  [id: string]: {
    type: string;
    target: string;
  };
}

// Node Tables Interface
export interface NodeTables {
  idTable: { [id: string]: XmlNode };
  idxTable: { [idx: string]: XmlNode };
  typeTable: { [type: string]: XmlNode };
}

// Content Types Interface
export interface ContentTypes {
  slides: string[];
  slideLayouts: string[];
}

// Slide Info Interface
export interface SlideInfo {
  width: number;
  height: number;
  defaultTextStyle: XmlNode;
}

// Theme Interface
export interface Theme {
  themeContent: XmlNode;
  themeColors: string[];
}

// Font Style Interfaces
export interface FontStyle {
  fontFamily?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontColor?: string;
  fontDecoration?: string;
  fontDecorationLine?: string;
  fontSpace?: number;
  fontSubscript?: boolean;
  fontShadow?: string;
}

// Utility Type for Processing Sources
export type ProcessingSource = 'slide' | 'slideLayoutBg' | 'slideMasterBg' | 'diagramBg' | 'themeBg' | 'slideBg';

// Fill Type Enumeration
export type FillType = 'NO_FILL' | 'SOLID_FILL' | 'GRADIENT_FILL' | 'PATTERN_FILL' | 'PIC_FILL' | 'GROUP_FILL';

// Border Type Enumeration
export type BorderType = 'solid' | 'dashed' | 'dotted';

// Vertical Alignment Type
export type VerticalAlign = 'top' | 'mid' | 'bottom';

// Horizontal Alignment Type
export type HorizontalAlign = 'left' | 'center' | 'right' | 'justify';

// Math Operation Types
export interface MathOperation {
  type: string;
  children?: MathOperation[];
  text?: string;
  [key: string]: any;
}

// Chart Data Types
export interface ChartData {
  data: any[];
  colors: string[];
  type: string;
  barDir?: string;
  marker?: boolean;
  holeSize?: number;
  grouping?: string;
  style?: any;
}

// Error Types for better error handling
export class PPTXParseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PPTXParseError';
  }
}

export class XMLParseError extends Error {
  constructor(message: string, public readonly filename?: string, public readonly cause?: Error) {
    super(message);
    this.name = 'XMLParseError';
  }
}

// Type Guards
export function isTextElement(element: SlideElement): element is TextElement {
  return element.type === 'text';
}

export function isShapeElement(element: SlideElement): element is ShapeElement {
  return element.type === 'shape';
}

export function isImageElement(element: SlideElement): element is ImageElement {
  return element.type === 'image';
}

export function isVideoElement(element: SlideElement): element is VideoElement {
  return element.type === 'video';
}

export function isAudioElement(element: SlideElement): element is AudioElement {
  return element.type === 'audio';
}

export function isMathElement(element: SlideElement): element is MathElement {
  return element.type === 'math';
}

export function isTableElement(element: SlideElement): element is TableElement {
  return element.type === 'table';
}

export function isChartElement(element: SlideElement): element is ChartElement {
  return element.type === 'chart';
}

export function isGroupElement(element: SlideElement): element is GroupElement {
  return element.type === 'group';
}

export function isDiagramElement(element: SlideElement): element is DiagramElement {
  return element.type === 'diagram';
}

// Utility types for function parameters
export type NodeKey = 'p:sp' | 'p:cxnSp' | 'p:pic' | 'p:graphicFrame' | 'p:grpSp' | 'mc:AlternateContent';

export interface ProcessNodeParams {
  nodeKey: NodeKey;
  nodeValue: XmlNode;
  nodes: XmlNode;
  warpObj: ProcessingContext;
  source: ProcessingSource;
}