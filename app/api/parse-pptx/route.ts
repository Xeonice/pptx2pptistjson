import { NextRequest, NextResponse } from "next/server";
import { pptxParser } from "@/lib/parser/InternalPPTXParser";
import { createCdnStorageService } from "@/lib/services/cdn";

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

    debugger;
    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    console.log("📦 文件转换为 ArrayBuffer, 大小:", fileBuffer.byteLength);

    // 获取输出格式参数
    const format = (formData.get("format") as string) || "legacy";
    // 获取 CDN 存储选项
    const useCdn = formData.get("useCdn") === "true";
    const cdnFilename = formData.get("cdnFilename") as string;
    console.log("🎯 输出格式:", format);
    console.log("☁️ 使用 CDN 存储:", useCdn);

    console.log("🔄 开始解析 PPTX 文件...");
    console.log("文件大小:", fileBuffer.byteLength);
    console.log("文件名称:", file.name);
    console.log("输出格式:", format);

    // Parse the PPTX file using our internal parser
    console.log("📊 使用内部解析器解析...");
    const jsonResult = await pptxParser.parseToJSON(fileBuffer);

    console.log("✅ 解析完成");
    console.log("解析结果类型:", typeof jsonResult);
    console.log("解析结果键名:", Object.keys(jsonResult || {}));

    // 调试位置信息
    if (jsonResult && jsonResult.slides && jsonResult.slides.length > 0) {
      const firstSlide = jsonResult.slides[0];
      if (firstSlide.elements && firstSlide.elements.length > 0) {
        console.log("🔍 第一个幻灯片的前3个元素位置:");
        firstSlide.elements.slice(0, 3).forEach((el, idx) => {
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

    let response: any = {
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

    // 如果启用 CDN 存储，上传 JSON 到 CDN
    if (useCdn) {
      try {
        console.log("☁️ 开始上传 JSON 到 CDN...");
        const cdnService = createCdnStorageService();
        
        if (cdnService.isAvailable()) {
          const uploadOptions = {
            filename: cdnFilename || `pptx-result-${Date.now()}.json`,
            contentType: 'application/json',
            access: 'public' as const,
            ttl: 3600 * 24, // 24 hours
            metadata: {
              originalFilename: file.name,
              uploadedAt: new Date().toISOString(),
              format,
            }
          };

          const uploadResult = await cdnService.uploadJSON(jsonResult, uploadOptions);
          
          console.log("✅ JSON 上传到 CDN 成功:", uploadResult.url);
          
          // 替换响应数据为 CDN URL 引用
          response = {
            success: true,
            cdnUrl: uploadResult.url,
            cdnId: uploadResult.id,
            filename: file.name,
            size: uploadResult.size,
            contentType: uploadResult.contentType,
            metadata: uploadResult.metadata,
            debug: {
              fileSize: fileBuffer.byteLength,
              cdnProvider: cdnService.getPrimaryProvider().name,
              uploadedAt: new Date().toISOString(),
            },
          };
        } else {
          console.warn("⚠️ CDN 存储不可用，回退到直接返回 JSON");
        }
      } catch (cdnError) {
        console.error("💥 CDN 上传失败:", cdnError);
        // 添加 CDN 错误信息但继续返回原始数据
        response.cdnError = {
          message: "CDN upload failed, returning JSON directly",
          details: cdnError instanceof Error ? cdnError.message : String(cdnError),
        };
      }
    }

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
