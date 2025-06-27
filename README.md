# 🎨 pptxtojson
一个运行在浏览器中，可以将 .pptx 文件转为可读的 JSON 数据的 JavaScript 库。

> 与其他的pptx文件解析工具的最大区别在于：
> 1. 直接运行在浏览器端；
> 2. 解析结果是**可读**的 JSON 数据，而不仅仅是把 XML 文件内容原样翻译成难以理解的 JSON。

在线DEMO：https://pipipi-pikachu.github.io/pptxtojson/

# 🎯 注意事项
### ⚒️ 使用场景
本仓库诞生于项目 [PPTist](https://github.com/pipipi-pikachu/PPTist) ，希望为其“导入 .pptx 文件功能”提供一个参考示例。不过就目前来说，解析出来的PPT信息与源文件在样式上还是存在差异。

但如果你只是需要提取PPT文件的文本内容、媒体资源信息、结构信息等，或者对排版/样式精准度没有特别高的要求，那么 pptxtojson 可能会对你有帮助。

### 📏 长度值单位
输出的JSON中，所有数值长度值单位都为`pt`（point）
> 注意：在0.x版本中，所有输出的长度值单位都是px（像素）

# 🔨安装
```
npm install pptxtojson
```

# 💿用法

### 浏览器
```html
<input type="file" accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"/>
```

```javascript
import { parse } from 'pptxtojson'

document.querySelector('input').addEventListener('change', evt => {
	const file = evt.target.files[0]
	
	const reader = new FileReader()
	reader.onload = async e => {
		const json = await parse(e.target.result)
		console.log(json)
	}
	reader.readAsArrayBuffer(file)
})
```

### Node.js (服务端)
```javascript
import { parse } from 'pptxtojson'
import fs from 'fs'

const buffer = fs.readFileSync('presentation.pptx')
const json = await parse(buffer)
console.log(json)
```

### 配置选项
```javascript
// 基础用法
const json = await parse(arrayBuffer)

// 带配置选项
const json = await parse(arrayBuffer, {
  imageMode: 'base64', // 'base64' | 'url' 
  includeNotes: true,
  includeMaster: true
})
```

### 输出示例
```javascript
{
	"slides": [
		{
			"fill": {
				"type": "color",
				"value": "#FF0000"
			},
			"elements": [
				{
					"left":	0,
					"top": 0,
					"width": 72,
					"height":	72,
					"borderColor": "#1F4E79",
					"borderWidth": 1,
					"borderType": "solid",
					"borderStrokeDasharray": 0,
					"fill": {
						"type": "color",
						"value": "#FF0000"
					},
					"content": "<p style=\"text-align: center;\"><span style=\"font-size: 18pt;font-family: Calibri;\">TEST</span></p>",
					"isFlipV": false,
					"isFlipH": false,
					"rotate": 0,
					"vAlign": "mid",
					"name": "矩形 1",
					"type": "shape",
					"shapType": "rect"
				},
				// more...
			],
			"layoutElements": [
				// more...
			],
			"note": "演讲者备注内容..."
		},
		// more...
	],
	"themeColors": ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'],
	"size": {
		"width": 960,
		"height": 540
	}
}
```

# 📕 完整功能支持

### 幻灯片主题色 `themeColors`

### 幻灯片尺寸 `size`
- 幻灯片宽度 `width`
- 幻灯片高度 `height`

### 幻灯片页面 `slides`
#### 页面背景填充（颜色、图片、渐变） `fill`

#### 页面备注 `note`

#### 页面内元素 `elements` / 母版元素 `layoutElements`
##### 文字
- 类型 `type='text'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 边框颜色 `borderColor`
- 边框宽度 `borderWidth`
- 边框类型（实线、点线、虚线） `borderType`
- 非实线边框样式 `borderStrokeDasharray`
- 阴影 `shadow`
- 填充（颜色、图片、渐变） `fill`
- 内容文字（HTML富文本） `content`
- 垂直翻转 `isFlipV`
- 水平翻转 `isFlipH`
- 旋转角度 `rotate`
- 垂直对齐方向 `vAlign`
- 是否为竖向文本 `isVertical`
- 元素名 `name`

##### 图片
- 类型 `type='image'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 边框颜色 `borderColor`
- 边框宽度 `borderWidth`
- 边框类型（实线、点线、虚线） `borderType`
- 非实线边框样式 `borderStrokeDasharray`
- 裁剪形状 `geom`
- 裁剪范围 `rect`
- 图片地址 `src`
- 旋转角度 `rotate`
- **图片处理模式** `mode` - 'base64' | 'url'
- **图片格式** `format` - 'jpeg' | 'png' | 'gif' | 'bmp' | 'webp' | 'tiff'
- **MIME类型** `mimeType` - 'image/jpeg' | 'image/png' 等
- **原始文件大小** `originalSize` - 字节数
- **原始路径** `originalSrc` - PPTX中的原始图片路径

##### 形状
- 类型 `type='shape'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 边框颜色 `borderColor`
- 边框宽度 `borderWidth`
- 边框类型（实线、点线、虚线） `borderType`
- 非实线边框样式 `borderStrokeDasharray`
- 阴影 `shadow`
- 填充（颜色、图片、渐变） `fill`
- 内容文字（HTML富文本） `content`
- 垂直翻转 `isFlipV`
- 水平翻转 `isFlipH`
- 旋转角度 `rotate`
- 形状类型 `shapType`
- 垂直对齐方向 `vAlign`
- 形状路径 `path`
- 元素名 `name`

##### 表格
- 类型 `type='table'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 边框（4边） `borders`
- 表格数据 `data`
- 行高 `rowHeights`
- 列宽 `colWidths`

##### 图表
- 类型 `type='chart'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 图表数据 `data`
- 图表主题色 `colors`
- 图表类型 `chartType`
- 柱状图方向 `barDir`
- 是否带数据标记 `marker`
- 环形图尺寸 `holeSize`
- 分组模式 `grouping`
- 图表样式 `style`

##### 视频
- 类型 `type='video'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 视频blob `blob`
- 视频src `src`

##### 音频
- 类型 `type='audio'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 音频blob `blob`

##### 公式
- 类型 `type='math'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 公式图片 `picBase64`
- LaTeX表达式（仅支持常见结构） `latex`
- 文本（文本和公式混排时存在） `text`

##### Smart图
- 类型 `type='diagram'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 子元素集合 `elements`

##### 多元素组合
- 类型 `type='group'`
- 水平坐标 `left`
- 垂直坐标 `top`
- 宽度 `width`
- 高度 `height`
- 子元素集合 `elements`

# 🖼️ 图片处理

### 图片处理模式

pptxtojson 支持两种图片处理模式：

#### 1. Base64 模式（默认）
将 PPTX 中的图片提取并转换为 base64 Data URLs，图片数据直接嵌入在 JSON 中。

**优点：**
- 无需额外的图片服务器
- 图片数据完整保存
- 支持离线使用
- 适合小型应用或文档归档

**缺点：**
- JSON 文件体积较大
- 内存占用较高

#### 2. URL 模式
图片以 URL 形式输出，需要配合图片服务器使用。

**优点：**
- JSON 文件体积小
- 内存占用低
- 支持 CDN 加速

**缺点：**
- 需要额外的图片存储服务
- 图片可能丢失

### 使用示例

#### Base64 模式（推荐）
```javascript
import { parse } from 'pptxtojson'

const json = await parse(arrayBuffer, { imageMode: 'base64' })

// 图片元素输出格式
{
  "type": "image",
  "mode": "base64",
  "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "format": "jpeg",
  "mimeType": "image/jpeg",
  "originalSize": 45678,
  "originalSrc": "../media/image1.jpeg",
  "left": 100,
  "top": 200,
  "width": 300,
  "height": 400,
  // ... 其他属性
}
```

#### URL 模式
```javascript
const json = await parse(arrayBuffer, { imageMode: 'url' })

// 图片元素输出格式
{
  "type": "image", 
  "mode": "url",
  "src": "https://example.com/images/image1.jpg",
  "originalSrc": "../media/image1.jpeg",
  "left": 100,
  "top": 200,
  "width": 300,
  "height": 400,
  // ... 其他属性
}
```

### 支持的图片格式

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **BMP** (.bmp)
- **WebP** (.webp)
- **TIFF** (.tiff)

### 图片裁剪信息

当图片在 PowerPoint 中被裁剪时，会包含裁剪信息：

```javascript
{
  "type": "image",
  "clip": {
    "range": [[10, 20], [70, 60]] // [[left, top], [right, bottom]]
  },
  // ... 其他属性
}
```

### 性能和内存管理

- **并发处理**：自动控制图片处理并发数（默认3个）
- **内存优化**：大图片批量处理时使用信号量机制
- **错误处理**：单个图片处理失败不影响整体解析
- **进度反馈**：支持批量处理进度回调

### 更多类型请参考 👇
[https://github.com/pipipi-pikachu/pptxtojson/blob/master/dist/index.d.ts](https://github.com/pipipi-pikachu/pptxtojson/blob/master/dist/index.d.ts)

# 🙏 感谢
本仓库大量参考了 [PPTX2HTML](https://github.com/g21589/PPTX2HTML) 和 [PPTXjs](https://github.com/meshesha/PPTXjs) 的实现。
> 与它们不同的是：PPTX2HTML 和 PPTXjs 是将PPT文件转换为能够运行的 HTML 页面，而 pptxtojson 做的是将PPT文件转换为干净的 JSON 数据，且在原有基础上进行了大量优化补充（包括代码质量和提取信息的完整度和准确度）。

# 📄 开源协议
MIT License | Copyright © 2020-PRESENT [pipipi-pikachu](https://github.com/pipipi-pikachu)