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
                    imageMode: 'base64',
                    enableDebugMode: true,
                    debugOptions: {
                        enableConsoleLogging: true,
                        logLevel: 'info'
                    }
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

## 新功能示例

### 1. 调试模式使用

```javascript
// 启用完整调试模式
const json = await parse(arrayBuffer, {
    imageMode: 'base64',
    enableDebugMode: true,
    debugOptions: {
        saveDebugImages: true,
        enableConsoleLogging: true,
        enableTimingLogs: true,
        logLevel: 'debug',
        debugImagePath: './debug-output'
    }
})

// 检查调试信息
console.log('转换统计:', json.debugInfo)
console.log('处理时间:', json.processingTime)
```

### 2. PowerPoint拉伸偏移处理

```javascript
// 解析包含拉伸图片的PPTX
const json = await parse(arrayBuffer, {
    imageMode: 'base64',
    enableStretchProcessing: true,
    enableImageOffsetAdjustment: true
})

// 处理拉伸信息
json.slides.forEach((slide, slideIndex) => {
    slide.elements.forEach((element, elementIndex) => {
        if (element.type === 'image' && element.stretchInfo) {
            console.log(`幻灯片 ${slideIndex + 1}, 图片 ${elementIndex + 1}:`)
            console.log('- 拉伸信息:', element.stretchInfo.fillRect)
            console.log('- 偏移信息:', element.offsetInfo)
            console.log('- 原始位置:', element.offsetInfo?.originalPosition)
            console.log('- 调整后位置:', element.offsetInfo?.convertedPosition)
        }
    })
})
```

### 3. Node.js环境下的Sharp处理

```javascript
import { parse } from 'pptxtojson'
import { PPTXImageProcessor } from 'pptxtojson/processors'

// 检查Sharp可用性
const processor = new PPTXImageProcessor()

if (processor.isAvailable()) {
    console.log('✅ Sharp可用，启用高级图片处理')
    
    const json = await parse(arrayBuffer, {
        imageMode: 'base64',
        enableStretchProcessing: true,
        enableDebugMode: true,
        debugOptions: {
            saveDebugImages: true,
            enableTimingLogs: true
        }
    })
    
    console.log('🖼️ 生成的调试图片保存在:', './debug-images/')
} else {
    console.log('⚠️ Sharp不可用，使用JavaScript降级处理')
    
    const json = await parse(arrayBuffer, {
        imageMode: 'url',
        enableStretchProcessing: false
    })
}
```

### 4. 错误处理和重试机制

```javascript
async function robustParse(arrayBuffer, maxRetries = 3) {
    const strategies = [
        // 策略1: 完整功能
        {
            imageMode: 'base64',
            enableStretchProcessing: true,
            enableDebugMode: true
        },
        // 策略2: 禁用拉伸处理
        {
            imageMode: 'base64',
            enableStretchProcessing: false,
            enableDebugMode: true
        },
        // 策略3: URL模式降级
        {
            imageMode: 'url',
            enableStretchProcessing: false,
            enableDebugMode: false
        }
    ]
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            console.log(`尝试策略 ${i + 1}...`)
            const result = await parse(arrayBuffer, strategies[i])
            console.log(`✅ 策略 ${i + 1} 成功`)
            return result
        } catch (error) {
            console.log(`❌ 策略 ${i + 1} 失败:`, error.message)
            
            if (i === strategies.length - 1) {
                throw new Error(`所有策略都失败了，最后错误: ${error.message}`)
            }
        }
    }
}

// 使用示例
try {
    const result = await robustParse(arrayBuffer)
    console.log('解析成功!')
} catch (error) {
    console.error('最终失败:', error.message)
}
```

### 5. 性能监控

```javascript
async function parseWithMonitoring(arrayBuffer) {
    const startTime = Date.now()
    const initialMemory = process.memoryUsage?.() || { heapUsed: 0 }
    
    try {
        const json = await parse(arrayBuffer, {
            imageMode: 'base64',
            enableStretchProcessing: true,
            debugOptions: {
                enableTimingLogs: true,
                logLevel: 'info'
            }
        })
        
        const endTime = Date.now()
        const finalMemory = process.memoryUsage?.() || { heapUsed: 0 }
        
        console.log('📊 性能统计:')
        console.log(`- 总耗时: ${endTime - startTime}ms`)
        console.log(`- 内存增长: ${Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024)}MB`)
        console.log(`- 幻灯片数量: ${json.slides.length}`)
        console.log(`- 图片元素: ${json.slides.reduce((count, slide) => 
            count + slide.elements.filter(el => el.type === 'image').length, 0)}`)
        
        return json
    } catch (error) {
        console.error('性能监控中出现错误:', error)
        throw error
    }
}
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
                imageMode: 'base64',
                enableStretchProcessing: true,
                enableDebugMode: true,
                debugOptions: {
                    enableConsoleLogging: true,
                    logLevel: 'info'
                }
            })
            setPresentation(json)
            setCurrentSlide(0)
            
            // 显示解析统计信息
            const imageCount = json.slides.reduce((count, slide) => 
                count + slide.elements.filter(el => el.type === 'image').length, 0)
            console.log(`✅ 解析完成: ${json.slides.length}张幻灯片, ${imageCount}个图片元素`)
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
          includeNotes: true,
          enableStretchProcessing: true,
          enableDebugMode: true,
          debugOptions: {
            enableConsoleLogging: true,
            logLevel: 'info'
          }
        })
        
        // 显示解析统计
        const stats = {
          slides: this.result.slides.length,
          images: this.result.slides.reduce((count, slide) => 
            count + slide.elements.filter(el => el.type === 'image').length, 0),
          shapes: this.result.slides.reduce((count, slide) => 
            count + slide.elements.filter(el => el.type === 'shape').length, 0)
        }
        console.log('📊 解析统计:', stats)
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

### 1. 渐进式降级策略

```javascript
import { parse, PPTXParseError } from 'pptxtojson'

async function robustParse(arrayBuffer) {
    const strategies = [
        // 策略1: 完整功能
        {
            name: '完整功能模式',
            options: {
                imageMode: 'base64',
                enableStretchProcessing: true,
                enableImageOffsetAdjustment: true,
                enableDebugMode: true,
                debugOptions: {
                    enableConsoleLogging: true,
                    logLevel: 'info'
                }
            }
        },
        // 策略2: 禁用拉伸处理
        {
            name: '禁用拉伸处理模式',
            options: {
                imageMode: 'base64',
                enableStretchProcessing: false,
                enableImageOffsetAdjustment: true,
                enableDebugMode: true
            }
        },
        // 策略3: URL模式
        {
            name: 'URL模式',
            options: {
                imageMode: 'url',
                enableStretchProcessing: false,
                enableImageOffsetAdjustment: false,
                enableDebugMode: false
            }
        },
        // 策略4: 最小化模式
        {
            name: '最小化模式',
            options: {
                imageMode: 'url',
                includeNotes: false,
                includeMaster: false
            }
        }
    ]
    
    for (const strategy of strategies) {
        try {
            console.log(`🔄 尝试${strategy.name}...`)
            const result = await parse(arrayBuffer, strategy.options)
            
            // 验证结果
            if (!result.slides || result.slides.length === 0) {
                throw new Error('没有找到有效的幻灯片')
            }
            
            console.log(`✅ ${strategy.name}成功`)
            return result
            
        } catch (error) {
            console.log(`❌ ${strategy.name}失败:`, error.message)
            
            if (error instanceof PPTXParseError) {
                console.error('错误类型:', error.type)
                console.error('错误详情:', error.details)
            }
        }
    }
    
    throw new Error('所有解析策略都失败了')
}

// 使用示例
try {
    const result = await robustParse(arrayBuffer)
    console.log('解析成功:', result)
} catch (error) {
    console.log('最终解析失败:', error.message)
}
```

### 2. 调试信息收集

```javascript
async function parseWithDebugging(arrayBuffer, filename = 'unknown.pptx') {
    const debugInfo = {
        filename,
        fileSize: arrayBuffer.byteLength,
        startTime: Date.now(),
        attempts: []
    }
    
    try {
        const json = await parse(arrayBuffer, {
            imageMode: 'base64',
            enableDebugMode: true,
            debugOptions: {
                saveDebugImages: true,
                enableConsoleLogging: true,
                enableTimingLogs: true,
                logLevel: 'debug'
            }
        })
        
        debugInfo.success = true
        debugInfo.endTime = Date.now()
        debugInfo.duration = debugInfo.endTime - debugInfo.startTime
        debugInfo.slideCount = json.slides.length
        debugInfo.elementCounts = {
            total: json.slides.reduce((count, slide) => count + slide.elements.length, 0),
            images: json.slides.reduce((count, slide) => 
                count + slide.elements.filter(el => el.type === 'image').length, 0),
            shapes: json.slides.reduce((count, slide) => 
                count + slide.elements.filter(el => el.type === 'shape').length, 0),
            texts: json.slides.reduce((count, slide) => 
                count + slide.elements.filter(el => el.type === 'text').length, 0)
        }
        
        console.log('🐛 调试信息:', debugInfo)
        return json
        
    } catch (error) {
        debugInfo.success = false
        debugInfo.error = {
            message: error.message,
            type: error.constructor.name,
            stack: error.stack
        }
        
        console.error('🐛 调试信息（失败）:', debugInfo)
        throw error
    }
}
```

### 3. 内存和性能监控

```javascript
async function parseWithMonitoring(arrayBuffer) {
    // 监控开始状态
    const initialMemory = process.memoryUsage?.() || {}
    const startTime = process.hrtime?.() || [0, 0]
    
    console.log('📊 开始监控...')
    console.log('初始内存:', {
        heap: Math.round(initialMemory.heapUsed / 1024 / 1024) + 'MB',
        rss: Math.round(initialMemory.rss / 1024 / 1024) + 'MB'
    })
    
    try {
        const json = await parse(arrayBuffer, {
            imageMode: 'base64',
            enableStretchProcessing: true,
            enableDebugMode: true,
            debugOptions: {
                enableTimingLogs: true,
                logLevel: 'info'
            }
        })
        
        // 监控结束状态
        const finalMemory = process.memoryUsage?.() || {}
        const endTime = process.hrtime?.(startTime) || [0, 0]
        
        const stats = {
            duration: endTime[0] * 1000 + endTime[1] / 1000000, // ms
            memoryUsage: {
                initial: Math.round(initialMemory.heapUsed / 1024 / 1024),
                final: Math.round(finalMemory.heapUsed / 1024 / 1024),
                delta: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024)
            },
            output: {
                slides: json.slides.length,
                elements: json.slides.reduce((count, slide) => count + slide.elements.length, 0),
                sizeMB: new Blob([JSON.stringify(json)]).size / 1024 / 1024
            }
        }
        
        console.log('📊 性能统计:', stats)
        
        // 性能警告
        if (stats.duration > 10000) {
            console.warn('⚠️ 处理时间超过10秒，建议优化')
        }
        if (stats.memoryUsage.delta > 500) {
            console.warn('⚠️ 内存增长超过500MB，建议使用URL模式')
        }
        
        return json
        
    } catch (error) {
        console.error('📊 性能监控中出现错误:', error)
        throw error
    }
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