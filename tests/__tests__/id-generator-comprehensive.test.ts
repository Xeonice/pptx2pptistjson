/**
 * IdGenerator 综合测试套件
 * 测试唯一ID生成、重复处理、PPTist兼容性和状态管理
 */

import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';

describe('IdGenerator - Comprehensive Test Suite', () => {
  let idGenerator: IdGenerator;

  beforeEach(() => {
    idGenerator = new IdGenerator();
  });

  describe('PPTist Style ID Generation', () => {
    it('should generate PPTist-compatible IDs', () => {
      const id1 = idGenerator.generateUniqueId(undefined, 'shape');
      const id2 = idGenerator.generateUniqueId(undefined, 'text');
      const id3 = idGenerator.generateUniqueId(undefined, 'image');

      // PPTist IDs should be 6-12 characters
      expect(id1).toHaveLength(10);
      expect(id2).toHaveLength(10);
      expect(id3).toHaveLength(10);

      // Should contain alphanumeric and possibly special characters
      expect(id1).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(id2).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(id3).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should generate unique IDs across multiple calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'element');
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      expect(ids.size).toBe(100);
    });

    it('should include occasional special characters', () => {
      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        ids.push(idGenerator.generateUniqueId(undefined, 'test'));
      }

      // At least some IDs should contain special characters
      const hasSpecialChars = ids.some(id => id.includes('-') || id.includes('_'));
      expect(hasSpecialChars).toBe(true);
    });

    it('should not start with special characters', () => {
      for (let i = 0; i < 20; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'test');
        expect(id.charAt(0)).toMatch(/[a-zA-Z0-9]/);
      }
    });
  });

  describe('Original ID Preservation', () => {
    it('should preserve valid PPTist-like original IDs for shapes', () => {
      const validIds = [
        'abc123def',
        'shape_1',
        'element-2',
        'ABC123',
        'test_id_99',
        'myShape-1'
      ];

      validIds.forEach(originalId => {
        const result = idGenerator.generateUniqueId(originalId, 'shape');
        expect(result).toBe(originalId);
      });
    });

    it('should reject invalid original IDs', () => {
      const invalidIds = [
        'a',           // too short
        'ab',          // too short
        'abcde',       // too short
        'abcdefghijklm', // too long
        'abc@123',     // invalid character
        'abc.123',     // invalid character
        'abc#123',     // invalid character
        'abc 123',     // space not allowed
        ''             // empty
      ];

      invalidIds.forEach(originalId => {
        const result = idGenerator.generateUniqueId(originalId, 'shape');
        expect(result).not.toBe(originalId);
        expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      });
    });

    it('should generate new IDs for non-shape elements even with valid original IDs', () => {
      const validId = 'validId123';
      const result = idGenerator.generateUniqueId(validId, 'text');
      expect(result).not.toBe(validId);
      expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });

    it('should handle undefined element types', () => {
      const result1 = idGenerator.generateUniqueId('validId123');
      const result2 = idGenerator.generateUniqueId(undefined);
      
      expect(result1).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result1).not.toBe(result2);
    });
  });

  describe('Duplicate Handling', () => {
    it('should handle duplicate original IDs', () => {
      const originalId = 'duplicate123';
      const result1 = idGenerator.generateUniqueId(originalId, 'shape');
      const result2 = idGenerator.generateUniqueId(originalId, 'shape');

      expect(result1).toBe(originalId);
      expect(result2).not.toBe(originalId);
      expect(result2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });

    it('should handle collision in generated IDs', () => {
      // Mock Math.random to create predictable collisions
      const originalRandom = Math.random;
      let callCount = 0;
      
      Math.random = () => {
        callCount++;
        // Return same sequence twice to cause collision
        if (callCount <= 20) return 0.5;
        return originalRandom();
      };

      try {
        const id1 = idGenerator.generateUniqueId(undefined, 'test');
        const id2 = idGenerator.generateUniqueId(undefined, 'test');
        
        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^[a-zA-Z0-9_-]{10}$/);
        expect(id2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('should track used IDs correctly', () => {
      const id1 = idGenerator.generateUniqueId('testId123', 'shape');
      const id2 = idGenerator.generateUniqueId(undefined, 'element');
      
      const usedIds = idGenerator.getUsedIds();
      expect(usedIds).toContain(id1);
      expect(usedIds).toContain(id2);
      expect(usedIds).toHaveLength(2);
    });
  });

  describe('State Management', () => {
    it('should reset state correctly', () => {
      // Generate some IDs
      idGenerator.generateUniqueId('testId1', 'shape');
      idGenerator.generateUniqueId(undefined, 'element');
      idGenerator.generateUniqueId('testId2', 'shape');
      
      expect(idGenerator.getUsedIds()).toHaveLength(3);
      
      // Reset
      idGenerator.reset();
      
      expect(idGenerator.getUsedIds()).toHaveLength(0);
      
      // Should be able to use previously used IDs again
      const newId = idGenerator.generateUniqueId('testId1', 'shape');
      expect(newId).toBe('testId1');
    });

    it('should maintain separate counters for different element types', () => {
      // This is more of an internal detail, but we can test that
      // different element types don't interfere with each other
      const shapeId1 = idGenerator.generateUniqueId(undefined, 'shape');
      const textId1 = idGenerator.generateUniqueId(undefined, 'text');
      const imageId1 = idGenerator.generateUniqueId(undefined, 'image');
      
      expect(shapeId1).not.toBe(textId1);
      expect(textId1).not.toBe(imageId1);
      expect(shapeId1).not.toBe(imageId1);
    });

    it('should track all generated IDs', () => {
      const ids = [];
      ids.push(idGenerator.generateUniqueId('original1', 'shape'));
      ids.push(idGenerator.generateUniqueId('original2', 'shape'));
      ids.push(idGenerator.generateUniqueId(undefined, 'text'));
      ids.push(idGenerator.generateUniqueId(undefined, 'image'));
      
      const usedIds = idGenerator.getUsedIds();
      expect(usedIds).toHaveLength(4);
      
      ids.forEach(id => {
        expect(usedIds).toContain(id);
      });
    });
  });

  describe('PPTist Compatibility Validation', () => {
    it('should validate PPTist-like IDs correctly', () => {
      const testCases = [
        { id: 'abc123', expected: true },
        { id: 'abc123def', expected: true },
        { id: 'element_1', expected: true },
        { id: 'shape-2', expected: true },
        { id: 'ABC123DEF', expected: true },
        { id: 'test_id_99', expected: true },
        { id: 'myShape-1', expected: true },
        { id: 'ab', expected: false },          // too short
        { id: 'abcde', expected: false },       // too short
        { id: 'abcdefghijklm', expected: false }, // too long
        { id: 'abc@123', expected: false },     // invalid character
        { id: 'abc.123', expected: false },     // invalid character
        { id: 'abc 123', expected: false },     // space not allowed
        { id: '', expected: false },            // empty
      ];

      testCases.forEach(({ id, expected }) => {
        const result = idGenerator.generateUniqueId(id, 'shape');
        if (expected) {
          expect(result).toBe(id);
        } else {
          expect(result).not.toBe(id);
          expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
        }
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of ID generations efficiently', () => {
      const startTime = Date.now();
      const ids = new Set<string>();
      
      for (let i = 0; i < 1000; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'test');
        ids.add(id);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(ids.size).toBe(1000); // All unique
      expect(duration).toBeLessThan(1000); // Should be fast (< 1 second)
    });

    it('should handle collision resolution efficiently', () => {
      // Pre-populate with many IDs to increase collision probability
      for (let i = 0; i < 100; i++) {
        idGenerator.generateUniqueId(undefined, 'test');
      }

      const startTime = Date.now();
      const newIds = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'test');
        newIds.add(id);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(newIds.size).toBe(100); // All unique
      expect(duration).toBeLessThan(500); // Should still be reasonably fast
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined original IDs', () => {
      const result1 = idGenerator.generateUniqueId(null as any, 'shape');
      const result2 = idGenerator.generateUniqueId(undefined, 'shape');
      
      expect(result1).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result1).not.toBe(result2);
    });

    it('should handle empty string original IDs', () => {
      const result = idGenerator.generateUniqueId('', 'shape');
      expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });

    it('should handle whitespace-only original IDs', () => {
      const result = idGenerator.generateUniqueId('   ', 'shape');
      expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });

    it('should handle special element types', () => {
      const result1 = idGenerator.generateUniqueId(undefined, 'custom-type');
      const result2 = idGenerator.generateUniqueId(undefined, 'type with spaces');
      const result3 = idGenerator.generateUniqueId(undefined, '123numeric');
      
      expect(result1).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result2).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      expect(result3).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      
      expect(result1).not.toBe(result2);
      expect(result2).not.toBe(result3);
      expect(result1).not.toBe(result3);
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should handle typical PowerPoint element processing', () => {
      // Simulate processing a slide with various elements
      const elements = [
        { id: 'TextBox1', type: 'text' },
        { id: 'Shape2', type: 'shape' },
        { id: 'Picture3', type: 'image' },
        { id: 'Chart4', type: 'chart' },
        { id: undefined, type: 'shape' },
        { id: 'validId123', type: 'shape' },
        { id: 'invalid id', type: 'shape' },
        { id: 'toolong123456789', type: 'shape' }
      ];

      const processedIds = elements.map(element => 
        idGenerator.generateUniqueId(element.id, element.type)
      );

      // All should be unique
      expect(new Set(processedIds).size).toBe(elements.length);
      
      // Valid shape IDs should be preserved
      expect(processedIds[5]).toBe('validId123');
      
      // Invalid IDs should be replaced
      expect(processedIds[0]).not.toBe('TextBox1'); // not a shape
      expect(processedIds[6]).not.toBe('invalid id'); // contains space
      expect(processedIds[7]).not.toBe('toolong123456789'); // too long
    });

    it('should handle batch processing with mixed element types', () => {
      const batchSize = 50;
      const elementTypes = ['shape', 'text', 'image', 'chart'];
      const results = [];

      for (let i = 0; i < batchSize; i++) {
        const elementType = elementTypes[i % elementTypes.length];
        const originalId = Math.random() < 0.5 ? `element${i}` : undefined;
        
        const id = idGenerator.generateUniqueId(originalId, elementType);
        results.push(id);
      }

      // All should be unique
      expect(new Set(results).size).toBe(batchSize);
      
      // All should be valid PPTist format
      results.forEach(id => {
        expect(id).toMatch(/^[a-zA-Z0-9_-]{6,12}$/);
      });
    });
  });
});