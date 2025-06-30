import { NextRequest, NextResponse } from "next/server";
import { createCdnStorageService } from "@/lib/services/cdn";

export async function POST(request: NextRequest) {
  console.log("🔄 开始处理 PPTX CDN 上传请求...");

  try {
    // 获取 form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

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

    // Upload to CDN
    console.log("☁️ 开始上传 PPTX 到 CDN...");
    const cdnService = createCdnStorageService();
    
    if (!cdnService.isAvailable()) {
      console.log("❌ CDN 存储不可用");
      return NextResponse.json(
        { error: "CDN storage is not available" },
        { status: 503 }
      );
    }

    const uploadOptions = {
      filename: filename || file.name,
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      access: 'public' as const,
      ttl: 3600 * 24, // 24 hours
      metadata: {
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: fileBuffer.byteLength,
      }
    };

    const uploadResult = await cdnService.uploadBinary(
      new Uint8Array(fileBuffer),
      uploadOptions
    );
    
    console.log("✅ PPTX 上传到 CDN 成功:", uploadResult.url);
    
    return NextResponse.json({
      success: true,
      cdnUrl: uploadResult.url,
      cdnId: uploadResult.id,
      filename: file.name,
      size: uploadResult.size,
      contentType: uploadResult.contentType,
      metadata: uploadResult.metadata,
      provider: cdnService.getPrimaryProvider().name,
    });

  } catch (error) {
    console.error("💥 上传 PPTX 到 CDN 错误:", error);
    return NextResponse.json(
      {
        error: "Failed to upload PPTX to CDN",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}