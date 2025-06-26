'use client';

import { useState } from 'react';

export default function TestPosition() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', 'legacy');

    try {
      const response = await fetch('/api/parse-pptx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const analyzePositions = () => {
    if (!result?.data?.slides) return null;

    let zeroCount = 0;
    let nonZeroCount = 0;
    const examples: any[] = [];

    result.data.slides.forEach((slide: any, slideIdx: number) => {
      slide.elements?.forEach((element: any, elemIdx: number) => {
        if (element.left === 0 && element.top === 0) {
          zeroCount++;
          if (examples.length < 5) {
            examples.push({
              slideIndex: slideIdx + 1,
              elementIndex: elemIdx + 1,
              ...element
            });
          }
        } else {
          nonZeroCount++;
        }
      });
    });

    return {
      zeroCount,
      nonZeroCount,
      percentage: ((zeroCount / (zeroCount + nonZeroCount)) * 100).toFixed(2),
      examples
    };
  };

  const analysis = analyzePositions();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">测试 PPTX 位置解析</h1>
      
      <div className="mb-6">
        <input
          type="file"
          accept=".pptx"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {loading && <p className="text-blue-600">正在解析文件...</p>}
      {error && <p className="text-red-600">错误: {error}</p>}

      {result && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">解析结果概览</h2>
            <p>文件名: {result.filename}</p>
            <p>文件大小: {(result.debug.fileSize / 1024).toFixed(2)} KB</p>
            <p>幻灯片数量: {result.data?.slides?.length || 0}</p>
          </div>

          {analysis && (
            <div className="bg-yellow-50 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">位置分析</h2>
              <p>零位置元素: {analysis.zeroCount} 个</p>
              <p>非零位置元素: {analysis.nonZeroCount} 个</p>
              <p>零位置比例: {analysis.percentage}%</p>
              
              {analysis.examples.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold">零位置元素示例:</h3>
                  {analysis.examples.map((ex, idx) => (
                    <div key={idx} className="mt-2 p-2 bg-white rounded text-sm">
                      <p>幻灯片 {ex.slideIndex}, 元素 {ex.elementIndex}</p>
                      <p>类型: {ex.type}, 名称: {ex.name}</p>
                      <p>位置: left={ex.left}, top={ex.top}</p>
                      <p>尺寸: width={ex.width}, height={ex.height}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.data?.slides?.[0]?.elements && (
            <div className="bg-blue-50 p-4 rounded">
              <h2 className="text-lg font-semibold mb-2">第一个幻灯片的前5个元素</h2>
              {result.data.slides[0].elements.slice(0, 5).map((el: any, idx: number) => (
                <div key={idx} className="mt-2 p-2 bg-white rounded text-sm">
                  <p className="font-semibold">元素 {idx + 1}: {el.type}</p>
                  <p>名称: {el.name || 'N/A'}</p>
                  <p className={el.left === 0 && el.top === 0 ? 'text-red-600 font-bold' : ''}>
                    位置: left={el.left}, top={el.top}
                  </p>
                  <p>尺寸: width={el.width}, height={el.height}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}