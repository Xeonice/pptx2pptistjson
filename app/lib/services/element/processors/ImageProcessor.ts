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
    // Process pic nodes and shapes with image fill
    if (xmlNode.name.endsWith('pic')) {
      return true;
    }
    
    // Check if it's a shape with blipFill (most common case)
    if (xmlNode.name.endsWith('sp')) {
      const spPrNode = this.xmlParser.findNode(xmlNode, 'spPr');
      if (spPrNode) {
        const blipFillNode = this.xmlParser.findNode(spPrNode, 'blipFill');
        return !!blipFillNode;
      }
    }
    
    return false;
  }

  async process(xmlNode: XmlNode, context: ProcessingContext): Promise<ImageElement> {
    // Handle both p:pic and p:sp with blipFill
    let cNvPrNode: XmlNode | undefined;
    let blipFillNode: XmlNode | undefined;
    let spPrNode: XmlNode | undefined;
    
    if (xmlNode.name.endsWith('pic')) {
      // Traditional p:pic element
      const nvPicPrNode = this.xmlParser.findNode(xmlNode, 'nvPicPr');
      cNvPrNode = nvPicPrNode ? this.xmlParser.findNode(nvPicPrNode, 'cNvPr') : undefined;
      blipFillNode = this.xmlParser.findNode(xmlNode, 'blipFill');
      spPrNode = this.xmlParser.findNode(xmlNode, 'spPr');
    } else if (xmlNode.name.endsWith('sp')) {
      // Shape with image fill (more common)
      const nvSpPrNode = this.xmlParser.findNode(xmlNode, 'nvSpPr');
      cNvPrNode = nvSpPrNode ? this.xmlParser.findNode(nvSpPrNode, 'cNvPr') : undefined;
      spPrNode = this.xmlParser.findNode(xmlNode, 'spPr');
      blipFillNode = spPrNode ? this.xmlParser.findNode(spPrNode, 'blipFill') : undefined;
    }
    
    const originalId = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'id') : undefined;
    
    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, 'image');
    
    // Extract image reference
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
    
    // Extract position and size (spPrNode already extracted above)
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, 'xfrm');
      if (xfrmNode) {
        // Position with detailed offset information
        const offNode = this.xmlParser.findNode(xfrmNode, 'off');
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, 'x');
          const y = this.xmlParser.getAttribute(offNode, 'y');
          if (x && y) {
            const originalX = parseInt(x);
            const originalY = parseInt(y);
            const convertedX = UnitConverter.emuToPoints(originalX);
            const convertedY = UnitConverter.emuToPoints(originalY);
            
            imageElement.setPosition({
              x: convertedX,
              y: convertedY
            });
            
            // Store detailed offset information for debugging/adjustment
            const slideWidth = context.slideSize?.width || 1350; // 默认幻灯片宽度
            const slideHeight = context.slideSize?.height || 759.375; // 默认幻灯片高度
            
            // 计算偏移量
            const leftOffset = convertedX; // 向左偏移量 (距离左边界)
            const topOffset = convertedY;  // 向上偏移量 (距离上边界)
            const rightOffset = slideWidth - convertedX;  // 向右偏移量 (距离右边界)
            const bottomOffset = slideHeight - convertedY; // 向下偏移量 (距离下边界)
            
            // 计算百分比偏移量 (类似PowerPoint Stretch Offset)
            const leftOffsetPercent = (leftOffset / slideWidth) * 100;
            const topOffsetPercent = (topOffset / slideHeight) * 100;
            const rightOffsetPercent = (rightOffset / slideWidth) * 100;
            const bottomOffsetPercent = (bottomOffset / slideHeight) * 100;
            
            imageElement.setOffsetInfo({
              originalX: originalX,
              originalY: originalY,
              convertedX: convertedX,
              convertedY: convertedY,
              leftOffset: leftOffset,
              topOffset: topOffset,
              rightOffset: rightOffset,
              bottomOffset: bottomOffset,
              leftOffsetPercent: leftOffsetPercent,
              topOffsetPercent: topOffsetPercent,
              rightOffsetPercent: rightOffsetPercent,
              bottomOffsetPercent: bottomOffsetPercent
            });
          }
        }
        
        // Size with aspect ratio preservation
        const extNode = this.xmlParser.findNode(xfrmNode, 'ext');
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, 'cx');
          const cy = this.xmlParser.getAttribute(extNode, 'cy');
          if (cx && cy) {
            const originalCx = parseInt(cx);
            const originalCy = parseInt(cy);
            
            // Calculate original aspect ratio for validation
            const originalRatio = originalCx / originalCy;
            
            // Convert EMU to points with precise calculation
            const width = UnitConverter.emuToPointsPrecise(originalCx);
            const height = UnitConverter.emuToPointsPrecise(originalCy);
            
            // Verify aspect ratio is preserved (tolerance for floating point)
            const convertedRatio = width / height;
            if (Math.abs(originalRatio - convertedRatio) > 0.001) {
              console.warn(`Image aspect ratio mismatch: original=${originalRatio.toFixed(4)}, converted=${convertedRatio.toFixed(4)}`);
            }
            
            imageElement.setSize({
              width: width,
              height: height
            });
            
            // Store original aspect ratio for reference
            imageElement.setAspectRatio(originalRatio);
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