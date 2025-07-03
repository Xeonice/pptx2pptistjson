# 高级功能指南

这个文档介绍pptx2pptistjson v2.1.0中的高级功能，包括PowerPoint拉伸处理、调试系统、性能优化等。

## 功能概览

### 🖼️ PowerPoint拉伸处理
基于Sharp的高性能图片处理，精确复现PowerPoint的fillRect算法。

### 🐛 调试系统
可配置的调试模式，支持调试图片生成和详细日志记录。

### ⚡ 性能优化
850+测试用例保障，内存管理和并发处理优化。

### 🔄 降级机制
优雅的降级策略，确保在各种环境下都能正常工作。

## 核心组件

### PPTXImageProcessor

高性能图片处理器，基于Sharp库实现：

```typescript
import { PPTXImageProcessor } from 'pptxtojson/processors'

const processor = new PPTXImageProcessor()

// 检查可用性
if (processor.isAvailable()) {
  // 应用拉伸处理
  const result = await processor.applyStretchOffset(imageBuffer, {
    containerWidth: 800,
    containerHeight: 600,
    fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
    enableDebug: true
  })
}
```

**特性：**
- PowerPoint兼容的fillRect算法
- 透明背景处理
- 内存优化处理
- 调试图片生成

### DebugHelper

统一的调试配置管理：

```typescript
import { DebugHelper } from 'pptxtojson/debug'

// 检查调试状态
const isEnabled = DebugHelper.isDebugEnabled(context)
const shouldSave = DebugHelper.shouldSaveDebugImages(context)
```

**配置选项：**
- `saveDebugImages`: 保存处理过程图片
- `enableConsoleLogging`: 控制台日志输出
- `enableTimingLogs`: 性能时间统计
- `logLevel`: 日志级别控制

### ImageOffsetAdjuster

精确的位置调整算法：

```typescript
import { ImageOffsetAdjuster } from 'pptxtojson/adjusters'

// 应用自动调整
const adjusted = ImageOffsetAdjuster.applyOffsetAdjustment(
  x, y, width, height, slideWidth, slideHeight, 
  { type: 'auto' }
)
```

**调整策略：**
- `auto`: 自动边界检测
- `center`: 居中对齐
- `margin`: 边距调整
- `percentage`: 百分比偏移
- `absolute`: 绝对偏移

## 使用场景

### 1. 生产环境部署

```typescript
// 优化的生产配置
const productionConfig = {
  imageMode: 'base64',
  enableStretchProcessing: true,
  enableDebugMode: false,  // 关闭调试
  imageOptimization: {
    maxFileSize: 2 * 1024 * 1024,
    quality: 80
  }
}

const json = await parse(arrayBuffer, productionConfig)
```

### 2. 开发调试

```typescript
// 完整的调试配置
const debugConfig = {
  imageMode: 'base64',
  enableStretchProcessing: true,
  enableDebugMode: true,
  debugOptions: {
    saveDebugImages: true,
    enableConsoleLogging: true,
    enableTimingLogs: true,
    logLevel: 'debug',
    debugImagePath: './debug-output'
  }
}

const json = await parse(arrayBuffer, debugConfig)
```

### 3. 浏览器环境

```typescript
// 浏览器兼容配置
const browserConfig = {
  imageMode: 'url',  // 减少内存使用
  enableStretchProcessing: false,  // Sharp不可用
  enableImageOffsetAdjustment: true,
  enableDebugMode: false
}

const json = await parse(arrayBuffer, browserConfig)
```

### 4. 大文件处理

```typescript
// 大文件优化配置
const largeFileConfig = {
  imageMode: 'url',
  enableStretchProcessing: true,
  imageOptimization: {
    maxFileSize: 1024 * 1024,  // 1MB
    quality: 70
  },
  debugOptions: {
    saveDebugImages: false,  // 节省空间
    logLevel: 'warn'
  }
}
```

## 性能优化指南

### 内存管理

```typescript
// 监控内存使用
function monitorMemory() {
  if (process.memoryUsage) {
    const usage = process.memoryUsage()
    console.log(`内存使用: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`)
    
    if (usage.heapUsed > 500 * 1024 * 1024) {
      console.warn('⚠️ 内存使用过高，建议使用URL模式')
    }
  }
}
```

### 并发控制

```typescript
// 批量处理时控制并发
import { Semaphore } from './utils/Semaphore'

const semaphore = new Semaphore(3)  // 最多3个并发

async function processBatch(files) {
  const results = await Promise.all(
    files.map(async (file) => {
      await semaphore.acquire()
      try {
        return await parse(file)
      } finally {
        semaphore.release()
      }
    })
  )
  return results
}
```

### Sharp优化

```typescript
// Node.js环境下的Sharp优化
const os = require('os')

if (processor.isAvailable()) {
  const cpuCount = os.cpus().length
  const recommendedConcurrency = Math.min(cpuCount, 4)
  
  console.log(`建议并发数: ${recommendedConcurrency}`)
  
  // 设置Sharp线程池
  sharp.concurrency(recommendedConcurrency)
}
```

## 错误处理策略

### 渐进式降级

```typescript
async function robustParse(arrayBuffer) {
  const strategies = [
    // 完整功能
    { enableStretchProcessing: true, imageMode: 'base64' },
    // 禁用拉伸
    { enableStretchProcessing: false, imageMode: 'base64' },
    // URL模式
    { enableStretchProcessing: false, imageMode: 'url' },
    // 最小化模式
    { includeNotes: false, includeMaster: false, imageMode: 'url' }
  ]
  
  for (const config of strategies) {
    try {
      return await parse(arrayBuffer, config)
    } catch (error) {
      console.warn(`策略失败: ${error.message}`)
    }
  }
  
  throw new Error('所有解析策略都失败了')
}
```

### 错误分类处理

```typescript
try {
  const json = await parse(arrayBuffer, config)
} catch (error) {
  switch (error.type) {
    case 'SHARP_NOT_AVAILABLE':
      // 降级到JavaScript处理
      return await parse(arrayBuffer, { 
        enableStretchProcessing: false 
      })
      
    case 'MEMORY_LIMIT_EXCEEDED':
      // 使用URL模式
      return await parse(arrayBuffer, { 
        imageMode: 'url' 
      })
      
    case 'IMAGE_PROCESSING_ERROR':
      // 跳过图片处理
      return await parse(arrayBuffer, { 
        enableStretchProcessing: false,
        enableImageOffsetAdjustment: false
      })
      
    default:
      throw error
  }
}
```

## 调试最佳实践

### 调试配置

```typescript
// 开发环境
const isDevelopment = process.env.NODE_ENV === 'development'

const debugConfig = {
  enableDebugMode: isDevelopment,
  debugOptions: {
    saveDebugImages: isDevelopment,
    enableConsoleLogging: true,
    enableTimingLogs: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'warn'
  }
}
```

### 调试信息收集

```typescript
async function parseWithDebugging(arrayBuffer, filename) {
  const startTime = Date.now()
  
  try {
    const json = await parse(arrayBuffer, {
      enableDebugMode: true,
      debugOptions: {
        saveDebugImages: true,
        enableTimingLogs: true
      }
    })
    
    // 收集统计信息
    const stats = {
      filename,
      duration: Date.now() - startTime,
      slideCount: json.slides.length,
      elementCounts: {
        images: json.slides.reduce((count, slide) => 
          count + slide.elements.filter(el => el.type === 'image').length, 0),
        shapes: json.slides.reduce((count, slide) => 
          count + slide.elements.filter(el => el.type === 'shape').length, 0),
        texts: json.slides.reduce((count, slide) => 
          count + slide.elements.filter(el => el.type === 'text').length, 0)
      }
    }
    
    console.log('📊 处理统计:', stats)
    return json
    
  } catch (error) {
    console.error('🐛 处理失败:', {
      filename,
      duration: Date.now() - startTime,
      error: error.message
    })
    throw error
  }
}
```

## 测试覆盖

当前版本包含850+测试用例，覆盖：

- **图片处理测试** (250+): PPTXImageProcessor、拉伸算法、透明填充
- **色彩处理测试** (150+): 色彩转换、主题色解析、变换链
- **形状处理测试** (200+): 几何形状、自定义路径、填充提取
- **文本处理测试** (100+): 富文本、格式化、颜色映射
- **端到端测试** (50+): 完整转换流程、PPTist兼容性
- **性能测试** (100+): 内存管理、并发处理、降级机制

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定类别测试
npx jest image-processing
npx jest stretch-offset
npx jest debug-helper

# 运行性能测试
npx jest performance-reliability

# 生成覆盖率报告
npm run test:coverage
```

## 环境兼容性

### Node.js环境
- ✅ 完整功能支持
- ✅ Sharp图片处理
- ✅ 调试图片保存
- ✅ 性能监控

### 浏览器环境
- ✅ 基础功能支持
- ❌ Sharp图片处理（自动降级）
- ❌ 调试图片保存
- ✅ JavaScript降级处理

### 推荐配置

```typescript
// 检测环境并配置
const isNode = typeof process !== 'undefined'
const hasShar = isNode && (() => {
  try {
    require('sharp')
    return true
  } catch {
    return false
  }
})()

const config = {
  imageMode: 'base64',
  enableStretchProcessing: hasSharp,
  enableImageOffsetAdjustment: true,
  enableDebugMode: isNode && process.env.NODE_ENV === 'development'
}
```

## 未来规划

- **WebAssembly支持**: 在浏览器中支持高级图片处理
- **更多格式支持**: WebP、AVIF等现代图片格式
- **缓存优化**: 智能缓存机制提升重复处理性能
- **插件系统**: 可扩展的处理器插件架构
