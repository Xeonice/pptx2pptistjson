import { ServiceContainer } from './ServiceContainer';
import { FileService } from './core/FileService';
import { XmlParseService } from './core/XmlParseService';
import { ThemeParser } from './parsing/ThemeParser';
import { SlideParser } from './parsing/SlideParser';
import { PresentationParser } from './parsing/PresentationParser';
import { TextProcessor } from './element/processors/TextProcessor';
import { ShapeProcessor } from './element/processors/ShapeProcessor';
import { ImageProcessor } from './element/processors/ImageProcessor';
import { LineProcessor } from './element/processors/LineProcessor';
import { ConnectionShapeProcessor } from './element/processors/ConnectionShapeProcessor';
import { ImageDataService } from './images/ImageDataService';
import { IFileService } from './interfaces/IFileService';
import { IXmlParseService } from './interfaces/IXmlParseService';
import { IPresentationParser } from './interfaces/IPresentationParser';

/**
 * Configure all services in the container
 */
export function configureServices(container: ServiceContainer): void {
  // Register core services
  container.registerFactory<IFileService>('IFileService', () => new FileService());
  container.registerFactory<IXmlParseService>('IXmlParseService', () => new XmlParseService());
  
  // Register image processing services
  container.registerFactory('ImageDataService', () => {
    const fileService = container.resolve<IFileService>('IFileService');
    return new ImageDataService(fileService);
  });
  
  // Register parsing services
  container.registerFactory('ThemeParser', () => {
    const fileService = container.resolve<IFileService>('IFileService');
    const xmlParser = container.resolve<IXmlParseService>('IXmlParseService');
    return new ThemeParser(fileService, xmlParser);
  });
  
  container.registerFactory('SlideParser', () => {
    const fileService = container.resolve<IFileService>('IFileService');
    const xmlParser = container.resolve<IXmlParseService>('IXmlParseService');
    const imageDataService = container.resolve<ImageDataService>('ImageDataService');
    const slideParser = new SlideParser(fileService, xmlParser, imageDataService);
    
    // Register element processors - order matters for priority
    const textProcessor = new TextProcessor(xmlParser);
    const shapeProcessor = new ShapeProcessor(xmlParser);
    const imageProcessor = new ImageProcessor(xmlParser, imageDataService);
    const lineProcessor = new LineProcessor(xmlParser);
    const connectionShapeProcessor = new ConnectionShapeProcessor(xmlParser);
    
    // Image processor has highest priority
    slideParser.registerElementProcessor(imageProcessor);
    // Connection shape processor handles p:cxnSp nodes
    slideParser.registerElementProcessor(connectionShapeProcessor);
    // Line processor handles connection lines
    slideParser.registerElementProcessor(lineProcessor);
    // Text processor handles text boxes (txBox="1") and pure text elements
    slideParser.registerElementProcessor(textProcessor);
    // Shape processor handles shapes with or without text (complete shape elements)
    slideParser.registerElementProcessor(shapeProcessor);
    
    return slideParser;
  });
  
  container.registerFactory<IPresentationParser>('IPresentationParser', () => {
    const fileService = container.resolve<IFileService>('IFileService');
    const xmlParser = container.resolve<IXmlParseService>('IXmlParseService');
    const themeParser = container.resolve<ThemeParser>('ThemeParser');
    const slideParser = container.resolve<SlideParser>('SlideParser');
    
    return new PresentationParser(fileService, xmlParser, themeParser, slideParser);
  });
}

/**
 * Create and configure a new service container
 */
export function createConfiguredContainer(): ServiceContainer {
  const container = new ServiceContainer();
  configureServices(container);
  return container;
}