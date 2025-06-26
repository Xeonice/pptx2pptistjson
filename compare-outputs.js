const fs = require('fs');

function compareOutputs() {
  try {
    // 读取两个文件
    const expectedOutput = JSON.parse(fs.readFileSync('./sample/output.json', 'utf8'));
    const currentOutput = JSON.parse(fs.readFileSync('./current-pptist-output.json', 'utf8'));
    
    console.log('=== 结构对比 ===');
    console.log('期望输出的顶级键:', Object.keys(expectedOutput));
    console.log('当前输出的顶级键:', Object.keys(currentOutput));
    
    console.log('\n=== 第一张幻灯片对比 ===');
    const expectedSlide1 = expectedOutput.slides[0];
    const currentSlide1 = currentOutput.slides[0];
    
    console.log('期望幻灯片1结构:', Object.keys(expectedSlide1));
    console.log('当前幻灯片1结构:', Object.keys(currentSlide1));
    
    console.log('\n=== 元素数量对比 ===');
    console.log('期望元素数量:', expectedSlide1.elements.length);
    console.log('当前元素数量:', currentSlide1.elements.length);
    
    console.log('\n=== 逐个元素对比 ===');
    for (let i = 0; i < Math.min(expectedSlide1.elements.length, currentSlide1.elements.length); i++) {
      const expectedEl = expectedSlide1.elements[i];
      const currentEl = currentSlide1.elements[i];
      
      console.log(`\n--- 元素 ${i + 1} ---`);
      console.log('期望:', {
        tag: expectedEl.tag,
        type: expectedEl.type,
        left: expectedEl.left,
        top: expectedEl.top,
        width: expectedEl.width,
        height: expectedEl.height
      });
      console.log('当前:', {
        tag: currentEl.tag,
        type: currentEl.type,
        left: currentEl.left,
        top: currentEl.top,
        width: currentEl.width,
        height: currentEl.height
      });
      
      // 详细对比
      const differences = [];
      
      // 对比标签
      if (expectedEl.tag !== currentEl.tag) {
        differences.push(`tag: 期望"${expectedEl.tag}" vs 当前"${currentEl.tag}"`);
      }
      
      // 对比类型
      if (expectedEl.type !== currentEl.type) {
        differences.push(`type: 期望"${expectedEl.type}" vs 当前"${currentEl.type}"`);
      }
      
      // 对比内容格式
      if (expectedEl.content && currentEl.content) {
        if (expectedEl.content.includes('color:#b93423ff') && !currentEl.content.includes('color:#b93423ff')) {
          differences.push('颜色格式: 期望包含#b93423ff，当前不包含');
        }
        if (expectedEl.content.includes('font-size:72px') && !currentEl.content.includes('font-size:72px')) {
          differences.push('字体大小: 期望72px，当前不匹配');
        }
        if (currentEl.content.includes('&lt;') && !expectedEl.content.includes('&lt;')) {
          differences.push('HTML编码: 当前有多余的HTML编码');
        }
      }
      
      // 对比defaultFontName
      if (expectedEl.defaultFontName !== currentEl.defaultFontName) {
        differences.push(`defaultFontName: 期望"${expectedEl.defaultFontName}" vs 当前"${currentEl.defaultFontName}"`);
      }
      
      // 对比路径公式
      if (expectedEl.pathFormula !== currentEl.pathFormula) {
        differences.push(`pathFormula: 期望"${expectedEl.pathFormula}" vs 当前"${currentEl.pathFormula}"`);
      }
      
      // 对比themeFill颜色格式
      if (expectedEl.themeFill && currentEl.themeFill) {
        if (expectedEl.themeFill.color !== currentEl.themeFill.color) {
          differences.push(`themeFill.color: 期望"${expectedEl.themeFill.color}" vs 当前"${currentEl.themeFill.color}"`);
        }
      }
      
      if (differences.length > 0) {
        console.log('🔍 发现差异:');
        differences.forEach(diff => console.log('  -', diff));
      } else {
        console.log('✅ 基本结构一致');
      }
    }
    
    console.log('\n=== 背景对比 ===');
    console.log('期望背景:', expectedSlide1.background);
    console.log('当前背景:', currentSlide1.background);
    
    if (expectedSlide1.background.type !== currentSlide1.background.type) {
      console.log('🔍 背景类型差异: 期望', expectedSlide1.background.type, 'vs 当前', currentSlide1.background.type);
    }
    
    console.log('\n=== 需要修改的内容汇总 ===');
    const modifications = [];
    
    // 1. 文本内容格式问题
    modifications.push('1. 文本内容HTML格式化问题');
    modifications.push('   - 移除多余的HTML编码 (&lt; &gt;)');
    modifications.push('   - 正确处理文本颜色格式 (应该是#b93423ff而不是#ffffff00)');
    modifications.push('   - 正确设置字体大小 (标题应该是72px)');
    
    // 2. 元素标签问题
    modifications.push('2. 元素标签分类问题');
    modifications.push('   - 标题文本应该tag为"title"而不是"text"');
    modifications.push('   - 副标题应该tag为"subTitle"');
    
    // 3. 字体问题
    modifications.push('3. 默认字体名称');
    modifications.push('   - 应该使用"PingFang SC"而不是"Microsoft Yahei"');
    
    // 4. 形状路径问题
    modifications.push('4. 形状路径公式');
    modifications.push('   - 应该是"roundRect"而不是"rect"');
    
    // 5. 颜色格式问题
    modifications.push('5. 主题填充颜色格式');
    modifications.push('   - 颜色应该包含alpha通道 (#dcaf7aff)');
    
    // 6. 背景问题  
    modifications.push('6. 幻灯片背景');
    modifications.push('   - 期望是图片背景，当前是纯色背景');
    modifications.push('   - 需要处理背景图片提取和设置');
    
    modifications.forEach(mod => console.log(mod));
    
  } catch (error) {
    console.error('对比失败:', error);
  }
}

compareOutputs();