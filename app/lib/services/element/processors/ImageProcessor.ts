import { IElementProcessor } from '../../interfaces/IElementProcessor';
import { ProcessingContext } from '../../interfaces/ProcessingContext';
import { ImageElement, ImageCrop } from '../../../models/domain/elements/ImageElement';
import { XmlNode } from '../../../models/xml/XmlNode';
import { IXmlParseService } from '../../interfaces/IXmlParseService';
import { UnitConverter } from '../../utils/UnitConverter';
import { ImageDataService } from '../../images/ImageDataService';

export class ImageProcessor implements IElementProcessor<ImageElement> {
  constructor(
    private xmlParser: IXmlParseService,
    private imageDataService?: ImageDataService
  ) {}

  canProcess(xmlNode: XmlNode): boolean {
    // Process pic nodes (images)
    return xmlNode.name.endsWith('pic');
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<ImageElement> {
    // Extract image ID
    const nvPicPrNode = this.xmlParser.findNode(xmlNode, 'nvPicPr');
    const cNvPrNode = nvPicPrNode ? this.xmlParser.findNode(nvPicPrNode, 'cNvPr') : undefined;
    const originalId = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'id') : undefined;
    
    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, 'image');
    
    // Extract image reference
    const blipFillNode = this.xmlParser.findNode(xmlNode, 'blipFill');
    const blipNode = blipFillNode ? this.xmlParser.findNode(blipFillNode, 'blip') : undefined;
    const embedId = blipNode ? this.xmlParser.getAttribute(blipNode, 'r:embed') : undefined;
    
    // Resolve image URL from relationships
    let imageUrl = '';
    if (embedId && context.relationships.has(embedId)) {
      const rel = context.relationships.get(embedId);
      if (rel && rel.target) {
        imageUrl = rel.target;
      }
    }
    
    const imageElement = new ImageElement(id, imageUrl);
    
    // 尝试提取并处理实际的图片数据
    if (embedId && this.imageDataService) {
      try {
        const imageData = await this.imageDataService.extractImageData(embedId, context);
        if (imageData) {
          const dataUrl = this.imageDataService.encodeToBase64(imageData);
          imageElement.setImageData(imageData, dataUrl);
        }
      } catch (error) {
        console.warn(`Failed to process image data for ${embedId}:`, error);
        // 继续使用占位符URL，不影响其他处理
      }
    }
    
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
              x: UnitConverter.emuToPoints(parseInt(x)),
              y: UnitConverter.emuToPoints(parseInt(y))
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
              width: UnitConverter.emuToPoints(parseInt(cx)),
              height: UnitConverter.emuToPoints(parseInt(cy))
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
    
    // Extract crop information from blip
    if (blipNode) {
      const crop = this.extractCropInfo(blipNode);
      if (crop) {
        imageElement.setCrop(crop);
      }
    }
    
    return imageElement;
  }

  getElementType(): string {
    return 'image';
  }

  /**
   * 从blip节点提取裁剪信息
   */
  private extractCropInfo(blipNode: XmlNode): ImageCrop | undefined {
    // PowerPoint中的图片裁剪信息通常在 a:srcRect 元素中
    const srcRectNode = this.xmlParser.findNode(blipNode, 'srcRect');
    if (!srcRectNode) return undefined;

    const l = this.xmlParser.getAttribute(srcRectNode, 'l'); // left
    const t = this.xmlParser.getAttribute(srcRectNode, 't'); // top  
    const r = this.xmlParser.getAttribute(srcRectNode, 'r'); // right
    const b = this.xmlParser.getAttribute(srcRectNode, 'b'); // bottom

    // PowerPoint使用1000分之一的单位表示百分比
    const crop: ImageCrop = {
      left: l ? parseInt(l) / 1000 : 0,
      top: t ? parseInt(t) / 1000 : 0,
      right: r ? parseInt(r) / 1000 : 0,
      bottom: b ? parseInt(b) / 1000 : 0
    };

    // 只有当存在实际裁剪时才返回裁剪信息
    if (crop.left > 0 || crop.top > 0 || crop.right > 0 || crop.bottom > 0) {
      return crop;
    }

    return undefined;
  }

}