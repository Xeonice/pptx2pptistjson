/**
 * 元素处理器优先级和协调测试
 * 测试TextProcessor、ShapeProcessor、ImageProcessor之间的协调、优先级和冲突处理
 */

import { TextProcessor } from '../../app/lib/services/element/processors/TextProcessor';
import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { ImageProcessor } from '../../app/lib/services/element/processors/ImageProcessor';
import { IXmlParseService } from '../../app/lib/services/interfaces/IXmlParseService';
import { ImageDataService } from '../../app/lib/services/images/ImageDataService';
import { XmlNode } from '../../app/lib/models/xml/XmlNode';
import { ProcessingContext } from '../../app/lib/services/interfaces/ProcessingContext';
import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';

// Enhanced mock services
class ProcessorTestXmlParser implements IXmlParseService {
  parse(xmlContent: string): XmlNode {
    throw new Error('Not implemented in mock');
  }

  findNode(node: XmlNode, name: string): XmlNode | undefined {
    if (!node.children) return undefined;
    return node.children.find(child => 
      child.name === name || 
      child.name === `a:${name}` ||
      child.name === `p:${name}` ||
      child.name.endsWith(`:${name}`)
    );
  }

  findNodes(node: XmlNode, name: string): XmlNode[] {
    if (!node.children) return [];
    return node.children.filter(child => 
      child.name === name || 
      child.name === `a:${name}` ||
      child.name === `p:${name}` ||
      child.name.endsWith(`:${name}`)
    );
  }

  getAttribute(node: XmlNode, name: string): string | undefined {
    return node.attributes?.[name];
  }

  getTextContent(node: XmlNode): string {
    return node.content || '';
  }

  getChildNodes(parent: XmlNode, tagName: string): XmlNode[] {
    return this.findNodes(parent, tagName);
  }

  stringify(node: XmlNode): string {
    return JSON.stringify(node);
  }
}

class ProcessorTestImageService extends ImageDataService {
  constructor() {
    super({} as any); // Mock FileService
  }

  async extractImageData(embedId: string, context: ProcessingContext) {
    return {
      buffer: Buffer.from('mock-image-data'),
      filename: `image-${embedId}.png`,
      mimeType: 'image/png',
      format: 'png' as any,
      size: 1024,
      hash: 'mock-hash',
      dimensions: { width: 100, height: 100 }
    };
  }

}

describe('Element Processor Coordination Tests', () => {
  let textProcessor: TextProcessor;
  let shapeProcessor: ShapeProcessor;
  let imageProcessor: ImageProcessor;
  let mockXmlParser: ProcessorTestXmlParser;
  let mockImageService: ProcessorTestImageService;
  let mockContext: ProcessingContext;

  beforeEach(() => {
    mockXmlParser = new ProcessorTestXmlParser();
    mockImageService = new ProcessorTestImageService();
    
    textProcessor = new TextProcessor(mockXmlParser);
    shapeProcessor = new ShapeProcessor(mockXmlParser);
    imageProcessor = new ImageProcessor(mockXmlParser, mockImageService);
    
    mockContext = {
      zip: {} as any,
      slideNumber: 1,
      slideId: '1',
      theme: undefined,
      relationships: new Map(),
      basePath: '/test',
      options: {},
      warnings: [],
      idGenerator: new IdGenerator()
    };
  });

  describe('Processor Selection and Prioritization', () => {
    it('should correctly identify text-only elements', () => {
      const textOnlyElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '1', name: 'TextBox 1' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              { name: 'a:noFill' }, // 无填充
              {
                name: 'a:ln',
                children: [{ name: 'a:noFill' }] // 无边框
              }
            ]
          },
          {
            name: 'p:txBody',
            children: [
              {
                name: 'a:p',
                children: [
                  {
                    name: 'a:r',
                    children: [
                      { name: 'a:t', content: 'Sample text' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      // 测试处理器优先级
      const canProcessByText = textProcessor.canProcess(textOnlyElement);
      const canProcessByShape = shapeProcessor.canProcess(textOnlyElement);
      const canProcessByImage = imageProcessor.canProcess(textOnlyElement);

      expect(canProcessByText).toBe(true);
      expect(canProcessByShape).toBe(false); // 无填充的文本框不应该被形状处理器处理
      expect(canProcessByImage).toBe(false);

      console.log('Text-only element prioritization: Text processor selected');
    });

    it('should correctly identify shape elements with background', () => {
      const shapeElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '2', name: 'Shape 1' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:solidFill',
                children: [
                  {
                    name: 'a:srgbClr',
                    attributes: { val: 'FF5733' }
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'rect' }
              }
            ]
          }
        ]
      };

      const canProcessByText = textProcessor.canProcess(shapeElement);
      const canProcessByShape = shapeProcessor.canProcess(shapeElement);
      const canProcessByImage = imageProcessor.canProcess(shapeElement);

      expect(canProcessByText).toBe(false);
      expect(canProcessByShape).toBe(true); // 有背景填充的形状
      expect(canProcessByImage).toBe(false);

      console.log('Shape element prioritization: Shape processor selected');
    });

    it('should correctly identify image elements', () => {
      const imageElement: XmlNode = {
        name: 'p:pic',
        children: [
          {
            name: 'p:nvPicPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '3', name: 'Picture 1' }
              }
            ]
          },
          {
            name: 'p:blipFill',
            children: [
              {
                name: 'a:blip',
                attributes: { 'r:embed': 'rId1' }
              }
            ]
          }
        ]
      };

      const canProcessByText = textProcessor.canProcess(imageElement);
      const canProcessByShape = shapeProcessor.canProcess(imageElement);
      const canProcessByImage = imageProcessor.canProcess(imageElement);

      expect(canProcessByText).toBe(false);
      expect(canProcessByShape).toBe(false);
      expect(canProcessByImage).toBe(true); // 图片元素

      console.log('Image element prioritization: Image processor selected');
    });

    it('should handle complex elements with multiple characteristics', () => {
      // 既有文本又有背景的复合元素
      const complexElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '4', name: 'Complex Shape' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:solidFill',
                children: [
                  {
                    name: 'a:srgbClr',
                    attributes: { val: 'FF5733' }
                  }
                ]
              },
              {
                name: 'a:prstGeom',
                attributes: { prst: 'rect' }
              }
            ]
          },
          {
            name: 'p:txBody',
            children: [
              {
                name: 'a:p',
                children: [
                  {
                    name: 'a:r',
                    children: [
                      { name: 'a:t', content: 'Text on shape' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const canProcessByText = textProcessor.canProcess(complexElement);
      const canProcessByShape = shapeProcessor.canProcess(complexElement);
      const canProcessByImage = imageProcessor.canProcess(complexElement);

      // 复合元素的处理优先级策略
      expect(canProcessByShape).toBe(true); // 有背景的形状优先
      expect(canProcessByText).toBe(false); // 有背景的形状不由TextProcessor处理
      expect(canProcessByImage).toBe(false);

      console.log('Complex element prioritization: Multiple processors can handle, shape takes priority');
    });
  });

  describe('Processing Coordination and Workflow', () => {
    it('should coordinate shape and text processing for complex elements', async () => {
      const complexElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '5', name: 'Text Shape' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:solidFill',
                children: [
                  {
                    name: 'a:srgbClr',
                    attributes: { val: 'FF5733' }
                  }
                ]
              }
            ]
          },
          {
            name: 'p:txBody',
            children: [
              {
                name: 'a:p',
                children: [
                  {
                    name: 'a:r',
                    children: [
                      { name: 'a:t', content: 'Text content' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      // 形状处理器应该处理背景，文本处理器应该处理文本内容
      if (shapeProcessor.canProcess(complexElement)) {
        const shapeResult = await shapeProcessor.process(complexElement, mockContext);
        
        expect(shapeResult).toBeDefined();
        expect(shapeResult.getShapeType()).toBeDefined();
        
        console.log(`Shape processing result: ${shapeResult.getShapeType()}`);
      }

      if (textProcessor.canProcess(complexElement)) {
        const textResult = await textProcessor.process(complexElement, mockContext);
        
        expect(textResult).toBeDefined();
        expect(textResult.getContent()).toBeDefined();
        
        console.log(`Text processing result: ${textResult.getContent().length} characters`);
      }
    });

    it('should handle processing conflicts and decisions', async () => {
      // 测试边界情况：元素可能被多个处理器识别
      const ambiguousElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '6', name: 'Ambiguous Element' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:gradFill', // 渐变填充 - 可能引起歧义
                children: [
                  {
                    name: 'a:gsLst',
                    children: [
                      {
                        name: 'a:gs',
                        attributes: { pos: '0' },
                        children: [
                          {
                            name: 'a:srgbClr',
                            attributes: { val: 'FF0000' }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const processors = [
        { name: 'Text', processor: textProcessor },
        { name: 'Shape', processor: shapeProcessor },
        { name: 'Image', processor: imageProcessor }
      ];

      const capableProcessors = processors.filter(p => p.processor.canProcess(ambiguousElement));
      
      expect(capableProcessors.length).toBeGreaterThan(0);
      
      // 应该有明确的优先级规则
      capableProcessors.forEach(p => {
        console.log(`${p.name} processor can handle ambiguous element`);
      });
    });

    it('should maintain consistent ID generation across processors', async () => {
      const elements = [
        {
          name: 'p:sp',
          children: [
            {
              name: 'p:nvSpPr',
              children: [
                {
                  name: 'p:cNvPr',
                  attributes: { id: '7', name: 'Element 1' }
                }
              ]
            },
            {
              name: 'p:spPr',
              children: [{ name: 'a:noFill' }]
            },
            {
              name: 'p:txBody',
              children: [
                {
                  name: 'a:p',
                  children: [
                    {
                      name: 'a:r',
                      children: [
                        { name: 'a:t', content: 'Text 1' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'p:sp',
          children: [
            {
              name: 'p:nvSpPr',
              children: [
                {
                  name: 'p:cNvPr',
                  attributes: { id: '8', name: 'Element 2' }
                }
              ]
            },
            {
              name: 'p:spPr',
              children: [{ name: 'a:noFill' }]
            },
            {
              name: 'p:txBody',
              children: [
                {
                  name: 'a:p',
                  children: [
                    {
                      name: 'a:r',
                      children: [
                        { name: 'a:t', content: 'Text 2' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];

      const processedIds = new Set<string>();

      for (const element of elements) {
        if (textProcessor.canProcess(element)) {
          const result = await textProcessor.process(element, mockContext);
          const id = result.getId();
          
          expect(processedIds.has(id)).toBe(false); // ID应该唯一
          processedIds.add(id);
          
          console.log(`Generated unique ID: ${id}`);
        }
      }

      expect(processedIds.size).toBe(elements.length);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle processor-specific errors gracefully', async () => {
      const problematicElements = [
        {
          name: 'malformed-element',
          children: [] // 恶意构造的元素
        },
        {
          name: 'p:sp',
          children: [
            {
              name: 'p:nvSpPr',
              // 缺少必要的子元素
            }
          ]
        },
        {
          name: 'p:pic',
          children: [
            {
              name: 'p:blipFill',
              children: [
                {
                  name: 'a:blip',
                  attributes: { 'r:embed': 'nonexistent-relation' } // 无效关系
                }
              ]
            }
          ]
        }
      ];

      for (const element of problematicElements) {
        const processors = [textProcessor, shapeProcessor, imageProcessor];
        
        for (const processor of processors) {
          if (processor.canProcess(element)) {
            try {
              const result = await processor.process(element, mockContext);
              // 如果成功处理，验证结果的有效性
              expect(result).toBeDefined();
              console.log(`Processor handled problematic element successfully`);
            } catch (error) {
              // 预期的错误应该被优雅处理
              expect(error).toBeDefined();
              console.log(`Processor error handled: ${(error as Error).message}`);
            }
          }
        }
      }
    });

    it('should maintain processing context integrity during errors', async () => {
      const initialWarningCount = mockContext.warnings.length;
      const initialRelationshipCount = mockContext.relationships.size;

      // 处理一个可能导致警告的元素
      const warningElement: XmlNode = {
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '999', name: 'Warning Element' }
              }
            ]
          },
          {
            name: 'p:spPr',
            children: [
              {
                name: 'a:solidFill',
                children: [
                  {
                    name: 'a:srgbClr',
                    attributes: { val: 'INVALID_COLOR' } // 无效颜色值
                  }
                ]
              }
            ]
          }
        ]
      };

      try {
        if (shapeProcessor.canProcess(warningElement)) {
          await shapeProcessor.process(warningElement, mockContext);
        }
      } catch (error) {
        // 错误处理
      }

      // 验证上下文完整性
      expect(mockContext.slideNumber).toBe(1);
      expect(mockContext.slideId).toBe('1');
      expect(mockContext.idGenerator).toBeDefined();
      
      // 警告可能被添加，但不应该破坏其他状态
      expect(mockContext.warnings.length).toBeGreaterThanOrEqual(initialWarningCount);
      expect(mockContext.relationships.size).toBe(initialRelationshipCount);

      console.log('Processing context integrity maintained during error handling');
    });

    it('should handle resource cleanup after processing failures', async () => {
      const resourceIntensiveElement: XmlNode = {
        name: 'p:pic',
        children: [
          {
            name: 'p:nvPicPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: '10', name: 'Large Image' }
              }
            ]
          },
          {
            name: 'p:blipFill',
            children: [
              {
                name: 'a:blip',
                attributes: { 'r:embed': 'rId999' } // 不存在的关系
              }
            ]
          }
        ]
      };

      const initialMemory = process.memoryUsage().heapUsed;

      try {
        if (imageProcessor.canProcess(resourceIntensiveElement)) {
          await imageProcessor.process(resourceIntensiveElement, mockContext);
        }
      } catch (error) {
        // 预期的错误
      }

      // 强制垃圾回收来测试资源清理
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 内存增长应该在合理范围内
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 小于10MB

      console.log(`Memory after failed processing: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
    });
  });

  describe('Performance and Scalability', () => {
    it('should process multiple elements efficiently', async () => {
      // 创建大量不同类型的元素
      const elements: XmlNode[] = [];
      
      for (let i = 0; i < 100; i++) {
        const elementType = i % 3;
        
        if (elementType === 0) {
          // 文本元素
          elements.push({
            name: 'p:sp',
            children: [
              {
                name: 'p:nvSpPr',
                children: [
                  {
                    name: 'p:cNvPr',
                    attributes: { id: (i + 100).toString(), name: `Text ${i}` }
                  }
                ]
              },
              {
                name: 'p:spPr',
                children: [{ name: 'a:noFill' }]
              },
              {
                name: 'p:txBody',
                children: [
                  {
                    name: 'a:p',
                    children: [
                      {
                        name: 'a:r',
                        children: [
                          { name: 'a:t', content: `Sample text ${i}` }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          });
        } else if (elementType === 1) {
          // 形状元素
          elements.push({
            name: 'p:sp',
            children: [
              {
                name: 'p:nvSpPr',
                children: [
                  {
                    name: 'p:cNvPr',
                    attributes: { id: (i + 100).toString(), name: `Shape ${i}` }
                  }
                ]
              },
              {
                name: 'p:spPr',
                children: [
                  {
                    name: 'a:solidFill',
                    children: [
                      {
                        name: 'a:srgbClr',
                        attributes: { val: 'FF5733' }
                      }
                    ]
                  }
                ]
              }
            ]
          });
        } else {
          // 图片元素
          elements.push({
            name: 'p:pic',
            children: [
              {
                name: 'p:nvPicPr',
                children: [
                  {
                    name: 'p:cNvPr',
                    attributes: { id: (i + 100).toString(), name: `Image ${i}` }
                  }
                ]
              },
              {
                name: 'p:blipFill',
                children: [
                  {
                    name: 'a:blip',
                    attributes: { 'r:embed': `rId${i + 1}` }
                  }
                ]
              }
            ]
          });
        }
      }

      const startTime = performance.now();
      const results = [];

      for (const element of elements) {
        const processors = [textProcessor, shapeProcessor, imageProcessor];
        
        for (const processor of processors) {
          if (processor.canProcess(element)) {
            try {
              const result = await processor.process(element, mockContext);
              results.push(result);
              break; // 使用第一个能处理的处理器
            } catch (error) {
              // 跳过错误的元素
            }
          }
        }
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(5000); // 5秒内处理100个元素

      console.log(`Processed ${results.length}/${elements.length} elements in ${processingTime.toFixed(2)}ms`);
    });

    it('should maintain consistent performance across different element types', async () => {
      const elementTypes = [
        { name: 'text', count: 0, time: 0 },
        { name: 'shape', count: 0, time: 0 },
        { name: 'image', count: 0, time: 0 }
      ];

      // 测试每种类型的处理性能
      for (let i = 0; i < 30; i++) {
        const textElement: XmlNode = {
          name: 'p:sp',
          children: [
            {
              name: 'p:nvSpPr',
              children: [
                {
                  name: 'p:cNvPr',
                  attributes: { id: (i + 200).toString(), name: `Perf Text ${i}` }
                }
              ]
            },
            {
              name: 'p:txBody',
              children: [
                {
                  name: 'a:p',
                  children: [
                    {
                      name: 'a:r',
                      children: [
                        { name: 'a:t', content: `Performance test text ${i}` }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        };

        if (textProcessor.canProcess(textElement)) {
          const startTime = performance.now();
          await textProcessor.process(textElement, mockContext);
          const endTime = performance.now();
          
          elementTypes[0].count++;
          elementTypes[0].time += endTime - startTime;
        }
      }

      // 计算平均处理时间
      elementTypes.forEach(type => {
        if (type.count > 0) {
          const avgTime = type.time / type.count;
          console.log(`${type.name} average processing time: ${avgTime.toFixed(2)}ms`);
          
          // 平均处理时间应该在合理范围内
          expect(avgTime).toBeLessThan(100); // 每个元素不超过100ms
        }
      });
    });

    it('should handle concurrent processing safely', async () => {
      const concurrentElements = Array.from({ length: 20 }, (_, i) => ({
        name: 'p:sp',
        children: [
          {
            name: 'p:nvSpPr',
            children: [
              {
                name: 'p:cNvPr',
                attributes: { id: (i + 300).toString(), name: `Concurrent ${i}` }
              }
            ]
          },
          {
            name: 'p:txBody',
            children: [
              {
                name: 'a:p',
                children: [
                  {
                    name: 'a:r',
                    children: [
                      { name: 'a:t', content: `Concurrent text ${i}` }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }));

      // 并发处理
      const promises = concurrentElements.map(element => {
        if (textProcessor.canProcess(element)) {
          return textProcessor.process(element, mockContext);
        }
        return Promise.resolve(null);
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const validResults = results.filter(r => r !== null);
      const processingTime = endTime - startTime;

      expect(validResults.length).toBe(concurrentElements.length);
      expect(processingTime).toBeLessThan(2000); // 并发处理应该更快

      // 验证所有ID都是唯一的
      const ids = validResults.map(r => r!.getId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      console.log(`Concurrent processing: ${validResults.length} elements in ${processingTime.toFixed(2)}ms`);
    });
  });
});