import { ImageDataService, ImageData } from '@/lib/services/images/ImageDataService';
import { ImageElement } from '@/lib/models/domain/elements/ImageElement';
import { Base64StorageStrategy } from '@/lib/services/images/interfaces/ImageStorageStrategy';
import { ProcessingContext } from '@/lib/services/interfaces/ProcessingContext';
import { IdGenerator } from '@/lib/services/utils/IdGenerator';

describe('Image Base64 Processing', () => {
  describe('ImageDataService', () => {
    let imageDataService: ImageDataService;
    let mockContext: ProcessingContext;

    beforeEach(() => {
      const mockFileService = {
        loadZip: jest.fn(),
        extractFile: jest.fn(),
        extractBinaryFile: jest.fn(),
        extractBinaryFileAsBuffer: jest.fn().mockResolvedValue(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])),
        listFiles: jest.fn(),
        getFileInfo: jest.fn()
      };
      
      imageDataService = new ImageDataService(mockFileService as any);
      mockContext = {
        relationships: new Map([['rId1', '../media/image1.jpeg']]), // 直接存储字符串，不是对象
        zip: {} as any,
        fileService: mockFileService
      } as any;
    });

    test('should detect JPEG format correctly', () => {
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const format = (imageDataService as any).detectImageFormat(jpegHeader);
      expect(format).toBe('jpeg');
    });

    test('should detect PNG format correctly', () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const format = (imageDataService as any).detectImageFormat(pngHeader);
      expect(format).toBe('png');
    });

    test('should detect GIF format correctly', () => {
      const gifHeader = Buffer.from('GIF89a\x00\x00'); // 确保有足够字节
      const format = (imageDataService as any).detectImageFormat(gifHeader);
      expect(format).toBe('gif');
    });

    test('should return unknown for invalid format', () => {
      const invalidHeader = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const format = (imageDataService as any).detectImageFormat(invalidHeader);
      expect(format).toBe('unknown');
    });

    test('should generate correct MIME types', () => {
      expect((imageDataService as any).getMimeType('jpeg')).toBe('image/jpeg');
      expect((imageDataService as any).getMimeType('png')).toBe('image/png');
      expect((imageDataService as any).getMimeType('gif')).toBe('image/gif');
      expect((imageDataService as any).getMimeType('unknown')).toBe('application/octet-stream');
    });

    test('should encode image to base64 correctly', () => {
      const testBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const imageData: ImageData = {
        buffer: testBuffer,
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: testBuffer.length,
        hash: 'testhash'
      };

      const dataUrl = imageDataService.encodeToBase64(imageData);
      expect(dataUrl).toBe('data:image/jpeg;base64,/9j/4A==');
    });

    test('should handle extraction errors gracefully', async () => {
      const mockFileService = {
        loadZip: jest.fn(),
        extractFile: jest.fn(),
        extractBinaryFile: jest.fn(),
        extractBinaryFileAsBuffer: jest.fn().mockRejectedValue(new Error('File not found')),
        listFiles: jest.fn(),
        getFileInfo: jest.fn()
      };
      
      const errorImageDataService = new ImageDataService(mockFileService as any);
      const context = {
        ...mockContext,
        fileService: mockFileService
      };

      const result = await errorImageDataService.extractImageData('rId1', context);
      expect(result).toBeNull();
    });
  });

  describe('ImageElement', () => {
    test('should output base64 format when image data is available', () => {
      const element = new ImageElement('img1', '../media/image1.jpg');
      element.setPosition({ x: 100, y: 200 });
      element.setSize({ width: 300, height: 400 });

      const imageData: ImageData = {
        buffer: Buffer.from('test'),
        filename: 'image1.jpg',
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: 4,
        hash: 'testhash'
      };

      const dataUrl = 'data:image/jpeg;base64,dGVzdA==';
      element.setImageData(imageData, dataUrl);

      const json = element.toJSON();

      expect(json.mode).toBe('base64');
      expect(json.src).toBe(dataUrl);
      expect(json.format).toBe('jpeg');
      expect(json.mimeType).toBe('image/jpeg');
      expect(json.originalSize).toBe(4);
      expect(json.originalSrc).toBe('../media/image1.jpg');
    });

    test('should output URL format when no image data available', () => {
      const element = new ImageElement('img1', '../media/image1.jpg');
      element.setPosition({ x: 100, y: 200 });
      element.setSize({ width: 300, height: 400 });

      const json = element.toJSON();

      expect(json.mode).toBe('url');
      expect(json.src).toBe('https://example.com/images/image1.jpg');
      expect(json.format).toBeUndefined();
    });

    test('should handle crop information correctly', () => {
      const element = new ImageElement('img1', '../media/image1.jpg');
      element.setCrop({
        left: 10,
        top: 20,
        right: 30,
        bottom: 40
      });

      const json = element.toJSON();
      expect(json.clip.range).toEqual([[10, 20], [70, 60]]);
    });
  });

  describe('Base64StorageStrategy', () => {
    let strategy: Base64StorageStrategy;

    beforeEach(() => {
      strategy = new Base64StorageStrategy();
    });

    test('should upload image data successfully', async () => {
      const imageData = {
        buffer: Buffer.from('test'),
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: 4,
        hash: 'testhash'
      };

      const result = await strategy.upload(imageData);

      expect(result.success).toBe(true);
      expect(result.url).toBe('data:image/jpeg;base64,dGVzdA==');
      expect(result.imageId).toBe('testhash');
    });

    test('should always be available', async () => {
      const available = await strategy.checkAvailability();
      expect(available).toBe(true);
    });

    test('should have healthy status', async () => {
      const health = await strategy.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.errorRate).toBe(0);
    });

    test('should handle buffer encoding errors', async () => {
      const imageData = {
        buffer: null as any, // 故意传入无效buffer
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        format: 'jpeg',
        size: 0,
        hash: 'testhash'
      };

      const result = await strategy.upload(imageData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should process image from PPTX to base64 end-to-end', async () => {
      // 模拟完整的图片处理流程
      const mockBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]); // 完整JPEG header
      
      const mockFileService = {
        loadZip: jest.fn(),
        extractFile: jest.fn(),
        extractBinaryFile: jest.fn(),
        extractBinaryFileAsBuffer: jest.fn().mockResolvedValue(mockBuffer),
        listFiles: jest.fn(),
        getFileInfo: jest.fn()
      };

      const mockContext: ProcessingContext = {
        relationships: new Map([['rId1', { id: 'rId1', type: 'image', target: '../media/image1.jpeg' }]]),
        zip: {} as any,
        slideNumber: 1,
        slideId: 'slide1',
        basePath: '',
        options: {},
        warnings: [],
        idGenerator: new IdGenerator()
      } as any;

      const imageDataService = new ImageDataService(mockFileService as any);
      const imageData = await imageDataService.extractImageData('rId1', mockContext);

      expect(imageData).not.toBeNull();
      expect(imageData!.format).toBe('jpeg');
      expect(imageData!.mimeType).toBe('image/jpeg');
      expect(imageData!.buffer).toEqual(mockBuffer);

      const dataUrl = imageDataService.encodeToBase64(imageData!);
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);

      const element = new ImageElement('img1', '../media/image1.jpeg');
      element.setImageData(imageData!, dataUrl);

      const json = element.toJSON();
      expect(json.mode).toBe('base64');
      expect(json.src).toBe(dataUrl);
    });

    test('should handle memory management with multiple images', async () => {
      const mockFileService = {
        loadZip: jest.fn(),
        extractFile: jest.fn(),
        extractBinaryFile: jest.fn(),
        extractBinaryFileAsBuffer: jest.fn().mockResolvedValue(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46])),
        listFiles: jest.fn(),
        getFileInfo: jest.fn()
      };
      const imageDataService = new ImageDataService(mockFileService as any);
      const mockContext: ProcessingContext = {
        relationships: new Map([
          ['rId1', '../media/image1.jpeg'],
          ['rId2', '../media/image2.png'],
          ['rId3', '../media/image3.gif']
        ]),
        zip: {} as any,
        fileService: mockFileService
      } as any;

      const embedIds = ['rId1', 'rId2', 'rId3'];
      const results = await imageDataService.processBatch(embedIds, mockContext);

      expect(results.size).toBe(3);
      expect(results.get('rId1')?.success).toBe(true);
      expect(results.get('rId2')?.success).toBe(true);
      expect(results.get('rId3')?.success).toBe(true);
    });
  });
});