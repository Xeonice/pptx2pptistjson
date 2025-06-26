const fs = require('fs');
const { parse } = require('./dist/index.cjs');

async function testSpecificSlide() {
  try {
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found.');
      return;
    }
    
    const fileBuffer = fs.readFileSync(sampleFile);
    const result = await parse(fileBuffer);
    
    // Check a specific slide (e.g., slide 5)
    const slideIndex = 4; // 0-based index
    if (result.slides && result.slides[slideIndex]) {
      const slide = result.slides[slideIndex];
      console.log(`\n=== Slide ${slideIndex + 1} Details ===`);
      console.log(`Number of elements: ${slide.elements ? slide.elements.length : 0}`);
      
      if (slide.elements) {
        slide.elements.forEach((element, idx) => {
          console.log(`\nElement ${idx + 1}:`);
          console.log(`  Type: ${element.type}`);
          console.log(`  ID: ${element.id || 'N/A'}`);
          console.log(`  Name: ${element.name || 'N/A'}`);
          console.log(`  Left: ${element.left}`);
          console.log(`  Top: ${element.top}`);
          console.log(`  Width: ${element.width}`);
          console.log(`  Height: ${element.height}`);
          
          // Check if values are exactly 0 or close to 0
          if (element.left === 0) console.log('  ⚠️  LEFT IS EXACTLY 0');
          if (element.top === 0) console.log('  ⚠️  TOP IS EXACTLY 0');
          if (Math.abs(element.left) < 0.001) console.log('  ⚠️  LEFT IS VERY SMALL');
          if (Math.abs(element.top) < 0.001) console.log('  ⚠️  TOP IS VERY SMALL');
        });
      }
    }
    
    // Also check for any slides with all zero positions
    console.log('\n=== Checking All Slides for Zero Positions ===');
    result.slides.forEach((slide, idx) => {
      if (slide.elements) {
        const zeroElements = slide.elements.filter(el => el.left === 0 && el.top === 0);
        if (zeroElements.length > 0) {
          console.log(`Slide ${idx + 1}: ${zeroElements.length} elements with zero position`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSpecificSlide();