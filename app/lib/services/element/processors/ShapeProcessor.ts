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

export class ShapeProcessor implements IElementProcessor<ShapeElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process shape nodes that don't contain text
    return xmlNode.name.endsWith("sp") && !this.hasTextContent(xmlNode);
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<ShapeElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, 'shape');

    // Extract geometry first to determine shape type
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    let shapeType: ShapeType = "rect"; // default

    if (spPrNode) {
      const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
      if (prstGeomNode) {
        const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
        if (prst) {
          shapeType = this.mapGeometryToShapeType(prst);
        }
      } else {
        // Check for custom geometry
        const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");
        if (custGeomNode) {
          // For custom geometry, try to detect if it's circular
          shapeType = this.analyzeCustomGeometry(custGeomNode);
        }
      }
    }

    const shapeElement = new ShapeElement(id, shapeType);

    // Extract position and size
    let width = 0, height = 0;
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
              x: UnitConverter.emuToPoints(parseInt(x)),
              y: UnitConverter.emuToPoints(parseInt(y)),
            });
          }
        }

        // Size
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            width = UnitConverter.emuToPoints(parseInt(cx));
            height = UnitConverter.emuToPoints(parseInt(cy));
            shapeElement.setSize({
              width,
              height,
            });
          }
        }

        // Rotation
        const rot = this.xmlParser.getAttribute(xfrmNode, "rot");
        if (rot) {
          shapeElement.setRotation(parseInt(rot) / 60000); // Convert to degrees
        }
      }

      // Extract fill color
      const fillColor = this.extractFillColor(spPrNode, context);
      if (fillColor) {
        shapeElement.setFill({ color: fillColor });
      }
    }

    return shapeElement;
  }

  getElementType(): string {
    return "shape";
  }

  private hasTextContent(xmlNode: XmlNode): boolean {
    const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
    if (!txBodyNode) return false;

    const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");
    for (const pNode of paragraphs) {
      const runs = this.xmlParser.findNodes(pNode, "r");
      for (const rNode of runs) {
        const tNode = this.xmlParser.findNode(rNode, "t");
        if (tNode && this.xmlParser.getTextContent(tNode).trim()) {
          return true;
        }
      }
    }

    return false;
  }

  private mapGeometryToShapeType(prst: string): ShapeType {
    // Map PowerPoint preset geometry to our shape types
    const mapping: { [key: string]: ShapeType } = {
      rect: "rect",
      roundRect: "roundRect",
      ellipse: "ellipse",
      circle: "ellipse", // Add circle mapping
      oval: "ellipse",   // Add oval mapping
      triangle: "triangle",
      diamond: "diamond",
      parallelogram: "parallelogram",
      trapezoid: "trapezoid",
      pentagon: "pentagon",
      hexagon: "hexagon",
      octagon: "octagon",
      star5: "star",
      star4: "star",
      star6: "star",
      rightArrow: "arrow",
      leftArrow: "arrow",
      upArrow: "arrow",
      downArrow: "arrow",
      callout1: "callout",
      callout2: "callout",
      callout3: "callout",
    };

    return mapping[prst] || "custom";
  }

  private extractFillColor(spPrNode: XmlNode, context: ProcessingContext): string | undefined {
    // Convert spPrNode to plain object for FillExtractor
    const spPrObj = this.xmlNodeToObject(spPrNode);
    
    // Create warpObj with theme content
    const warpObj = {
      themeContent: context.theme ? this.createThemeContent(context.theme) : undefined
    };
    
    // Use FillExtractor to get fill color
    const color = FillExtractor.getFillColor(spPrObj, undefined, undefined, warpObj);
    return color || undefined;
  }

  private xmlNodeToObject(node: XmlNode): any {
    const obj: any = {};
    
    // Add attributes
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      obj.attrs = { ...node.attributes };
    }
    
    // Add children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childName = child.name.includes(':') ? child.name : `a:${child.name}`;
        obj[childName] = this.xmlNodeToObject(child);
      }
    }
    
    return obj;
  }

  private createThemeContent(theme: any): any {
    const colorScheme = theme.getColorScheme();
    if (!colorScheme) return undefined;
    
    // Create theme structure expected by FillExtractor
    return {
      "a:theme": {
        "a:themeElements": {
          "a:clrScheme": {
            "a:accent1": { "a:srgbClr": { attrs: { val: colorScheme.accent1?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:accent2": { "a:srgbClr": { attrs: { val: colorScheme.accent2?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:accent3": { "a:srgbClr": { attrs: { val: colorScheme.accent3?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:accent4": { "a:srgbClr": { attrs: { val: colorScheme.accent4?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:accent5": { "a:srgbClr": { attrs: { val: colorScheme.accent5?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:accent6": { "a:srgbClr": { attrs: { val: colorScheme.accent6?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:dk1": { "a:srgbClr": { attrs: { val: colorScheme.dk1?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:dk2": { "a:srgbClr": { attrs: { val: colorScheme.dk2?.replace('#', '').replace(/ff$/, '') || '000000' } } },
            "a:lt1": { "a:srgbClr": { attrs: { val: colorScheme.lt1?.replace('#', '').replace(/ff$/, '') || 'FFFFFF' } } },
            "a:lt2": { "a:srgbClr": { attrs: { val: colorScheme.lt2?.replace('#', '').replace(/ff$/, '') || 'FFFFFF' } } },
            "a:hlink": { "a:srgbClr": { attrs: { val: colorScheme.hyperlink?.replace('#', '').replace(/ff$/, '') || '0000FF' } } },
            "a:folHlink": { "a:srgbClr": { attrs: { val: colorScheme.followedHyperlink?.replace('#', '').replace(/ff$/, '') || '800080' } } }
          }
        }
      }
    };
  }

  /**
   * Analyzes custom geometry to determine if it represents a known shape type
   */
  private analyzeCustomGeometry(custGeomNode: XmlNode): ShapeType {
    const pathLstNode = this.xmlParser.findNode(custGeomNode, "pathLst");
    if (!pathLstNode) return "custom";

    const pathNode = this.xmlParser.findNode(pathLstNode, "path");
    if (!pathNode) return "custom";

    // Get path dimensions
    const w = this.xmlParser.getAttribute(pathNode, "w");
    const h = this.xmlParser.getAttribute(pathNode, "h");
    
    // Check if it's square (potential circle)
    if (w === h) {
      // Look for cubic Bézier patterns that indicate circular geometry
      const cubicBezNodes = this.xmlParser.findNodes(pathNode, "cubicBezTo");
      
      // Circular custom geometry typically has 4 cubic Bézier curves
      if (cubicBezNodes.length === 4) {
        // Check if it starts from center-top (typical circle pattern)
        const moveToNode = this.xmlParser.findNode(pathNode, "moveTo");
        if (moveToNode) {
          const ptNode = this.xmlParser.findNode(moveToNode, "pt");
          if (ptNode) {
            const x = this.xmlParser.getAttribute(ptNode, "x");
            const pathWidth = parseInt(w || "0");
            const centerX = pathWidth / 2;
            
            // If starts from approximately center-top, likely a circle
            if (Math.abs(parseInt(x || "0") - centerX) < pathWidth * 0.1) {
              return "ellipse";
            }
          }
        }
      }
    }

    return "custom";
  }

}
