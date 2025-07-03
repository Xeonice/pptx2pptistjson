/**
 * Slide模型高级背景测试
 * 深度测试Slide类的背景格式处理逻辑
 */

import { Slide, SlideBackground } from '../../app/lib/models/domain/Slide';

describe('Slide Model - Advanced Background Format', () => {
  let slide: Slide;

  beforeEach(() => {
    slide = new Slide('test-slide-advanced', 1);
  });

  describe('Complex Background Scenarios', () => {
    describe('Base64 Image Backgrounds', () => {
      it('should handle valid base64 images in legacy format', () => {
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

      it('should handle valid base64 images in pptist format', () => {
        const background: SlideBackground = {
          type: 'image',
          imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='
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

      it('should handle malformed base64 gracefully', () => {
        const background: SlideBackground = {
          type: 'image',
          imageUrl: 'data:image/png;base64,invalid-base64-data'
        };
        
        slide.setBackground(background);
        const legacyResult = slide.toJSON('legacy');
        const pptistResult = slide.toJSON('pptist');
        
        expect(legacyResult.background.image).toBe(background.imageUrl);
        expect(pptistResult.background.image.src).toBe(background.imageUrl);
      });
    });

    describe('URL-based Image Backgrounds', () => {
      it('should handle HTTPS URLs in legacy format', () => {
        const background: SlideBackground = {
          type: 'image',
          imageUrl: 'https://example.com/image.png'
        };
        
        slide.setBackground(background);
        const result = slide.toJSON('legacy');
        
        expect(result.background.image).toBe('https://example.com/backgrounds/https://example.com/image.png.png');
      });

      it('should handle relative URLs in pptist format', () => {
        const background: SlideBackground = {
          type: 'image',
          imageUrl: 'images/slide-bg.jpg'
        };
        
        slide.setBackground(background);
        const result = slide.toJSON('pptist');
        
        expect(result.background.image.src).toBe('https://example.com/backgrounds/images/slide-bg.jpg.png');
      });

      it('should handle empty imageUrl gracefully', () => {
        const background: SlideBackground = {
          type: 'image',
          imageUrl: ''
        };
        
        slide.setBackground(background);
        const legacyResult = slide.toJSON('legacy');
        const pptistResult = slide.toJSON('pptist');
        
        expect(legacyResult.background.image).toBe('https://example.com/background.png');
        expect(pptistResult.background.image.src).toBe('https://example.com/background.png');
      });
    });

    describe('Gradient Backgrounds', () => {
      it('should handle complex gradient definitions', () => {
        const background: SlideBackground = {
          type: 'gradient',
          colors: [
            { color: '#FF0000', position: 0 },
            { color: '#00FF00', position: 0.5 },
            { color: '#0000FF', position: 1.0 }
          ]
        };
        
        slide.setBackground(background);
        const legacyResult = slide.toJSON('legacy');
        const pptistResult = slide.toJSON('pptist');
        
        // Gradient should be same in both formats
        expect(legacyResult.background).toEqual(pptistResult.background);
        expect(legacyResult.background).toEqual({
          type: 'gradient',
          colors: background.colors
        });
      });

      it('should handle gradient with single color', () => {
        const background: SlideBackground = {
          type: 'gradient',
          colors: [{ color: '#FF5733', position: 0 }]
        };
        
        slide.setBackground(background);
        const result = slide.toJSON('legacy');
        
        expect(result.background.colors).toHaveLength(1);
        expect(result.background.colors[0]).toEqual({ color: '#FF5733', position: 0 });
      });

      it('should handle gradient with empty colors array', () => {
        const background: SlideBackground = {
          type: 'gradient',
          colors: []
        };
        
        slide.setBackground(background);
        const result = slide.toJSON('pptist');
        
        expect(result.background.colors).toEqual([]);
      });
    });

    describe('Solid Color Backgrounds', () => {
      it('should handle various color formats in solid backgrounds', () => {
        const colorTests = [
          '#FF0000',
          '#ff0000',
          'rgb(255, 0, 0)',
          'rgba(255, 0, 0, 0.5)',
          'hsl(0, 100%, 50%)',
          'red',
          '#F5F5DC' // Beige
        ];

        colorTests.forEach(color => {
          const background: SlideBackground = {
            type: 'solid',
            color: color
          };
          
          slide.setBackground(background);
          const legacyResult = slide.toJSON('legacy');
          const pptistResult = slide.toJSON('pptist');
          
          // Solid color should be same in both formats
          expect(legacyResult.background).toEqual(pptistResult.background);
          expect(legacyResult.background.color).toBe(color);
        });
      });

      it('should handle missing color in solid background', () => {
        const background: SlideBackground = {
          type: 'solid'
          // color is undefined
        };
        
        slide.setBackground(background);
        const result = slide.toJSON('legacy');
        
        expect(result.background.color).toBe('#FFFFFF'); // Default white
      });
    });
  });

  describe('Cloud Storage Integration Points', () => {
    // These tests verify the extension points for cloud storage
    
    it('should use imageData when cloud storage is enabled', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'regular-url.png',
        imageData: {
          buffer: Buffer.from('fake-image-data'),
          format: 'png',
          width: 800,
          height: 600
        }
      };
      
      // Mock shouldUseCloudStorage to return true
      const originalMethod = (slide as any).shouldUseCloudStorage;
      (slide as any).shouldUseCloudStorage = jest.fn().mockReturnValue(true);
      (slide as any).uploadToCloudService = jest.fn().mockReturnValue('https://cdn.example.com/uploaded-image.png');
      
      slide.setBackground(background);
      const legacyResult = slide.toJSON('legacy');
      const pptistResult = slide.toJSON('pptist');
      
      expect(legacyResult.background.image).toBe('https://cdn.example.com/uploaded-image.png');
      expect(pptistResult.background.image.src).toBe('https://cdn.example.com/uploaded-image.png');
      
      // Restore original method
      (slide as any).shouldUseCloudStorage = originalMethod;
    });

    it('should fallback when cloud upload fails', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'fallback-url.png',
        imageData: {
          buffer: Buffer.from('fake-image-data'),
          format: 'png'
        }
      };
      
      // Mock cloud storage enabled but upload fails
      (slide as any).shouldUseCloudStorage = jest.fn().mockReturnValue(true);
      (slide as any).uploadToCloudService = jest.fn().mockReturnValue(null); // Upload failed
      
      slide.setBackground(background);
      const result = slide.toJSON('pptist');
      
      expect(result.background.image.src).toBe('https://example.com/backgrounds/fallback-url.png.png');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unknown background types gracefully', () => {
      const background: any = {
        type: 'unknown-type',
        someProperty: 'value'
      };
      
      slide.setBackground(background);
      const legacyResult = slide.toJSON('legacy');
      const pptistResult = slide.toJSON('pptist');
      
      // Should fall back to default image background
      expect(legacyResult.background.type).toBe('image');
      expect(pptistResult.background.type).toBe('image');
      expect(legacyResult.background.image).toBe('https://example.com/background.png');
      expect(pptistResult.background.image.src).toBe('https://example.com/background.png');
    });

    it('should handle null background values', () => {
      slide.setBackground(null as any);
      const result = slide.toJSON('pptist');
      
      expect(result.background.image.src).toBe('https://example.com/background.png');
    });

    it('should handle background with both imageUrl and imageData', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'data:image/png;base64,abcd1234',
        imageData: {
          buffer: Buffer.from('some-data'),
          format: 'png'
        }
      };
      
      slide.setBackground(background);
      const result = slide.toJSON('legacy');
      
      // Should prioritize base64 URL over imageData
      expect(result.background.image).toBe('data:image/png;base64,abcd1234');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large background objects efficiently', () => {
      const largeGradient: SlideBackground = {
        type: 'gradient',
        colors: Array.from({ length: 100 }, (_, i) => ({
          color: `hsl(${i * 3.6}, 100%, 50%)`,
          position: i / 99
        }))
      };
      
      slide.setBackground(largeGradient);
      const start = performance.now();
      const result = slide.toJSON('pptist');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10); // Should complete within 10ms
      expect(result.background.colors).toHaveLength(100);
    });

    it('should not modify original background object', () => {
      const background: SlideBackground = {
        type: 'image',
        imageUrl: 'original-url.png'
      };
      
      const originalUrl = background.imageUrl;
      slide.setBackground(background);
      slide.toJSON('legacy');
      slide.toJSON('pptist');
      
      expect(background.imageUrl).toBe(originalUrl); // Should remain unchanged
    });
  });
});