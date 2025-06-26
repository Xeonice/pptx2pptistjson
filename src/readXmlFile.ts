import * as txml from 'txml/dist/txml.mjs';
import type { XmlNode } from './types';
import type JSZip from 'jszip';

let cust_attr_order = 0;

interface TXMLNode {
  tagName?: string;
  attributes?: Record<string, string>;
  children?: (TXMLNode | string)[];
}

export function simplifyLostLess(
  children: (TXMLNode | string)[], 
  parentAttributes: Record<string, string> = {}
): XmlNode | string {
  const out: XmlNode = {};
  if (!children.length) return out;

  if (children.length === 1 && typeof children[0] === 'string') {
    return Object.keys(parentAttributes).length ? {
      attrs: { order: cust_attr_order++, ...parentAttributes },
      value: children[0],
    } : children[0];
  }

  for (const child of children) {
    if (typeof child !== 'object' || !child.tagName) continue;
    if (child.tagName === '?xml') continue;

    if (!out[child.tagName]) out[child.tagName] = [];

    const kids = simplifyLostLess(child.children || [], child.attributes || {});
    
    if (typeof kids === 'object' && kids !== null) {
      if (!kids.attrs) {
        kids.attrs = { order: cust_attr_order++ };
      } else {
        kids.attrs.order = cust_attr_order++;
      }
    }
    
    if (Object.keys(child.attributes || {}).length) {
      if (typeof kids === 'object' && kids !== null) {
        kids.attrs = { ...kids.attrs, ...child.attributes };
      }
    }
    
    if (Array.isArray(out[child.tagName])) {
      out[child.tagName].push(kids);
    }
  }

  for (const childKey in out) {
    if (Array.isArray(out[childKey]) && out[childKey].length === 1) {
      out[childKey] = out[childKey][0];
    }
  }

  return out;
}

export async function readXmlFile(zip: JSZip, filename: string): Promise<XmlNode | null> {
  try {
    const file = zip.file(filename);
    if (!file) {
      return null;
    }
    
    const data = await file.async('string');
    const parsed = txml.parse(data) as TXMLNode[];
    return simplifyLostLess(parsed) as XmlNode;
  } catch (error) {
    console.warn(`Failed to read XML file: ${filename}`, error);
    return null;
  }
}