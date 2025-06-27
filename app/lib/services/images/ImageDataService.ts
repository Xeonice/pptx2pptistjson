import { ProcessingContext } from '../interfaces/ProcessingContext';
import { FileService } from '../core/FileService';

export interface ImageData {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  format: ImageFormat;
  size: number;
  hash: string;
  dimensions?: { width: number; height: number };
}

export interface ImageProcessResult {
  success: boolean;
  imageData?: ImageData;
  dataUrl?: string;
  error?: string;
}

export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'bmp' | 'webp' | 'tiff' | 'unknown';

export class ImageDataService {
  constructor(
    private fileService: FileService
  ) {}
  
  // 允许使用context中的fileService
  private getFileService(context: ProcessingContext): FileService {
    return this.fileService || context.fileService;
  }

  /**
   * 从PPTX中提取图片二进制数据
   */
  async extractImageData(embedId: string, context: ProcessingContext): Promise<ImageData | null> {
    try {
      // 从关系映射中获取图片路径
      const relationship = context.relationships.get(embedId);
      if (!relationship) {
        console.warn(`No relationship found for embedId: ${embedId}`);
        return null;
      }

      // 提取实际的图片路径（支持对象和字符串格式）
      let imagePath: string;
      if (typeof relationship === 'string') {
        imagePath = relationship;
      } else if (relationship && typeof relationship === 'object' && relationship.target) {
        imagePath = relationship.target;
      } else {
        console.warn(`Invalid relationship format for embedId: ${embedId}`, relationship);
        return null;
      }

      // 构建完整的图片路径
      const fullPath = this.resolveImagePath(imagePath);
      
      // 从ZIP中提取图片数据
      const fileService = this.getFileService(context);
      const buffer = await fileService.extractBinaryFileAsBuffer(context.zip, fullPath);
      if (!buffer) {
        console.warn(`Failed to extract image data from path: ${fullPath}`);
        return null;
      }

      // 检测图片格式和MIME类型
      const format = this.detectImageFormat(buffer);
      const mimeType = this.getMimeType(format);
      
      // 生成文件名和hash
      const filename = this.extractFilename(fullPath);
      const hash = this.generateHash(buffer);

      // 获取图片尺寸（可选）
      const dimensions = await this.getImageDimensions(buffer, format);

      return {
        buffer,
        filename,
        mimeType,
        format,
        size: buffer.length,
        hash,
        dimensions
      };

    } catch (error) {
      console.error(`Error extracting image data for ${embedId}:`, error);
      return null;
    }
  }

  /**
   * 将图片数据编码为base64 data URL
   */
  encodeToBase64(imageData: ImageData): string {
    try {
      const base64Data = imageData.buffer.toString('base64');
      return `data:${imageData.mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Error encoding image to base64:', error);
      throw new Error('Failed to encode image to base64');
    }
  }

  /**
   * 批量处理图片
   */
  async processBatch(embedIds: string[], context: ProcessingContext): Promise<Map<string, ImageProcessResult>> {
    const results = new Map<string, ImageProcessResult>();
    
    // 控制并发数量，避免内存压力
    const concurrency = 3;
    const semaphore = new Semaphore(concurrency);

    await Promise.all(
      embedIds.map(async (embedId) => {
        await semaphore.acquire(async () => {
          try {
            const imageData = await this.extractImageData(embedId, context);
            
            if (imageData) {
              const dataUrl = this.encodeToBase64(imageData);
              results.set(embedId, {
                success: true,
                imageData,
                dataUrl
              });
            } else {
              results.set(embedId, {
                success: false,
                error: 'Failed to extract image data'
              });
            }
          } catch (error) {
            results.set(embedId, {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });
      })
    );

    return results;
  }

  /**
   * 检测图片格式
   */
  private detectImageFormat(buffer: Buffer): ImageFormat {
    if (buffer.length < 8) return 'unknown';

    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpeg';
    }

    // PNG
    if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
      return 'png';
    }

    // GIF (需要检查更多字节)
    if (buffer.length >= 6) {
      const gifHeader87 = Buffer.from('GIF87a', 'ascii');
      const gifHeader89 = Buffer.from('GIF89a', 'ascii');
      if (buffer.slice(0, 6).equals(gifHeader87) || buffer.slice(0, 6).equals(gifHeader89)) {
        return 'gif';
      }
    }

    // BMP
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
      return 'bmp';
    }

    // WebP
    if (buffer.slice(0, 4).equals(Buffer.from('RIFF', 'ascii')) &&
        buffer.slice(8, 12).equals(Buffer.from('WEBP', 'ascii'))) {
      return 'webp';
    }

    // TIFF
    if ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2A && buffer[3] === 0x00) ||
        (buffer[0] === 0x4D && buffer[1] === 0x4D && buffer[2] === 0x00 && buffer[3] === 0x2A)) {
      return 'tiff';
    }

    return 'unknown';
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ImageFormat): string {
    const mimeTypes: Record<ImageFormat, string> = {
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'tiff': 'image/tiff',
      'unknown': 'application/octet-stream'
    };

    return mimeTypes[format];
  }

  /**
   * 解析图片路径
   */
  private resolveImagePath(relativePath: string): string {
    // 移除前导的 '../' 并构建完整路径
    const cleanPath = relativePath.replace(/^\.\.\//, '');
    return `ppt/${cleanPath}`;
  }

  /**
   * 提取文件名
   */
  private extractFilename(path: string): string {
    return path.split('/').pop() || 'unknown';
  }

  /**
   * 生成内容hash
   */
  private generateHash(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * 获取图片尺寸（简单实现）
   */
  private async getImageDimensions(buffer: Buffer, format: ImageFormat): Promise<{ width: number; height: number } | undefined> {
    try {
      // 这里可以集成 image-size 库或自己实现
      // 为了简化，暂时返回 undefined
      // TODO: 实现图片尺寸检测
      return undefined;
    } catch (error) {
      console.warn('Failed to get image dimensions:', error);
      return undefined;
    }
  }
}

/**
 * 简单的信号量实现，用于控制并发
 */
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tryAcquire = () => {
        if (this.permits > 0) {
          this.permits--;
          task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              this.permits++;
              if (this.waitQueue.length > 0) {
                const next = this.waitQueue.shift();
                if (next) next();
              }
            });
        } else {
          this.waitQueue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }
}