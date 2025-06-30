import JSZip from 'jszip';
import { Slide, SlideBackground } from '../../models/domain/Slide';
import { Theme } from '../../models/domain/Theme';
import { IFileService } from '../interfaces/IFileService';
import { IXmlParseService } from '../interfaces/IXmlParseService';
import { XmlNode } from '../../models/xml/XmlNode';
import { ProcessingContext } from '../interfaces/ProcessingContext';
import { IElementProcessor } from '../interfaces/IElementProcessor';
import { Element } from '../../models/domain/elements/Element';
import { IdGenerator } from '../utils/IdGenerator';
import { ColorUtils } from '../utils/ColorUtils';
import { ImageDataService } from '../images/ImageDataService';

export class SlideParser {
  private elementProcessors: Map<string, IElementProcessor> = new Map();

  constructor(
    private fileService: IFileService,
    private xmlParser: IXmlParseService,
    private imageDataService?: ImageDataService
  ) {}

  registerElementProcessor(processor: IElementProcessor): void {
    this.elementProcessors.set(processor.getElementType(), processor);
  }

  async parse(
    zip: JSZip,
    slidePath: string,
    slideNumber: number,
    theme?: Theme,
    relationships?: Map<string, any>
  ): Promise<Slide> {
    try {
      const slideXml = await this.fileService.extractFile(zip, slidePath);
      
      const slideNode = this.xmlParser.parse(slideXml);
      
      // Extract slide ID from path
      const slideId = this.extractSlideId(slidePath);
      const slide = new Slide(slideId, slideNumber);
      
      // Create processing context
      const context: ProcessingContext = {
        zip,
        slideNumber,
        slideId,
        theme,
        relationships: relationships || new Map(),
        basePath: slidePath.substring(0, slidePath.lastIndexOf('/')),
        options: {},
        warnings: [],
        idGenerator: new IdGenerator()
      };
      
      // Parse background
      const background = await this.parseBackground(slideNode, context);
      if (background) {
        slide.setBackground(background);
      }
      
      // Parse elements
      const elements = await this.parseElements(slideNode, context);
      
      elements.forEach(element => {
        slide.addElement(element);
      });
      
      return slide;
    } catch (error) {
      throw new Error(`Failed to parse slide ${slidePath}: ${(error as Error).message}`);
    }
  }

  private extractSlideId(slidePath: string): string {
    const match = slidePath.match(/slide(\d+)\.xml$/);
    return match ? match[1] : 'unknown';
  }

  private async parseBackground(slideNode: XmlNode, context: ProcessingContext): Promise<SlideBackground | undefined> {
    const bgNode = this.xmlParser.findNode(slideNode, 'bg');
    if (!bgNode) {
      return undefined;
    }

    const bgPrNode = this.xmlParser.findNode(bgNode, 'bgPr');
    if (!bgPrNode) {
      return undefined;
    }

    // Check for solid fill
    const solidFillNode = this.xmlParser.findNode(bgPrNode, 'solidFill');
    if (solidFillNode) {
      const color = this.extractColor(solidFillNode);
      if (color) {
        return {
          type: 'solid',
          color
        };
      }
    }

    // Check for gradient fill
    const gradFillNode = this.xmlParser.findNode(bgPrNode, 'gradFill');
    if (gradFillNode) {
      const colors = this.extractGradientColors(gradFillNode);
      if (colors.length > 0) {
        return {
          type: 'gradient',
          colors
        };
      }
    }

    // Check for image fill
    const blipFillNode = this.xmlParser.findNode(bgPrNode, 'blipFill');
    if (blipFillNode) {
      const blipNode = this.xmlParser.findNode(blipFillNode, 'blip');
      if (blipNode) {
        const embedId = this.xmlParser.getAttribute(blipNode, 'r:embed');
        if (embedId) {
          // Try to extract actual image data if ImageDataService is available
          if (this.imageDataService) {
            try {
              const imageData = await this.imageDataService.extractImageData(embedId, context);
              if (imageData) {
                const dataUrl = this.imageDataService.encodeToBase64(imageData);
                return {
                  type: 'image',
                  imageUrl: dataUrl,
                  imageData: imageData // Store raw data for potential cloud upload
                };
              }
            } catch (error) {
              console.warn(`Failed to process background image data for ${embedId}:`, error);
              // Fall back to relationship-based URL
            }
          }
          
          // Fallback: resolve from relationships for backward compatibility
          let resolvedUrl = embedId;
          if (context.relationships.has(embedId)) {
            const rel = context.relationships.get(embedId);
            if (rel && rel.target) {
              resolvedUrl = rel.target;
            }
          }
          
          return {
            type: 'image',
            imageUrl: resolvedUrl
          };
        }
      }
    }

    return undefined;
  }

  private async parseElements(slideNode: XmlNode, context: ProcessingContext): Promise<Element[]> {
    const elements: Element[] = [];
    const spTreeNode = this.xmlParser.findNode(slideNode, 'spTree');
    
    if (!spTreeNode || !spTreeNode.children) {
      return elements;
    }

    for (const child of spTreeNode.children) {
      const element = await this.processNode(child, context);
      if (element) {
        elements.push(element);
      }
    }

    return elements;
  }

  private async processNode(node: XmlNode, context: ProcessingContext): Promise<Element | undefined> {
    // Debug logging for node processing
    if (node.name.endsWith('sp') || node.name.endsWith('pic')) {
      const cNvPrNode = this.xmlParser.findNode(node, 'cNvPr');
      const name = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'name') : 'unnamed';
      const id = cNvPrNode ? this.xmlParser.getAttribute(cNvPrNode, 'id') : 'no-id';
      
      // Check for blipFill
      const hasBlipFill = !!this.xmlParser.findNode(node, 'blipFill') || 
                          (this.xmlParser.findNode(node, 'spPr') && 
                           !!this.xmlParser.findNode(this.xmlParser.findNode(node, 'spPr')!, 'blipFill'));
      
      console.log(`[Slide ${context.slideNumber}] Processing ${node.name} - Name: "${name}", ID: ${id}, HasBlipFill: ${hasBlipFill}`);
    }
    
    // Find a processor that can handle this node
    const processors = Array.from(this.elementProcessors.values());
    
    for (const processor of processors) {
      if (processor.canProcess(node)) {
        try {
          const result = await processor.process(node, context);
          console.log(`[Slide ${context.slideNumber}] Processed as ${processor.getElementType()}`);
          return result;
        } catch (error) {
          console.error(`处理器 ${processor.getElementType()} 处理 ${node.name} 失败:`, error);
          context.warnings.push({
            level: 'error',
            message: `Failed to process ${node.name}: ${(error as Error).message}`,
            slideNumber: context.slideNumber
          });
        }
      }
    }

    // Handle group nodes recursively
    if (node.name.endsWith('grpSp') && node.children) {
      const groupElements: Element[] = [];
      for (const child of node.children) {
        const element = await this.processNode(child, context);
        if (element) {
          groupElements.push(element);
        }
      }
      // For now, we'll flatten groups - in a full implementation,
      // we'd create a GroupElement to maintain hierarchy
      return groupElements.length > 0 ? groupElements[0] : undefined;
    }

    return undefined;
  }

  private extractColor(fillNode: XmlNode): string | undefined {
    // Check for srgbClr
    const srgbNode = this.xmlParser.findNode(fillNode, 'srgbClr');
    if (srgbNode) {
      const val = this.xmlParser.getAttribute(srgbNode, 'val');
      if (val) {
        return ColorUtils.toRgba(`#${val}`);
      }
    }

    // Check for schemeClr
    const schemeClrNode = this.xmlParser.findNode(fillNode, 'schemeClr');
    if (schemeClrNode) {
      const val = this.xmlParser.getAttribute(schemeClrNode, 'val');
      if (val) {
        // This would need theme color resolution
        return val;
      }
    }

    return undefined;
  }

  private extractGradientColors(gradFillNode: XmlNode): Array<{ color: string; position: number }> {
    const colors: Array<{ color: string; position: number }> = [];
    const gsLstNode = this.xmlParser.findNode(gradFillNode, 'gsLst');
    
    if (!gsLstNode || !gsLstNode.children) {
      return colors;
    }

    for (const gsNode of gsLstNode.children) {
      if (gsNode.name.endsWith('gs')) {
        const pos = this.xmlParser.getAttribute(gsNode, 'pos');
        const color = this.extractColor(gsNode);
        
        if (pos && color) {
          colors.push({
            color,
            position: parseInt(pos) / 100000
          });
        }
      }
    }

    return colors.sort((a, b) => a.position - b.position);
  }
}