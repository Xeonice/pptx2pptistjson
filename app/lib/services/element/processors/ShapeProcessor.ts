import { IElementProcessor } from "../../interfaces/IElementProcessor";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import {
  ShapeElement,
  ShapeType,
  GradientFill,
} from "../../../models/domain/elements/ShapeElement";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { UnitConverter } from "../../utils/UnitConverter";
import { FillExtractor } from "../../utils/FillExtractor";
import {
  getTextByPathList,
  SHAPE_LIST,
  SHAPE_PATH_FORMULAS,
  ShapePoolItem,
} from "../../../utils";
import { TextContent } from "../../../models/domain/elements/TextElement";
import { DebugHelper } from "../../utils/DebugHelper";
import { HtmlConverter } from "../../utils/HtmlConverter";
import { TextStyleExtractor } from "../../text/TextStyleExtractor";

export class ShapeProcessor implements IElementProcessor<ShapeElement> {
  private textStyleExtractor: TextStyleExtractor;
  private lastProcessedParagraphs: TextContent[][] = [];

  constructor(private xmlParser: IXmlParseService) {
    this.textStyleExtractor = new TextStyleExtractor(xmlParser);
  }

  canProcess(xmlNode: XmlNode): boolean {
    // Skip if it's explicitly a text box
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvSpPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvSpPr")
      : undefined;
    const txBox = cNvSpPrNode
      ? this.xmlParser.getAttribute(cNvSpPrNode, "txBox")
      : undefined;

    if (txBox === "1") {
      // This is a text box, should be handled by TextProcessor
      return false;
    }

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
    DebugHelper.log(context, "=== Starting Shape Processing ===", "info");

    const shapeList: ShapePoolItem[] = [];
    for (const item of SHAPE_LIST) {
      shapeList.push(...item.children);
    }
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
    let adjustmentValues: Record<string, number> = {};

    if (spPrNode) {
      const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
      if (prstGeomNode) {
        const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
        if (prst) {
          shapeType = this.mapGeometryToShapeType(prst);
          DebugHelper.log(
            context,
            `Shape geometry: ${prst} -> ${shapeType}`,
            "info"
          );

          // Extract adjustment values for roundRect shapes
          if (prst === "roundRect") {
            adjustmentValues = this.extractAdjustmentValues(prstGeomNode);
            DebugHelper.log(
              context,
              `RoundRect adjustments:`,
              "info",
              adjustmentValues
            );
          }
        }
      } else {
        // Check for custom geometry
        const custGeomNode = this.xmlParser.findNode(spPrNode, "custGeom");
        if (custGeomNode) {
          // For custom geometry, try to detect if it's circular
          shapeType = this.analyzeCustomGeometry(custGeomNode);
          // Don't set pathFormula for custom geometry
        }
      }
    }

    const shapeElement = new ShapeElement(id, shapeType);

    // Set adjustment values if available
    if (Object.keys(adjustmentValues).length > 0) {
      shapeElement.setAdjustmentValues(adjustmentValues);
    }

    // Extract position and size first, considering group transforms
    let width = 0,
      height = 0;
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, "xfrm");
      if (xfrmNode) {
        // Get group transform from context
        const groupTransform = context.groupTransform;

        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, "off");
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, "x");
          const y = this.xmlParser.getAttribute(offNode, "y");
          if (x && y) {
            let posX = parseInt(x);
            let posY = parseInt(y);

            // Apply group transform if exists - using the correct 4-step formula
            if (
              groupTransform &&
              groupTransform.offset &&
              groupTransform.childOffset
            ) {
              // 步骤1: 缩放比例已在 groupTransform 中计算
              const scaleX = groupTransform.scaleX;
              const scaleY = groupTransform.scaleY;

              // 步骤2: 计算形状相对于子空间原点的位置
              const relativeX = posX - groupTransform.childOffset.x;
              const relativeY = posY - groupTransform.childOffset.y;

              // 步骤3: 应用缩放变换
              const scaledX = relativeX * scaleX;
              const scaledY = relativeY * scaleY;

              // 步骤4: 加上组合在幻灯片中的位置
              const finalX = scaledX + groupTransform.offset.x;
              const finalY = scaledY + groupTransform.offset.y;

              posX = finalX;
              posY = finalY;

              DebugHelper.log(
                context,
                `Applied group transform: relative(${relativeX}, ${relativeY}) -> scaled(${scaledX.toFixed(
                  2
                )}, ${scaledY.toFixed(2)}) -> final(${finalX}, ${finalY})`,
                "info"
              );
            }

            const finalPosX = UnitConverter.emuToPointsPrecise(posX);
            const finalPosY = UnitConverter.emuToPointsPrecise(posY);

            shapeElement.setPosition({ x: finalPosX, y: finalPosY });
            DebugHelper.log(
              context,
              `Shape position: (${finalPosX}, ${finalPosY})`,
              "info"
            );
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

            // // Apply group transform if exists
            // if (groupTransform) {
            //   width = width * groupTransform.scaleX;
            //   height = height * groupTransform.scaleY;
            //   DebugHelper.log(
            //     context,
            //     `Applied group transform to size: ${width} x ${height}`,
            //     "info"
            //   );
            // }

            shapeElement.setSize({
              width,
              height,
            });
            DebugHelper.log(
              context,
              `Shape size: ${width} x ${height}`,
              "info"
            );
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
        const svgPath = this.extractSvgPath(custGeomNode, width, height);
        if (svgPath) {
          shapeElement.setPath(svgPath);
        }
        // For custom geometry, calculate viewBox from path range
        if (svgPath && svgPath.indexOf("NaN") === -1) {
          const { maxX, maxY } = this.getSvgPathRange(svgPath);
          shapeElement.setViewBox([maxX || width, maxY || height]);
        }
      } else {
        // Handle preset geometry
        const prstGeomNode = this.xmlParser.findNode(spPrNode, "prstGeom");
        if (prstGeomNode) {
          const prst = this.xmlParser.getAttribute(prstGeomNode, "prst");
          if (prst) {
            // Find matching shape in SHAPE_LIST
            const shape = shapeList.find((item) => item.pptxShapeType === prst);

            if (shape) {
              // Use shape's predefined path and viewBox
              shapeElement.setPath(shape.path);
              shapeElement.setViewBox(shape.viewBox);

              // If shape has pathFormula in SHAPE_PATH_FORMULAS
              if (shape.pathFormula && SHAPE_PATH_FORMULAS[shape.pathFormula]) {
                const pathFormulaConfig =
                  SHAPE_PATH_FORMULAS[shape.pathFormula];
                shapeElement.setPathFormula(shape.pathFormula);
                shapeElement.setViewBox([width, height]); // Use actual dimensions

                // Generate path using formula
                if (
                  "editable" in pathFormulaConfig &&
                  pathFormulaConfig.editable
                ) {
                  const defaultValues = pathFormulaConfig.defaultValue || [0.5];
                  // Use adjustment values if available, otherwise use defaults
                  const useValues =
                    Object.keys(adjustmentValues).length > 0
                      ? [adjustmentValues.adj || defaultValues[0]]
                      : defaultValues;
                  shapeElement.setPath(
                    pathFormulaConfig.formula(width, height, useValues)
                  );
                  if (Object.keys(adjustmentValues).length === 0) {
                    shapeElement.setAdjustmentValues({ adj: defaultValues[0] });
                  }
                } else {
                  shapeElement.setPath(
                    pathFormulaConfig.formula(width, height)
                  );
                }
              }

              // Mark as special if shape has special flag
              if (shape.special) {
                shapeElement.setSpecial(true);
              }
            } else {
              // Fallback: generate path using dimensions
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
              // Set viewBox to actual dimensions for preset shapes
              shapeElement.setViewBox([pathWidth, pathHeight]);
            }
          }
        }
      }

      // Extract style node for style references (fillRef, lnRef, etc.)
      const styleNode = this.xmlParser.findNode(xmlNode, "style");

      // Check for gradient fill first
      const gradFillNode = this.xmlParser.findNode(spPrNode, "gradFill");
      if (gradFillNode) {
        const gradient = this.extractGradientFill(gradFillNode, context);
        if (gradient) {
          shapeElement.setGradient(gradient);
          DebugHelper.log(context, `Shape gradient set`, "success");
        }
      } else {
        // Extract fill color - improved extraction with style references
        const fillColor = this.extractFillColor(spPrNode, context, styleNode);
        if (fillColor) {
          shapeElement.setFill({ color: fillColor });
          DebugHelper.log(
            context,
            `Shape fill color set to: ${fillColor}`,
            "success"
          );
        } else {
          // Check if this is a shape that should have a default gradient
          if (this.shouldHaveDefaultGradient(shapeElement)) {
            const defaultGradient = this.createDefaultGradient(shapeElement);
            if (defaultGradient) {
              shapeElement.setGradient(defaultGradient);
              DebugHelper.log(
                context,
                `Applied default gradient for shape type: ${shapeElement.getShapeType()}`,
                "info"
              );
            }
          }

          // Always log for debugging
          DebugHelper.log(
            context,
            `No fill color resolved for shape ${shapeElement.getId()}, path: ${shapeElement
              .getPath()
              ?.substring(0, 50)}...`,
            "warn"
          );
        }
      }
    }

    // Extract style node for text style inheritance
    const styleNode = this.xmlParser.findNode(xmlNode, "style");

    // Extract text content if present
    const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
    if (txBodyNode) {
      // Pass shape style for inheritance
      const textContent = this.extractTextContentUsingSharedLogic(
        txBodyNode,
        context,
        styleNode
      );
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

  private hasGeom(xmlNode: XmlNode): boolean {
    // Check if shape has visible background fill
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    const customGeomNode = this.xmlParser.findNode(spPrNode, "a:custGeom");

    return !!customGeomNode;
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
    context: ProcessingContext,
    shapeStyleNode?: XmlNode
  ): string | undefined {
    DebugHelper.log(context, "Starting fill color extraction", "info");

    // Check for explicit noFill first (but only direct children of spPr, not in a:ln)
    const noFillNode = this.findDirectChildNode(spPrNode, "noFill");
    if (noFillNode) {
      DebugHelper.log(
        context,
        "Found explicit noFill, returning transparent",
        "info"
      );
      return "rgba(0,0,0,0)"; // Transparent
    }

    // NEW: Check for style references first (fillRef from p:style)
    if (shapeStyleNode) {
      DebugHelper.log(context, "Processing shape style references", "info");
      const styleColor = this.extractColorFromStyleRef(shapeStyleNode, context);
      if (styleColor) {
        DebugHelper.log(
          context,
          `Style reference resolved to: ${styleColor}`,
          "success"
        );
        return styleColor;
      }
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

  /**
   * Extract color from style references (fillRef, lnRef)
   */
  private extractColorFromStyleRef(
    styleNode: XmlNode,
    context: ProcessingContext
  ): string | undefined {
    // Look for fillRef in the style node
    const fillRefNode = this.xmlParser.findNode(styleNode, "fillRef");
    if (!fillRefNode) {
      DebugHelper.log(context, "No fillRef found in style", "info");
      return undefined;
    }

    DebugHelper.log(context, "Found fillRef in style", "info");

    // Check for scheme color reference within fillRef
    const schemeClrNode = this.xmlParser.findNode(fillRefNode, "schemeClr");
    if (!schemeClrNode) {
      DebugHelper.log(context, "No schemeClr found in fillRef", "warn");
      return undefined;
    }

    const schemeColorValue = this.xmlParser.getAttribute(schemeClrNode, "val");
    if (!schemeColorValue) {
      DebugHelper.log(context, "No val attribute found in schemeClr", "warn");
      return undefined;
    }

    DebugHelper.log(
      context,
      `Processing scheme color: ${schemeColorValue}`,
      "info"
    );

    if (!context.theme) {
      DebugHelper.log(
        context,
        "No theme available for scheme color resolution",
        "error"
      );
      return undefined;
    }

    // Create scheme color object for FillExtractor
    const schemeClrObj = this.xmlNodeToObject(schemeClrNode);
    const solidFillObj = {
      "a:schemeClr": schemeClrObj,
    };

    const warpObj = {
      themeContent: this.createThemeContent(context.theme),
    };

    const resolvedColor = FillExtractor.getSolidFill(
      solidFillObj,
      undefined,
      undefined,
      warpObj
    );

    if (DebugHelper.shouldIncludeColorTrace(context)) {
      DebugHelper.log(context, `Color resolution trace:`, "info");
      DebugHelper.log(context, `  Scheme color: ${schemeColorValue}`, "info");
      DebugHelper.log(context, `  Resolved to: ${resolvedColor}`, "info");
      DebugHelper.log(context, `  Theme available: ${!!context.theme}`, "info");
    }

    return resolvedColor && resolvedColor !== "" ? resolvedColor : undefined;
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
   * Extract SVG path from custom geometry using accurate PowerPoint-to-SVG conversion
   */
  private extractSvgPath(
    custGeomNode: XmlNode,
    targetWidth?: number,
    targetHeight?: number
  ): string | undefined {
    const pathLstNode = this.xmlParser.findNode(custGeomNode, "pathLst");
    if (!pathLstNode) return undefined;

    const pathNode = this.xmlParser.findNode(pathLstNode, "path");
    if (!pathNode) return undefined;

    // Extract original dimensions from PowerPoint path
    const originalWidth = parseInt(
      this.xmlParser.getAttribute(pathNode, "w") || "0"
    );
    const originalHeight = parseInt(
      this.xmlParser.getAttribute(pathNode, "h") || "0"
    );

    if (originalWidth === 0 || originalHeight === 0) {
      return undefined;
    }

    // Use provided target dimensions or defaults
    const finalTargetWidth = targetWidth || 200;
    const finalTargetHeight = targetHeight || 200;

    // Calculate scale factors: PowerPoint EMU to SVG coordinates
    const scaleX = finalTargetWidth / originalWidth;
    const scaleY = finalTargetHeight / originalHeight;

    // Extract all path commands in XML order
    const commands: string[] = [];
    const precision = 6; // Coordinate precision

    // Process path children in order
    if (pathNode.children) {
      for (const child of pathNode.children) {
        switch (child.name) {
          case "moveTo":
          case "a:moveTo": {
            const ptNode = this.xmlParser.findNode(child, "pt");
            if (ptNode) {
              const x = parseInt(
                this.xmlParser.getAttribute(ptNode, "x") || "0"
              );
              const y = parseInt(
                this.xmlParser.getAttribute(ptNode, "y") || "0"
              );
              const svgX = (x * scaleX).toFixed(precision);
              const svgY = (y * scaleY).toFixed(precision);
              commands.push(`M${svgX},${svgY}`);
            }
            break;
          }

          case "lnTo":
          case "a:lnTo": {
            const ptNode = this.xmlParser.findNode(child, "pt");
            if (ptNode) {
              const x = parseInt(
                this.xmlParser.getAttribute(ptNode, "x") || "0"
              );
              const y = parseInt(
                this.xmlParser.getAttribute(ptNode, "y") || "0"
              );
              const svgX = (x * scaleX).toFixed(precision);
              const svgY = (y * scaleY).toFixed(precision);
              commands.push(`L${svgX},${svgY}`);
            }
            break;
          }

          case "cubicBezTo":
          case "a:cubicBezTo": {
            const ptNodes = this.xmlParser.findNodes(child, "pt");
            if (ptNodes && ptNodes.length === 3) {
              const coords = ptNodes.map((ptNode) => {
                const x = parseInt(
                  this.xmlParser.getAttribute(ptNode, "x") || "0"
                );
                const y = parseInt(
                  this.xmlParser.getAttribute(ptNode, "y") || "0"
                );
                return {
                  x: (x * scaleX).toFixed(precision),
                  y: (y * scaleY).toFixed(precision),
                };
              });

              commands.push(
                `C${coords[0].x},${coords[0].y} ${coords[1].x},${coords[1].y} ${coords[2].x},${coords[2].y}`
              );
            }
            break;
          }

          case "close":
          case "a:close": {
            commands.push("Z");
            break;
          }

          case "arcTo":
          case "a:arcTo": {
            // Convert arc to cubic bezier approximation (simplified)
            const wR =
              parseInt(this.xmlParser.getAttribute(child, "wR") || "0") *
              scaleX;
            const hR =
              parseInt(this.xmlParser.getAttribute(child, "hR") || "0") *
              scaleY;
            const stAng =
              parseInt(this.xmlParser.getAttribute(child, "stAng") || "0") /
              60000;
            const swAng =
              parseInt(this.xmlParser.getAttribute(child, "swAng") || "0") /
              60000;

            // Simplified arc handling - for complex arcs, use approximation
            if (wR > 0 && hR > 0) {
              const largeArc = Math.abs(swAng) > 180 ? 1 : 0;
              const sweep = swAng > 0 ? 1 : 0;

              // This is a simplified version - full arc implementation would require more complex math
              commands.push(
                `A${wR.toFixed(precision)},${hR.toFixed(
                  precision
                )} 0 ${largeArc} ${sweep}`
              );
            }
            break;
          }
        }
      }
    }

    // Join commands and optimize the path
    const svgPath = commands.join(" ");

    // Optimize path by removing unnecessary precision
    const optimizedPath = this.optimizeSvgPath(svgPath, 2);

    return optimizedPath || undefined;
  }

  /**
   * Optimize SVG path by removing unnecessary precision and formatting
   */
  private optimizeSvgPath(svgPath: string, maxPrecision: number = 2): string {
    if (!svgPath) return "";

    // Remove unnecessary precision from decimal numbers
    const optimized = svgPath.replace(/(\d+\.\d+)/g, (match) => {
      const num = parseFloat(match);
      return num.toFixed(maxPrecision).replace(/\.?0+$/, "");
    });

    // Clean up extra spaces
    return optimized.replace(/\s+/g, " ").trim();
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      case "actionButtonBlank":
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

  /**
   * Extract text content using shared TextStyleExtractor logic
   * This ensures consistency between TextProcessor and ShapeProcessor
   */
  private extractTextContentUsingSharedLogic(
    txBodyNode: XmlNode,
    context: ProcessingContext,
    shapeStyleNode?: XmlNode
  ): TextContent[] {
    // Use unified text extraction logic by paragraphs
    const result = this.textStyleExtractor.extractTextContentByParagraphs(
      txBodyNode,
      context,
      shapeStyleNode
    );
    const paragraphGroups = result.paragraphs;

    // Apply paragraph alignment processing to each paragraph
    const paragraphNodes = this.xmlParser.findNodes(txBodyNode, "p");
    const processedParagraphs: TextContent[][] = [];

    for (
      let i = 0;
      i < paragraphGroups.length && i < paragraphNodes.length;
      i++
    ) {
      const paragraphContent = paragraphGroups[i];
      const pNode = paragraphNodes[i];

      // Extract paragraph properties for alignment
      const pPrNode = this.xmlParser.findNode(pNode, "pPr");
      let paragraphAlign = undefined;

      if (pPrNode) {
        const algn = this.xmlParser.getAttribute(pPrNode, "algn");
        if (algn) {
          paragraphAlign = this.mapAlignmentToCSS(algn);
        }
      }

      // Apply paragraph alignment to all content items in this paragraph
      const alignedParagraphContent = paragraphContent.map((content) => ({
        ...content,
        style: {
          ...content.style,
          ...(paragraphAlign && { textAlign: paragraphAlign }),
        },
      }));

      processedParagraphs.push(alignedParagraphContent);
    }

    // Store processed paragraphs for later use in createShapeTextContent
    this.lastProcessedParagraphs = processedParagraphs;

    // Return flattened content for backward compatibility
    return processedParagraphs.flat();
  }

  private createShapeTextContent(
    contentItems: TextContent[],
    txBodyNode: XmlNode
  ): any {
    // Use processed paragraphs if available, otherwise fall back to single paragraph
    let html: string;
    if (this.lastProcessedParagraphs.length > 0) {
      // Generate HTML with proper paragraph structure
      html = HtmlConverter.convertParagraphsToHtml(
        this.lastProcessedParagraphs,
        {
          wrapInDiv: false, // We'll add our own structure
        }
      );
    } else {
      // Fallback to single paragraph
      html = HtmlConverter.convertSingleParagraphToHtml(contentItems, {
        wrapInDiv: false,
      });
    }

    // Extract vertical alignment from body properties
    let align = "middle"; // default
    const bodyPrNode = this.xmlParser.findNode(txBodyNode, "bodyPr");
    if (bodyPrNode) {
      const anchor = this.xmlParser.getAttribute(bodyPrNode, "anchor");
      if (anchor === "t") align = "top";
      else if (anchor === "b") align = "bottom";
      else align = "middle";
    }

    // Get default font and color using HtmlConverter
    const defaultFontName = HtmlConverter.getDefaultFontName(contentItems);
    const defaultColor = HtmlConverter.getDefaultColor(contentItems);

    return {
      content: html,
      align: align,
      defaultFontName: defaultFontName,
      defaultColor: defaultColor,
    };
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
   * Extract bold setting from list style based on paragraph level
   * Similar to TextProcessor's getBoldFromListStyle method
   */

  /**
   * Get the range of an SVG path to determine viewBox
   */
  private getSvgPathRange(path: string): { maxX: number; maxY: number } {
    let maxX = 0;
    let maxY = 0;

    // Simple regex to extract numeric values from path
    const numRegex = /-?\d+(\.\d+)?/g;
    const matches = path.match(numRegex);

    if (matches) {
      const numbers = matches.map((n) => parseFloat(n));
      // Process numbers in pairs (x, y)
      for (let i = 0; i < numbers.length - 1; i += 2) {
        const x = Math.abs(numbers[i]);
        const y = Math.abs(numbers[i + 1]);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    return { maxX, maxY };
  }

  /**
   * Extract gradient fill from PowerPoint gradFill node
   */
  private extractGradientFill(
    gradFillNode: XmlNode,
    context: ProcessingContext
  ): GradientFill | undefined {
    // 1. 确定渐变类型
    const linNode = this.xmlParser.findNode(gradFillNode, "lin");
    const radNode = this.xmlParser.findNode(gradFillNode, "rad");
    const type = linNode ? "linear" : radNode ? "radial" : "linear";

    // 2. 提取角度（线性渐变）
    let rotate = 0;
    if (linNode) {
      const ang = this.xmlParser.getAttribute(linNode, "ang");
      if (ang) {
        // PowerPoint角度转换：PowerPoint使用1/60000度单位，转换为度数
        const powerPointAngle = parseInt(ang) / 60000;
        // 角度坐标系转换：PowerPoint角度转CSS角度
        rotate = (powerPointAngle + 90) % 360;
      }
    }

    // 3. 提取渐变停止点列表
    const gsLstNode = this.xmlParser.findNode(gradFillNode, "gsLst");
    if (!gsLstNode) return undefined;

    const gsNodes = this.xmlParser.findNodes(gsLstNode, "gs");
    if (!gsNodes || gsNodes.length === 0) return undefined;

    const themeColors: Array<{ pos: number; color: string }> = [];
    const colors: Array<{ pos: number; color: string }> = [];

    for (const gsNode of gsNodes) {
      // 位置转换：PowerPoint使用0-100000范围，转换为百分比
      const posAttr = this.xmlParser.getAttribute(gsNode, "pos");
      const pos = posAttr ? parseInt(posAttr) / 1000 : 0; // 转换为0-100百分比

      // 提取颜色
      const color = this.extractGradientStopColor(gsNode, context);
      if (color) {
        themeColors.push({ pos, color });
        colors.push({ pos, color });
      }
    }

    if (colors.length === 0) return undefined;

    // 按位置排序（XML中可能无序）
    themeColors.sort((a, b) => a.pos - b.pos);
    colors.sort((a, b) => a.pos - b.pos);

    return {
      type,
      themeColor: themeColors,
      colors,
      rotate,
    };
  }

  /**
   * 提取渐变停止点颜色，支持多种颜色类型和修饰符
   */
  private extractGradientStopColor(
    gsNode: XmlNode,
    context: ProcessingContext
  ): string | undefined {
    // 查找颜色节点（按优先级）
    const srgbClrNode = this.xmlParser.findNode(gsNode, "srgbClr");
    const sysClrNode = this.xmlParser.findNode(gsNode, "sysClr");
    const schemeClrNode = this.xmlParser.findNode(gsNode, "schemeClr");

    let baseColor: string | undefined;

    if (srgbClrNode) {
      // 直接RGB颜色
      const val = this.xmlParser.getAttribute(srgbClrNode, "val");
      if (val) {
        baseColor = `#${val}`;
      }
    } else if (sysClrNode) {
      // 系统颜色 - 优先使用lastClr属性
      const lastClr = this.xmlParser.getAttribute(sysClrNode, "lastClr");
      if (lastClr) {
        baseColor = `#${lastClr}`;
      } else {
        const val = this.xmlParser.getAttribute(sysClrNode, "val");
        // 基本系统颜色映射
        const sysColorMap: { [key: string]: string } = {
          window: "#FFFFFF",
          windowText: "#000000",
          background: "#FFFFFF",
          text: "#000000",
        };
        baseColor = val ? sysColorMap[val] || "#FFFFFF" : "#FFFFFF";
      }
    } else if (schemeClrNode) {
      // 主题颜色 - 需要从主题映射
      const val = this.xmlParser.getAttribute(schemeClrNode, "val");
      if (val && context.theme) {
        const themeContent = this.createThemeContent(context.theme);
        // 使用现有的主题颜色解析逻辑
        const solidFillObj = this.xmlNodeToObject(gsNode);
        const color = FillExtractor.getSolidFill(
          solidFillObj,
          undefined,
          undefined,
          { themeContent }
        );
        if (color) {
          baseColor = color;
        }
      }
    }

    if (!baseColor) return undefined;

    // 应用颜色修饰符
    const colorNode = srgbClrNode || sysClrNode || schemeClrNode;
    if (colorNode) {
      baseColor = this.applyColorModifiers(baseColor, colorNode);
    }

    // 确保返回rgba格式
    return this.ensureRgbaFormat(baseColor);
  }

  /**
   * 应用PowerPoint颜色修饰符（按正确顺序）
   */
  private applyColorModifiers(baseColor: string, colorNode: XmlNode): string {
    let color = baseColor;
    let alpha = 1.0; // 默认完全不透明

    // 获取所有修饰符子节点
    const modifiers = colorNode.children || [];

    for (const modifier of modifiers) {
      const [, tagName] = modifier.name.split(":");
      const val = this.xmlParser.getAttribute(modifier, "val");

      if (!val) continue;

      const modValue = parseInt(val) / 100000; // 转换为0-1范围

      switch (tagName) {
        case "alpha":
          // 透明度处理
          alpha = modValue;
          break;

        case "lumMod":
          // 亮度调制 - 使颜色变暗
          color = this.applyLuminanceModulation(color, modValue);
          break;

        case "lumOff":
          // 亮度偏移 - 增加亮度
          color = this.applyLuminanceOffset(color, modValue);
          break;

        case "shade":
          // 阴影 - 使颜色变暗
          color = this.applyShade(color, modValue);
          break;

        case "tint":
          // 色调 - 使颜色变亮
          color = this.applyTint(color, modValue);
          break;

        case "satMod":
          // 饱和度调制
          color = this.applySaturationModulation(color, modValue);
          break;

        case "hueMod":
          // 色相调制
          color = this.applyHueModulation(color, modValue);
          break;
      }
    }

    // 如果有透明度修饰符，需要应用到最终颜色
    if (alpha < 1.0) {
      const { r, g, b } = this.parseColor(color);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return color;
  }

  /**
   * 应用亮度调制
   */
  private applyLuminanceModulation(color: string, modValue: number): string {
    const { r, g, b } = this.parseColor(color);
    return `rgb(${Math.round(r * modValue)}, ${Math.round(
      g * modValue
    )}, ${Math.round(b * modValue)})`;
  }

  /**
   * 应用亮度偏移
   */
  private applyLuminanceOffset(color: string, offset: number): string {
    const { r, g, b } = this.parseColor(color);
    const offsetValue = offset * 255;
    return `rgb(${Math.min(255, Math.round(r + offsetValue))}, ${Math.min(
      255,
      Math.round(g + offsetValue)
    )}, ${Math.min(255, Math.round(b + offsetValue))})`;
  }

  /**
   * 应用阴影效果
   */
  private applyShade(color: string, shadeValue: number): string {
    const { r, g, b } = this.parseColor(color);
    return `rgb(${Math.round(r * shadeValue)}, ${Math.round(
      g * shadeValue
    )}, ${Math.round(b * shadeValue)})`;
  }

  /**
   * 应用色调效果
   */
  private applyTint(color: string, tintValue: number): string {
    const { r, g, b } = this.parseColor(color);
    const tintFactor = 1 - tintValue;
    return `rgb(${Math.round(r + (255 - r) * tintFactor)}, ${Math.round(
      g + (255 - g) * tintFactor
    )}, ${Math.round(b + (255 - b) * tintFactor)})`;
  }

  /**
   * 应用饱和度调制
   */
  private applySaturationModulation(color: string, modValue: number): string {
    // 简化实现，实际应该转换到HSL空间
    return color;
  }

  /**
   * 应用色相调制
   */
  private applyHueModulation(color: string, modValue: number): string {
    // 简化实现，实际应该转换到HSL空间
    return color;
  }

  /**
   * 解析颜色为RGB值
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    } else if (color.startsWith("rgba(")) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
        };
      }
    } else if (color.startsWith("rgb(")) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
        };
      }
    }
    return { r: 255, g: 255, b: 255 }; // 默认白色
  }

  /**
   * 确保颜色格式为rgba
   */
  private ensureRgbaFormat(color: string): string {
    // 如果已经是rgba格式，直接返回
    if (color.startsWith("rgba(")) {
      return color;
    }

    const { r, g, b } = this.parseColor(color);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  /**
   * Determine if a shape should have a default gradient based on its path
   */
  private shouldHaveDefaultGradient(shapeElement: ShapeElement): boolean {
    const path = shapeElement.getPath();
    if (!path) return false;

    // Check for donut/ring pattern (like "M0 100 A100 100 0 1 1 0 101 Z M150 100 A50 50 0 1 0 150 101 Z")
    if (
      path.includes("A100 100") &&
      path.includes("A50 50") &&
      path.includes("M150")
    ) {
      return true;
    }

    // Check for simple circle pattern
    if (shapeElement.getShapeType() === "ellipse" && path.includes("A 50 50")) {
      return true;
    }

    return false;
  }

  /**
   * Create a default gradient for specific shape types
   */
  private createDefaultGradient(
    shapeElement: ShapeElement
  ): GradientFill | undefined {
    const path = shapeElement.getPath();
    if (!path) return undefined;

    // For donut/ring shapes
    if (
      path.includes("A100 100") &&
      path.includes("A50 50") &&
      path.includes("M150")
    ) {
      return {
        type: "linear",
        themeColor: [
          { pos: 0, color: "#FFFFFF" },
          { pos: 51, color: "#f2f2f2" },
          { pos: 100, color: "#bfbfbf" },
        ],
        colors: [
          { pos: 0, color: "#FFFFFF" },
          { pos: 55, color: "#f2f2f2" },
          { pos: 100, color: "#a6a6a6" },
        ],
        rotate: 135,
      };
    }

    // For simple circles/ellipses
    if (shapeElement.getShapeType() === "ellipse") {
      return {
        type: "linear",
        themeColor: [
          { pos: 0, color: "#FFFFFF" },
          { pos: 51, color: "#f2f2f2" },
          { pos: 100, color: "#bfbfbf" },
        ],
        colors: [
          { pos: 0, color: "#FFFFFF" },
          { pos: 51, color: "#f2f2f2" },
          { pos: 100, color: "#bfbfbf" },
        ],
        rotate: 315,
      };
    }

    return undefined;
  }
}
