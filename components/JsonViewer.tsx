"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// 动态导入Monaco Editor组件，禁用SSR
const MonacoJsonEditor = dynamic(() => import('./MonacoJsonEditor').then(mod => ({ default: mod.MonacoJsonEditor })), {
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

interface JsonViewerProps {
  data: any;
  onCopy?: (success: boolean) => void;
}

export function JsonViewer({ data, onCopy }: JsonViewerProps) {
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);


  const containerStyle = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "#ffffff",
  };

  const emptyStateStyle = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: "16px",
    textAlign: "center" as const,
    lineHeight: "1.5",
    flexDirection: "column" as const,
    gap: "20px",
  };

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e1e5e9',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
            🖥️ Monaco JSON Editor
          </h3>
        </div>

        <div style={emptyStateStyle}>
          <div>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🖥️</div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              上传 PPTX 文件查看解析结果
            </div>
            <div style={{ color: "#666" }}>
              支持代码高亮、搜索、格式化和快捷键操作
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 直接使用Monaco Editor
  return (
    <div style={containerStyle}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e1e5e9',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          🖥️ Monaco JSON Editor
        </h3>
      </div>
      
      {isClient ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MonacoJsonEditor 
            data={data} 
            onCopy={onCopy}
            height="100%"
            readOnly={true}
            theme="light"
          />
        </div>
      ) : (
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
      )}
    </div>
  );
}
