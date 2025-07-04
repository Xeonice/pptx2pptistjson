"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { editor, KeyMod, KeyCode } from 'monaco-editor';

// 动态导入Monaco Editor，禁用SSR
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      color: '#666',
      fontSize: '14px',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ fontSize: '24px' }}>⚡</div>
      <div>正在加载 Monaco Editor...</div>
    </div>
  )
});

interface MonacoJsonEditorProps {
  data: any;
  onCopy?: (success: boolean) => void;
  height?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
}

export function MonacoJsonEditor({ 
  data, 
  onCopy, 
  height = '100%',
  readOnly = true,
  theme = 'light'
}: MonacoJsonEditorProps) {
  const [copying, setCopying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 格式化JSON数据
  const formatJson = (jsonData: any): string => {
    try {
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.error('Failed to format JSON:', error);
      return 'Error: Invalid JSON data';
    }
  };

  // 复制JSON内容
  const handleCopyJson = async () => {
    if (!data) return;

    setCopying(true);
    try {
      const jsonString = formatJson(data);
      await navigator.clipboard.writeText(jsonString);
      onCopy?.(true);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      onCopy?.(false);
    } finally {
      setCopying(false);
    }
  };

  // 格式化JSON (美化)
  const handleFormatJson = () => {
    if (editorRef.current && data) {
      const formattedJson = formatJson(data);
      editorRef.current.setValue(formattedJson);
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // 搜索功能
  const handleSearch = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.find')?.run();
    }
  };

  // 折叠/展开所有
  const handleFoldAll = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.foldAll')?.run();
    }
  };

  const handleUnfoldAll = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.unfoldAll')?.run();
    }
  };

  // 编辑器配置
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    minimap: { enabled: true },
    fontSize: 13,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'line',
    selectionHighlight: false,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  };

  // 处理编辑器挂载
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // 设置键盘快捷键
    editor.addCommand(
      KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF,
      () => handleSearch()
    );

    editor.addCommand(
      KeyMod.CtrlCmd | KeyCode.KeyK,
      () => handleFoldAll()
    );

    // 初始时折叠到第2级
    setTimeout(() => {
      editor.getAction('editor.foldLevel2')?.run();
    }, 100);
  };

  const containerStyle: React.CSSProperties = {
    height,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e1e5e9',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#333',
    border: '1px solid #d0d7de',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: copying ? '#6c757d' : '#d14424',
    color: 'white',
    border: '1px solid transparent',
    cursor: copying ? 'not-allowed' : 'pointer',
  };

  const editorContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
  };

  const statsStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e1e5e9',
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  };

  // 服务端渲染或客户端未初始化时显示加载状态
  if (!isClient) {
    return (
      <div style={containerStyle}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '14px',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>⚡</div>
          <div>正在初始化 Monaco Editor...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '16px',
          textAlign: 'center',
          lineHeight: '1.5',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Monaco Editor JSON 查看器
            </div>
            <div style={{ color: '#666' }}>上传 PPTX 文件查看解析结果</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header with title and toolbar */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          🖥️ Monaco JSON Editor
        </h3>
        <div style={toolbarStyle}>
          <button
            style={buttonStyle}
            onClick={handleFormatJson}
            title="格式化 JSON (Ctrl+Shift+I)"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            ✨ 格式化
          </button>
          
          <button
            style={buttonStyle}
            onClick={handleSearch}
            title="搜索 (Ctrl+Shift+F)"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            🔍 搜索
          </button>

          <button
            style={buttonStyle}
            onClick={handleFoldAll}
            title="折叠所有"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            📁 折叠
          </button>

          <button
            style={buttonStyle}
            onClick={handleUnfoldAll}
            title="展开所有"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            📂 展开
          </button>

          <button
            style={primaryButtonStyle}
            onClick={handleCopyJson}
            disabled={copying}
            title={copying ? "复制中..." : "复制 JSON 到剪贴板"}
            onMouseOver={(e) =>
              !copying && (e.currentTarget.style.backgroundColor = '#b8381f')
            }
            onMouseOut={(e) =>
              !copying && (e.currentTarget.style.backgroundColor = '#d14424')
            }
          >
            {copying ? '⏳ 复制中...' : '📋 复制'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={editorContainerStyle}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={formatJson(data)}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={editorOptions}
          onMount={handleEditorDidMount}
          loading={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              fontSize: '14px'
            }}>
              🔄 加载 Monaco Editor...
            </div>
          }
        />
      </div>

      {/* Statistics footer */}
      <div style={statsStyle}>
        <span><strong>📊 数据统计:</strong></span>
        <span>幻灯片: {data?.slides?.length || 0} 个</span>
        <span>主题颜色: {data?.themeColors?.length || 0} 个</span>
        <span>
          尺寸: {data?.size ? `${data.size.width} × ${data.size.height}` : '未知'}
        </span>
        <span>字符数: {(() => {
          try {
            return JSON.stringify(data).length.toLocaleString();
          } catch (error) {
            return '无法计算';
          }
        })()}</span>
        <span>大小: {(() => {
          try {
            return (JSON.stringify(data).length / 1024).toFixed(1) + ' KB';
          } catch (error) {
            return '无法计算';
          }
        })()}</span>
      </div>
    </div>
  );
}