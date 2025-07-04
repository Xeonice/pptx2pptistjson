import { IXmlParseService } from "../interfaces/IXmlParseService";
import { XmlNode } from "../../models/xml/XmlNode";
import { ProcessingContext } from "../interfaces/ProcessingContext";
import { UnitConverter } from "./UnitConverter";
import { ColorUtils } from "./ColorUtils";
import { FillExtractor } from "./FillExtractor";
import { DebugHelper } from "./DebugHelper";

/**
 * 阴影效果提取器
 * 用于从PowerPoint XML中提取并转换阴影效果为PPTist格式
 */
export class ShadowExtractor {
  
  /**
   * 从XML节点中提取阴影效果
   * @param xmlNode 包含effectLst的XML节点（通常是spPr）
   * @param xmlParser XML解析服务
   * @param context 处理上下文
   * @returns 阴影效果对象或undefined
   */
  static extractShadow(
    xmlNode: XmlNode,
    xmlParser: IXmlParseService,
    context: ProcessingContext
  ): ShadowResult | undefined {
    // 查找effectLst节点
    const effectLstNode = xmlParser.findNode(xmlNode, "effectLst");
    if (!effectLstNode) {
      return undefined;
    }

    // 查找outerShdw节点（外阴影）
    const outerShdwNode = xmlParser.findNode(effectLstNode, "outerShdw");
    if (!outerShdwNode) {
      // 也可以检查其他类型的阴影效果，如innerShdw
      return undefined;
    }

    return this.parseOuterShadow(outerShdwNode, xmlParser, context);
  }

  /**
   * 解析外阴影效果
   * @param outerShdwNode outerShdw XML节点
   * @param xmlParser XML解析服务
   * @param context 处理上下文
   * @returns 阴影效果对象
   */
  private static parseOuterShadow(
    outerShdwNode: XmlNode,
    xmlParser: IXmlParseService,
    context: ProcessingContext
  ): ShadowResult | undefined {
    // 提取阴影参数
    const blurRad = xmlParser.getAttribute(outerShdwNode, "blurRad");
    const dist = xmlParser.getAttribute(outerShdwNode, "dist");
    const dir = xmlParser.getAttribute(outerShdwNode, "dir");
    const algn = xmlParser.getAttribute(outerShdwNode, "algn");
    const rotWithShape = xmlParser.getAttribute(outerShdwNode, "rotWithShape");

    // 转换EMU单位到像素
    const blurRadius = blurRad ? UnitConverter.emuToPoints(parseInt(blurRad)) : 0;
    const distance = dist ? UnitConverter.emuToPoints(parseInt(dist)) : 0;
    const direction = dir ? parseInt(dir) / 60000 : 0; // 转换为度数

    DebugHelper.log(
      context,
      `ShadowExtractor: Raw shadow params - blurRad:${blurRad}, dist:${dist}, dir:${dir}`,
      "info"
    );
    
    DebugHelper.log(
      context,
      `ShadowExtractor: Converted shadow - blur:${blurRadius}pt, distance:${distance}pt, direction:${direction}°`,
      "info"
    );

    // 计算阴影偏移
    const angleInRadians = (direction * Math.PI) / 180;
    const offsetX = distance * Math.cos(angleInRadians);
    const offsetY = distance * Math.sin(angleInRadians);

    // 提取颜色信息
    const shadowColor = this.extractShadowColor(outerShdwNode, xmlParser, context);

    const result: ShadowResult = {
      type: "outerShadow",
      h: Math.round(offsetX * 100) / 100, // 保留2位小数
      v: Math.round(offsetY * 100) / 100,
      blur: Math.round(blurRadius * 100) / 100,
      color: shadowColor || "rgba(0, 0, 0, 0.5)" // 默认半透明黑色
    };

    DebugHelper.log(
      context,
      `ShadowExtractor: Final shadow effect - h:${result.h}, v:${result.v}, blur:${result.blur}, color:${result.color}`,
      "success"
    );

    // 添加其他属性（用于调试）
    if (algn) {
      DebugHelper.log(context, `ShadowExtractor: Shadow alignment: ${algn}`, "info");
    }
    if (rotWithShape) {
      DebugHelper.log(context, `ShadowExtractor: Rotate with shape: ${rotWithShape}`, "info");
    }

    return result;
  }

  /**
   * 提取阴影颜色
   * @param outerShdwNode outerShdw XML节点
   * @param xmlParser XML解析服务
   * @param context 处理上下文
   * @returns 颜色字符串（rgba格式）
   */
  private static extractShadowColor(
    outerShdwNode: XmlNode,
    xmlParser: IXmlParseService,
    context: ProcessingContext
  ): string | undefined {
    // 查找颜色节点（可能是prstClr, srgbClr, schemeClr等）
    let colorNode: XmlNode | undefined;
    let baseColor = "#000000"; // 默认黑色
    let alpha = 1.0; // 默认不透明

    // 1. 检查预设颜色 (prstClr)
    const prstClrNode = xmlParser.findNode(outerShdwNode, "prstClr");
    if (prstClrNode) {
      colorNode = prstClrNode;
      const val = xmlParser.getAttribute(prstClrNode, "val");
      if (val) {
        baseColor = ColorUtils.getPresetColor(val) || "#000000";
        DebugHelper.log(context, `ShadowExtractor: Preset color - ${val} -> ${baseColor}`, "info");
      }
    }

    // 2. 检查RGB颜色 (srgbClr)
    if (!colorNode) {
      const srgbClrNode = xmlParser.findNode(outerShdwNode, "srgbClr");
      if (srgbClrNode) {
        colorNode = srgbClrNode;
        const val = xmlParser.getAttribute(srgbClrNode, "val");
        if (val) {
          baseColor = `#${val}`;
          DebugHelper.log(context, `ShadowExtractor: RGB color - ${baseColor}`, "info");
        }
      }
    }

    // 3. 检查主题颜色 (schemeClr)
    if (!colorNode) {
      const schemeClrNode = xmlParser.findNode(outerShdwNode, "schemeClr");
      if (schemeClrNode) {
        colorNode = schemeClrNode;
        const val = xmlParser.getAttribute(schemeClrNode, "val");
        if (val && context.theme) {
          // 使用FillExtractor来解析主题颜色
          const solidFillObj = {
            "a:schemeClr": this.xmlNodeToObject(schemeClrNode, xmlParser)
          };

          const warpObj = {
            themeContent: this.createThemeContent(context.theme)
          };

          const resolvedColor = FillExtractor.getSolidFill(
            solidFillObj,
            undefined,
            undefined,
            warpObj
          );

          if (resolvedColor) {
            baseColor = resolvedColor;
            DebugHelper.log(context, `ShadowExtractor: Theme color - ${val} -> ${baseColor}`, "info");
          }
        }
      }
    }

    // 4. 提取透明度
    if (colorNode) {
      const alphaNode = xmlParser.findNode(colorNode, "alpha");
      if (alphaNode) {
        const alphaVal = xmlParser.getAttribute(alphaNode, "val");
        if (alphaVal) {
          alpha = parseInt(alphaVal) / 100000; // PowerPoint alpha值是0-100000
          DebugHelper.log(context, `ShadowExtractor: Alpha value - ${alphaVal} -> ${alpha}`, "info");
        }
      }
    }

    // 转换为rgba格式
    const rgbaColor = ColorUtils.toRgba(baseColor);
    if (rgbaColor && alpha < 1.0) {
      // 应用透明度
      const finalColor = ColorUtils.applyAlpha(rgbaColor, alpha);
      DebugHelper.log(context, `ShadowExtractor: Final shadow color - ${finalColor}`, "success");
      return finalColor;
    }

    return rgbaColor || baseColor;
  }

  /**
   * 将XmlNode转换为对象格式（用于FillExtractor）
   */
  private static xmlNodeToObject(node: XmlNode, xmlParser: IXmlParseService): any {
    const obj: any = {};

    // 添加属性
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      obj.attrs = { ...node.attributes };
    }

    // 添加子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childName = child.name.includes(":") ? child.name : `a:${child.name}`;
        obj[childName] = this.xmlNodeToObject(child, xmlParser);
      }
    }

    return obj;
  }

  /**
   * 创建主题内容结构（用于FillExtractor）
   */
  private static createThemeContent(theme: any): any {
    const colorScheme = theme.getColorScheme();
    if (!colorScheme) return undefined;

    return {
      "a:theme": {
        "a:themeElements": {
          "a:clrScheme": {
            "a:dk1": { "a:srgbClr": { attrs: { val: colorScheme.dk1?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:lt1": { "a:srgbClr": { attrs: { val: colorScheme.lt1?.replace("#", "").replace(/ff$/, "") || "FFFFFF" } } },
            "a:dk2": { "a:srgbClr": { attrs: { val: colorScheme.dk2?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:lt2": { "a:srgbClr": { attrs: { val: colorScheme.lt2?.replace("#", "").replace(/ff$/, "") || "FFFFFF" } } },
            "a:accent1": { "a:srgbClr": { attrs: { val: colorScheme.accent1?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:accent2": { "a:srgbClr": { attrs: { val: colorScheme.accent2?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:accent3": { "a:srgbClr": { attrs: { val: colorScheme.accent3?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:accent4": { "a:srgbClr": { attrs: { val: colorScheme.accent4?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:accent5": { "a:srgbClr": { attrs: { val: colorScheme.accent5?.replace("#", "").replace(/ff$/, "") || "000000" } } },
            "a:accent6": { "a:srgbClr": { attrs: { val: colorScheme.accent6?.replace("#", "").replace(/ff$/, "") || "000000" } } }
          }
        }
      }
    };
  }
}

/**
 * 阴影效果结果接口
 */
export interface ShadowResult {
  type: "outerShadow" | "innerShadow";
  h: number;    // 水平偏移（points）
  v: number;    // 垂直偏移（points）
  blur: number; // 模糊半径（points）
  color: string; // 颜色（rgba格式）
}