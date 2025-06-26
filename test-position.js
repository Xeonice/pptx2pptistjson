const fs = require('fs');
const { parse } = require('./dist/index.cjs');

async function testPosition() {
  try {
    // Check if sample file exists
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found. Please provide a PPTX file for testing.');
      return;
    }
    
    // Read the PPTX file
    const fileBuffer = fs.readFileSync(sampleFile);
    
    // Parse the file
    console.log('Parsing PPTX file...');
    const result = await parse(fileBuffer);
    
    // Check positions in the first slide
    if (result.slides && result.slides.length > 0) {
      const firstSlide = result.slides[0];
      console.log('\n=== First Slide Elements ===');
      
      if (firstSlide.elements && firstSlide.elements.length > 0) {
        firstSlide.elements.forEach((element, index) => {
          console.log(`\nElement ${index + 1}:`);
          console.log(`  Type: ${element.type}`);
          console.log(`  Name: ${element.name || 'N/A'}`);
          console.log(`  Position: left=${element.left}, top=${element.top}`);
          console.log(`  Size: width=${element.width}, height=${element.height}`);
          
          if (element.type === 'text' && element.content) {
            console.log(`  Text: ${element.content.substring(0, 50)}...`);
          }
        });
      } else {
        console.log('No elements found in the first slide.');
      }
    } else {
      console.log('No slides found in the PPTX file.');
    }
    
  } catch (error) {
    console.error('Error testing position:', error);
  }
}

testPosition();