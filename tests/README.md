# PPTX 转换器测试套件

本文档详细说明了 PPTX 到 PPTist JSON 转换器的完整测试架构，包含 850+ 个测试用例，涵盖 10 个主要测试分类。

## 测试架构概览

### 测试文件夹结构
```
tests/
├── README.md                   # 本文档
├── README-cn.md               # 中文版说明
├── __mocks__/                 # 测试模拟文件
│   └── monaco-editor.js       # Monaco 编辑器模拟
├── __tests__/                 # 专项测试套件（54 个文件）
├── integration/               # 集成测试
│   └── api-integration-background.test.ts
├── models/                    # 数据模型测试
│   └── slide-advanced-background.test.ts
├── helpers/                   # 测试辅助工具
│   └── color-test-utils.ts
├── fixtures/                  # 测试数据
│   └── color-test-data.ts
├── setup.ts                   # 测试环境配置
└── [核心测试文件]              # 8 个基础测试文件
```

## 测试分类详解

### 1. 核心功能测试（8 个文件）
基础转换功能验证，确保 PPTX 文件正确解析为 PPTist 兼容的 JSON 格式。

**文件清单：**
- `pptxtojson.test.ts` - 主转换函数测试
- `utils.test.ts` - 领域模型测试（Presentation、Slide、Theme 类）
- `background-image.test.ts` - 背景图片处理验证
- `slide-background-format.test.ts` - 背景格式切换测试（传统格式 vs PPTist 格式）
- `element-types.test.ts` - 元素类型解析验证
- `pptx-parser-integration.test.ts` - 解析器集成测试
- `output-comparison.test.ts` - 输出对比测试
- `dimension-analysis.test.ts` - 尺寸分析测试

### 2. 图片处理测试（8 个文件）
验证高级图片处理功能，包括 Sharp 库集成、偏移调整、透明度处理等。

**文件清单：**
- `image-processing-service-integration.test.ts` - Sharp 库集成测试
- `pptx-image-processor-comprehensive.test.ts` - fillRect 算法完整测试
- `image-offset-adjuster-comprehensive.test.ts` - 图片偏移调整系统
- `image-element-model-enhancements.test.ts` - 增强图片元素模型
- `image-base64.test.ts` - Base64 图片处理
- `image-processing-simplified.test.ts` - 简化图片处理
- `pptx-image-processor-negative-offset.test.ts` - 负偏移处理
- `negative-offset-handling.test.ts` - 负偏移处理验证

**测试要点：**
- PowerPoint 拉伸偏移算法复现
- 透明背景填充处理
- 调试图片生成和元数据提取
- 内存优化的并发处理
- 图片格式检测（JPEG、PNG、GIF、WebP 等）

### 3. 颜色处理测试（9 个文件）
验证复杂的颜色转换系统，匹配 PowerPoint 的颜色行为。

**文件清单：**
- `color-processing-advanced.test.ts` - 高级颜色处理算法
- `color-processing-consistency.test.ts` - 颜色处理一致性
- `color-transformation-chain.test.ts` - 颜色变换链
- `theme-color-mapping.test.ts` - 主题颜色映射
- `advanced-color-processing.test.ts` - 高级颜色算法
- `color-format-extended.test.ts` - 扩展颜色格式
- `color-format.test.ts` - 基础颜色格式
- `color-utils-enhanced.test.ts` - 增强颜色工具
- `text-processor-color-integration.test.ts` - 文本处理器颜色集成

**测试要点：**
- PowerPoint 颜色变换顺序（Alpha、HueMod、LumMod/LumOff、SatMod、Shade、Tint）
- 主题颜色解析和继承
- 始终输出 rgba() 格式以保证 PPTist 兼容性
- 颜色一致性和精度验证

### 4. 形状处理测试（9 个文件）
验证 100+ 种 PowerPoint 形状类型的转换，支持自定义几何图形。

**文件清单：**
- `shape-processor-fill-integration.test.ts` - 形状处理器填充集成（24 个测试用例）
- `shape-custom-geometry.test.ts` - 自定义几何图形处理
- `shape-geometry-algorithms.test.ts` - 几何算法
- `preset-shape-paths.test.ts` - 预设形状路径生成
- `connection-shape-processor.test.ts` - 连接形状处理
- `roundrect-keypoints.test.ts` - 圆角矩形关键点
- `shape-element-enhancements.test.ts` - 形状元素增强
- `shape-line-fill-distinction.test.ts` - 线条与填充区分
- `shape-style-reference.test.ts` - 形状样式引用

**测试要点：**
- 预设几何图形（rect、ellipse、triangle、flowChart*、actionButton*）
- 自定义路径分析和 SVG 路径生成
- EMU 到点的精确转换
- 形状填充提取和主题颜色解析

### 5. 调试功能测试（3 个文件）
验证高级调试系统，包括可视化和处理步骤跟踪。

**文件清单：**
- `debug-helper-comprehensive.test.ts` - 调试系统综合测试
- `debug-functionality.test.ts` - 调试功能验证
- `debug-helper.test.ts` - 调试辅助工具

**测试要点：**
- 调试模式检测和配置
- 调试图片生成和元数据
- 处理步骤可视化
- 内存和性能监控

### 6. 文本处理测试（8 个文件）
验证富文本转换为 PPTist HTML 格式，包括颜色和字体映射。

**文件清单：**
- `text-processor-advanced.test.ts` - 高级文本处理
- `text-style-extractor-advanced.test.ts` - 高级样式提取
- `text-style-multi-paragraph.test.ts` - 多段落样式
- `html-converter-paragraph.test.ts` - HTML 转换器段落处理
- `html-output-integrity.test.ts` - HTML 输出完整性
- `font-size-calculator.test.ts` - 字体大小计算
- `line-height-extraction.test.ts` - 行高提取
- `text-processor-color-integration.test.ts` - 文本处理器颜色集成

### 7. 性能和错误处理测试（2 个文件）
验证系统的可靠性和边界条件处理。

**文件清单：**
- `performance-reliability-comprehensive.test.ts` - 性能可靠性综合测试（9 个测试用例）
- `error-handling-boundary-conditions.test.ts` - 错误处理边界条件

**测试要点：**
- 大文件处理和内存管理
- 并发处理和信号量控制
- 错误隔离和恢复机制
- 压力测试和资源限制

### 8. 填充处理测试（3 个文件）
验证各种填充类型的处理，包括透明填充。

**文件清单：**
- `fill-extractor-comprehensive.test.ts` - 填充提取综合测试
- `fill-extractor.test.ts` - 基础填充提取
- `transparent-fill-processing.test.ts` - 透明填充处理

### 9. 主题和样式测试（2 个文件）
验证主题继承机制和样式映射。

**文件清单：**
- `theme-inheritance-mechanism.test.ts` - 主题继承机制
- `theme-color-mapping.test.ts` - 主题颜色映射

### 10. UI 组件测试（3 个文件）
验证用户界面组件的功能和集成。

**文件清单：**
- `cdn-file-uploader.test.tsx` - CDN 文件上传器组件
- `monaco-json-loader-large-files.test.tsx` - Monaco JSON 大文件加载器
- `switch-component-integration.test.tsx` - 开关组件集成（背景格式切换）

## 测试运行指南

### 基本测试命令
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx jest pptxtojson.test.ts

# 运行特定测试套件
npx jest --testNamePattern="颜色处理"

# 观察模式（开发期间）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 分类测试命令
```bash
# 图片处理测试
npx jest image-processing

# 颜色处理测试
npx jest color-processing

# 形状处理测试
npx jest shape-processor

# 调试功能测试
npx jest debug-helper

# 性能测试
npx jest performance-

# 集成测试
npx jest integration

# 填充处理测试
npx jest fill-extractor

# 主题测试
npx jest theme-

# 背景格式测试
npx jest background-format
```

## 测试配置说明

### Jest 配置（jest.config.js）
- **测试框架**: Jest + ts-jest
- **环境**: jsdom（支持 DOM 测试）
- **TypeScript 支持**: 完整编译和类型检查
- **覆盖率**: 详细报告输出到 `coverage/` 目录
- **超时**: 每个测试 120 秒（适合文件解析）

### 测试路径
- `tests/` - 主测试目录
- `app/` - 应用程序代码测试
- `components/` - 组件测试

### 模块映射
- `@/components/*` → `components/*`
- `@/*` → `app/*`
- `monaco-editor` → 测试模拟文件

## 测试数据和样本

### 样本文件
- **输入**: `sample/input.pptx` - 真实 PowerPoint 演示文稿
- **预期输出**: `sample/output.json` - 参考 JSON 结构
- **背景格式测试**: 传统格式和 PPTist 格式验证
- **调试样本**: 各种调试图片和处理步骤可视化
- **性能样本**: 大文件处理和压力测试数据

### 测试辅助工具
- **颜色测试工具**: `helpers/color-test-utils.ts`
- **测试数据**: `fixtures/color-test-data.ts`
- **模拟文件**: `__mocks__/monaco-editor.js`

## 新增测试功能

### 背景格式测试
- **双格式支持**: 传统格式和 PPTist 格式测试
- **格式切换验证**: API 端点 backgroundFormat 参数测试
- **幻灯片模型测试**: toJSON() 方法 backgroundFormat 参数验证
- **集成测试**: 背景格式转换端到端测试

### 高级图片处理验证
- **Sharp 库集成**: 具有降级机制的 Sharp 图片处理测试
- **透明背景处理**: 透明填充处理和合成验证
- **图片偏移调整**: PowerPoint 拉伸偏移算法测试
- **调试图片生成**: 调试可视化和元数据提取测试

### 高级调试测试
- **调试辅助系统**: 调试功能的综合验证
- **可视化测试**: 调试图片生成和处理步骤跟踪
- **元数据验证**: 调试信息准确性和完整性

### 性能和可靠性
- **内存管理**: 大文件处理和垃圾回收测试
- **并发处理**: 多线程图片处理验证
- **错误边界测试**: 边界情况和格式错误输入处理
- **压力测试**: 高容量处理和资源限制测试

## 覆盖率统计

### 测试覆盖率概览
- **元素类型**: 100% 覆盖率（文本、形状、图片、表格、图表）
- **图片处理**: 100% 覆盖率（Sharp 集成、偏移调整、透明度）
- **颜色处理**: 100% 覆盖率（PowerPoint 变换、主题颜色）
- **形状处理**: 100% 覆盖率（100+ 种 PowerPoint 形状类型）
- **调试功能**: 100% 覆盖率（调试系统、可视化、元数据）
- **幻灯片功能**: 100% 覆盖率（双格式背景、主题、定位）
- **错误处理**: 边界条件综合错误处理验证
- **边界情况**: 内存管理、Unicode、性能、大文件
- **集成**: 端到端转换流程和 PPTist 兼容性
- **性能**: 并发处理、内存优化、压力测试

### 验证关键点

#### 数据准确性
- **元素计数**: 成功解析样本 PPTX 中的所有 23 个元素
- **幻灯片计数**: 正确识别 3 张幻灯片
- **元素类型**: 正确处理文本、形状和图片元素

#### 内容保真度
- **文本内容**: 保留中文字符和格式
- **定位**: 在可接受范围内保持元素位置（±50px）
- **主题颜色**: 提取主题颜色方案
- **背景**: 正确识别带有双格式支持的幻灯片背景

#### 技术验证
- **结构**: 保持一致的 JSON 输出格式
- **错误处理**: 优雅地处理无效输入
- **类型安全**: 完整的 TypeScript 兼容性
- **性能**: 在合理时间限制内完成解析

## 测试维护和扩展

### 添加新测试用例
1. **确定测试分类**: 根据功能选择合适的测试分类
2. **选择测试位置**: 核心测试放在根目录，专项测试放在 `__tests__/` 目录
3. **命名规范**: 使用描述性名称，如 `feature-specific-function.test.ts`
4. **遵循模式**: 参考现有测试文件的结构和模式

### 测试文件组织原则
- **单一职责**: 每个测试文件专注于一个特定功能
- **清晰分组**: 相关测试用例分组在 describe 块中
- **描述性命名**: 测试名称应该清楚表达测试意图
- **数据驱动**: 使用测试数据文件和辅助工具

### 性能测试指南
- **大文件测试**: 使用真实大小的 PPTX 文件
- **内存监控**: 监控内存使用和垃圾回收
- **并发测试**: 验证多线程和异步处理
- **超时设置**: 适当设置测试超时时间

### 调试测试失败
1. **运行单个测试**: 隔离失败的测试用例
2. **查看覆盖率**: 检查是否有未覆盖的代码路径
3. **使用调试模式**: 启用调试输出和详细日志
4. **检查测试数据**: 确认测试数据的准确性

这个综合测试套件确保了 PPTX 解析功能的可靠性、一致性和高性能，为生产环境使用提供了强有力的质量保证，同时支持高级 PPTist 兼容性和稳健的错误处理。