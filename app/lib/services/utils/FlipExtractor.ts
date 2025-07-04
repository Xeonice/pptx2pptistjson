import { IXmlParseService } from "../interfaces/IXmlParseService";
import { XmlNode } from "../../models/xml/XmlNode";

/**
 * Utility for extracting flip attributes (flipH, flipV) from PowerPoint transform nodes
 * Provides consistent flip processing across all element processors
 */
export class FlipExtractor {
  /**
   * Extract flip attributes from transform node
   * @param xmlParser - XML parser service
   * @param xfrmNode - Transform node containing flip attributes
   * @returns Flip object with horizontal and vertical flip flags, or undefined if no flips
   */
  static extractFlip(
    xmlParser: IXmlParseService,
    xfrmNode: XmlNode
  ): { horizontal: boolean; vertical: boolean } | undefined {
    if (!xfrmNode) {
      return undefined;
    }

    // Extract flip attributes from transform node
    const flipH = xmlParser.getAttribute(xfrmNode, "flipH") === "1";
    const flipV = xmlParser.getAttribute(xfrmNode, "flipV") === "1";

    // Only return flip object if at least one flip is true
    if (flipH || flipV) {
      return { horizontal: flipH, vertical: flipV };
    }

    return undefined;
  }

  /**
   * Extract flip attributes with detailed parsing
   * @param xmlParser - XML parser service  
   * @param xfrmNode - Transform node containing flip attributes
   * @returns Detailed flip information including raw attribute values
   */
  static extractFlipDetailed(
    xmlParser: IXmlParseService,
    xfrmNode: XmlNode
  ): {
    horizontal: boolean;
    vertical: boolean;
    rawFlipH?: string;
    rawFlipV?: string;
  } | undefined {
    if (!xfrmNode) {
      return undefined;
    }

    // Get raw attribute values for debugging
    const rawFlipH = xmlParser.getAttribute(xfrmNode, "flipH");
    const rawFlipV = xmlParser.getAttribute(xfrmNode, "flipV");

    // Parse flip values (PowerPoint uses "1" for true, absence or "0" for false)
    const flipH = rawFlipH === "1" || rawFlipH === "true";
    const flipV = rawFlipV === "1" || rawFlipV === "true";

    // Only return flip object if at least one flip is true
    if (flipH || flipV) {
      return {
        horizontal: flipH,
        vertical: flipV,
        rawFlipH,
        rawFlipV,
      };
    }

    return undefined;
  }

  /**
   * Check if an element has any flip transformations
   * @param xmlParser - XML parser service
   * @param xfrmNode - Transform node to check
   * @returns True if element has horizontal or vertical flip
   */
  static hasFlip(xmlParser: IXmlParseService, xfrmNode: XmlNode): boolean {
    const flip = FlipExtractor.extractFlip(xmlParser, xfrmNode);
    return flip !== undefined;
  }

  /**
   * Get flip information as a readable string for debugging
   * @param xmlParser - XML parser service
   * @param xfrmNode - Transform node containing flip attributes
   * @returns Human-readable flip description
   */
  static getFlipDescription(
    xmlParser: IXmlParseService,
    xfrmNode: XmlNode
  ): string {
    const flip = FlipExtractor.extractFlip(xmlParser, xfrmNode);
    
    if (!flip) {
      return "no flip";
    }

    const parts: string[] = [];
    if (flip.horizontal) parts.push("horizontal");
    if (flip.vertical) parts.push("vertical");
    
    return parts.join(" + ") + " flip";
  }
}