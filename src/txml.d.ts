declare module 'txml/dist/txml.mjs' {
  interface TXMLNode {
    tagName?: string;
    attributes?: Record<string, string>;
    children?: (TXMLNode | string)[];
  }

  export function parse(xml: string): TXMLNode[];
}