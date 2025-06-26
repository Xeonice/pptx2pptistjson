/**
 * Base class for all PowerPoint elements
 */
export abstract class Element {
  protected id: string;
  protected type: ElementType;
  protected position?: Position;
  protected size?: Size;
  protected rotation?: number;
  protected style?: ElementStyle;

  constructor(id: string, type: ElementType) {
    this.id = id;
    this.type = type;
  }

  getId(): string {
    return this.id;
  }

  getType(): ElementType {
    return this.type;
  }

  setPosition(position: Position): void {
    this.position = position;
  }

  getPosition(): Position | undefined {
    return this.position;
  }

  setSize(size: Size): void {
    this.size = size;
  }

  getSize(): Size | undefined {
    return this.size;
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
  }

  getRotation(): number | undefined {
    return this.rotation;
  }

  setStyle(style: ElementStyle): void {
    this.style = style;
  }

  getStyle(): ElementStyle | undefined {
    return this.style;
  }

  abstract toJSON(): any;
}

export type ElementType = 
  | 'text'
  | 'shape'
  | 'image'
  | 'video'
  | 'audio'
  | 'table'
  | 'chart'
  | 'group'
  | 'diagram'
  | 'math';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  fill?: Fill;
  border?: Border;
  shadow?: Shadow;
  opacity?: number;
}

export interface Fill {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  color?: string;
  colors?: GradientColor[];
  imageUrl?: string;
}

export interface GradientColor {
  color: string;
  position: number;
}

export interface Border {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}