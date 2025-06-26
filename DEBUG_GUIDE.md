# 🔧 调试指南 - 解析结果展示问题

## 📊 当前状态

**问题**: 解析结果展示为空
**服务器**: 运行在 http://localhost:3001 (开发模式)
**调试模式**: 已启用详细日志

## 🧪 调试方法

### 方法 1: 使用测试数据按钮
1. 访问 http://localhost:3001
2. 点击左侧的 `🧪 测试数据` 按钮
3. 观察右侧是否显示 JSON 数据
4. 检查浏览器控制台输出

### 方法 2: 使用内置测试功能
1. 在右侧 JSON 区域，点击 `🧪 测试数据展示` 按钮
2. 应该会直接在编辑器中显示测试数据
3. 观察控制台日志

### 方法 3: 检查数据流
1. 打开浏览器开发者工具 (F12)
2. 转到 Console 标签
3. 上传一个 .pptx 文件
4. 观察以下日志输出：
   - `API Response:` - API 返回的数据
   - `Setting JSON data:` - 设置到状态的数据
   - `JsonViewer data changed:` - 组件接收到的数据
   - `Initializing JSONEditor...` - 编辑器初始化
   - `Setting data to editor:` - 数据设置到编辑器

## 🔍 常见问题检查

### 1. JSONEditor 初始化问题
**症状**: 控制台显示 "Failed to initialize JSONEditor"
**解决**: 检查 jsoneditor CSS 是否正确加载

### 2. API 数据问题
**症状**: API Response 为空或错误
**解决**: 
```bash
# 检查 API 健康状态
curl http://localhost:3001/api/health

# 检查服务器日志
# 查看终端运行 npm run dev 的输出
```

### 3. 模块导入问题
**症状**: 控制台显示模块加载错误
**解决**: 检查动态导入是否成功

### 4. 数据传递问题
**症状**: 数据存在但不显示
**解决**: 使用测试按钮验证组件工作状态

## 📝 调试日志说明

### 正常流程应该看到:
```
Initializing JSONEditor...
JSONEditor initialized successfully
JsonViewer data changed: [Object]
Setting data to editor: [Object]
```

### API 调用流程:
```
API Response: {success: true, data: {...}}
Setting JSON data: [Object]
JsonViewer data changed: [Object]
```

## 🛠️ 临时解决方案

如果 JSONEditor 有问题，可以临时使用简单的 JSON 显示：

```javascript
// 在 JsonViewer.tsx 中添加备用显示
{!editorRef.current && data && (
  <pre style={{
    padding: '20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '14px',
    lineHeight: '1.4'
  }}>
    {JSON.stringify(data, null, 2)}
  </pre>
)}
```

## 🎯 下一步调试

1. 首先使用测试数据按钮验证组件基本功能
2. 检查浏览器控制台输出的完整日志
3. 如果测试数据正常显示，则问题在 API 调用
4. 如果测试数据也不显示，则问题在 JSONEditor 初始化

---

💡 **提示**: 始终保持浏览器开发者工具开启，这样可以实时看到所有调试信息。