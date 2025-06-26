const fs = require('fs');
const { parseToPPTist } = require('./dist/index.cjs');

async function generateCurrentOutput() {
  try {
    const sampleFile = './sample/input.pptx';
    if (!fs.existsSync(sampleFile)) {
      console.log('Sample file not found.');
      return;
    }
    
    const fileBuffer = fs.readFileSync(sampleFile);
    const result = await parseToPPTist(fileBuffer);
    
    // Save current output
    fs.writeFileSync('./current-pptist-output.json', JSON.stringify(result, null, 2));
    console.log('✅ Current output saved to current-pptist-output.json');
    
    // Show first slide elements for comparison
    if (result.slides.length > 0) {
      const firstSlide = result.slides[0];
      console.log('\n=== First Slide Elements ===');
      firstSlide.elements.slice(0, 3).forEach((element, idx) => {
        console.log(`Element ${idx + 1}:`, {
          type: element.type,
          tag: element.tag,
          left: element.left,
          top: element.top,
          width: element.width,
          height: element.height
        });
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateCurrentOutput();