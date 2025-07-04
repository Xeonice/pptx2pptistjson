import { RotationExtractor } from "../../app/lib/services/utils/RotationExtractor";
import { XmlParseService } from "../../app/lib/services/core/XmlParseService";
import { XmlNode } from "../../app/lib/models/xml/XmlNode";

describe("RotationExtractor", () => {
  let xmlParser: XmlParseService;

  beforeEach(() => {
    xmlParser = new XmlParseService();
  });

  const createMockXmlNode = (
    name: string,
    attributes: Record<string, string> = {},
    children: XmlNode[] = []
  ): XmlNode => ({
    name,
    attributes,
    children,
  });

  describe("extractRotation", () => {
    it("should extract rotation from xfrm node with rot attribute", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "19803009" });

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);

      // 19803009 / 60000 = 330.05015 degrees
      expect(rotation).toBeCloseTo(330.05015, 4);
    });

    it("should return 0 when xfrm node is null", () => {
      const rotation = RotationExtractor.extractRotation(xmlParser, null);
      expect(rotation).toBe(0);
    });

    it("should return 0 when rot attribute is missing", () => {
      const xfrmNode = createMockXmlNode("xfrm", {});

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);
      expect(rotation).toBe(0);
    });

    it("should handle negative rotation values", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "-5400000" });

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);

      // -5400000 / 60000 = -90 degrees (now returns negative value)
      expect(rotation).toBe(-90);
    });

    it("should normalize large rotation values", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "25200000" });

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);

      // 25200000 / 60000 = 420 degrees (now returns values > 360)
      expect(rotation).toBe(420);
    });

    it("should handle rotation value of exactly 360 degrees", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "21600000" });

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);

      // 21600000 / 60000 = 360 degrees (now returns 360)
      expect(rotation).toBe(360);
    });

    it("should return 0 for invalid rotation values", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "not-a-number" });

      const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);
      expect(rotation).toBe(0);
    });

    it("should handle common rotation angles correctly", () => {
      const testCases = [
        { rot: "5400000", expected: 90 },    // 90 degrees
        { rot: "10800000", expected: 180 },  // 180 degrees
        { rot: "16200000", expected: 270 },  // 270 degrees
        { rot: "2700000", expected: 45 },    // 45 degrees
        { rot: "8100000", expected: 135 },   // 135 degrees
        { rot: "13500000", expected: 225 },  // 225 degrees
        { rot: "18900000", expected: 315 },  // 315 degrees
      ];

      testCases.forEach(({ rot, expected }) => {
        const xfrmNode = createMockXmlNode("xfrm", { rot });

        const rotation = RotationExtractor.extractRotation(xmlParser, xfrmNode);
        expect(rotation).toBe(expected);
      });
    });
  });

  describe("extractRotationFromParent", () => {
    it("should extract rotation from parent node containing xfrm", () => {
      const xfrmNode = createMockXmlNode("xfrm", { rot: "5400000" });
      const parentNode = createMockXmlNode("spPr", {}, [xfrmNode]);

      const rotation = RotationExtractor.extractRotationFromParent(xmlParser, parentNode);
      expect(rotation).toBe(90);
    });

    it("should return 0 when parent node is null", () => {
      const rotation = RotationExtractor.extractRotationFromParent(xmlParser, null);
      expect(rotation).toBe(0);
    });

    it("should return 0 when xfrm node is not found", () => {
      const parentNode = createMockXmlNode("spPr", {}, []);

      const rotation = RotationExtractor.extractRotationFromParent(xmlParser, parentNode);
      expect(rotation).toBe(0);
    });
  });

  describe("degreesToPowerPointRotation", () => {
    it("should convert degrees to PowerPoint rotation units", () => {
      expect(RotationExtractor.degreesToPowerPointRotation(0)).toBe(0);
      expect(RotationExtractor.degreesToPowerPointRotation(90)).toBe(5400000);
      expect(RotationExtractor.degreesToPowerPointRotation(180)).toBe(10800000);
      expect(RotationExtractor.degreesToPowerPointRotation(270)).toBe(16200000);
      expect(RotationExtractor.degreesToPowerPointRotation(360)).toBe(21600000);
      expect(RotationExtractor.degreesToPowerPointRotation(45)).toBe(2700000);
      expect(RotationExtractor.degreesToPowerPointRotation(330.05015)).toBe(19803009);
    });

    it("should handle fractional degrees", () => {
      expect(RotationExtractor.degreesToPowerPointRotation(45.5)).toBe(2730000);
      expect(RotationExtractor.degreesToPowerPointRotation(90.25)).toBe(5415000);
    });

    it("should handle negative degrees", () => {
      expect(RotationExtractor.degreesToPowerPointRotation(-90)).toBe(-5400000);
      expect(RotationExtractor.degreesToPowerPointRotation(-45)).toBe(-2700000);
    });
  });

  describe("combineRotations", () => {
    it("should combine multiple rotations", () => {
      expect(RotationExtractor.combineRotations(90, 90)).toBe(180);
      expect(RotationExtractor.combineRotations(180, 180)).toBe(0);
      expect(RotationExtractor.combineRotations(270, 90)).toBe(0);
      expect(RotationExtractor.combineRotations(45, 45, 45)).toBe(135);
    });

    it("should normalize combined rotations", () => {
      expect(RotationExtractor.combineRotations(270, 180)).toBe(90);
      expect(RotationExtractor.combineRotations(360, 90)).toBe(90);
      expect(RotationExtractor.combineRotations(720, 90)).toBe(90);
    });

    it("should handle negative rotations", () => {
      expect(RotationExtractor.combineRotations(90, -45)).toBe(45);
      expect(RotationExtractor.combineRotations(-90, -90)).toBe(180);
      expect(RotationExtractor.combineRotations(180, -270)).toBe(270);
    });

    it("should handle empty rotation list", () => {
      expect(RotationExtractor.combineRotations()).toBe(0);
    });

    it("should handle single rotation", () => {
      expect(RotationExtractor.combineRotations(45)).toBe(45);
      expect(RotationExtractor.combineRotations(390)).toBe(30);
    });
  });
});