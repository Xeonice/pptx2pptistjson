/**
 * 图片偏移调整器
 * 用于在转译时处理图片位置偏移
 */
export class ImageOffsetAdjuster {
  /**
   * 应用偏移调整策略
   * @param originalX 原始X坐标（points）
   * @param originalY 原始Y坐标（points）
   * @param width 图片宽度
   * @param height 图片高度
   * @param slideWidth 幻灯片宽度
   * @param slideHeight 幻灯片高度
   * @param strategy 调整策略
   * @returns 调整后的坐标
   */
  static applyOffsetAdjustment(
    originalX: number,
    originalY: number,
    width: number,
    height: number,
    slideWidth: number,
    slideHeight: number,
    strategy?: OffsetStrategy
  ): { x: number; y: number } {
    if (!strategy) {
      // 默认不做调整
      return { x: originalX, y: originalY };
    }

    switch (strategy.type) {
      case 'center':
        // 居中对齐
        return this.centerAlign(width, height, slideWidth, slideHeight);
      
      case 'margin':
        // 应用边距
        return this.applyMargin(originalX, originalY, strategy.margin || 0);
      
      case 'percentage':
        // 按百分比偏移
        return this.applyPercentageOffset(
          originalX,
          originalY,
          slideWidth,
          slideHeight,
          strategy.offsetX || 0,
          strategy.offsetY || 0
        );
      
      case 'absolute':
        // 绝对偏移
        return {
          x: originalX + (strategy.offsetX || 0),
          y: originalY + (strategy.offsetY || 0)
        };
      
      default:
        return { x: originalX, y: originalY };
    }
  }

  /**
   * 居中对齐
   */
  private static centerAlign(
    width: number,
    height: number,
    slideWidth: number,
    slideHeight: number
  ): { x: number; y: number } {
    return {
      x: (slideWidth - width) / 2,
      y: (slideHeight - height) / 2
    };
  }

  /**
   * 应用边距
   */
  private static applyMargin(
    originalX: number,
    originalY: number,
    margin: number
  ): { x: number; y: number } {
    return {
      x: Math.max(margin, originalX),
      y: Math.max(margin, originalY)
    };
  }

  /**
   * 按百分比偏移
   */
  private static applyPercentageOffset(
    originalX: number,
    originalY: number,
    slideWidth: number,
    slideHeight: number,
    offsetXPercent: number,
    offsetYPercent: number
  ): { x: number; y: number } {
    return {
      x: originalX + (slideWidth * offsetXPercent / 100),
      y: originalY + (slideHeight * offsetYPercent / 100)
    };
  }

  /**
   * 检测并自动调整偏移
   * 基于图片位置和大小自动决定调整策略
   */
  static autoAdjust(
    originalX: number,
    originalY: number,
    width: number,
    height: number,
    slideWidth: number,
    slideHeight: number
  ): { x: number; y: number } {
    // 检测是否需要调整
    const rightEdge = originalX + width;
    const bottomEdge = originalY + height;
    
    let adjustedX = originalX;
    let adjustedY = originalY;
    
    // 如果图片超出右边界，向左调整
    if (rightEdge > slideWidth) {
      adjustedX = slideWidth - width;
    }
    
    // 如果图片超出下边界，向上调整
    if (bottomEdge > slideHeight) {
      adjustedY = slideHeight - height;
    }
    
    // 确保不会超出左边界和上边界
    adjustedX = Math.max(0, adjustedX);
    adjustedY = Math.max(0, adjustedY);
    
    return { x: adjustedX, y: adjustedY };
  }
}

/**
 * 偏移调整策略
 */
export interface OffsetStrategy {
  type: 'center' | 'margin' | 'percentage' | 'absolute';
  margin?: number;
  offsetX?: number;
  offsetY?: number;
}