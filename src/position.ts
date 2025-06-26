import { RATIO_EMUs_Points } from './constants';
import type { Position, Size, XmlNode } from './types';

export function getPosition(
  slideSpNode?: XmlNode | null, 
  slideLayoutSpNode?: XmlNode | null, 
  slideMasterSpNode?: XmlNode | null
): Position {
  let off: any;

  if (slideSpNode) {
    off = slideSpNode['a:off']?.['attrs'];
  } else if (slideLayoutSpNode) {
    off = slideLayoutSpNode['a:off']?.['attrs'];
  } else if (slideMasterSpNode) {
    off = slideMasterSpNode['a:off']?.['attrs'];
  }

  if (!off) {
    return { top: 0, left: 0 };
  }

  return {
    top: parseInt(off['y']) * RATIO_EMUs_Points,
    left: parseInt(off['x']) * RATIO_EMUs_Points,
  };
}

export function getSize(
  slideSpNode?: XmlNode | null, 
  slideLayoutSpNode?: XmlNode | null, 
  slideMasterSpNode?: XmlNode | null
): Size {
  let ext: any;

  if (slideSpNode) {
    ext = slideSpNode['a:ext']?.['attrs'];
  } else if (slideLayoutSpNode) {
    ext = slideLayoutSpNode['a:ext']?.['attrs'];
  } else if (slideMasterSpNode) {
    ext = slideMasterSpNode['a:ext']?.['attrs'];
  }

  if (!ext) {
    return { width: 0, height: 0 };
  }

  return {
    width: parseInt(ext['cx']) * RATIO_EMUs_Points,
    height: parseInt(ext['cy']) * RATIO_EMUs_Points,
  };
}