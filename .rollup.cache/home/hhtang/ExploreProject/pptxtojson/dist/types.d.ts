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
export interface Position {
    left: number;
    top: number;
}
export interface Size {
    width: number;
    height: number;
}
export interface Rectangle extends Position, Size {
}
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
export interface Border {
    borderColor: string;
    borderWidth: number;
    borderType: 'solid' | 'dashed' | 'dotted';
    borderStrokeDasharray: string;
}
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
export interface TextElement extends BaseElement {
    type: 'text';
    content: string;
    fill?: Fill;
    vAlign?: 'top' | 'mid' | 'bottom';
    isVertical?: boolean;
}
export interface ShapeElement extends BaseElement {
    type: 'shape';
    content?: string;
    fill?: Fill;
    shapType: string;
    path?: string;
    vAlign?: 'top' | 'mid' | 'bottom';
}
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
export interface VideoElement extends BaseElement {
    type: 'video';
    src?: string;
    blob?: string;
}
export interface AudioElement extends BaseElement {
    type: 'audio';
    blob?: string;
}
export interface MathElement extends BaseElement {
    type: 'math';
    latex: string;
    picBase64: string;
    text?: string;
}
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
export interface GroupElement extends BaseElement {
    type: 'group';
    elements: SlideElement[];
}
export interface DiagramElement extends BaseElement {
    type: 'diagram';
    elements: SlideElement[];
}
export type SlideElement = TextElement | ShapeElement | ImageElement | VideoElement | AudioElement | MathElement | TableElement | ChartElement | GroupElement | DiagramElement;
export interface Slide {
    fill?: Fill;
    elements: SlideElement[];
    layoutElements: SlideElement[];
    note: string;
    slideName?: string;
    elementCount?: number;
}
export interface ParseResult {
    slides: Slide[];
    themeColors: string[];
    size: Size;
}
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
    content?: string;
    rotate?: number;
    defaultFontName?: string;
    defaultColor?: PPTistColor;
    vertical?: boolean;
    lineHeight?: number;
    wordSpace?: number;
    isDefault?: boolean;
    fit?: 'resize' | 'autofit';
    opacity?: number;
    viewBox?: number[];
    path?: string;
    themeFill?: PPTistThemeFill;
    fixedRatio?: boolean;
    pathFormula?: string;
    keypoint?: number;
    src?: string;
    data?: any[][];
    chartType?: string;
    chartData?: any;
}
export interface PPTistSlide {
    id: string;
    tag?: string;
    elements: PPTistElement[];
    background?: PPTistBackground;
    remark?: string;
    pageId?: string;
    aiImageStatus?: any;
}
export interface PPTistTheme {
    fontName: string;
    themeColor: {
        lt1: string;
        dk1: string;
        lt2: string;
        dk2: string;
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
export interface ProcessingContext {
    zip: any;
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
export interface ResourceObject {
    [id: string]: {
        type: string;
        target: string;
    };
}
export interface NodeTables {
    idTable: {
        [id: string]: XmlNode;
    };
    idxTable: {
        [idx: string]: XmlNode;
    };
    typeTable: {
        [type: string]: XmlNode;
    };
}
export interface ContentTypes {
    slides: string[];
    slideLayouts: string[];
}
export interface SlideInfo {
    width: number;
    height: number;
    defaultTextStyle: XmlNode;
}
export interface Theme {
    themeContent: XmlNode;
    themeColors: string[];
}
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
export type ProcessingSource = 'slide' | 'slideLayoutBg' | 'slideMasterBg' | 'diagramBg' | 'themeBg' | 'slideBg';
export type FillType = 'NO_FILL' | 'SOLID_FILL' | 'GRADIENT_FILL' | 'PATTERN_FILL' | 'PIC_FILL' | 'GROUP_FILL';
export type BorderType = 'solid' | 'dashed' | 'dotted';
export type VerticalAlign = 'top' | 'mid' | 'bottom';
export type HorizontalAlign = 'left' | 'center' | 'right' | 'justify';
export interface MathOperation {
    type: string;
    children?: MathOperation[];
    text?: string;
    [key: string]: any;
}
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
export declare class PPTXParseError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
export declare class XMLParseError extends Error {
    readonly filename?: string | undefined;
    readonly cause?: Error | undefined;
    constructor(message: string, filename?: string | undefined, cause?: Error | undefined);
}
export declare function isTextElement(element: SlideElement): element is TextElement;
export declare function isShapeElement(element: SlideElement): element is ShapeElement;
export declare function isImageElement(element: SlideElement): element is ImageElement;
export declare function isVideoElement(element: SlideElement): element is VideoElement;
export declare function isAudioElement(element: SlideElement): element is AudioElement;
export declare function isMathElement(element: SlideElement): element is MathElement;
export declare function isTableElement(element: SlideElement): element is TableElement;
export declare function isChartElement(element: SlideElement): element is ChartElement;
export declare function isGroupElement(element: SlideElement): element is GroupElement;
export declare function isDiagramElement(element: SlideElement): element is DiagramElement;
export type NodeKey = 'p:sp' | 'p:cxnSp' | 'p:pic' | 'p:graphicFrame' | 'p:grpSp' | 'mc:AlternateContent';
export interface ProcessNodeParams {
    nodeKey: NodeKey;
    nodeValue: XmlNode;
    nodes: XmlNode;
    warpObj: ProcessingContext;
    source: ProcessingSource;
}
//# sourceMappingURL=types.d.ts.map