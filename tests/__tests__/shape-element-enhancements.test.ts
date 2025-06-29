/**
 * Tests for ShapeElement enhancements including enableShrink and circle path generation
 */

import { ShapeElement } from '../../app/lib/models/domain/elements/ShapeElement';

describe('ShapeElement Enhancements', () => {
  describe('enableShrink property', () => {
    it('should include enableShrink: true in JSON output for all shape types', () => {
      const shapeTypes = ['rect', 'ellipse', 'triangle', 'diamond', 'custom'] as const;
      
      shapeTypes.forEach(shapeType => {
        const shape = new ShapeElement(`test-${shapeType}`, shapeType);
        shape.setPosition({ x: 100, y: 200 });
        shape.setSize({ width: 50, height: 50 });
        
        const json = shape.toJSON();
        
        expect(json.enableShrink).toBe(true);
        expect(json.type).toBe('shape');
        expect(json.id).toBe(`test-${shapeType}`);
      });
    });

    it('should include enableShrink in complete JSON structure', () => {
      const shape = new ShapeElement('test-shape', 'ellipse');
      shape.setPosition({ x: 82.48, y: 121.94 });
      shape.setSize({ width: 20.09, height: 20.09 });
      shape.setRotation(0);
      shape.setFill({ color: 'rgba(255,137,137,1)' });

      const json = shape.toJSON();

      expect(json).toEqual({
        type: 'shape',
        id: 'test-shape',
        left: 82.48,
        top: 121.94,
        width: 20.09,
        height: 20.09,
        viewBox: [200, 200],
        path: 'M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z',
        themeFill: { color: 'rgba(255,137,137,1)' },
        fixedRatio: false,
        rotate: 0,
        enableShrink: true
      });
    });
  });

  describe('Circle path generation', () => {
    it('should generate correct circular SVG path for ellipse type', () => {
      const circleShape = new ShapeElement('circle-1', 'ellipse');
      const json = circleShape.toJSON();
      
      expect(json.path).toBe('M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z');
    });

    it('should generate circular path that matches PPTist format exactly', () => {
      const shape = new ShapeElement('pptist-circle', 'ellipse');
      const json = shape.toJSON();
      
      // Verify exact match with expected PPTist circle path
      const expectedCirclePath = 'M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z';
      expect(json.path).toBe(expectedCirclePath);
      
      // Verify it's not the old rectangle path
      const oldRectPath = 'M 0 0 L 200 0 L 200 200 L 0 200 Z';
      expect(json.path).not.toBe(oldRectPath);
    });

    it('should generate different paths for different shape types', () => {
      const ellipse = new ShapeElement('ellipse', 'ellipse');
      const rect = new ShapeElement('rect', 'rect');
      const triangle = new ShapeElement('triangle', 'triangle');
      const diamond = new ShapeElement('diamond', 'diamond');

      expect(ellipse.toJSON().path).toBe('M 100 0 A 50 50 0 1 1 100 200 A 50 50 0 1 1 100 0 Z');
      expect(rect.toJSON().path).toBe('M 0 0 L 200 0 L 200 200 L 0 200 Z');
      expect(triangle.toJSON().path).toBe('M 100 0 L 200 200 L 0 200 Z');
      expect(diamond.toJSON().path).toBe('M 100 0 L 200 100 L 100 200 L 0 100 Z');
    });
  });

  describe('Theme fill handling', () => {
    it('should use actual fill color when provided', () => {
      const shape = new ShapeElement('filled-shape', 'ellipse');
      shape.setFill({ color: 'rgba(255,137,137,1)' });
      
      const json = shape.toJSON();
      expect(json.themeFill).toEqual({ color: 'rgba(255,137,137,1)' });
    });

    it('should generate fallback colors when no fill is provided', () => {
      const shapes = [
        new ShapeElement('shape1', 'ellipse'),
        new ShapeElement('shape2', 'ellipse'),
        new ShapeElement('shape3', 'ellipse')
      ];

      const expectedColors = [
        'rgba(255,137,137,1)',   // Red
        'rgba(216,241,255,1)',   // Blue  
        'rgba(255,219,65,1)'     // Yellow
      ];

      shapes.forEach((shape, index) => {
        const json = shape.toJSON();
        // The fallback color depends on ID hash, so we test that a color is assigned
        expect(json.themeFill.color).toMatch(/^rgba\(\d+,\d+,\d+,1\)$/);
      });
    });

    it('should generate consistent fallback colors based on ID', () => {
      // Test that same ID generates same color
      const shape1a = new ShapeElement('same-id', 'ellipse');
      const shape1b = new ShapeElement('same-id', 'ellipse');
      
      expect(shape1a.toJSON().themeFill.color).toBe(shape1b.toJSON().themeFill.color);
      
      // Test that different IDs generate colors from the expected palette
      const expectedColors = [
        'rgba(255,137,137,1)',
        'rgba(216,241,255,1)', 
        'rgba(255,219,65,1)',
        'rgba(144,238,144,1)',
        'rgba(255,182,193,1)'
      ];
      
      const shape2 = new ShapeElement('diff-id', 'ellipse');
      const color = shape2.toJSON().themeFill.color;
      expect(expectedColors).toContain(color);
    });
  });

  describe('Shape element structure validation', () => {
    it('should maintain all required properties for PPTist compatibility', () => {
      const shape = new ShapeElement('validation-test', 'ellipse');
      shape.setPosition({ x: 82.11631209789874, y: 121.40953099047117 });
      shape.setSize({ width: 20, height: 20 });
      shape.setFill({ color: 'rgba(255,137,137,1)' });

      const json = shape.toJSON();

      // Verify all required PPTist properties are present
      expect(json).toHaveProperty('type', 'shape');
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('left');
      expect(json).toHaveProperty('top');
      expect(json).toHaveProperty('width');
      expect(json).toHaveProperty('height');
      expect(json).toHaveProperty('viewBox');
      expect(json).toHaveProperty('path');
      expect(json).toHaveProperty('themeFill');
      expect(json).toHaveProperty('fixedRatio');
      expect(json).toHaveProperty('rotate');
      expect(json).toHaveProperty('enableShrink');

      // Verify viewBox is always [200, 200]
      expect(json.viewBox).toEqual([200, 200]);
      
      // Verify fixedRatio is always false
      expect(json.fixedRatio).toBe(false);
      
      // Verify enableShrink is always true
      expect(json.enableShrink).toBe(true);
    });
  });
});