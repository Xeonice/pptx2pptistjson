import { ServiceContainer } from './ServiceContainer';
import { FileService } from './core/FileService';
import { XmlParseService } from './core/XmlParseService';
import { ThemeParser } from './parsing/ThemeParser';
import { SlideParser } from './parsing/SlideParser';
import { PresentationParser } from './parsing/PresentationParser';
import { TextProcessor } from './element/processors/TextProcessor';
import { ShapeProcessor } from './element/processors/ShapeProcessor';
import { ImageProcessor } from './element/processors/ImageProcessor';
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
    const slideParser = new SlideParser(fileService, xmlParser);
    
    // Register element processors
    const textProcessor = new TextProcessor(xmlParser);
    const shapeProcessor = new ShapeProcessor(xmlParser);
    const imageDataService = container.resolve<ImageDataService>('ImageDataService');
    const imageProcessor = new ImageProcessor(xmlParser, imageDataService);
    
    slideParser.registerElementProcessor(textProcessor);
    slideParser.registerElementProcessor(shapeProcessor);
    slideParser.registerElementProcessor(imageProcessor);
    
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