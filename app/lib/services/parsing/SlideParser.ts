import JSZip from "jszip";
import { Slide, SlideBackground } from "../../models/domain/Slide";
import { Theme } from "../../models/domain/Theme";
import { IFileService } from "../interfaces/IFileService";
import { IXmlParseService } from "../interfaces/IXmlParseService";
import { XmlNode } from "../../models/xml/XmlNode";
import {
  ProcessingContext,
  GroupTransform,
} from "../interfaces/ProcessingContext";
import { IElementProcessor } from "../interfaces/IElementProcessor";
import { Element } from "../../models/domain/elements/Element";
import { IdGenerator } from "../utils/IdGenerator";
import { ColorUtils } from "../utils/ColorUtils";
import { ImageDataService } from "../images/ImageDataService";
import { ParseOptions } from "../../models/dto/ParseOptions";
import { DebugHelper } from "../utils/DebugHelper";

export class SlideParser {
  private elementProcessors: Map<string, IElementProcessor> = new Map();

  constructor(
    private fileService: IFileService,
    private xmlParser: IXmlParseService,
    private imageDataService?: ImageDataService
  ) {}

  registerElementProcessor(processor: IElementProcessor): void {
    this.elementProcessors.set(processor.getElementType(), processor);
  }

  async parse(
    zip: JSZip,
    slidePath: string,
    slideNumber: number,
    theme?: Theme,
    relationships?: Map<string, any>,
    options?: ParseOptions
  ): Promise<Slide> {
    try {
      const slideXml = await this.fileService.extractFile(zip, slidePath);

      const slideNode = this.xmlParser.parse(slideXml);

      // Extract slide ID from path
      const slideId = this.extractSlideId(slidePath);
      const slide = new Slide(slideId, slideNumber);

      // Create processing context
      const context: ProcessingContext = {
        zip,
        slideNumber,
        slideId,
        theme,
        relationships: relationships || new Map(),
        basePath: slidePath.substring(0, slidePath.lastIndexOf("/")),
        options: options || {},
        warnings: [],
        idGenerator: new IdGenerator(),
      };

      DebugHelper.log(
        context,
        `=== Starting Slide Processing: ${slideId} ===`,
        "info"
      );

      // Parse background
      const background = await this.parseBackground(slideNode, context);
      if (background) {
        slide.setBackground(background);
      }

      // Parse elements
      const elements = await this.parseElements(slideNode, context);

      elements.forEach((element) => {
        slide.addElement(element);
      });

      return slide;
    } catch (error) {
      throw new Error(
        `Failed to parse slide ${slidePath}: ${(error as Error).message}`
      );
    }
  }

  private extractSlideId(slidePath: string): string {
    const match = slidePath.match(/slide(\d+)\.xml$/);
    return match ? match[1] : "unknown";
  }

  private async parseBackground(
    slideNode: XmlNode,
    context: ProcessingContext
  ): Promise<SlideBackground | undefined> {
    const bgNode = this.xmlParser.findNode(slideNode, "bg");
    if (!bgNode) {
      return undefined;
    }

    const bgPrNode = this.xmlParser.findNode(bgNode, "bgPr");
    if (!bgPrNode) {
      return undefined;
    }

    // Check for solid fill
    const solidFillNode = this.xmlParser.findNode(bgPrNode, "solidFill");
    if (solidFillNode) {
      const color = this.extractColor(solidFillNode);
      if (color) {
        return {
          type: "solid",
          color,
        };
      }
    }

    // Check for gradient fill
    const gradFillNode = this.xmlParser.findNode(bgPrNode, "gradFill");
    if (gradFillNode) {
      const colors = this.extractGradientColors(gradFillNode);
      if (colors.length > 0) {
        return {
          type: "gradient",
          colors,
        };
      }
    }

    // Check for image fill
    const blipFillNode = this.xmlParser.findNode(bgPrNode, "blipFill");
    if (blipFillNode) {
      const blipNode = this.xmlParser.findNode(blipFillNode, "blip");
      if (blipNode) {
        const embedId = this.xmlParser.getAttribute(blipNode, "r:embed");
        if (embedId) {
          // Try to extract actual image data if ImageDataService is available
          if (this.imageDataService) {
            try {
              const imageData = await this.imageDataService.extractImageData(
                embedId,
                context
              );
              if (imageData) {
                const dataUrl = this.imageDataService.encodeToBase64(imageData);
                return {
                  type: "image",
                  imageUrl: dataUrl,
                  imageData: imageData, // Store raw data for potential cloud upload
                };
              }
            } catch (error) {
              console.warn(
                `Failed to process background image data for ${embedId}:`,
                error
              );
              // Fall back to relationship-based URL
            }
          }

          // Fallback: resolve from relationships for backward compatibility
          let resolvedUrl = embedId;
          if (context.relationships.has(embedId)) {
            const rel = context.relationships.get(embedId);
            if (rel && rel.target) {
              resolvedUrl = rel.target;
            }
          }

          return {
            type: "image",
            imageUrl: resolvedUrl,
          };
        }
      }
    }

    return undefined;
  }

  private async parseElements(
    slideNode: XmlNode,
    context: ProcessingContext
  ): Promise<Element[]> {
    const elements: Element[] = [];
    const spTreeNode = this.xmlParser.findNode(slideNode, "spTree");

    if (!spTreeNode || !spTreeNode.children) {
      return elements;
    }

    for (const child of spTreeNode.children) {
      const nodeElements = await this.processNode(child, context);
      if (nodeElements) {
        if (Array.isArray(nodeElements)) {
          elements.push(...nodeElements);
        } else {
          elements.push(nodeElements);
        }
      }
    }

    return elements;
  }

  private async processNode(
    node: XmlNode,
    context: ProcessingContext
  ): Promise<Element | Element[] | undefined> {
    // Debug logging for node processing
    if (node.name.endsWith("sp") || node.name.endsWith("pic")) {
      const cNvPrNode = this.xmlParser.findNode(node, "cNvPr");
      const name = cNvPrNode
        ? this.xmlParser.getAttribute(cNvPrNode, "name")
        : "unnamed";
      const id = cNvPrNode
        ? this.xmlParser.getAttribute(cNvPrNode, "id")
        : "no-id";

      // Check for blipFill
      const hasBlipFill =
        !!this.xmlParser.findNode(node, "blipFill") ||
        (this.xmlParser.findNode(node, "spPr") &&
          !!this.xmlParser.findNode(
            this.xmlParser.findNode(node, "spPr")!,
            "blipFill"
          ));

      console.log(
        `[Slide ${context.slideNumber}] Processing ${node.name} - Name: "${name}", ID: ${id}, HasBlipFill: ${hasBlipFill}`
      );
    }

    // Single processor handling - let each processor handle the complete node
    const processors = Array.from(this.elementProcessors.values());

    for (const processor of processors) {
      if (processor.canProcess(node)) {
        try {
          const result = await processor.process(node, context);
          console.log(
            `[Slide ${
              context.slideNumber
            }] Processed as ${processor.getElementType()}`
          );
          return result;
        } catch (error) {
          console.error(
            `处理器 ${processor.getElementType()} 处理 ${node.name} 失败:`,
            error
          );
          context.warnings.push({
            level: "error",
            message: `Failed to process ${node.name}: ${
              (error as Error).message
            }`,
            slideNumber: context.slideNumber,
          });
        }
      }
    }

    // Handle group nodes recursively with transform calculation
    if (node.name.endsWith("grpSp") && node.children) {
      const groupElements: Element[] = [];

      // Extract group transform information
      const currentGroupTransform = this.extractGroupTransformInfo(node);

      // Accumulate group transforms if we're inside a nested group
      const accumulatedGroupTransform = this.accumulateGroupTransforms(
        context.groupTransform,
        currentGroupTransform
      );

      // Create enhanced context with accumulated group transform
      const enhancedContext = {
        ...context,
        groupTransform: accumulatedGroupTransform,
      };

      for (const child of node.children) {
        const element = await this.processNode(child, enhancedContext);
        if (element) {
          if (Array.isArray(element)) {
            groupElements.push(...element);
          } else {
            groupElements.push(element);
          }
        }
      }

      // Apply group transforms to all child elements
      if (accumulatedGroupTransform && groupElements.length > 0) {
        this.applyGroupTransformToElements(
          groupElements,
          accumulatedGroupTransform
        );
      }

      return groupElements.length > 0 ? groupElements : undefined;
    }

    return undefined;
  }

  private extractColor(fillNode: XmlNode): string | undefined {
    // Check for srgbClr
    const srgbNode = this.xmlParser.findNode(fillNode, "srgbClr");
    if (srgbNode) {
      const val = this.xmlParser.getAttribute(srgbNode, "val");
      if (val) {
        return ColorUtils.toRgba(`#${val}`);
      }
    }

    // Check for schemeClr
    const schemeClrNode = this.xmlParser.findNode(fillNode, "schemeClr");
    if (schemeClrNode) {
      const val = this.xmlParser.getAttribute(schemeClrNode, "val");
      if (val) {
        // This would need theme color resolution
        return val;
      }
    }

    return undefined;
  }

  private extractGradientColors(
    gradFillNode: XmlNode
  ): Array<{ color: string; position: number }> {
    const colors: Array<{ color: string; position: number }> = [];
    const gsLstNode = this.xmlParser.findNode(gradFillNode, "gsLst");

    if (!gsLstNode || !gsLstNode.children) {
      return colors;
    }

    for (const gsNode of gsLstNode.children) {
      if (gsNode.name.endsWith("gs")) {
        const pos = this.xmlParser.getAttribute(gsNode, "pos");
        const color = this.extractColor(gsNode);

        if (pos && color) {
          colors.push({
            color,
            position: parseInt(pos) / 100000,
          });
        }
      }
    }

    return colors.sort((a, b) => a.position - b.position);
  }

  /**
   * Extract group transform information from grpSp node
   * @param grpSpNode - The group shape node
   * @returns Group transform info or undefined
   */
  private extractGroupTransformInfo(
    grpSpNode: XmlNode
  ): GroupTransform | undefined {
    // Find grpSpPr node
    const grpSpPrNode = this.xmlParser.findNode(grpSpNode, "grpSpPr");
    if (!grpSpPrNode) return undefined;

    // Find xfrm node
    const xfrmNode = this.xmlParser.findNode(grpSpPrNode, "xfrm");
    if (!xfrmNode) return undefined;

    // Extract group position (off)
    const offNode = this.xmlParser.findNode(xfrmNode, "off");
    // Extract group actual size (ext)
    const extNode = this.xmlParser.findNode(xfrmNode, "ext");
    // Extract child space offset (chOff)
    const chOffNode = this.xmlParser.findNode(xfrmNode, "chOff");
    // Extract child space extent (chExt)
    const chExtNode = this.xmlParser.findNode(xfrmNode, "chExt");

    if (!extNode || !chExtNode || !offNode || !chOffNode) return undefined;

    const groupX = this.xmlParser.getAttribute(offNode, "x");
    const groupY = this.xmlParser.getAttribute(offNode, "y");
    const actualCx = this.xmlParser.getAttribute(extNode, "cx");
    const actualCy = this.xmlParser.getAttribute(extNode, "cy");
    const childOffsetX = this.xmlParser.getAttribute(chOffNode, "x");
    const childOffsetY = this.xmlParser.getAttribute(chOffNode, "y");
    const childCx = this.xmlParser.getAttribute(chExtNode, "cx");
    const childCy = this.xmlParser.getAttribute(chExtNode, "cy");

    if (
      !groupX ||
      !groupY ||
      !actualCx ||
      !actualCy ||
      !childOffsetX ||
      !childOffsetY ||
      !childCx ||
      !childCy
    )
      return undefined;

    // Calculate scale factors with proper precision
    const scaleX = parseFloat(actualCx) / parseFloat(childCx);
    const scaleY = parseFloat(actualCy) / parseFloat(childCy);

    // Validate scale factors
    if (!isFinite(scaleX) || !isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      console.warn(`Invalid group scale factors: scaleX=${scaleX}, scaleY=${scaleY}`);
      return undefined;
    }

    // Extract rotation (convert from EMU to degrees)
    const rot = this.xmlParser.getAttribute(xfrmNode, "rot");
    const rotation = rot ? parseInt(rot) / 60000 : undefined;

    // Extract flip attributes
    const flipH = this.xmlParser.getAttribute(xfrmNode, "flipH") === "1";
    const flipV = this.xmlParser.getAttribute(xfrmNode, "flipV") === "1";

    // Debug logging
    console.log(`[Group Transform] scaleX: ${scaleX.toFixed(4)}, scaleY: ${scaleY.toFixed(4)}, rotation: ${rotation || 0}°`);

    return {
      scaleX,
      scaleY,
      offset: {
        x: parseInt(groupX),
        y: parseInt(groupY),
      },
      childOffset: {
        x: parseInt(childOffsetX),
        y: parseInt(childOffsetY),
      },
      flip: flipH || flipV ? { horizontal: flipH, vertical: flipV } : undefined,
      rotation,
    };
  }

  /**
   * Accumulate group transforms for nested groups
   * @param parentTransform - Parent group transform (if any)
   * @param currentTransform - Current group transform
   * @returns Accumulated transform
   */
  private accumulateGroupTransforms(
    parentTransform: GroupTransform | undefined,
    currentTransform: GroupTransform | undefined
  ): GroupTransform | undefined {
    if (!currentTransform) return parentTransform;
    if (!parentTransform) return currentTransform;

    // Accumulate scale factors (multiply)
    const scaleX = parentTransform.scaleX * currentTransform.scaleX;
    const scaleY = parentTransform.scaleY * currentTransform.scaleY;

    // Calculate accumulated offsets
    // Current group's position in parent's coordinate system
    const currentOffsetX = currentTransform.offset?.x || 0;
    const currentOffsetY = currentTransform.offset?.y || 0;

    // Transform current group's position by parent's scale and offset
    const parentOffsetX = parentTransform.offset?.x || 0;
    const parentOffsetY = parentTransform.offset?.y || 0;
    const parentChildOffsetX = parentTransform.childOffset?.x || 0;
    const parentChildOffsetY = parentTransform.childOffset?.y || 0;

    // Apply parent's transformation to current group's position
    const transformedOffsetX =
      (currentOffsetX - parentChildOffsetX) * parentTransform.scaleX +
      parentOffsetX;
    const transformedOffsetY =
      (currentOffsetY - parentChildOffsetY) * parentTransform.scaleY +
      parentOffsetY;

    // For child offset, we use the current group's child offset directly
    // It defines the coordinate system for this group's children
    const currentChildOffsetX = currentTransform.childOffset?.x || 0;
    const currentChildOffsetY = currentTransform.childOffset?.y || 0;

    // Handle flip accumulation
    let accumulatedFlip = undefined;
    if (currentTransform.flip || parentTransform.flip) {
      const parentFlipH = parentTransform.flip?.horizontal || false;
      const parentFlipV = parentTransform.flip?.vertical || false;
      const currentFlipH = currentTransform.flip?.horizontal || false;
      const currentFlipV = currentTransform.flip?.vertical || false;
      
      accumulatedFlip = {
        horizontal: parentFlipH !== currentFlipH, // XOR for flip accumulation
        vertical: parentFlipV !== currentFlipV
      };
    }

    // Debug logging
    console.log(`[Accumulate Transform] Parent scale: ${parentTransform.scaleX.toFixed(4)}x${parentTransform.scaleY.toFixed(4)}, ` +
                `Current scale: ${currentTransform.scaleX.toFixed(4)}x${currentTransform.scaleY.toFixed(4)}, ` +
                `Accumulated: ${scaleX.toFixed(4)}x${scaleY.toFixed(4)}`);

    return {
      scaleX,
      scaleY,
      offset: {
        x: transformedOffsetX,
        y: transformedOffsetY,
      },
      childOffset: {
        x: currentChildOffsetX,
        y: currentChildOffsetY,
      },
      flip: accumulatedFlip,
      rotation:
        (currentTransform.rotation || 0) + (parentTransform.rotation || 0),
    };
  }

  /**
   * Apply group transforms to child elements
   * Note: Position transforms are already applied by GroupTransformUtils in element processors
   * This method only applies size scaling, rotation, and flip transformations
   * @param elements - Array of elements to transform
   * @param groupTransform - Group transform information
   */
  private applyGroupTransformToElements(
    elements: Element[],
    groupTransform: GroupTransform
  ): void {
    console.log(`[Apply Group Transform] Processing ${elements.length} elements with scale: ${groupTransform.scaleX.toFixed(4)}x${groupTransform.scaleY.toFixed(4)}`);
    
    for (const element of elements) {
      // Apply size scaling to all elements that have size properties
      // Use duck typing to check for size methods
      if ('getSize' in element && 'setSize' in element && typeof element.getSize === 'function' && typeof element.setSize === 'function') {
        const currentSize = (element as any).getSize();
        if (currentSize) {
          const newWidth = currentSize.width * groupTransform.scaleX;
          const newHeight = currentSize.height * groupTransform.scaleY;
          
          console.log(`[Apply Transform] Element size: ${currentSize.width}x${currentSize.height} -> ${newWidth.toFixed(2)}x${newHeight.toFixed(2)}`);
          
          (element as any).setSize({
            width: newWidth,
            height: newHeight,
          });
        }
      }
      
      // Apply rotation if element supports it
      if (groupTransform.rotation && 'getRotation' in element && 'setRotation' in element && 
          typeof element.getRotation === 'function' && typeof element.setRotation === 'function') {
        const currentRotation = (element as any).getRotation() || 0;
        const newRotation = currentRotation + groupTransform.rotation;
        (element as any).setRotation(newRotation);
        console.log(`[Apply Transform] Element rotation: ${currentRotation}° -> ${newRotation}°`);
      }
      
      // Apply flip if element supports it and group has flip
      if (groupTransform.flip && 'setFlip' in element && typeof element.setFlip === 'function') {
        (element as any).setFlip(groupTransform.flip);
        console.log(`[Apply Transform] Element flip: horizontal=${groupTransform.flip.horizontal}, vertical=${groupTransform.flip.vertical}`);
      }
    }
  }
}
