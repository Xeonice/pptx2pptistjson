import type { XmlNode } from './types';
import type JSZip from 'jszip';
interface TXMLNode {
    tagName?: string;
    attributes?: Record<string, string>;
    children?: (TXMLNode | string)[];
}
export declare function simplifyLostLess(children: (TXMLNode | string)[], parentAttributes?: Record<string, string>): XmlNode | string;
export declare function readXmlFile(zip: JSZip, filename: string): Promise<XmlNode | null>;
export {};
//# sourceMappingURL=readXmlFile.d.ts.map