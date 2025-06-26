import type { XmlNode } from './types';
export declare function findOMath(obj: any): any[];
export declare function parseFraction(fraction: XmlNode): string;
export declare function parseSuperscript(superscript: XmlNode): string;
export declare function parseSubscript(subscript: XmlNode): string;
export declare function parseRadical(radical: XmlNode): string;
export declare function parseMatrix(matrix: XmlNode): string;
export declare function parseNary(nary: XmlNode): string;
export declare function parseLimit(limit: XmlNode, type: 'low' | 'upp'): string;
export declare function parseDelimiter(delimiter: XmlNode): string;
export declare function parseFunction(func: XmlNode): string;
export declare function parseGroupChr(groupChr: XmlNode): string;
export declare function parseEqArr(eqArr: XmlNode): string;
export declare function parseBar(bar: XmlNode): string;
export declare function parseAccent(accent: XmlNode): string;
export declare function parseBox(box: XmlNode): string;
export declare function parseOMath(oMath: any): string;
export declare function latexFormart(latex: string): string;
//# sourceMappingURL=math.d.ts.map