import { Element } from "./Element";

export class ShapeElement extends Element {
  private shapeType: ShapeType;
  private path?: string;
  private pathFormula?: string;
  private text?: TextContent;
  private fill?: { color: string };
  private stroke?: StrokeProperties;
  private flip?: { horizontal: boolean; vertical: boolean };
  private connectionInfo?: ConnectionInfo;

  constructor(id: string, shapeType: ShapeType) {
    super(id, "shape");
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

  setPathFormula(pathFormula: string): void {
    this.pathFormula = pathFormula;
  }

  getPathFormula(): string | undefined {
    return this.pathFormula;
  }

  /**
   * Get the SVG path for JSON serialization (expose private method for testing)
   */
  getShapePath(): string {
    return this.path || this.getShapePathInternal();
  }

  private getShapePathInternal(): string {
    // Generate SVG path based on shape type
    switch (this.shapeType) {
      case "ellipse":
        return "M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z";
      case "rect":
        return "M 0 0 L 200 0 L 200 200 L 0 200 Z";
      case "roundRect":
        return "M 20 0 L 180 0 Q 200 0 200 20 L 200 180 Q 200 200 180 200 L 20 200 Q 0 200 0 180 L 0 20 Q 0 0 20 0 Z";
      case "triangle":
        return "M 100 0 L 200 200 L 0 200 Z";
      case "diamond":
        return "M 100 0 L 200 100 L 100 200 L 0 100 Z";
      default:
        return "M 0 0 L 200 0 L 200 200 L 0 200 Z";
    }
  }

  setText(text: TextContent): void {
    this.text = text;
  }

  getText(): TextContent | undefined {
    return this.text;
  }

  setFill(fill: { color: string }): void {
    this.fill = fill;
  }

  getFill(): { color: string } | undefined {
    return this.fill;
  }

  setStroke(stroke: StrokeProperties): void {
    this.stroke = stroke;
  }

  getStroke(): StrokeProperties | undefined {
    return this.stroke;
  }

  setFlip(flip: { horizontal: boolean; vertical: boolean }): void {
    this.flip = flip;
  }

  getFlip(): { horizontal: boolean; vertical: boolean } | undefined {
    return this.flip;
  }

  setConnectionInfo(connectionInfo: ConnectionInfo): void {
    this.connectionInfo = connectionInfo;
  }

  getConnectionInfo(): ConnectionInfo | undefined {
    return this.connectionInfo;
  }

  setTextContent(content: string): void {
    this.text = { content };
  }

  toJSON(): any {
    const themeFill = this.getThemeFill();
    const result: any = {
      type: this.type,
      id: this.id,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      width: this.size?.width || 0,
      height: this.size?.height || 0,
      viewBox: [200, 200],
      path: this.path || this.getShapePathInternal(),
      pathFormula: this.pathFormula,
      shape: this.shapeType,
      fill: themeFill.color, // String format for frontend rendering
      themeFill: themeFill,  // Object format for theme management
      fixedRatio: false,
      rotate: this.rotation || 0,
      enableShrink: true,
    };

    // Add keypoints property for roundRect shapes
    if (this.shapeType === "roundRect") {
      result.keypoints = [];
    }

    return result;
  }


  private getThemeFill(): { color: string; debug?: any } {
    console.log(`ShapeElement ${this.id}: fill=${JSON.stringify(this.fill)}`);
    
    // Return actual fill color if available, prioritizing extracted colors
    if (this.fill && this.fill.color && this.fill.color !== 'rgba(0,0,0,0)') {
      console.log(`ShapeElement ${this.id}: using extracted fill color ${this.fill.color}`);
      return { 
        color: this.fill.color,
        debug: `Extracted from fill: ${this.fill.color}`
      };
    }

    console.log(`ShapeElement ${this.id}: no valid fill found, using fallback`);
    
    // Generate fallback colors for better visual compatibility (RGBA format)
    const colors = [
      "rgba(255,137,137,1)",   // Red
      "rgba(216,241,255,1)",   // Light Blue  
      "rgba(255,219,65,1)",    // Yellow
      "rgba(144,238,144,1)",   // Light Green
      "rgba(255,182,193,1)",   // Light Pink
    ];
    
    // Create a simple hash from the ID to get consistent color selection
    let hash = 0;
    for (let i = 0; i < this.id.length; i++) {
      hash = ((hash << 5) - hash + this.id.charCodeAt(i)) & 0xffffffff;
    }
    const index = Math.abs(hash) % colors.length;
    const fallbackColor = colors[index];
    console.log(`ShapeElement ${this.id}: using fallback color ${fallbackColor}`);
    return { 
      color: fallbackColor,
      debug: `Fallback color - no extracted fill. Original fill was: ${JSON.stringify(this.fill)}. ID: ${this.id}`
    };
  }
}

export type ShapeType =
  | "rect"
  | "roundRect"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "parallelogram"
  | "trapezoid"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star"
  | "arrow"
  | "callout"
  | "custom"
  | "line"
  | "bentConnector"
  | "curvedConnector"
  | "doubleArrow";

export interface TextContent {
  content: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    align?: "left" | "center" | "right";
    valign?: "top" | "middle" | "bottom";
  };
}

export interface StrokeProperties {
  width?: number;
  cap?: string;
  compound?: string;
  dashType?: string;
  headArrow?: ArrowProperties;
  tailArrow?: ArrowProperties;
}

export interface ArrowProperties {
  type: string;
  width?: string;
  length?: string;
}

export interface ConnectionInfo {
  startConnection?: {
    id: string;
    index?: string;
  };
  endConnection?: {
    id: string;
    index?: string;
  };
}
