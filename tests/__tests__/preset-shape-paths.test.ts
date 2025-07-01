/**
 * Tests for preset shape path generation
 * Verifies that the getShapePath function generates correct SVG paths for preset geometries
 */

import { ShapeProcessor } from '../../app/lib/services/element/processors/ShapeProcessor';
import { XmlParseService } from '../../app/lib/services/core/XmlParseService';

describe('Preset Shape Path Generation', () => {
  let shapeProcessor: ShapeProcessor;
  let xmlParser: XmlParseService;

  beforeEach(() => {
    xmlParser = new XmlParseService();
    shapeProcessor = new ShapeProcessor(xmlParser);
  });

  describe('Basic shapes', () => {
    it('should generate correct rectangle path', () => {
      // Access the private method using bracket notation for testing
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('rect', 200, 200);
      
      expect(path).toBe('M 0 0 L 200 0 L 200 200 L 0 200 Z');
    });

    it('should generate correct ellipse path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('ellipse', 200, 200);
      
      // Should be a circular arc path
      expect(path).toBe('M 100 0 A 100 100 0 1 1 100 200 A 100 100 0 1 1 100 0 Z');
    });

    it('should generate correct triangle path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('triangle', 200, 200);
      
      expect(path).toBe('M 100 0 L 200 200 L 0 200 Z');
    });

    it('should generate correct diamond path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('diamond', 200, 200);
      
      expect(path).toBe('M 100 0 L 200 100 L 100 200 L 0 100 Z');
    });
  });

  describe('Arrow shapes', () => {
    it('should generate correct right arrow path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('rightArrow', 200, 200);
      
      // Right arrow should have characteristic arrow shape
      expect(path).toContain('M 0');
      expect(path).toContain('L 200 100'); // Arrow point
      expect(path).toContain('Z');
    });

    it('should generate correct left arrow path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('leftArrow', 200, 200);
      
      // Left arrow should point left
      expect(path).toContain('L 0 100'); // Arrow point on left
      expect(path).toContain('Z');
    });
  });

  describe('Polygon shapes', () => {
    it('should generate correct pentagon path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('pentagon', 200, 200);
      
      // Pentagon should have 5 points and close
      const points = path.split('L').length - 1; // Count line segments
      expect(points).toBe(4); // 5 points = 4 line segments from start
      expect(path).toContain('Z');
    });

    it('should generate correct hexagon path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('hexagon', 200, 200);
      
      // Hexagon should have 6 points
      const points = path.split('L').length - 1;
      expect(points).toBe(5); // 6 points = 5 line segments from start
      expect(path).toContain('Z');
    });

    it('should generate correct octagon path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('octagon', 200, 200);
      
      // Octagon should have 8 points
      const points = path.split('L').length - 1;
      expect(points).toBe(7); // 8 points = 7 line segments from start
      expect(path).toContain('Z');
    });
  });

  describe('Star shapes', () => {
    it('should generate correct 5-point star path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('star5', 200, 200);
      
      // Star should have 10 points (5 outer + 5 inner)
      const points = path.split('L').length - 1;
      expect(points).toBe(9); // 10 points = 9 line segments from start
      expect(path).toContain('Z');
    });
  });

  describe('Special shapes', () => {
    it('should generate correct parallelogram path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('parallelogram', 200, 200);
      
      // Parallelogram should have skewed sides
      expect(path).toContain('M 40 0'); // Skewed start (20% of width)
      expect(path).toContain('L 200 0');
      expect(path).toContain('L 160 200'); // Skewed end
      expect(path).toContain('Z');
    });

    it('should generate correct trapezoid path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('trapezoid', 200, 200);
      
      // Trapezoid should have narrower top
      expect(path).toContain('M 30 0'); // Offset start (15% from edge)
      expect(path).toContain('L 170 0'); // Narrower top (70% width)
      expect(path).toContain('L 200 200'); // Full width bottom
      expect(path).toContain('Z');
    });

    it('should generate correct rounded rectangle path', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('roundRect', 200, 200);
      
      // Rounded rectangle should have quadratic curves
      expect(path).toContain('Q'); // Quadratic Bézier curves for corners
      expect(path).toContain('Z');
    });
  });

  describe('Unknown shapes', () => {
    it('should default to rectangle for unknown shape types', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('unknownShape', 200, 200);
      
      // Should fall back to rectangle
      expect(path).toBe('M 0 0 L 200 0 L 200 200 L 0 200 Z');
    });
  });

  describe('Different dimensions', () => {
    it('should scale paths correctly for different dimensions', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      
      const squarePath = getShapePath('rect', 100, 100);
      const rectanglePath = getShapePath('rect', 300, 150);
      
      expect(squarePath).toBe('M 0 0 L 100 0 L 100 100 L 0 100 Z');
      expect(rectanglePath).toBe('M 0 0 L 300 0 L 300 150 L 0 150 Z');
    });

    it('should handle ellipse with different width and height', () => {
      const getShapePath = (shapeProcessor as any).getShapePath.bind(shapeProcessor);
      const path = getShapePath('ellipse', 300, 150);
      
      // Should be an ellipse, not a circle
      expect(path).toBe('M 150 0 A 150 75 0 1 1 150 150 A 150 75 0 1 1 150 0 Z');
    });
  });
});