import { FillExtractor } from '../../app/lib/services/utils/FillExtractor';
import { ColorUtils } from '../../app/lib/services/utils/ColorUtils';

describe('FillExtractor', () => {
  describe('getSolidFill', () => {
    it('should extract direct RGB color', () => {
      const solidFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toBe("rgba(255,0,0,1)");
    });

    it('should extract preset color', () => {
      const solidFill = {
        "a:prstClr": {
          attrs: { val: "red" }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toBe("rgba(255,0,0,1)");
    });

    it('should extract HSL color', () => {
      const solidFill = {
        "a:hslClr": {
          attrs: { 
            hue: "0", 
            sat: "100%", 
            lum: "50%" 
          }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toBe("rgba(255,0,0,1)");
    });

    it('should apply alpha transformation', () => {
      const solidFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:alpha": {
            attrs: { val: "50000" } // 50% alpha
          }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toBe("rgba(255,0,0,0.5)");
    });

    it('should apply tint transformation', () => {
      const solidFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:tint": {
            attrs: { val: "50000" } // 50% tint (lighter)
          }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toMatch(/rgba\(255,12[78],12[78],1\)/);
    });

    it('should apply shade transformation', () => {
      const solidFill = {
        "a:srgbClr": {
          attrs: { val: "FF0000" },
          "a:shade": {
            attrs: { val: "50000" } // 50% shade (darker)
          }
        }
      };

      const result = FillExtractor.getSolidFill(solidFill);
      expect(result).toMatch(/rgba\(12[78],0,0,1\)/);
    });

    it('should return empty string for missing solidFill', () => {
      const result = FillExtractor.getSolidFill(null);
      expect(result).toBe("");
    });

    it('should handle empty solidFill object', () => {
      const result = FillExtractor.getSolidFill({});
      expect(result).toBe("");
    });
  });

  describe('getFillColor', () => {
    it('should extract solid fill color from spPr', () => {
      const spPr = {
        "a:solidFill": {
          "a:srgbClr": {
            attrs: { val: "00FF00" }
          }
        }
      };

      const result = FillExtractor.getFillColor(spPr);
      expect(result).toBe("rgba(0,255,0,1)");
    });

    it('should return transparent for noFill', () => {
      const spPr = {
        "a:noFill": {}
      };

      const result = FillExtractor.getFillColor(spPr);
      expect(result).toBe("rgba(0,0,0,0)");
    });

    it('should return empty string for no fill specified', () => {
      const spPr = {};

      const result = FillExtractor.getFillColor(spPr);
      expect(result).toBe("");
    });
  });
});

describe('ColorUtils', () => {
  describe('New transformation functions', () => {
    it('should apply shade transformation', () => {
      const result = ColorUtils.applyShade("rgba(255,0,0,1)", 0.5);
      expect(result).toBe("rgba(127,0,0,1)");
    });

    it('should apply tint transformation', () => {
      const result = ColorUtils.applyTint("rgba(255,0,0,1)", 0.5);
      expect(result).toBe("rgba(255,127,127,1)");
    });

    it('should apply alpha transformation', () => {
      const result = ColorUtils.applyAlpha("rgba(255,0,0,1)", 0.5);
      expect(result).toBe("rgba(255,0,0,0.5)");
    });

    it('should get preset color', () => {
      const result = ColorUtils.getPresetColor("red");
      expect(result).toBe("#FF0000");
    });

    it('should return null for unknown preset color', () => {
      const result = ColorUtils.getPresetColor("unknownColor");
      expect(result).toBeNull();
    });

    it('should convert HSL to RGB', () => {
      const result = ColorUtils.hslToRgb(0, 1, 0.5); // Red
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });
  });
});