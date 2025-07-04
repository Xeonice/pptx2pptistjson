import Decimal from 'decimal.js';

/**
 * FontSizeCalculator - 处理PowerPoint字体大小转换的专用计算器
 * 使用 decimal.js 确保精确的小数运算和舍入
 */
export class FontSizeCalculator {
  // PowerPoint到Web显示的缩放因子
  private static readonly SCALING_FACTOR = 1.333013;
  
  // PowerPoint字体大小单位转换因子（百分点）
  private static readonly POWERPOINT_UNIT_DIVISOR = 100;
  
  // 小数位数
  private static readonly DECIMAL_PLACES = 2;

  /**
   * 将PowerPoint字体大小值转换为Web显示大小
   * @param powerpointSize - PowerPoint中的字体大小值（百分点）
   * @returns 转换后的字体大小（保留2位小数）
   */
  static convertPowerPointToWebSize(powerpointSize: string | number): number {
    // 使用Decimal进行精确计算
    const sizeValue = new Decimal(powerpointSize);
    
    // 计算步骤：
    // 1. 除以100转换为点
    // 2. 乘以缩放因子
    // 3. 保留2位小数
    const result = sizeValue
      .dividedBy(this.POWERPOINT_UNIT_DIVISOR)
      .times(this.SCALING_FACTOR)
      .toDecimalPlaces(this.DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
    
    return result.toNumber();
  }

  /**
   * 批量转换字体大小（用于测试或批处理）
   * @param sizes - 字体大小数组
   * @returns 转换后的字体大小数组
   */
  static batchConvert(sizes: (string | number)[]): number[] {
    return sizes.map(size => this.convertPowerPointToWebSize(size));
  }

  /**
   * 获取缩放因子（用于调试或配置）
   */
  static getScalingFactor(): number {
    return this.SCALING_FACTOR;
  }

  /**
   * 验证输入是否为有效的字体大小值
   * @param size - 要验证的值
   * @returns 是否有效
   */
  static isValidSize(size: string | number | null): boolean {
    if (size === null || size === undefined) {
      return false;
    }
    try {
      const value = new Decimal(size);
      return value.isFinite() && value.greaterThan(0);
    } catch {
      return false;
    }
  }
}