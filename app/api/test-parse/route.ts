import { NextRequest, NextResponse } from 'next/server';
import { parse } from '@/lib/pptxtojson';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the sample file
    const filePath = path.join(process.cwd(), 'sample/input.pptx');
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log('Parsing PPTX file in Next.js API...');
    const result = await parse(fileBuffer);
    
    // Check first slide for debugging
    const firstSlide = result.slides[0];
    const debugInfo = {
      totalSlides: result.slides.length,
      firstSlideElements: firstSlide?.elements?.length || 0,
      firstFiveElements: firstSlide?.elements?.slice(0, 5).map(el => ({
        type: el.type,
        name: el.name,
        left: el.left,
        top: el.top,
        width: el.width,
        height: el.height,
        hasPosition: el.left !== 0 || el.top !== 0
      })) || [],
      zeroPositionCount: result.slides.reduce((count, slide) => {
        return count + (slide.elements?.filter(el => el.left === 0 && el.top === 0).length || 0);
      }, 0)
    };
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      result
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }
    
    const buffer = await file.arrayBuffer();
    const result = await parse(buffer);
    
    // Debug info for POST request
    const debugInfo = {
      fileName: file.name,
      fileSize: file.size,
      totalSlides: result.slides.length,
      elementsWithZeroPosition: result.slides.reduce((count, slide) => {
        return count + (slide.elements?.filter(el => el.left === 0 && el.top === 0).length || 0);
      }, 0),
      sampleElements: result.slides[0]?.elements?.slice(0, 3).map(el => ({
        type: el.type,
        left: el.left,
        top: el.top
      })) || []
    };
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      result
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}