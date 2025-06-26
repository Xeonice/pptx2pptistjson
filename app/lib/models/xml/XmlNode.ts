/**
 * Simplified XML node structure for easier processing
 */
export interface XmlNode {
  name: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  content?: string;
}

/**
 * XML namespace definitions commonly used in PowerPoint files
 */
export const XML_NAMESPACES = {
  'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
  'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
  'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
  'dc': 'http://purl.org/dc/elements/1.1/',
  'dcterms': 'http://purl.org/dc/terms/',
  'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
  'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'cx': 'http://schemas.microsoft.com/office/drawing/2014/chartex'
} as const;

/**
 * Helper class for working with XML nodes
 */
export class XmlNodeHelper {
  /**
   * Find all nodes with a given name (ignoring namespace)
   */
  static findNodes(root: XmlNode, nodeName: string): XmlNode[] {
    const results: XmlNode[] = [];
    const search = (node: XmlNode) => {
      const name = node.name.split(':').pop();
      if (name === nodeName) {
        results.push(node);
      }
      if (node.children) {
        node.children.forEach(search);
      }
    };
    search(root);
    return results;
  }

  /**
   * Find the first node with a given name
   */
  static findNode(root: XmlNode, nodeName: string): XmlNode | undefined {
    const nodes = this.findNodes(root, nodeName);
    return nodes[0];
  }

  /**
   * Get attribute value
   */
  static getAttribute(node: XmlNode, attributeName: string): string | undefined {
    return node.attributes?.[attributeName];
  }

  /**
   * Get text content of a node
   */
  static getTextContent(node: XmlNode): string {
    if (node.content) return node.content;
    if (!node.children) return '';
    
    return node.children
      .map(child => this.getTextContent(child))
      .join('');
  }
}