# 图片偏移调整与拉伸处理功能

这个功能提供全面的PowerPoint图片处理解决方案，包括位置偏移调整和拉伸偏移（stretch offset）处理，确保图片在PPTist中的像素级精确显示。

## 功能概述

### 核心功能模块

1. **PPTXImageProcessor**：基于Sharp的高级图片处理器
   - PowerPoint fillRect拉伸算法实现
   - 透明填充处理
   - 调试图片生成
   - 内存优化处理

2. **ImageOffsetAdjuster**：位置偏移调整器
   - 自动边界检测
   - 多种调整策略
   - 精确坐标计算

3. **DebugHelper**：调试系统
   - 可配置调试模式
   - 调试图片保存
   - 处理步骤可视化

### 处理策略

1. **PowerPoint拉伸偏移**：精确复现PowerPoint的fillRect算法
2. **自动偏移调整**：防止图片超出幻灯片边界
3. **居中对齐**：将图片居中显示
4. **边距调整**：应用最小边距
5. **百分比偏移**：按幻灯片尺寸的百分比偏移
6. **绝对偏移**：指定固定的偏移量

## 实现位置

### 主要文件
- `PPTXImageProcessor.ts` - Sharp图片处理器，核心拉伸算法实现
- `ImageProcessingService.ts` - 图片处理服务，协调各个处理器
- `ImageOffsetAdjuster.ts` - 偏移调整器，包含各种调整策略
- `ImageElement.ts` - 图片元素模型，存储偏移和拉伸信息
- `DebugHelper.ts` - 调试辅助工具，统一调试配置管理

### 处理流程
1. **XML解析阶段**：从PowerPoint XML中提取图片信息
   - 原始位置、尺寸（EMU单位）
   - fillRect拉伸信息
   - 图片关系ID和嵌入数据

2. **坐标转换阶段**：EMU → Points精确转换
   - 使用UnitConverter.emuToPointsPrecise()
   - 保持2位小数精度

3. **拉伸处理阶段**：应用PowerPoint拉伸算法
   - Sharp图片处理（Node.js环境）
   - fillRect算法精确实现
   - 透明填充和背景合成

4. **偏移调整阶段**：应用位置优化策略
   - 边界检测和自动调整
   - 用户自定义调整策略

5. **调试输出阶段**：生成调试信息和图片
   - 处理步骤可视化
   - 中间结果保存

## 使用示例

### 1. 启用完整拉伸处理
```typescript
import { parse } from 'pptxtojson'

// 解析时启用拉伸处理（推荐）
const json = await parse(arrayBuffer, {
  imageMode: 'base64',
  enableStretchProcessing: true,
  enableImageOffsetAdjustment: true,
  enableDebugMode: true,
  debugOptions: {
    saveDebugImages: true,
    enableConsoleLogging: true,
    logLevel: 'debug'
  }
})

// 检查处理结果
json.slides.forEach(slide => {
  slide.elements.forEach(element => {
    if (element.type === 'image' && element.stretchInfo) {
      console.log('拉伸信息:', element.stretchInfo)
      console.log('偏移信息:', element.offsetInfo)
    }
  })
})
```

### 2. 直接使用PPTXImageProcessor
```typescript
import { PPTXImageProcessor } from 'pptxtojson/processors'

const processor = new PPTXImageProcessor()

// 检查Sharp可用性
if (processor.isAvailable()) {
  // 应用拉伸处理
  const result = await processor.applyStretchOffset(imageBuffer, {
    containerWidth: 800,
    containerHeight: 600,
    fillRect: {
      left: 0.1,    // 左边向内收缩10%
      top: 0.1,     // 上边向内收缩10%
      right: 0.1,   // 右边向内收缩10%
      bottom: 0.1   // 下边向内收缩10%
    },
    enableDebug: true
  })
  
  console.log('处理效果:', result.appliedEffects)
  console.log('输出尺寸:', result.width, 'x', result.height)
} else {
  console.log('Sharp不可用，使用JavaScript降级处理')
}
```

### 3. 传统偏移调整
```typescript
import { ImageOffsetAdjuster } from 'pptxtojson/adjusters'

// 自动边界调整
const adjusted = ImageOffsetAdjuster.applyOffsetAdjustment(
  originalX, originalY, 
  imageWidth, imageHeight,
  slideWidth, slideHeight,
  { type: 'auto' }
);

console.log('调整后位置:', adjusted.x, adjusted.y)
```

### 4. 手动指定调整策略
```typescript
import { ImageOffsetAdjuster } from 'pptxtojson/adjusters'

// 居中对齐
const centerStrategy: OffsetStrategy = { type: 'center' }
const centered = ImageOffsetAdjuster.applyOffsetAdjustment(
  x, y, width, height, slideWidth, slideHeight, centerStrategy
)

// 应用边距
const marginStrategy: OffsetStrategy = { 
  type: 'margin', 
  margin: 20 
}
const withMargin = ImageOffsetAdjuster.applyOffsetAdjustment(
  x, y, width, height, slideWidth, slideHeight, marginStrategy
)

// 百分比偏移
const percentStrategy: OffsetStrategy = { 
  type: 'percentage', 
  offsetX: 10, // 向右偏移10%
  offsetY: 5   // 向下偏移5%
}
const percentAdjusted = ImageOffsetAdjuster.applyOffsetAdjustment(
  x, y, width, height, slideWidth, slideHeight, percentStrategy
)

// 绝对偏移
const absoluteStrategy: OffsetStrategy = { 
  type: 'absolute', 
  offsetX: 50, // 向右偏移50points
  offsetY: 30  // 向下偏移30points
}
const absoluteAdjusted = ImageOffsetAdjuster.applyOffsetAdjustment(
  x, y, width, height, slideWidth, slideHeight, absoluteStrategy
)
```

### 5. 调试模式使用
```typescript
import { DebugHelper } from 'pptxtojson/debug'

// 创建调试上下文
const debugContext = {
  slideId: 'slide1',
  resources: {},
  options: {
    enableDebugMode: true,
    debugOptions: {
      saveDebugImages: true,
      enableConsoleLogging: true,
      logLevel: 'debug'
    }
  }
}

// 检查调试状态
const isDebugEnabled = DebugHelper.isDebugEnabled(debugContext)
const shouldSaveImages = DebugHelper.shouldSaveDebugImages(debugContext)

console.log('调试模式:', isDebugEnabled)
console.log('保存调试图片:', shouldSaveImages)

// 在处理过程中会自动生成调试图片到指定目录
```

### 6. 错误处理和降级
```typescript
async function processImageWithFallback(imageBuffer, stretchInfo, containerSize) {
  const processor = new PPTXImageProcessor()
  
  try {
    if (processor.isAvailable()) {
      // 尝试Sharp处理
      return await processor.applyStretchOffset(imageBuffer, {
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
        fillRect: stretchInfo.fillRect,
        enableDebug: true
      })
    } else {
      throw new Error('Sharp not available')
    }
  } catch (error) {
    console.warn('Sharp处理失败，使用降级方案:', error.message)
    
    // 降级到基础偏移调整
    const fallbackResult = ImageOffsetAdjuster.applyOffsetAdjustment(
      0, 0, 
      containerSize.width, containerSize.height,
      containerSize.width, containerSize.height,
      { type: 'auto' }
    )
    
    return {
      buffer: imageBuffer, // 原始图片
      width: containerSize.width,
      height: containerSize.height,
      appliedEffects: ['fallback-adjustment'],
      ...fallbackResult
    }
  }
}
```

## 输出格式

### 完整的图片元素输出

调整后的图片元素在JSON中包含以下完整信息：

```json
{
  "type": "image",
  "id": "image_001",
  "mode": "base64",
  "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "mimeType": "image/png",
  "originalSize": 15432,
  
  // 位置和尺寸
  "left": 150.5,      // 最终显示的X坐标
  "top": 100.25,      // 最终显示的Y坐标
  "width": 200,       // 最终显示宽度
  "height": 150,      // 最终显示高度
  "rotate": 0,
  "fixedRatio": true,
  
  // 偏移信息 - 用于编辑器理解位置调整
  "offsetInfo": {
    // 原始位置信息（EMU单位）
    "originalX": 1905000,
    "originalY": 1270000,
    
    // 转换后位置信息（points）
    "convertedX": 150,
    "convertedY": 100,
    
    // 调整后的坐标（可选）
    "adjustedX": 150.5,
    "adjustedY": 100.25,
    
    // 偏移量信息（points）
    "leftOffset": 150.5,
    "topOffset": 100.25,
    "rightOffset": 999.5,
    "bottomOffset": 509.125,
    
    // 百分比偏移（相对于幻灯片尺寸）
    "leftOffsetPercent": 11.15,
    "topOffsetPercent": 13.2,
    "rightOffsetPercent": 74.04,
    "bottomOffsetPercent": 67.06,
    
    // 原始和转换后位置（新格式）
    "originalPosition": {
      "x": 1905000,
      "y": 1270000
    },
    "convertedPosition": {
      "x": 150,
      "y": 100
    }
  },
  
  // 拉伸信息 - PowerPoint原生fillRect
  "stretchInfo": {
    "fillRect": {
      "left": 0.1,      // 左边收缩10%
      "top": 0.1,       // 上边收缩10%
      "right": 0.1,     // 右边收缩10%
      "bottom": 0.1     // 下边收缩10%
    },
    "srcRect": {        // 可选的源矩形
      "left": 0.05,
      "top": 0.05,
      "right": 0.05,
      "bottom": 0.05
    },
    "fromXml": true     // 标记来源于XML解析
  },
  
  // 裁剪信息（如果有）
  "clip": {
    "shape": "rect",
    "range": [[0, 0], [100, 100]]
  },
  
  // 调试信息（调试模式下）
  "debugInfo": {
    "processingSteps": [
      "XML解析完成",
      "EMU转换完成", 
      "Sharp拉伸处理完成",
      "偏移调整完成"
    ],
    "appliedEffects": [
      "fillRect处理",
      "透明填充",
      "边界自动调整"
    ],
    "processingTime": 45,  // 毫秒
    "memoryUsed": 2.5,     // MB
    "debugImagePath": "./debug-images/slide1_image001_debug.png"
  }
}
```

### 简化输出（URL模式）

当使用URL模式或禁用高级处理时的输出：

```json
{
  "type": "image",
  "id": "image_001", 
  "mode": "url",
  "src": "https://example.com/images/image001.jpg",
  "originalSrc": "../media/image1.jpg",
  
  "left": 150,
  "top": 100,
  "width": 200,
  "height": 150,
  "fixedRatio": true,
  
  // 基础偏移信息
  "offsetInfo": {
    "originalPosition": { "x": 1905000, "y": 1270000 },
    "convertedPosition": { "x": 150, "y": 100 }
  }
}
```

## 调整策略选择指导

### PowerPoint拉伸处理（首选）
- **适用场景**：需要像素级精确复现PowerPoint效果
- **优点**：完全兼容PowerPoint的fillRect算法，支持透明填充
- **何时使用**：Node.js环境且安装了Sharp库
- **配置**：`enableStretchProcessing: true`
- **要求**：需要Sharp库支持

### 自动偏移调整（推荐降级选择）
- **适用场景**：Sharp不可用或需要轻量级处理
- **优点**：自动防止图片超出边界，保持原始布局意图
- **何时使用**：浏览器环境或Sharp不可用时
- **配置**：`enableImageOffsetAdjustment: true`

### 居中对齐
- **适用场景**：需要图片在幻灯片中居中显示
- **优点**：简单直接，适合单张图片展示
- **何时使用**：图片是幻灯片的主要内容时
- **使用方式**：通过OffsetStrategy配置

### 边距调整
- **适用场景**：确保图片与边界有最小距离
- **优点**：防止图片紧贴边缘，改善视觉效果
- **何时使用**：原始布局中图片距离边缘太近时
- **使用方式**：设置margin参数

### 百分比偏移
- **适用场景**：需要相对于幻灯片尺寸进行调整
- **优点**：适应不同尺寸的幻灯片
- **何时使用**：需要保持相对位置关系时
- **使用方式**：设置offsetX/offsetY百分比

### 绝对偏移
- **适用场景**：精确控制图片位置
- **优点**：位置精确可控
- **何时使用**：已知具体需要偏移的像素值时
- **使用方式**：设置offsetX/offsetY绝对值

## 性能考虑

### Sharp处理性能
- **内存使用**：Sharp处理会增加内存使用，建议监控
- **处理时间**：复杂拉伸处理可能需要更多时间
- **并发限制**：建议控制并发处理数量（默认3个）
- **降级机制**：Sharp不可用时自动降级到JavaScript处理

### 优化建议
1. **生产环境**：关闭调试图片保存（`saveDebugImages: false`）
2. **大文件处理**：使用URL模式减少内存占用
3. **批量处理**：实现合理的并发控制
4. **缓存策略**：对处理结果进行缓存以提升性能

### 测试覆盖
- **850+测试用例**确保功能稳定性
- **性能测试**验证内存和时间消耗
- **边界测试**处理各种异常情况
- **兼容性测试**确保降级机制正常工作

## 故障排除

### 常见问题
1. **Sharp不可用**：检查Node.js版本和Sharp安装
2. **内存不足**：使用URL模式或减少并发数
3. **处理失败**：启用调试模式查看详细日志
4. **拉伸效果不正确**：检查fillRect参数范围

### 调试技巧
```typescript
// 启用详细调试
const debugOptions = {
  saveDebugImages: true,
  enableConsoleLogging: true,
  enableTimingLogs: true,
  logLevel: 'debug'
}

// 监控处理过程
console.log('Sharp可用性:', processor.isAvailable())
console.log('处理配置:', config)
console.log('处理结果:', result.appliedEffects)
```