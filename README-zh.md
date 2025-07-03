# 🎨 PPTX2PPTistJSON - 高级 PowerPoint 到 PPTist 转换器

一个基于 Next.js 的综合应用程序和 TypeScript 库，用于将 .pptx 文件转换为 PPTist 兼容的 JSON 格式，具备先进的图像处理、背景支持和现代化网页界面。

[![测试覆盖](https://img.shields.io/badge/tests-850%2B-green)](./tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](./tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **🚀 现代化全栈应用**: 专门设计用于将 PowerPoint 演示文稿转换为 PPTist 兼容 JSON 格式的完整 Web 应用程序，具备复杂的解析架构、API 端点和 Web 界面。

## 📚 目录

- [🌟 核心特性](#-核心特性)
- [🚀 快速开始](#-快速开始)
- [🏗️ 架构概览](#️-架构概览)
- [🖼️ 高级图像处理](#️-高级图像处理)
- [📋 完整元素支持](#-完整元素支持)
- [🧪 测试与质量保证](#-测试与质量保证)
- [🛠️ 开发与 API](#️-开发与-api)
- [📈 输出格式](#-输出格式)
- [🔧 高级特性](#-高级特性)
- [🌐 浏览器兼容性](#-浏览器兼容性)
- [📚 文档资源](#-文档资源)
- [🤝 贡献指南](#-贡献指南)
- [🙏 致谢](#-致谢)
- [📄 开源协议](#-开源协议)

## 🌟 核心特性

### 📱 Web 应用程序
- **交互式文件上传**: 拖放式 .pptx 文件处理，实时转换
- **PPTist 兼容输出**: 针对 PPTist 演示编辑器优化的 JSON 格式
- **背景格式切换**: 在传统格式和新版PPTist背景格式间切换
- **实时 JSON 可视化**: Monaco 编辑器语法高亮和验证
- **JSON 差异对比**: 转换结果与预期 PPTist 输出的比较
- **位置测试工具**: PPTist 中元素位置验证实用程序
- **API 文档**: `/api-docs` 交互式 API 参考

[⬆️ 回到目录](#-目录)

### 🔧 转换引擎
- **PPTist 优化解析器**: 专门为 PPTist JSON 格式兼容性设计
- **面向服务架构**: 依赖注入的模块化设计
- **高级图像处理**: Base64 编码与格式检测 (JPEG, PNG, GIF, BMP, WebP, TIFF)
- **背景图像支持**: 针对 PPTist 的完整幻灯片背景处理
- **主题色彩管理**: 兼容 PPTist 的动态主题颜色解析
- **精密单位转换**: 针对 PPTist 布局的高精度 EMU 到点转换
- **全面元素支持**: 针对 PPTist 优化的文本、形状、图像、表格、图表

### 🧪 质量保证
- **850+ 测试用例**: 所有转换组件的全面测试覆盖，包括10个主要测试类别
- **PPTist 集成测试**: 端到端转换工作流验证和兼容性测试
- **边界案例处理**: 强大的错误恢复、优雅降级和边界条件处理
- **性能测试**: 内存管理、并发处理和大文件处理验证
- **图像处理专项测试**: Sharp库集成、偏移调整、透明度处理测试
- **调试功能测试**: 全面的调试系统和可视化测试覆盖

[⬆️ 回到目录](#-目录)

## 🚀 快速开始

### 开发环境搭建

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器
open http://localhost:3000
```

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

[⬆️ 回到目录](#-目录)

### 库的使用方法

#### 浏览器 / 前端
```javascript
import { parse } from 'pptx2pptistjson'

// PPTist 基础转换
const pptistJson = await parse(arrayBuffer)

// PPTist 高级配置
const pptistJson = await parse(arrayBuffer, {
  imageMode: 'base64',     // 'base64' | 'url'
  backgroundFormat: 'pptist', // 'legacy' | 'pptist' - 背景格式
  includeNotes: true,      // 包含演讲者备注
  includeMaster: true,     // 包含母版元素
  enableDebug: false       // 调试信息
})
```

#### API 端点
```javascript
// 通过 REST API 进行 PPTist 转换
const formData = new FormData()
formData.append('file', pptxFile)
formData.append('backgroundFormat', 'pptist') // 选择背景格式

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
})

const pptistCompatibleResult = await response.json()
```

#### Node.js / 服务器
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

[⬆️ 回到目录](#-目录)

## 🏗️ 架构概览

### 应用程序结构
```
app/
├── api/                    # REST API 端点
│   └── parse-pptx/        # PPTX 到 PPTist 转换端点
├── lib/                   # 核心转换库
│   ├── models/            # 领域模型 & DTO
│   ├── services/          # 依赖注入服务层
│   ├── parser/            # 主解析引擎
│   └── utils.ts          # 共享工具
├── json-diff/             # PPTist JSON 比较工具
├── api-docs/             # API 文档
└── test-position/        # PPTist 位置测试工具
```

### 核心服务架构
```
ServiceContainer
├── FileService           # 文件和 ZIP 处理
├── XmlParseService      # XML 解析与命名空间
├── ImageDataService     # 图像提取和处理
├── PresentationParser   # 编排转换工作流
├── SlideParser         # PPTist 单个幻灯片处理
├── ThemeParser         # 主题和颜色处理
└── Element Processors   # 专用元素处理器
    ├── TextProcessor    # PPTist 富文本处理
    ├── ShapeProcessor   # PPTist 几何形状
    └── ImageProcessor   # PPTist 图像元素
```

### 工具系统
```
utils/
├── ColorUtils          # PPTist RGBA 颜色标准化
├── IdGenerator         # 唯一元素 ID 管理
├── UnitConverter       # PPTist EMU 到点转换
└── FillExtractor       # 填充和背景处理
```

[⬆️ 回到目录](#-目录)

## 🖼️ 高级图像处理

### 图像处理模式

#### 1. Base64 模式 (推荐用于 PPTist)
将完整图像数据嵌入为 Data URLs，支持离线 PPTist 使用：

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
轻量级 URL 输出，适合 PPTist 云存储集成：

```javascript
const pptistJson = await parse(arrayBuffer, { imageMode: 'url' })

// PPTist 兼容输出，使用外部 URL
{
  "type": "image",
  "src": "https://cdn.example.com/images/slide1_image1.jpg",
  "originalSrc": "../media/image1.jpeg"
}
```

### PPTist 高级图像处理特性

#### Sharp库集成图像处理
- **透明背景合成**: 自动处理透明填充，确保 PPTist 中的正确显示
- **fillRect算法**: PowerPoint兼容的图像拉伸偏移处理
- **调试图像生成**: 可选的调试输出，包含处理步骤可视化
- **内存优化**: 高效的大图像处理和并发控制

#### 图像偏移调整系统
```javascript
// 自动处理PowerPoint图像偏移
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

[⬆️ 回到目录](#-目录)

### PPTist 背景图像支持
完整的幻灯片背景处理，支持双格式切换：

#### 传统格式 (兼容旧版)
```javascript
// 纯色背景
{
  "background": {
    "type": "solid",
    "color": "#FF5733"
  }
}

// 图像背景 (传统格式)
{
  "background": {
    "type": "image",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "imageSize": "cover",
    "themeColor": { "color": "#F4F7FF", "colorType": "lt1" }
  }
}
```

#### 新版PPTist格式 (推荐)
```javascript
// 图像背景 (新版PPTist格式)
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

// 渐变背景 (两种格式相同)
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
- **并发处理**: 信号量控制的批处理 (默认: 3 个并发)
- **内存管理**: 针对 PPTist 大型演示文稿优化，智能垃圾回收
- **错误隔离**: 单个图像失败不影响整体转换，优雅降级机制
- **存储策略**: 可插拔存储后端 (Base64, CDN, 自定义)
- **Sharp库集成**: 高性能图像处理，支持透明度和复杂变换
- **调试模式**: 可配置的调试图像生成和处理步骤追踪

[⬆️ 回到目录](#-目录)

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

[⬆️ 回到目录](#-目录)

## 🧪 测试与质量保证

### 测试套件概览
- **850+ 测试用例** 覆盖所有转换组件，10个主要测试类别
- **单元测试**: 各服务和工具的独立测试，包括模拟和依赖注入
- **集成测试**: 端到端 PPTist 转换工作流和兼容性验证
- **图像处理专项测试**: PPTist 图像处理全面验证，包括Sharp库集成
- **调试功能测试**: 调试系统、可视化和元数据生成测试
- **边界案例测试**: 错误处理、畸形输入和边界条件处理
- **性能测试**: 内存管理、并发处理和大文件处理验证
- **颜色处理测试**: PowerPoint颜色变换和主题颜色解析测试
- **形状处理测试**: 100+种PowerPoint形状类型转换测试

### 运行测试
```bash
# 运行所有测试
npm test

# 开发监视模式
npm run test:watch

# 生成覆盖报告
npm run test:coverage

# 运行特定测试类别
npx jest image-processing        # 图像处理测试 (8个文件)
npx jest color-processing        # 颜色处理测试 (9个文件)
npx jest shape-processor         # 形状处理测试 (9个文件)
npx jest debug-helper           # 调试功能测试 (3个文件)
npx jest performance-           # 性能测试 (2个文件)
npx jest integration            # 集成测试 (3个文件)
```

### 测试分类
```
tests/
├── __tests__/                    # 专项测试套件 (54个文件)
│   ├── color-*.test.ts          # 颜色处理测试 (9个文件)
│   ├── image-*.test.ts          # 图像处理测试 (8个文件)
│   ├── shape-*.test.ts          # 形状处理测试 (9个文件)
│   ├── debug-*.test.ts          # 调试功能测试 (3个文件)
│   ├── performance-*.test.ts    # 性能和错误处理测试 (2个文件)
│   ├── fill-*.test.ts           # 填充处理测试 (3个文件)
│   ├── theme-*.test.ts          # 主题和样式测试 (2个文件)
│   ├── integration.test.ts      # 集成测试 (3个文件)
│   ├── *.test.tsx               # UI组件测试 (3个文件)
│   └── utils-*.test.ts          # 工具和基础功能测试 (16个文件)
├── background-image.test.ts     # 背景处理
├── element-types.test.ts        # 元素解析
└── pptx-parser-integration.test.ts # 解析器集成
```

[⬆️ 回到目录](#-目录)

## 🛠️ 开发与 API

### 开发命令
```bash
npm run dev          # 启动热重载开发服务器
npm run dev:debug    # 启用 Node.js 调试的开发服务器
npm run build        # 优化的生产构建
npm run lint         # ESLint 代码质量检查
npm run type-check   # TypeScript 类型验证
```

### API 端点

#### POST `/api/parse-pptx`
解析上传的 PPTX 文件并返回 PPTist 兼容的 JSON 结构。

**请求:**
```javascript
const formData = new FormData()
formData.append('file', pptxFile)
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
  includeNotes?: boolean              // 包含演讲者备注
  includeMaster?: boolean             // 包含母版元素
  enableDebug?: boolean               // 调试信息
  maxConcurrency?: number             // 图像处理并发数
  precision?: number                  // PPTist 单位转换精度
}
```

[⬆️ 回到目录](#-目录)

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
          "style": { /* PPTist 兼容样式设置 */ }
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
所有尺寸值都使用 **点 (pt)** 作为单位，针对 PPTist 的高精度转换：
- EMU 到点: `value * 0.0007874015748031496`
- 精度: 2 位小数 (可配置)
- 所有元素类型保持 PPTist 兼容性

[⬆️ 回到目录](#-目录)

## 🔧 高级特性

### 主题颜色解析
自动将 PowerPoint 主题颜色解析为实际 RGB 值：

```javascript
// 主题颜色引用
"color": { "type": "accent1", "tint": 0.5 }

// 解析为实际颜色
"color": "#8AB6E7"
```

### ID 唯一性系统
确保整个演示文稿中元素 ID 的唯一性：

```javascript
// 自动 ID 生成与冲突检测
"id": "textBox_1", "textBox_2", "shape_1"
```

### 错误恢复
优雅处理畸形或损坏的 PPTX 文件：

```javascript
{
  "success": true,
  "data": { /* 解析内容 */ },
  "warnings": ["图像未找到: media/missing.jpg"],
  "errors": []  // 非致命错误
}
```

[⬆️ 回到目录](#-目录)

## 🌐 浏览器兼容性

- **现代浏览器**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Node.js**: 服务器端使用需要 16.0+
- **ES 模块**: 完整 ESM 支持与 TypeScript
- **File API**: 拖放文件上传支持

[⬆️ 回到目录](#-目录)

## 📚 文档资源

### 附加资源
- [API 文档](./docs/API.md) - 完整 API 参考
- [使用示例](./docs/EXAMPLES.md) - 实际实现示例
- [架构指南](./CLAUDE.md) - 详细开发见解
- [类型定义](./app/lib/models/) - TypeScript 接口

### 从 v1.x 迁移
版本 2.0.0+ 引入 PPTist 专注变更：
- 增强 PPTist 兼容性，优化输出格式
- 针对 PPTist 布局精度细化的单位系统
- 增强 PPTist Base64 支持的图像处理
- 为 PPTist 兼容性重写的背景处理
- 针对 PPTist 转换优化的面向服务架构

[⬆️ 回到目录](#-目录)

## 🎯 PPTist 集成

本工具专门设计用于与 [PPTist](https://github.com/pipipi-pikachu/PPTist) 这个现代 Web 演示编辑器无缝集成：

### PPTist 兼容性关键特性：
- **优化 JSON 格式**: 直接兼容 PPTist 的数据结构
- **元素定位**: PPTist 布局的精确坐标映射  
- **主题集成**: PowerPoint 主题转换为 PPTist 格式
- **图像处理**: Base64 编码，支持 PPTist 离线使用
- **字体处理**: 与 PPTist 排版兼容的字体映射
- **动画支持**: PPTist 动画转换基础（未来功能）

### PPTist 工作流程：
1. **上传 PPTX**: 使用此工具转换 PowerPoint 文件
2. **获取 PPTist JSON**: 接收 PPTist 兼容的 JSON 输出
3. **导入到 PPTist**: 直接将 JSON 加载到 PPTist 编辑器
4. **编辑和增强**: 在 PPTist 的现代界面中继续编辑

[⬆️ 回到目录](#-目录)

## 🤝 贡献指南

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

# 添加 PPTist 兼容性新测试用例
# 遵循 tests/__tests__/ 目录中的模式
```

### 代码质量
- **TypeScript**: 需要严格类型检查
- **ESLint**: 代码风格强制执行
- **Jest**: 维护测试覆盖率
- **文档**: 为新 PPTist 功能更新 README

[⬆️ 回到目录](#-目录)

## 🙏 致谢

本项目基于并显著扩展了 PowerPoint 解析概念，同时专门针对 PPTist 兼容性进行优化：

- [PPTist](https://github.com/pipipi-pikachu/PPTist) - 目标演示编辑器
- [PPTX2HTML](https://github.com/g21589/PPTX2HTML) - 原始解析概念
- [PPTXjs](https://github.com/meshesha/PPTXjs) - 基础实现参考

**主要差异:**
- **PPTist 专用**: 针对 PPTist JSON 格式优化 vs. 通用解析
- **全栈应用**: 完整 Web 界面 vs. 仅库
- **高级架构**: 面向服务设计与依赖注入
- **卓越图像处理**: Base64 编码、格式检测、PPTist 背景支持
- **全面测试**: 450+ 测试 vs. 最小测试覆盖
- **现代 TypeScript**: 严格类型和最新语言特性
- **生产就绪**: 错误处理、性能优化和 PPTist 可扩展性

[⬆️ 回到目录](#-目录)

## 📄 开源协议

MIT License | Copyright © 2020-PRESENT [Xeonice](https://github.com/Xeonice)

---

**🚀 准备好将 PPTX 文件转换为 PPTist 了吗？** 从 `npm run dev` 开始，体验现代 PowerPoint 到 PPTist 转换解决方案。

[⬆️ 回到目录](#-目录)