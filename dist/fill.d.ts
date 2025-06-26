import type { XmlNode, ProcessingContext, ProcessingSource, FillType, Fill } from './types';
export declare function getFillType(node: XmlNode): FillType;
export declare function getPicFill(type: ProcessingSource, node: XmlNode | undefined, warpObj: ProcessingContext): Promise<string>;
export declare function getPicFillOpacity(node: XmlNode): number;
export declare function getBgPicFill(bgPr: XmlNode, source: ProcessingSource, warpObj: ProcessingContext): Promise<{
    picBase64: string;
    opacity: number;
}>;
export declare function getGradientFill(node: XmlNode, warpObj: ProcessingContext): any;
export declare function getBgGradientFill(bgPr: XmlNode | undefined, phClr: string | undefined, slideMasterContent: XmlNode, warpObj: ProcessingContext): any;
export declare function getSlideBackgroundFill(warpObj: ProcessingContext): Promise<Fill>;
export declare function getShapeFill(node: XmlNode, _pNode?: XmlNode, isSvgMode?: boolean, warpObj?: ProcessingContext, source?: ProcessingSource): Promise<Fill | string>;
export declare function getSolidFill(solidFill: XmlNode | undefined, clrMap?: any, phClr?: string, warpObj?: ProcessingContext): string;
//# sourceMappingURL=fill.d.ts.map