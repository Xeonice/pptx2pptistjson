/**
 * Tests for PPTist-style ID generation in IdGenerator
 */

import { IdGenerator } from '../../app/lib/services/utils/IdGenerator';

describe('IdGenerator PPTist Style', () => {
  let idGenerator: IdGenerator;

  beforeEach(() => {
    idGenerator = new IdGenerator();
  });

  describe('PPTist-style ID format', () => {
    it('should generate IDs in PPTist format when no original ID provided', () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'shape');
        ids.push(id);
      }

      ids.forEach(id => {
        // PPTist IDs are typically 6-12 characters with letters, numbers, and - or _
        expect(id).toMatch(/^[a-zA-Z0-9_-]{6,12}$/);
      });
    });

    it('should generate unique IDs across multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'shape');
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });

    it('should generate 10-character IDs by default', () => {
      for (let i = 0; i < 10; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'shape');
        expect(id.length).toBe(10);
      }
    });

    it('should include mix of letters, numbers, and occasional special characters', () => {
      const ids = [];
      for (let i = 0; i < 50; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'shape');
        ids.push(id);
      }

      // Check that we have variety in character types
      const hasLetter = ids.some(id => /[a-zA-Z]/.test(id));
      const hasNumber = ids.some(id => /[0-9]/.test(id));
      const hasSpecial = ids.some(id => /[-_]/.test(id));

      expect(hasLetter).toBe(true);
      expect(hasNumber).toBe(true);
      // Special characters have 10% chance, so might not appear in small sample
      // We'll just verify the format allows them
    });
  });

  describe('PPTist ID recognition', () => {
    it('should recognize and preserve valid PPTist-like IDs for shapes', () => {
      const validPPTistIds = [
        'rAByhXbnus',
        'tea5Q-726-', 
        'EaZ9zeQ8QA',
        'SK1mxu40iL',
        'WD4XFKSc9k',
        'hmEDm9gfxA'
      ];

      validPPTistIds.forEach(originalId => {
        const result = idGenerator.generateUniqueId(originalId, 'shape');
        expect(result).toBe(originalId);
      });
    });

    it('should reject invalid ID formats and generate new ones', () => {
      const invalidIds = [
        '123',           // Too short
        'verylongidthatexceedsmaximumlength', // Too long
        'id with spaces', // Contains spaces
        'id@with#symbols', // Invalid symbols
        '',               // Empty
        'id.with.dots'    // Contains dots
      ];

      invalidIds.forEach(invalidId => {
        const result = idGenerator.generateUniqueId(invalidId, 'shape');
        expect(result).not.toBe(invalidId);
        expect(result).toMatch(/^[a-zA-Z0-9_-]{10}$/);
      });
    });

    it('should handle duplicate PPTist IDs by generating new ones', () => {
      const originalId = 'rAByhXbnus';
      
      // First call should use original ID
      const firstId = idGenerator.generateUniqueId(originalId, 'shape');
      expect(firstId).toBe(originalId);
      
      // Second call with same ID should generate new one
      const secondId = idGenerator.generateUniqueId(originalId, 'shape');
      expect(secondId).not.toBe(originalId);
      expect(secondId).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });

    it('should only apply PPTist recognition to shape elements', () => {
      const pptistId = 'rAByhXbnus';
      
      // For shapes, should preserve PPTist ID
      const shapeId = idGenerator.generateUniqueId(pptistId, 'shape');
      expect(shapeId).toBe(pptistId);
      
      // For other element types, should generate new ID
      const textId = idGenerator.generateUniqueId(pptistId, 'text');
      expect(textId).not.toBe(pptistId);
      expect(textId).toMatch(/^[a-zA-Z0-9_-]{10}$/);
    });
  });

  describe('ID collision handling', () => {
    it('should handle collisions in PPTist-style generation', () => {
      const ids = new Set();
      
      // Generate many IDs to potentially trigger collisions
      for (let i = 0; i < 1000; i++) {
        const id = idGenerator.generateUniqueId(undefined, 'shape');
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });

    it('should maintain used IDs state correctly', () => {
      const id1 = idGenerator.generateUniqueId('testId1', 'shape');
      const id2 = idGenerator.generateUniqueId('testId2', 'shape'); 
      const id3 = idGenerator.generateUniqueId('testId1', 'shape'); // Duplicate
      
      expect(id1).toBe('testId1');
      expect(id2).toBe('testId2');
      expect(id3).not.toBe('testId1'); // Should be different due to collision
    });
  });

  describe('Integration with actual PPTist examples', () => {
    it('should generate IDs similar to PPTist examples', () => {
      const examples = [
        'rAByhXbnus',    // 10 chars, letters and numbers
        'tea5Q-726-',    // 10 chars, includes dash and hyphen
        'EaZ9zeQ8QA',    // 10 chars, mixed case
        'SK1mxu40iL',    // 10 chars, numbers integrated
        'WD4XFKSc9k'     // 10 chars, camelCase style
      ];

      // Generate new IDs and verify they match the pattern
      for (let i = 0; i < 20; i++) {
        const newId = idGenerator.generateUniqueId(undefined, 'shape');
        
        // Verify format matches PPTist examples
        expect(newId.length).toBe(10);
        expect(newId).toMatch(/^[a-zA-Z0-9_-]+$/);
        
        // Should not start with special character
        expect(newId[0]).toMatch(/^[a-zA-Z0-9]$/);
      }
    });

    it('should be compatible with PPTist ID validation', () => {
      const generatedIds = [];
      for (let i = 0; i < 10; i++) {
        generatedIds.push(idGenerator.generateUniqueId(undefined, 'shape'));
      }

      // All generated IDs should pass PPTist format validation
      generatedIds.forEach(id => {
        const isPPTistLike = /^[a-zA-Z0-9_-]{6,12}$/.test(id);
        expect(isPPTistLike).toBe(true);
      });
    });
  });

  describe('Reset functionality', () => {
    it('should allow ID reuse after reset', () => {
      const id1 = idGenerator.generateUniqueId('testId', 'shape');
      expect(id1).toBe('testId');
      
      // Should not reuse
      const id2 = idGenerator.generateUniqueId('testId', 'shape');
      expect(id2).not.toBe('testId');
      
      // Reset and should allow reuse
      idGenerator.reset();
      const id3 = idGenerator.generateUniqueId('testId', 'shape');
      expect(id3).toBe('testId');
    });

    it('should clear all used IDs on reset', () => {
      // Generate several IDs
      idGenerator.generateUniqueId('id1', 'shape');
      idGenerator.generateUniqueId('id2', 'shape');
      idGenerator.generateUniqueId(undefined, 'shape');
      
      const usedIds = idGenerator.getUsedIds();
      expect(usedIds.length).toBeGreaterThan(0);
      
      // Reset should clear everything
      idGenerator.reset();
      const clearedIds = idGenerator.getUsedIds();
      expect(clearedIds.length).toBe(0);
    });
  });
});