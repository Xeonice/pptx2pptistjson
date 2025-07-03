# pptx2pptistjson API 文档

本文档描述了 pptx2pptistjson 服务的所有可用 API 端点。该服务专门用于将 PowerPoint (.pptx) 文件转换为 PPTist 兼容的 JSON 格式。

## 目录
- [API 端点概览](#api-端点概览)
- [端点详细说明](#端点详细说明)
  - [POST /api/parse-pptx](#post-apiparse-pptx)
  - [POST /api/cdn-upload-token](#post-apicdn-upload-token)
- [PPTist JSON 输出格式规范](#pptist-json-输出格式规范)
- [背景格式说明](#背景格式说明)
- [错误处理](#错误处理)
- [使用示例](#使用示例)

## API 端点概览

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/parse-pptx` | POST | 解析 PPTX 文件并转换为 PPTist JSON 格式 |
| `/api/cdn-upload-token` | POST | 获取客户端直传 CDN 的上传令牌 |

## 端点详细说明

### POST /api/parse-pptx

将 PowerPoint 文件转换为 PPTist 兼容的 JSON 格式。

#### 请求参数

**Content-Type**: `multipart/form-data`

| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| `file` | File | 否* | 要解析的 PPTX 文件 |
| `cdnUrl` | string | 否* | 从 CDN 下载文件的 URL |
| `format` | string | 否 | 输出格式，默认值: `"legacy"` |
| `backgroundFormat` | string | 否 | 背景格式，可选值: `"legacy"` (默认) 或 `"pptist"` |
| `useCdn` | string | 否 | 是否将结果上传到 CDN，值为 `"true"` 或 `"false"` |
| `cdnFilename` | string | 否 | CDN 存储的文件名，默认: `pptx-result-{timestamp}.json` |
| `enableDebugMode` | string | 否 | 是否启用调试模式，值为 `"true"` 或 `"false"` |
| `debugOptions` | string | 否 | 调试选项的 JSON 字符串 |

*注意: `file` 和 `cdnUrl` 必须提供其中一个

#### 请求示例

```javascript
// 上传本地文件
const formData = new FormData();
formData.append('file', pptxFile);
formData.append('backgroundFormat', 'pptist');
formData.append('useCdn', 'true');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});

// 从 CDN URL 解析
const formData = new FormData();
formData.append('cdnUrl', 'https://example.com/presentation.pptx');
formData.append('backgroundFormat', 'legacy');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});
```

#### 响应格式

**成功响应 (不使用 CDN)**
```json
{
  "success": true,
  "data": {
    "slides": [...],  // PPTist JSON 数据
    "title": "演示文稿标题",
    "theme": {...}
  },
  "filename": "presentation.pptx",
  "debug": {
    "fileSize": 1048576,
    "resultType": "object",
    "resultKeys": ["slides", "title", "theme"],
    "hasData": true,
    "debugMode": false
  }
}
```

**成功响应 (使用 CDN)**
```json
{
  "success": true,
  "cdnUrl": "https://cdn.example.com/pptx-result-1234567890.json",
  "cdnId": "unique-cdn-id",
  "filename": "presentation.pptx",
  "size": 2048,
  "contentType": "application/json",
  "metadata": {
    "originalFilename": "presentation.pptx",
    "uploadedAt": "2025-07-03T10:00:00.000Z",
    "format": "legacy"
  },
  "debug": {
    "fileSize": 1048576,
    "cdnProvider": "vercel-blob",
    "uploadedAt": "2025-07-03T10:00:00.000Z"
  }
}
```

**错误响应**
```json
{
  "error": "Failed to parse PPTX file",
  "details": "错误详细信息"
}
```

### POST /api/cdn-upload-token

获取客户端直传 CDN 的上传令牌。

#### 请求参数

**Content-Type**: `application/json`

请求体格式遵循 Vercel Blob 的 `HandleUploadBody` 规范。

#### 请求示例

```javascript
const response = await fetch('/api/cdn-upload-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pathname: 'presentations/my-presentation.pptx',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  })
});
```

#### 响应格式

返回 Vercel Blob 客户端上传所需的令牌信息。

#### 限制

- 支持的文件类型: `.pptx`, `.json`
- 最大文件大小: 50MB
- 文件名会自动添加随机后缀以避免冲突

## PPTist JSON 输出格式规范

转换后的 JSON 遵循 PPTist 编辑器的格式要求。

### 顶层结构

```typescript
{
  "slides": Slide[],       // 幻灯片数组
  "title": string,         // 演示文稿标题
  "theme": Theme           // 主题信息
}
```

### Slide 对象

```typescript
{
  "id": string,            // 幻灯片唯一标识符 (10位随机字符串)
  "elements": Element[],   // 元素数组
  "background": Background,// 背景设置
  "remark": string        // 备注/演讲者注释
}
```

### Element 类型

支持的元素类型:
- `text` - 文本框
- `shape` - 形状
- `image` - 图片
- `line` - 线条
- `video` - 视频
- `audio` - 音频
- `table` - 表格
- `chart` - 图表
- `group` - 组合
- `diagram` - 图表
- `math` - 数学公式

#### 文本元素 (TextElement)

```typescript
{
  "type": "text",
  "id": string,
  "left": number,          // X 坐标 (点)
  "top": number,           // Y 坐标 (点)
  "width": number,         // 宽度 (点)
  "height": number,        // 高度 (点)
  "content": string,       // HTML 格式的富文本内容
  "rotate": number,        // 旋转角度
  "defaultFontName": string,
  "defaultColor": {
    "color": string,       // rgba 格式颜色
    "colorType": string    // 主题颜色类型
  },
  "vertical": boolean,     // 是否垂直排版
  "lineHeight": number,    // 行高
  "wordSpace": number,     // 字间距
  "fit": "resize",        // 适应方式
  "enableShrink": boolean  // 是否启用缩放
}
```

#### 形状元素 (ShapeElement)

```typescript
{
  "type": "shape",
  "id": string,
  "left": number,
  "top": number,
  "width": number,
  "height": number,
  "viewBox": [number, number],  // SVG 视图框
  "path": string,                // SVG 路径
  "pathFormula": string,         // PowerPoint 几何标识符
  "themeFill": {
    "color": string,             // rgba 格式颜色
    "debug": {...}               // 调试信息
  },
  "fixedRatio": boolean,
  "rotate": number,
  "enableShrink": boolean
}
```

#### 图片元素 (ImageElement)

```typescript
{
  "type": "image",
  "id": string,
  "left": number,
  "top": number,
  "width": number,
  "height": number,
  "src": string,           // 图片 URL 或 base64 数据
  "rotate": number,
  "fixedRatio": boolean,
  "enableShrink": boolean
}
```

### 颜色处理

所有颜色值统一使用 `rgba()` 格式，确保与 PPTist 的兼容性。颜色转换遵循 PowerPoint 的处理顺序:

1. Alpha (透明度)
2. HueMod (色相调整)
3. LumMod/LumOff (亮度调整)
4. SatMod (饱和度调整)
5. Shade (加深)
6. Tint (变浅)

## 背景格式说明

系统支持两种背景格式以确保最大兼容性:

### Legacy 格式 (默认)

```json
{
  "background": {
    "type": "image",
    "image": "data:image/png;base64,...",
    "imageSize": "cover"
  }
}
```

### PPTist 格式

```json
{
  "background": {
    "type": "image",
    "image": {
      "src": "data:image/png;base64,...",
      "size": "cover"
    }
  }
}
```

通过 `backgroundFormat` 参数控制输出格式:
- `"legacy"` - 使用传统格式 (默认)
- `"pptist"` - 使用 PPTist 推荐格式

## 错误处理

API 使用标准 HTTP 状态码:

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

错误响应格式:
```json
{
  "error": "错误类型描述",
  "details": "详细错误信息"
}
```

## 使用示例

### 基本用法

```javascript
async function convertPPTX(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/parse-pptx', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details);
  }
  
  const result = await response.json();
  return result.data;
}
```

### 使用 PPTist 格式并上传到 CDN

```javascript
async function convertWithCDN(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('backgroundFormat', 'pptist');
  formData.append('useCdn', 'true');
  formData.append('cdnFilename', `presentation-${Date.now()}.json`);
  
  const response = await fetch('/api/parse-pptx', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.cdnUrl) {
    // 结果已上传到 CDN
    console.log('CDN URL:', result.cdnUrl);
    
    // 从 CDN 获取实际数据
    const dataResponse = await fetch(result.cdnUrl);
    return await dataResponse.json();
  } else {
    // 直接返回的数据
    return result.data;
  }
}
```

### 启用调试模式

```javascript
async function convertWithDebug(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('enableDebugMode', 'true');
  formData.append('debugOptions', JSON.stringify({
    saveDebugImages: true,
    logLevel: 'verbose'
  }));
  
  const response = await fetch('/api/parse-pptx', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log('Debug info:', result.debug);
  return result.data;
}
```

## 注意事项

1. **文件大小限制**: 建议 PPTX 文件不超过 50MB
2. **并发处理**: 图片处理使用并发控制，默认并发数为 3
3. **内存管理**: 大文件处理时会自动进行内存优化
4. **格式兼容性**: 支持 PowerPoint 2007 及以上版本的 .pptx 文件
5. **图片格式**: 支持 JPEG, PNG, GIF, BMP, WebP, TIFF 格式
6. **颜色精度**: 所有颜色转换保持高精度，确保视觉一致性