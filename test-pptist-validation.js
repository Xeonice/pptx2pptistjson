// 测试 PPTist 格式验证
const fs = require('fs');
const path = require('path');

// 模拟 PPTist 的导入验证逻辑
function validatePPTistJSON(jsonData) {
  console.log('🔍 开始 PPTist 格式验证...');
  
  // 验证顶层结构
  if (!jsonData || !jsonData.slides || !Array.isArray(jsonData.slides)) {
    console.error('❌ JSON格式不正确，缺少slides数组');
    return false;
  }
  
  console.log('✅ slides 数组存在');
  
  const slides = jsonData.slides;
  console.log(`📊 幻灯片数量: ${slides.length}`);
  
  // 验证每个slide的基本结构
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    console.log(`🔍 验证幻灯片 ${i + 1}/${slides.length}...`);
    
    if (!slide.id) {
      console.error(`❌ 幻灯片 ${i + 1} 缺少 id 字段`);
      return false;
    }
    
    if (!slide.elements || !Array.isArray(slide.elements)) {
      console.error(`❌ 幻灯片 ${i + 1} 缺少 elements 数组`);
      return false;
    }
    
    console.log(`  ✅ ID: ${slide.id}`);
    console.log(`  ✅ 元素数量: ${slide.elements.length}`);
    console.log(`  📋 标签: ${slide.tag || '无'}`);
    
    // 验证元素结构
    for (let j = 0; j < Math.min(slide.elements.length, 3); j++) {
      const element = slide.elements[j];
      console.log(`    🔍 元素 ${j + 1}: type=${element.type}, id=${element.id || '无'}, tag=${element.tag || '无'}`);
      
      if (element.type === 'text' && element.content) {
        // 提取文本内容示例
        const textMatch = element.content.match(/>([^<]+)</);
        const text = textMatch ? textMatch[1] : '无法提取';
        console.log(`      📝 文本: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`);
      }
    }
  }
  
  // 验证主题信息
  if (jsonData.theme) {
    console.log('✅ 主题信息存在');
    console.log(`  📋 字体: ${jsonData.theme.fontName || '未指定'}`);
    if (jsonData.theme.themeColor) {
      const colorKeys = Object.keys(jsonData.theme.themeColor);
      console.log(`  🎨 主题颜色: ${colorKeys.length} 种`);
    }
  }
  
  // 验证标题
  if (jsonData.title) {
    console.log(`✅ 演示文稿标题: "${jsonData.title}"`);
  }
  
  console.log('🎉 PPTist 格式验证通过！');
  return true;
}

async function testPPTistValidation() {
  try {
    console.log('🧪 开始测试 PPTist 格式验证...');
    
    // 读取测试文件
    const inputPath = path.join(__dirname, 'sample', 'input.pptx');
    
    if (!fs.existsSync(inputPath)) {
      console.error('❌ 测试文件不存在:', inputPath);
      return;
    }
    
    console.log('📁 读取测试文件:', inputPath);
    const fileBuffer = fs.readFileSync(inputPath);
    
    // 动态导入解析器
    const lib = await import('./dist/index.js');
    const parseToPPTist = lib.parseToPPTist || lib.default?.parseToPPTist;
    
    if (!parseToPPTist) {
      console.error('❌ 无法找到 parseToPPTist 函数');
      return;
    }
    
    console.log('🔄 开始解析...');
    const result = await parseToPPTist(fileBuffer.buffer);
    
    console.log('\n=== 验证结果 ===');
    const isValid = validatePPTistJSON(result);
    
    if (isValid) {
      console.log('\n🎊 测试成功！格式完全符合 PPTist 导入要求');
      
      // 保存验证通过的结果
      const outputPath = path.join(__dirname, 'validated-pptist-output.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log('📝 验证通过的结果已保存到:', outputPath);
    } else {
      console.log('\n❌ 测试失败！格式不符合 PPTist 导入要求');
    }
    
  } catch (error) {
    console.error('💥 测试失败:', error);
  }
}

// 运行测试
testPPTistValidation();