import { IElementProcessor } from "../../interfaces/IElementProcessor";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import {
  ShapeElement,
  ShapeType,
} from "../../../models/domain/elements/ShapeElement";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { UnitConverter } from "../../utils/UnitConverter";
import { FillExtractor } from "../../utils/FillExtractor";
import { DebugHelper } from "../../utils/DebugHelper";

/**
 * Processor for PowerPoint connection shapes (p:cxnSp)
 * Handles connection lines, arrows, and other connector elements
 */
export class ConnectionShapeProcessor
  implements IElementProcessor<ShapeElement>
{
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process connection shape nodes, but not simple lines
    if (xmlNode.name === "p:cxnSp") {
      const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
      if (spPrNode) {
        const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
        if (prstGeomNode) {
          const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
          // Skip line and straightConnector1 - they are handled by LineProcessor
          if (prst === "line" || prst === "straightConnector1") {
            return false;
          }
        }
      }
      return true; // Process other connection shapes
    }
    return false;
  }

  getElementType(): string {
    return "connection-shape";
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<ShapeElement> {
    // Extract connection shape properties
    const nvCxnSpPrNode = this.xmlParser.findNode(xmlNode, "nvCxnSpPr");
    const cNvPrNode = nvCxnSpPrNode
      ? this.xmlParser.findNode(nvCxnSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;
    const name = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "name")
      : "Connection";

    DebugHelper.log(context, `ConnectionShapeProcessor: Processing connection shape "${name}" with ID ${originalId}`, "info");

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "cxn-shape");

    // Extract geometry
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    let shapeType: ShapeType = "line"; // Default for connection shapes
    let pathFormula: string | undefined;

    if (spPrNode) {
      const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
      if (prstGeomNode) {
        const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
        if (prst) {
          shapeType = this.mapConnectionGeometryToShapeType(prst, context);
          pathFormula = prst;
          DebugHelper.log(context, `ConnectionShapeProcessor ${id}: Geometry type: ${prst} -> ${shapeType}`, "info");
        }
      } else {
        // Check for custom geometry
        const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");
        if (custGeomNode) {
          shapeType = "custom";
          pathFormula = "custom";
          DebugHelper.log(context, `ConnectionShapeProcessor ${id}: Custom geometry detected`, "info");
        }
      }
    }

    const shapeElement = new ShapeElement(id, shapeType);

    // Set pathFormula for debugging
    if (pathFormula) {
      shapeElement.setPathFormula(pathFormula);
    }

    // Extract position and size
    let width = 0,
      height = 0;
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, "xfrm");
      if (xfrmNode) {
        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, "off");
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, "x");
          const y = this.xmlParser.getAttribute(offNode, "y");
          if (x && y) {
            shapeElement.setPosition({
              x: UnitConverter.emuToPointsPrecise(parseInt(x)),
              y: UnitConverter.emuToPointsPrecise(parseInt(y)),
            });
          }
        }

        // Size
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            width = UnitConverter.emuToPointsPrecise(parseInt(cx));
            height = UnitConverter.emuToPointsPrecise(parseInt(cy));
            shapeElement.setSize({
              width,
              height,
            });
          }
        }

        // Rotation
        const rot = this.xmlParser.getAttribute(xfrmNode, "rot");
        if (rot) {
          const rotation = UnitConverter.angleToDegreesFromEmu(parseInt(rot));
          shapeElement.setRotation(rotation);
        }

        // Flip attributes
        const flipH = this.xmlParser.getAttribute(xfrmNode, "flipH") === "1";
        const flipV = this.xmlParser.getAttribute(xfrmNode, "flipV") === "1";
        if (flipH || flipV) {
          shapeElement.setFlip({ horizontal: flipH, vertical: flipV });
        }
      }
    }

    // Extract fill color (connection shapes often have stroke properties)
    const fillColor = this.extractFillColor(spPrNode, context);
    if (fillColor) {
      DebugHelper.log(context, `ConnectionShapeProcessor ${id}: extracted fill color: ${fillColor}`, "info");
      shapeElement.setFill({ color: fillColor });
    }

    // Extract stroke/border properties (important for connection shapes)
    const strokeProperties = this.extractStrokeProperties(spPrNode);
    if (strokeProperties) {
      shapeElement.setStroke(strokeProperties);
    }

    // Generate path for connection shape
    if (width > 0 && height > 0) {
      const svgPath = this.generateConnectionPath(shapeType, width, height);
      if (svgPath) {
        shapeElement.setPath(svgPath);
      }
    }

    // Connection shapes typically don't have text content, but check anyway
    const textContent = this.extractTextContent(xmlNode);
    if (textContent) {
      shapeElement.setTextContent(textContent);
    }

    // Extract connection start and end points (specific to connection shapes)
    const connectionInfo = this.extractConnectionInfo(xmlNode);
    if (connectionInfo) {
      shapeElement.setConnectionInfo(connectionInfo);
    }

    DebugHelper.log(context, `ConnectionShapeProcessor: Successfully processed connection shape ${id}`, "info");
    return shapeElement;
  }

  private mapConnectionGeometryToShapeType(prst: string, context?: ProcessingContext): ShapeType {
    // Map PowerPoint connection preset geometries to shape types
    switch (prst) {
      case "bentConnector2":
      case "bentConnector3":
      case "bentConnector4":
      case "bentConnector5":
        return "bentConnector";
      case "curvedConnector2":
      case "curvedConnector3":
      case "curvedConnector4":
      case "curvedConnector5":
        return "curvedConnector";
      case "rightArrow":
      case "leftArrow":
      case "upArrow":
      case "downArrow":
        return "arrow";
      case "leftRightArrow":
      case "upDownArrow":
        return "doubleArrow";
      default:
        if (context) {
          DebugHelper.log(context, `ConnectionShapeProcessor: Unknown connection geometry: ${prst}, using 'line'`, "warn");
        }
        return "line";
    }
  }

  private extractFillColor(
    spPrNode: XmlNode | undefined,
    context: ProcessingContext
  ): string | undefined {
    if (!spPrNode) return undefined;

    // Create a simple warpObj for FillExtractor
    const colorScheme: Record<string, string> = {};
    if (context.theme) {
      // Handle both Theme class instances and plain objects (for tests)
      let cs;
      if (typeof context.theme.getColorScheme === "function") {
        cs = context.theme.getColorScheme();
      } else {
        // For test objects that have colorScheme directly
        cs = (context.theme as any).colorScheme;
      }

      if (cs) {
        colorScheme.accent1 = cs.accent1;
        colorScheme.accent2 = cs.accent2;
        colorScheme.accent3 = cs.accent3;
        colorScheme.accent4 = cs.accent4;
        colorScheme.accent5 = cs.accent5;
        colorScheme.accent6 = cs.accent6;
        colorScheme.dk1 = cs.dk1;
        colorScheme.dk2 = cs.dk2;
        colorScheme.lt1 = cs.lt1;
        colorScheme.lt2 = cs.lt2;
      }
    }
    const warpObj = this.createThemeContent(colorScheme);

    // Check for solid fill first
    const solidFillNode = this.xmlParser.findNode(spPrNode, "solidFill");
    if (solidFillNode) {
      const solidFillObj = this.convertXmlNodeToObject(solidFillNode);
      return FillExtractor.getSolidFill(
        solidFillObj,
        undefined,
        undefined,
        warpObj
      );
    }

    // For connection shapes, stroke color is often more important than fill
    const lnNode = this.xmlParser.findNode(spPrNode, "ln");
    if (lnNode) {
      const strokeSolidFillNode = this.xmlParser.findNode(lnNode, "solidFill");
      if (strokeSolidFillNode) {
        const solidFillObj = this.convertXmlNodeToObject(strokeSolidFillNode);
        return FillExtractor.getSolidFill(
          solidFillObj,
          undefined,
          undefined,
          warpObj
        );
      }
    }

    return undefined;
  }

  private extractStrokeProperties(spPrNode: XmlNode | undefined): any {
    if (!spPrNode) return undefined;

    const lnNode = this.xmlParser.findNode(spPrNode, "ln");
    if (!lnNode) return undefined;

    const strokeProps: any = {};

    // Line width
    const w = this.xmlParser.getAttribute(lnNode, "w");
    if (w) {
      strokeProps.width = UnitConverter.emuToPointsPrecise(parseInt(w));
    }

    // Line cap
    const cap = this.xmlParser.getAttribute(lnNode, "cap");
    if (cap) {
      strokeProps.cap = cap;
    }

    // Line join
    const compd = this.xmlParser.getAttribute(lnNode, "compd");
    if (compd) {
      strokeProps.compound = compd;
    }

    // Dash pattern
    const prstDashNode = this.xmlParser.findNode(lnNode, "prstDash");
    if (prstDashNode) {
      const val = this.xmlParser.getAttribute(prstDashNode, "val");
      if (val) {
        strokeProps.dashType = val;
      }
    }

    // Head and tail arrow properties
    const headEndNode = this.xmlParser.findNode(lnNode, "headEnd");
    if (headEndNode) {
      const type = this.xmlParser.getAttribute(headEndNode, "type");
      const w = this.xmlParser.getAttribute(headEndNode, "w");
      const len = this.xmlParser.getAttribute(headEndNode, "len");
      if (type) {
        strokeProps.headArrow = { type, width: w, length: len };
      }
    }

    const tailEndNode = this.xmlParser.findNode(lnNode, "tailEnd");
    if (tailEndNode) {
      const type = this.xmlParser.getAttribute(tailEndNode, "type");
      const w = this.xmlParser.getAttribute(tailEndNode, "w");
      const len = this.xmlParser.getAttribute(tailEndNode, "len");
      if (type) {
        strokeProps.tailArrow = { type, width: w, length: len };
      }
    }

    return Object.keys(strokeProps).length > 0 ? strokeProps : undefined;
  }

  private generateConnectionPath(
    shapeType: string,
    width: number,
    height: number
  ): string {
    // Generate SVG paths for common connection shape types
    switch (shapeType) {
      case "line":
      case "straightConnector1":
        return `M 0 ${height / 2} L ${width} ${height / 2}`;

      case "bentConnector2":
        return `M 0 ${height / 2} L ${width / 2} ${height / 2} L ${
          width / 2
        } 0 L ${width} 0`;

      case "bentConnector3":
        return `M 0 ${height / 2} L ${width / 3} ${height / 2} L ${
          width / 3
        } 0 L ${(width * 2) / 3} 0 L ${(width * 2) / 3} ${
          height / 2
        } L ${width} ${height / 2}`;

      case "curvedConnector2":
        return `M 0 ${height / 2} Q ${width / 2} 0 ${width} ${height / 2}`;

      case "rightArrow":
        const arrowHead = Math.min(width * 0.2, height * 0.4);
        return `M 0 ${height * 0.3} L ${width - arrowHead} ${height * 0.3} L ${
          width - arrowHead
        } 0 L ${width} ${height / 2} L ${width - arrowHead} ${height} L ${
          width - arrowHead
        } ${height * 0.7} L 0 ${height * 0.7} Z`;

      case "leftArrow":
        const leftArrowHead = Math.min(width * 0.2, height * 0.4);
        return `M ${leftArrowHead} ${height * 0.3} L ${width} ${
          height * 0.3
        } L ${width} ${height * 0.7} L ${leftArrowHead} ${
          height * 0.7
        } L ${leftArrowHead} ${height} L 0 ${
          height / 2
        } L ${leftArrowHead} 0 Z`;

      case "custom":
        // For custom geometry, we'd need to parse the custGeom
        return this.getCustomConnectionPath(width, height);

      default:
        // Default to a simple line
        return `M 0 ${height / 2} L ${width} ${height / 2}`;
    }
  }

  private getCustomConnectionPath(width: number, height: number): string {
    // Placeholder for custom connection geometry parsing
    // This would require implementing the custom geometry parser
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  private extractTextContent(xmlNode: XmlNode): string | undefined {
    const txBodyNode = this.xmlParser.findNode(xmlNode, "p:txBody");
    if (!txBodyNode) return undefined;

    // Connection shapes rarely have text, but if they do, extract it
    const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
    let textContent = "";

    for (const pNode of paragraphs) {
      const runs = this.xmlParser.findNodes(pNode, "r");
      for (const rNode of runs) {
        const tNode = this.xmlParser.findNode(rNode, "t");
        if (tNode) {
          textContent += this.xmlParser.getTextContent(tNode);
        }
      }
      textContent += "\n";
    }

    return textContent.trim() || undefined;
  }

  private extractConnectionInfo(xmlNode: XmlNode): any {
    // Extract connection start and end information
    const connectionInfo: any = {};

    // Start connection - try both with and without namespace prefix
    let stCxnNode = this.xmlParser.findNode(xmlNode, "p:stCxn");
    if (!stCxnNode) {
      stCxnNode = this.xmlParser.findNode(xmlNode, "stCxn");
    }
    if (stCxnNode) {
      const stCxnId = this.xmlParser.getAttribute(stCxnNode, "id");
      const stCxnIdx = this.xmlParser.getAttribute(stCxnNode, "idx");
      if (stCxnId) {
        connectionInfo.startConnection = { id: stCxnId, index: stCxnIdx };
      }
    }

    // End connection - try both with and without namespace prefix
    let endCxnNode = this.xmlParser.findNode(xmlNode, "p:endCxn");
    if (!endCxnNode) {
      endCxnNode = this.xmlParser.findNode(xmlNode, "endCxn");
    }
    if (endCxnNode) {
      const endCxnId = this.xmlParser.getAttribute(endCxnNode, "id");
      const endCxnIdx = this.xmlParser.getAttribute(endCxnNode, "idx");
      if (endCxnId) {
        connectionInfo.endConnection = { id: endCxnId, index: endCxnIdx };
      }
    }

    return Object.keys(connectionInfo).length > 0 ? connectionInfo : undefined;
  }

  private convertXmlNodeToObject(xmlNode: XmlNode): any {
    const obj: any = {};

    if (xmlNode.attributes) {
      obj.attrs = xmlNode.attributes;
    }

    if (xmlNode.children && xmlNode.children.length > 0) {
      for (const child of xmlNode.children) {
        const childName = child.name.startsWith("a:")
          ? child.name
          : `a:${child.name}`;
        obj[childName] = this.convertXmlNodeToObject(child);
      }
    }

    return obj;
  }

  private createThemeContent(colorScheme: Record<string, string>): any {
    const themeContent: any = {
      "a:theme": {
        "a:themeElements": {
          "a:clrScheme": {},
        },
      },
    };

    // Map common theme colors
    const defaultColors: Record<string, any> = {
      "a:accent1": { "a:srgbClr": { attrs: { val: "002F71" } } },
      "a:accent2": { "a:srgbClr": { attrs: { val: "FBAE01" } } },
      "a:accent3": { "a:srgbClr": { attrs: { val: "002F71" } } },
      "a:accent4": { "a:srgbClr": { attrs: { val: "FBAE01" } } },
      "a:accent5": { "a:srgbClr": { attrs: { val: "002F71" } } },
      "a:accent6": { "a:srgbClr": { attrs: { val: "FBAE01" } } },
      "a:dk1": { "a:srgbClr": { attrs: { val: "000000" } } },
      "a:dk2": { "a:srgbClr": { attrs: { val: "000000" } } },
      "a:lt1": { "a:srgbClr": { attrs: { val: "FFFFFF" } } },
      "a:lt2": { "a:srgbClr": { attrs: { val: "FFFFFF" } } },
      "a:hlink": { "a:srgbClr": { attrs: { val: "0000FF" } } },
      "a:folHlink": { "a:srgbClr": { attrs: { val: "800080" } } },
    };

    // Override with actual color scheme if provided
    Object.keys(defaultColors).forEach((key) => {
      const colorKey = key.substring(2); // Remove 'a:' prefix
      if (colorScheme[colorKey]) {
        const colorValue = colorScheme[colorKey].replace("#", "");
        themeContent["a:theme"]["a:themeElements"]["a:clrScheme"][key] = {
          "a:srgbClr": { attrs: { val: colorValue } },
        };
      } else {
        themeContent["a:theme"]["a:themeElements"]["a:clrScheme"][key] =
          defaultColors[key];
      }
    });

    return { themeContent };
  }
}
