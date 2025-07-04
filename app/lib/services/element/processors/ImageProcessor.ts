import { IElementProcessor } from "../../interfaces/IElementProcessor";
import { ProcessingContext } from "../../interfaces/ProcessingContext";
import {
  ImageElement,
  ImageCrop,
} from "../../../models/domain/elements/ImageElement";
import { XmlNode } from "../../../models/xml/XmlNode";
import { IXmlParseService } from "../../interfaces/IXmlParseService";
import { UnitConverter } from "../../utils/UnitConverter";
import { ImageDataService } from "../../images/ImageDataService";
import { ImageProcessingService } from "../../images/ImageProcessingService";
import { ImageOffsetAdjuster } from "./ImageOffsetAdjuster";
import { DebugHelper } from "../../utils/DebugHelper";
import { GroupTransformUtils } from "../../utils/GroupTransformUtils";
import { RotationExtractor } from "../../utils/RotationExtractor";
import { FlipExtractor } from "../../utils/FlipExtractor";
import { ShadowExtractor } from "../../utils/ShadowExtractor";

export class ImageProcessor implements IElementProcessor<ImageElement> {
  private imageProcessingService?: ImageProcessingService;

  constructor(
    private xmlParser: IXmlParseService,
    private imageDataService?: ImageDataService
  ) {
    if (this.imageDataService) {
      this.imageProcessingService = new ImageProcessingService(
        this.imageDataService
      );
    }
  }

  canProcess(xmlNode: XmlNode): boolean {
    // Process pic nodes and shapes with image fill
    if (xmlNode.name.endsWith("pic")) {
      return true;
    }

    // Check if it's a shape with blipFill (most common case)
    if (xmlNode.name.endsWith("sp")) {
      const spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
      if (spPrNode) {
        const blipFillNode = this.xmlParser.findNode(spPrNode, "blipFill");
        return !!blipFillNode;
      }
    }

    return false;
  }

  async process(
    xmlNode: XmlNode,
    context: ProcessingContext
  ): Promise<ImageElement> {
    // Handle both p:pic and p:sp with blipFill
    let cNvPrNode: XmlNode | undefined;
    let blipFillNode: XmlNode | undefined;
    let spPrNode: XmlNode | undefined;

    if (xmlNode.name.endsWith("pic")) {
      // Traditional p:pic element
      const nvPicPrNode = this.xmlParser.findNode(xmlNode, "nvPicPr");
      cNvPrNode = nvPicPrNode
        ? this.xmlParser.findNode(nvPicPrNode, "cNvPr")
        : undefined;
      blipFillNode = this.xmlParser.findNode(xmlNode, "blipFill");
      spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
    } else if (xmlNode.name.endsWith("sp")) {
      // Shape with image fill (more common)
      const nvSpPrNode = this.xmlParser.findNode(xmlNode, "nvSpPr");
      cNvPrNode = nvSpPrNode
        ? this.xmlParser.findNode(nvSpPrNode, "cNvPr")
        : undefined;
      spPrNode = this.xmlParser.findNode(xmlNode, "spPr");
      blipFillNode = spPrNode
        ? this.xmlParser.findNode(spPrNode, "blipFill")
        : undefined;
    }

    const originalId = cNvPrNode
      ? this.xmlParser.getAttribute(cNvPrNode, "id")
      : undefined;

    // Generate unique ID
    const id = context.idGenerator.generateUniqueId(originalId, "image");

    // Extract image reference
    const blipNode = blipFillNode
      ? this.xmlParser.findNode(blipFillNode, "blip")
      : undefined;
    const embedId = blipNode
      ? this.xmlParser.getAttribute(blipNode, "r:embed")
      : undefined;

    // Resolve image URL from relationships
    let imageUrl = "";
    if (embedId && context.relationships.has(embedId)) {
      const rel = context.relationships.get(embedId);
      if (rel && rel.target) {
        imageUrl = rel.target;
      }
    }

    const imageElement = new ImageElement(id, imageUrl, embedId);

    // Extract position and size (spPrNode already extracted above)
    if (spPrNode) {
      const xfrmNode = this.xmlParser.findNode(spPrNode, "xfrm");
      if (xfrmNode) {
        // Position with detailed offset information
        const offNode = this.xmlParser.findNode(xfrmNode, "off");
        if (offNode) {
          const x = this.xmlParser.getAttribute(offNode, "x");
          const y = this.xmlParser.getAttribute(offNode, "y");
          if (x && y) {
            let originalX = parseInt(x);
            let originalY = parseInt(y);

            // Apply group transform if exists
            const transformedCoords = GroupTransformUtils.applyGroupTransformIfExists(
              originalX,
              originalY,
              context
            );
            originalX = transformedCoords.x;
            originalY = transformedCoords.y;

            const convertedX = UnitConverter.emuToPoints(originalX);
            const convertedY = UnitConverter.emuToPoints(originalY);

            // 获取幻灯片尺寸用于偏移调整，提供默认值
            const slideWidth = context.slideSize?.width || 1350; // 默认幻灯片宽度
            const slideHeight = context.slideSize?.height || 759.375; // 默认幻灯片高度

            // 应用偏移调整
            let adjustedX = convertedX;
            let adjustedY = convertedY;

            // 获取图片尺寸信息用于偏移调整
            const extNode = this.xmlParser.findNode(xfrmNode, "ext");
            if (extNode) {
              const cx = this.xmlParser.getAttribute(extNode, "cx");
              const cy = this.xmlParser.getAttribute(extNode, "cy");
              if (cx && cy) {
                const imgWidth = UnitConverter.emuToPointsPrecise(parseInt(cx));
                const imgHeight = UnitConverter.emuToPointsPrecise(
                  parseInt(cy)
                );

                // 自动调整图片位置，避免超出边界
                const adjusted = ImageOffsetAdjuster.autoAdjust(
                  convertedX,
                  convertedY,
                  imgWidth,
                  imgHeight,
                  slideWidth,
                  slideHeight
                );

                adjustedX = adjusted.x;
                adjustedY = adjusted.y;
              }
            }

            imageElement.setPosition({
              x: adjustedX,
              y: adjustedY,
            });

            // 计算偏移量
            const leftOffset = adjustedX; // 向左偏移量 (距离左边界)
            const topOffset = adjustedY; // 向上偏移量 (距离上边界)
            const rightOffset = slideWidth - adjustedX; // 向右偏移量 (距离右边界)
            const bottomOffset = slideHeight - adjustedY; // 向下偏移量 (距离下边界)

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
              adjustedX: adjustedX,
              adjustedY: adjustedY,
              leftOffset: leftOffset,
              topOffset: topOffset,
              rightOffset: rightOffset,
              bottomOffset: bottomOffset,
              leftOffsetPercent: leftOffsetPercent,
              topOffsetPercent: topOffsetPercent,
              rightOffsetPercent: rightOffsetPercent,
              bottomOffsetPercent: bottomOffsetPercent,
            });
          }
        }

        // Size with aspect ratio preservation
        const extNode = this.xmlParser.findNode(xfrmNode, "ext");
        if (extNode) {
          const cx = this.xmlParser.getAttribute(extNode, "cx");
          const cy = this.xmlParser.getAttribute(extNode, "cy");
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
              console.warn(
                `Image aspect ratio mismatch: original=${originalRatio.toFixed(
                  4
                )}, converted=${convertedRatio.toFixed(4)}`
              );
            }

            imageElement.setSize({
              width: width,
              height: height,
            });

            // Store original aspect ratio for reference
            imageElement.setAspectRatio(originalRatio);
          }
        }

        // Rotation - 使用统一的旋转提取工具
        const rotation = RotationExtractor.extractRotation(this.xmlParser, xfrmNode);
        if (rotation !== 0) {
          imageElement.setRotation(rotation);
          DebugHelper.log(
            context,
            `Image rotation: ${rotation} degrees`,
            "info"
          );
        }

        // Flip attributes - 使用统一的翻转提取工具
        const flip = FlipExtractor.extractFlip(this.xmlParser, xfrmNode);
        if (flip) {
          imageElement.setFlip(flip);
          DebugHelper.log(
            context,
            `Image flip: ${FlipExtractor.getFlipDescription(this.xmlParser, xfrmNode)}`,
            "info"
          );
        }
      }

      // Extract shadow properties using ShadowExtractor
      const shadow = ShadowExtractor.extractShadow(spPrNode, this.xmlParser, context);
      if (shadow) {
        imageElement.setShadow(shadow);
        DebugHelper.log(
          context,
          `Image shadow set - type: ${shadow.type}, h: ${shadow.h}, v: ${shadow.v}, blur: ${shadow.blur}, color: ${shadow.color}`,
          "success"
        );
      }
    }

    // Extract alt text
    if (cNvPrNode) {
      const descr = this.xmlParser.getAttribute(cNvPrNode, "descr");
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

    // Extract stretch and fillRect information from blipFill
    if (blipFillNode) {
      const stretchInfo = this.extractStretchInfo(blipFillNode);
      if (stretchInfo) {
        imageElement.setStretchInfo(stretchInfo);
      }
    }

    // 在所有属性设置完成后，处理图片数据（包括拉伸偏移处理）
    if (embedId && this.imageProcessingService) {
      try {
        DebugHelper.log(
          context,
          `Processing image with embedId: ${embedId}`,
          "info"
        );

        // 使用 ImageProcessingService 进行完整的图片处理（包括拉伸偏移）
        const processedData =
          await this.imageProcessingService.processImageElementWithEmbedId(
            imageElement,
            embedId,
            context,
            {
              enableStretchProcessing: true,
              outputFormat: "base64",
              enableDebug: DebugHelper.isDebugEnabled(context),
            }
          );

        if (processedData.wasProcessed && processedData.processedResult) {
          // 使用处理后的图片数据
          const processedImageData = {
            buffer: processedData.processedResult.buffer,
            filename: processedData.originalData?.filename || "processed_image",
            mimeType: `image/${processedData.processedResult.format}`,
            format: processedData.processedResult.format,
            size: processedData.processedResult.buffer.length,
            hash: processedData.originalData?.hash || "",
            dimensions: {
              width: processedData.processedResult.width,
              height: processedData.processedResult.height,
            },
          };

          imageElement.setImageData(
            processedImageData,
            processedData.dataUrl || ""
          );
          DebugHelper.log(
            context,
            `Image processed with stretch offset: ${processedData.processedResult.width}x${processedData.processedResult.height}`,
            "success"
          );
        } else if (processedData.originalData) {
          // 回退到原始数据
          const dataUrl =
            processedData.dataUrl ||
            this.imageDataService!.encodeToBase64(processedData.originalData);
          imageElement.setImageData(processedData.originalData, dataUrl);

          const dimensions = processedData.originalData.dimensions
            ? `${processedData.originalData.dimensions.width}x${processedData.originalData.dimensions.height}`
            : "unknown dimensions";
          DebugHelper.log(
            context,
            `Image data processed (no stretch): ${processedData.originalData.format}, ${dimensions}`,
            "info"
          );
        }

        if (processedData.error) {
          DebugHelper.log(
            context,
            `Image processing error: ${processedData.error}`,
            "warn"
          );
        }
      } catch (error) {
        DebugHelper.log(
          context,
          `Failed to process image data for ${embedId}: ${error}`,
          "error"
        );
        console.warn(`Failed to process image data for ${embedId}:`, error);
        // 继续使用占位符URL，不影响其他处理
      }
    }

    return imageElement;
  }

  getElementType(): string {
    return "image";
  }

  /**
   * 从blip节点提取裁剪信息
   */
  private extractCropInfo(blipNode: XmlNode): ImageCrop | undefined {
    // PowerPoint中的图片裁剪信息通常在 a:srcRect 元素中
    const srcRectNode = this.xmlParser.findNode(blipNode, "srcRect");
    if (!srcRectNode) return undefined;

    const l = this.xmlParser.getAttribute(srcRectNode, "l"); // left
    const t = this.xmlParser.getAttribute(srcRectNode, "t"); // top
    const r = this.xmlParser.getAttribute(srcRectNode, "r"); // right
    const b = this.xmlParser.getAttribute(srcRectNode, "b"); // bottom

    // PowerPoint使用1000分之一的单位表示百分比
    const crop: ImageCrop = {
      left: l ? parseInt(l) / 1000 : 0,
      top: t ? parseInt(t) / 1000 : 0,
      right: r ? parseInt(r) / 1000 : 0,
      bottom: b ? parseInt(b) / 1000 : 0,
    };

    // 只有当存在实际裁剪时才返回裁剪信息
    if (crop.left > 0 || crop.top > 0 || crop.right > 0 || crop.bottom > 0) {
      return crop;
    }

    return undefined;
  }

  /**
   * 从blipFill节点提取拉伸信息
   */
  private extractStretchInfo(blipFillNode: XmlNode): any {
    // 查找 a:stretch 元素
    const stretchNode = this.xmlParser.findNode(blipFillNode, "stretch");
    if (!stretchNode) return undefined;

    // 查找 a:fillRect 元素
    const fillRectNode = this.xmlParser.findNode(stretchNode, "fillRect");
    if (!fillRectNode) return undefined;

    const l = this.xmlParser.getAttribute(fillRectNode, "l"); // left
    const t = this.xmlParser.getAttribute(fillRectNode, "t"); // top
    const r = this.xmlParser.getAttribute(fillRectNode, "r"); // right
    const b = this.xmlParser.getAttribute(fillRectNode, "b"); // bottom

    // PowerPoint使用1000分之一的单位表示百分比
    // 注意：这些值可以是负数，表示超出边界
    const fillRect = {
      left: l ? parseInt(l) / 100000 : 0, // 转换为小数（-4881 -> -0.04881）
      top: t ? parseInt(t) / 100000 : 0,
      right: r ? parseInt(r) / 100000 : 0,
      bottom: b ? parseInt(b) / 100000 : 0,
    };

    return {
      fillRect,
      fromXml: true, // 标记来源于XML解析
    };
  }
}
