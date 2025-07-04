import { Element, Shadow } from "./Element";
import { OutlineResult } from "../../../services/utils/OutlineExtractor";

export class ShapeElement extends Element {
  private shapeType: ShapeType;
  private path?: string;
  private pathFormula?: string;
  private text?: TextContent;
  private viewBox?: [number, number];
  private special?: boolean;
  private shapeText?: ShapeTextContent;
  private fill?: { color: string };
  private gradient?: GradientFill;
  private stroke?: StrokeProperties;
  private outline?: OutlineResult;
  private connectionInfo?: ConnectionInfo;
  private adjustmentValues?: Record<string, number>;

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

  getSpecial() {
    return this.special;
  }

  setSpecial(special: boolean) {
    this.special = special;
  }

  setPathFormula(pathFormula: string): void {
    this.pathFormula = pathFormula;
  }

  getPathFormula(): string | undefined {
    return this.pathFormula;
  }

  setAdjustmentValues(adjustmentValues: Record<string, number>): void {
    this.adjustmentValues = adjustmentValues;
  }

  getAdjustmentValues(): Record<string, number> {
    return this.adjustmentValues || {};
  }

  getViewBox() {
    return this.viewBox;
  }

  setViewBox(viewBox: [number, number]) {
    this.viewBox = viewBox;
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
      case "ellipse": {
        const w = this.size?.width || 200;
        const h = this.size?.height || 200;
        const cx = w / 2;
        const rx = w / 2;
        const ry = h / 2;
        return `M ${cx} 0 A ${rx} ${ry} 0 1 1 ${cx} ${h} A ${rx} ${ry} 0 1 1 ${cx} 0 Z`;
      }
      case "rect": {
        const w = this.size?.width || 200;
        const h = this.size?.height || 200;
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
      }
      case "roundRect": {
        const adjustValues = this.getAdjustmentValues();
        const adjValue =
          adjustValues.adj !== undefined ? adjustValues.adj : 0.1;
        const w = this.size?.width || 200;
        const h = this.size?.height || 200;
        const roundRectRx = Math.min(w, h) * adjValue;

        // Always generate rounded rectangle path (no circle conversion)
        return `M ${roundRectRx} 0 L ${
          w - roundRectRx
        } 0 Q ${w} 0 ${w} ${roundRectRx} L ${w} ${
          h - roundRectRx
        } Q ${w} ${h} ${
          w - roundRectRx
        } ${h} L ${roundRectRx} ${h} Q 0 ${h} 0 ${
          h - roundRectRx
        } L 0 ${roundRectRx} Q 0 0 ${roundRectRx} 0 Z`;
      }
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

  setGradient(gradient: GradientFill): void {
    this.gradient = gradient;
  }

  getGradient(): GradientFill | undefined {
    return this.gradient;
  }

  setStroke(stroke: StrokeProperties): void {
    this.stroke = stroke;
  }

  getStroke(): StrokeProperties | undefined {
    return this.stroke;
  }

  setOutline(outline: OutlineResult): void {
    this.outline = outline;
  }

  getOutline(): OutlineResult | undefined {
    return this.outline;
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

  setShapeTextContent(textContent: ShapeTextContent): void {
    this.shapeText = textContent;
  }

  toJSON(): any {
    const width = this.size?.width || 0;
    const height = this.size?.height || 0;

    const result: any = {
      type: this.type,
      id: this.id,
      width: width,
      height: height,
      left: this.position?.x || 0,
      top: this.position?.y || 0,
      // Use actual dimensions for viewBox if available, otherwise use preset viewBox or default 200x200
      viewBox:
        this.viewBox ||
        (width > 0 && height > 0 ? [width, height] : [200, 200]),
      path: this.path || this.getShapePathInternal(),
      fixedRatio: false,
      rotate: this.getRotation() || 0,
    };

    // Add gradient if present, otherwise add fill
    if (this.gradient) {
      result.fill = "";
      result.gradient = this.gradient;
    } else {
      const themeFill = this.getThemeFill();
      result.fill = themeFill.color;
      result.themeFill = themeFill;
    }

    // Add shape type and enableShrink for all shapes
    // Always include shape property, default to "rect" for custom shapes with no path
    result.shape = this.shapeType !== "custom" ? this.shapeType : "rect";
    result.enableShrink = true;

    // Add pathFormula if present (but don't include if undefined)
    if (this.pathFormula !== undefined) {
      result.pathFormula = this.pathFormula;
    }

    // Add special property if present
    if (this.special) {
      result.special = this.special;
    }

    // Add outline if present (prioritize new outline property over legacy stroke)
    if (this.outline) {
      result.outline = {
        color: this.outline.color,
        width: this.outline.width,
        style: this.outline.style,
      };
    } else if (
      this.stroke &&
      ((this.stroke.width && this.stroke.width > 0) ||
        this.stroke.color !== "#000000")
    ) {
      // Fallback to legacy stroke properties for backward compatibility
      result.outline = {
        color: this.stroke.color || "#000000",
        width: this.stroke.width || 0,
        style: this.stroke.dashType || "solid",
      };
    }

    // Only add flip properties if they are true
    const flip = this.getFlip();
    if (flip?.horizontal) {
      result.flipH = true;
    }
    if (flip?.vertical) {
      result.flipV = true;
    }

    // Add keypoints property for roundRect shapes
    if (this.shapeType === "roundRect") {
      const adjustValues = this.getAdjustmentValues();
      // Use 'adj' adjustment value, default to 0.5 if not found
      const adjValue = adjustValues.adj !== undefined ? adjustValues.adj : 0.5;
      result.keypoints = [adjValue];
    }

    // Add text content if present
    if (this.shapeText) {
      result.text = this.shapeText;
    }

    // Add shadow if present
    const shadow = this.getShadow();
    if (shadow) {
      result.shadow = {
        type: shadow.type,
        h: shadow.h,
        v: shadow.v,
        blur: shadow.blur,
        color: shadow.color
      };
    }

    return result;
  }

  private getThemeFill(): { color: string; debug?: any } {
    // Return actual fill color if available, prioritizing extracted colors
    if (this.fill && this.fill.color) {
      return {
        color: this.fill.color,
        debug: `Extracted from fill: ${this.fill.color}`,
      };
    }

    // Generate fallback colors for better visual compatibility (RGBA format)
    const colors = [
      "rgba(255,137,137,1)", // Red
      "rgba(216,241,255,1)", // Light Blue
      "rgba(255,219,65,1)", // Yellow
      "rgba(144,238,144,1)", // Light Green
      "rgba(255,182,193,1)", // Light Pink
    ];

    // Create a simple hash from the ID to get consistent color selection
    let hash = 0;
    for (let i = 0; i < this.id.length; i++) {
      hash = ((hash << 5) - hash + this.id.charCodeAt(i)) & 0xffffffff;
    }
    const index = Math.abs(hash) % colors.length;
    const fallbackColor = colors[index];
    return {
      color: fallbackColor,
      debug: `Fallback color - no extracted fill. Original fill was: ${JSON.stringify(
        this.fill
      )}. ID: ${this.id}`,
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
    textAlign?: string;
  };
}

export interface ShapeTextContent {
  content: string;
  align?: string;
  defaultFontName?: string;
  defaultColor?: string;
}

export interface StrokeProperties {
  color?: string;
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

export interface GradientFill {
  type: "linear" | "radial";
  themeColor: Array<{
    pos: number;
    color: string;
  }>;
  colors: Array<{
    pos: number;
    color: string;
  }>;
  rotate: number;
}
