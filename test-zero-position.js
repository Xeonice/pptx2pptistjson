const fs = require('fs');
const { parse } = require('./dist/index.cjs');

async function testZeroPosition() {
  try {
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found.');
      return;
    }
    
    const fileBuffer = fs.readFileSync(sampleFile);
    const result = await parse(fileBuffer);
    
    let zeroPositionCount = 0;
    let nonZeroPositionCount = 0;
    let totalElements = 0;
    
    console.log('\n=== Position Analysis ===');
    
    result.slides.forEach((slide, slideIndex) => {
      if (slide.elements && slide.elements.length > 0) {
        slide.elements.forEach((element) => {
          totalElements++;
          
          if (element.left === 0 && element.top === 0) {
            zeroPositionCount++;
            console.log(`\n[ZERO POSITION] Slide ${slideIndex + 1}:`);
            console.log(`  Type: ${element.type}`);
            console.log(`  Name: ${element.name || 'N/A'}`);
            console.log(`  Position: left=${element.left}, top=${element.top}`);
            console.log(`  Size: width=${element.width}, height=${element.height}`);
          } else {
            nonZeroPositionCount++;
          }
        });
      }
    });
    
    console.log('\n=== Summary ===');
    console.log(`Total elements: ${totalElements}`);
    console.log(`Elements with zero position: ${zeroPositionCount}`);
    console.log(`Elements with non-zero position: ${nonZeroPositionCount}`);
    console.log(`Percentage with zero position: ${((zeroPositionCount / totalElements) * 100).toFixed(2)}%`);
    
    // Show first 5 non-zero positioned elements
    console.log('\n=== Sample Non-Zero Positioned Elements ===');
    let shown = 0;
    for (const slide of result.slides) {
      for (const element of slide.elements || []) {
        if ((element.left !== 0 || element.top !== 0) && shown < 5) {
          console.log(`\nElement: ${element.type} - ${element.name}`);
          console.log(`  Position: left=${element.left}, top=${element.top}`);
          console.log(`  Size: width=${element.width}, height=${element.height}`);
          shown++;
        }
      }
      if (shown >= 5) break;
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testZeroPosition();