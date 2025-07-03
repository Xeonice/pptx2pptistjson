# 测试指南

## 概述

本项目拥有全面的测试套件，包含 **850+ 个测试用例**，覆盖了 PowerPoint 到 PPTist JSON 转换的所有方面。测试架构采用 Jest 测试框架，配合 TypeScript 支持，确保代码质量和功能完整性。

## 快速开始

### 运行所有测试
```bash
npm test
```

### 监视模式（开发推荐）
```bash
npm run test:watch
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

## 测试架构

### 测试环境配置
- **测试框架**: Jest + TypeScript
- **DOM 环境**: jsdom (支持 React 组件测试)
- **超时设置**: 30 秒 (适应复杂的 PPTX 处理)
- **设置文件**: `tests/setup.ts`

### 测试配置文件
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app', '<rootDir>/tests', '<rootDir>/components'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary']
};
```

## 测试分类

### 1. 核心转换测试
- **颜色处理** (`color-processing-*.test.ts`)
- **形状处理** (`shape-processor-*.test.ts`)
- **文本处理** (`text-processor-*.test.ts`)
- **图像处理** (`image-processing-*.test.ts`)

### 2. 高级功能测试
- **主题色彩映射** (`theme-color-mapping.test.ts`)
- **背景格式处理** (`slide-background-format.test.ts`)
- **连接形状处理** (`connection-shape-processor-*.test.ts`)
- **调试功能** (`debug-functionality.test.ts`)

### 3. 集成测试
- **端到端转换** (`end-to-end-conversion-flow.test.ts`)
- **API 集成** (`api-integration-background.test.ts`)
- **PPTX 解析器集成** (`pptx-parser-integration.test.ts`)

### 4. 组件测试
- **React 组件** (`switch-component-integration.test.tsx`)
- **Monaco 编辑器** (`monaco-json-loader-*.test.tsx`)
- **CDN 文件上传** (`cdn-file-uploader.test.tsx`)

## 测试运行方法

### 按类别运行测试

#### 颜色处理测试
```bash
npx jest color-processing
npx jest color-format
npx jest color-utils
```

#### 形状处理测试
```bash
npx jest shape-processor
npx jest shape-element
npx jest shape-geometry
```

#### 文本处理测试
```bash
npx jest text-processor
npx jest text-style
npx jest html-converter
```

#### 图像处理测试
```bash
npx jest image-processing
npx jest image-offset
npx jest pptx-image-processor
```

#### 背景格式测试
```bash
npx jest slide-background-format
npx jest background-format
```

#### 调试功能测试
```bash
npx jest debug-functionality
npx jest debug-helper
```

### 运行单个测试文件
```bash
npx jest connection-shape-processor-advanced.test.ts
npx jest text-processor-advanced.test.ts
npx jest slide-parser-advanced.test.ts
```

### 运行特定测试用例
```bash
npx jest --testNamePattern="should process bentConnector3 with basic properties"
npx jest --testNamePattern="Color processing"
```

## 测试覆盖率

### 覆盖率目标
- **行覆盖率**: > 90%
- **函数覆盖率**: > 95%
- **分支覆盖率**: > 85%
- **语句覆盖率**: > 90%

### 覆盖率报告
```bash
npm run test:coverage
```

生成的覆盖率报告位于 `coverage/` 目录：
- `coverage/lcov-report/index.html` - HTML 格式报告
- `coverage/lcov.info` - LCOV 格式报告
- `coverage/coverage-summary.json` - JSON 摘要报告

### 覆盖率排除文件
```javascript
collectCoverageFrom: [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  '!app/**/*.d.ts',
  '!app/**/index.ts',
  '!components/**/*.d.ts'
]
```

## 测试调试

### 调试失败的测试
```bash
# 运行失败的测试并显示详细信息
npx jest --verbose --no-coverage

# 仅运行失败的测试
npx jest --onlyFailures

# 显示测试输出
npx jest --silent=false
```

### 调试特定测试
```bash
# 使用 Node 调试器
node --inspect-brk node_modules/.bin/jest --runInBand specific-test.ts

# 使用 VS Code 调试
# 在 VS Code 中设置断点，然后运行调试配置
```

### 常见测试问题

#### 1. 测试超时
```bash
# 增加超时时间
npx jest --testTimeout=60000
```

#### 2. 模拟依赖问题
检查 `tests/__mocks__/` 目录中的模拟文件：
- `monaco-editor.js` - Monaco 编辑器模拟

#### 3. 异步测试问题
确保使用 `async/await` 或返回 Promise：
```typescript
it('should process async operation', async () => {
  const result = await processor.process(data);
  expect(result).toBeDefined();
});
```

## 测试最佳实践

### 1. 测试结构
```typescript
describe('ComponentName', () => {
  describe('功能分组', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = processor.process(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### 2. 测试命名规范
- 使用描述性名称，说明测试的具体行为
- 中文描述功能分组，英文描述具体测试用例
- 遵循 "should + 动词 + 预期结果" 的格式

### 3. 模拟数据管理
```typescript
// 使用工厂函数创建测试数据
const createMockContext = (overrides = {}) => ({
  theme: createMockTheme(),
  slideId: '1',
  ...overrides
});
```

### 4. 断言技巧
```typescript
// 使用精确匹配
expect(result.getId()).toMatch(/^shape_\d+$/);

// 使用部分匹配
expect(result).toEqual(expect.objectContaining({
  type: 'shape',
  fill: expect.any(String)
}));

// 使用自定义匹配器
expect(color).toBeValidRgbaColor();
```

## 测试维护

### 1. 添加新测试
```bash
# 创建新的测试文件
touch tests/__tests__/new-feature.test.ts

# 遵循现有测试模式
cp tests/__tests__/template.test.ts tests/__tests__/new-feature.test.ts
```

### 2. 更新测试数据
- 测试数据位于 `tests/fixtures/` 目录
- 示例文件位于 `sample/` 目录
- 不要删除示例文件，它们是转换格式的参考

### 3. 处理测试失败
```bash
# 查看详细的失败信息
npx jest --verbose --no-coverage failed-test.test.ts

# 更新快照测试
npx jest --updateSnapshot
```

## 性能测试

### 1. 测试执行时间
```bash
# 显示测试执行时间
npx jest --verbose --detectOpenHandles
```

### 2. 内存使用监控
```bash
# 监控内存使用
npx jest --logHeapUsage
```

### 3. 并发测试
```bash
# 控制并发数
npx jest --maxWorkers=4
```

## 持续集成

### GitHub Actions 配置
```yaml
- name: Run tests
  run: npm test
  
- name: Upload coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### 测试质量门禁
- 所有测试必须通过
- 覆盖率不得低于设定阈值
- 不允许跳过重要测试

## 故障排除

### 常见问题解决

#### 1. 测试环境问题
```bash
# 清理 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. Jest 配置问题
```bash
# 验证 Jest 配置
npx jest --showConfig
```

#### 3. TypeScript 编译问题
```bash
# 检查 TypeScript 配置
npm run type-check
```

#### 4. 测试数据问题
- 确保测试数据路径正确
- 验证模拟数据的格式
- 检查依赖注入是否正确

### 获取帮助

如果遇到测试问题：
1. 检查测试输出的详细错误信息
2. 查看相关的测试文件和模拟配置
3. 确认测试环境配置正确
4. 参考现有的类似测试用例

## 测试指标

### 当前状态
- **总测试数**: 850+
- **测试文件数**: 74+
- **测试覆盖率**: > 90%
- **测试执行时间**: < 2 分钟

### 测试分布
- 单元测试: 70%
- 集成测试: 25%
- 端到端测试: 5%

---

**注意**: 在进行任何代码修改后，务必运行完整的测试套件确保所有测试通过：
```bash
npm run build && npm run type-check && npm run lint && npm test
```