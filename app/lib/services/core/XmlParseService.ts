import { parse as txmlParse } from 'txml';
import { IXmlParseService } from '../interfaces/IXmlParseService';
import { XmlNode, XmlNodeHelper } from '../../models/xml/XmlNode';

export class XmlParseService implements IXmlParseService {
  parse(xmlContent: string): XmlNode {
    try {
      const parsed = txmlParse(xmlContent);
      if (!parsed || parsed.length === 0) {
        throw new Error('Empty XML content');
      }
      
      // Find the actual root node (skip XML declaration)
      const rootNode = parsed.find((node: any) => 
        typeof node === 'object' && 
        node.tagName && 
        node.tagName !== '?xml'
      );
      
      if (!rootNode) {
        throw new Error('No valid root node found');
      }
      
      // Convert txml format to our XmlNode format
      return this.convertToXmlNode(rootNode);
    } catch (error) {
      throw new Error(`Failed to parse XML: ${(error as Error).message}`);
    }
  }

  findNodes(root: XmlNode, selector: string): XmlNode[] {
    // Simple selector support (just node names for now)
    return XmlNodeHelper.findNodes(root, selector);
  }

  findNode(root: XmlNode, selector: string): XmlNode | undefined {
    return XmlNodeHelper.findNode(root, selector);
  }

  getChildNodes(parent: XmlNode, tagName: string): XmlNode[] {
    if (!parent.children) {
      return [];
    }
    
    return parent.children.filter(child => child.name === tagName);
  }

  getAttribute(node: XmlNode, attributeName: string): string | undefined {
    return XmlNodeHelper.getAttribute(node, attributeName);
  }

  getTextContent(node: XmlNode): string {
    return XmlNodeHelper.getTextContent(node);
  }

  stringify(node: XmlNode): string {
    // Basic XML stringification
    return this.nodeToXml(node);
  }

  private convertToXmlNode(txmlNode: any): XmlNode {
    const xmlNode: XmlNode = {
      name: txmlNode.tagName
    };

    // Convert attributes
    if (txmlNode.attributes) {
      xmlNode.attributes = {};
      for (const [key, value] of Object.entries(txmlNode.attributes)) {
        xmlNode.attributes[key] = String(value);
      }
    }

    // Convert children
    if (txmlNode.children && txmlNode.children.length > 0) {
      xmlNode.children = [];
      for (const child of txmlNode.children) {
        if (typeof child === 'string') {
          // Text content
          if (child.trim()) {
            xmlNode.content = (xmlNode.content || '') + child;
          }
        } else {
          // Element node
          xmlNode.children.push(this.convertToXmlNode(child));
        }
      }
    }

    return xmlNode;
  }

  private nodeToXml(node: XmlNode, indent = 0): string {
    const spaces = ' '.repeat(indent);
    let xml = `${spaces}<${node.name}`;

    // Add attributes
    if (node.attributes) {
      for (const [key, value] of Object.entries(node.attributes)) {
        xml += ` ${key}="${this.escapeXml(value)}"`;
      }
    }

    // Self-closing tag if no children or content
    if (!node.children && !node.content) {
      xml += '/>';
      return xml;
    }

    xml += '>';

    // Add content
    if (node.content) {
      xml += this.escapeXml(node.content);
    }

    // Add children
    if (node.children) {
      xml += '\n';
      for (const child of node.children) {
        xml += this.nodeToXml(child, indent + 2) + '\n';
      }
      xml += spaces;
    }

    xml += `</${node.name}>`;
    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}