# 颜色处理系统测试计划清单

## 概述
基于最新的颜色处理系统重构（commit: 81aaa38），本文档提供全面的测试用例清单，确保新的 FillExtractor 和增强的 ColorUtils 系统的可靠性。

## 测试架构分层

### 第一层：单元测试（Unit Tests）

#### 1. ColorUtils 增强功能测试

##### 1.1 颜色变换函数测试
```typescript
// tests/__tests__/color-utils-enhanced.test.ts
describe('ColorUtils Enhanced Functions', () => {
  describe('applyShade', () => {
    // 基础功能测试
    it('should apply 50% shade to red color')
    it('should apply 25% shade to blue color')
    it('should apply 75% shade to green color')
    
    // 边界值测试
    it('should handle 0% shade (no change)')
    it('should handle 100% shade (black)')
    it('should handle shade > 1 (clamped to black)')
    it('should handle negative shade values')
    
    // 精度测试
    it('should maintain precision for small shade values')
    it('should round properly for decimal results')
  })

  describe('applyTint', () => {
    // 对称测试（tint 是 shade 的反向操作）
    it('should apply 50% tint to dark colors')
    it('should apply tint to already light colors')
    it('should handle 100% tint (white)')
    it('should handle tint + shade combination')
  })

  describe('applySatMod', () => {
    // HSL 操作测试
    it('should increase saturation correctly')
    it('should decrease saturation correctly')
    it('should handle grayscale colors (0 saturation)')
    it('should preserve hue and lightness')
  })

  describe('applyHueMod', () => {
    it('should rotate hue correctly')
    it('should handle full rotation (360°)')
    it('should handle negative rotation')
    it('should preserve saturation and lightness')
  })

  describe('hslToRgb', () => {
    // 标准颜色测试
    it('should convert pure red (0°, 100%, 50%)')
    it('should convert pure green (120°, 100%, 50%)')
    it('should convert pure blue (240°, 100%, 50%)')
    
    // 特殊情况测试
    it('should handle grayscale (any hue, 0% saturation)')
    it('should handle white (any hue, any saturation, 100% lightness)')
    it('should handle black (any hue, any saturation, 0% lightness)')
    
    // 精度测试
    it('should maintain RGB precision within tolerance')
  })

  describe('getPresetColor', () => {
    // 标准预设颜色测试
    it('should return correct hex for basic colors (red, green, blue)')
    it('should return correct hex for named colors (crimson, navy, etc.)')
    it('should handle case sensitivity')
    it('should return null for unknown colors')
    
    // 完整性测试
    it('should have all CSS named colors')
    it('should return properly formatted hex values')
  })
})
```

##### 1.2 颜色格式处理测试
```typescript
describe('Color Format Processing', () => {
  describe('toRgba consistency', () => {
    it('should handle all supported input formats')
    it('should maintain alpha precision')
    it('should normalize spacing in rgba strings')
  })

  describe('Alpha handling', () => {
    it('should format alpha=1 as "1" not "1.000"')
    it('should trim trailing zeros in alpha')
    it('should handle very small alpha values')
  })
})
```

#### 2. FillExtractor 核心功能测试

##### 2.1 颜色类型提取测试
```typescript
// tests/__tests__/fill-extractor-comprehensive.test.ts
describe('FillExtractor Color Type Extraction', () => {
  describe('srgbClr (Direct RGB)', () => {
    it('should extract 6-digit hex values')
    it('should handle uppercase and lowercase hex')
    it('should apply transformations to srgbClr')
  })

  describe('schemeClr (Theme Colors)', () => {
    it('should resolve accent1-6 colors')
    it('should resolve dk1, dk2, lt1, lt2 colors')
    it('should resolve hyperlink colors')
    it('should handle missing theme gracefully')
    it('should apply transformations to theme colors')
  })

  describe('scrgbClr (Percentage RGB)', () => {
    it('should convert percentage values correctly')
    it('should handle values with and without % symbols')
    it('should handle fractional percentages')
  })

  describe('prstClr (Preset Colors)', () => {
    it('should resolve all CSS named colors')
    it('should handle unknown preset colors')
    it('should apply transformations to preset colors')
  })

  describe('hslClr (HSL Colors)', () => {
    it('should convert HSL to RGB correctly')
    it('should handle PowerPoint HSL format (0-100000 scale)')
    it('should apply transformations to HSL colors')
  })

  describe('sysClr (System Colors)', () => {
    it('should use lastClr attribute when available')
    it('should handle missing lastClr attribute')
  })
})
```

##### 2.2 颜色变换链测试
```typescript
describe('Color Transformation Chain', () => {
  describe('Single transformations', () => {
    it('should apply alpha correctly')
    it('should apply each transformation type independently')
  })

  describe('Multiple transformations', () => {
    it('should apply transformations in correct order')
    it('should handle complex transformation chains')
    it('should maintain precision through multiple operations')
    
    // PowerPoint 常见组合测试
    it('should handle lumMod + lumOff combination')
    it('should handle shade + tint combination')
    it('should handle satMod + hueMod combination')
  })

  describe('Transformation edge cases', () => {
    it('should handle NaN values gracefully')
    it('should handle undefined transformation values')
    it('should clamp values to valid ranges')
  })
})
```

#### 3. Element Processor 集成测试

##### 3.1 TextProcessor 集成测试
```typescript
// tests/__tests__/text-processor-color-integration.test.ts
describe('TextProcessor Color Integration', () => {
  describe('Color extraction from text runs', () => {
    it('should extract direct RGB colors from text')
    it('should extract theme colors from text')
    it('should apply transformations to text colors')
    it('should maintain themeColorType metadata')
  })

  describe('Theme integration', () => {
    it('should create proper theme content structure')
    it('should handle missing theme gracefully')
    it('should map theme colors correctly')
  })

  describe('XML node conversion', () => {
    it('should convert XML nodes to objects correctly')
    it('should handle nested color structures')
    it('should preserve attribute structure')
  })
})
```

##### 3.2 ShapeProcessor 集成测试
```typescript
// tests/__tests__/shape-processor-fill-integration.test.ts
describe('ShapeProcessor Fill Integration', () => {
  describe('Fill color extraction', () => {
    it('should extract fill colors from shapes')
    it('should set fill property on ShapeElement')
    it('should handle noFill correctly')
    it('should use actual fill in themeFill output')
  })

  describe('Shape fill inheritance', () => {
    it('should fallback to default colors when no fill')
    it('should prefer actual fill over generated colors')
  })
})
```

### 第二层：集成测试（Integration Tests）

#### 4. 主题颜色系统测试
```typescript
// tests/__tests__/theme-color-system-integration.test.ts
describe('Theme Color System Integration', () => {
  describe('End-to-end theme color resolution', () => {
    it('should resolve theme colors in text elements')
    it('should resolve theme colors in shape elements')
    it('should handle theme color transformations')
    it('should maintain consistency across elements')
  })

  describe('Theme variations', () => {
    it('should handle different theme color schemes')
    it('should handle custom theme colors')
    it('should handle missing theme color definitions')
  })
})
```

#### 5. 颜色处理一致性测试
```typescript
// tests/__tests__/color-consistency-integration.test.ts
describe('Color Processing Consistency', () => {
  describe('Format standardization', () => {
    it('should output rgba format consistently')
    it('should maintain precision across processors')
    it('should handle transparency consistently')
  })

  describe('Cross-processor consistency', () => {
    it('should produce same colors for same inputs across processors')
    it('should maintain theme color references consistently')
  })
})
```

### 第三层：端到端测试（E2E Tests）

#### 6. 实际 PPTX 文件测试
```typescript
// tests/__tests__/pptx-color-e2e.test.ts
describe('PPTX Color Processing E2E', () => {
  describe('Simple color scenarios', () => {
    it('should parse PPTX with direct RGB colors')
    it('should parse PPTX with theme colors')
    it('should parse PPTX with mixed color types')
  })

  describe('Complex color scenarios', () => {
    it('should parse PPTX with color transformations')
    it('should parse PPTX with custom themes')
    it('should parse PPTX with complex shape fills')
  })

  describe('Edge case scenarios', () => {
    it('should handle PPTX with missing color definitions')
    it('should handle PPTX with corrupted color data')
    it('should handle PPTX with unusual color combinations')
  })
})
```

### 第四层：性能与兼容性测试

#### 7. 性能测试
```typescript
// tests/__tests__/color-performance.test.ts
describe('Color Processing Performance', () => {
  describe('Transformation performance', () => {
    it('should complete color transformations within time limits')
    it('should handle large numbers of color operations efficiently')
  })

  describe('Memory usage', () => {
    it('should not leak memory during color processing')
    it('should reuse color computation results when possible')
  })
})
```

#### 8. 向后兼容性测试
```typescript
// tests/__tests__/color-backward-compatibility.test.ts
describe('Color Backward Compatibility', () => {
  describe('Legacy format support', () => {
    it('should maintain support for existing color formats')
    it('should not break existing color outputs')
    it('should preserve themeColorType metadata')
  })

  describe('API compatibility', () => {
    it('should maintain existing color-related APIs')
    it('should not change existing color property names')
  })
})
```

## 测试数据与工具

### 9. 测试辅助工具
```typescript
// tests/helpers/color-test-utils.ts
export class ColorTestUtils {
  // 颜色比较工具（处理浮点精度）
  static expectColorEqual(actual: string, expected: string, tolerance = 1)
  
  // PowerPoint 颜色格式生成器
  static createPPTColorNode(type: string, value: string, transformations?: any)
  
  // 主题颜色生成器
  static createMockTheme(colors: Record<string, string>)
  
  // PPTX XML 模拟数据生成器
  static createMockShapeWithFill(fillType: string, fillData: any)
}
```

### 10. 测试数据集
```typescript
// tests/fixtures/color-test-data.ts
export const colorTestData = {
  // 标准颜色测试案例
  standardColors: {
    red: { hex: '#FF0000', rgb: 'rgb(255,0,0)', rgba: 'rgba(255,0,0,1)' },
    // ... 更多标准颜色
  },
  
  // PowerPoint 主题颜色
  themeColors: {
    office2019: { accent1: '#FF0000', accent2: '#00FF00', /* ... */ },
    // ... 更多主题
  },
  
  // 颜色变换测试案例
  transformations: {
    shade50: { input: '#FF0000', expected: '#800000' },
    tint50: { input: '#FF0000', expected: '#FF8080' },
    // ... 更多变换
  }
}
```

## 测试执行优先级

### 立即执行（高优先级）
1. ✅ **修复现有测试失败** - 调整精度期望值
2. **ColorUtils 增强功能完整测试** - 覆盖所有新增函数
3. **FillExtractor 核心功能测试** - 确保基础功能正确

### 短期执行（中优先级）
4. **处理器集成测试** - TextProcessor 和 ShapeProcessor
5. **主题颜色系统测试** - 端到端主题解析
6. **颜色一致性测试** - 跨组件一致性验证

### 长期执行（低优先级）
7. **性能测试** - 大规模颜色处理性能
8. **实际 PPTX 文件测试** - 真实文件兼容性
9. **向后兼容性测试** - 确保不破坏现有功能

## 测试覆盖率目标

- **单元测试覆盖率**: ≥ 95%
- **集成测试覆盖率**: ≥ 85%
- **颜色变换函数覆盖率**: 100%
- **边界情况覆盖率**: ≥ 90%

## 成功标准

1. **功能正确性**: 所有颜色类型正确解析和变换
2. **精度标准**: 颜色值误差 ≤ 1 RGB 单位
3. **性能标准**: 颜色处理延迟 ≤ 1ms/操作
4. **兼容性**: 不破坏现有功能和 API
5. **可维护性**: 测试代码清晰、可扩展

## 自动化集成

- **CI/CD 集成**: 每次提交自动运行核心测试
- **回归测试**: 发布前运行完整测试套件
- **性能监控**: 持续监控颜色处理性能
- **覆盖率报告**: 自动生成测试覆盖率报告