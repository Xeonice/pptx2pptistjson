import { ShapeElement, ShapeType, TextContent, GradientFill, StrokeProperties, ConnectionInfo } from '../../app/lib/models/domain/elements/ShapeElement';

describe('ShapeElement Advanced Coverage Tests', () => {
  describe('Constructor and basic properties', () => {
    it('should create shape element with correct type and shape type', () => {
      const shape = new ShapeElement('test-id', 'ellipse');
      
      expect(shape.getId()).toBe('test-id');
      expect(shape.getType()).toBe('shape');
      expect(shape.getShapeType()).toBe('ellipse');
    });

    it('should handle all shape types', () => {
      const shapeTypes: ShapeType[] = [
        'rect', 'roundRect', 'ellipse', 'triangle', 'diamond',
        'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon',
        'star', 'arrow', 'callout', 'custom', 'line', 'bentConnector',
        'curvedConnector', 'doubleArrow'
      ];

      shapeTypes.forEach(shapeType => {
        const shape = new ShapeElement(`test-${shapeType}`, shapeType);
        expect(shape.getShapeType()).toBe(shapeType);
      });
    });
  });

  describe('Path handling', () => {
    it('should set and get custom path', () => {
      const shape = new ShapeElement('test-id', 'custom');
      const customPath = 'M 0 0 L 100 0 L 100 100 Z';
      
      shape.setPath(customPath);
      expect(shape.getPath()).toBe(customPath);
      expect(shape.getShapePath()).toBe(customPath);
    });

    it('should generate internal path when no custom path is set', () => {
      const shape = new ShapeElement('test-id', 'rect');
      shape.setSize({ width: 100, height: 50 });
      
      expect(shape.getPath()).toBeUndefined();
      expect(shape.getShapePath()).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z');
    });

    it('should generate ellipse path correctly', () => {
      const shape = new ShapeElement('test-id', 'ellipse');
      shape.setSize({ width: 200, height: 100 });
      
      const path = shape.getShapePath();
      expect(path).toContain('A 100 50'); // rx=100, ry=50
      expect(path).toContain('M 100 0'); // Start at center-top
    });

    it('should generate rounded rectangle path with adjustment values', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      shape.setSize({ width: 100, height: 60 });
      shape.setAdjustmentValues({ adj: 0.2 });
      
      const path = shape.getShapePath();
      expect(path).toContain('Q'); // Should have quadratic curves
      expect(path).toContain('12'); // Corner radius should be min(100,60) * 0.2 = 12
    });

    it('should generate triangle path', () => {
      const shape = new ShapeElement('test-id', 'triangle');
      
      const path = shape.getShapePath();
      expect(path).toBe('M 100 0 L 200 200 L 0 200 Z');
    });

    it('should generate diamond path', () => {
      const shape = new ShapeElement('test-id', 'diamond');
      
      const path = shape.getShapePath();
      expect(path).toBe('M 100 0 L 200 100 L 100 200 L 0 100 Z');
    });

    it('should fallback to rectangle for unknown shape types', () => {
      const shape = new ShapeElement('test-id', 'unknown' as ShapeType);
      
      const path = shape.getShapePath();
      expect(path).toBe('M 0 0 L 200 0 L 200 200 L 0 200 Z');
    });
  });

  describe('PathFormula handling', () => {
    it('should set and get path formula', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      shape.setPathFormula('roundRect');
      expect(shape.getPathFormula()).toBe('roundRect');
    });

    it('should return undefined when no path formula is set', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      expect(shape.getPathFormula()).toBeUndefined();
    });
  });

  describe('Adjustment values', () => {
    it('should set and get adjustment values', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      const adjustments = { adj: 0.3, adj2: 0.7 };
      
      shape.setAdjustmentValues(adjustments);
      expect(shape.getAdjustmentValues()).toEqual(adjustments);
    });

    it('should return empty object when no adjustment values are set', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      expect(shape.getAdjustmentValues()).toEqual({});
    });

    it('should use adjustment values in roundRect path generation', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      shape.setSize({ width: 100, height: 100 });
      
      // Test with different adjustment values
      shape.setAdjustmentValues({ adj: 0.1 });
      let path = shape.getShapePath();
      expect(path).toContain('10'); // radius = 100 * 0.1
      
      shape.setAdjustmentValues({ adj: 0.3 });
      path = shape.getShapePath();
      expect(path).toContain('30'); // radius = 100 * 0.3
    });

    it('should use default adjustment value when not provided', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      shape.setSize({ width: 100, height: 100 });
      
      const path = shape.getShapePath();
      expect(path).toContain('10'); // default adj = 0.1, so radius = 100 * 0.1 = 10
    });
  });

  describe('ViewBox handling', () => {
    it('should set and get viewBox', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      shape.setViewBox([400, 300]);
      expect(shape.getViewBox()).toEqual([400, 300]);
    });

    it('should return undefined when no viewBox is set', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      expect(shape.getViewBox()).toBeUndefined();
    });
  });

  describe('Special flag', () => {
    it('should set and get special flag', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      shape.setSpecial(true);
      expect(shape.getSpecial()).toBe(true);
      
      shape.setSpecial(false);
      expect(shape.getSpecial()).toBe(false);
    });

    it('should return undefined when special flag is not set', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      expect(shape.getSpecial()).toBeUndefined();
    });
  });

  describe('Text content', () => {
    it('should set and get text content', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const textContent: TextContent = {
        content: 'Test text',
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          bold: true,
          color: 'red'
        }
      };
      
      shape.setText(textContent);
      expect(shape.getText()).toEqual(textContent);
    });

    it('should set simple text content', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      shape.setTextContent('Simple text');
      expect(shape.getText()).toEqual({ content: 'Simple text' });
    });

    it('should set shape text content', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const shapeTextContent = {
        content: '<p>HTML content</p>',
        align: 'center',
        defaultFontName: 'Arial',
        defaultColor: 'black'
      };
      
      shape.setShapeTextContent(shapeTextContent);
      // Note: getText() doesn't return shapeText, it's only accessible via toJSON()
    });
  });

  describe('Fill and gradient', () => {
    it('should set and get fill', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const fill = { color: 'rgba(255,0,0,1)' };
      
      shape.setFill(fill);
      expect(shape.getFill()).toEqual(fill);
    });

    it('should set and get gradient', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const gradient: GradientFill = {
        type: 'linear',
        themeColor: [
          { pos: 0, color: 'red' },
          { pos: 100, color: 'blue' }
        ],
        colors: [
          { pos: 0, color: 'rgba(255,0,0,1)' },
          { pos: 100, color: 'rgba(0,0,255,1)' }
        ],
        rotate: 45
      };
      
      shape.setGradient(gradient);
      expect(shape.getGradient()).toEqual(gradient);
    });
  });

  describe('Stroke properties', () => {
    it('should set and get stroke properties', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const stroke: StrokeProperties = {
        color: 'black',
        width: 2,
        cap: 'round',
        compound: 'single',
        dashType: 'solid',
        headArrow: { type: 'triangle', width: 'medium', length: 'medium' },
        tailArrow: { type: 'none' }
      };
      
      shape.setStroke(stroke);
      expect(shape.getStroke()).toEqual(stroke);
    });
  });

  describe('Flip properties', () => {
    it('should set and get flip properties', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const flip = { horizontal: true, vertical: false };
      
      shape.setFlip(flip);
      expect(shape.getFlip()).toEqual(flip);
    });
  });

  describe('Connection info', () => {
    it('should set and get connection info', () => {
      const shape = new ShapeElement('test-id', 'line');
      const connectionInfo: ConnectionInfo = {
        startConnection: { id: 'shape1', index: '0' },
        endConnection: { id: 'shape2', index: '2' }
      };
      
      shape.setConnectionInfo(connectionInfo);
      expect(shape.getConnectionInfo()).toEqual(connectionInfo);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize basic shape with default values', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      const json = shape.toJSON();
      
      expect(json).toEqual({
        type: 'shape',
        id: 'test-id',
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        viewBox: [200, 200],
        path: 'M 0 0 L 200 0 L 200 200 L 0 200 Z',
        fixedRatio: false,
        rotate: 0,
        fill: expect.stringContaining('rgba('),
        themeFill: expect.objectContaining({
          color: expect.stringContaining('rgba('),
          debug: expect.any(String)
        }),
        shape: 'rect',
        enableShrink: true
      });
    });

    it('should serialize shape with dimensions and position', () => {
      const shape = new ShapeElement('test-id', 'ellipse');
      shape.setSize({ width: 150, height: 100 });
      shape.setPosition({ x: 50, y: 25 });
      shape.setRotation(45);
      
      const json = shape.toJSON();
      
      expect(json.width).toBe(150);
      expect(json.height).toBe(100);
      expect(json.left).toBe(50);
      expect(json.top).toBe(25);
      expect(json.rotate).toBe(45);
      expect(json.viewBox).toEqual([150, 100]);
    });

    it('should serialize shape with gradient instead of fill', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const gradient: GradientFill = {
        type: 'linear',
        themeColor: [{ pos: 0, color: 'red' }],
        colors: [{ pos: 0, color: 'rgba(255,0,0,1)' }],
        rotate: 0
      };
      
      shape.setGradient(gradient);
      
      const json = shape.toJSON();
      
      expect(json.fill).toBe('');
      expect(json.gradient).toEqual(gradient);
      expect(json.themeFill).toBeUndefined();
    });

    it('should serialize shape with custom fill color', () => {
      const shape = new ShapeElement('test-id', 'rect');
      shape.setFill({ color: 'rgba(0,255,0,1)' });
      
      const json = shape.toJSON();
      
      expect(json.fill).toBe('rgba(0,255,0,1)');
      expect(json.themeFill).toEqual({
        color: 'rgba(0,255,0,1)',
        debug: 'Extracted from fill: rgba(0,255,0,1)'
      });
    });

    it('should serialize custom shape as rect shape type', () => {
      const shape = new ShapeElement('test-id', 'custom');
      
      const json = shape.toJSON();
      
      expect(json.shape).toBe('rect');
    });

    it('should include pathFormula when set', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      shape.setPathFormula('roundRect');
      
      const json = shape.toJSON();
      
      expect(json.pathFormula).toBe('roundRect');
    });

    it('should not include pathFormula when undefined', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      const json = shape.toJSON();
      
      expect(json.pathFormula).toBeUndefined();
    });

    it('should include outline only when stroke has meaningful data', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      // Test with meaningful stroke
      shape.setStroke({ color: 'red', width: 2, dashType: 'dashed' });
      let json = shape.toJSON();
      expect(json.outline).toEqual({
        color: 'red',
        width: 2,
        style: 'dashed'
      });
      
      // Test with minimal stroke (should still include)
      const shape2 = new ShapeElement('test-id-2', 'rect');
      shape2.setStroke({ width: 1 });
      json = shape2.toJSON();
      expect(json.outline).toEqual({
        color: '#000000',
        width: 1,
        style: 'solid'
      });
      
      // Test with no stroke
      const shape3 = new ShapeElement('test-id-3', 'rect');
      json = shape3.toJSON();
      expect(json.outline).toBeUndefined();
    });

    it('should include flip properties only when true', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      // Test with horizontal flip
      shape.setFlip({ horizontal: true, vertical: false });
      let json = shape.toJSON();
      expect(json.flipH).toBe(true);
      expect(json.flipV).toBeUndefined();
      
      // Test with vertical flip
      shape.setFlip({ horizontal: false, vertical: true });
      json = shape.toJSON();
      expect(json.flipH).toBeUndefined();
      expect(json.flipV).toBe(true);
      
      // Test with both flips
      shape.setFlip({ horizontal: true, vertical: true });
      json = shape.toJSON();
      expect(json.flipH).toBe(true);
      expect(json.flipV).toBe(true);
    });

    it('should include keypoints for roundRect shapes', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      
      // Test with custom adjustment value
      shape.setAdjustmentValues({ adj: 0.3 });
      let json = shape.toJSON();
      expect(json.keypoints).toEqual([0.3]);
      
      // Test with default adjustment value
      const shape2 = new ShapeElement('test-id-2', 'roundRect');
      json = shape2.toJSON();
      expect(json.keypoints).toEqual([0.5]);
    });

    it('should include text content when present', () => {
      const shape = new ShapeElement('test-id', 'rect');
      const shapeTextContent = {
        content: '<p>HTML content</p>',
        align: 'center',
        defaultFontName: 'Arial',
        defaultColor: 'black'
      };
      
      shape.setShapeTextContent(shapeTextContent);
      
      const json = shape.toJSON();
      
      expect(json.text).toEqual(shapeTextContent);
    });

    it('should use viewBox from setViewBox when available', () => {
      const shape = new ShapeElement('test-id', 'rect');
      shape.setSize({ width: 100, height: 50 });
      shape.setViewBox([300, 200]);
      
      const json = shape.toJSON();
      
      expect(json.viewBox).toEqual([300, 200]);
    });

    it('should use actual dimensions for viewBox when size is set and no custom viewBox', () => {
      const shape = new ShapeElement('test-id', 'rect');
      shape.setSize({ width: 150, height: 80 });
      
      const json = shape.toJSON();
      
      expect(json.viewBox).toEqual([150, 80]);
    });

    it('should use default viewBox when no size or custom viewBox', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      const json = shape.toJSON();
      
      expect(json.viewBox).toEqual([200, 200]);
    });
  });

  describe('Theme fill generation', () => {
    it('should generate consistent fallback colors based on ID', () => {
      const shape1 = new ShapeElement('same-id', 'rect');
      const shape2 = new ShapeElement('same-id', 'ellipse');
      
      const json1 = shape1.toJSON();
      const json2 = shape2.toJSON();
      
      expect(json1.themeFill.color).toBe(json2.themeFill.color);
    });

    it('should generate different colors for different IDs', () => {
      const shape1 = new ShapeElement('id-1', 'rect');
      const shape2 = new ShapeElement('id-2', 'rect');
      
      const json1 = shape1.toJSON();
      const json2 = shape2.toJSON();
      
      expect(json1.themeFill.color).not.toBe(json2.themeFill.color);
    });

    it('should include debug information in fallback color', () => {
      const shape = new ShapeElement('test-id', 'rect');
      
      const json = shape.toJSON();
      
      expect(json.themeFill.debug).toContain('Fallback color');
      expect(json.themeFill.debug).toContain('test-id');
    });

    it('should prioritize actual fill over fallback', () => {
      const shape = new ShapeElement('test-id', 'rect');
      shape.setFill({ color: 'rgba(100,200,50,1)' });
      
      const json = shape.toJSON();
      
      expect(json.themeFill.color).toBe('rgba(100,200,50,1)');
      expect(json.themeFill.debug).toContain('Extracted from fill');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero or negative dimensions in path generation', () => {
      const shape = new ShapeElement('test-id', 'ellipse');
      shape.setSize({ width: 0, height: 0 });
      
      const path = shape.getShapePath();
      expect(path).toContain('A 100 100'); // Should use default 200x200
    });

    it('should handle undefined adjustment values in roundRect', () => {
      const shape = new ShapeElement('test-id', 'roundRect');
      shape.setSize({ width: 100, height: 100 });
      shape.setAdjustmentValues({});
      
      const path = shape.getShapePath();
      expect(path).toContain('10'); // Should use default 0.1
    });

    it('should handle empty ID in fallback color generation', () => {
      const shape = new ShapeElement('', 'rect');
      
      const json = shape.toJSON();
      
      expect(json.themeFill.color).toMatch(/rgba\(\d+,\d+,\d+,1\)/);
    });
  });
});