import { IElementProcessor } from '../../interfaces/IElementProcessor';
import { ProcessingContext } from '../../interfaces/ProcessingContext';
import { ImageElement } from '../../../models/domain/elements/ImageElement';
import { XmlNode } from '../../../models/xml/XmlNode';
import { IXmlParseService } from '../../interfaces/IXmlParseService';

export class ImageProcessor implements IElementProcessor<ImageElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process pic nodes (images)
    return xmlNode.name.endsWith('pic');
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<ImageElement> {
    // Extract image ID
    const nvPicPrNode = this.xmlParser.findNode(xmlNode, 'nvPicPr');
    const cNvPrNode = nvPicPrNode ? this.xmlParser.findNode(nvPicPrNode, 'cNvPr') : undefined;
    const id = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'id') || 'unknown' : 'unknown';
    
    // Extract image reference
    const blipFillNode = this.xmlParser.findNode(xmlNode, 'blipFill');
    const blipNode = blipFillNode ? this.xmlParser.findNode(blipFillNode, 'blip') : undefined;
    const embedId = blipNode ? this.xmlParser.getAttribute(blipNode, 'r:embed') : undefined;
    
    // Resolve image URL from relationships
    let imageUrl = '';
    if (embedId && context.relationships.has(embedId)) {
      const rel = context.relationships.get(embedId);
      if (rel && rel.target) {
        // In a full implementation, this would resolve to actual image data or URL
        imageUrl = rel.target;
      }
    }
    
    const imageElement = new ImageElement(id, imageUrl);
    
    // Extract position and size
    const spPrNode = this.xmlParser.findNode(xmlNode, 'spPr');
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, 'xfrm');
      if (xfrmNode) {
        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, 'off');
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, 'x');
          const y = this.xmlParser.getAttribute(offNode, 'y');
          if (x && y) {
            imageElement.setPosition({
              x: this.emuToPoints(parseInt(x)),
              y: this.emuToPoints(parseInt(y))
            });
          }
        }
        
        // Size
        const extNode = this.xmlParser.findNode(xfrmNode, 'ext');
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, 'cx');
          const cy = this.xmlParser.getAttribute(extNode, 'cy');
          if (cx && cy) {
            imageElement.setSize({
              width: this.emuToPoints(parseInt(cx)),
              height: this.emuToPoints(parseInt(cy))
            });
          }
        }
        
        // Rotation
        const rot = this.xmlParser.getAttribute(xfrmNode, 'rot');
        if (rot) {
          imageElement.setRotation(parseInt(rot) / 60000); // Convert to degrees
        }
      }
    }
    
    // Extract alt text
    if (cNvPrNode) {
      const descr = this.xmlParser.getAttribute(cNvPrNode, 'descr');
      if (descr) {
        imageElement.setAlt(descr);
      }
    }
    
    return imageElement;
  }

  getElementType(): string {
    return 'image';
  }

  private emuToPoints(emu: number): number {
    // 1 point = 12700 EMUs
    return Math.round(emu / 12700);
  }
}