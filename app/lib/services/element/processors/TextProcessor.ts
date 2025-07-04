import { IElementProcessor } from "../../interfaces/IElementProcessor";
import {
  TextElement,
} from "../../../models/domain/elements/TextElement";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import { UnitConverter } from "../../utils/UnitConverter";
import { TextStyleExtractor } from "../../text/TextStyleExtractor";
import { GroupTransformUtils } from "../../utils/GroupTransformUtils";
import { RotationExtractor } from "../../utils/RotationExtractor";
import { FlipExtractor } from "../../utils/FlipExtractor";
import { DebugHelper } from "../../utils/DebugHelper";

export class TextProcessor implements IElementProcessor<TextElement> {
  private textStyleExtractor: TextStyleExtractor;

  constructor(private xmlParser: IXmlParseService) {
    this.textStyleExtractor = new TextStyleExtractor(xmlParser);
  }

  canProcess(xmlNode: XmlNode): boolean {
    // Check if this is a text box
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvSpPrNode = nvSpPrNode ? this.xmlParser.findNode(nvSpPrNode, "cNvSpPr") : undefined;
    const txBox = cNvSpPrNode ? this.xmlParser.getAttribute(cNvSpPrNode, "txBox") : undefined;
    
    if (txBox === "1") {
      // This is explicitly a text box
      return true;
    }
    
    // Only process pure text elements without shape backgrounds
    // Shape elements with text are handled by ShapeProcessor
    return (
      xmlNode.name.endsWith("sp") &&
      this.hasTextContent(xmlNode) &&
      !this.hasGeom(xmlNode) &&
      !this.hasImageFill(xmlNode) &&
      !this.hasShapeBackground(xmlNode)
    );
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<TextElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
    const cNvPrNode = nvSpPrNode
      ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
      : undefined;
    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "text");

    const textElement = new TextElement(id);

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
            let posX = parseInt(x);
            let posY = parseInt(y);

            // Apply group transform if exists
            const transformedCoords = GroupTransformUtils.applyGroupTransformIfExists(
              posX,
              posY,
              context
            );
            posX = transformedCoords.x;
            posY = transformedCoords.y;

            textElement.setPosition({
              x: UnitConverter.emuToPoints(posX),
              y: UnitConverter.emuToPoints(posY),
            });
          }
        }

        // Size
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
          if (cx && cy) {
            textElement.setSize({
              width: UnitConverter.emuToPoints(parseInt(cx)),
              height: UnitConverter.emuToPoints(parseInt(cy)),
            });
          }
        }

        // Rotation - 使用统一的旋转提取工具
        const rotation = RotationExtractor.extractRotation(this.xmlParser, xfrmNode);
        if (rotation !== 0) {
          textElement.setRotation(rotation);
        }

        // Flip attributes - 使用统一的翻转提取工具
        const flip = FlipExtractor.extractFlip(this.xmlParser, xfrmNode);
        if (flip) {
          textElement.setFlip(flip);
          DebugHelper.log(
            context,
            `Text flip: ${FlipExtractor.getFlipDescription(this.xmlParser, xfrmNode)}`,
            "info"
          );
        }
      }
    }

    // Check if this element has a visible shape background
    const hasShapeBackground = this.hasShapeBackground(xmlNode);

    // If it has both text and shape background, append "_text" to the ID
    if (hasShapeBackground) {
      const textId = id + "_text";
      const finalTextElement = new TextElement(textId);

      // Copy position and size to text element
      const position = textElement.getPosition();
      const size = textElement.getSize();
      const rotation = textElement.getRotation();
      if (position) finalTextElement.setPosition(position);
      if (size) finalTextElement.setSize(size);
      if (rotation) finalTextElement.setRotation(rotation);

      // Extract text content organized by paragraphs
      const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
      if (txBodyNode) {
        const result = this.textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);
        finalTextElement.setParagraphs(result.paragraphs);
        
        // Set line height on TextElement level if extracted
        if (result.lineHeight) {
          const existingStyle = finalTextElement.getTextStyle() || {};
          finalTextElement.setTextStyle({ ...existingStyle, lineHeight: result.lineHeight });
        }
      }

      return finalTextElement;
    } else {
      // Pure text element without shape background
      // Extract text content organized by paragraphs
      const txBodyNode = this.xmlParser.findNode(xmlNode, "txBody");
      if (txBodyNode) {
        const result = this.textStyleExtractor.extractTextContentByParagraphs(txBodyNode, context);
        textElement.setParagraphs(result.paragraphs);
        
        // Set line height on TextElement level if extracted
        if (result.lineHeight) {
          const existingStyle = textElement.getTextStyle() || {};
          textElement.setTextStyle({ ...existingStyle, lineHeight: result.lineHeight });
        }
      }

      return textElement;
    }
  }

  getElementType(): string {
    return "text";
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

  private hasGeom(xmlNode: XmlNode): boolean {
    // Check if shape has visible background fill
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    const customGeomNode = this.xmlParser.findNode(spPrNode, "a:custGeom");

    return !!customGeomNode;
  }

  private hasImageFill(xmlNode: XmlNode): boolean {
    // Check if shape has blipFill (image fill)
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    const blipFillNode = this.xmlParser.findNode(spPrNode, "blipFill");
    return !!blipFillNode;
  }

  private hasShapeBackground(xmlNode: XmlNode): boolean {
    // Check if shape has fill background (solid fill, gradient, etc.)
    const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    if (!spPrNode) return false;

    // Check for any fill type
    const solidFillNode = this.xmlParser.findNode(spPrNode, "solidFill");
    const gradFillNode = this.xmlParser.findNode(spPrNode, "gradFill");
    const pattFillNode = this.xmlParser.findNode(spPrNode, "pattFill");

    return !!(solidFillNode || gradFillNode || pattFillNode);
  }
}
