# 字体颜色测试用例规划

## 分析总结

### 关键问题识别
1. **颜色格式不一致**：当前HTML输出中颜色格式与期望不符
2. **主题颜色识别缺陷**：使用硬编码颜色映射，缺少动态主题解析
3. **缺少复杂颜色处理**：未处理 schemeClr、lumMod、lumOff 等PowerPoint颜色属性
4. **HTML输出格式差异**：`--colortype` 属性处理不正确
5. **默认颜色逻辑**：getDefaultColor硬编码，应从主题中获取

### 期望的数据结构
```json
{
  "content": "<div style=\"\"><p style=\"\"><span style=\"color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1;\">文本内容</span></p></div>",
  "defaultColor": {
    "color": "#333333",
    "colorType": "dk1"
  },
  "defaultFontName": "Microsoft Yahei"
}
```

## 测试用例规划

### 1. 颜色格式标准化测试 (color-format-extended.test.ts)

#### 1.1 十六进制颜色格式测试
```typescript
describe('Hex Color Format', () => {
  test('should preserve hex format with alpha in HTML output', () => {
    // 输入：#5b9bd5 或 #5b9bd5ff
    // 期望：color:#5b9bd5ff;
  });
  
  test('should handle 3-digit hex colors', () => {
    // 输入：#f00
    // 期望：color:#ff0000ff;
  });
  
  test('should handle 8-digit hex colors with alpha', () => {
    // 输入：#5b9bd580
    // 期望：color:#5b9bd580;
  });
});
```

#### 1.2 RGBA颜色格式测试
```typescript
describe('RGBA Color Format', () => {
  test('should convert rgba to hex format in HTML', () => {
    // 输入：rgba(91,155,213,1)
    // 期望：color:#5b9bd5ff;
  });
  
  test('should handle rgba with transparency', () => {
    // 输入：rgba(91,155,213,0.5)
    // 期望：color:#5b9bd580;
  });
});
```

#### 1.3 RGB颜色格式测试
```typescript
describe('RGB Color Format', () => {
  test('should convert rgb to hex format in HTML', () => {
    // 输入：rgb(51,51,51)
    // 期望：color:#333333ff;
  });
});
```

### 2. 主题颜色类型映射测试 (theme-color-mapping.test.ts)

#### 2.1 基础主题颜色识别
```typescript
describe('Theme Color Type Detection', () => {
  test('should identify accent1 color', () => {
    // 输入颜色：#5b9bd5
    // 期望：--colortype:accent1;
  });
  
  test('should identify dk1 color for default text', () => {
    // 输入颜色：#333333
    // 期望：--colortype:dk1;
  });
  
  test('should handle light theme colors', () => {
    // 测试 lt1, lt2 等浅色主题颜色
  });
});
```

#### 2.2 动态主题颜色解析
```typescript
describe('Dynamic Theme Color Resolution', () => {
  test('should resolve theme colors from presentation theme', () => {
    // 测试从主题定义中解析颜色类型
    // 而不是使用硬编码映射
  });
  
  test('should handle custom theme colors', () => {
    // 测试非标准主题颜色的处理
  });
});
```

### 3. 复杂颜色属性处理测试 (advanced-color-processing.test.ts)

#### 3.1 PowerPoint颜色修饰符
```typescript
describe('PowerPoint Color Modifiers', () => {
  test('should apply lumMod (brightness modification)', () => {
    // 测试亮度修饰符的应用
    // 输入：基色 + lumMod值
    // 期望：修饰后的颜色值
  });
  
  test('should apply lumOff (brightness offset)', () => {
    // 测试亮度偏移的应用
  });
  
  test('should combine multiple color modifiers', () => {
    // 测试多个修饰符的组合应用
  });
});
```

#### 3.2 主题颜色继承
```typescript
describe('Theme Color Inheritance', () => {
  test('should inherit colors from slide master', () => {
    // 测试从幻灯片母版继承颜色
  });
  
  test('should override inherited colors', () => {
    // 测试局部颜色覆盖继承颜色
  });
});
```

### 4. HTML输出完整性测试 (html-output-integrity.test.ts)

#### 4.1 HTML结构测试
```typescript
describe('HTML Structure', () => {
  test('should generate correct HTML structure', () => {
    // 期望：<div style=""><p style=""><span style="...">text</span></p></div>
  });
  
  test('should handle multiple text runs', () => {
    // 测试多个文本运行的HTML输出
  });
  
  test('should preserve text formatting hierarchy', () => {
    // 测试段落和运行级别的格式化
  });
});
```

#### 4.2 样式属性组合
```typescript
describe('Style Attribute Combination', () => {
  test('should combine color and font attributes correctly', () => {
    // 期望：color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1;
  });
  
  test('should handle missing style attributes gracefully', () => {
    // 测试部分样式缺失的情况
  });
  
  test('should maintain style attribute order', () => {
    // 测试样式属性的顺序一致性
  });
});
```

### 5. 默认颜色和字体测试 (default-values.test.ts)

#### 5.1 默认颜色设置
```typescript
describe('Default Color Settings', () => {
  test('should set correct defaultColor from theme', () => {
    // 期望：{ color: "#333333", colorType: "dk1" }
  });
  
  test('should fallback to hardcoded default when theme missing', () => {
    // 测试主题缺失时的默认颜色
  });
});
```

#### 5.2 默认字体设置
```typescript
describe('Default Font Settings', () => {
  test('should extract defaultFontName from content', () => {
    // 期望：Microsoft Yahei 或实际的字体名称
  });
  
  test('should use theme default font when content has no font', () => {
    // 测试从主题获取默认字体
  });
});
```

### 6. 边界情况和错误处理测试 (edge-cases.test.ts)

#### 6.1 颜色值边界情况
```typescript
describe('Color Value Edge Cases', () => {
  test('should handle transparent colors', () => {
    // 输入：transparent 或 alpha=0
    // 期望：正确的透明颜色处理
  });
  
  test('should handle invalid color values', () => {
    // 输入：无效颜色值
    // 期望：fallback到默认颜色
  });
  
  test('should handle missing color information', () => {
    // 测试颜色信息完全缺失的情况
  });
});
```

#### 6.2 主题解析边界情况
```typescript
describe('Theme Resolution Edge Cases', () => {
  test('should handle missing theme definition', () => {
    // 测试主题定义缺失的情况
  });
  
  test('should handle circular theme references', () => {
    // 测试主题颜色循环引用
  });
});
```

## 实施建议

### 优先级排序
1. **高优先级**：颜色格式标准化测试（影响HTML输出格式）
2. **高优先级**：主题颜色类型映射测试（影响--colortype属性）
3. **中优先级**：HTML输出完整性测试（验证整体结构）
4. **中优先级**：默认值处理测试（确保向后兼容）
5. **低优先级**：复杂颜色处理测试（高级功能）
6. **低优先级**：边界情况测试（稳定性保证）

### 测试数据准备
- 创建包含各种颜色格式的测试PPTX文件
- 准备不同主题配置的演示文稿
- 创建边界情况的测试数据

### 集成测试
- 端到端测试：完整PPTX解析流程的颜色处理
- 回归测试：确保修复不影响现有功能
- 性能测试：颜色处理对解析性能的影响

## 期望结果
通过这些测试用例，确保：
1. 字体颜色输出格式与预期完全一致
2. 主题颜色类型正确识别和标记
3. HTML输出结构规范且完整
4. 边界情况得到妥善处理
5. 向后兼容性得到保持