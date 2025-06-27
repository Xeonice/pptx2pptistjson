// CDN 集成预留接口

export interface ImageStorageStrategy {
  readonly name: string;
  readonly priority: number;
  
  // 核心方法
  upload(imageData: ImageUploadData, options?: UploadOptions): Promise<StorageResult>;
  generateUrl(imageId: string, options?: UrlOptions): Promise<string>;
  checkAvailability(): Promise<boolean>;
  
  // 健康检查
  healthCheck(): Promise<HealthStatus>;
}

export interface ImageUploadData {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  format: string;
  size: number;
  hash: string;
  metadata?: Record<string, any>;
}

export interface StorageResult {
  success: boolean;
  imageId: string;
  url?: string;
  cdnUrl?: string;
  metadata: {
    uploadTime: Date;
    size: number;
    format: string;
    etag?: string;
    expires?: Date;
  };
  error?: string;
}

export interface UploadOptions {
  public?: boolean;
  cacheTtl?: number;
  storageClass?: 'standard' | 'cold' | 'archive';
  metadata?: Record<string, string>;
}

export interface UrlOptions {
  signed?: boolean;
  expiresIn?: number; // seconds
  transformations?: ImageTransformation[];
}

export interface ImageTransformation {
  type: 'resize' | 'crop' | 'quality' | 'format';
  params: Record<string, any>;
}

export interface HealthStatus {
  healthy: boolean;
  latency?: number;
  errorRate?: number;
  lastCheck: Date;
  details?: string;
}

/**
 * Base64 存储策略 - 当前默认实现
 */
export class Base64StorageStrategy implements ImageStorageStrategy {
  readonly name = 'base64';
  readonly priority = 10; // 低优先级，作为基础实现

  async upload(imageData: ImageUploadData): Promise<StorageResult> {
    try {
      const dataUrl = `data:${imageData.mimeType};base64,${imageData.buffer.toString('base64')}`;
      
      return {
        success: true,
        imageId: imageData.hash,
        url: dataUrl,
        metadata: {
          uploadTime: new Date(),
          size: imageData.size,
          format: imageData.format
        }
      };
    } catch (error) {
      return {
        success: false,
        imageId: imageData.hash,
        metadata: {
          uploadTime: new Date(),
          size: imageData.size,
          format: imageData.format
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateUrl(imageId: string): Promise<string> {
    // Base64 模式下，URL 就是数据本身，这里无法生成独立的 URL
    throw new Error('Base64 strategy stores data inline, use upload result URL');
  }

  async checkAvailability(): Promise<boolean> {
    return true; // Base64 总是可用
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      healthy: true,
      latency: 0,
      errorRate: 0,
      lastCheck: new Date(),
      details: 'Base64 encoding always available'
    };
  }
}

/**
 * 图片存储管理器
 */
export class ImageStorageManager {
  private strategies: Map<string, ImageStorageStrategy> = new Map();
  private primaryStrategy: ImageStorageStrategy;

  constructor() {
    // 默认使用 Base64 策略
    const base64Strategy = new Base64StorageStrategy();
    this.strategies.set(base64Strategy.name, base64Strategy);
    this.primaryStrategy = base64Strategy;
  }

  /**
   * 注册新的存储策略
   */
  registerStrategy(strategy: ImageStorageStrategy): void {
    this.strategies.set(strategy.name, strategy);
    
    // 如果新策略优先级更高，设为主策略
    if (strategy.priority > this.primaryStrategy.priority) {
      this.primaryStrategy = strategy;
    }
  }

  /**
   * 设置主要存储策略
   */
  setPrimaryStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      this.primaryStrategy = strategy;
    } else {
      throw new Error(`Strategy '${strategyName}' not found`);
    }
  }

  /**
   * 获取当前主要策略
   */
  getPrimaryStrategy(): ImageStorageStrategy {
    return this.primaryStrategy;
  }

  /**
   * 处理图片上传
   */
  async processImage(imageData: ImageUploadData, options?: UploadOptions): Promise<StorageResult> {
    try {
      // 检查主策略是否可用
      if (await this.primaryStrategy.checkAvailability()) {
        return await this.primaryStrategy.upload(imageData, options);
      }
      
      // 主策略不可用，尝试回退策略
      const base64Strategy = this.strategies.get('base64');
      if (base64Strategy && base64Strategy !== this.primaryStrategy) {
        console.warn(`Primary strategy '${this.primaryStrategy.name}' unavailable, falling back to base64`);
        return await base64Strategy.upload(imageData, options);
      }
      
      throw new Error('No available storage strategy');
      
    } catch (error) {
      console.error('Image storage failed:', error);
      throw error;
    }
  }

  /**
   * 获取所有策略的健康状态
   */
  async getHealthStatus(): Promise<Map<string, HealthStatus>> {
    const statuses = new Map<string, HealthStatus>();
    
    for (const [name, strategy] of this.strategies) {
      try {
        const status = await strategy.healthCheck();
        statuses.set(name, status);
      } catch (error) {
        statuses.set(name, {
          healthy: false,
          lastCheck: new Date(),
          details: error instanceof Error ? error.message : 'Health check failed'
        });
      }
    }
    
    return statuses;
  }
}