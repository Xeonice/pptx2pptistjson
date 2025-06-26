import { getTextByPathList } from './utils';
import type { XmlNode } from './types';

export function getCustomShapePath(custGeom: XmlNode, w: number, h: number): string {
  // This is a simplified implementation
  // The actual shape path generation is very complex
  const pathLst = getTextByPathList(custGeom, ['a:pathLst', 'a:path']);
  if (!pathLst) return '';

  // Basic path processing - in a real implementation this would be much more complex
  let path = '';
  
  // Simple rectangle fallback
  if (!path) {
    path = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  return path;
}