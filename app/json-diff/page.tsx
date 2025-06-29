"use client";

import React, { useState, useRef } from "react";
import { Editor, DiffEditor } from "@monaco-editor/react";
import { FileJson, Copy, Check, RotateCcw, Download } from "lucide-react";

export default function JsonDiffPage() {
  const [leftJson, setLeftJson] = useState("");
  const [rightJson, setRightJson] = useState("");
  const [viewMode, setViewMode] = useState<"split" | "diff">("diff");
  const [copiedSide, setCopiedSide] = useState<"left" | "right" | null>(null);
  const diffEditorRef = useRef<any>(null);
  const leftEditorRef = useRef<any>(null);
  const rightEditorRef = useRef<any>(null);

  // 格式化 JSON
  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, side: "left" | "right") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSide(side);
      setTimeout(() => setCopiedSide(null), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 格式化当前编辑器内容
  const formatCurrentJson = (side: "left" | "right") => {
    const editor =
      side === "left" ? leftEditorRef.current : rightEditorRef.current;
    if (editor) {
      const value = editor.getValue();
      const formatted = formatJson(value);
      editor.setValue(formatted);
      if (side === "left") {
        setLeftJson(formatted);
      } else {
        setRightJson(formatted);
      }
    }
  };

  // 加载示例数据
  const loadExample = () => {
    const example1 = {
      slides: [
        {
          id: "slide1",
          title: "第一页",
          elements: [
            {
              type: "text",
              content: "标题内容",
              style: {
                fontSize: 24,
                color: "#333333",
              },
            },
          ],
          background: {
            type: "solid",
            color: "#ffffff",
          },
        },
      ],
      theme: {
        name: "默认主题",
        colors: {
          primary: "#007acc",
          secondary: "#666666",
        },
      },
    };

    const example2 = {
      slides: [
        {
          id: "slide1",
          title: "第一页 - 已更新",
          elements: [
            {
              type: "text",
              content: "更新后的标题内容",
              style: {
                fontSize: 28,
                color: "#000000",
                fontWeight: "bold",
              },
            },
            {
              type: "image",
              src: "example.jpg",
              width: 200,
              height: 150,
            },
          ],
          background: {
            type: "gradient",
            colors: ["#ffffff", "#f0f0f0"],
          },
        },
        {
          id: "slide2",
          title: "第二页",
          elements: [],
        },
      ],
      theme: {
        name: "新主题",
        colors: {
          primary: "#ff6b35",
          secondary: "#004643",
          accent: "#f9bc60",
        },
        fonts: {
          primary: "Arial",
          secondary: "Helvetica",
        },
      },
    };

    const formatted1 = JSON.stringify(example1, null, 2);
    const formatted2 = JSON.stringify(example2, null, 2);

    setLeftJson(formatted1);
    setRightJson(formatted2);
  };

  // 清空内容
  const clearContent = () => {
    setLeftJson("");
    setRightJson("");
  };

  // 导出差异报告
  const exportDiff = () => {
    const report = `JSON 差异对比报告
生成时间: ${new Date().toLocaleString()}

=== 原始 JSON ===
${leftJson}

=== 新版 JSON ===
${rightJson}
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "json-diff-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-3">
          <FileJson className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold">JSON 对比工具</h1>
          <span className="text-sm text-gray-500">基于 Monaco Editor</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 视图模式切换 */}
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode("diff")}
              className={`px-3 py-1 text-sm ${
                viewMode === "diff"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              差异视图
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 text-sm ${
                viewMode === "split"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              分屏视图
            </button>
          </div>

          <button
            onClick={loadExample}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <FileJson size={16} />
            加载示例
          </button>

          <button
            onClick={clearContent}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            清空
          </button>

          <button
            onClick={exportDiff}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
          >
            <Download size={16} />
            导出
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            返回首页
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex">
        {viewMode === "diff" ? (
          // 差异视图模式
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-700">JSON 差异对比</h3>
              <div className="text-xs text-gray-500">
                左侧: 原始版本 | 右侧: 新版本
              </div>
            </div>
            <div className="flex-1">
              <DiffEditor
                height="100%"
                language="json"
                original={leftJson}
                modified={rightJson}
                onMount={(editor) => {
                  diffEditorRef.current = editor;

                  // 配置编辑器选项
                  editor.updateOptions({
                    readOnly: false,
                    renderSideBySide: true,
                    ignoreTrimWhitespace: false,
                    renderIndicators: true,
                    originalEditable: true,
                  });
                }}
                options={{
                  fontSize: 14,
                  wordWrap: "on",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>
        ) : (
          // 分屏视图模式
          <>
            {/* 左侧编辑器 */}
            <div className="flex-1 flex flex-col border-r">
              <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-700">原始 JSON</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => formatCurrentJson("left")}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    格式化
                  </button>
                  <button
                    onClick={() => copyToClipboard(leftJson, "left")}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="复制"
                  >
                    {copiedSide === "left" ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language="json"
                  value={leftJson}
                  onChange={(value) => setLeftJson(value || "")}
                  onMount={(editor) => {
                    leftEditorRef.current = editor;
                  }}
                  options={{
                    fontSize: 14,
                    wordWrap: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
            </div>

            {/* 右侧编辑器 */}
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-700">新版 JSON</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => formatCurrentJson("right")}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    格式化
                  </button>
                  <button
                    onClick={() => copyToClipboard(rightJson, "right")}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="复制"
                  >
                    {copiedSide === "right" ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language="json"
                  value={rightJson}
                  onChange={(value) => setRightJson(value || "")}
                  onMount={(editor) => {
                    rightEditorRef.current = editor;
                  }}
                  options={{
                    fontSize: 14,
                    wordWrap: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-gray-100 border-t px-4 py-2 text-xs text-gray-600 flex justify-between">
        <div>
          左侧: {leftJson.length} 字符 | 右侧: {rightJson.length} 字符
        </div>
        <div className="flex items-center gap-4">
          <span>
            Monaco Editor v
            {process.env.NODE_ENV === "development" ? "dev" : "prod"}
          </span>
          <span>支持语法高亮、自动完成、格式化</span>
        </div>
      </div>
    </div>
  );
}
