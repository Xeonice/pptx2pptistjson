# 使用示例

## 基础用法

### 1. 浏览器环境

#### 文件上传解析
```html
<!DOCTYPE html>
<html>
<head>
    <title>PPTX 解析示例</title>
</head>
<body>
    <input type="file" id="file-input" accept=".pptx">
    <div id="result"></div>

    <script type="module">
        import { parse } from './dist/pptxtojson.js'

        document.getElementById('file-input').addEventListener('change', async (event) => {
            const file = event.target.files[0]
            if (!file) return

            try {
                const arrayBuffer = await file.arrayBuffer()
                const json = await parse(arrayBuffer, {
                    imageMode: 'base64'
                })
                
                document.getElementById('result').innerHTML = 
                    `<pre>${JSON.stringify(json, null, 2)}</pre>`
            } catch (error) {
                console.error('解析失败:', error)
            }
        })
    </script>
</body>
</html>
```

#### 拖拽上传
```javascript
const dropZone = document.getElementById('drop-zone')

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropZone.classList.add('drag-over')
})

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over')
})

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault()
    dropZone.classList.remove('drag-over')
    
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.endsWith('.pptx')) {
        const arrayBuffer = await files[0].arrayBuffer()
        const json = await parse(arrayBuffer)
        console.log('解析结果:', json)
    }
})
```

### 2. Node.js 环境

#### 命令行工具
```javascript
#!/usr/bin/env node
import { parse } from 'pptxtojson'
import fs from 'fs/promises'
import path from 'path'

async function convertPPTX(inputPath, outputPath) {
    try {
        console.log(`正在解析: ${inputPath}`)
        
        const buffer = await fs.readFile(inputPath)
        const json = await parse(buffer, {
            imageMode: 'base64',
            includeNotes: true
        })
        
        await fs.writeFile(outputPath, JSON.stringify(json, null, 2))
        console.log(`转换完成: ${outputPath}`)
        
        // 统计信息
        console.log(`幻灯片数量: ${json.slides.length}`)
        console.log(`文件大小: ${(await fs.stat(outputPath)).size} 字节`)
        
    } catch (error) {
        console.error('转换失败:', error.message)
        process.exit(1)
    }
}

// 使用示例
const inputFile = process.argv[2]
const outputFile = process.argv[3] || inputFile.replace('.pptx', '.json')

if (!inputFile) {
    console.log('用法: node convert.js <input.pptx> [output.json]')
    process.exit(1)
}

convertPPTX(inputFile, outputFile)
```

#### Express.js 集成
```javascript
import express from 'express'
import multer from 'multer'
import { parse } from 'pptxtojson'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/parse-pptx', upload.single('file'), async (req, res) => {
    try {
        if (!req.file || !req.file.originalname.endsWith('.pptx')) {
            return res.status(400).json({ error: '请上传有效的 PPTX 文件' })
        }

        const json = await parse(req.file.buffer, {
            imageMode: 'base64'
        })

        res.json({
            success: true,
            filename: req.file.originalname,
            data: json,
            stats: {
                slides: json.slides.length,
                fileSize: req.file.size
            }
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        })
    }
})

app.listen(3000, () => {
    console.log('服务器运行在端口 3000')
})
```

## 图片处理示例

### 1. Base64 模式（完整图片数据）

```javascript
const json = await parse(arrayBuffer, {
    imageMode: 'base64'
})

// 处理图片元素
json.slides.forEach((slide, slideIndex) => {
    slide.elements.forEach((element, elementIndex) => {
        if (element.type === 'image' && element.mode === 'base64') {
            console.log(`幻灯片 ${slideIndex + 1}, 图片 ${elementIndex + 1}:`)
            console.log(`- 格式: ${element.format}`)
            console.log(`- 原始大小: ${element.originalSize} 字节`)
            console.log(`- Data URL 长度: ${element.src.length}`)
            
            // 创建 Image 元素预览
            const img = new Image()
            img.src = element.src
            img.onload = () => {
                console.log(`- 实际尺寸: ${img.naturalWidth}x${img.naturalHeight}`)
            }
        }
    })
})
```

### 2. URL 模式（需要图片服务器）

```javascript
const json = await parse(arrayBuffer, {
    imageMode: 'url'
})

// 需要实现图片 URL 转换逻辑
function convertToActualUrl(pptxImagePath) {
    // 将 PPTX 中的图片路径转换为实际可访问的 URL
    const filename = pptxImagePath.split('/').pop()
    return `https://your-image-server.com/images/${filename}`
}

json.slides.forEach(slide => {
    slide.elements.forEach(element => {
        if (element.type === 'image' && element.mode === 'url') {
            element.src = convertToActualUrl(element.originalSrc)
        }
    })
})
```

### 3. 图片优化

```javascript
import { ImageOptimizer } from 'pptxtojson/images'

// 解析时自动优化图片
const json = await parse(arrayBuffer, {
    imageMode: 'base64',
    imageOptimization: {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 80,
        maxFileSize: 1024 * 1024, // 1MB
        format: 'jpeg'
    }
})

// 手动优化图片
const optimized = await ImageOptimizer.optimize(
    imageBuffer, 
    'png',
    {
        format: 'jpeg',
        quality: 75
    }
)

console.log(`原始大小: ${optimized.originalSize} 字节`)
console.log(`优化后大小: ${optimized.optimizedSize} 字节`)
console.log(`压缩比: ${optimized.compressionRatio.toFixed(2)}`)
```

## React 集成示例

### PPTx 查看器组件

```jsx
import React, { useState } from 'react'
import { parse } from 'pptxtojson'

function PPTXViewer() {
    const [presentation, setPresentation] = useState(null)
    const [loading, setLoading] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setLoading(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const json = await parse(arrayBuffer, {
                imageMode: 'base64'
            })
            setPresentation(json)
            setCurrentSlide(0)
        } catch (error) {
            console.error('解析失败:', error)
            alert('解析失败: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const renderElement = (element) => {
        const style = {
            position: 'absolute',
            left: element.left + 'pt',
            top: element.top + 'pt',
            width: element.width + 'pt',
            height: element.height + 'pt',
            transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none'
        }

        switch (element.type) {
            case 'text':
                return (
                    <div 
                        key={element.id}
                        style={style}
                        dangerouslySetInnerHTML={{ __html: element.content }}
                    />
                )
            
            case 'image':
                return (
                    <img
                        key={element.id}
                        src={element.src}
                        alt={element.alt || ''}
                        style={{
                            ...style,
                            objectFit: 'cover'
                        }}
                    />
                )
            
            case 'shape':
                return (
                    <div
                        key={element.id}
                        style={{
                            ...style,
                            backgroundColor: element.fill?.value || 'transparent',
                            border: element.borderWidth ? 
                                `${element.borderWidth}pt ${element.borderType} ${element.borderColor}` : 'none'
                        }}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                )
            
            default:
                return null
        }
    }

    if (loading) {
        return <div>正在解析 PPTX...</div>
    }

    if (!presentation) {
        return (
            <div>
                <h2>PPTX 查看器</h2>
                <input 
                    type="file" 
                    accept=".pptx" 
                    onChange={handleFileUpload}
                />
            </div>
        )
    }

    const slide = presentation.slides[currentSlide]

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                >
                    上一页
                </button>
                <span style={{ margin: '0 20px' }}>
                    {currentSlide + 1} / {presentation.slides.length}
                </span>
                <button 
                    onClick={() => setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === presentation.slides.length - 1}
                >
                    下一页
                </button>
            </div>

            <div 
                style={{
                    position: 'relative',
                    width: presentation.size.width + 'pt',
                    height: presentation.size.height + 'pt',
                    border: '1px solid #ccc',
                    backgroundColor: slide.background?.value || 'white'
                }}
            >
                {slide.elements.map(renderElement)}
            </div>

            {slide.notes && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
                    <h4>演讲者备注:</h4>
                    <p>{slide.notes}</p>
                </div>
            )}
        </div>
    )
}

export default PPTXViewer
```

## Vue.js 集成示例

```vue
<template>
  <div class="pptx-converter">
    <div class="upload-area" @drop="handleDrop" @dragover.prevent>
      <input 
        type="file" 
        ref="fileInput"
        accept=".pptx"
        @change="handleFileSelect"
        style="display: none"
      >
      <button @click="$refs.fileInput.click()">选择 PPTX 文件</button>
      <p>或拖拽文件到这里</p>
    </div>

    <div v-if="loading" class="loading">
      正在解析中...
    </div>

    <div v-if="result" class="result">
      <h3>解析结果</h3>
      <p>幻灯片数量: {{ result.slides.length }}</p>
      <p>尺寸: {{ result.size.width }} x {{ result.size.height }} pt</p>
      
      <div class="slides-grid">
        <div 
          v-for="(slide, index) in result.slides" 
          :key="index"
          class="slide-thumbnail"
        >
          <h4>幻灯片 {{ index + 1 }}</h4>
          <div class="slide-preview">
            <div 
              v-for="element in slide.elements.slice(0, 5)"
              :key="element.id"
              class="element-info"
            >
              {{ element.type }}: {{ element.name || element.id }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { parse } from 'pptxtojson'

export default {
  name: 'PPTXConverter',
  data() {
    return {
      loading: false,
      result: null
    }
  },
  methods: {
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        await this.processFile(file)
      }
    },

    async handleDrop(event) {
      event.preventDefault()
      const files = event.dataTransfer.files
      if (files.length > 0 && files[0].name.endsWith('.pptx')) {
        await this.processFile(files[0])
      }
    },

    async processFile(file) {
      this.loading = true
      try {
        const arrayBuffer = await file.arrayBuffer()
        this.result = await parse(arrayBuffer, {
          imageMode: 'base64',
          includeNotes: true
        })
      } catch (error) {
        console.error('解析失败:', error)
        alert('解析失败: ' + error.message)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #ccc;
  padding: 40px;
  text-align: center;
  margin: 20px 0;
}

.slides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.slide-thumbnail {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}

.element-info {
  padding: 5px;
  background: #f5f5f5;
  margin: 2px 0;
  border-radius: 4px;
  font-size: 12px;
}
</style>
```

## 错误处理和调试

```javascript
import { parse, PPTXParseError } from 'pptxtojson'

async function robustParse(arrayBuffer) {
    try {
        const json = await parse(arrayBuffer, {
            imageMode: 'base64'
        })
        
        // 验证结果
        if (!json.slides || json.slides.length === 0) {
            throw new Error('没有找到有效的幻灯片')
        }
        
        return json
        
    } catch (error) {
        console.error('PPTX 解析错误:', error)
        
        if (error instanceof PPTXParseError) {
            console.error('错误类型:', error.type)
            console.error('错误详情:', error.details)
            
            // 尝试降级处理
            if (error.type === 'IMAGE_PROCESSING_ERROR') {
                console.log('尝试使用 URL 模式重新解析...')
                return await parse(arrayBuffer, {
                    imageMode: 'url'
                })
            }
        }
        
        throw error
    }
}

// 使用示例
try {
    const result = await robustParse(arrayBuffer)
    console.log('解析成功:', result)
} catch (error) {
    console.log('最终解析失败:', error.message)
}
```

## 性能优化

### 大文件处理
```javascript
// 检查文件大小
function checkFileSize(file) {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
        throw new Error(`文件太大: ${(file.size / 1024 / 1024).toFixed(1)}MB，最大支持 50MB`)
    }
}

// 分块处理
async function processLargePPTX(file) {
    checkFileSize(file)
    
    const json = await parse(await file.arrayBuffer(), {
        imageMode: 'url', // 大文件使用 URL 模式
        imageOptimization: {
            maxFileSize: 1024 * 1024, // 1MB
            quality: 70
        }
    })
    
    return json
}
```

### 内存监控
```javascript
function monitorMemoryUsage() {
    if (performance.memory) {
        const memory = performance.memory
        console.log(`内存使用情况:`)
        console.log(`- 已使用: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`)
        console.log(`- 总计: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`)
        console.log(`- 限制: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`)
    }
}

// 在解析前后监控内存
monitorMemoryUsage()
const json = await parse(arrayBuffer)
monitorMemoryUsage()
```