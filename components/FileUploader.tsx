'use client'

import { useRef } from 'react'
import { DiffEditor } from './DiffEditor'

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  loading: boolean
}

export function FileUploader({ onFileUpload, loading }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  const buttonStyle = {
    width: '300px',
    height: '80px',
    backgroundColor: loading ? '#999' : '#d14424',
    color: '#fff',
    borderRadius: '2px',
    lineHeight: '80px',
    fontSize: '18px',
    fontWeight: 700,
    textAlign: 'center' as const,
    cursor: loading ? 'not-allowed' : 'pointer',
    userSelect: 'none' as const,
    border: 'none',
    transition: 'background-color 0.3s ease',
  }

  const spinnerStyle = {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 1s ease-in-out infinite',
    marginRight: '10px',
  }

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          style={buttonStyle}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <span style={spinnerStyle}></span>
              解析中...
            </>
          ) : (
            '点击上传 .pptx 文件'
          )}
        </button>
        
        <input
          ref={inputRef}
          style={{ display: 'none' }}
          type="file"
          accept="application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileChange}
        />
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          支持最大 50MB 的 .pptx 文件
        </div>
        
        <div style={{ marginTop: '20px', width: '300px' }}>
          <DiffEditor />
        </div>
      </div>
    </>
  )
}