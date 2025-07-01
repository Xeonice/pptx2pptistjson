import { ShapeElement } from '../../app/lib/models/domain/elements/ShapeElement';

describe('RoundRect Keypoints', () => {
  it('should use default keypoints value of 0.5 when no adjustment values are set', () => {
    const shape = new ShapeElement('test-roundrect', 'roundRect');
    const json = shape.toJSON();
    
    expect(json.keypoints).toEqual([0.5]);
    expect(json.shape).toBe('roundRect');
    expect(json.viewBox).toEqual([200, 200]);
  });

  it('should use custom adjustment value for keypoints', () => {
    const shape = new ShapeElement('test-roundrect-custom', 'roundRect');
    shape.setAdjustmentValues({ adj: 0.3 });
    
    const json = shape.toJSON();
    
    expect(json.keypoints).toEqual([0.3]);
    expect(json.shape).toBe('roundRect');
  });

  it('should handle different adjustment values correctly', () => {
    const shape = new ShapeElement('test-roundrect-var', 'roundRect');
    
    // Test with 0.7
    shape.setAdjustmentValues({ adj: 0.7 });
    let json = shape.toJSON();
    expect(json.keypoints).toEqual([0.7]);
    
    // Test with 0.1
    shape.setAdjustmentValues({ adj: 0.1 });
    json = shape.toJSON();
    expect(json.keypoints).toEqual([0.1]);
    
    // Test with 1.0
    shape.setAdjustmentValues({ adj: 1.0 });
    json = shape.toJSON();
    expect(json.keypoints).toEqual([1.0]);
  });

  it('should generate proper rounded rectangle path with adjustment values', () => {
    const shape = new ShapeElement('test-roundrect-circle', 'roundRect');
    
    // Test with adj = 0.5 (should remain as rounded rectangle)
    shape.setAdjustmentValues({ adj: 0.5 });
    const json = shape.toJSON();
    
    expect(json.keypoints).toEqual([0.5]);
    expect(json.shape).toBe('roundRect');
    
    // The path should be a rounded rectangle path (using Q commands)
    expect(json.path).toContain('Q');
    expect(json.path).toContain('M 100 0');
    expect(json.path).toContain('L 100 0');
  });

  it('should only add keypoints property for roundRect shapes', () => {
    const rectShape = new ShapeElement('test-rect', 'rect');
    const ellipseShape = new ShapeElement('test-ellipse', 'ellipse');
    const roundRectShape = new ShapeElement('test-roundrect', 'roundRect');
    
    const rectJson = rectShape.toJSON();
    const ellipseJson = ellipseShape.toJSON();
    const roundRectJson = roundRectShape.toJSON();
    
    expect(rectJson).not.toHaveProperty('keypoints');
    expect(ellipseJson).not.toHaveProperty('keypoints');
    expect(roundRectJson).toHaveProperty('keypoints');
    expect(roundRectJson.keypoints).toEqual([0.5]);
  });
});