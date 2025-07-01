import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFillType(node: any) {
  let fillType = "";
  if (node["a:noFill"]) fillType = "NO_FILL";
  if (node["a:solidFill"]) fillType = "SOLID_FILL";
  if (node["a:gradFill"]) fillType = "GRADIENT_FILL";
  if (node["a:pattFill"]) fillType = "PATTERN_FILL";
  if (node["a:blipFill"]) fillType = "PIC_FILL";
  if (node["a:grpFill"]) fillType = "GROUP_FILL";

  return fillType;
}

export function getTextByPathList(node: any, pathList: string[]): any {
  if (!node || !pathList || pathList.length === 0) {
    return undefined;
  }

  let current = node;
  for (const path of pathList) {
    if (current && typeof current === 'object') {
      current = current[path];
    } else {
      return undefined;
    }
  }

  return current;
}
