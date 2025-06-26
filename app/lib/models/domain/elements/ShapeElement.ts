import { Element } from './Element';

export class ShapeElement extends Element {
  private shapeType: ShapeType;
  private path?: string;
  private text?: TextContent;

  constructor(id: string, shapeType: ShapeType) {
    super(id, 'shape');
    this.shapeType = shapeType;
  }

  getShapeType(): ShapeType {
    return this.shapeType;
  }

  setPath(path: string): void {
    this.path = path;
  }

  getPath(): string | undefined {
    return this.path;
  }

  setText(text: TextContent): void {
    this.text = text;
  }

  getText(): TextContent | undefined {
    return this.text;
  }

  toJSON(): any {
    return {
      type: this.type,
      id: this.id,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      width: this.size?.width || 0,
      height: this.size?.height || 0,
      viewBox: [200, 200],
      path: this.getShapePath(),
      themeFill: this.getThemeFill(),
      fixedRatio: false,
      rotate: this.rotation || 0,
      enableShrink: true
    };
  }
  
  private getShapePath(): string {
    // Generate SVG path based on shape type
    switch (this.shapeType) {
      case 'ellipse':
        return "M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z";
      case 'rect':
      case 'roundRect':
        return "M 0 0 L 200 0 L 200 200 L 0 200 Z";
      case 'triangle':
        return "M 100 0 L 200 200 L 0 200 Z";
      case 'diamond':
        return "M 100 0 L 200 100 L 100 200 L 0 100 Z";
      default:
        return "M 0 0 L 200 0 L 200 200 L 0 200 Z";
    }
  }
  
  private getThemeFill(): { color: string } {
    // Generate random-ish colors for shapes
    const colors = [
      "rgba(255,137,137,1)",
      "rgba(216,241,255,1)", 
      "rgba(255,219,65,1)",
      "rgba(144,238,144,1)",
      "rgba(255,182,193,1)"
    ];
    const index = parseInt(this.id.slice(-1), 16) % colors.length;
    return { color: colors[index] };
  }
}

export type ShapeType = 
  | 'rect'
  | 'roundRect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'arrow'
  | 'callout'
  | 'custom';

export interface TextContent {
  content: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  };
}