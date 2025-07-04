import { GroupTransform } from "../interfaces/ProcessingContext";

/**
 * Advanced group transformation calculator for PowerPoint group shapes
 * Handles complex rotation, flip, and scale combinations with proper matrix mathematics
 */
export class GroupTransformCalculator {
  /**
   * Create a transformation matrix representing the group transform
   */
  static createTransformMatrix(transform: GroupTransform): TransformMatrix {
    // Create identity matrix
    let matrix = TransformMatrix.identity();

    // Apply transformations in PowerPoint order:
    // 1. Scale
    // 2. Flip
    // 3. Rotation
    // 4. Translation

    // 1. Apply scaling
    matrix = matrix.scale(transform.scaleX, transform.scaleY);

    // 2. Apply flipping
    if (transform.flip) {
      const flipScaleX = transform.flip.horizontal ? -1 : 1;
      const flipScaleY = transform.flip.vertical ? -1 : 1;
      matrix = matrix.scale(flipScaleX, flipScaleY);
    }

    // 3. Apply rotation (convert degrees to radians)
    if (transform.rotation) {
      const radians = (transform.rotation * Math.PI) / 180;
      matrix = matrix.rotate(radians);
    }

    // 4. Apply translation
    if (transform.offset) {
      matrix = matrix.translate(transform.offset.x, transform.offset.y);
    }

    return matrix;
  }

  /**
   * Accumulate two group transforms using matrix multiplication
   * This ensures correct order of operations for nested groups
   */
  static accumulateTransforms(
    parentTransform: GroupTransform | undefined,
    currentTransform: GroupTransform | undefined
  ): GroupTransform | undefined {
    if (!currentTransform) return parentTransform;
    if (!parentTransform) return currentTransform;

    // Accumulate scale factors (multiply)
    const scaleX = parentTransform.scaleX * currentTransform.scaleX;
    const scaleY = parentTransform.scaleY * currentTransform.scaleY;

    // Calculate accumulated offsets
    // Current group's position in parent's coordinate system
    const currentOffsetX = currentTransform.offset?.x || 0;
    const currentOffsetY = currentTransform.offset?.y || 0;

    // Transform current group's position by parent's scale and offset
    const parentOffsetX = parentTransform.offset?.x || 0;
    const parentOffsetY = parentTransform.offset?.y || 0;
    const parentChildOffsetX = parentTransform.childOffset?.x || 0;
    const parentChildOffsetY = parentTransform.childOffset?.y || 0;

    // Apply parent's transformation to current group's position
    const transformedOffsetX =
      (currentOffsetX - parentChildOffsetX) * parentTransform.scaleX +
      parentOffsetX;
    const transformedOffsetY =
      (currentOffsetY - parentChildOffsetY) * parentTransform.scaleY +
      parentOffsetY;

    // For child offset, we use the current group's child offset directly
    // It defines the coordinate system for this group's children
    const currentChildOffsetX = currentTransform.childOffset?.x || 0;
    const currentChildOffsetY = currentTransform.childOffset?.y || 0;

    // Handle flip accumulation
    let accumulatedFlip = undefined;
    if (currentTransform.flip || parentTransform.flip) {
      const parentFlipH = parentTransform.flip?.horizontal || false;
      const parentFlipV = parentTransform.flip?.vertical || false;
      const currentFlipH = currentTransform.flip?.horizontal || false;
      const currentFlipV = currentTransform.flip?.vertical || false;

      accumulatedFlip = {
        horizontal: parentFlipH !== currentFlipH, // XOR for flip accumulation
        vertical: parentFlipV !== currentFlipV,
      };
    }

    // Debug logging
    console.log(
      `[Accumulate Transform] Parent scale: ${parentTransform.scaleX.toFixed(
        4
      )}x${parentTransform.scaleY.toFixed(4)}, ` +
        `Current scale: ${currentTransform.scaleX.toFixed(
          4
        )}x${currentTransform.scaleY.toFixed(4)}, ` +
        `Accumulated: ${scaleX.toFixed(4)}x${scaleY.toFixed(4)}`
    );

    return {
      scaleX,
      scaleY,
      offset: {
        x: transformedOffsetX,
        y: transformedOffsetY,
      },
      childOffset: {
        x: currentChildOffsetX,
        y: currentChildOffsetY,
      },
      flip: accumulatedFlip,
      rotation:
        (currentTransform.rotation || 0) + (parentTransform.rotation || 0),
    };
  }

  /**
   * Extract transform properties from a transformation matrix
   */
  private static extractTransformFromMatrix(
    matrix: TransformMatrix
  ): GroupTransform {
    // Extract scale factors (considering flip)
    const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.c * matrix.c);
    const scaleY = Math.sqrt(matrix.b * matrix.b + matrix.d * matrix.d);

    // Extract rotation angle
    const rotation = (Math.atan2(-matrix.c, matrix.a) * 180) / Math.PI;

    // Extract flip from determinant and scale signs
    const det = matrix.a * matrix.d - matrix.b * matrix.c;
    const hasFlip = det < 0;

    // Determine flip direction
    let flip = undefined;
    if (hasFlip) {
      // Analyze matrix to determine flip direction
      const flipH = matrix.a < 0 !== matrix.d < 0;
      const flipV = !flipH;
      flip = { horizontal: flipH, vertical: flipV };
    }

    return {
      scaleX: Math.abs(scaleX),
      scaleY: Math.abs(scaleY),
      rotation: Math.abs(rotation) > 0.01 ? rotation : undefined,
      flip: flip,
      offset: {
        x: matrix.tx,
        y: matrix.ty,
      },
    };
  }

  /**
   * Apply group transform to a point
   */
  static transformPoint(
    point: { x: number; y: number },
    transform: GroupTransform,
    centerPoint?: { x: number; y: number }
  ): { x: number; y: number } {
    const matrix = this.createTransformMatrix(transform);

    if (centerPoint) {
      // Transform around center point
      const centeredMatrix = TransformMatrix.identity()
        .translate(-centerPoint.x, -centerPoint.y)
        .multiply(matrix)
        .translate(centerPoint.x, centerPoint.y);

      return centeredMatrix.transformPoint(point);
    }

    return matrix.transformPoint(point);
  }

  /**
   * Calculate effective rotation considering flip transformations
   * In PowerPoint, flip + rotation can create complex visual effects
   */
  static calculateEffectiveRotation(
    rotation: number = 0,
    flipH: boolean = false,
    flipV: boolean = false
  ): number {
    let effectiveRotation = rotation;

    // Flip affects rotation direction
    if (flipH && flipV) {
      // Both flips = 180° rotation
      effectiveRotation += 180;
    } else if (flipH) {
      // Horizontal flip mirrors rotation
      effectiveRotation = -effectiveRotation;
    } else if (flipV) {
      // Vertical flip = 180° + mirror rotation
      effectiveRotation = 180 - effectiveRotation;
    }

    // Normalize to 0-360 range
    while (effectiveRotation < 0) effectiveRotation += 360;
    while (effectiveRotation >= 360) effectiveRotation -= 360;

    return effectiveRotation;
  }

  /**
   * Calculate combined flip state for nested groups
   * PowerPoint flip accumulation follows specific rules
   */
  static accumulateFlipState(
    parentFlip: { horizontal?: boolean; vertical?: boolean } | undefined,
    currentFlip: { horizontal?: boolean; vertical?: boolean } | undefined
  ): { horizontal?: boolean; vertical?: boolean } | undefined {
    if (!parentFlip && !currentFlip) return undefined;

    const parentH = parentFlip?.horizontal || false;
    const parentV = parentFlip?.vertical || false;
    const currentH = currentFlip?.horizontal || false;
    const currentV = currentFlip?.vertical || false;

    // XOR operation for flip accumulation
    const resultH = parentH !== currentH;
    const resultV = parentV !== currentV;

    return resultH || resultV
      ? { horizontal: resultH, vertical: resultV }
      : undefined;
  }
}

/**
 * 2D Transformation Matrix for accurate geometric calculations
 * Represents affine transformations: scale, rotation, translation, flip
 */
export class TransformMatrix {
  constructor(
    public a: number = 1, // Scale X / Cos(rotation)
    public b: number = 0, // Skew Y / Sin(rotation)
    public c: number = 0, // Skew X / -Sin(rotation)
    public d: number = 1, // Scale Y / Cos(rotation)
    public tx: number = 0, // Translate X
    public ty: number = 0 // Translate Y
  ) {}

  /**
   * Create identity matrix
   */
  static identity(): TransformMatrix {
    return new TransformMatrix();
  }

  /**
   * Create scaling matrix
   */
  scale(sx: number, sy: number): TransformMatrix {
    return new TransformMatrix(
      this.a * sx,
      this.b * sx,
      this.c * sy,
      this.d * sy,
      this.tx,
      this.ty
    );
  }

  /**
   * Create rotation matrix
   */
  rotate(radians: number): TransformMatrix {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return new TransformMatrix(
      this.a * cos + this.c * sin,
      this.b * cos + this.d * sin,
      this.c * cos - this.a * sin,
      this.d * cos - this.b * sin,
      this.tx,
      this.ty
    );
  }

  /**
   * Create translation matrix
   */
  translate(dx: number, dy: number): TransformMatrix {
    return new TransformMatrix(
      this.a,
      this.b,
      this.c,
      this.d,
      this.tx + dx,
      this.ty + dy
    );
  }

  /**
   * Multiply with another matrix
   */
  multiply(other: TransformMatrix): TransformMatrix {
    return new TransformMatrix(
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.tx + this.c * other.ty + this.tx,
      this.b * other.tx + this.d * other.ty + this.ty
    );
  }

  /**
   * Transform a point using this matrix
   */
  transformPoint(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: this.a * point.x + this.c * point.y + this.tx,
      y: this.b * point.x + this.d * point.y + this.ty,
    };
  }

  /**
   * Calculate the determinant (for flip detection)
   */
  determinant(): number {
    return this.a * this.d - this.b * this.c;
  }

  /**
   * Check if matrix represents a flip transformation
   */
  hasFlip(): boolean {
    return this.determinant() < 0;
  }
}
