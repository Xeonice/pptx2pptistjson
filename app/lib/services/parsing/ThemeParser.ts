import JSZip from 'jszip';
import { Theme, ColorScheme, FontScheme } from '../../models/domain/Theme';
import { IFileService } from '../interfaces/IFileService';
import { IXmlParseService } from '../interfaces/IXmlParseService';
import { XmlNode } from '../../models/xml/XmlNode';

export class ThemeParser {
  constructor(
    private fileService: IFileService,
    private xmlParser: IXmlParseService
  ) {}

  async parse(zip: JSZip, themePath: string): Promise<Theme> {
    try {
      const themeXml = await this.fileService.extractFile(zip, themePath);
      const themeNode = this.xmlParser.parse(themeXml);
      
      const theme = new Theme('default');
      
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

  private parseColorScheme(themeNode: XmlNode): ColorScheme | undefined {
    const clrSchemeNode = this.xmlParser.findNode(themeNode, 'clrScheme');
    if (!clrSchemeNode) {
      return undefined;
    }

    const colorScheme: Partial<ColorScheme> = {};
    
    // Color mappings
    const colorMappings: Record<string, keyof ColorScheme> = {
      'accent1': 'accent1',
      'accent2': 'accent2',
      'accent3': 'accent3',
      'accent4': 'accent4',
      'accent5': 'accent5',
      'accent6': 'accent6',
      'dk1': 'text1',
      'dk2': 'text2',
      'lt1': 'background1',
      'lt2': 'background2',
      'hlink': 'hyperlink',
      'folHlink': 'followedHyperlink'
    };

    for (const [xmlName, schemeName] of Object.entries(colorMappings)) {
      const colorNode = this.xmlParser.findNode(clrSchemeNode, xmlName);
      if (colorNode) {
        const color = this.extractColor(colorNode);
        if (color) {
          colorScheme[schemeName] = color;
        }
      }
    }

    // Ensure all required colors are present
    const requiredColors: (keyof ColorScheme)[] = [
      'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6',
      'background1', 'background2', 'text1', 'text2', 'hyperlink', 'followedHyperlink'
    ];

    for (const requiredColor of requiredColors) {
      if (!colorScheme[requiredColor]) {
        // Provide default colors
        colorScheme[requiredColor] = this.getDefaultColor(requiredColor);
      }
    }

    return colorScheme as ColorScheme;
  }

  private parseFontScheme(themeNode: XmlNode): FontScheme | undefined {
    const fontSchemeNode = this.xmlParser.findNode(themeNode, 'fontScheme');
    if (!fontSchemeNode) {
      return undefined;
    }

    const majorFontNode = this.xmlParser.findNode(fontSchemeNode, 'majorFont');
    const minorFontNode = this.xmlParser.findNode(fontSchemeNode, 'minorFont');

    return {
      majorFont: {
        latin: this.extractFont(majorFontNode, 'latin') || 'Arial',
        ea: this.extractFont(majorFontNode, 'ea') || 'Arial',
        cs: this.extractFont(majorFontNode, 'cs') || 'Arial'
      },
      minorFont: {
        latin: this.extractFont(minorFontNode, 'latin') || 'Arial',
        ea: this.extractFont(minorFontNode, 'ea') || 'Arial',
        cs: this.extractFont(minorFontNode, 'cs') || 'Arial'
      }
    };
  }

  private extractColor(colorNode: XmlNode): string | undefined {
    // Check for srgbClr
    const srgbNode = this.xmlParser.findNode(colorNode, 'srgbClr');
    if (srgbNode) {
      const val = this.xmlParser.getAttribute(srgbNode, 'val');
      if (val) {
        return `#${val}`;
      }
    }

    // Check for sysClr
    const sysClrNode = this.xmlParser.findNode(colorNode, 'sysClr');
    if (sysClrNode) {
      const val = this.xmlParser.getAttribute(sysClrNode, 'lastClr');
      if (val) {
        return `#${val}`;
      }
    }

    return undefined;
  }

  private extractFont(fontNode: XmlNode | undefined, script: string): string | undefined {
    if (!fontNode) return undefined;
    
    const scriptNode = this.xmlParser.findNode(fontNode, script);
    if (scriptNode) {
      return this.xmlParser.getAttribute(scriptNode, 'typeface');
    }
    
    return undefined;
  }

  private getDefaultColor(colorName: keyof ColorScheme): string {
    const defaults: Record<keyof ColorScheme, string> = {
      accent1: '#4472C4',
      accent2: '#ED7D31',
      accent3: '#A5A5A5',
      accent4: '#FFC000',
      accent5: '#5B9BD5',
      accent6: '#70AD47',
      background1: '#FFFFFF',
      background2: '#F2F2F2',
      text1: '#000000',
      text2: '#666666',
      hyperlink: '#0563C1',
      followedHyperlink: '#954F72'
    };
    
    return defaults[colorName];
  }
}