"use client";

import { useState } from "react";
import JsonView from "@uiw/react-json-view";

interface JsonViewerProps {
  data: any;
  onCopy?: (success: boolean) => void;
  onTestData?: (data: any) => void;
}

export function JsonViewer({ data, onCopy, onTestData }: JsonViewerProps) {
  const [copying, setCopying] = useState(false);

  const handleCopyJson = async () => {
    if (!data) return;

    setCopying(true);
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      onCopy?.(true);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      onCopy?.(false);
    } finally {
      setCopying(false);
    }
  };

  const containerStyle = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "#ffffff",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e1e5e9",
    background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const titleStyle = {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#333",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const copyButtonStyle = {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: copying ? "#6c757d" : "#d14424",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: copying ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500" as const,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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

  const jsonViewerStyle = {
    flex: 1,
    padding: "16px",
    overflow: "auto",
    backgroundColor: "#ffffff",
  };

  const statsStyle = {
    padding: "12px 16px",
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e1e5e9",
    fontSize: "13px",
    color: "#666",
    display: "flex",
    gap: "20px",
    flexWrap: "wrap" as const,
  };

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={emptyStateStyle}>
          <div>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              上传 PPTX 文件查看解析结果
            </div>
            <div style={{ color: "#666" }}>支持查看、搜索和复制 JSON 数据</div>
          </div>

          <button
            onClick={() => {
              const testData = {
                test: true,
                message: "这是测试数据展示",
                timestamp: new Date().toISOString(),
                slides: [
                  {
                    fill: { type: "color", value: "#ffffff" },
                    elements: [
                      {
                        type: "text",
                        content: "欢迎使用 PPTX 解析器",
                        x: 100,
                        y: 50,
                        width: 500,
                        height: 60,
                        fontFamily: "微软雅黑",
                        fontSize: 24,
                        fontColor: "#333333",
                      },
                      {
                        type: "shape",
                        name: "标题背景",
                        shapType: "rect",
                        x: 80,
                        y: 40,
                        width: 540,
                        height: 80,
                        fill: { type: "color", value: "#f0f8ff" },
                      },
                    ],
                    layoutElements: [],
                    note: "这是测试幻灯片的备注",
                    slideName: "slide1.xml",
                    elementCount: 2,
                  },
                  {
                    fill: { type: "color", value: "#ffffff" },
                    elements: [
                      {
                        type: "text",
                        content:
                          "功能特性：\n• 解析 PPTX 文件结构\n• 提取文本和形状信息\n• 支持主题颜色获取\n• JSON 格式化显示",
                        x: 50,
                        y: 100,
                        width: 620,
                        height: 300,
                        fontFamily: "微软雅黑",
                        fontSize: 16,
                        fontColor: "#555555",
                      },
                      {
                        type: "shape",
                        name: "内容区域",
                        shapType: "roundRect",
                        x: 30,
                        y: 80,
                        width: 660,
                        height: 360,
                        fill: {
                          type: "gradient",
                          value: {
                            path: "line",
                            rot: 45,
                            colors: [
                              { pos: "0%", color: "#e3f2fd" },
                              { pos: "100%", color: "#ffffff" },
                            ],
                          },
                        },
                      },
                    ],
                    layoutElements: [],
                    note: "功能介绍页面",
                    slideName: "slide2.xml",
                    elementCount: 2,
                  },
                ],
                themeColors: [
                  "#1976d2",
                  "#388e3c",
                  "#f57c00",
                  "#d81b60",
                  "#7b1fa2",
                  "#303f9f",
                ],
                size: { width: 720, height: 540 },
              };

              console.log("🧪 加载测试数据:", testData);
              onTestData?.(testData);
            }}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#218838";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#28a745";
            }}
          >
            🧪 加载测试数据
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header with title and copy button */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>📄 JSON 解析结果</h3>
        <button
          style={copyButtonStyle}
          onClick={handleCopyJson}
          disabled={copying}
          title={copying ? "复制中..." : "复制 JSON 到剪贴板"}
          onMouseOver={(e) =>
            !copying && (e.currentTarget.style.backgroundColor = "#b8381f")
          }
          onMouseOut={(e) =>
            !copying && (e.currentTarget.style.backgroundColor = "#d14424")
          }
        >
          {copying ? "⏳ 复制中..." : "📋 复制 JSON"}
        </button>
      </div>

      {/* JSON Viewer */}
      <div style={jsonViewerStyle}>
        <JsonView
          value={data}
          style={{
            backgroundColor: "#ffffff",
            fontSize: "13px",
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          }}
          enableClipboard={false}
          displayDataTypes={true}
          displayObjectSize={true}
          indentWidth={12}
          collapsed={2}
          shortenTextAfterLength={100}
        />
      </div>

      {/* Statistics footer */}
      <div style={statsStyle}>
        <span>
          <strong>数据统计:</strong>
        </span>
        <span>📊 幻灯片: {data?.slides?.length || 0} 个</span>
        <span>🎨 主题颜色: {data?.themeColors?.length || 0} 个</span>
        <span>
          📏 尺寸:{" "}
          {data?.size ? `${data.size.width} × ${data.size.height}` : "未知"}
        </span>
        <span>💾 数据大小: {JSON.stringify(data).length} 字符</span>
      </div>
    </div>
  );
}
