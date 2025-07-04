/**
 * FileService 单元测试
 * 测试文件服务的ZIP处理、文件提取和错误处理能力
 */

import { FileService } from '../../../app/lib/services/core/FileService';
import JSZip from 'jszip';

describe('FileService Unit Tests', () => {
  let fileService: FileService;
  let mockZip: JSZip;

  beforeEach(() => {
    fileService = new FileService();
    mockZip = new JSZip();
  });

  describe('ZIP Loading', () => {
    it('should load ZIP from ArrayBuffer successfully', async () => {
      // Create a simple ZIP file
      const zip = new JSZip();
      zip.file('test.txt', 'Hello World');
      const zipData = await zip.generateAsync({ type: 'arraybuffer' });

      const loadedZip = await fileService.loadZip(zipData);
      expect(loadedZip).toBeDefined();
      expect(loadedZip.file('test.txt')).toBeTruthy();
    });

    it('should load ZIP from Blob successfully', async () => {
      // Create a simple ZIP file
      const zip = new JSZip();
      zip.file('test.txt', 'Hello World');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const loadedZip = await fileService.loadZip(zipBlob);
      expect(loadedZip).toBeDefined();
      expect(loadedZip.file('test.txt')).toBeTruthy();
    });

    it('should handle corrupted ZIP files', async () => {
      const corruptedData = new ArrayBuffer(10);
      const view = new Uint8Array(corruptedData);
      view.fill(0xFF); // Fill with invalid data

      await expect(fileService.loadZip(corruptedData)).rejects.toThrow('Failed to load ZIP file');
    });

    it('should handle empty ArrayBuffer', async () => {
      const emptyData = new ArrayBuffer(0);
      await expect(fileService.loadZip(emptyData)).rejects.toThrow('Failed to load ZIP file');
    });

    it('should handle null/undefined input', async () => {
      await expect(fileService.loadZip(null as any)).rejects.toThrow();
      await expect(fileService.loadZip(undefined as any)).rejects.toThrow();
    });
  });

  describe('Text File Extraction', () => {
    beforeEach(() => {
      // Setup mock ZIP with various files
      mockZip.file('test.txt', 'Hello World');
      mockZip.file('folder/nested.txt', 'Nested content');
      mockZip.file('empty.txt', '');
      mockZip.file('large.txt', 'x'.repeat(1024 * 1024)); // 1MB file
      mockZip.file('unicode.txt', 'Unicode: 中文测试 🚀');
    });

    it('should extract text file successfully', async () => {
      const content = await fileService.extractFile(mockZip, 'test.txt');
      expect(content).toBe('Hello World');
    });

    it('should extract nested file successfully', async () => {
      const content = await fileService.extractFile(mockZip, 'folder/nested.txt');
      expect(content).toBe('Nested content');
    });

    it('should extract empty file successfully', async () => {
      const content = await fileService.extractFile(mockZip, 'empty.txt');
      expect(content).toBe('');
    });

    it('should extract large file successfully', async () => {
      const content = await fileService.extractFile(mockZip, 'large.txt');
      expect(content).toBe('x'.repeat(1024 * 1024));
      expect(content.length).toBe(1024 * 1024);
    });

    it('should extract Unicode content correctly', async () => {
      const content = await fileService.extractFile(mockZip, 'unicode.txt');
      expect(content).toBe('Unicode: 中文测试 🚀');
    });

    it('should throw error for non-existent file', async () => {
      await expect(fileService.extractFile(mockZip, 'nonexistent.txt')).rejects.toThrow('File not found in ZIP: nonexistent.txt');
    });

    it('should handle file extraction errors', async () => {
      // Mock a file that exists but throws error on extraction
      const mockFile = {
        async: jest.fn().mockRejectedValue(new Error('Extraction error'))
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      await expect(fileService.extractFile(mockZip, 'error.txt')).rejects.toThrow('Failed to extract file error.txt');
    });
  });

  describe('Binary File Extraction', () => {
    beforeEach(() => {
      // Setup mock ZIP with binary files
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG signature
      mockZip.file('image.png', binaryData);
      mockZip.file('empty.bin', Buffer.alloc(0));
      mockZip.file('large.bin', Buffer.alloc(1024 * 1024).fill(0xAA));
    });

    it('should extract binary file as ArrayBuffer', async () => {
      const mockFile = {
        async: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      const result = await fileService.extractBinaryFile(mockZip, 'image.png');
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(8);
    });

    it('should extract binary file as Buffer', async () => {
      const expectedBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const mockFile = {
        async: jest.fn().mockResolvedValue(expectedBuffer)
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      const result = await fileService.extractBinaryFileAsBuffer(mockZip, 'image.png');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(expectedBuffer);
    });

    it('should handle empty binary files', async () => {
      const mockFile = {
        async: jest.fn().mockResolvedValue(Buffer.alloc(0))
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      const result = await fileService.extractBinaryFileAsBuffer(mockZip, 'empty.bin');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle large binary files', async () => {
      const largeBuffer = Buffer.alloc(1024 * 1024).fill(0xAA);
      const mockFile = {
        async: jest.fn().mockResolvedValue(largeBuffer)
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      const result = await fileService.extractBinaryFileAsBuffer(mockZip, 'large.bin');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(1024 * 1024);
    });

    it('should throw error for non-existent binary file', async () => {
      mockZip.file = jest.fn().mockReturnValue(null);

      await expect(fileService.extractBinaryFile(mockZip, 'nonexistent.bin')).rejects.toThrow('File not found in ZIP: nonexistent.bin');
      await expect(fileService.extractBinaryFileAsBuffer(mockZip, 'nonexistent.bin')).rejects.toThrow('File not found in ZIP: nonexistent.bin');
    });

    it('should handle binary file extraction errors', async () => {
      const mockFile = {
        async: jest.fn().mockRejectedValue(new Error('Binary extraction error'))
      };
      mockZip.file = jest.fn().mockReturnValue(mockFile);

      await expect(fileService.extractBinaryFile(mockZip, 'error.bin')).rejects.toThrow('Failed to extract binary file error.bin');
      await expect(fileService.extractBinaryFileAsBuffer(mockZip, 'error.bin')).rejects.toThrow('Failed to extract binary file as buffer error.bin');
    });
  });

  describe('File Existence Check', () => {
    beforeEach(() => {
      mockZip.file('existing.txt', 'content');
      mockZip.folder('folder');
      mockZip.file('folder/nested.txt', 'nested content');
    });

    it('should return true for existing files', () => {
      expect(fileService.fileExists(mockZip, 'existing.txt')).toBe(true);
      expect(fileService.fileExists(mockZip, 'folder/nested.txt')).toBe(true);
    });

    it('should return false for non-existent files', () => {
      expect(fileService.fileExists(mockZip, 'nonexistent.txt')).toBe(false);
      expect(fileService.fileExists(mockZip, 'folder/nonexistent.txt')).toBe(false);
    });

    it('should return false for directories', () => {
      expect(fileService.fileExists(mockZip, 'folder')).toBe(false);
      expect(fileService.fileExists(mockZip, 'folder/')).toBe(false);
    });

    it('should handle empty path', () => {
      expect(fileService.fileExists(mockZip, '')).toBe(false);
    });

    it('should handle null ZIP', () => {
      expect(() => fileService.fileExists(null as any, 'test.txt')).toThrow();
    });
  });

  describe('File Listing', () => {
    beforeEach(() => {
      // Setup complex ZIP structure
      mockZip.file('root.txt', 'root content');
      mockZip.file('folder1/file1.txt', 'file1 content');
      mockZip.file('folder1/file2.xml', 'file2 content');
      mockZip.file('folder2/subfolder/file3.txt', 'file3 content');
      mockZip.file('folder2/image.png', 'image content');
      mockZip.file('document.docx', 'document content');
      mockZip.folder('empty-folder');
    });

    it('should list all files without pattern', () => {
      const files = fileService.listFiles(mockZip);
      
      expect(files).toContain('root.txt');
      expect(files).toContain('folder1/file1.txt');
      expect(files).toContain('folder1/file2.xml');
      expect(files).toContain('folder2/subfolder/file3.txt');
      expect(files).toContain('folder2/image.png');
      expect(files).toContain('document.docx');
      
      // Should not include directories
      expect(files).not.toContain('folder1/');
      expect(files).not.toContain('folder2/');
      expect(files).not.toContain('empty-folder/');
    });

    it('should filter files by pattern', () => {
      const txtFiles = fileService.listFiles(mockZip, /\.txt$/);
      expect(txtFiles).toContain('root.txt');
      expect(txtFiles).toContain('folder1/file1.txt');
      expect(txtFiles).toContain('folder2/subfolder/file3.txt');
      expect(txtFiles).not.toContain('folder1/file2.xml');
      expect(txtFiles).not.toContain('folder2/image.png');
    });

    it('should filter files by complex pattern', () => {
      const folderFiles = fileService.listFiles(mockZip, /^folder1\//);
      expect(folderFiles).toContain('folder1/file1.txt');
      expect(folderFiles).toContain('folder1/file2.xml');
      expect(folderFiles).not.toContain('root.txt');
      expect(folderFiles).not.toContain('folder2/subfolder/file3.txt');
    });

    it('should handle empty ZIP', () => {
      const emptyZip = new JSZip();
      const files = fileService.listFiles(emptyZip);
      expect(files).toEqual([]);
    });

    it('should handle pattern that matches nothing', () => {
      const files = fileService.listFiles(mockZip, /\.nonexistent$/);
      expect(files).toEqual([]);
    });

    it('should handle null ZIP', () => {
      expect(() => fileService.listFiles(null as any)).toThrow();
    });
  });

  describe('File Information', () => {
    beforeEach(() => {
      const testDate = new Date('2024-01-01T00:00:00Z');
      
      // Mock files with metadata
      const mockFile = {
        name: 'test.txt',
        date: testDate,
        _data: {
          uncompressedSize: 1024
        }
      };
      
      mockZip.file = jest.fn().mockReturnValue(mockFile);
    });

    it('should get file information successfully', async () => {
      const info = await fileService.getFileInfo(mockZip, 'test.txt');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('test.txt');
      expect(info.size).toBe(1024);
      expect(info.lastModified).toBeInstanceOf(Date);
    });

    it('should handle file without size data', async () => {
      const mockFile = {
        name: 'test.txt',
        date: new Date(),
        _data: null
      };
      
      mockZip.file = jest.fn().mockReturnValue(mockFile);
      
      const info = await fileService.getFileInfo(mockZip, 'test.txt');
      expect(info.size).toBe(0);
    });

    it('should throw error for non-existent file info', async () => {
      mockZip.file = jest.fn().mockReturnValue(null);
      
      await expect(fileService.getFileInfo(mockZip, 'nonexistent.txt')).rejects.toThrow('File not found in ZIP: nonexistent.txt');
    });

    it('should handle files with no date', async () => {
      const mockFile = {
        name: 'test.txt',
        date: null,
        _data: { uncompressedSize: 100 }
      };
      
      mockZip.file = jest.fn().mockReturnValue(mockFile);
      
      const info = await fileService.getFileInfo(mockZip, 'test.txt');
      expect(info.lastModified).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent file operations', async () => {
      // Setup multiple files
      for (let i = 0; i < 10; i++) {
        mockZip.file(`file${i}.txt`, `content${i}`);
      }

      // Perform concurrent extractions
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(fileService.extractFile(mockZip, `file${i}.txt`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      results.forEach((content, index) => {
        expect(content).toBe(`content${index}`);
      });
    });

    it('should handle file path with special characters', async () => {
      const specialPath = 'folder/file with spaces & special chars!.txt';
      mockZip.file(specialPath, 'special content');

      const content = await fileService.extractFile(mockZip, specialPath);
      expect(content).toBe('special content');
    });

    it('should handle very long file paths', async () => {
      const longPath = 'very/long/path/with/many/nested/folders/and/a/very/long/filename/that/exceeds/normal/limits.txt';
      mockZip.file(longPath, 'long path content');

      const content = await fileService.extractFile(mockZip, longPath);
      expect(content).toBe('long path content');
    });

    it('should handle files with unusual extensions', async () => {
      const unusualFiles = [
        'file.custom',
        'file.123',
        'file.CAPS',
        'file.'
      ];

      unusualFiles.forEach(fileName => {
        mockZip.file(fileName, `content for ${fileName}`);
      });

      for (const fileName of unusualFiles) {
        const content = await fileService.extractFile(mockZip, fileName);
        expect(content).toBe(`content for ${fileName}`);
      }
    });

    it('should handle ZIP files with unusual structure', async () => {
      // Files starting with ./
      mockZip.file('./relative.txt', 'relative content');
      
      // Files with backslashes (Windows paths)
      mockZip.file('windows\\path\\file.txt', 'windows content');
      
      // Files with Unicode names
      mockZip.file('文件.txt', 'unicode filename');

      const relativeContent = await fileService.extractFile(mockZip, './relative.txt');
      expect(relativeContent).toBe('relative content');

      const windowsContent = await fileService.extractFile(mockZip, 'windows\\path\\file.txt');
      expect(windowsContent).toBe('windows content');

      const unicodeContent = await fileService.extractFile(mockZip, '文件.txt');
      expect(unicodeContent).toBe('unicode filename');
    });

    it('should handle memory pressure during large file operations', async () => {
      // Create multiple large files
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB per file
      
      for (let i = 0; i < 5; i++) {
        mockZip.file(`large${i}.txt`, largeContent);
      }

      const startMemory = process.memoryUsage().heapUsed;
      
      // Extract all large files
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(fileService.extractFile(mockZip, `large${i}.txt`));
      }
      
      const results = await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      expect(results).toHaveLength(5);
      results.forEach(content => {
        expect(content.length).toBe(1024 * 1024);
      });
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of files efficiently', async () => {
      // Create many small files
      const fileCount = 1000;
      for (let i = 0; i < fileCount; i++) {
        mockZip.file(`file${i}.txt`, `content${i}`);
      }

      const startTime = performance.now();
      const files = fileService.listFiles(mockZip);
      const endTime = performance.now();

      expect(files).toHaveLength(fileCount);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle file existence checks efficiently', () => {
      // Create many files
      for (let i = 0; i < 1000; i++) {
        mockZip.file(`file${i}.txt`, `content${i}`);
      }

      const startTime = performance.now();
      
      // Check existence of many files
      for (let i = 0; i < 1000; i++) {
        fileService.fileExists(mockZip, `file${i}.txt`);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle pattern matching efficiently', () => {
      // Create files with various extensions
      const extensions = ['txt', 'xml', 'json', 'csv', 'log'];
      
      for (let i = 0; i < 1000; i++) {
        const ext = extensions[i % extensions.length];
        mockZip.file(`file${i}.${ext}`, `content${i}`);
      }

      const startTime = performance.now();
      const txtFiles = fileService.listFiles(mockZip, /\.txt$/);
      const endTime = performance.now();

      expect(txtFiles).toHaveLength(200); // 1000 / 5 = 200
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});