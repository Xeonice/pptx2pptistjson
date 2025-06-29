'use client'

import React, { useState } from 'react'
import { FileUploader } from '@/components/FileUploader'
import { JsonViewer } from '@/components/JsonViewer'

export default function Home() {
  const [jsonData, setJsonData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [outputFormat, setOutputFormat] = useState('pptist') // 默认使用 PPTist 格式

  // 页面加载时的调试信息
  React.useEffect(() => {
    console.log('🏠 Home 组件已加载')
    console.log('📍 当前 URL:', window.location.href)
    console.log('🔧 环境检查:', {
      userAgent: navigator.userAgent,
      localStorageAvailable: !!window.localStorage,
      fetchAvailable: !!window.fetch
    })
  }, [])

  const handleFileUpload = async (file: File) => {
    console.log('🔄 开始文件上传处理...', file.name, file.size)
    setLoading(true)
    setCopyMessage('')
    try {
      console.log('📤 创建 FormData...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', outputFormat) // 添加格式参数

      console.log('🌐 发送 API 请求到 /api/parse-pptx...')
      const response = await fetch('/api/parse-pptx', {
        method: 'POST',
        body: formData,
      })

      console.log('📡 API 响应状态:', response.status)
      console.log('📡 API 响应 OK:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API 错误响应:', errorText)
        throw new Error(`Failed to parse PPTX file: ${response.status} ${errorText}`)
      }

      console.log('📥 解析 API 响应...')
      const result = await response.json()
      
      console.log('=== API 调用完成 ===')
      console.log('Response status:', response.status)
      console.log('Full API Response:', result)
      console.log('API Response type:', typeof result)
      console.log('API Response success:', result.success)
      console.log('API Response data:', result.data)
      console.log('API Response data type:', typeof result.data)
      console.log('API Response data keys:', result.data ? Object.keys(result.data) : 'No data')
      console.log('Is data empty?', !result.data || Object.keys(result.data || {}).length === 0)
      
      if (result.data) {
        console.log('✅ 设置 JSON 数据到状态')
        setJsonData(result.data)
      } else {
        console.log('❌ 数据为空，不设置状态')
        alert('API 返回的数据为空，请检查文件格式')
      }
    } catch (error) {
      console.error('💥 文件上传处理错误:', error)
      alert(`解析 PPTX 文件时出错: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
      console.log('🏁 文件上传处理完成')
    }
  }

  const handleCopy = (success: boolean) => {
    if (success) {
      setCopyMessage('✅ JSON 已复制到剪贴板')
    } else {
      setCopyMessage('❌ 复制失败，请重试')
    }
    
    // 3秒后清除消息
    setTimeout(() => {
      setCopyMessage('')
    }, 3000)
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ 
        width: '40%', 
        minWidth: '600px', 
        height: '100%', 
        marginRight: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <FileUploader onFileUpload={handleFileUpload} loading={loading} />
        
        {/* 格式选择器 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>输出格式选择</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="format" 
                value="pptist"
                checked={outputFormat === 'pptist'}
                onChange={(e) => setOutputFormat(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              <span style={{ fontSize: '13px' }}>PPTist 格式 (推荐)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="format" 
                value="legacy"
                checked={outputFormat === 'legacy'}
                onChange={(e) => setOutputFormat(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              <span style={{ fontSize: '13px' }}>传统格式</span>
            </label>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            PPTist 格式: 兼容 PPTist 编辑器的标准格式，包含详细的样式和位置信息<br/>
            传统格式: 原始解析格式，包含基础的元素和主题信息
          </div>
        </div>
        
        {jsonData && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#e8f5e8',
            border: '1px solid #4caf50',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#2e7d32',
            textAlign: 'center',
            maxWidth: '300px',
            fontWeight: '500'
          }}>
            💡 解析完成！可在右侧查看并复制 JSON 数据
          </div>
        )}
        
        {copyMessage && (
          <div 
            className="copy-message"
            style={{
              marginTop: '15px',
              padding: '12px 24px',
              backgroundColor: copyMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: copyMessage.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${copyMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center',
              maxWidth: '320px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {copyMessage}
          </div>
        )}
        
        <div style={{ display: 'flex', marginTop: '20px' }}>
          <a 
            target="_blank" 
            href="https://github.com/pipipi-pikachu/pptx2json" 
            rel="noopener noreferrer"
            style={{ padding: '5px 10px', color: '#d14424', textDecoration: 'none' }}
          >
            Github 仓库
          </a>
          <a 
            target="_blank" 
            href="https://pipipi-pikachu.github.io/PPTist/" 
            rel="noopener noreferrer"
            style={{ padding: '5px 10px', color: '#d14424', textDecoration: 'none' }}
          >
            在 PPTist 中测试
          </a>
          <a 
            href="/api-docs"
            style={{ padding: '5px 10px', color: '#d14424', textDecoration: 'none' }}
          >
            API 文档
          </a>
          <a 
            href="/json-diff"
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '5px 10px', color: '#d14424', textDecoration: 'none' }}
          >
            JSON 对比
          </a>
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        height: '100%', 
        padding: '10px', 
        borderLeft: '1px solid #ddd' 
      }}>
        <JsonViewer 
          data={jsonData} 
          onCopy={handleCopy} 
        />
      </div>
    </div>
  )
}