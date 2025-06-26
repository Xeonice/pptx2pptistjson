import { NextRequest, NextResponse } from "next/server";
import { parse as parsePPTX, parseToPPTist } from "../../../src";

export async function POST(request: NextRequest) {
  console.log("🔄 开始处理 PPTX 解析请求...");

  try {
    // 获取 form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log("📁 接收到文件:", {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    });

    if (!file) {
      console.log("❌ 没有文件上传");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file extension
    if (!file.name?.toLowerCase().endsWith(".pptx")) {
      console.log("❌ 文件类型错误:", file.name);
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .pptx file" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    console.log("📦 文件转换为 ArrayBuffer, 大小:", fileBuffer.byteLength);

    // 获取输出格式参数
    const format = (formData.get("format") as string) || "legacy";
    console.log("🎯 输出格式:", format);

    console.log("🔄 开始解析 PPTX 文件...");
    console.log("文件大小:", fileBuffer.byteLength);
    console.log("文件名称:", file.name);
    console.log("输出格式:", format);

    // Parse the PPTX file using our library
    let jsonResult;
    if (format === "pptist" && parseToPPTist) {
      console.log("🎨 使用 PPTist 格式解析...");
      jsonResult = await parseToPPTist(fileBuffer);
    } else {
      console.log("📊 使用传统格式解析...");
      jsonResult = await parsePPTX(fileBuffer);
    }

    console.log("✅ 解析完成");
    console.log("解析结果类型:", typeof jsonResult);
    console.log("解析结果键名:", Object.keys(jsonResult || {}));

    // 调试位置信息
    if (jsonResult && jsonResult.slides && jsonResult.slides.length > 0) {
      const firstSlide = jsonResult.slides[0];
      if (firstSlide.elements && firstSlide.elements.length > 0) {
        console.log("🔍 第一个幻灯片的前3个元素位置:");
        firstSlide.elements.slice(0, 3).forEach((el: any, idx: number) => {
          console.log(`元素 ${idx + 1}:`, {
            type: el.type,
            name: el.name,
            left: el.left,
            top: el.top,
            width: el.width,
            height: el.height,
          });
        });
      }
    }

    const response = {
      success: true,
      data: jsonResult,
      filename: file.name,
      debug: {
        fileSize: fileBuffer.byteLength,
        resultType: typeof jsonResult,
        resultKeys: Object.keys(jsonResult || {}),
        hasData: !!jsonResult,
      },
    };

    console.log("🎉 API 响应准备完成");
    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 解析 PPTX 错误:", error);
    return NextResponse.json(
      {
        error: "Failed to parse PPTX file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
