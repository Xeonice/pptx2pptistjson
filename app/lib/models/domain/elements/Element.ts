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
  protected flip?: FlipTransform;
  protected shadow?: Shadow;

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

  setFlip(flip: FlipTransform): void {
    this.flip = flip;
  }

  getFlip(): FlipTransform | undefined {
    return this.flip;
  }

  setShadow(shadow: Shadow): void {
    this.shadow = shadow;
  }

  getShadow(): Shadow | undefined {
    return this.shadow;
  }

  abstract toJSON(): any;
}

export type ElementType = 
  | 'text'
  | 'shape'
  | 'image'
  | 'line'
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
  type: "outerShadow" | "innerShadow";
  h: number;    // 水平偏移（points）
  v: number;    // 垂直偏移（points）
  blur: number; // 模糊半径（points）
  color: string; // 颜色（rgba格式）
}

export interface FlipTransform {
  horizontal: boolean;
  vertical: boolean;
}