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
  
  // 调试模式配置
  enableDebugMode?: boolean; // 默认: false
  debugOptions?: DebugOptions;
  
  // 图片处理增强功能
  enableStretchProcessing?: boolean; // 默认: true
  enableImageOffsetAdjustment?: boolean; // 默认: true
}
```

### DebugOptions

```typescript
interface DebugOptions {
  // 是否保存调试图片
  saveDebugImages?: boolean; // 默认: false
  
  // 是否启用控制台日志
  enableConsoleLogging?: boolean; // 默认: true
  
  // 是否启用时间统计日志
  enableTimingLogs?: boolean; // 默认: false
  
  // 日志级别
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // 默认: 'info'
  
  // 调试图片保存路径
  debugImagePath?: string; // 默认: './debug-images'
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
  
  // 图片偏移和拉伸信息
  offsetInfo?: ImageOffsetInfo;
  stretchInfo?: ImageStretchInfo;
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
  
  // 图片偏移和拉伸信息
  offsetInfo?: ImageOffsetInfo;
  stretchInfo?: ImageStretchInfo;
}
```

### ImageOffsetInfo

```typescript
interface ImageOffsetInfo {
  // 原始位置信息（EMU单位）
  originalX: number;
  originalY: number;
  
  // 转换后位置信息（points）
  convertedX: number;
  convertedY: number;
  
  // 调整后位置信息（可选）
  adjustedX?: number;
  adjustedY?: number;
  
  // 偏移量（points）
  leftOffset: number;
  topOffset: number;
  rightOffset: number;
  bottomOffset: number;
  
  // 偏移百分比
  leftOffsetPercent: number;
  topOffsetPercent: number;
  rightOffsetPercent: number;
  bottomOffsetPercent: number;
}
```

### ImageStretchInfo

```typescript
interface ImageStretchInfo {
  // PowerPoint fillRect 拉伸信息
  fillRect: {
    left: number;   // 左边拉伸比例
    top: number;    // 上边拉伸比例
    right: number;  // 右边拉伸比例
    bottom: number; // 下边拉伸比例
  };
  
  // 可选的srcRect信息
  srcRect?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  
  // 是否来自XML解析
  fromXml?: boolean;
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

### 启用调试模式

```javascript
import { parse } from 'pptxtojson'

const json = await parse(arrayBuffer, {
  enableDebugMode: true,
  debugOptions: {
    saveDebugImages: true,
    enableConsoleLogging: true,
    enableTimingLogs: true,
    logLevel: 'debug',
    debugImagePath: './debug-output'
  }
})
```

### PowerPoint拉伸偏移处理

```javascript
// 启用拉伸处理（默认启用）
const json = await parse(arrayBuffer, {
  enableStretchProcessing: true,
  imageMode: 'base64'
})

// 处理后的图片包含详细的拉伸信息
json.slides.forEach(slide => {
  slide.elements.forEach(element => {
    if (element.type === 'image' && element.stretchInfo) {
      console.log('拉伸信息:', element.stretchInfo.fillRect)
      console.log('偏移信息:', element.offsetInfo)
    }
  })
})
```

### Sharp图片处理（Node.js环境）

```javascript
import { PPTXImageProcessor } from 'pptxtojson/processors'

// 创建图片处理器
const processor = new PPTXImageProcessor()

// 检查Sharp是否可用
if (processor.isAvailable()) {
  console.log('Sharp可用，支持高级图片处理')
  
  // 应用拉伸偏移
  const result = await processor.applyStretchOffset(imageBuffer, {
    containerWidth: 800,
    containerHeight: 600,
    fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
    enableDebug: true
  })
  
  console.log('处理结果:', result.appliedEffects)
} else {
  console.log('Sharp不可用，使用基础图片处理')
}
```

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
  const json = await parse(arrayBuffer, {
    enableDebugMode: true // 启用调试模式获取更多信息
  })
} catch (error) {
  if (error instanceof PPTXParseError) {
    console.error('PPTX 解析错误:', error.message)
    console.error('详细信息:', error.details)
    
    // 根据错误类型采取不同的处理策略
    switch (error.type) {
      case 'IMAGE_PROCESSING_ERROR':
        console.log('尝试禁用拉伸处理重新解析...')
        return await parse(arrayBuffer, {
          enableStretchProcessing: false,
          imageMode: 'url'
        })
        
      case 'SHARP_NOT_AVAILABLE':
        console.log('Sharp不可用，使用基础图片处理...')
        return await parse(arrayBuffer, {
          enableStretchProcessing: false
        })
        
      case 'MEMORY_LIMIT_EXCEEDED':
        console.log('内存不足，尝试URL模式...')
        return await parse(arrayBuffer, {
          imageMode: 'url',
          imageOptimization: {
            maxFileSize: 1024 * 1024 // 1MB
          }
        })
    }
  } else {
    console.error('未知错误:', error)
  }
}
```

### 调试错误排查

```javascript
import { DebugHelper } from 'pptxtojson/debug'

// 检查调试模式状态
const context = { /* 处理上下文 */ }
const isDebugEnabled = DebugHelper.isDebugEnabled(context)
const shouldSaveImages = DebugHelper.shouldSaveDebugImages(context)

console.log('调试模式:', isDebugEnabled)
console.log('保存调试图片:', shouldSaveImages)

// 启用详细日志进行错误排查
const json = await parse(arrayBuffer, {
  enableDebugMode: true,
  debugOptions: {
    saveDebugImages: true,
    enableConsoleLogging: true,
    logLevel: 'debug'
  }
})
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

// 启用Sharp处理时的内存监控
if (typeof process !== 'undefined' && process.memoryUsage) {
  const initialMemory = process.memoryUsage()
  
  const json = await parse(arrayBuffer, {
    enableStretchProcessing: true,
    debugOptions: {
      enableTimingLogs: true
    }
  })
  
  const finalMemory = process.memoryUsage()
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
  
  console.log(`内存增长: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
}

// 对于大型演示文稿，建议分批处理
const largePresentationOptions = {
  imageMode: 'url', // 减少内存占用
  enableStretchProcessing: false, // 如果不需要可关闭
  imageOptimization: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    quality: 75
  }
}
```

### Sharp性能优化（Node.js）

```javascript
import { PPTXImageProcessor } from 'pptxtojson/processors'

// 检查系统能力
const processor = new PPTXImageProcessor()
const systemConcurrency = require('os').cpus().length

if (processor.isAvailable()) {
  console.log(`Sharp可用，建议并发数: ${Math.min(systemConcurrency, 4)}`)
  
  // 对于高性能服务器环境
  const options = {
    enableStretchProcessing: true,
    debugOptions: {
      saveDebugImages: false, // 生产环境关闭
      enableTimingLogs: true,
      logLevel: 'warn'
    }
  }
} else {
  console.log('Sharp不可用，使用JavaScript降级处理')
  // 降级配置
  const options = {
    enableStretchProcessing: false,
    imageMode: 'url'
  }
}
```

## 浏览器兼容性

- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 13+

**注意事项:**
- Sharp图片处理仅在Node.js环境可用
- 浏览器环境自动使用JavaScript降级处理
- 调试图片保存功能仅在Node.js环境可用

## Node.js 版本支持

- Node.js 14+ (推荐16+)
- 支持 ES Modules
- TypeScript 4.0+ (推荐5.0+)
- Sharp 0.34+ (可选，用于高级图片处理)

### 依赖说明

**核心依赖:**
- `jszip` - ZIP文件处理
- `txml` - XML解析

**可选依赖:**
- `sharp` - 高性能图片处理（仅Node.js）
- `@vercel/blob` - CDN存储支持

## 测试覆盖

当前测试套件包含850+测试用例，覆盖以下功能：
- 色彩处理和转换（150+测试）
- 形状处理和几何转换（200+测试）
- 图片处理和拉伸偏移（250+测试）
- 文本处理和格式化（100+测试）
- 端到端转换流程（50+测试）
- 性能和内存管理（100+测试）

所有测试必须通过才能发布新版本。