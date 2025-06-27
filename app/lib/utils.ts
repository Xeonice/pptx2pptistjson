import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { XmlNode } from "./models/xml/XmlNode";

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
