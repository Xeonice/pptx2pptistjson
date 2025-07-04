/**
 * ImageDataService 单元测试
 * 测试图像数据服务的提取、格式检测、批量处理和错误处理
 */

import { ImageDataService, ImageData, ImageProcessResult } from '../../../app/lib/services/images/ImageDataService';
import { FileService } from '../../../app/lib/services/core/FileService';
import { ProcessingContext } from '../../../app/lib/services/interfaces/ProcessingContext';
import { Theme } from '../../../app/lib/models/domain/Theme';
import { ParseOptions } from '../../../app/lib/models/dto/ParseOptions';
import JSZip from 'jszip';

// Mock FileService
class MockFileService extends FileService {
  private mockFiles: Map<string, Buffer> = new Map();
  
  setMockFile(path: string, content: Buffer): void {
    this.mockFiles.set(path, content);
  }

  async extractBinaryFileAsBuffer(zip: JSZip, path: string): Promise<Buffer> {
    const mockContent = this.mockFiles.get(path);
    if (!mockContent) {
      throw new Error(`Mock file not found: ${path}`);
    }
    return mockContent;
  }
}

// Mock Processing Context
const createMockContext = (relationships: Map<string, any> = new Map()): ProcessingContext => ({
  zip: {} as JSZip,
  relationships,
  slideNumber: 1,
  slideId: 'test-slide',
  theme: new Theme('test-theme'),
  basePath: '/test',
  options: {} as ParseOptions,
  warnings: [],
  idGenerator: { generateId: () => 'test-id' } as any
});

// Image format test data
const createImageBuffer = (format: string): Buffer => {
  switch (format) {
    case 'png':
      return Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);
    case 'jpeg':
      return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    case 'gif':
      // Create proper GIF header with enough bytes
      const gifBuffer = Buffer.alloc(10);
      gifBuffer.write('GIF87a', 0, 'ascii');
      return gifBuffer;
    case 'bmp':
      return Buffer.from([0x42, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    case 'webp':
      return Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP', 'ascii')
      ]);
    case 'tiff':
      // Create longer TIFF header
      return Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);
    default:
      return Buffer.from('unknown format');
  }
};

describe('ImageDataService Unit Tests', () => {
  let imageService: ImageDataService;
  let mockFileService: MockFileService;

  beforeEach(() => {
    mockFileService = new MockFileService();
    imageService = new ImageDataService(mockFileService);
  });

  describe('Image Data Extraction', () => {
    it('should extract image data successfully', async () => {
      const embedId = 'rId1';
      const imagePath = '../media/image1.png';
      const imageBuffer = createImageBuffer('png');

      // Setup mock data
      const relationships = new Map();
      relationships.set(embedId, imagePath);
      mockFileService.setMockFile('ppt/media/image1.png', imageBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.buffer).toEqual(imageBuffer);
      expect(result?.format).toBe('png');
      expect(result?.mimeType).toBe('image/png');
      expect(result?.filename).toBe('image1.png');
      expect(result?.size).toBe(imageBuffer.length);
      expect(result?.hash).toBeDefined();
    });

    it('should handle missing relationship', async () => {
      const embedId = 'nonexistent';
      const context = createMockContext();

      const result = await imageService.extractImageData(embedId, context);
      expect(result).toBeNull();
    });

    it('should handle missing file in ZIP', async () => {
      const embedId = 'rId1';
      const imagePath = '../media/missing.png';

      const relationships = new Map();
      relationships.set(embedId, imagePath);
      const context = createMockContext(relationships);

      const result = await imageService.extractImageData(embedId, context);
      expect(result).toBeNull();
    });

    it('should handle relationship object format', async () => {
      const embedId = 'rId1';
      const relationshipObj = { target: '../media/image1.png' };
      const imageBuffer = createImageBuffer('png');

      const relationships = new Map();
      relationships.set(embedId, relationshipObj);
      mockFileService.setMockFile('ppt/media/image1.png', imageBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.filename).toBe('image1.png');
    });

    it('should handle invalid relationship format', async () => {
      const embedId = 'rId1';
      const invalidRelationship = { invalidProperty: 'value' };

      const relationships = new Map();
      relationships.set(embedId, invalidRelationship);
      const context = createMockContext(relationships);

      const result = await imageService.extractImageData(embedId, context);
      expect(result).toBeNull();
    });
  });

  describe('Image Format Detection', () => {
    it('should detect PNG format correctly', async () => {
      const embedId = 'rId1';
      const pngBuffer = createImageBuffer('png');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.png');
      mockFileService.setMockFile('ppt/media/test.png', pngBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('png');
      expect(result?.mimeType).toBe('image/png');
    });

    it('should detect JPEG format correctly', async () => {
      const embedId = 'rId1';
      const jpegBuffer = createImageBuffer('jpeg');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.jpg');
      mockFileService.setMockFile('ppt/media/test.jpg', jpegBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('jpeg');
      expect(result?.mimeType).toBe('image/jpeg');
    });

    it('should detect GIF format correctly', async () => {
      const embedId = 'rId1';
      const gifBuffer = createImageBuffer('gif');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.gif');
      mockFileService.setMockFile('ppt/media/test.gif', gifBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('gif');
      expect(result?.mimeType).toBe('image/gif');
    });

    it('should detect BMP format correctly', async () => {
      const embedId = 'rId1';
      const bmpBuffer = createImageBuffer('bmp');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.bmp');
      mockFileService.setMockFile('ppt/media/test.bmp', bmpBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('bmp');
      expect(result?.mimeType).toBe('image/bmp');
    });

    it('should detect WebP format correctly', async () => {
      const embedId = 'rId1';
      const webpBuffer = createImageBuffer('webp');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.webp');
      mockFileService.setMockFile('ppt/media/test.webp', webpBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('webp');
      expect(result?.mimeType).toBe('image/webp');
    });

    it('should detect TIFF format correctly', async () => {
      const embedId = 'rId1';
      const tiffBuffer = createImageBuffer('tiff');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.tiff');
      mockFileService.setMockFile('ppt/media/test.tiff', tiffBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('tiff');
      expect(result?.mimeType).toBe('image/tiff');
    });

    it('should handle unknown format', async () => {
      const embedId = 'rId1';
      const unknownBuffer = createImageBuffer('unknown');
      
      const relationships = new Map();
      relationships.set(embedId, '../media/test.unknown');
      mockFileService.setMockFile('ppt/media/test.unknown', unknownBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('unknown');
      expect(result?.mimeType).toBe('application/octet-stream');
    });

    it('should handle very small buffers', async () => {
      const embedId = 'rId1';
      const tinyBuffer = Buffer.from([0x01, 0x02]); // Too small to determine format
      
      const relationships = new Map();
      relationships.set(embedId, '../media/tiny.bin');
      mockFileService.setMockFile('ppt/media/tiny.bin', tinyBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result?.format).toBe('unknown');
    });
  });

  describe('Base64 Encoding', () => {
    it('should encode image data to base64 correctly', () => {
      const imageData: ImageData = {
        buffer: Buffer.from('test image data'),
        filename: 'test.png',
        mimeType: 'image/png',
        format: 'png',
        size: 15,
        hash: 'testhash'
      };

      const result = imageService.encodeToBase64(imageData);
      const expectedBase64 = Buffer.from('test image data').toString('base64');
      
      expect(result).toBe(`data:image/png;base64,${expectedBase64}`);
    });

    it('should handle empty buffer', () => {
      const imageData: ImageData = {
        buffer: Buffer.alloc(0),
        filename: 'empty.png',
        mimeType: 'image/png',
        format: 'png',
        size: 0,
        hash: 'emptyhash'
      };

      const result = imageService.encodeToBase64(imageData);
      expect(result).toBe('data:image/png;base64,');
    });

    it('should handle large binary data', () => {
      const largeBuffer = Buffer.alloc(1024 * 1024); // 1MB
      largeBuffer.fill(0xFF);
      
      const imageData: ImageData = {
        buffer: largeBuffer,
        filename: 'large.png',
        mimeType: 'image/png',
        format: 'png',
        size: largeBuffer.length,
        hash: 'largehash'
      };

      const result = imageService.encodeToBase64(imageData);
      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(result.length).toBeGreaterThan(1000000); // Base64 encoding increases size
    });

    it('should throw error for invalid buffer', () => {
      const imageData: ImageData = {
        buffer: null as any,
        filename: 'test.png',
        mimeType: 'image/png',
        format: 'png',
        size: 0,
        hash: 'testhash'
      };

      expect(() => imageService.encodeToBase64(imageData)).toThrow('Failed to encode image to base64');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple images successfully', async () => {
      const embedIds = ['rId1', 'rId2', 'rId3'];
      const relationships = new Map();
      
      // Setup mock data for each image
      embedIds.forEach((embedId, index) => {
        const imagePath = `../media/image${index + 1}.png`;
        const imageBuffer = createImageBuffer('png');
        relationships.set(embedId, imagePath);
        mockFileService.setMockFile(`ppt/media/image${index + 1}.png`, imageBuffer);
      });

      const context = createMockContext(relationships);
      const results = await imageService.processBatch(embedIds, context);

      expect(results.size).toBe(3);
      embedIds.forEach(embedId => {
        const result = results.get(embedId);
        expect(result).toBeDefined();
        expect(result?.success).toBe(true);
        expect(result?.imageData).toBeDefined();
        expect(result?.dataUrl).toBeDefined();
      });
    });

    it('should handle mixed success and failure in batch', async () => {
      const embedIds = ['rId1', 'rId2', 'rId3'];
      const relationships = new Map();
      
      // Setup only some images
      relationships.set('rId1', '../media/image1.png');
      relationships.set('rId2', '../media/missing.png'); // This will fail
      relationships.set('rId3', '../media/image3.png');
      
      mockFileService.setMockFile('ppt/media/image1.png', createImageBuffer('png'));
      mockFileService.setMockFile('ppt/media/image3.png', createImageBuffer('jpeg'));

      const context = createMockContext(relationships);
      const results = await imageService.processBatch(embedIds, context);

      expect(results.size).toBe(3);
      
      // rId1 should succeed
      expect(results.get('rId1')?.success).toBe(true);
      
      // rId2 should fail
      expect(results.get('rId2')?.success).toBe(false);
      expect(results.get('rId2')?.error).toBeDefined();
      
      // rId3 should succeed
      expect(results.get('rId3')?.success).toBe(true);
    });

    it('should handle empty batch', async () => {
      const embedIds: string[] = [];
      const context = createMockContext();
      
      const results = await imageService.processBatch(embedIds, context);
      expect(results.size).toBe(0);
    });

    it('should handle concurrent processing efficiently', async () => {
      // Create a large batch to test concurrency
      const embedIds = Array.from({ length: 20 }, (_, i) => `rId${i + 1}`);
      const relationships = new Map();
      
      embedIds.forEach((embedId, index) => {
        const imagePath = `../media/image${index + 1}.png`;
        const imageBuffer = createImageBuffer('png');
        relationships.set(embedId, imagePath);
        mockFileService.setMockFile(`ppt/media/image${index + 1}.png`, imageBuffer);
      });

      const context = createMockContext(relationships);
      const startTime = performance.now();
      
      const results = await imageService.processBatch(embedIds, context);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.size).toBe(20);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All should be successful
      embedIds.forEach(embedId => {
        expect(results.get(embedId)?.success).toBe(true);
      });
    });
  });

  describe('Path Resolution', () => {
    it('should resolve relative paths correctly', async () => {
      const embedId = 'rId1';
      const relativePath = '../media/image1.png';
      const imageBuffer = createImageBuffer('png');

      const relationships = new Map();
      relationships.set(embedId, relativePath);
      mockFileService.setMockFile('ppt/media/image1.png', imageBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.filename).toBe('image1.png');
    });

    it('should handle complex relative paths', async () => {
      const embedId = 'rId1';
      const complexPath = '../media/image1.png';
      const imageBuffer = createImageBuffer('png');

      const relationships = new Map();
      relationships.set(embedId, complexPath);
      // The path resolution removes leading '../' and prepends 'ppt/'
      mockFileService.setMockFile('ppt/media/image1.png', imageBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.filename).toBe('image1.png');
    });
  });

  describe('Hash Generation', () => {
    it('should generate consistent hashes for same content', async () => {
      const embedId1 = 'rId1';
      const embedId2 = 'rId2';
      const sameContent = createImageBuffer('png');

      const relationships = new Map();
      relationships.set(embedId1, '../media/image1.png');
      relationships.set(embedId2, '../media/image2.png');
      
      mockFileService.setMockFile('ppt/media/image1.png', sameContent);
      mockFileService.setMockFile('ppt/media/image2.png', sameContent);

      const context = createMockContext(relationships);
      
      const result1 = await imageService.extractImageData(embedId1, context);
      const result2 = await imageService.extractImageData(embedId2, context);

      expect(result1?.hash).toBe(result2?.hash);
    });

    it('should generate different hashes for different content', async () => {
      const embedId1 = 'rId1';
      const embedId2 = 'rId2';
      const content1 = createImageBuffer('png');
      const content2 = createImageBuffer('jpeg');

      const relationships = new Map();
      relationships.set(embedId1, '../media/image1.png');
      relationships.set(embedId2, '../media/image2.jpg');
      
      mockFileService.setMockFile('ppt/media/image1.png', content1);
      mockFileService.setMockFile('ppt/media/image2.jpg', content2);

      const context = createMockContext(relationships);
      
      const result1 = await imageService.extractImageData(embedId1, context);
      const result2 = await imageService.extractImageData(embedId2, context);

      expect(result1?.hash).not.toBe(result2?.hash);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle FileService errors gracefully', async () => {
      const embedId = 'rId1';
      const relationships = new Map();
      relationships.set(embedId, '../media/error.png');

      // Mock FileService to throw an error
      mockFileService.extractBinaryFileAsBuffer = jest.fn().mockRejectedValue(new Error('File access error'));

      // Suppress expected console.error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeNull();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });

    it('should handle context without relationships', async () => {
      const embedId = 'rId1';
      const context = createMockContext(); // No relationships

      // Suppress expected console.warn output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await imageService.extractImageData(embedId, context);
      expect(result).toBeNull();
      
      // Restore console.warn
      consoleSpy.mockRestore();
    });

    it('should handle very large image files', async () => {
      const embedId = 'rId1';
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      largeBuffer.fill(0xFF);
      // Add PNG signature
      largeBuffer.writeUInt32BE(0x89504E47, 0);
      largeBuffer.writeUInt32BE(0x0D0A1A0A, 4);

      const relationships = new Map();
      relationships.set(embedId, '../media/large.png');
      mockFileService.setMockFile('ppt/media/large.png', largeBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.size).toBe(largeBuffer.length);
    });

    it('should handle zero-byte files', async () => {
      const embedId = 'rId1';
      const emptyBuffer = Buffer.alloc(0);

      const relationships = new Map();
      relationships.set(embedId, '../media/empty.png');
      mockFileService.setMockFile('ppt/media/empty.png', emptyBuffer);

      const context = createMockContext(relationships);
      const result = await imageService.extractImageData(embedId, context);

      expect(result).toBeDefined();
      expect(result?.size).toBe(0);
      expect(result?.format).toBe('unknown');
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during batch processing', async () => {
      const embedIds = Array.from({ length: 100 }, (_, i) => `rId${i + 1}`);
      const relationships = new Map();
      
      // Setup many images
      embedIds.forEach((embedId, index) => {
        const imagePath = `../media/image${index + 1}.png`;
        const imageBuffer = createImageBuffer('png');
        relationships.set(embedId, imagePath);
        mockFileService.setMockFile(`ppt/media/image${index + 1}.png`, imageBuffer);
      });

      const context = createMockContext(relationships);
      const initialMemory = process.memoryUsage().heapUsed;
      
      await imageService.processBatch(embedIds, context);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});