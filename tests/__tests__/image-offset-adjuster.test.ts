import { ImageOffsetAdjuster, OffsetStrategy } from '../../app/lib/services/element/processors/ImageOffsetAdjuster';

describe('ImageOffsetAdjuster', () => {
  const slideWidth = 1350;
  const slideHeight = 759.375;
  const imgWidth = 200;
  const imgHeight = 150;

  describe('applyOffsetAdjustment', () => {
    it('should return original position when no strategy is provided', () => {
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 100, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should center align image when strategy is center', () => {
      const strategy: OffsetStrategy = { type: 'center' };
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 100, imgWidth, imgHeight, slideWidth, slideHeight, strategy
      );
      expect(result).toEqual({
        x: (slideWidth - imgWidth) / 2,
        y: (slideHeight - imgHeight) / 2
      });
    });

    it('should apply margin when strategy is margin', () => {
      const strategy: OffsetStrategy = { type: 'margin', margin: 50 };
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        10, 20, imgWidth, imgHeight, slideWidth, slideHeight, strategy
      );
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it('should apply percentage offset when strategy is percentage', () => {
      const strategy: OffsetStrategy = { 
        type: 'percentage', 
        offsetX: 10, // 10% of slide width
        offsetY: 5   // 5% of slide height
      };
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 100, imgWidth, imgHeight, slideWidth, slideHeight, strategy
      );
      expect(result).toEqual({
        x: 100 + (slideWidth * 10 / 100),
        y: 100 + (slideHeight * 5 / 100)
      });
    });

    it('should apply absolute offset when strategy is absolute', () => {
      const strategy: OffsetStrategy = { 
        type: 'absolute', 
        offsetX: 20,
        offsetY: 30
      };
      const result = ImageOffsetAdjuster.applyOffsetAdjustment(
        100, 100, imgWidth, imgHeight, slideWidth, slideHeight, strategy
      );
      expect(result).toEqual({ x: 120, y: 130 });
    });
  });

  describe('autoAdjust', () => {
    it('should not adjust position when image is within bounds', () => {
      const result = ImageOffsetAdjuster.autoAdjust(
        100, 100, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it('should adjust X position when image exceeds right boundary', () => {
      const result = ImageOffsetAdjuster.autoAdjust(
        slideWidth - 50, 100, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({
        x: slideWidth - imgWidth,
        y: 100
      });
    });

    it('should adjust Y position when image exceeds bottom boundary', () => {
      const result = ImageOffsetAdjuster.autoAdjust(
        100, slideHeight - 50, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({
        x: 100,
        y: slideHeight - imgHeight
      });
    });

    it('should adjust both X and Y when image exceeds both boundaries', () => {
      const result = ImageOffsetAdjuster.autoAdjust(
        slideWidth + 10, slideHeight + 10, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({
        x: slideWidth - imgWidth,
        y: slideHeight - imgHeight
      });
    });

    it('should ensure position is not negative', () => {
      const result = ImageOffsetAdjuster.autoAdjust(
        -10, -20, imgWidth, imgHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should handle edge case where image is larger than slide', () => {
      const largeWidth = slideWidth + 100;
      const largeHeight = slideHeight + 100;
      const result = ImageOffsetAdjuster.autoAdjust(
        100, 100, largeWidth, largeHeight, slideWidth, slideHeight
      );
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });
});