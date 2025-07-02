import { IElementProcessor } from "../../interfaces/IElementProcessor";
import { Element } from "../../../models/domain/elements/Element";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import { UnitConverter } from "../../utils/UnitConverter";
import { ColorUtils } from "../../utils/ColorUtils";

export class LineElement extends Element {
  private points: { x: number; y: number }[] = [];
  private strokeWidth: number = 1;
  private strokeColor: string = "#000000";
  private strokeStyle: "solid" | "dashed" | "dotted" = "solid";
  private startArrow: string = "";
  private endArrow: string = "";

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

  toJSON(): any {
    const position = this.getPosition();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const size = this.getSize();
    
    // Calculate relative start and end points from absolute position
    const startPoint = this.points[0] || { x: 0, y: 0 };
    const endPoint = this.points[1] || { x: 0, y: 0 };
    
    const relativeStart = [
      startPoint.x - (position?.x || 0),
      startPoint.y - (position?.y || 0)
    ];
    
    const relativeEnd = [
      endPoint.x - (position?.x || 0), 
      endPoint.y - (position?.y || 0)
    ];

    return {
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
        color: this.strokeColor
      },
      points: [this.startArrow, this.endArrow]
    };
  }
}

export class LineProcessor implements IElementProcessor<LineElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process connection shapes (lines) - both cxnSp and sp with line geometry
    if (xmlNode.name.endsWith("cxnSp")) {
      return true;
    }
    
    // Also process regular shapes that are actually lines (prstGeom prst="line")
    if (xmlNode.name.endsWith("sp")) {
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
            lineElement.setPosition({
              x: UnitConverter.emuToPoints(parseInt(x)),
              y: UnitConverter.emuToPoints(parseInt(y)),
            });
          }
        }

        // Size (for calculating end points)
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            lineElement.setSize({
              width: UnitConverter.emuToPoints(parseInt(cx)),
              height: UnitConverter.emuToPoints(parseInt(cy)),
            });
          }
        }
      }

      // Extract line style properties
      const lnNode = this.xmlParser.findNode(spPrNode, "ln");
      if (lnNode) {
        // Line width
        const w = this.xmlParser.getAttribute(lnNode, "w");
        if (w) {
          lineElement.setStrokeWidth(UnitConverter.emuToPoints(parseInt(w)));
        }

        // Line color
        const solidFillNode = this.xmlParser.findNode(lnNode, "solidFill");
        if (solidFillNode) {
          const color = this.extractColor(solidFillNode, context);
          if (color) {
            lineElement.setStrokeColor(color);
          }
        }

        // Line style (dashed, dotted, etc.)
        const prstDashNode = this.xmlParser.findNode(lnNode, "prstDash");
        if (prstDashNode) {
          const val = this.xmlParser.getAttribute(prstDashNode, "val");
          if (val === "dash" || val === "dashDot") {
            lineElement.setStrokeStyle("dashed");
          } else if (val === "dot" || val === "sysDot") {
            lineElement.setStrokeStyle("dotted");
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
      }
    }

    // Calculate line points
    const position = lineElement.getPosition();
    const size = lineElement.getSize();
    if (position && size) {
      const startPoint = { x: position.x, y: position.y };
      const endPoint = { 
        x: position.x + size.width, 
        y: position.y + size.height 
      };
      lineElement.setPoints([startPoint, endPoint]);
    }

    return lineElement;
  }

  getElementType(): string {
    return "line";
  }

  private extractColor(fillNode: XmlNode, context: ProcessingContext): string | undefined {
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