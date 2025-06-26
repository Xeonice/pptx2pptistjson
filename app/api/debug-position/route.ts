import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🔍 调试位置数据...");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    
    // 使用静态导入
    const { parse } = await import("../../../src/pptxtojson");
    const { getPosition, getSize } = await import("../../../src/position");
    
    console.log("📊 开始解析...");
    const result = await parse(fileBuffer);
    
    // 调试第一个幻灯片的第一个元素
    if (result.slides && result.slides[0] && result.slides[0].elements && result.slides[0].elements[0]) {
      const firstElement = result.slides[0].elements[0];
      console.log("第一个元素:", {
        type: firstElement.type,
        name: firstElement.name,
        left: firstElement.left,
        top: firstElement.top,
        leftType: typeof firstElement.left,
        topType: typeof firstElement.top,
        width: firstElement.width,
        height: firstElement.height
      });
    }
    
    // 统计位置数据
    let zeroCount = 0;
    let nonZeroCount = 0;
    const sampleElements = [];
    
    result.slides.forEach((slide, slideIdx) => {
      slide.elements?.forEach((element, elemIdx) => {
        if (element.left === 0 && element.top === 0) {
          zeroCount++;
          if (sampleElements.length < 3) {
            sampleElements.push({
              slideIndex: slideIdx,
              elementIndex: elemIdx,
              type: element.type,
              name: element.name,
              left: element.left,
              top: element.top,
              width: element.width,
              height: element.height
            });
          }
        } else {
          nonZeroCount++;
        }
      });
    });
    
    // 测试 getPosition 函数
    console.log("🔧 测试 getPosition 函数...");
    const testXfrm = {
      'a:off': {
        attrs: {
          x: '1000000',
          y: '2000000'
        }
      }
    };
    const testPosition = getPosition(testXfrm);
    console.log("测试位置结果:", testPosition);
    
    return NextResponse.json({
      success: true,
      debug: {
        totalSlides: result.slides.length,
        totalElements: result.slides.reduce((sum, slide) => sum + (slide.elements?.length || 0), 0),
        zeroPositionCount: zeroCount,
        nonZeroPositionCount: nonZeroCount,
        zeroPositionPercentage: ((zeroCount / (zeroCount + nonZeroCount)) * 100).toFixed(2) + '%',
        sampleZeroElements: sampleElements,
        testPositionResult: testPosition,
        firstSlideFirstElement: result.slides[0]?.elements?.[0] || null
      },
      result
    });
    
  } catch (error) {
    console.error("💥 调试错误:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}