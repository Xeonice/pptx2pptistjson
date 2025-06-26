import type { XmlNode, ProcessingContext } from './types';
export declare function getFontType(node: XmlNode, type: string | undefined, warpObj: ProcessingContext): string;
export declare function getFontColor(node: XmlNode, pNode: XmlNode, lstStyle: XmlNode, pFontStyle: XmlNode, lvl: number, warpObj: ProcessingContext): string;
export declare function getFontSize(node: XmlNode, lstStyle: XmlNode, lvl: number): number;
export declare function getFontBold(node: XmlNode, lstStyle: XmlNode, lvl: number): boolean;
export declare function getFontItalic(node: XmlNode, lstStyle: XmlNode, lvl: number): boolean;
export declare function getFontDecoration(node: XmlNode): string;
export declare function getFontDecorationLine(node: XmlNode): string;
export declare function getFontSpace(node: XmlNode): number;
export declare function getFontSubscript(node: XmlNode): boolean;
export declare function getFontShadow(node: XmlNode, warpObj: ProcessingContext): string;
//# sourceMappingURL=fontStyle.d.ts.map