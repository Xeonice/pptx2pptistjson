/**
 * ImageElement 数据模型增强测试用例
 * 测试 stretchInfo 兼容性、embedId 关联和数据验证
 */

import { ImageElement } from "../../app/lib/models/domain/elements/ImageElement";

describe("ImageElement 数据模型增强测试", () => {
  describe("基础功能测试", () => {
    it("应该正确创建ImageElement实例", () => {
      const imageElement = new ImageElement("img1", "test.jpg", "rId123");

      expect(imageElement.getSrc()).toBe("test.jpg");
      expect(imageElement.getEmbedId()).toBe("rId123");
      expect(imageElement.getId()).toBe("img1");
      expect(imageElement.getType()).toBe("image");
    });

    it("应该正确设置和获取embedId", () => {
      const imageElement = new ImageElement("img2", "test2.jpg");

      expect(imageElement.getEmbedId()).toBeUndefined();

      imageElement.setEmbedId("rId456");
      expect(imageElement.getEmbedId()).toBe("rId456");
    });

    it("应该正确设置和获取Alt文本", () => {
      const imageElement = new ImageElement("img3", "test3.jpg");

      expect(imageElement.getAlt()).toBeUndefined();

      imageElement.setAlt("Test image");
      expect(imageElement.getAlt()).toBe("Test image");
    });
  });

  describe("stretchInfo 功能测试", () => {
    it("应该正确设置和获取stretchInfo", () => {
      const imageElement = new ImageElement("img4", "test4.jpg");
      const stretchInfo = {
        fillRect: { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 },
        srcRect: { left: 0.05, top: 0.05, right: 0.05, bottom: 0.05 },
      };

      expect(imageElement.getStretchInfo()).toBeUndefined();

      imageElement.setStretchInfo(stretchInfo);
      expect(imageElement.getStretchInfo()).toEqual(stretchInfo);
    });

    it("应该从offsetInfo转换为stretchInfo", () => {
      const imageElement = new ImageElement("img5", "test5.jpg");
      const offsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: 10,    // 10%
        topOffsetPercent: 5,      // 5%
        rightOffsetPercent: 15,   // 15%
        bottomOffsetPercent: 8,   // 8%
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };

      imageElement.setOffsetInfo(offsetInfo);

      const stretchInfo = imageElement.getStretchInfo();
      expect(stretchInfo).toBeDefined();
      expect(stretchInfo?.fillRect).toEqual({
        left: 0.1,    // 10% / 100
        top: 0.05,    // 5% / 100
        right: 0.15,  // 15% / 100
        bottom: 0.08, // 8% / 100
      });
    });

    it("应该处理无效的offsetInfo值", () => {
      const imageElement = new ImageElement("img6", "test6.jpg");
      const invalidOffsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: NaN,       // 无效值
        topOffsetPercent: Infinity,   // 无效值
        rightOffsetPercent: 15,
        bottomOffsetPercent: 8,
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };

      imageElement.setOffsetInfo(invalidOffsetInfo);

      const stretchInfo = imageElement.getStretchInfo();
      expect(stretchInfo).toBeUndefined(); // 应该返回undefined因为有无效值
    });

    it("应该处理会导致除零的fillRect值", () => {
      const imageElement = new ImageElement("img7", "test7.jpg");
      const problematicOffsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: 60,   // 60%
        topOffsetPercent: 30,    // 30%
        rightOffsetPercent: 60,  // 60% (总和超过100%)
        bottomOffsetPercent: 30, // 30%
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };

      imageElement.setOffsetInfo(problematicOffsetInfo);

      const stretchInfo = imageElement.getStretchInfo();
      expect(stretchInfo).toBeUndefined(); // 应该返回undefined因为会除零
    });
  });

  describe("offsetInfo 功能测试", () => {
    it("应该正确设置和获取offsetInfo", () => {
      const imageElement = new ImageElement("img8", "test8.jpg");
      const offsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: 10,
        topOffsetPercent: 5,
        rightOffsetPercent: 15,
        bottomOffsetPercent: 8,
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };

      expect(imageElement.getOffsetInfo()).toBeUndefined();

      imageElement.setOffsetInfo(offsetInfo);
      expect(imageElement.getOffsetInfo()).toEqual(offsetInfo);
    });
  });

  describe("图片数据功能测试", () => {
    it("应该正确设置和获取图片数据", () => {
      const imageElement = new ImageElement("img9", "test9.jpg");
      const imageData = {
        format: "png",
        mimeType: "image/png",
        size: 1024,
        width: 200,
        height: 150,
        buffer: Buffer.from("test image data"),
        filename: "test.png",
        hash: "testhash",
      };
      const dataUrl = "data:image/png;base64,testdata";

      expect(imageElement.hasImageData()).toBe(false);

      imageElement.setImageData(imageData, dataUrl);

      expect(imageElement.hasImageData()).toBe(true);
      expect(imageElement.getDataUrl()).toBe(dataUrl);
      expect(imageElement.getFormat()).toBe("png");
      expect(imageElement.getMimeType()).toBe("image/png");
      expect(imageElement.getOriginalSize()).toBe(1024);
    });

    it("应该正确设置和获取长宽比", () => {
      const imageElement = new ImageElement("img10", "test10.jpg");

      expect(imageElement.getAspectRatio()).toBeUndefined();

      imageElement.setAspectRatio(1.5);
      expect(imageElement.getAspectRatio()).toBe(1.5);
    });
  });

  describe("裁剪功能测试", () => {
    it("应该正确设置和获取裁剪信息", () => {
      const imageElement = new ImageElement("img11", "test11.jpg");
      const crop = {
        left: 0.1,
        top: 0.1,
        right: 0.1,
        bottom: 0.1,
      };

      expect(imageElement.getCrop()).toBeUndefined();

      imageElement.setCrop(crop);
      expect(imageElement.getCrop()).toEqual(crop);
    });
  });

  describe("序列化功能测试", () => {
    it("应该正确序列化包含完整信息的ImageElement", () => {
      const imageElement = new ImageElement("img12", "test12.jpg", "rId789");
      
      // 设置位置和尺寸
      imageElement.setPosition({ x: 100, y: 50 });
      imageElement.setSize({ width: 200, height: 150 });
      imageElement.setRotation(15);

      // 设置偏移信息
      const offsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: 10,
        topOffsetPercent: 5,
        rightOffsetPercent: 15,
        bottomOffsetPercent: 8,
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };
      imageElement.setOffsetInfo(offsetInfo);

      // 设置裁剪信息
      const crop = {
        left: 0.05,
        top: 0.05,
        right: 0.05,
        bottom: 0.05,
      };
      imageElement.setCrop(crop);

      const serialized = imageElement.toJSON();

      expect(serialized).toBeDefined();
      expect(serialized.type).toBe("image");
      expect(serialized.id).toBe("img12");
      expect(serialized.left).toBe(100);
      expect(serialized.top).toBe(50);
      expect(serialized.width).toBe(200);
      expect(serialized.height).toBe(150);
      expect(serialized.rotate).toBe(15);
      expect(serialized.fixedRatio).toBe(true);
      expect(serialized.offsetInfo).toBeDefined();
      expect(serialized.offsetInfo.originalPosition).toEqual({ x: 100, y: 50 });
      expect(serialized.offsetInfo.convertedPosition).toEqual({ x: 110, y: 55 });
      expect(serialized.offsetInfo.leftOffsetPercent).toBe(10);
    });

    it("应该正确序列化最小配置的ImageElement", () => {
      const imageElement = new ImageElement("img13", "minimal.jpg");

      const serialized = imageElement.toJSON();

      expect(serialized).toBeDefined();
      expect(serialized.type).toBe("image");
      expect(serialized.id).toBe("img13");
      expect(serialized.fixedRatio).toBe(true);
      expect(serialized.loading).toBe(false);
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该处理空的src参数", () => {
      const imageElement = new ImageElement("img14", "");
      
      expect(imageElement.getSrc()).toBe("");
      expect(imageElement.getId()).toBe("img14");
    });

    it("应该处理undefined的embedId", () => {
      const imageElement = new ImageElement("img15", "test15.jpg", undefined);
      
      expect(imageElement.getEmbedId()).toBeUndefined();
    });

    it("应该处理stretchInfo优先级", () => {
      const imageElement = new ImageElement("img16", "test16.jpg");
      
      // 先设置offsetInfo
      const offsetInfo = {
        leftOffset: 10,
        topOffset: 5,
        rightOffset: 15,
        bottomOffset: 8,
        leftOffsetPercent: 10,
        topOffsetPercent: 5,
        rightOffsetPercent: 15,
        bottomOffsetPercent: 8,
        originalX: 100,
        originalY: 50,
        convertedX: 110,
        convertedY: 55,
      };
      imageElement.setOffsetInfo(offsetInfo);

      // 验证从offsetInfo转换的stretchInfo
      const convertedStretchInfo = imageElement.getStretchInfo();
      expect(convertedStretchInfo).toBeDefined();

      // 再设置直接的stretchInfo
      const directStretchInfo = {
        fillRect: { left: 0.2, top: 0.2, right: 0.2, bottom: 0.2 },
      };
      imageElement.setStretchInfo(directStretchInfo);

      // 直接设置的stretchInfo应该优先
      expect(imageElement.getStretchInfo()).toEqual(directStretchInfo);
    });
  });
});