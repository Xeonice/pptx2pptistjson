import { IXmlParseService } from "../interfaces/IXmlParseService";

/**
 * 统一的旋转角度提取工具类
 * 处理PowerPoint中的旋转角度值，统一转换为度数
 */
export class RotationExtractor {
  /**
   * 从xfrm节点提取旋转角度
   * PowerPoint中的rot属性值是以60000为单位的（60000 = 1度）
   * 
   * @param xmlParser XML解析服务
   * @param xfrmNode xfrm节点
   * @returns 旋转角度（度），如果没有旋转返回0
   */
  static extractRotation(
    xmlParser: IXmlParseService,
    xfrmNode: any
  ): number {
    if (!xfrmNode) {
      return 0;
    }

    const rot = xmlParser.getAttribute(xfrmNode, "rot");
    if (!rot) {
      return 0;
    }

    // PowerPoint中的旋转角度单位是60000分之一度
    // 例如：rot="19803009" 表示 19803009 / 60000 = 330.05015 度
    const rotValue = parseInt(rot);
    if (isNaN(rotValue)) {
      return 0;
    }

    // 转换为度数
    const degrees = rotValue / 60000;

    // 直接返回原始角度，保留负数
    // 这样可以让调用方根据需要决定是否标准化到0-360范围
    return degrees;
  }

  /**
   * 从任意包含xfrm的节点中提取旋转角度
   * 
   * @param xmlParser XML解析服务
   * @param parentNode 包含xfrm的父节点（如spPr、grpSpPr等）
   * @returns 旋转角度（度），如果没有旋转返回0
   */
  static extractRotationFromParent(
    xmlParser: IXmlParseService,
    parentNode: any
  ): number {
    if (!parentNode) {
      return 0;
    }

    const xfrmNode = xmlParser.findNode(parentNode, "xfrm");
    return RotationExtractor.extractRotation(xmlParser, xfrmNode);
  }

  /**
   * 将度数转换为PowerPoint的旋转单位
   * 
   * @param degrees 角度（度）
   * @returns PowerPoint旋转单位值
   */
  static degreesToPowerPointRotation(degrees: number): number {
    return Math.round(degrees * 60000);
  }

  /**
   * 合并多个旋转角度（用于组合变换）
   * 
   * @param rotations 旋转角度数组
   * @returns 合并后的旋转角度（度）
   */
  static combineRotations(...rotations: number[]): number {
    const totalRotation = rotations.reduce((sum, rot) => sum + rot, 0);
    return ((totalRotation % 360) + 360) % 360;
  }
}