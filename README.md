# 🎨 pptx2pptistjson - PowerPoint to PPTist JSON Converter (v2.1.0)

专业的 PowerPoint (.pptx) 到 [PPTist](https://github.com/pipipi-pikachu/PPTist) 兼容 JSON 格式转换器，提供像素级精确转换、高级图像处理和现代化 Web 界面。

[![Tests](https://img.shields.io/badge/tests-850%2B-green)](./tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](./tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black)](./package.json)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **🚀 专为 PPTist 优化**: 基于 Next.js 的全栈应用，采用模块化服务架构，提供精确的 PowerPoint 到 PPTist JSON 格式转换，支持复杂的图像处理、渐变色提取和组合形状变换。

## 🌟 Key Features

### 📱 Web Application
- **Interactive File Upload**: Drag-and-drop .pptx file processing with real-time conversion
- **PPTist-Compatible Output**: JSON format optimized for PPTist presentation editor
- **Background Format Toggle**: Switch between legacy and new PPTist background formats
- **Real-time JSON Visualization**: Monaco Editor with syntax highlighting and validation
- **JSON Diff Comparison**: Compare conversion results with expected PPTist outputs
- **Position Testing Tools**: Utilities for element positioning validation in PPTist
- **API Documentation**: Interactive API reference at `/api-docs`

### 🔧 Conversion Engine
- **PPTist-Optimized Parser**: Specifically designed for PPTist JSON format compatibility
- **Service-Oriented Architecture**: Modular design with dependency injection
- **Advanced Image Processing**: Base64 encoding with format detection (JPEG, PNG, GIF, BMP, WebP, TIFF)
- **Background Image Support**: Complete slide background processing for PPTist
- **Theme Color Management**: Dynamic theme color resolution compatible with PPTist
- **Precision Unit Conversion**: High-accuracy EMU to points conversion for PPTist layouts
- **Comprehensive Element Support**: Text, shapes, images, tables, charts optimized for PPTist

### 🧪 Quality Assurance
- **850+ Test Cases**: Comprehensive test coverage across all conversion components with 10 major test categories
- **PPTist Integration Testing**: End-to-end conversion workflow validation and compatibility testing
- **Edge Case Handling**: Robust error recovery, graceful degradation, and boundary condition processing
- **Performance Testing**: Memory management, concurrent processing, and large file handling validation
- **Image Processing Specialized Testing**: Sharp library integration, offset adjustment, and transparency processing tests
- **Debug Functionality Testing**: Comprehensive debug system and visualization test coverage

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Library Usage

#### Browser / Frontend
```javascript
import { parse } from 'pptx2pptistjson'

// Basic PPTist conversion
const pptistJson = await parse(arrayBuffer)

// Advanced configuration for PPTist
const pptistJson = await parse(arrayBuffer, {
  imageMode: 'base64',     // 'base64' | 'url'
  backgroundFormat: 'pptist', // 'legacy' | 'pptist' - background format
  includeNotes: true,      // Include speaker notes
  includeMaster: true,     // Include master slide elements
  enableDebug: false       // Debug information
})
```

#### API Endpoint
```javascript
// Upload via REST API for PPTist conversion
const formData = new FormData()
formData.append('file', pptxFile)
formData.append('backgroundFormat', 'pptist') // Choose background format

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
})

const pptistCompatibleResult = await response.json()
```

#### Node.js / Server
```javascript
import { parse } from 'pptx2pptistjson'
import fs from 'fs'

const buffer = fs.readFileSync('presentation.pptx')
const pptistJson = await parse(buffer, {
  imageMode: 'base64',
  backgroundFormat: 'pptist',
  includeNotes: true
})
```

## 🏗️ Architecture Overview

### Application Structure
```
app/
├── api/                    # REST API endpoints
│   └── parse-pptx/        # PPTX to PPTist conversion endpoint
├── lib/                   # Core conversion library
│   ├── models/            # Domain models & DTOs
│   ├── services/          # Service layer with DI
│   ├── parser/            # Main parsing engine
│   └── utils.ts          # Shared utilities
├── json-diff/             # JSON comparison tool for PPTist
├── api-docs/             # API documentation
└── test-position/        # Position testing utilities for PPTist
```

### Core Services Architecture
```
ServiceContainer
├── FileService           # File & ZIP processing
├── XmlParseService      # XML parsing with namespaces
├── ImageDataService     # Image extraction & processing
├── PresentationParser   # Orchestrates conversion workflow
├── SlideParser         # Individual slide processing for PPTist
├── ThemeParser         # Theme & color processing
└── Element Processors   # Specialized element handlers
    ├── TextProcessor    # Rich text processing for PPTist
    ├── ShapeProcessor   # Geometric shapes for PPTist
    └── ImageProcessor   # Image elements for PPTist
```

### 工具系统
```
utils/
├── ColorUtils          # PPTist RGBA 颜色标准化
├── IdGenerator         # 唯一元素 ID 管理
├── UnitConverter       # EMU 到点的精确转换（PPTist 布局）
└── FillExtractor       # 填充和背景处理
```

### 色彩处理管道（v2.1.0 核心特性）
高级色彩变换系统，匹配 PowerPoint 行为：

```typescript
FillExtractor.getSolidFill()
├── ColorUtils.toRgba()           # 将所有颜色格式标准化为 rgba()
├── getSchemeColorFromTheme()     # 解析主题颜色引用
├── 颜色变换（按 PowerPoint 顺序应用）:
│   ├── Alpha (透明度)
│   ├── HueMod (色相旋转)
│   ├── LumMod/LumOff (亮度)
│   ├── SatMod (饱和度)
│   ├── Shade (变暗)
│   └── Tint (变亮)
└── 始终返回一致的 rgba() 格式供 PPTist 使用
```

### 形状处理架构（v2.1.0 增强）
支持 100+ PowerPoint 形状类型的全面形状转换：

```typescript
ShapeProcessor.process()
├── 几何检测:
│   ├── prstGeom → 预设形状 (rect, ellipse, triangle, flowChart*, actionButton*)
│   └── custGeom → 自定义路径分析
├── 填充提取:
│   ├── solidFill → FillExtractor.getSolidFill()
│   ├── noFill → 透明
│   └── 主题颜色解析与继承
├── 路径生成:
│   ├── getCustomShapePath() → SVG 路径（EMU→点转换）
│   ├── 增强的 arcTo、cubicBezTo 命令支持
│   └── 不同 viewBox 尺寸的坐标缩放
└── PPTist 格式输出:
    ├── pathFormula (PowerPoint 几何标识符)
    ├── themeFill (带调试信息的解析颜色)
    └── enableShrink: true (PPTist 兼容性)
```

### 单位转换系统
PPTist 布局精度的精确坐标映射：
- **EMU 到点**: `value * 0.0007874015748031496` (UnitConverter.emuToPointsPrecise)
- **精度**: 2 位小数，可配置
- **一致性**: 所有尺寸（位置、大小、路径）都使用点单位供 PPTist 使用

## 🖼️ 高级图像处理（PPTist 优化）

### 图像处理管道（v2.1.0 增强）
多格式图像处理，PPTist 优化和 PowerPoint 拉伸偏移处理：

```typescript
ImageDataService.extractImageData()
├── 格式检测: JPEG、PNG、GIF、BMP、WebP、TIFF
├── 处理模式:
│   ├── base64: 完整的 Data URL 嵌入（离线 PPTist 使用）
│   └── url: 外部 URL 引用（云存储）
├── PPTXImageProcessor: 基于 Sharp 的拉伸偏移处理
│   ├── fillRect 处理（PowerPoint 拉伸算法）
│   ├── 透明背景合成
│   ├── 调试图像生成（故障排除）
│   └── 内存高效处理（回退机制）
├── 元数据提取: 尺寸、透明度、文件大小
├── 错误隔离: 个别图像失败不会中断转换
└── 并发处理: 信号量控制的批处理（默认：3）
```

### 调试系统和图像处理（v2.1.0 新增）
代码库包含图像处理的高级调试功能：

```typescript
DebugHelper.isDebugEnabled(context)        # 检查是否启用调试模式
DebugHelper.shouldSaveDebugImages(context) # 检查是否应保存调试图像
PPTXImageProcessor.applyStretchOffset()    # 应用 PowerPoint 拉伸变换
ImageOffsetAdjuster.applyOffsetAdjustment() # 处理坐标调整
```

**主要特性：**
- **透明填充处理**: 处理负拉伸偏移的图像透明填充
- **调试图像生成**: 具有元数据和处理步骤可视化
- **Sharp 库集成**: 在不可用时优雅回退
- **内存高效处理**: 可配置的并发限制
- **PowerPoint 兼容的 fillRect 算法**: 精确的拉伸偏移复制

### 图像处理模式

#### 1. Base64 模式（推荐用于 PPTist）
完整的图像数据嵌入为 Data URL，用于离线 PPTist 使用：

```javascript
const pptistJson = await parse(arrayBuffer, { imageMode: 'base64' })

// PPTist 兼容输出包含完整图像数据
{
  "type": "image",
  "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "format": "jpeg",
  "mimeType": "image/jpeg",
  "originalSize": 45678,
  "metadata": {
    "width": 1920,
    "height": 1080,
    "hasTransparency": false
  }
}
```

#### 2. URL 模式
轻量级 URL，用于与 PPTist 的云存储集成：

```javascript
const pptistJson = await parse(arrayBuffer, { imageMode: 'url' })

// PPTist 兼容输出，使用外部 URL
{
  "type": "image",
  "src": "https://cdn.example.com/images/slide1_image1.jpg",
  "originalSrc": "../media/image1.jpeg"
}
```

### 高级 PPTist 图像处理特性

#### Sharp 库集成的图像处理
- **透明背景合成**: 自动透明填充处理，确保 PPTist 显示准确
- **fillRect 算法**: PowerPoint 兼容的图像拉伸偏移处理
- **调试图像生成**: 可选的调试输出，包含处理步骤可视化
- **内存优化**: 高效的大图像处理，具有并发控制

#### 图像偏移调整系统
```javascript
// 自动 PowerPoint 图像偏移处理
{
  "type": "image",
  "src": "data:image/png;base64,...",
  "stretchOffset": { "l": -50000, "t": -30000, "r": -50000, "b": -30000 },
  "processedWithOffset": true,
  "debugInfo": {
    "originalSize": { "width": 800, "height": 600 },
    "finalSize": { "width": 900, "height": 660 },
    "paddingApplied": { "left": 50, "top": 30, "right": 50, "bottom": 30 }
  }
}
```

### PPTist 背景图像支持
完整的幻灯片背景处理，支持双格式：

#### 传统格式（旧版）
```javascript
// 纯色背景
{
  "background": {
    "type": "solid",
    "color": "#FF5733"
  }
}

// 图像背景（传统格式）
{
  "background": {
    "type": "image",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "imageSize": "cover",
    "themeColor": { "color": "#F4F7FF", "colorType": "lt1" }
  }
}
```

#### 新 PPTist 格式（推荐）
```javascript
// 图像背景（新 PPTist 格式）
{
  "background": {
    "type": "image", 
    "image": {
      "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "size": "cover"
    },
    "themeColor": { "color": "#F4F7FF", "colorType": "lt1" }
  }
}

// 渐变背景（两种格式相同）
{
  "background": {
    "type": "gradient",
    "colors": [
      { "color": "#FF5733", "position": 0 },
      { "color": "#33A1FF", "position": 100 }
    ]
  }
}
```

#### 背景格式选择
使用 `backgroundFormat` 参数选择输出格式：
- `legacy`: 传统格式，使用 `image: "url"` 和 `imageSize` 属性
- `pptist`: 新格式，使用 `image: { src: "url", size: "cover" }` 结构

### PPTist 支持的格式
- **JPEG** (.jpg, .jpeg) - 优化压缩
- **PNG** (.png) - 透明度支持
- **GIF** (.gif) - 动画支持
- **BMP** (.bmp) - 无压缩位图
- **WebP** (.webp) - 现代网络格式
- **TIFF** (.tiff) - 高质量图像

### 性能特性
- **并发处理**: 信号量控制的批处理（默认：3 个并发）
- **内存管理**: 针对 PPTist 中的大型演示文稿优化，具有智能垃圾回收
- **错误隔离**: 个别图像失败不会影响整体转换，具有优雅降级
- **存储策略**: 可插拔存储后端（Base64、CDN、自定义）
- **Sharp 库集成**: 高性能图像处理，支持透明度和复杂变换
- **调试模式**: 可配置的调试图像生成和处理步骤跟踪

## 📋 PPTist 兼容元素支持

### PPTist 文本元素
```javascript
{
  "type": "text",
  "content": "<p style=\"color:#5b9bd5;font-size:54px;font-weight:bold\">富文本</p>",
  "left": 100, "top": 200, "width": 400, "height": 100,
  "vAlign": "middle",
  "isVertical": false,
  "enableShrink": true
}
```

### PPTist 形状元素
```javascript
{
  "type": "shape",
  "shapType": "rect",
  "fill": { "type": "color", "value": "#FF5733" },
  "border": { "color": "#000000", "width": 2, "type": "solid" },
  "path": "M 0,0 L 100,0 L 100,100 L 0,100 Z"
}
```

### PPTist 图像元素
```javascript
{
  "type": "image",
  "src": "data:image/jpeg;base64,...",
  "format": "jpeg",
  "clip": { "range": [[10, 20], [90, 80]] },  // 裁剪信息
  "rotate": 15
}
```

### PPTist 表格元素
```javascript
{
  "type": "table",
  "data": [["标题 1", "标题 2"], ["单元格 1", "单元格 2"]],
  "colWidths": [200, 300],
  "rowHeights": [40, 60],
  "borders": { "top": true, "right": true, "bottom": true, "left": true }
}
```

### PPTist 图表元素
```javascript
{
  "type": "chart",
  "chartType": "column",
  "data": { "categories": ["Q1", "Q2"], "series": [10, 20] },
  "colors": ["#FF5733", "#33A1FF"],
  "style": { "marker": true, "gridlines": true }
}
```

## 🧪 测试和质量

### 测试套件概览
- **850+ 测试用例**: 涵盖所有转换组件的 10 个主要测试类别
- **单元测试**: 具有模拟和依赖注入的个别服务和工具测试
- **集成测试**: 端到端 PPTist 转换工作流和兼容性验证
- **图像处理专项测试**: 包括 Sharp 库集成的全面图像处理验证
- **调试功能测试**: 完整的调试系统和可视化测试覆盖
- **边界情况测试**: 错误处理、格式错误输入和边界条件处理
- **性能测试**: 内存管理、并发处理和大文件处理验证
- **颜色处理测试**: PowerPoint 颜色变换和主题颜色解析测试
- **形状处理测试**: 100+ PowerPoint 形状类型转换测试

### 运行测试
```bash
# 运行所有测试
npm test

# 开发监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试类别
npx jest image-processing        # 图像处理测试（8 个文件）
npx jest color-processing        # 颜色处理测试（9 个文件）
npx jest shape-processor         # 形状处理测试（9 个文件）
npx jest debug-helper           # 调试功能测试（3 个文件）
npx jest performance-           # 性能测试（2 个文件）
npx jest integration            # 集成测试（3 个文件）
```

### 测试类别
```
tests/
├── __tests__/                    # 专项测试套件（54 个文件）
│   ├── color-*.test.ts          # 颜色处理测试（9 个文件）
│   ├── image-*.test.ts          # 图像处理测试（8 个文件）
│   ├── shape-*.test.ts          # 形状处理测试（9 个文件）
│   ├── debug-*.test.ts          # 调试功能测试（3 个文件）
│   ├── performance-*.test.ts    # 性能和错误处理测试（2 个文件）
│   ├── fill-*.test.ts           # 填充处理测试（3 个文件）
│   ├── theme-*.test.ts          # 主题和样式测试（2 个文件）
│   ├── integration.test.ts      # 集成测试（3 个文件）
│   ├── *.test.tsx               # UI 组件测试（3 个文件）
│   └── utils-*.test.ts          # 工具和核心功能测试（16 个文件）
├── background-image.test.ts     # 背景处理
├── element-types.test.ts        # 元素解析
└── pptx-parser-integration.test.ts # 解析器集成
```

## 🛠️ 开发命令和 API

### 开发命令
```bash
# 构建和开发
npm run dev          # 启动 Next.js 开发服务器（热重载）
npm run dev:debug    # 启动开发服务器（启用 Node.js 调试）
npm run build        # 生产构建（Next.js 优化）
npm run start        # 启动生产服务器
npm run lint         # 对 app 目录运行 ESLint（.js,.jsx,.ts,.tsx 文件）
npm run type-check   # 运行 TypeScript 类型检查（不输出文件）

# 测试
npm test             # 运行所有 Jest 测试（850+ 全面测试用例）
npm run test:watch   # 以监视模式运行测试（用于开发）
npm run test:coverage # 运行测试并生成覆盖率报告

# 运行单个测试
npx jest <test-file-name>
npx jest --testNamePattern="<test name>"

# 运行测试分类
npx jest background-image    # 背景图像测试
npx jest color-processing    # 颜色处理测试
npx jest shape-processor     # 形状处理测试
npx jest slide-background-format  # 幻灯片背景格式测试
npx jest background-format  # 背景格式测试
```

### API 端点

#### POST `/api/parse-pptx`
解析上传的 PPTX 文件并返回 PPTist 兼容的 JSON 结构。

**请求:**
```javascript
const formData = new FormData()
formData.append('file', pptxFile)
formData.append('backgroundFormat', 'pptist')
formData.append('options', JSON.stringify({
  imageMode: 'base64',
  includeNotes: true
}))
```

**响应:**
```javascript
{
  "success": true,
  "data": {
    "slides": [...],        // PPTist 兼容幻灯片
    "theme": {...},         // PPTist 主题格式
    "title": "演示文稿标题"
  },
  "filename": "presentation.pptx",
  "debug": {...}  // 可选调试信息
}
```

### 配置选项
```typescript
interface ParseOptions {
  imageMode?: 'base64' | 'url'        // PPTist 图像处理模式
  backgroundFormat?: 'legacy' | 'pptist'  // 背景格式选择
  includeNotes?: boolean              // 包含演讲者备注
  includeMaster?: boolean             // 包含母版幻灯片元素
  enableDebug?: boolean               // 调试信息
  maxConcurrency?: number             // 图像处理并发数
  precision?: number                  // PPTist 单位转换精度
}
```

## 📈 PPTist 兼容输出格式

### PPTist 完整 JSON 结构
```javascript
{
  "slides": [
    {
      "id": "slide_1",
      "background": {
        "type": "image",
        "image": "data:image/jpeg;base64,...",
        "imageSize": "cover"
      },
      "elements": [
        {
          "type": "text",
          "content": "<p>富文本内容</p>",
          "left": 100, "top": 200, "width": 400, "height": 100,
          "style": { /* PPTist 兼容样式 */ }
        }
      ],
      "remark": "演讲者备注内容"
    }
  ],
  "theme": {
    "colors": ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000"],
    "fonts": { "major": "Calibri", "minor": "Calibri" }
  },
  "size": { "width": 960, "height": 540 },
  "title": "演示文稿标题"
}
```

### PPTist 单位系统
所有尺寸值使用 **点 (pt)** 作为单位，具有为 PPTist 优化的高精度转换：
- EMU 到点：`value * 0.0007874015748031496`
- 精度：2 位小数（可配置）
- 在所有元素类型中保持一致，确保 PPTist 兼容性

## 🔧 PPTist 高级功能

### PPTist 主题颜色解析
自动解析 PowerPoint 主题颜色为 PPTist 兼容的 RGB 值：

```javascript
// 主题颜色引用
"color": { "type": "accent1", "tint": 0.5 }

// 解析为 PPTist 兼容颜色
"color": "#8AB6E7"
```

### PPTist ID 唯一性系统
确保整个演示文稿中元素 ID 的唯一性，兼容 PPTist：

```javascript
// 具有冲突检测的自动 ID 生成
"id": "textBox_1", "textBox_2", "shape_1"
```

### PPTist 错误恢复
在 PPTist 转换过程中优雅处理格式错误或损坏的 PPTX 文件：

```javascript
{
  "success": true,
  "data": { /* PPTist 兼容的解析内容 */ },
  "warnings": ["图像未找到: media/missing.jpg"],
  "errors": []  // 非致命错误
}
```

## 🌐 浏览器兼容性

- **现代浏览器**: Chrome 80+、Firefox 75+、Safari 13+、Edge 80+
- **Node.js**: 服务器端使用需要 16.0+
- **ES 模块**: 完整的 ESM 支持，配合 TypeScript
- **文件 API**: 支持拖拽文件上传进行 PPTist 转换

## 📚 文档

### 附加资源
- [API 文档](./docs/API.md) - PPTist 转换的完整 API 参考
- [使用示例](./docs/EXAMPLES.md) - 实用的 PPTist 实现示例
- [架构指南](./CLAUDE.md) - 详细的开发见解
- [类型定义](./app/lib/models/) - PPTist 的 TypeScript 接口

### v2.1.0 版本更新
v2.1.0 引入了 PPTist 重点优化的变更：
- **高级测试套件**: 新增 850+ 测试用例，提升代码覆盖率和测试完整性
- **PowerPoint 组合形状变换**: 实现复杂的组合形状处理和渐变色提取
- **行高字体尺寸优化**: 针对 PPTist 布局的精确字体和行高处理
- **增强的色彩处理管道**: 支持更复杂的 PowerPoint 色彩变换
- **Sharp 集成的图像处理**: 高性能图像处理和透明度支持

### 从 v1.x 迁移
v2.0.0+ 版本引入了 PPTist 重点优化的变更：
- 增强的 PPTist 兼容性和优化的输出格式
- 针对 PPTist 布局精度的精细化单位系统
- 增强的图像处理和 PPTist base64 支持
- 为 PPTist 兼容性重写的背景处理
- 针对 PPTist 转换优化的服务导向架构

## 🤝 贡献

### 开发环境设置
```bash
git clone https://github.com/Xeonice/pptx2pptistjson.git
cd pptx2pptistjson
npm install
npm run dev
```

### 测试贡献
```bash
# 运行现有测试
npm test

# 为 PPTist 兼容性添加新测试用例
# 遵循 tests/__tests__/ 目录中的模式
```

### 代码质量
- **TypeScript**: 需要严格类型检查
- **ESLint**: 代码风格强制执行
- **Jest**: 维护测试覆盖率
- **文档**: 为新的 PPTist 功能更新 README

### 修改后验证
每次修改后，请验证多个命令执行：
- `npm run build` - 确保生产构建完整性
- `npm run type-check` - 验证 TypeScript 类型一致性
- `npm run lint` - 检查代码质量和风格指南
- `npm run test` - 确认所有测试用例成功通过（所有 850+ 测试必须通过）

## 🎯 PPTist 集成

此工具专门为与 [PPTist](https://github.com/pipipi-pikachu/PPTist)（现代网络演示编辑器）的无缝集成而设计：

### 核心 PPTist 兼容性特性：
- **优化的 JSON 格式**: 与 PPTist 数据结构直接兼容
- **元素定位**: PPTist 布局的精确坐标映射
- **主题集成**: PowerPoint 主题转换为 PPTist 格式
- **图像处理**: 用于离线 PPTist 使用的 Base64 编码
- **字体处理**: 与 PPTist 排版兼容的字体映射
- **动画支持**: PPTist 动画转换的基础（未来功能）

### PPTist 工作流：
1. **上传 PPTX**: 使用此工具转换 PowerPoint 文件
2. **获取 PPTist JSON**: 接收 PPTist 兼容的 JSON 输出
3. **导入到 PPTist**: 将 JSON 直接加载到 PPTist 编辑器
4. **编辑和增强**: 在 PPTist 的现代界面中继续编辑

## 🙏 致谢

此项目基于并大幅扩展了 PowerPoint 解析概念，同时专门针对 PPTist 兼容性进行了优化：

- [PPTist](https://github.com/pipipi-pikachu/PPTist) - 目标演示编辑器
- [PPTX2HTML](https://github.com/g21589/PPTX2HTML) - 原始解析概念
- [PPTXjs](https://github.com/meshesha/PPTXjs) - 基础实现参考

**主要区别：**
- **PPTist 专用**: 针对 PPTist JSON 格式优化 vs. 通用解析
- **全栈应用**: 完整的网络界面 vs. 仅库
- **高级架构**: 具有依赖注入的服务导向设计
- **卓越的图像处理**: Base64 编码、格式检测、PPTist 背景支持
- **全面测试**: 850+ 测试 vs. 最小测试覆盖
- **现代 TypeScript**: 严格类型和最新语言功能
- **生产就绪**: 错误处理、性能优化和 PPTist 可扩展性

## 📄 许可证

MIT License | Copyright © 2020-PRESENT [Xeonice](https://github.com/Xeonice)

---

**🚀 准备将 PPTX 文件转换为 PPTist 格式？** 从 `npm run dev` 开始，体验现代 PowerPoint 到 PPTist 转换解决方案。