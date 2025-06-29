# 🎨 PPTXtoJSON - 高级 PowerPoint 解析器与全栈应用

一个基于 Next.js 的综合应用程序和 TypeScript 库，用于将 .pptx 文件解析为结构化 JSON 数据，具备先进的图像处理、背景支持和现代化网页界面。

[![测试覆盖](https://img.shields.io/badge/tests-450%2B-green)](./tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](./tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **🚀 现代化全栈应用**: 与其他 PPTX 解析器不同，这是一个完整的 Web 应用程序，具备 API 端点、Web 界面和复杂的解析架构，能够生成人类可读的 JSON 数据。

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
- **交互式文件上传**: 拖放式 .pptx 文件处理
- **实时 JSON 可视化**: Monaco 编辑器语法高亮显示
- **JSON 差异对比**: 解析结果与预期输出比较
- **位置测试工具**: 元素位置验证实用程序
- **API 文档**: `/api-docs` 交互式 API 参考

[⬆️ 回到目录](#-目录)

### 🔧 解析引擎
- **面向服务架构**: 依赖注入的模块化设计
- **高级图像处理**: Base64 编码与格式检测 (JPEG, PNG, GIF, BMP, WebP, TIFF)
- **背景图像支持**: 完整的幻灯片背景处理
- **主题色彩管理**: 动态主题颜色解析
- **精密单位转换**: 高精度 EMU 到点的转换
- **全面元素支持**: 文本、形状、图像、表格、图表、数学公式

### 🧪 质量保证
- **450+ 测试用例**: 全组件综合测试覆盖
- **集成测试**: 端到端解析工作流验证
- **边界案例处理**: 强大的错误恢复和优雅降级
- **性能测试**: 内存管理和并发处理验证

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
import { parse } from 'pptxtojson'

// 基础解析
const json = await parse(arrayBuffer)

// 高级配置
const json = await parse(arrayBuffer, {
  imageMode: 'base64',     // 'base64' | 'url'
  includeNotes: true,      // 包含演讲者备注
  includeMaster: true,     // 包含母版元素
  enableDebug: false       // 调试信息
})
```

#### API 端点
```javascript
// 通过 REST API 上传
const formData = new FormData()
formData.append('file', pptxFile)

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

#### Node.js / 服务器
```javascript
import { parse } from 'pptxtojson'
import fs from 'fs'

const buffer = fs.readFileSync('presentation.pptx')
const json = await parse(buffer, {
  imageMode: 'base64',
  includeNotes: true
})
```

[⬆️ 回到目录](#-目录)

## 🏗️ 架构概览

### 应用程序结构
```
app/
├── api/                    # REST API 端点
│   └── parse-pptx/        # PPTX 解析端点
├── lib/                   # 核心解析库
│   ├── models/            # 领域模型 & DTO
│   ├── services/          # 依赖注入服务层
│   ├── parser/            # 主解析引擎
│   └── utils.ts          # 共享工具
├── json-diff/             # JSON 比较工具
├── api-docs/             # API 文档
└── test-position/        # 位置测试工具
```

### 核心服务架构
```
ServiceContainer
├── FileService           # 文件和 ZIP 处理
├── XmlParseService      # XML 解析与命名空间
├── ImageDataService     # 图像提取和处理
├── PresentationParser   # 编排解析工作流
├── SlideParser         # 单个幻灯片处理
├── ThemeParser         # 主题和颜色处理
└── Element Processors   # 专用元素处理器
    ├── TextProcessor    # 富文本处理
    ├── ShapeProcessor   # 几何形状
    └── ImageProcessor   # 图像元素
```

### 工具系统
```
utils/
├── ColorUtils          # RGBA 颜色标准化
├── IdGenerator         # 唯一元素 ID 管理
├── UnitConverter       # EMU 到点转换
└── FillExtractor       # 填充和背景处理
```

[⬆️ 回到目录](#-目录)

## 🖼️ 高级图像处理

### 图像处理模式

#### 1. Base64 模式 (推荐)
将完整图像数据嵌入为 Data URLs，支持离线使用：

```javascript
const json = await parse(arrayBuffer, { imageMode: 'base64' })

// 输出包含完整图像数据
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
轻量级 URL 输出，适合云存储集成：

```javascript
const json = await parse(arrayBuffer, { imageMode: 'url' })

// 输出外部 URL
{
  "type": "image",
  "src": "https://cdn.example.com/images/slide1_image1.jpg",
  "originalSrc": "../media/image1.jpeg"
}
```

[⬆️ 回到目录](#-目录)

### 背景图像支持
完整的幻灯片背景处理，支持多种填充类型：

```javascript
// 纯色背景
{
  "background": {
    "type": "solid",
    "color": "#FF5733"
  }
}

// 图像背景 (Base64)
{
  "background": {
    "type": "image",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "imageSize": "cover"
  }
}

// 渐变背景
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

### 支持的格式
- **JPEG** (.jpg, .jpeg) - 优化压缩
- **PNG** (.png) - 透明度支持  
- **GIF** (.gif) - 动画支持
- **BMP** (.bmp) - 无压缩位图
- **WebP** (.webp) - 现代网络格式
- **TIFF** (.tiff) - 高质量图像

### 性能特性
- **并发处理**: 信号量控制的批处理 (默认: 3 个并发)
- **内存管理**: 针对大型演示文稿优化
- **错误隔离**: 单个图像失败不影响整体解析
- **存储策略**: 可插拔存储后端 (Base64, CDN, 自定义)

[⬆️ 回到目录](#-目录)

## 📋 完整元素支持

### 文本元素
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

### 形状元素
```javascript
{
  "type": "shape",
  "shapType": "rect",
  "fill": { "type": "color", "value": "#FF5733" },
  "border": { "color": "#000000", "width": 2, "type": "solid" },
  "path": "M 0,0 L 100,0 L 100,100 L 0,100 Z"
}
```

### 图像元素
```javascript
{
  "type": "image",
  "src": "data:image/jpeg;base64,...",
  "format": "jpeg",
  "clip": { "range": [[10, 20], [90, 80]] },  // 裁剪信息
  "rotate": 15
}
```

### 表格元素
```javascript
{
  "type": "table",
  "data": [["标题 1", "标题 2"], ["单元格 1", "单元格 2"]],
  "colWidths": [200, 300],
  "rowHeights": [40, 60],
  "borders": { "top": true, "right": true, "bottom": true, "left": true }
}
```

### 图表元素
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
- **450+ 测试用例** 覆盖所有组件
- **单元测试**: 各服务和工具的独立测试
- **集成测试**: 端到端解析工作流  
- **背景图像测试**: 全面的背景处理验证
- **边界案例测试**: 错误处理和畸形输入处理
- **性能测试**: 内存管理和并发处理

### 运行测试
```bash
# 运行所有测试
npm test

# 开发监视模式
npm run test:watch

# 生成覆盖报告
npm run test:coverage

# 运行特定测试类别
npx jest background-image
npx jest color-processing
npx jest image-base64
```

### 测试分类
```
tests/
├── __tests__/                    # 专项测试套件
│   ├── color-*.test.ts          # 颜色处理测试
│   ├── image-*.test.ts          # 图像处理测试
│   ├── integration.test.ts      # 端到端测试
│   └── edge-cases.test.ts       # 错误处理测试
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
解析上传的 PPTX 文件并返回 JSON 结构。

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
    "slides": [...],
    "theme": {...},
    "title": "演示文稿标题"
  },
  "filename": "presentation.pptx",
  "debug": {...}  // 可选调试信息
}
```

### 配置选项
```typescript
interface ParseOptions {
  imageMode?: 'base64' | 'url'        // 图像处理模式
  includeNotes?: boolean              // 包含演讲者备注
  includeMaster?: boolean             // 包含母版元素
  enableDebug?: boolean               // 调试信息
  maxConcurrency?: number             // 图像处理并发数
  precision?: number                  // 单位转换精度
}
```

[⬆️ 回到目录](#-目录)

## 📈 输出格式

### 完整 JSON 结构
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
          "style": { /* 全面样式设置 */ }
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

### 单位系统
所有尺寸值都使用 **点 (pt)** 作为单位，具有高精度转换：
- EMU 到点: `value * 0.0007874015748031496`
- 精度: 2 位小数 (可配置)
- 所有元素类型保持一致

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

### 从 v0.x 迁移
版本 1.5.0+ 引入破坏性变更：
- 单位系统从像素改为点
- 图像处理增强 Base64 支持
- 背景处理完全重写
- 面向服务架构替代单体解析器

[⬆️ 回到目录](#-目录)

## 🤝 贡献指南

### 开发环境设置
```bash
git clone https://github.com/pipipi-pikachu/pptxtojson.git
cd pptxtojson
npm install
npm run dev
```

### 测试贡献
```bash
# 运行现有测试
npm test

# 添加新测试用例
# 遵循 tests/__tests__/ 目录中的模式
```

### 代码质量
- **TypeScript**: 需要严格类型检查
- **ESLint**: 代码风格强制执行
- **Jest**: 维护测试覆盖率
- **文档**: 为新功能更新 README

[⬆️ 回到目录](#-目录)

## 🙏 致谢

本项目基于并显著扩展了：
- [PPTX2HTML](https://github.com/g21589/PPTX2HTML) - 原始解析概念
- [PPTXjs](https://github.com/meshesha/PPTXjs) - 基础实现参考

**主要差异:**
- **全栈应用**: 完整 Web 界面 vs. 仅库
- **高级架构**: 面向服务设计与依赖注入
- **卓越图像处理**: Base64 编码、格式检测、背景支持
- **全面测试**: 450+ 测试 vs. 最小测试覆盖
- **现代 TypeScript**: 严格类型和最新语言特性
- **生产就绪**: 错误处理、性能优化和可扩展性

[⬆️ 回到目录](#-目录)

## 📄 开源协议

MIT License | Copyright © 2020-PRESENT [pipipi-pikachu](https://github.com/pipipi-pikachu)

---

**🚀 准备好前所未有地解析 PPTX 文件了吗？** 从 `npm run dev` 开始，体验现代 PowerPoint 解析解决方案。

[⬆️ 回到目录](#-目录)