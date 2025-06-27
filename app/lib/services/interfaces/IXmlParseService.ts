import { XmlNode } from '../../models/xml/XmlNode';

/**
 * Interface for XML parsing service
 */
export interface IXmlParseService {
  /**
   * Parse XML string to XmlNode structure
   */
  parse(xmlContent: string): XmlNode;

  /**
   * Find nodes by XPath-like selector
   */
  findNodes(root: XmlNode, selector: string): XmlNode[];

  /**
   * Find a single node by selector
   */
  findNode(root: XmlNode, selector: string): XmlNode | undefined;

  /**
   * Get child nodes by tag name
   */
  getChildNodes(parent: XmlNode, tagName: string): XmlNode[];

  /**
   * Get attribute value from a node
   */
  getAttribute(node: XmlNode, attributeName: string): string | undefined;

  /**
   * Get text content from a node
   */
  getTextContent(node: XmlNode): string;

  /**
   * Convert XmlNode back to XML string
   */
  stringify(node: XmlNode): string;
}