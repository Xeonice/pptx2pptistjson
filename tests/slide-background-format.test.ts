import { Slide, SlideBackground } from '../app/lib/models/domain/Slide';

describe('Slide Background Format', () => {
  let slide: Slide;

  beforeEach(() => {
    slide = new Slide('test-slide-1', 1);
  });

  describe('Legacy Background Format', () => {
    it('should return legacy format for image background', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHIBVBqrQAAAABJRU5ErkJggg=='
      };
      
      slide.setBackground(background);
      const result = slide.toJSON('legacy');
      
      expect(result.background).toEqual({
        type: 'image',
        themeColor: {
          color: '#F4F7FF',
          colorType: 'lt1'
        },
        image: background.imageUrl,
        imageSize: 'cover'
      });
    });

    it('should return legacy format for solid background', () => {
      const background: SlideBackground = {
        type: 'solid',
        color: '#FF5733'
      };
      
      slide.setBackground(background);
      const result = slide.toJSON('legacy');
      
      expect(result.background).toEqual({
        type: 'solid',
        color: '#FF5733'
      });
    });
  });

  describe('PPTist Background Format', () => {
    it('should return PPTist format for image background', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHIBVBqrQAAAABJRU5ErkJggg=='
      };
      
      slide.setBackground(background);
      const result = slide.toJSON('pptist');
      
      expect(result.background).toEqual({
        type: 'image',
        themeColor: {
          color: '#F4F7FF',
          colorType: 'lt1'
        },
        image: {
          src: background.imageUrl,
          size: 'cover'
        }
      });
    });

    it('should return PPTist format for solid background (same as legacy)', () => {
      const background: SlideBackground = {
        type: 'solid',
        color: '#FF5733'
      };
      
      slide.setBackground(background);
      const result = slide.toJSON('pptist');
      
      expect(result.background).toEqual({
        type: 'solid',
        color: '#FF5733'
      });
    });

    it('should return PPTist format for default background when no background is set', () => {
      const result = slide.toJSON('pptist');
      
      expect(result.background).toEqual({
        type: 'image',
        themeColor: {
          color: '#F4F7FF',
          colorType: 'lt1'
        },
        image: {
          src: 'https://example.com/background.png',
          size: 'cover'
        }
      });
    });
  });

  describe('Default Parameter Behavior', () => {
    it('should default to legacy format when no format is specified', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'https://example.com/test.png'
      };
      
      slide.setBackground(background);
      const result = slide.toJSON();
      
      expect(result.background).toHaveProperty('imageSize');
      expect(result.background).not.toHaveProperty('image.src');
    });
  });

  describe('Format Consistency', () => {
    it('should produce different output formats for the same background', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'https://example.com/test.png'
      };
      
      slide.setBackground(background);
      const legacyResult = slide.toJSON('legacy');
      const pptistResult = slide.toJSON('pptist');
      
      // Both should have the same basic properties
      expect(legacyResult.background.type).toBe(pptistResult.background.type);
      expect(legacyResult.background.themeColor).toEqual(pptistResult.background.themeColor);
      
      // But different image structure
      expect(legacyResult.background).toHaveProperty('imageSize');
      expect(pptistResult.background.image).toHaveProperty('src');
      expect(pptistResult.background.image).toHaveProperty('size');
    });
  });
});