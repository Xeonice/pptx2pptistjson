# API 文档

## 核心API

### parse(buffer, options?)

解析 PPTX 文件并返回 JSON 数据。

**参数:**
- `buffer` (ArrayBuffer | Buffer) - PPTX 文件的二进制数据
- `options` (ParseOptions, 可选) - 解析配置选项

**返回值:**
- `Promise<ParseResult>` - 解析结果

**示例:**
```javascript
import { parse } from 'pptxtojson'

const json = await parse(arrayBuffer, {
  imageMode: 'base64',
  includeNotes: true,
  includeMaster: true
})
```

### parseToPPTist(buffer, options?)

解析 PPTX 文件并返回兼容 PPTist 格式的 JSON 数据。

**参数:**
- `buffer` (ArrayBuffer | Buffer) - PPTX 文件的二进制数据  
- `options` (ParseOptions, 可选) - 解析配置选项

**返回值:**
- `Promise<PPTistResult>` - PPTist 格式的解析结果

## 配置选项

### ParseOptions

```typescript
interface ParseOptions {
  // 图片处理模式
  imageMode?: 'base64' | 'url'; // 默认: 'base64'
  
  // 是否包含演讲者备注
  includeNotes?: boolean; // 默认: true
  
  // 是否包含母版元素
  includeMaster?: boolean; // 默认: true
  
  // 图片优化选项
  imageOptimization?: ImageOptimizationOptions;
  
  // 存储策略配置
  storageStrategy?: string; // 默认: 'base64'
}
```

### ImageOptimizationOptions

```typescript
interface ImageOptimizationOptions {
  // 最大宽度（像素）
  maxWidth?: number; // 默认: 1920
  
  // 最大高度（像素）  
  maxHeight?: number; // 默认: 1080
  
  // JPEG 质量 (0-100)
  quality?: number; // 默认: 85
  
  // 最大文件大小（字节）
  maxFileSize?: number; // 默认: 5MB
  
  // 目标格式
  format?: 'original' | 'jpeg' | 'png' | 'webp'; // 默认: 'original'
}
```

## 返回值类型

### ParseResult

```typescript
interface ParseResult {
  slides: Slide[];
  theme: Theme;
  title: string;
  size: {
    width: number;
    height: number;
  };
}
```

### Slide

```typescript
interface Slide {
  id: string;
  elements: Element[];
  layoutElements?: Element[];
  background?: Background;
  notes?: string;
}
```

### 图片元素

#### Base64 模式
```typescript
interface ImageElementBase64 {
  type: 'image';
  mode: 'base64';
  src: string; // data:image/jpeg;base64,xxx
  format: 'jpeg' | 'png' | 'gif' | 'bmp' | 'webp' | 'tiff';
  mimeType: string;
  originalSize: number;
  originalSrc: string;
  
  // 位置和尺寸
  left: number;
  top: number;
  width: number;
  height: number;
  
  // 可选属性
  alt?: string;
  rotation?: number;
  crop?: ImageCrop;
  border?: BorderStyle;
}
```

#### URL 模式
```typescript
interface ImageElementUrl {
  type: 'image';
  mode: 'url';
  src: string; // https://example.com/image.jpg
  originalSrc: string;
  
  // 位置和尺寸
  left: number;
  top: number;
  width: number;
  height: number;
  
  // 可选属性
  alt?: string;
  rotation?: number;
  crop?: ImageCrop;
  border?: BorderStyle;
}
```

### ImageCrop

```typescript
interface ImageCrop {
  left: number;   // 左边裁剪百分比 (0-1)
  top: number;    // 上边裁剪百分比 (0-1)  
  right: number;  // 右边裁剪百分比 (0-1)
  bottom: number; // 下边裁剪百分比 (0-1)
}
```

## 高级用法

### 自定义图片处理

```javascript
import { ImageDataService, ImageOptimizer } from 'pptxtojson/images'

// 创建图片数据服务
const imageService = new ImageDataService(fileService)

// 提取图片数据
const imageData = await imageService.extractImageData('rId1', context)

// 优化图片
const optimized = await ImageOptimizer.optimize(
  imageData.buffer, 
  imageData.format,
  {
    maxWidth: 1280,
    quality: 80,
    format: 'jpeg'
  }
)

// 编码为 base64
const dataUrl = imageService.encodeToBase64({
  ...imageData,
  buffer: optimized.buffer
})
```

### 批量图片处理

```javascript
const results = await imageService.processBatch(
  ['rId1', 'rId2', 'rId3'], 
  context
)

for (const [embedId, result] of results) {
  if (result.success) {
    console.log(`图片 ${embedId} 处理成功:`, result.dataUrl)
  } else {
    console.error(`图片 ${embedId} 处理失败:`, result.error)
  }
}
```

### 存储策略扩展

```javascript
import { ImageStorageStrategy, ImageStorageManager } from 'pptxtojson/storage'

// 实现自定义 CDN 存储策略
class CustomCDNStrategy implements ImageStorageStrategy {
  readonly name = 'custom-cdn';
  readonly priority = 100;
  
  async upload(imageData, options) {
    // 上传到自定义 CDN
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: imageData.buffer
    })
    
    const { url } = await response.json()
    
    return {
      success: true,
      imageId: imageData.hash,
      url,
      metadata: {
        uploadTime: new Date(),
        size: imageData.size,
        format: imageData.format
      }
    }
  }
  
  async checkAvailability() {
    return true
  }
  
  async healthCheck() {
    return {
      healthy: true,
      latency: 50,
      errorRate: 0,
      lastCheck: new Date()
    }
  }
}

// 注册自定义策略
const manager = new ImageStorageManager()
manager.registerStrategy(new CustomCDNStrategy())
manager.setPrimaryStrategy('custom-cdn')
```

## 错误处理

```javascript
try {
  const json = await parse(arrayBuffer)
} catch (error) {
  if (error instanceof PPTXParseError) {
    console.error('PPTX 解析错误:', error.message)
    console.error('详细信息:', error.details)
  } else {
    console.error('未知错误:', error)
  }
}
```

## 性能建议

### 大文件处理

```javascript
// 对于大型 PPTX 文件，建议使用 URL 模式减少内存占用
const json = await parse(arrayBuffer, {
  imageMode: 'url',
  imageOptimization: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    quality: 75
  }
})
```

### 内存管理

```javascript
// 批量处理时控制并发数
const processor = new ImageProcessor(xmlParser, imageService)
const concurrency = navigator.hardwareConcurrency || 4

// 使用信号量控制并发
const semaphore = new Semaphore(concurrency)
```

## 浏览器兼容性

- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 13+

## Node.js 版本支持

- Node.js 14+
- 支持 ES Modules
- TypeScript 4.0+