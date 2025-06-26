# 📚 PPTX to JSON 使用指南

## 🎯 项目简介

这是一个基于 Next.js 的 PowerPoint (.pptx) 文件解析器，提供 Web 界面和 REST API 来将 PPTX 文件转换为 JSON 格式。

## 🚀 快速开始

### 方法 1: 使用启动脚本（推荐）
```bash
./start-server.sh
```

### 方法 2: 手动启动
```bash
# 安装依赖
npm install

# 构建应用
npm run build:next

# 启动生产服务器
npm run start
```

### 方法 3: 开发模式
```bash
npm run dev
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **主页**: http://localhost:3000
- **API 文档**: http://localhost:3000/api-docs  
- **健康检查**: http://localhost:3000/api/health

## 💻 Web 界面使用

### 基本操作流程
1. **打开主页** → 访问 http://localhost:3000
2. **上传文件** → 点击红色上传按钮选择 .pptx 文件
3. **查看结果** → 右侧自动显示解析后的 JSON 数据
4. **复制数据** → 点击右上角 `📋 复制 JSON` 按钮
5. **使用数据** → 在任何地方粘贴使用

### 界面功能说明
- **文件上传**: 支持最大 50MB 的 .pptx 文件
- **实时解析**: 上传后自动开始解析，显示进度
- **JSON 查看**: 支持树形、代码、查看三种模式
- **搜索功能**: 可在 JSON 数据中搜索特定内容
- **一键复制**: 复制完整的格式化 JSON 到剪贴板
- **状态反馈**: 实时显示复制成功/失败状态

## 🔌 API 接口使用

### 1. 健康检查
```bash
GET /api/health
```

**响应示例:**
```json
{
  "status": "healthy",
  "service": "pptxtojson-api", 
  "version": "1.5.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 解析 PPTX 文件
```bash
POST /api/parse-pptx
Content-Type: multipart/form-data

# 参数
file: [PPTX文件]
```

**使用 curl:**
```bash
curl -X POST \
  -F "file=@presentation.pptx" \
  http://localhost:3000/api/parse-pptx
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "slides": [...],
    "theme": {...},
    "metadata": {...}
  },
  "filename": "presentation.pptx"
}
```

### 3. 转换并下载
```bash
POST /api/convert
Content-Type: multipart/form-data

# 参数  
file: [PPTX文件]
format: "download" | "json" (可选，默认 "json")
```

**使用 curl (下载文件):**
```bash
curl -X POST \
  -F "file=@presentation.pptx" \
  -F "format=download" \
  -o result.json \
  http://localhost:3000/api/convert
```

## 📝 JavaScript SDK 使用

项目还提供了客户端 SDK，位于 `lib/pptx-parser.ts`:

```javascript
import { PPTXParser } from './lib/pptx-parser'

const parser = new PPTXParser('http://localhost:3000')

// 解析文件
const result = await parser.parseFile(file)
if (result.success) {
  console.log(result.data)
}

// 下载转换结果
await parser.convertAndDownload(file)

// 检查服务状态
const health = await parser.checkHealth()
```

## 🛠️ 开发相关

### 项目结构
```
pptxtojson/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # 主页组件
│   ├── layout.tsx         # 布局组件
│   ├── globals.css        # 全局样式
│   └── api-docs/          # API 文档页面
├── pages/api/             # API 路由
│   ├── health.ts          # 健康检查
│   ├── parse-pptx.ts      # 文件解析
│   └── convert.ts         # 文件转换
├── components/            # React 组件
│   ├── FileUploader.tsx   # 文件上传组件
│   └── JsonViewer.tsx     # JSON 查看组件
├── lib/                   # 客户端库
├── src/                   # TypeScript 解析库
└── dist/                  # 构建输出
```

### 构建命令
```bash
# 构建 Next.js 应用
npm run build:next

# 构建 TypeScript 库  
npm run build:lib

# 开发模式（库）
npm run dev:lib

# 类型检查
npm run type-check
```

### 环境要求
- Node.js 18+
- 现代浏览器（支持 Clipboard API）
- HTTPS 或 localhost 环境（用于剪贴板功能）

## 🐛 故障排除

### 常见问题

**1. 端口 3000 被占用**
```bash
# 查找占用进程
lsof -ti :3000

# 杀死进程
kill -9 $(lsof -ti :3000)
```

**2. 构建失败**
```bash
# 清除缓存
rm -rf .next node_modules package-lock.json
npm install
npm run build:next
```

**3. 复制功能不工作**
- 确保在 HTTPS 或 localhost 环境
- 检查浏览器是否支持 Clipboard API
- 查看浏览器控制台错误信息

**4. 文件上传失败**
- 检查文件是否为 .pptx 格式
- 确认文件大小小于 50MB
- 查看网络连接状态

### 调试模式
```bash
# 启用调试日志
DEBUG=* npm run dev

# 查看服务器日志
tail -f .next/trace
```

## 📄 更多资源

- [API 完整文档](http://localhost:3000/api-docs)
- [GitHub 仓库](https://github.com/pipipi-pikachu/pptx2json)
- [PPTist 在线工具](https://pipipi-pikachu.github.io/PPTist/)

---

💡 **提示**: 如有问题请查看 API 文档页面或检查浏览器控制台错误信息。