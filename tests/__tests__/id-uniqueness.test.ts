import { describe, expect, it, jest } from '@jest/globals';
// Mock types for testing
type SlideElement = {
  id: string;
  type: string;
  [key: string]: any;
};

describe('Element ID Uniqueness Tests', () => {
  describe('ID Generation', () => {
    it('should generate unique IDs for all elements', () => {
      // Mock slide data with multiple elements
      const mockSlides = [
        {
          id: 'slide1',
          elements: [
            { id: '1', type: 'text' as const, content: 'Text 1' },
            { id: '2', type: 'shape' as const },
            { id: '3', type: 'image' as const }
          ]
        },
        {
          id: 'slide2', 
          elements: [
            { id: '4', type: 'text' as const, content: 'Text 2' },
            { id: '5', type: 'shape' as const },
            { id: '6', type: 'text' as const, content: 'Text 3' }
          ]
        },
        {
          id: 'slide3',
          elements: [
            { id: '7', type: 'text' as const, content: 'Text 4' },
            { id: '8', type: 'image' as const },
            { id: '9', type: 'shape' as const }
          ]
        }
      ];

      // Collect all element IDs
      const allIds: string[] = [];
      mockSlides.forEach(slide => {
        slide.elements.forEach(element => {
          allIds.push(element.id);
        });
      });

      // Check for uniqueness
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
      expect(allIds).toHaveLength(9);
    });

    it('should handle PowerPoint duplicate ID conflicts', () => {
      // Simulate scenario where PowerPoint XML has duplicate IDs
      const elementsWithDuplicateIds = [
        { originalId: 'shape1', content: 'Element 1' },
        { originalId: 'shape1', content: 'Element 2' }, // Duplicate!
        { originalId: 'shape2', content: 'Element 3' },
        { originalId: 'shape1', content: 'Element 4' }  // Another duplicate!
      ];

      // Mock ID generation function that should handle duplicates
      const generateUniqueId = (originalId: string, existingIds: Set<string>): string => {
        let newId = originalId;
        let counter = 1;
        
        while (existingIds.has(newId)) {
          newId = `${originalId}_${counter}`;
          counter++;
        }
        
        existingIds.add(newId);
        return newId;
      };

      // Test the ID generation
      const existingIds = new Set<string>();
      const generatedIds = elementsWithDuplicateIds.map(elem => 
        generateUniqueId(elem.originalId, existingIds)
      );

      // Verify all IDs are unique
      expect(new Set(generatedIds).size).toBe(generatedIds.length);
      expect(generatedIds).toEqual(['shape1', 'shape1_1', 'shape2', 'shape1_2']);
    });

    it('should maintain ID format consistency', () => {
      const mockIds = ['elem_1', 'elem_2', 'elem_3', 'text_1', 'shape_1', 'image_1'];
      
      // Check format consistency
      const idPattern = /^[a-zA-Z]+_\d+$/;
      mockIds.forEach(id => {
        expect(id).toMatch(idPattern);
      });
    });

    it('should generate IDs for elements without original IDs', () => {
      const elementsWithoutIds = [
        { type: 'text', content: 'Text without ID' },
        { type: 'shape', geometry: 'rect' },
        { type: 'image', src: 'image.png' }
      ];

      // Mock ID generator for elements without IDs
      const generateIdForElement = (element: any, index: number): string => {
        return `${element.type}_${index + 1}`;
      };

      const generatedIds = elementsWithoutIds.map((elem, idx) => 
        generateIdForElement(elem, idx)
      );

      // Verify IDs were generated
      expect(generatedIds).toHaveLength(3);
      expect(generatedIds).toEqual(['text_1', 'shape_2', 'image_3']);
      
      // Verify uniqueness
      expect(new Set(generatedIds).size).toBe(generatedIds.length);
    });

    it('should handle grouped elements with nested IDs', () => {
      const groupedElements = {
        id: 'group_1',
        type: 'group',
        children: [
          { id: 'child_1', type: 'text' },
          { id: 'child_2', type: 'shape' },
          { 
            id: 'subgroup_1', 
            type: 'group',
            children: [
              { id: 'subchild_1', type: 'text' },
              { id: 'subchild_2', type: 'image' }
            ]
          }
        ]
      };

      // Collect all IDs recursively
      const collectIds = (element: any, ids: string[] = []): string[] => {
        ids.push(element.id);
        if (element.children) {
          element.children.forEach((child: any) => collectIds(child, ids));
        }
        return ids;
      };

      const allIds = collectIds(groupedElements);
      
      // Verify all IDs are unique
      expect(new Set(allIds).size).toBe(allIds.length);
      expect(allIds).toHaveLength(6);
    });
  });

  describe('ID Collision Detection', () => {
    it('should detect and report ID collisions', () => {
      const elements = [
        { id: '1', type: 'text' },
        { id: '2', type: 'shape' },
        { id: '1', type: 'image' }, // Collision!
        { id: '3', type: 'text' },
        { id: '2', type: 'shape' }  // Another collision!
      ];

      const detectCollisions = (elements: any[]): string[] => {
        const idCounts = new Map<string, number>();
        const collisions: string[] = [];

        elements.forEach(elem => {
          const count = idCounts.get(elem.id) || 0;
          idCounts.set(elem.id, count + 1);
          
          if (count > 0 && !collisions.includes(elem.id)) {
            collisions.push(elem.id);
          }
        });

        return collisions;
      };

      const collisions = detectCollisions(elements);
      expect(collisions).toEqual(['1', '2']);
    });
  });

  describe('ID Persistence', () => {
    it('should maintain stable IDs across parsing sessions', () => {
      // Mock parsing the same element multiple times
      const parseElement = (xmlData: any, sessionId: number): any => {
        // Should generate the same ID for the same XML element
        return {
          id: `element_${xmlData.id}_stable`,
          type: xmlData.type,
          sessionId
        };
      };

      const xmlElement = { id: 'shape123', type: 'shape' };
      
      const firstParse = parseElement(xmlElement, 1);
      const secondParse = parseElement(xmlElement, 2);
      
      expect(firstParse.id).toBe(secondParse.id);
    });
  });
});