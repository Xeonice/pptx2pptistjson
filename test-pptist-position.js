const fs = require('fs');
const { parseToPPTist } = require('./dist/index.cjs');

async function testPPTistPosition() {
  try {
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found.');
      return;
    }
    
    const fileBuffer = fs.readFileSync(sampleFile);
    const result = await parseToPPTist(fileBuffer);
    
    console.log('=== PPTist Format Position Test ===');
    console.log(`Total slides: ${result.slides.length}`);
    
    if (result.slides.length > 0) {
      const firstSlide = result.slides[0];
      console.log(`\nFirst slide has ${firstSlide.elements.length} elements:`);
      
      firstSlide.elements.slice(0, 5).forEach((element, idx) => {
        console.log(`\nElement ${idx + 1}:`);
        console.log(`  Type: ${element.type}`);
        console.log(`  Left: ${element.left}`);
        console.log(`  Top: ${element.top}`);
        console.log(`  Width: ${element.width}`);
        console.log(`  Height: ${element.height}`);
        
        if (element.left === 0 && element.top === 0) {
          console.log('  ⚠️ ZERO POSITION!');
        } else {
          console.log('  ✅ Has position');
        }
      });
    }
    
    // Count zero positions
    let zeroCount = 0;
    let totalCount = 0;
    
    result.slides.forEach(slide => {
      slide.elements.forEach(element => {
        totalCount++;
        if (element.left === 0 && element.top === 0) {
          zeroCount++;
        }
      });
    });
    
    console.log(`\n=== Summary ===`);
    console.log(`Total elements: ${totalCount}`);
    console.log(`Zero position elements: ${zeroCount}`);
    console.log(`Non-zero position elements: ${totalCount - zeroCount}`);
    console.log(`Zero position percentage: ${((zeroCount / totalCount) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPPTistPosition();