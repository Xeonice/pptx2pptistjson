import { IElementProcessor } from '../../interfaces/IElementProcessor';
import { ProcessingContext } from '../../interfaces/ProcessingContext';
import { ShapeElement, ShapeType } from '../../../models/domain/elements/ShapeElement';
import { XmlNode } from '../../../models/xml/XmlNode';
import { IXmlParseService } from '../../interfaces/IXmlParseService';

export class ShapeProcessor implements IElementProcessor<ShapeElement> {
  constructor(private xmlParser: IXmlParseService) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process shape nodes that don't contain text
    return xmlNode.name.endsWith('sp') && !this.hasTextContent(xmlNode);
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<ShapeElement> {
    // Extract shape ID
    const nvSpPrNode = this.xmlParser.findNode(xmlNode, 'nvSpPr');
    const cNvPrNode = nvSpPrNode ? this.xmlParser.findNode(nvSpPrNode, 'cNvPr') : undefined;
    const id = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'id') || 'unknown' : 'unknown';
    
    // Extract geometry first to determine shape type
    const spPrNode = this.xmlParser.findNode(xmlNode, 'spPr');
    let shapeType: ShapeType = 'rect'; // default
    
    if (spPrNode) {
      const prstGeomNode = this.xmlParser.findNode(spPrNode, 'prstGeom');
      if (prstGeomNode) {
        const prst = this.xmlParser.getAttribute(prstGeomNode, 'prst');
        if (prst) {
          shapeType = this.mapGeometryToShapeType(prst);
        }
      }
    }
    
    const shapeElement = new ShapeElement(id, shapeType);
    
    // Extract position and size
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, 'xfrm');
      if (xfrmNode) {
        // Position
        const offNode = this.xmlParser.findNode(xfrmNode, 'off');
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, 'x');
          const y = this.xmlParser.getAttribute(offNode, 'y');
          if (x && y) {
            shapeElement.setPosition({
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
            shapeElement.setSize({
              width: this.emuToPoints(parseInt(cx)),
              height: this.emuToPoints(parseInt(cy))
            });
          }
        }
        
        // Rotation
        const rot = this.xmlParser.getAttribute(xfrmNode, 'rot');
        if (rot) {
          shapeElement.setRotation(parseInt(rot) / 60000); // Convert to degrees
        }
      }
    }
    
    return shapeElement;
  }

  getElementType(): string {
    return 'shape';
  }

  private hasTextContent(xmlNode: XmlNode): boolean {
    const txBodyNode = this.xmlParser.findNode(xmlNode, 'txBody');
    if (!txBodyNode) return false;
    
    const paragraphs = this.xmlParser.findNodes(txBodyNode, 'p');
    for (const pNode of paragraphs) {
      const runs = this.xmlParser.findNodes(pNode, 'r');
      for (const rNode of runs) {
        const tNode = this.xmlParser.findNode(rNode, 't');
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
      'rect': 'rect',
      'roundRect': 'roundRect', 
      'ellipse': 'ellipse',
      'triangle': 'triangle',
      'diamond': 'diamond',
      'parallelogram': 'parallelogram',
      'trapezoid': 'trapezoid',
      'pentagon': 'pentagon',
      'hexagon': 'hexagon',
      'octagon': 'octagon',
      'star5': 'star',
      'star4': 'star',
      'star6': 'star',
      'rightArrow': 'arrow',
      'leftArrow': 'arrow',
      'upArrow': 'arrow',
      'downArrow': 'arrow',
      'callout1': 'callout',
      'callout2': 'callout',
      'callout3': 'callout'
    };
    
    return mapping[prst] || 'custom';
  }

  private emuToPoints(emu: number): number {
    // 1 point = 12700 EMUs
    return Math.round(emu / 12700);
  }
}