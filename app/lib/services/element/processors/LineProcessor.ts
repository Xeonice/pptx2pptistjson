import { IElementProcessor } from "../../interfaces/IElementProcessor";
import { Element } from "../../../models/domain/elements/Element";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import { UnitConverter } from "../../utils/UnitConverter";
import { ColorUtils } from "../../utils/ColorUtils";
import { DebugHelper } from "../../utils/DebugHelper";

export class LineElement extends Element {
  private points: { x: number; y: number }[] = [];
  private strokeWidth: number = 1;
  private strokeColor: string = "#000000";
  private strokeStyle: "solid" | "dashed" | "dotted" = "solid";
  private startArrow: string = "";
  private endArrow: string = "";
  private flip?: { horizontal: boolean; vertical: boolean };

  constructor(id: string) {
    super(id, "line");
  }

  setPoints(points: { x: number; y: number }[]): void {
    this.points = points;
  }

  getPoints(): { x: number; y: number }[] {
    return this.points;
  }

  setStrokeWidth(width: number): void {
    this.strokeWidth = width;
  }

  setStrokeColor(color: string): void {
    this.strokeColor = color;
  }

  setStrokeStyle(style: "solid" | "dashed" | "dotted"): void {
    this.strokeStyle = style;
  }

  setArrows(start: string, end: string): void {
    this.startArrow = start;
    this.endArrow = end;
  }

  setFlip(flip: { horizontal: boolean; vertical: boolean }): void {
    this.flip = flip;
  }

  getFlip(): { horizontal: boolean; vertical: boolean } | undefined {
    return this.flip;
  }

  toJSON(): any {
    const position = this.getPosition();

    // Calculate relative start and end points from absolute position
    const startPoint = this.points[0] || { x: 0, y: 0 };
    const endPoint = this.points[1] || { x: 0, y: 0 };

    const relativeStart = [
      startPoint.x - (position?.x || 0),
      startPoint.y - (position?.y || 0),
    ];

    const relativeEnd = [
      endPoint.x - (position?.x || 0),
      endPoint.y - (position?.y || 0),
    ];

    const result = {
      type: this.type,
      id: this.id,
      width: this.strokeWidth,
      left: position?.x || 0,
      top: position?.y || 0,
      start: relativeStart,
      end: relativeEnd,
      style: this.strokeStyle,
      color: this.strokeColor,
      themeColor: {
        color: this.strokeColor,
      },
      points: [this.startArrow, this.endArrow],
    };

    // Debug output only when debug is enabled (checked outside)
    if (typeof globalThis !== 'undefined' && (globalThis as any).debugContext) {
      console.log(`LineElement ${this.id} toJSON:`, JSON.stringify(result, null, 2));
    }

    return result;
  }
}

export class LineProcessor implements IElementProcessor<LineElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process connection shapes (lines) - both cxnSp and sp with line geometry
    if (xmlNode.name === "p:cxnSp") {
      const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
      if (spPrNode) {
        const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
        if (prstGeomNode) {
          const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
          // Only process line and straightConnector1 as lines
          return prst === "line" || prst === "straightConnector1";
        }
      }
      return false;
    }

    // Also process regular shapes that are actually lines (prstGeom prst="line")
    if (xmlNode.name === "p:sp") {
      const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
      if (spPrNode) {
        const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
        if (prstGeomNode) {
          const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
          return prst === "line";
        }
      }
    }

    return false;
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<LineElement> {
    // Extract ID - handle both cxnSp and sp elements
    let originalId: string | undefined;

    if (xmlNode.name.endsWith("cxnSp")) {
      // Connection shape
      const nvCxnSpPrNode = this.xmlParser.findNode(xmlNode, "nvCxnSpPr");
      const cNvPrNode = nvCxnSpPrNode
        ? this.xmlParser.findNode(nvCxnSpPrNode, "cNvPr")
        : undefined;
      originalId = cNvPrNode
        ? this.xmlParser.getAttribute(cNvPrNode, "id")
        : undefined;
    } else {
      // Regular shape with line geometry
      const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
      const cNvPrNode = nvSpPrNode
        ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
        : undefined;
      originalId = cNvPrNode
        ? this.xmlParser.getAttribute(cNvPrNode, "id")
        : undefined;
    }

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "line");
    const lineElement = new LineElement(id);
    
    DebugHelper.log(context, `LineProcessor: Processing line element with ID ${originalId} -> ${id}`, "info");

    // Extract position and size
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, "xfrm");
      if (xfrmNode) {
        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, "off");
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, "x");
          const y = this.xmlParser.getAttribute(offNode, "y");
          if (x && y) {
            const posX = UnitConverter.emuToPoints(parseInt(x));
            const posY = UnitConverter.emuToPoints(parseInt(y));
            lineElement.setPosition({ x: posX, y: posY });
            DebugHelper.log(context, `LineProcessor ${id}: Position - x: ${x} EMU (${posX} pt), y: ${y} EMU (${posY} pt)`, "info");
          }
        }

        // Size (for calculating end points)
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            const width = UnitConverter.emuToPoints(parseInt(cx));
            const height = UnitConverter.emuToPoints(parseInt(cy));
            lineElement.setSize({ width, height });
            DebugHelper.log(context, `LineProcessor ${id}: Size - cx: ${cx} EMU (${width} pt), cy: ${cy} EMU (${height} pt)`, "info");
          }
        }

        // Flip attributes
        const flipH = this.xmlParser.getAttribute(xfrmNode, "flipH") === "1";
        const flipV = this.xmlParser.getAttribute(xfrmNode, "flipV") === "1";
        if (flipH || flipV) {
          lineElement.setFlip({ horizontal: flipH, vertical: flipV });
          DebugHelper.log(context, `LineProcessor ${id}: Flip - horizontal: ${flipH}, vertical: ${flipV}`, "info");
        }
      }

      // Extract line style properties
      const lnNode = this.xmlParser.findNode(spPrNode, "ln");
      if (lnNode) {
        // Line width
        const w = this.xmlParser.getAttribute(lnNode, "w");
        if (w) {
          const strokeWidth = UnitConverter.emuToPoints(parseInt(w));
          lineElement.setStrokeWidth(strokeWidth);
          DebugHelper.log(context, `LineProcessor ${id}: Stroke width - ${w} EMU (${strokeWidth} pt)`, "info");
        }

        // Line color
        const solidFillNode = this.xmlParser.findNode(lnNode, "solidFill");
        if (solidFillNode) {
          const color = this.extractColor(solidFillNode, context);
          if (color) {
            lineElement.setStrokeColor(color);
            DebugHelper.log(context, `LineProcessor ${id}: Stroke color - ${color}`, "info");
          }
        }

        // Line style (dashed, dotted, etc.)
        const prstDashNode = this.xmlParser.findNode(lnNode, "prstDash");
        if (prstDashNode) {
          const val = this.xmlParser.getAttribute(prstDashNode, "val");
          if (val === "dash" || val === "dashDot") {
            lineElement.setStrokeStyle("dashed");
            DebugHelper.log(context, `LineProcessor ${id}: Line style - dashed (${val})`, "info");
          } else if (val === "dot" || val === "sysDot") {
            lineElement.setStrokeStyle("dotted");
            DebugHelper.log(context, `LineProcessor ${id}: Line style - dotted (${val})`, "info");
          }
        }

        // Arrow endpoints
        let startArrow = "";
        let endArrow = "";

        const headEndNode = this.xmlParser.findNode(lnNode, "headEnd");
        if (headEndNode) {
          const type = this.xmlParser.getAttribute(headEndNode, "type");
          if (type) {
            startArrow = type === "triangle" ? "arrow" : type;
          }
        }

        const tailEndNode = this.xmlParser.findNode(lnNode, "tailEnd");
        if (tailEndNode) {
          const type = this.xmlParser.getAttribute(tailEndNode, "type");
          if (type) {
            endArrow = type === "triangle" ? "arrow" : type;
          }
        }

        lineElement.setArrows(startArrow, endArrow);
        if (startArrow || endArrow) {
          DebugHelper.log(context, `LineProcessor ${id}: Arrows - start: "${startArrow}", end: "${endArrow}"`, "info");
        }
      }
    }

    // Calculate line points
    const position = lineElement.getPosition();
    const size = lineElement.getSize();
    if (position && size) {
      // In PowerPoint, a line is defined by its bounding box
      // The actual line endpoints are at the corners of this box
      // We need to determine which corners based on the flip attributes or line direction

      // Default: line goes from top-left to bottom-right
      let startPoint = { x: position.x, y: position.y };
      let endPoint = {
        x: position.x + size.width,
        y: position.y + size.height,
      };

      // Check for flip attributes to determine actual line direction
      const flipH = lineElement.getFlip()?.horizontal || false;
      const flipV = lineElement.getFlip()?.vertical || false;

      if (flipH && !flipV) {
        // Horizontal flip: line goes from top-right to bottom-left
        startPoint = { x: position.x + size.width, y: position.y };
        endPoint = { x: position.x, y: position.y + size.height };
      } else if (!flipH && flipV) {
        // Vertical flip: line goes from bottom-left to top-right
        startPoint = { x: position.x, y: position.y + size.height };
        endPoint = { x: position.x + size.width, y: position.y };
      } else if (flipH && flipV) {
        // Both flips: line goes from bottom-right to top-left
        startPoint = {
          x: position.x + size.width,
          y: position.y + size.height,
        };
        endPoint = { x: position.x, y: position.y };
      }

      lineElement.setPoints([startPoint, endPoint]);
      
      // Debug: Log calculated points
      DebugHelper.log(context, `LineProcessor ${id}: Calculated points:`, "info");
      DebugHelper.log(context, `  Start point (absolute): x=${startPoint.x}, y=${startPoint.y}`, "info");
      DebugHelper.log(context, `  End point (absolute): x=${endPoint.x}, y=${endPoint.y}`, "info");
      DebugHelper.log(context, `  Start (relative to position): [${startPoint.x - position.x}, ${startPoint.y - position.y}]`, "info");
      DebugHelper.log(context, `  End (relative to position): [${endPoint.x - position.x}, ${endPoint.y - position.y}]`, "info");
    }

    return lineElement;
  }

  getElementType(): string {
    return "line";
  }

  private extractColor(
    fillNode: XmlNode,
    context: ProcessingContext
  ): string | undefined {
    // Check for srgbClr
    const srgbNode = this.xmlParser.findNode(fillNode, "srgbClr");
    if (srgbNode) {
      const val = this.xmlParser.getAttribute(srgbNode, "val");
      if (val) {
        return ColorUtils.toRgba(`#${val}`);
      }
    }

    // Check for schemeClr (theme colors)
    const schemeClrNode = this.xmlParser.findNode(fillNode, "schemeClr");
    if (schemeClrNode) {
      const val = this.xmlParser.getAttribute(schemeClrNode, "val");
      if (val && context.theme) {
        const colorScheme = context.theme.getColorScheme();
        if (colorScheme) {
          const themeColor = (colorScheme as any)[val];
          if (themeColor) {
            return ColorUtils.toRgba(themeColor);
          }
        }
      }
    }

    return "#000000"; // Default black
  }
}
