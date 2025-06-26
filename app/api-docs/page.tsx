export default function ApiDocs() {
  return (
    <div className="docs-container">
      <div className="docs-header">
        <h1>PPTX to JSON API 文档</h1>
        <p>PowerPoint 文件解析 REST API 接口文档</p>
      </div>

      <div className="docs-section">
        <h2>概述</h2>
        <p>
          本 API 提供将 PowerPoint (.pptx) 文件转换为 JSON 格式的服务。
          支持上传文件解析、在线预览和下载转换结果。
        </p>
      </div>

      <div className="docs-section">
        <h2>API 端点</h2>

        <div className="api-endpoint">
          <h3>
            <span className="method-badge">POST</span>
            <span className="api-url">/api/parse-pptx</span>
          </h3>
          <p><strong>描述：</strong>上传并解析 PPTX 文件，返回 JSON 数据</p>
          
          <h4>请求参数</h4>
          <div className="parameter-item">
            <div className="parameter-name">file <span className="parameter-type">(FormData)</span></div>
            <div>要解析的 .pptx 文件，最大 50MB</div>
          </div>

          <h4>响应示例</h4>
          <div className="code-block">
{`{
  "success": true,
  "data": {
    "slides": [...],
    "theme": {...},
    "metadata": {...}
  },
  "filename": "presentation.pptx"
}`}
          </div>
        </div>

        <div className="api-endpoint">
          <h3>
            <span className="method-badge">POST</span>
            <span className="api-url">/api/convert</span>
          </h3>
          <p><strong>描述：</strong>转换 PPTX 文件，支持下载或返回 JSON</p>
          
          <h4>请求参数</h4>
          <div className="parameter-item">
            <div className="parameter-name">file <span className="parameter-type">(FormData)</span></div>
            <div>要转换的 .pptx 文件</div>
          </div>
          <div className="parameter-item">
            <div className="parameter-name">format <span className="parameter-type">(string, 可选)</span></div>
            <div>输出格式："json"（默认）或 "download"</div>
          </div>

          <h4>响应示例</h4>
          <div className="code-block">
{`{
  "success": true,
  "filename": "presentation.pptx",
  "size": 1048576,
  "convertedAt": "2024-01-01T00:00:00.000Z",
  "data": {...}
}`}
          </div>
        </div>

        <div className="api-endpoint">
          <h3>
            <span className="method-badge">GET</span>
            <span className="api-url">/api/health</span>
          </h3>
          <p><strong>描述：</strong>服务健康检查</p>
          
          <h4>响应示例</h4>
          <div className="code-block">
{`{
  "status": "healthy",
  "service": "pptxtojson-api",
  "version": "1.5.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}
          </div>
        </div>
      </div>

      <div className="docs-section">
        <h2>错误处理</h2>
        <p>API 使用标准 HTTP 状态码表示成功或失败：</p>
        <ul>
          <li><strong>200</strong> - 成功</li>
          <li><strong>400</strong> - 请求错误（无效文件、文件类型错误等）</li>
          <li><strong>405</strong> - 方法不被允许</li>
          <li><strong>500</strong> - 服务器内部错误</li>
        </ul>

        <h4>错误响应示例</h4>
        <div className="code-block">
{`{
  "error": "Invalid file type",
  "message": "Only .pptx files are supported"
}`}
        </div>
      </div>

      <div className="docs-section">
        <h2>使用示例</h2>
        
        <h3>JavaScript/Fetch</h3>
        <div className="code-block">
{`const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));`}
        </div>

        <h3>cURL</h3>
        <div className="code-block">
{`curl -X POST \\
  -F "file=@presentation.pptx" \\
  http://localhost:3000/api/parse-pptx`}
        </div>
      </div>

      <a href="/" className="back-link">
        ← 返回主页
      </a>
    </div>
  )
}