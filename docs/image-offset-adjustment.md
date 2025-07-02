# 图片偏移调整功能

这个功能允许在转译PPT图片时直接处理位置偏移，确保图片在PPTist中的正确显示。

## 功能概述

图片偏移调整在`ImageProcessor`中实现，支持以下调整策略：

1. **自动调整**：防止图片超出幻灯片边界
2. **居中对齐**：将图片居中显示
3. **边距调整**：应用最小边距
4. **百分比偏移**：按幻灯片尺寸的百分比偏移
5. **绝对偏移**：指定固定的偏移量

## 实现位置

### 主要文件
- `ImageProcessor.ts` - 图片处理器，集成偏移调整逻辑
- `ImageOffsetAdjuster.ts` - 偏移调整器，包含各种调整策略
- `ImageElement.ts` - 图片元素模型，存储偏移信息

### 处理流程
1. 从PPT XML中提取图片位置和尺寸
2. 将EMU单位转换为points
3. 应用偏移调整策略
4. 存储原始和调整后的位置信息
5. 在JSON输出中包含详细的偏移信息

## 使用示例

### 默认自动调整
```typescript
// 当前实现已包含自动调整功能
// 防止图片超出幻灯片边界
const adjusted = ImageOffsetAdjuster.autoAdjust(
  originalX, originalY, 
  imageWidth, imageHeight,
  slideWidth, slideHeight
);
```

### 手动指定调整策略
```typescript
// 居中对齐
const centerStrategy: OffsetStrategy = { type: 'center' };

// 应用边距
const marginStrategy: OffsetStrategy = { 
  type: 'margin', 
  margin: 20 
};

// 百分比偏移
const percentStrategy: OffsetStrategy = { 
  type: 'percentage', 
  offsetX: 10, // 向右偏移10%
  offsetY: 5   // 向下偏移5%
};

// 绝对偏移
const absoluteStrategy: OffsetStrategy = { 
  type: 'absolute', 
  offsetX: 50, // 向右偏移50points
  offsetY: 30  // 向下偏移30points
};
```

## 输出格式

调整后的图片元素在JSON中包含以下信息：

```json
{
  "type": "image",
  "id": "image_001",
  "left": 150.5,      // 调整后的X坐标
  "top": 100.25,      // 调整后的Y坐标
  "width": 200,
  "height": 150,
  "offsetInfo": {
    // 原始位置信息
    "originalPosition": {
      "x": 1905000,     // 原始EMU单位
      "y": 1270000
    },
    "convertedPosition": {
      "x": 150,         // 转换后的points
      "y": 100
    },
    // 调整后的坐标
    "adjustedX": 150.5,
    "adjustedY": 100.25,
    // 偏移量信息
    "leftOffset": 150.5,
    "topOffset": 100.25,
    "rightOffset": 999.5,
    "bottomOffset": 509.125,
    // 百分比偏移
    "leftOffsetPercent": 11.15,
    "topOffsetPercent": 13.2,
    "rightOffsetPercent": 74.04,
    "bottomOffsetPercent": 67.06
  }
}
```

## 调整策略选择指导

### 自动调整（推荐）
- **适用场景**：大多数情况下的默认选择
- **优点**：自动防止图片超出边界，保持原始布局意图
- **何时使用**：当原始PPT布局基本正确时

### 居中对齐
- **适用场景**：需要图片在幻灯片中居中显示
- **优点**：简单直接，适合单张图片展示
- **何时使用**：图片是幻灯片的主要内容时

### 边距调整
- **适用场景**：确保图片与边界有最小距离
- **优点**：防止图片紧贴边缘，改善视觉效果
- **何时使用**：原始布局中图片距离边缘太近时

### 百分比偏移
- **适用场景**：需要相对于幻灯片尺寸进行调整
- **优点**：适应不同尺寸的幻灯片
- **何时使用**：需要保持相对位置关系时

### 绝对偏移
- **适用场景**：精确控制图片位置
- **优点**：位置精确可控
- **何时使用**：已知具体需要偏移的像素值时

## 性能考虑

- 偏移调整在图片处理阶段进行，不影响整体转换性能
- 自动调整算法复杂度为O(1)，处理效率高
- 所有调整信息都被保存，便于后续分析和调试