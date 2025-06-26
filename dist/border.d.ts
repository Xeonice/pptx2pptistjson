import type { XmlNode, ProcessingContext, BorderType } from './types';
interface BorderResult {
    borderColor: string;
    borderWidth: number;
    borderType: BorderType;
    strokeDasharray: string;
}
export declare function getBorder(node: XmlNode, elType?: string, warpObj?: ProcessingContext): BorderResult;
export {};
//# sourceMappingURL=border.d.ts.map