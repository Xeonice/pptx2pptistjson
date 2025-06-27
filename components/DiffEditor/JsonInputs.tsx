"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactDiffViewer from "react-diff-viewer-continued"

interface JsonInputsProps {
  leftJson: string
  rightJson: string
  onLeftChange: (value: string) => void
  onRightChange: (value: string) => void
}

export function JsonInputs({
  leftJson,
  rightJson,
  onLeftChange,
  onRightChange,
}: JsonInputsProps) {
  const [showDiff, setShowDiff] = useState(false)

  // Format JSON for better display
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }

  const formattedLeft = useMemo(() => formatJson(leftJson), [leftJson])
  const formattedRight = useMemo(() => formatJson(rightJson), [rightJson])

  const handleFormatLeft = () => {
    onLeftChange(formattedLeft)
  }

  const handleFormatRight = () => {
    onRightChange(formattedRight)
  }

  if (showDiff) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">对比结果</h3>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDiff(false)}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回编辑
          </Button>
        </div>
        <div className="flex-1 overflow-auto border rounded-lg shadow-inner bg-white">
          <ReactDiffViewer
            oldValue={formattedLeft}
            newValue={formattedRight}
            splitView={true}
            leftTitle="JSON 1"
            rightTitle="JSON 2"
            hideLineNumbers={false}
            showDiffOnly={false}
            useDarkTheme={false}
            styles={{
              variables: {
                dark: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#374151',
                  addedBackground: '#dcfce7',
                  addedColor: '#166534',
                  removedBackground: '#fee2e2',
                  removedColor: '#991b1b',
                  wordAddedBackground: '#22c55e',
                  wordRemovedBackground: '#ef4444',
                  addedGutterBackground: '#bbf7d0',
                  removedGutterBackground: '#fecaca',
                  gutterBackground: '#f9fafb',
                  gutterBackgroundDark: '#f3f4f6',
                  highlightBackground: '#fef3c7',
                  highlightGutterBackground: '#fde68a',
                },
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#374151',
                  addedBackground: '#dcfce7',
                  addedColor: '#166534',
                  removedBackground: '#fee2e2',
                  removedColor: '#991b1b',
                  wordAddedBackground: '#22c55e',
                  wordRemovedBackground: '#ef4444',
                  addedGutterBackground: '#bbf7d0',
                  removedGutterBackground: '#fecaca',
                  gutterBackground: '#f9fafb',
                  gutterBackgroundDark: '#f3f4f6',
                  highlightBackground: '#fef3c7',
                  highlightGutterBackground: '#fde68a',
                }
              },
              line: {
                padding: '10px 2px',
                '&:hover': {
                  backgroundColor: '#f8fafc !important',
                }
              },
              gutter: {
                padding: '10px 8px',
                minWidth: '50px',
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">输入 JSON 数据</h3>
        </div>
        <Button
          onClick={() => setShowDiff(true)}
          disabled={!leftJson.trim() || !rightJson.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-6 py-2 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          开始对比
        </Button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-6">
        <div className="flex flex-col bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-xs">1</span>
              </div>
              <label className="text-sm font-semibold text-gray-700">JSON 1</label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatLeft}
              disabled={!leftJson.trim()}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs px-3 py-1"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              格式化
            </Button>
          </div>
          <Textarea
            placeholder="粘贴第一个 JSON 数据..."
            value={leftJson}
            onChange={(e) => onLeftChange(e.target.value)}
            className="flex-1 font-mono text-sm bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors"
            style={{ minHeight: '420px' }}
          />
        </div>
        <div className="flex flex-col bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">2</span>
              </div>
              <label className="text-sm font-semibold text-gray-700">JSON 2</label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatRight}
              disabled={!rightJson.trim()}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-3 py-1"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              格式化
            </Button>
          </div>
          <Textarea
            placeholder="粘贴第二个 JSON 数据..."
            value={rightJson}
            onChange={(e) => onRightChange(e.target.value)}
            className="flex-1 font-mono text-sm bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
            style={{ minHeight: '420px' }}
          />
        </div>
      </div>
    </div>
  )
}