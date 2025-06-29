import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SlideParser } from '@/lib/services/parsing/SlideParser';
import { ServiceContainer } from '@/lib/services/ServiceContainer';
import { Slide, SlideBackground } from '@/lib/models/domain/Slide';
import { XmlParseService } from '@/lib/services/core/XmlParseService';
import { ImageDataService } from '@/lib/services/images/ImageDataService';
import { ProcessingContext } from '@/lib/services/interfaces/ProcessingContext';
import { XmlNode } from '@/lib/models/xml/XmlNode';

describe('Background Image Processing', () => {
  let slideParser: SlideParser;
  let xmlParseService: XmlParseService;
  let imageDataService: ImageDataService;
  let mockContext: ProcessingContext;

  beforeEach(() => {
    // Setup services
    const fileService = {} as any; // Mock file service
    xmlParseService = new XmlParseService();
    imageDataService = new ImageDataService({} as any);
    
    // Mock the image data service for testing
    jest.spyOn(imageDataService, 'extractImageData');
    jest.spyOn(imageDataService, 'encodeToBase64');
    
    slideParser = new SlideParser(fileService, xmlParseService, imageDataService);
    
    // Setup mock processing context
    mockContext = {
      relationships: new Map([
        ['rId1', { target: 'media/image1.jpeg' }],
        ['rId2', { target: 'media/image2.png' }]
      ]),
      zip: {} as any,
      theme: undefined
    };
  });

  describe('SlideParser.parseBackground()', () => {
    it('should parse solid color background', async () => {
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:solidFill>
                  <a:srgbClr val="FF0000"/>
                </a:solidFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('solid');
      expect(background?.color).toBeDefined();
    });

    it('should parse gradient background', async () => {
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:gradFill>
                  <a:gsLst>
                    <a:gs pos="0">
                      <a:srgbClr val="FF0000"/>
                    </a:gs>
                    <a:gs pos="100000">
                      <a:srgbClr val="0000FF"/>
                    </a:gs>
                  </a:gsLst>
                </a:gradFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('gradient');
      expect(background?.colors).toBeDefined();
      expect(Array.isArray(background?.colors)).toBe(true);
    });

    it('should parse image background with base64 encoding', async () => {
      // Mock successful image data extraction
      const mockImageData = {
        data: Buffer.from('fake-image-data'),
        format: 'jpeg' as const,
        mimeType: 'image/jpeg'
      };
      
      (imageDataService.extractImageData as jest.MockedFunction<any>).mockResolvedValue(mockImageData);
      (imageDataService.encodeToBase64 as jest.MockedFunction<any>).mockReturnValue('data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh');
      
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="rId1"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('image');
      expect(background?.imageUrl).toBe('data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh');
      expect(background?.imageData).toEqual(mockImageData);
      expect(imageDataService.extractImageData).toHaveBeenCalledWith('rId1', mockContext);
    });

    it('should fallback to relationship URL when image extraction fails', async () => {
      // Mock failed image data extraction
      (imageDataService.extractImageData as jest.MockedFunction<any>).mockRejectedValue(new Error('Image not found'));
      
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="rId1"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('image');
      expect(background?.imageUrl).toBe('media/image1.jpeg');
      expect(background?.imageData).toBeUndefined();
    });

    it('should handle missing background element', async () => {
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main">
          <sld:cSld>
            <!-- No background element -->
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeUndefined();
    });

    it('should handle unknown relationship ID', async () => {
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="unknownRId"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('image');
      expect(background?.imageUrl).toBe('unknownRId'); // Falls back to embed ID
    });
  });

  describe('Background Image Format Support', () => {
    const testImageFormats = [
      { format: 'jpeg', mimeType: 'image/jpeg', expectedPrefix: 'data:image/jpeg;base64,' },
      { format: 'png', mimeType: 'image/png', expectedPrefix: 'data:image/png;base64,' },
      { format: 'gif', mimeType: 'image/gif', expectedPrefix: 'data:image/gif;base64,' },
      { format: 'bmp', mimeType: 'image/bmp', expectedPrefix: 'data:image/bmp;base64,' },
      { format: 'webp', mimeType: 'image/webp', expectedPrefix: 'data:image/webp;base64,' }
    ];

    testImageFormats.forEach(({ format, mimeType, expectedPrefix }) => {
      it(`should process ${format.toUpperCase()} background images`, async () => {
        const mockImageData = {
          data: Buffer.from(`fake-${format}-data`),
          format: format as any,
          mimeType
        };
        
        (imageDataService.extractImageData as jest.MockedFunction<any>).mockResolvedValue(mockImageData);
        (imageDataService.encodeToBase64 as jest.MockedFunction<any>).mockReturnValue(`${expectedPrefix}ZmFrZS1kYXRh`);
        
        const mockSlideXml = `
          <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                   xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
            <sld:cSld>
              <sld:bg>
                <sld:bgPr>
                  <a:blipFill>
                    <a:blip r:embed="rId1"/>
                  </a:blipFill>
                </sld:bgPr>
              </sld:bg>
            </sld:cSld>
          </sld:sld>
        `;
        
        const slideNode = xmlParseService.parse(mockSlideXml);
        const background = await (slideParser as any).parseBackground(slideNode, mockContext);
        
        expect(background).toBeDefined();
        expect(background?.type).toBe('image');
        expect(background?.imageUrl).toContain(expectedPrefix);
        expect(background?.imageData?.format).toBe(format);
        expect(background?.imageData?.mimeType).toBe(mimeType);
      });
    });
  });

  describe('Slide.convertBackground()', () => {
    it('should convert solid background to JSON', () => {
      const slide = new Slide();
      const solidBackground: SlideBackground = {
        type: 'solid',
        color: '#FF0000'
      };
      
      slide.setBackground(solidBackground);
      const json = slide.toJSON();
      
      expect(json.background).toBeDefined();
      expect(json.background.type).toBe('solid');
      expect(json.background.color).toBe('#FF0000');
    });

    it('should convert gradient background to JSON', () => {
      const slide = new Slide();
      const gradientBackground: SlideBackground = {
        type: 'gradient',
        colors: [
          { color: '#FF0000', position: 0 },
          { color: '#0000FF', position: 100 }
        ]
      };
      
      slide.setBackground(gradientBackground);
      const json = slide.toJSON();
      
      expect(json.background).toBeDefined();
      expect(json.background.type).toBe('gradient');
      expect(json.background.colors).toHaveLength(2);
      expect(json.background.colors[0]).toEqual({ color: '#FF0000', position: 0 });
      expect(json.background.colors[1]).toEqual({ color: '#0000FF', position: 100 });
    });

    it('should convert image background with base64 to JSON', () => {
      const slide = new Slide();
      const imageBackground: SlideBackground = {
        type: 'image',
        imageUrl: 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh',
        imageData: {
          data: Buffer.from('fake-image-data'),
          format: 'jpeg',
          mimeType: 'image/jpeg'
        }
      };
      
      slide.setBackground(imageBackground);
      const json = slide.toJSON();
      
      expect(json.background).toBeDefined();
      expect(json.background.type).toBe('image');
      expect(json.background.image).toBe('data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh');
      expect(json.background.imageSize).toBe('cover');
    });

    it('should convert image background with URL to JSON', () => {
      const slide = new Slide();
      const imageBackground: SlideBackground = {
        type: 'image',
        imageUrl: 'media/image1.jpeg'
      };
      
      slide.setBackground(imageBackground);
      const json = slide.toJSON();
      
      expect(json.background).toBeDefined();
      expect(json.background.type).toBe('image');
      expect(json.background.image).toBe('https://example.com/backgrounds/media/image1.jpeg.png');
      expect(json.background.imageSize).toBe('cover');
    });

    it('should handle missing background gracefully', () => {
      const slide = new Slide();
      const json = slide.toJSON();
      
      // The implementation returns a default background when none is set
      expect(json.background).toBeDefined();
      expect(json.background.type).toBe('image');
      expect(json.background.image).toBe('https://example.com/background.png');
    });
  });

  describe('Error Handling', () => {
    it('should handle XML parsing errors gracefully', async () => {
      const invalidXml = '<invalid-xml>';
      
      expect(() => {
        xmlParseService.parseFromString(invalidXml);
      }).toThrow();
    });

    it('should handle image service initialization without crash', async () => {
      // Test with null image service
      const slideParserWithoutImageService = new SlideParser({} as any, xmlParseService, undefined);
      
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="rId1"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParserWithoutImageService as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('image');
      expect(background?.imageUrl).toBe('media/image1.jpeg'); // Falls back to relationship
    });

    it('should handle corrupted image data gracefully', async () => {
      // Mock corrupted image data
      (imageDataService.extractImageData as jest.MockedFunction<any>).mockRejectedValue(new Error('Corrupted image'));
      
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="rId1"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      const background = await (slideParser as any).parseBackground(slideNode, mockContext);
      
      expect(background).toBeDefined();
      expect(background?.type).toBe('image');
      expect(background?.imageUrl).toBe('media/image1.jpeg'); // Should fallback
    });
  });

  describe('Integration Tests', () => {
    it('should integrate with ImageDataService for concurrent processing', async () => {
      const mockImageData = {
        data: Buffer.from('concurrent-test-data'),
        format: 'jpeg' as const,
        mimeType: 'image/jpeg'
      };
      
      (imageDataService.extractImageData as jest.MockedFunction<any>).mockResolvedValue(mockImageData);
      (imageDataService.encodeToBase64 as jest.MockedFunction<any>).mockReturnValue('data:image/jpeg;base64,Y29uY3VycmVudA==');
      
      // Test multiple background images processed concurrently
      const mockSlideXml = `
        <sld:sld xmlns:sld="http://schemas.openxmlformats.org/presentationml/2006/main" 
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sld:cSld>
            <sld:bg>
              <sld:bgPr>
                <a:blipFill>
                  <a:blip r:embed="rId1"/>
                </a:blipFill>
              </sld:bgPr>
            </sld:bg>
          </sld:cSld>
        </sld:sld>
      `;
      
      const slideNode = xmlParseService.parse(mockSlideXml);
      
      // Process multiple slides concurrently
      const promises = Array.from({ length: 3 }, async () => {
        return await (slideParser as any).parseBackground(slideNode, mockContext);
      });
      
      const results = await Promise.all(promises);
      
      results.forEach(background => {
        expect(background).toBeDefined();
        expect(background?.type).toBe('image');
        expect(background?.imageUrl).toContain('data:image/jpeg;base64,');
      });
      
      expect(imageDataService.extractImageData).toHaveBeenCalledTimes(3);
    });
  });
});