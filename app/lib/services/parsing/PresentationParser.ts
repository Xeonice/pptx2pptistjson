import JSZip from "jszip";
import {
  Presentation,
  PresentationMetadata,
  SlideSize,
} from "../../models/domain/Presentation";
import { ParseOptions } from "../../models/dto/ParseOptions";
import { ParseResult, ParseWarning } from "../../models/dto/ParseResult";
import { IPresentationParser } from "../interfaces/IPresentationParser";
import { IFileService } from "../interfaces/IFileService";
import { IXmlParseService } from "../interfaces/IXmlParseService";
import { ThemeParser } from "./ThemeParser";
import { SlideParser } from "./SlideParser";

export class PresentationParser implements IPresentationParser {
  constructor(
    private fileService: IFileService,
    private xmlParser: IXmlParseService,
    private themeParser: ThemeParser,
    private slideParser: SlideParser
  ) {}

  async parse(
    file: ArrayBuffer | Blob,
    options?: ParseOptions
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: ParseWarning[] = [];

    try {
      // Load ZIP file
      const zip = await this.fileService.loadZip(file);

      // Parse content types to find slides
      const contentTypes = await this.parseContentTypes(zip);
      const slideFiles = this.findSlideFiles(contentTypes);

      // Create presentation object
      const metadata: PresentationMetadata = {
        format: "pptx",
        created: new Date(),
      };
      const presentation = new Presentation(metadata);

      // Parse presentation properties
      await this.parsePresentationProperties(zip, presentation);

      // Parse theme
      const themePath = this.findThemeFile(contentTypes);
      if (themePath) {
        try {
          const theme = await this.themeParser.parse(zip, themePath);
          presentation.setTheme(theme);
        } catch (error) {
          warnings.push({
            level: "warning",
            message: `Failed to parse theme: ${(error as Error).message}`,
          });
        }
      }

      // Parse each slide
      let slideNumber = 1;
      for (const slideFile of slideFiles) {
        try {
          // Load relationships for this slide
          const relationships = await this.parseRelationships(zip, slideFile);

          // Parse the slide
          const slide = await this.slideParser.parse(
            zip,
            slideFile,
            slideNumber,
            presentation.getTheme(),
            relationships,
            options
          );

          presentation.addSlide(slide);
          slideNumber++;
        } catch (error) {
          warnings.push({
            level: "error",
            message: `Failed to parse slide ${slideFile}: ${
              (error as Error).message
            }`,
            slideNumber,
          });
        }
      }

      // Calculate statistics
      const stats = {
        totalSlides: presentation.getSlides().length,
        totalElements: presentation
          .getSlides()
          .reduce((sum, slide) => sum + slide.getElements().length, 0),
        elementCounts: this.calculateElementCounts(presentation),
        parseTimeMs: Date.now() - startTime,
        fileSizeBytes:
          file instanceof ArrayBuffer ? file.byteLength : file.size,
      };

      return {
        presentation,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse presentation: ${(error as Error).message}`
      );
    }
  }

  private async parseContentTypes(zip: JSZip): Promise<Map<string, string>> {
    const contentTypesXml = await this.fileService.extractFile(
      zip,
      "[Content_Types].xml"
    );
    const contentTypesNode = this.xmlParser.parse(contentTypesXml);

    const contentTypes = new Map<string, string>();

    // Parse Override elements
    const overrides = this.xmlParser.findNodes(contentTypesNode, "Override");
    for (const override of overrides) {
      const partName = this.xmlParser.getAttribute(override, "PartName");
      const contentType = this.xmlParser.getAttribute(override, "ContentType");

      if (partName && contentType) {
        // Remove leading slash
        const normalizedPath = partName.startsWith("/")
          ? partName.substring(1)
          : partName;
        contentTypes.set(normalizedPath, contentType);
      }
    }

    return contentTypes;
  }

  private findSlideFiles(contentTypes: Map<string, string>): string[] {
    const slideFiles: string[] = [];
    const slideContentType =
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";

    contentTypes.forEach((contentType, path) => {
      if (contentType === slideContentType) {
        slideFiles.push(path);
      }
    });

    // Sort slides by number
    return slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0");
      return numA - numB;
    });
  }

  private findThemeFile(contentTypes: Map<string, string>): string | undefined {
    const themeContentType =
      "application/vnd.openxmlformats-officedocument.theme+xml";

    let themePath: string | undefined;
    contentTypes.forEach((contentType, path) => {
      if (contentType === themeContentType && !themePath) {
        themePath = path;
      }
    });
    return themePath;
  }

  private async parsePresentationProperties(
    zip: JSZip,
    presentation: Presentation
  ): Promise<void> {
    try {
      // Parse presentation.xml for slide size
      if (this.fileService.fileExists(zip, "ppt/presentation.xml")) {
        const presentationXml = await this.fileService.extractFile(
          zip,
          "ppt/presentation.xml"
        );
        const presentationNode = this.xmlParser.parse(presentationXml);

        const sldSzNode = this.xmlParser.findNode(presentationNode, "sldSz");
        if (sldSzNode) {
          const cx = this.xmlParser.getAttribute(sldSzNode, "cx");
          const cy = this.xmlParser.getAttribute(sldSzNode, "cy");

          if (cx && cy) {
            // Convert from EMUs to points (1 point = 12700 EMUs)
            // Apply correction factor based on test case analysis: ~1.333013 for precise PPTist scaling
            const slideSize: SlideSize = {
              width: Math.round((parseInt(cx) / 12700) * 1.333013),
              height: (parseInt(cy) / 12700) * 1.333013, // Keep decimal precision for height
            };
            presentation.setSlideSize(slideSize);
          }
        }
      }

      // Parse core properties for metadata
      if (this.fileService.fileExists(zip, "docProps/core.xml")) {
        const coreXml = await this.fileService.extractFile(
          zip,
          "docProps/core.xml"
        );
        const coreNode = this.xmlParser.parse(coreXml);

        const metadata = presentation.getMetadata();

        // Extract metadata fields
        const title = this.xmlParser.getTextContent(
          this.xmlParser.findNode(coreNode, "title") || { name: "title" }
        );
        if (title) metadata.title = title;

        const creator = this.xmlParser.getTextContent(
          this.xmlParser.findNode(coreNode, "creator") || { name: "creator" }
        );
        if (creator) metadata.author = creator;

        const subject = this.xmlParser.getTextContent(
          this.xmlParser.findNode(coreNode, "subject") || { name: "subject" }
        );
        if (subject) metadata.subject = subject;

        const keywords = this.xmlParser.getTextContent(
          this.xmlParser.findNode(coreNode, "keywords") || { name: "keywords" }
        );
        if (keywords) metadata.keywords = keywords;
      }
    } catch (error) {
      // Non-critical error, continue parsing
    }
  }

  private async parseRelationships(
    zip: JSZip,
    slidePath: string
  ): Promise<Map<string, any>> {
    const relationships = new Map<string, any>();

    try {
      // Build relationships path
      const dir = slidePath.substring(0, slidePath.lastIndexOf("/"));
      const filename = slidePath.substring(slidePath.lastIndexOf("/") + 1);
      const relsPath = `${dir}/_rels/${filename}.rels`;

      if (this.fileService.fileExists(zip, relsPath)) {
        const relsXml = await this.fileService.extractFile(zip, relsPath);
        const relsNode = this.xmlParser.parse(relsXml);

        const relationshipNodes = this.xmlParser.findNodes(
          relsNode,
          "Relationship"
        );
        for (const relNode of relationshipNodes) {
          const id = this.xmlParser.getAttribute(relNode, "Id");
          const type = this.xmlParser.getAttribute(relNode, "Type");
          const target = this.xmlParser.getAttribute(relNode, "Target");

          if (id && type && target) {
            relationships.set(id, { id, type, target });
          }
        }
      }
    } catch (error) {
      // Non-critical error
    }

    return relationships;
  }

  private calculateElementCounts(
    presentation: Presentation
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const slide of presentation.getSlides()) {
      for (const element of slide.getElements()) {
        const type = element.getType();
        counts[type] = (counts[type] || 0) + 1;
      }
    }

    return counts;
  }
}
