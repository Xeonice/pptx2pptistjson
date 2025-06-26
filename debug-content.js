const fs = require('fs');
const { parse } = require('./dist/index.cjs');

async function debugContent() {
  try {
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found.');
      return;
    }
    
    const fileBuffer = fs.readFileSync(sampleFile);
    const result = await parse(fileBuffer);
    
    console.log('=== 原始文本内容调试 ===');
    if (result.slides.length > 0) {
      const firstSlide = result.slides[0];
      console.log(`第一张幻灯片有 ${firstSlide.elements.length} 个元素:`);
      
      firstSlide.elements.forEach((element, idx) => {
        if (element.type === 'text') {
          console.log(`\n--- 文本元素 ${idx + 1} ---`);
          console.log('原始内容:');
          console.log(element.content);
          console.log('内容长度:', element.content?.length || 0);
          console.log('是否包含HTML标签:', element.content?.includes('<') || false);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugContent();