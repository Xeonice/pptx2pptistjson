import JSZip from "jszip";
import { Theme, ColorScheme, FontScheme } from "../../models/domain/Theme";
import { IFileService } from "../interfaces/IFileService";
import { IXmlParseService } from "../interfaces/IXmlParseService";
import { XmlNode } from "../../models/xml/XmlNode";
import { ColorUtils } from "../utils/ColorUtils";

export class ThemeParser {
  constructor(
    private fileService: IFileService,
    private xmlParser: IXmlParseService
  ) {}

  async parse(zip: JSZip, themePath?: string): Promise<Theme> {
    try {
      // If no themePath provided, find it from presentation relationships
      const actualThemePath = themePath || (await this.findThemePath(zip));

      const themeXml = await this.fileService.extractFile(zip, actualThemePath);
      const themeNode = this.xmlParser.parse(themeXml);

      const theme = new Theme("default");

      // Parse color scheme
      const colorScheme = this.parseColorScheme(themeNode);
      if (colorScheme) {
        theme.setColorScheme(colorScheme);
      }

      // Parse font scheme
      const fontScheme = this.parseFontScheme(themeNode);
      if (fontScheme) {
        theme.setFontScheme(fontScheme);
      }

      return theme;
    } catch (error) {
      throw new Error(`Failed to parse theme: ${(error as Error).message}`);
    }
  }

  private async findThemePath(zip: JSZip): Promise<string> {
    try {
      const presRelsXml = await this.fileService.extractFile(
        zip,
        "ppt/_rels/presentation.xml.rels"
      );
      const presRelsNode = this.xmlParser.parse(presRelsXml);

      // Find theme relationship
      const relationshipsNode = this.xmlParser.findNode(
        presRelsNode,
        "Relationships"
      );
      if (!relationshipsNode) {
        throw new Error("No Relationships node found in presentation.xml.rels");
      }

      const relationships = this.xmlParser.getChildNodes(
        relationshipsNode,
        "Relationship"
      );
      const themeType =
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";

      for (const rel of relationships) {
        const type = this.xmlParser.getAttribute(rel, "Type");
        if (type === themeType) {
          const target = this.xmlParser.getAttribute(rel, "Target");
          if (target) {
            return `ppt/${target}`;
          }
        }
      }

      // Fallback to default theme path
      return "ppt/theme/theme1.xml";
    } catch (error) {
      // If relationships parsing fails, use default theme path
      return "ppt/theme/theme1.xml";
    }
  }

  private parseColorScheme(themeNode: XmlNode): ColorScheme | undefined {
    // Navigate to theme elements and color scheme
    const themeElementsNode = this.xmlParser.findNode(
      themeNode,
      "themeElements"
    );
    if (!themeElementsNode) {
      return undefined;
    }

    const clrSchemeNode = this.xmlParser.findNode(
      themeElementsNode,
      "clrScheme"
    );
    if (!clrSchemeNode) {
      return undefined;
    }

    const colorScheme: Partial<ColorScheme> = {};

    // Color mappings based on OpenXML standards
    const colorMappings: Record<string, keyof ColorScheme> = {
      accent1: "accent1",
      accent2: "accent2",
      accent3: "accent3",
      accent4: "accent4",
      accent5: "accent5",
      accent6: "accent6",
      dk1: "dk1",
      dk2: "dk2",
      lt1: "lt1",
      lt2: "lt2",
      hlink: "hyperlink",
      folHlink: "followedHyperlink",
    };

    // Extract colors using the original logic approach
    for (const [xmlName, schemeName] of Object.entries(colorMappings)) {
      const colorNode = this.xmlParser.findNode(clrSchemeNode, xmlName);
      if (colorNode) {
        const color = this.extractColor(colorNode);
        if (color) {
          colorScheme[schemeName] = color;
        }
      }
    }

    // Ensure all required colors are present with proper defaults
    const requiredColors: (keyof ColorScheme)[] = [
      "accent1",
      "accent2",
      "accent3",
      "accent4",
      "accent5",
      "accent6",
      "dk1",
      "dk2",
      "lt1",
      "lt2",
      "hyperlink",
      "followedHyperlink",
    ];

    for (const requiredColor of requiredColors) {
      if (!colorScheme[requiredColor]) {
        colorScheme[requiredColor] = this.getDefaultColor(requiredColor);
      }
    }

    return colorScheme as ColorScheme;
  }

  private parseFontScheme(themeNode: XmlNode): FontScheme | undefined {
    const fontSchemeNode = this.xmlParser.findNode(themeNode, "fontScheme");
    if (!fontSchemeNode) {
      return undefined;
    }

    const majorFontNode = this.xmlParser.findNode(fontSchemeNode, "majorFont");
    const minorFontNode = this.xmlParser.findNode(fontSchemeNode, "minorFont");

    return {
      majorFont: {
        latin: this.extractFont(majorFontNode, "latin") || "Arial",
        ea: this.extractFont(majorFontNode, "ea") || "Arial",
        cs: this.extractFont(majorFontNode, "cs") || "Arial",
      },
      minorFont: {
        latin: this.extractFont(minorFontNode, "latin") || "Arial",
        ea: this.extractFont(minorFontNode, "ea") || "Arial",
        cs: this.extractFont(minorFontNode, "cs") || "Arial",
      },
    };
  }

  private extractColor(colorNode: XmlNode): string | undefined {
    // Check for srgbClr (RGB color) - most common
    const srgbNode = this.xmlParser.findNode(colorNode, "srgbClr");
    if (srgbNode) {
      const val = this.xmlParser.getAttribute(srgbNode, "val");
      if (val) {
        // Ensure we have a proper 6-character hex value
        const hexColor =
          val.length === 6 ? `#${val}` : `#${val.padStart(6, "0")}`;
        return hexColor;
      }
    }

    // Check for sysClr (system color)
    const sysClrNode = this.xmlParser.findNode(colorNode, "sysClr");
    if (sysClrNode) {
      // Try lastClr first (cached color value)
      let val = this.xmlParser.getAttribute(sysClrNode, "lastClr");
      if (!val) {
        // Fallback to val attribute
        val = this.xmlParser.getAttribute(sysClrNode, "val");
      }
      if (val) {
        // Handle common system colors
        if (val === "windowText" || val === "black") {
          return "#000000";
        } else if (val === "window" || val === "white") {
          return "#FFFFFF";
        } else if (val.length === 6) {
          // Treat as hex color
          return `#${val}`;
        }
      }
    }

    // Check for schemeClr (theme color reference)
    const schemeClrNode = this.xmlParser.findNode(colorNode, "schemeClr");
    if (schemeClrNode) {
      const val = this.xmlParser.getAttribute(schemeClrNode, "val");
      if (val) {
        // Return a default color for scheme colors - these should be resolved at runtime
        return this.getSchemeColorDefault(val);
      }
    }

    return undefined;
  }

  private getSchemeColorDefault(schemeColorName: string): string {
    const schemeDefaults: Record<string, string> = {
      dk1: "#000000",
      lt1: "#FFFFFF",
      dk2: "#666666",
      lt2: "#F2F2F2",
      accent1: "#4472C4",
      accent2: "#ED7D31",
      accent3: "#A5A5A5",
      accent4: "#FFC000",
      accent5: "#5B9BD5",
      accent6: "#70AD47",
      hlink: "#0563C1",
      folHlink: "#954F72",
    };

    return ColorUtils.toRgba(schemeDefaults[schemeColorName] || "#000000");
  }

  private extractFont(
    fontNode: XmlNode | undefined,
    script: string
  ): string | undefined {
    if (!fontNode) return undefined;

    const scriptNode = this.xmlParser.findNode(fontNode, script);
    if (scriptNode) {
      return this.xmlParser.getAttribute(scriptNode, "typeface");
    }

    return undefined;
  }

  private getDefaultColor(colorName: keyof ColorScheme): string {
    const defaults: Record<keyof ColorScheme, string> = {
      accent1: "#4472C4",
      accent2: "#ED7D31",
      accent3: "#A5A5A5",
      accent4: "#FFC000",
      accent5: "#5B9BD5",
      accent6: "#70AD47",
      lt1: "#FFFFFF",
      lt2: "#F2F2F2",
      dk1: "#000000",
      dk2: "#666666",
      hyperlink: "#0563C1",
      followedHyperlink: "#954F72",
    };

    return ColorUtils.toRgba(defaults[colorName]);
  }
}
