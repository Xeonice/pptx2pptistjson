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
import { getTextByPathList } from "../../../utils";
import { TextContent } from "../../../models/domain/elements/TextElement";

export class ShapeProcessor implements IElementProcessor<ShapeElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process shape nodes that have visible shape backgrounds and don't have image fill
    // This includes pure shapes and shapes with text (for the background shape)
    return (
      xmlNode.name.endsWith("sp") &&
      this.hasVisibleShapeBackground(xmlNode) &&
      !this.hasImageFill(xmlNode)
    );
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<ShapeElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "shape");

    // Extract geometry first to determine shape type
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    let shapeType: ShapeType = "rect"; // default
    let pathFormula: string | undefined;
    let adjustmentValues: Record<string, number> = {};

    if (spPrNode) {
      const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
      if (prstGeomNode) {
        const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
        if (prst) {
          shapeType = this.mapGeometryToShapeType(prst);
          pathFormula = prst; // Set the pathFormula from prst attribute

          // Extract adjustment values for roundRect shapes
          if (prst === "roundRect") {
            adjustmentValues = this.extractAdjustmentValues(prstGeomNode);
          }
        }
      } else {
        // Check for custom geometry
        const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");
        if (custGeomNode) {
          // For custom geometry, try to detect if it's circular
          shapeType = this.analyzeCustomGeometry(custGeomNode);
          pathFormula = "custom"; // For custom geometry, set as "custom"
        }
      }
    }

    const shapeElement = new ShapeElement(id, shapeType);

    // Set pathFormula if available
    if (pathFormula) {
      shapeElement.setPathFormula(pathFormula);
    }

    // Set adjustment values if available
    if (Object.keys(adjustmentValues).length > 0) {
      shapeElement.setAdjustmentValues(adjustmentValues);
    }

    // Extract position and size first
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
          shapeElement.setRotation(parseInt(rot) / 60000); // Convert to degrees
        }
      }

      // Extract SVG path from custom geometry or generate from preset
      const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");
      if (custGeomNode) {
        // Handle custom geometry
        const svgPath = this.extractSvgPath(custGeomNode);
        if (svgPath) {
          shapeElement.setPath(svgPath);
        }
      } else {
        // Handle preset geometry
        const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
        if (prstGeomNode) {
          const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
          if (prst) {
            // Use actual shape dimensions for accurate path generation
            const pathWidth = width || 200;
            const pathHeight = height || 200;
            const svgPath = this.getShapePath(
              prst,
              pathWidth,
              pathHeight,
              adjustmentValues
            );
            if (svgPath) {
              shapeElement.setPath(svgPath);
            }
          }
        }
      }

      // Extract fill color - improved extraction
      const fillColor = this.extractFillColor(spPrNode, context);
      if (fillColor) {
        shapeElement.setFill({ color: fillColor });
      } else {
      }
    }

    // Extract text content if present
    const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
    if (txBodyNode) {
      const textContent = this.extractTextContent(txBodyNode, context);
      if (textContent && textContent.length > 0) {
        // Create shape text content in PPTist format
        const shapeTextContent = this.createShapeTextContent(
          textContent,
          txBodyNode
        );
        shapeElement.setShapeTextContent(shapeTextContent);
      }
    }

    return shapeElement;
  }

  getElementType(): string {
    return "shape";
  }

  private hasImageFill(xmlNode: XmlNode): boolean {
    // Check if shape has blipFill (image fill)
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    const blipFillNode = this.xmlParser.findNode(spPrNode, "blipFill");
    return !!blipFillNode;
  }

  private hasVisibleShapeBackground(xmlNode: XmlNode): boolean {
    // Check if shape has visible background fill
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    // Check for explicit fills
    const solidFillNode = this.xmlParser.findNode(spPrNode, "solidFill");
    const gradFillNode = this.xmlParser.findNode(spPrNode, "gradFill");
    const pattFillNode = this.xmlParser.findNode(spPrNode, "pattFill");

    // Check for preset geometry (indicates a shape rather than pure text)
    const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
    const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");

    // If it has fills OR preset/custom geometry, it's likely a shape
    return !!(
      solidFillNode ||
      gradFillNode ||
      pattFillNode ||
      prstGeomNode ||
      custGeomNode
    );
  }

  private mapGeometryToShapeType(prst: string): ShapeType {
    // Map PowerPoint preset geometry to our shape types
    const mapping: { [key: string]: ShapeType } = {
      rect: "rect",
      roundRect: "roundRect",
      ellipse: "ellipse",
      circle: "ellipse", // Add circle mapping
      oval: "ellipse", // Add oval mapping
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

  private extractFillColor(
    spPrNode: XmlNode,
    context: ProcessingContext
  ): string | undefined {
    // Check for explicit noFill first (but only direct children of spPr, not in a:ln)
    const noFillNode = this.findDirectChildNode(spPrNode, "noFill");
    if (noFillNode) {
      return "rgba(0,0,0,0)"; // Transparent
    }

    // Check for direct solidFill in spPr (but only direct children of spPr, not in a:ln)
    const solidFillNode = this.findDirectChildNode(spPrNode, "solidFill");
    if (solidFillNode) {
      const solidFillObj = this.xmlNodeToObject(solidFillNode);

      // Only require theme if this solidFill contains scheme color references
      const hasSchemeColor = solidFillObj["a:schemeClr"];
      if (hasSchemeColor && !context.theme) {
        throw new Error(
          "ShapeProcessor: ProcessingContext.theme is null/undefined - cannot process scheme colors. Found schemeClr reference but no theme available."
        );
      }

      const warpObj = {
        themeContent:
          context.theme && hasSchemeColor
            ? this.createThemeContent(context.theme)
            : undefined,
      };

      const color = FillExtractor.getSolidFill(
        solidFillObj,
        undefined,
        undefined,
        warpObj
      );

      // If we got a transparent color, it means something went wrong
      if (color === "rgba(0,0,0,0)" || color === "" || !color) {
      }

      return color && color !== "" ? color : undefined;
    }

    // Use the general fill extraction method from FillExtractor as fallback
    const spPrObj = this.xmlNodeToObject(spPrNode);

    // Check if fallback path might need theme colors
    const hasSchemeColorInFallback = this.hasSchemeColorReference(spPrObj);
    if (hasSchemeColorInFallback && !context.theme) {
      throw new Error(
        "ShapeProcessor: ProcessingContext.theme is null/undefined - cannot process scheme colors in fallback path. Found schemeClr reference but no theme available."
      );
    }

    const warpObj = {
      themeContent:
        context.theme && hasSchemeColorInFallback
          ? this.createThemeContent(context.theme)
          : undefined,
    };

    const color = FillExtractor.getFillColor(
      spPrObj,
      undefined,
      undefined,
      warpObj
    );

    // Return the color if found, otherwise undefined
    return color && color !== "" ? color : undefined;
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
        const childName = child.name.includes(":")
          ? child.name
          : `a:${child.name}`;
        obj[childName] = this.xmlNodeToObject(child);
      }
    }

    return obj;
  }

  private hasSchemeColorReference(obj: any): boolean {
    if (!obj || typeof obj !== "object") return false;

    // Check if this object or any nested object contains a:schemeClr
    if (obj["a:schemeClr"]) return true;

    // Recursively check nested objects
    for (const key in obj) {
      if (
        typeof obj[key] === "object" &&
        this.hasSchemeColorReference(obj[key])
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find direct child node by name (not nested descendants)
   * This ensures we only look for immediate children of spPr,
   * not elements nested within a:ln (line properties)
   */
  private findDirectChildNode(
    parent: XmlNode,
    childName: string
  ): XmlNode | undefined {
    if (!parent.children) return undefined;

    return parent.children.find(
      (child) => child.name === childName || child.name === `a:${childName}`
    );
  }

  private createThemeContent(theme: any): any {
    if (!theme) {
      throw new Error(
        "ShapeProcessor: theme is null or undefined when trying to process scheme colors"
      );
    }

    const colorScheme = theme.getColorScheme();
    if (!colorScheme) {
      throw new Error(
        "ShapeProcessor: theme.getColorScheme() returned null/undefined - theme data is incomplete"
      );
    }

    // Create theme structure expected by FillExtractor
    const themeStructure = {
      "a:theme": {
        "a:themeElements": {
          "a:clrScheme": {
            "a:accent1": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent1 || "#002F71").replace("#", ""),
                },
              },
            },
            "a:accent2": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent2 || "#FBAE01").replace("#", ""),
                },
              },
            },
            "a:accent3": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent3 || "#002F71").replace("#", ""),
                },
              },
            },
            "a:accent4": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent4 || "#FBAE01").replace("#", ""),
                },
              },
            },
            "a:accent5": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent5 || "#002F71").replace("#", ""),
                },
              },
            },
            "a:accent6": {
              "a:srgbClr": {
                attrs: {
                  val: (colorScheme.accent6 || "#FBAE01").replace("#", ""),
                },
              },
            },
            "a:dk1": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.dk1?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:dk2": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.dk2?.replace("#", "").replace(/ff$/, "") ||
                    "000000",
                },
              },
            },
            "a:lt1": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.lt1?.replace("#", "").replace(/ff$/, "") ||
                    "FFFFFF",
                },
              },
            },
            "a:lt2": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.lt2?.replace("#", "").replace(/ff$/, "") ||
                    "FFFFFF",
                },
              },
            },
            "a:hlink": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.hyperlink
                      ?.replace("#", "")
                      .replace(/ff$/, "") || "0000FF",
                },
              },
            },
            "a:folHlink": {
              "a:srgbClr": {
                attrs: {
                  val:
                    colorScheme.followedHyperlink
                      ?.replace("#", "")
                      .replace(/ff$/, "") || "800080",
                },
              },
            },
          },
        },
      },
    };

    return themeStructure;
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

    // Check for arc commands which typically indicate circular/elliptical shapes
    const arcNodes = this.xmlParser.findNodes(pathNode, "arcTo");
    if (arcNodes.length > 0) {
      // If dimensions are equal, it's likely a circle
      if (w === h) {
        return "ellipse";
      }
      // Different dimensions but has arcs, likely an ellipse
      return "ellipse";
    }

    // Check if it's square with cubic Bézier curves (alternative circle representation)
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

    // Check for simple rectangle patterns
    const lineToNodes = this.xmlParser.findNodes(pathNode, "lnTo");
    const closeNodes = this.xmlParser.findNodes(pathNode, "close");

    if (lineToNodes.length === 3 && closeNodes.length === 1) {
      // Likely a rectangle (moveTo + 3 lineTo + close)
      return "rect";
    }

    return "custom";
  }

  /**
   * Extract SVG path from custom geometry
   */
  private extractSvgPath(custGeomNode: XmlNode): string | undefined {
    // Convert XMLNode to object format expected by getCustomShapePath
    const custShapObj = this.xmlNodeToObject(custGeomNode);

    // Use default dimensions if not specified
    const defaultWidth = 200;
    const defaultHeight = 200;

    try {
      const svgPath = this.getCustomShapePath(
        custShapObj,
        defaultWidth,
        defaultHeight
      );
      return svgPath || undefined;
    } catch (error) {
      // Fall back to original implementation if the new method fails
      console.warn(
        "Failed to extract custom shape path, falling back to original method:",
        error
      );
      return this.extractSvgPathFallback(custGeomNode);
    }
  }

  /**
   * Fallback SVG path extraction (original implementation)
   */
  private extractSvgPathFallback(custGeomNode: XmlNode): string | undefined {
    const pathLstNode = this.xmlParser.findNode(custGeomNode, "pathLst");
    if (!pathLstNode) return undefined;

    const pathNode = this.xmlParser.findNode(pathLstNode, "path");
    if (!pathNode) return undefined;

    // Get path dimensions for scaling
    const w = parseInt(this.xmlParser.getAttribute(pathNode, "w") || "0");
    const h = parseInt(this.xmlParser.getAttribute(pathNode, "h") || "0");

    let svgPath = "";
    const scaleX = w > 0 ? 200 / w : 1;
    const scaleY = h > 0 ? 200 / h : 1;

    // Process path commands
    pathNode.children?.forEach((child) => {
      switch (child.name) {
        case "moveTo":
          const movePt = this.xmlParser.findNode(child, "pt");
          if (movePt) {
            const x =
              parseInt(this.xmlParser.getAttribute(movePt, "x") || "0") *
              scaleX;
            const y =
              parseInt(this.xmlParser.getAttribute(movePt, "y") || "0") *
              scaleY;
            svgPath += `M ${x} ${y} `;
          }
          break;

        case "lnTo":
          const linePt = this.xmlParser.findNode(child, "pt");
          if (linePt) {
            const x =
              parseInt(this.xmlParser.getAttribute(linePt, "x") || "0") *
              scaleX;
            const y =
              parseInt(this.xmlParser.getAttribute(linePt, "y") || "0") *
              scaleY;
            svgPath += `L ${x} ${y} `;
          }
          break;

        case "arcTo":
          const wR =
            parseInt(this.xmlParser.getAttribute(child, "wR") || "0") * scaleX;
          const hR =
            parseInt(this.xmlParser.getAttribute(child, "hR") || "0") * scaleY;
          const stAng =
            parseInt(this.xmlParser.getAttribute(child, "stAng") || "0") /
            60000;
          const swAng =
            parseInt(this.xmlParser.getAttribute(child, "swAng") || "0") /
            60000;

          // Convert arc to SVG arc command
          // This is a simplified conversion - full implementation would calculate end point
          svgPath += `A ${wR} ${hR} 0 ${Math.abs(swAng) > 180 ? 1 : 0} ${
            swAng > 0 ? 1 : 0
          } `;
          break;

        case "cubicBezTo":
          const pts = this.xmlParser.findNodes(child, "pt");
          if (pts.length >= 3) {
            const coords = pts.map((pt) => ({
              x: parseInt(this.xmlParser.getAttribute(pt, "x") || "0") * scaleX,
              y: parseInt(this.xmlParser.getAttribute(pt, "y") || "0") * scaleY,
            }));
            svgPath += `C ${coords[0].x} ${coords[0].y}, ${coords[1].x} ${coords[1].y}, ${coords[2].x} ${coords[2].y} `;
          }
          break;

        case "close":
          svgPath += "Z ";
          break;
      }
    });

    return svgPath.trim();
  }

  private shapeArc(
    cX: number,
    cY: number,
    rX: number,
    rY: number,
    stAng: number,
    endAng: number,
    isClose: boolean
  ): string {
    let dData = "";
    let angle = stAng;

    if (endAng >= stAng) {
      while (angle <= endAng) {
        const radians = angle * (Math.PI / 180);
        const x = cX + Math.cos(radians) * rX;
        const y = cY + Math.sin(radians) * rY;
        if (angle === stAng) {
          dData = " M" + x + " " + y;
        }
        dData += " L" + x + " " + y;
        angle++;
      }
    } else {
      while (angle > endAng) {
        const radians = angle * (Math.PI / 180);
        const x = cX + Math.cos(radians) * rX;
        const y = cY + Math.sin(radians) * rY;
        if (angle === stAng) {
          dData = " M " + x + " " + y;
        }
        dData += " L " + x + " " + y;
        angle--;
      }
    }
    dData += isClose ? " z" : "";
    return dData;
  }

  private getCustomShapePath(custShapType: any, w: number, h: number): string {
    const pathLstNode = getTextByPathList(custShapType, ["a:pathLst"]);
    if (!pathLstNode) return "";

    let pathNodes = getTextByPathList(pathLstNode, ["a:path"]);
    if (!pathNodes) return "";

    if (Array.isArray(pathNodes)) pathNodes = pathNodes.shift();
    if (!pathNodes || !pathNodes["attrs"]) return "";

    const maxX = parseInt(pathNodes["attrs"]["w"] || "0");
    const maxY = parseInt(pathNodes["attrs"]["h"] || "0");
    const cX = maxX === 0 ? 0 : (1 / maxX) * w;
    const cY = maxY === 0 ? 0 : (1 / maxY) * h;
    let d = "";

    let moveToNode = getTextByPathList(pathNodes, ["a:moveTo"]);

    const lnToNodes = pathNodes["a:lnTo"];
    let cubicBezToNodes = pathNodes["a:cubicBezTo"];
    const arcToNodes = pathNodes["a:arcTo"];
    let closeNode = getTextByPathList(pathNodes, ["a:close"]);

    if (!Array.isArray(moveToNode)) moveToNode = [moveToNode];

    const multiSapeAry: any[] = [];
    if (moveToNode && moveToNode.length > 0) {
      // Handle moveTo nodes
      Object.keys(moveToNode).forEach((key) => {
        const moveToPtNode = moveToNode[key]?.["a:pt"];
        if (moveToPtNode) {
          Object.keys(moveToPtNode).forEach((ptKey) => {
            const moveToNoPt = moveToPtNode[ptKey];
            if (moveToNoPt?.["attrs"]) {
              const spX = moveToNoPt["attrs"]["x"];
              const spY = moveToNoPt["attrs"]["y"];
              const order = moveToNoPt["attrs"]["order"] || 0;
              multiSapeAry.push({
                type: "movto",
                x: spX,
                y: spY,
                order,
              });
            }
          });
        }
      });

      // Handle lineTo nodes
      if (lnToNodes) {
        Object.keys(lnToNodes).forEach((key) => {
          const lnToPtNode = lnToNodes[key]?.["a:pt"];
          if (lnToPtNode) {
            Object.keys(lnToPtNode).forEach((ptKey) => {
              const lnToNoPt = lnToPtNode[ptKey];
              if (lnToNoPt?.["attrs"]) {
                const ptX = lnToNoPt["attrs"]["x"];
                const ptY = lnToNoPt["attrs"]["y"];
                const order = lnToNoPt["attrs"]["order"] || 0;
                multiSapeAry.push({
                  type: "lnto",
                  x: ptX,
                  y: ptY,
                  order,
                });
              }
            });
          }
        });
      }

      // Handle cubic Bézier nodes
      if (cubicBezToNodes) {
        const cubicBezToPtNodesAry: any[] = [];
        if (!Array.isArray(cubicBezToNodes)) {
          cubicBezToNodes = [cubicBezToNodes];
        }
        Object.keys(cubicBezToNodes).forEach((key) => {
          const ptNode = cubicBezToNodes[key]?.["a:pt"];
          if (ptNode) {
            cubicBezToPtNodesAry.push(ptNode);
          }
        });

        cubicBezToPtNodesAry.forEach((pts) => {
          if (Array.isArray(pts)) {
            const pts_ary: any[] = [];
            pts.forEach((pt: any) => {
              if (pt?.["attrs"]) {
                const pt_obj = {
                  x: pt["attrs"]["x"],
                  y: pt["attrs"]["y"],
                };
                pts_ary.push(pt_obj);
              }
            });
            if (pts_ary.length > 0 && pts[0]?.["attrs"]) {
              const order = pts[0]["attrs"]["order"] || 0;
              multiSapeAry.push({
                type: "cubicBezTo",
                cubBzPt: pts_ary,
                order,
              });
            }
          }
        });
      }

      // Handle arc nodes
      if (arcToNodes?.["attrs"]) {
        const arcToNodesAttrs = arcToNodes["attrs"];
        const order = arcToNodesAttrs["order"] || 0;
        const hR = arcToNodesAttrs["hR"];
        const wR = arcToNodesAttrs["wR"];
        const stAng = arcToNodesAttrs["stAng"];
        const swAng = arcToNodesAttrs["swAng"];
        let shftX = 0;
        let shftY = 0;
        const arcToPtNode = getTextByPathList(arcToNodes, ["a:pt", "attrs"]);
        if (arcToPtNode) {
          shftX = arcToPtNode["x"] || 0;
          shftY = arcToPtNode["y"] || 0;
        }
        multiSapeAry.push({
          type: "arcTo",
          hR: hR,
          wR: wR,
          stAng: stAng,
          swAng: swAng,
          shftX: shftX,
          shftY: shftY,
          order,
        });
      }

      // Handle close nodes
      if (closeNode) {
        if (!Array.isArray(closeNode)) closeNode = [closeNode];
        Object.keys(closeNode).forEach(() => {
          multiSapeAry.push({
            type: "close",
            order: Infinity,
          });
        });
      }

      // Sort by order and generate path
      multiSapeAry.sort((a, b) => a.order - b.order);

      let k = 0;
      while (k < multiSapeAry.length) {
        if (multiSapeAry[k].type === "movto") {
          const spX = parseInt(multiSapeAry[k].x) * cX;
          const spY = parseInt(multiSapeAry[k].y) * cY;
          d += " M" + spX + "," + spY;
        } else if (multiSapeAry[k].type === "lnto") {
          const Lx = parseInt(multiSapeAry[k].x) * cX;
          const Ly = parseInt(multiSapeAry[k].y) * cY;
          d += " L" + Lx + "," + Ly;
        } else if (multiSapeAry[k].type === "cubicBezTo") {
          if (multiSapeAry[k].cubBzPt && multiSapeAry[k].cubBzPt.length >= 3) {
            const Cx1 = parseInt(multiSapeAry[k].cubBzPt[0].x) * cX;
            const Cy1 = parseInt(multiSapeAry[k].cubBzPt[0].y) * cY;
            const Cx2 = parseInt(multiSapeAry[k].cubBzPt[1].x) * cX;
            const Cy2 = parseInt(multiSapeAry[k].cubBzPt[1].y) * cY;
            const Cx3 = parseInt(multiSapeAry[k].cubBzPt[2].x) * cX;
            const Cy3 = parseInt(multiSapeAry[k].cubBzPt[2].y) * cY;
            d +=
              " C" +
              Cx1 +
              "," +
              Cy1 +
              " " +
              Cx2 +
              "," +
              Cy2 +
              " " +
              Cx3 +
              "," +
              Cy3;
          }
        } else if (multiSapeAry[k].type === "arcTo") {
          const hR = parseInt(multiSapeAry[k].hR) * cX;
          const wR = parseInt(multiSapeAry[k].wR) * cY;
          const stAng = parseInt(multiSapeAry[k].stAng) / 60000;
          const swAng = parseInt(multiSapeAry[k].swAng) / 60000;
          const endAng = stAng + swAng;
          d += this.shapeArc(wR, hR, wR, hR, stAng, endAng, false);
        } else if (multiSapeAry[k].type === "close") d += "z";
        k++;
      }
    }

    return d;
  }

  /**
   * Generate SVG path for preset geometric shapes
   * Based on the provided getShapePath function implementation
   */
  private getShapePath(
    presetType: string,
    w: number,
    h: number,
    adjustmentValues?: Record<string, number>
  ): string {
    switch (presetType) {
      case "rect":
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
      case "ellipse":
      case "circle": {
        const cx = w / 2;
        const ellipseRx = w / 2;
        const ellipseRy = h / 2;
        return `M ${cx} 0 A ${ellipseRx} ${ellipseRy} 0 1 1 ${cx} ${h} A ${ellipseRx} ${ellipseRy} 0 1 1 ${cx} 0 Z`;
      }
      case "triangle":
        return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;
      case "diamond":
        return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
      case "rightArrow": {
        const arrowWidth = w * 0.8;
        const arrowHeight = h * 0.6;
        const arrowY = (h - arrowHeight) / 2;
        return `M 0 ${arrowY} L ${arrowWidth} ${arrowY} L ${arrowWidth} 0 L ${w} ${
          h / 2
        } L ${arrowWidth} ${h} L ${arrowWidth} ${arrowY + arrowHeight} L 0 ${
          arrowY + arrowHeight
        } Z`;
      }
      case "leftArrow": {
        const leftArrowWidth = w * 0.8;
        const leftArrowHeight = h * 0.6;
        const leftArrowY = (h - leftArrowHeight) / 2;
        return `M ${
          w - leftArrowWidth
        } ${leftArrowY} L ${w} ${leftArrowY} L ${w} ${
          leftArrowY + leftArrowHeight
        } L ${w - leftArrowWidth} ${leftArrowY + leftArrowHeight} L ${
          w - leftArrowWidth
        } ${h} L 0 ${h / 2} L ${w - leftArrowWidth} 0 Z`;
      }
      case "upArrow": {
        const upArrowWidth = w * 0.6;
        const upArrowHeight = h * 0.8;
        const upArrowX = (w - upArrowWidth) / 2;
        return `M ${upArrowX} ${h - upArrowHeight} L ${upArrowX} ${h} L ${
          upArrowX + upArrowWidth
        } ${h} L ${upArrowX + upArrowWidth} ${h - upArrowHeight} L ${w} ${
          h - upArrowHeight
        } L ${w / 2} 0 L 0 ${h - upArrowHeight} Z`;
      }
      case "downArrow": {
        const downArrowWidth = w * 0.6;
        const downArrowHeight = h * 0.8;
        const downArrowX = (w - downArrowWidth) / 2;
        return `M ${downArrowX} 0 L ${downArrowX} ${downArrowHeight} L 0 ${downArrowHeight} L ${
          w / 2
        } ${h} L ${w} ${downArrowHeight} L ${
          downArrowX + downArrowWidth
        } ${downArrowHeight} L ${downArrowX + downArrowWidth} 0 Z`;
      }
      case "star5": {
        const centerX = w / 2;
        const centerY = h / 2;
        const outerRadius = Math.min(w, h) / 2;
        const innerRadius = outerRadius * 0.4;
        let starPath = "";
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          starPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        return starPath + " Z";
      }
      case "pentagon": {
        const pentCenterX = w / 2;
        const pentCenterY = h / 2;
        const pentRadius = Math.min(w, h) / 2;
        let pentPath = "";
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = pentCenterX + pentRadius * Math.cos(angle);
          const y = pentCenterY + pentRadius * Math.sin(angle);
          pentPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        return pentPath + " Z";
      }
      case "hexagon": {
        const hexCenterX = w / 2;
        const hexCenterY = h / 2;
        const hexRadius = Math.min(w, h) / 2;
        let hexPath = "";
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = hexCenterX + hexRadius * Math.cos(angle);
          const y = hexCenterY + hexRadius * Math.sin(angle);
          hexPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        return hexPath + " Z";
      }
      case "octagon": {
        const octCenterX = w / 2;
        const octCenterY = h / 2;
        const octRadius = Math.min(w, h) / 2;
        let octPath = "";
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const x = octCenterX + octRadius * Math.cos(angle);
          const y = octCenterY + octRadius * Math.sin(angle);
          octPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        return octPath + " Z";
      }
      case "parallelogram": {
        const skew = w * 0.2;
        return `M ${skew} 0 L ${w} 0 L ${w - skew} ${h} L 0 ${h} Z`;
      }
      case "trapezoid": {
        const topWidth = w * 0.7;
        const topOffset = (w - topWidth) / 2;
        return `M ${topOffset} 0 L ${
          topOffset + topWidth
        } 0 L ${w} ${h} L 0 ${h} Z`;
      }
      case "roundRect": {
        // Use adjustment value if available, otherwise default to 0.1 (10%)
        const adjValue =
          adjustmentValues?.adj !== undefined ? adjustmentValues.adj : 0.1;
        // Calculate corner radius based on adjustment value and minimum dimension
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

      // FlowChart shapes
      case "flowChartPredefinedProcess":
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${w * (1 / 8)} 0 L ${
          w * (1 / 8)
        } ${h} M ${w * (7 / 8)} 0 L ${w * (7 / 8)} ${h}`;

      case "flowChartInternalStorage":
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${w * (1 / 8)} 0 L ${
          w * (1 / 8)
        } ${h} M 0 ${h * (1 / 8)} L ${w} ${h * (1 / 8)}`;

      case "flowChartCollate":
        return `M 0,0 L ${w},0 L 0,${h} L ${w},${h} z`;

      case "flowChartDocument": {
        const x1 = (w * 10800) / 21600;
        const y1 = (h * 17322) / 21600;
        const y2 = (h * 20172) / 21600;
        const y3 = (h * 23922) / 21600;
        return `M 0,0 L ${w},0 L ${w},${y1} C ${x1},${y1} ${x1},${y3} 0,${y2} z`;
      }

      case "flowChartMultidocument": {
        const y1 = (h * 18022) / 21600;
        const y2 = (h * 3675) / 21600;
        const y3 = (h * 23542) / 21600;
        const y4 = (h * 1815) / 21600;
        const y5 = (h * 16252) / 21600;
        const y6 = (h * 16352) / 21600;
        const y7 = (h * 14392) / 21600;
        const y8 = (h * 20782) / 21600;
        const y9 = (h * 14467) / 21600;
        const x1 = (w * 1532) / 21600;
        const x2 = (w * 20000) / 21600;
        const x3 = (w * 9298) / 21600;
        const x4 = (w * 19298) / 21600;
        const x5 = (w * 18595) / 21600;
        const x6 = (w * 2972) / 21600;
        const x7 = (w * 20800) / 21600;
        return `M 0,${y2} L ${x5},${y2} L ${x5},${y1} C ${x3},${y1} ${x3},${y3} 0,${y8} z M ${x1},${y2} L ${x1},${y4} L ${x2},${y4} L ${x2},${y5} C ${x4},${y5} ${x5},${y6} ${x5},${y6} M ${x6},${y4} L ${x6},0 L ${w},0 L ${w},${y7} C ${x7},${y7} ${x2},${y9} ${x2},${y9}`;
      }

      // ActionButton shapes
      case "actionButtonBlank":
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;

      case "actionButtonBackPrevious": {
        const hc = w / 2;
        const vc = h / 2;
        const ss = Math.min(w, h);
        const dx2 = (ss * 3) / 8;
        const g9 = vc - dx2;
        const g10 = vc + dx2;
        const g11 = hc - dx2;
        const g12 = hc + dx2;
        return `M 0,0 L ${w},0 L ${w},${h} L 0,${h} z M ${g11},${vc} L ${g12},${g9} L ${g12},${g10} z`;
      }

      case "actionButtonBeginning": {
        const hc = w / 2;
        const vc = h / 2;
        const ss = Math.min(w, h);
        const dx2 = (ss * 3) / 8;
        const g9 = vc - dx2;
        const g10 = vc + dx2;
        const g11 = hc - dx2;
        const g12 = hc + dx2;
        const g13 = (ss * 3) / 4;
        const g14 = g13 / 8;
        const g15 = g13 / 4;
        const g16 = g11 + g14;
        const g17 = g11 + g15;
        return `M 0,0 L ${w},0 L ${w},${h} L 0,${h} z M ${g17},${vc} L ${g12},${g9} L ${g12},${g10} z M ${g16},${g9} L ${g11},${g9} L ${g11},${g10} L ${g16},${g10} z`;
      }

      case "actionButtonDocument": {
        const hc = w / 2;
        const vc = h / 2;
        const ss = Math.min(w, h);
        const dx2 = (ss * 3) / 8;
        const g9 = vc - dx2;
        const g10 = vc + dx2;
        const dx1 = (ss * 9) / 32;
        const g11 = hc - dx1;
        const g12 = hc + dx1;
        const g13 = (ss * 3) / 16;
        const g14 = g12 - g13;
        const g15 = g9 + g13;
        return `M 0,0 L ${w},0 L ${w},${h} L 0,${h} z M ${g11},${g9} L ${g14},${g9} L ${g12},${g15} L ${g12},${g10} L ${g11},${g10} z M ${g14},${g9} L ${g14},${g15} L ${g12},${g15} z`;
      }

      default:
        // Default to rectangle for unknown shapes
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    }
  }

  private extractAdjustmentValues(prstGeomNode: any): Record<string, number> {
    const adjustmentValues: Record<string, number> = {};

    // Look for adjustment value list
    const avLstNode = this.xmlParser.findNode(prstGeomNode, "avLst");
    if (avLstNode) {
      const gdNodes = this.xmlParser.findNodes(avLstNode, "gd");
      for (const gdNode of gdNodes) {
        const name = this.xmlParser.getAttribute(gdNode, "name");
        const fmla = this.xmlParser.getAttribute(gdNode, "fmla");

        if (name && fmla && fmla.startsWith("val ")) {
          // Extract numeric value from formula like "val 50000"
          const value = parseInt(fmla.substring(4));
          // Convert from EMU units to ratio (typically 50000 = 0.5)
          adjustmentValues[name] = value / 100000;
        }
      }
    }

    return adjustmentValues;
  }

  private extractTextContent(
    txBodyNode: XmlNode,
    context: ProcessingContext
  ): TextContent[] {
    const contentItems: TextContent[] = [];
    const paragraphs = this.xmlParser.findNodes(txBodyNode, "p");

    // Extract list style from txBody
    const lstStyleNode = this.xmlParser.findNode(txBodyNode, "lstStyle");
    console.log(`[TextExtract Debug] List style node found: ${!!lstStyleNode}`);

    for (const pNode of paragraphs) {
      // Extract paragraph properties
      const pPrNode = this.xmlParser.findNode(pNode, "pPr");
      let paragraphAlign = undefined;
      let paragraphLevel = 0; // Default to level 0

      console.log(
        `[TextExtract Debug] Processing paragraph, pPr node found: ${!!pPrNode}`
      );

      if (pPrNode) {
        const algn = this.xmlParser.getAttribute(pPrNode, "algn");
        if (algn) {
          paragraphAlign = this.mapAlignmentToCSS(algn);
          console.log(
            `[TextExtract Debug] Paragraph alignment: ${algn} → ${paragraphAlign}`
          );
        }

        // Extract paragraph level (lvl attribute)
        const lvl = this.xmlParser.getAttribute(pPrNode, "lvl");
        if (lvl) {
          paragraphLevel = parseInt(lvl);
          console.log(
            `[TextExtract Debug] Paragraph level found: lvl="${lvl}" → ${paragraphLevel}`
          );
        } else {
          console.log(
            `[TextExtract Debug] No 'lvl' attribute found, using default level 0`
          );
        }
      } else {
        console.log(
          `[TextExtract Debug] No paragraph properties, using defaults`
        );
      }

      const runs = this.xmlParser.findNodes(pNode, "r");

      for (const rNode of runs) {
        const tNode = this.xmlParser.findNode(rNode, "t");
        if (tNode) {
          const text = this.xmlParser.getTextContent(tNode);
          if (text.trim()) {
            // Extract run properties with font size priority logic
            const rPrNode = this.xmlParser.findNode(rNode, "rPr");
            const style = this.extractRunStyleWithFontSize(
              rPrNode,
              lstStyleNode,
              paragraphLevel,
              context
            );

            // Apply paragraph alignment to style if present
            if (paragraphAlign) {
              style.textAlign = paragraphAlign;
            }

            contentItems.push({
              text: text,
              style: style,
            });
          }
        }
      }
    }

    return contentItems;
  }

  private extractRunStyleWithFontSize(
    rPrNode: XmlNode | undefined,
    lstStyleNode: XmlNode | undefined,
    paragraphLevel: number,
    context: ProcessingContext
  ): any {
    const style: any = {};

    // Apply font size with priority logic
    const fontSize = this.getFontSizeWithPriority(
      rPrNode,
      lstStyleNode,
      paragraphLevel
    );
    if (fontSize) {
      style.fontSize = fontSize;
    }

    // Extract other run properties if rPrNode exists
    if (rPrNode) {
      // Bold
      const b = this.xmlParser.getAttribute(rPrNode, "b");
      if (b === "1" || b === "true") {
        style.bold = true;
      }

      // Italic
      const i = this.xmlParser.getAttribute(rPrNode, "i");
      if (i === "1" || i === "true") {
        style.italic = true;
      }

      // Color
      const solidFillNode = this.xmlParser.findNode(rPrNode, "solidFill");
      if (solidFillNode) {
        const solidFillObj = this.xmlNodeToObject(solidFillNode);
        const warpObj = {
          themeContent: context.theme
            ? this.createThemeContent(context.theme)
            : undefined,
        };
        const color = FillExtractor.getSolidFill(
          solidFillObj,
          undefined,
          undefined,
          warpObj
        );
        if (color) {
          style.color = color;
        }
      }
    }

    return style;
  }

  private extractRunStyle(rPrNode: XmlNode, context: ProcessingContext): any {
    const style: any = {};

    // Font size
    const sz = this.xmlParser.getAttribute(rPrNode, "sz");
    if (sz) {
      style.fontSize = Math.round((parseInt(sz) / 100) * 1.39);
    }

    // Bold
    const b = this.xmlParser.getAttribute(rPrNode, "b");
    if (b === "1" || b === "true") {
      style.bold = true;
    }

    // Italic
    const i = this.xmlParser.getAttribute(rPrNode, "i");
    if (i === "1" || i === "true") {
      style.italic = true;
    }

    // Color
    const solidFillNode = this.xmlParser.findNode(rPrNode, "solidFill");
    if (solidFillNode) {
      const solidFillObj = this.xmlNodeToObject(solidFillNode);
      const warpObj = {
        themeContent: context.theme
          ? this.createThemeContent(context.theme)
          : undefined,
      };
      const color = FillExtractor.getSolidFill(
        solidFillObj,
        undefined,
        undefined,
        warpObj
      );
      if (color) {
        style.color = color;
      }
    }

    return style;
  }

  private createShapeTextContent(
    contentItems: TextContent[],
    txBodyNode: XmlNode
  ): any {
    // Format text content in PPTist shape text format
    const html = this.formatTextContent(contentItems);

    // Extract vertical alignment from body properties
    let align = "middle"; // default
    const bodyPrNode = this.xmlParser.findNode(txBodyNode, "bodyPr");
    if (bodyPrNode) {
      const anchor = this.xmlParser.getAttribute(bodyPrNode, "anchor");
      if (anchor === "t") align = "top";
      else if (anchor === "b") align = "bottom";
      else align = "middle";
    }

    // Check for text alignment from paragraph properties
    const hasTextAlign = contentItems.some((item) => item.style?.textAlign);
    let paragraphStyle = "";

    if (hasTextAlign) {
      const textAlign = contentItems.find((item) => item.style?.textAlign)
        ?.style?.textAlign;
      if (textAlign) {
        paragraphStyle = ` style="text-align: ${textAlign}"`;
      }
    }

    // Get default font and color
    const defaultFontName = contentItems[0]?.style?.fontFamily || "Corbel";
    const defaultColor = contentItems[0]?.style?.color || "#333";

    return {
      content: `<p${paragraphStyle}>${html}</p>`,
      align: align,
      defaultFontName: defaultFontName,
      defaultColor: defaultColor,
    };
  }

  private formatTextContent(contentItems: TextContent[]): string {
    // Convert text content to HTML format for PPTist
    let html = "";

    for (const item of contentItems) {
      let span = "<span";
      const styles: string[] = [];

      if (item.style) {
        if (item.style.fontSize) {
          styles.push(`font-size: ${item.style.fontSize}px`);
        }
        if (item.style.color) {
          styles.push(`color: ${item.style.color}`);
        }
        if (item.style.fontFamily) {
          styles.push(`font-family: '${item.style.fontFamily}'`);
        }
        if (item.style.bold) {
          styles.push("font-weight: bold");
        }
        if (item.style.italic) {
          styles.push("font-style: italic");
        }
        // Don't include textAlign in span styles as it's applied at paragraph level
      }

      if (styles.length > 0) {
        span += ` style="${styles.join("; ")}"`;
      }
      span += `>${item.text}</span>`;

      html += span;
    }

    return html || "";
  }

  private mapAlignmentToCSS(algn: string): string {
    switch (algn) {
      case "l":
        return "left";
      case "ctr":
        return "center";
      case "r":
        return "right";
      case "just":
        return "justify";
      default:
        return "left";
    }
  }

  /**
   * Get font size with PPTX priority logic
   * Priority (highest to lowest):
   * 1. Text run properties (<a:rPr sz="...">)
   * 2. List style level properties (<a:lvlXpPr><a:defRPr sz="...">)
   * 3. Placeholder style (from slideLayout/slideMaster) - Not implemented here
   * 4. Default text style (<p:defaultTextStyle>) - Not implemented here
   * 5. Theme default (18pt) - fallback
   */
  private getFontSizeWithPriority(
    rPrNode: XmlNode | undefined,
    lstStyleNode: XmlNode | undefined,
    paragraphLevel: number
  ): number | undefined {
    console.log(
      `[FontSize Debug] Starting font size detection for paragraph level ${paragraphLevel}`
    );

    console.log("lstStyleNode", lstStyleNode);

    // Priority 1: Text run properties (highest priority)
    if (rPrNode) {
      const sz = this.xmlParser.getAttribute(rPrNode, "sz");
      if (sz) {
        const fontSize = Math.round((parseInt(sz) / 100) * 1.43);
        console.log(
          `[FontSize Debug] ✅ Found in text run properties: sz="${sz}" → ${
            parseInt(sz) / 100
          }pt → ${fontSize}px (Priority 1)`
        );
        return fontSize;
      } else {
        console.log(
          `[FontSize Debug] ❌ Text run properties exist but no 'sz' attribute found`
        );
      }
    } else {
      console.log(`[FontSize Debug] ❌ No text run properties (rPrNode) found`);
    }

    // Priority 2: List style level properties
    if (lstStyleNode) {
      console.log(
        `[FontSize Debug] 🔍 Checking list style for level ${paragraphLevel}`
      );
      const fontSize = this.getListStyleFontSize(lstStyleNode, paragraphLevel);
      if (fontSize) {
        console.log(
          `[FontSize Debug] ✅ Found in list style: ${fontSize}px (Priority 2)`
        );
        return fontSize;
      } else {
        console.log(
          `[FontSize Debug] ❌ No font size found in list style for level ${paragraphLevel}`
        );
      }
    } else {
      console.log(`[FontSize Debug] ❌ No list style (lstStyleNode) found`);
    }

    // Priority 3-4: Placeholder and default styles would go here
    console.log(
      `[FontSize Debug] ⏭️ Skipping placeholder and default styles (not implemented)`
    );

    // Priority 5: Theme default (18pt converted with scaling factor)
    const defaultSize = Math.round(18 * 1.43);
    console.log(
      `[FontSize Debug] 🎯 Using theme default: 18pt → ${defaultSize}px (Priority 5)`
    );
    return defaultSize;
  }

  /**
   * Extract font size from list style based on paragraph level
   * Supports lvl0pPr through lvl8pPr (levels 0-8)
   */
  private getListStyleFontSize(
    lstStyleNode: XmlNode,
    paragraphLevel: number
  ): number | undefined {
    // Clamp level to valid range (0-8)
    const level = Math.max(1, Math.min(8, paragraphLevel));

    console.log(
      `[ListStyle Debug] Searching font size for level ${paragraphLevel} (clamped to ${level})`
    );

    // Build level property name (lvl0pPr, lvl1pPr, etc.)
    const levelPropName = `lvl${level}pPr`;
    console.log(`[ListStyle Debug] Looking for node: ${levelPropName}`);

    const levelPrNode = this.xmlParser.findNode(lstStyleNode, levelPropName);
    if (levelPrNode) {
      console.log(`[ListStyle Debug] ✅ Found ${levelPropName} node`);
      const defRPrNode = this.xmlParser.findNode(levelPrNode, "defRPr");
      if (defRPrNode) {
        console.log(
          `[ListStyle Debug] ✅ Found defRPr node in ${levelPropName}`
        );
        const sz = this.xmlParser.getAttribute(defRPrNode, "sz");
        if (sz) {
          const fontSize = Math.round((parseInt(sz) / 100) * 1.43);
          console.log(
            `[ListStyle Debug] ✅ Found sz="${sz}" in ${levelPropName} → ${
              parseInt(sz) / 100
            }pt → ${fontSize}px`
          );
          return fontSize;
        } else {
          console.log(
            `[ListStyle Debug] ❌ No 'sz' attribute in ${levelPropName}/defRPr`
          );
        }
      } else {
        console.log(`[ListStyle Debug] ❌ No defRPr node in ${levelPropName}`);
      }
    } else {
      console.log(`[ListStyle Debug] ❌ No ${levelPropName} node found`);
    }

    // If current level doesn't have font size, try to inherit from parent levels
    console.log(
      `[ListStyle Debug] 🔄 Trying to inherit from parent levels (${
        level - 1
      } down to 0)`
    );
    for (let parentLevel = level - 1; parentLevel >= 0; parentLevel--) {
      const parentLevelPropName = `lvl${parentLevel}pPr`;
      console.log(
        `[ListStyle Debug] 🔍 Checking inheritance from ${parentLevelPropName}`
      );

      const parentLevelPrNode = this.xmlParser.findNode(
        lstStyleNode,
        parentLevelPropName
      );

      if (parentLevelPrNode) {
        console.log(
          `[ListStyle Debug] ✅ Found parent ${parentLevelPropName} node`
        );
        const defRPrNode = this.xmlParser.findNode(parentLevelPrNode, "defRPr");
        if (defRPrNode) {
          console.log(
            `[ListStyle Debug] ✅ Found defRPr in parent ${parentLevelPropName}`
          );
          const sz = this.xmlParser.getAttribute(defRPrNode, "sz");
          if (sz) {
            const fontSize = Math.round((parseInt(sz) / 100) * 1.43);
            console.log(
              `[ListStyle Debug] ✅ Inherited sz="${sz}" from ${parentLevelPropName} → ${
                parseInt(sz) / 100
              }pt → ${fontSize}px`
            );
            return fontSize;
          } else {
            console.log(
              `[ListStyle Debug] ❌ No 'sz' attribute in parent ${parentLevelPropName}/defRPr`
            );
          }
        } else {
          console.log(
            `[ListStyle Debug] ❌ No defRPr in parent ${parentLevelPropName}`
          );
        }
      } else {
        console.log(
          `[ListStyle Debug] ❌ No parent ${parentLevelPropName} node found`
        );
      }
    }

    console.log(
      `[ListStyle Debug] ❌ No font size found in any level (current or inherited)`
    );
    return undefined;
  }
}
