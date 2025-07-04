import { GroupTransform, ProcessingContext } from '../interfaces/ProcessingContext';
import { DebugHelper } from './DebugHelper';

/**
 * Utility class for applying group transformations consistently across all element processors
 */
export class GroupTransformUtils {
  /**
   * Apply group transform to coordinates using standard PowerPoint transform formula
   * @param x - Original X coordinate in EMU
   * @param y - Original Y coordinate in EMU 
   * @param groupTransform - Group transformation to apply
   * @param context - Processing context for debug logging
   * @returns Transformed coordinates in EMU
   */
  static applyGroupTransformToCoordinates(
    x: number,
    y: number,
    groupTransform: GroupTransform,
    context: ProcessingContext
  ): { x: number; y: number } {
    // Use standard 4-step group transform formula
    // 1. Calculate relative position from child coordinate space origin
    const relativeX = x - (groupTransform.childOffset?.x || 0);
    const relativeY = y - (groupTransform.childOffset?.y || 0);
    
    // 2. Apply scale transformation
    const scaledX = relativeX * groupTransform.scaleX;
    const scaledY = relativeY * groupTransform.scaleY;
    
    // 3. Add group position in slide coordinates
    const finalX = scaledX + (groupTransform.offset?.x || 0);
    const finalY = scaledY + (groupTransform.offset?.y || 0);

    DebugHelper.log(
      context,
      `Applied group transform: original(${x}, ${y}) -> relative(${relativeX}, ${relativeY}) -> scaled(${scaledX.toFixed(2)}, ${scaledY.toFixed(2)}) -> final(${finalX}, ${finalY})`,
      "info"
    );

    return { x: finalX, y: finalY };
  }

  /**
   * Apply group transform to coordinates if group transform exists
   * @param x - Original X coordinate in EMU
   * @param y - Original Y coordinate in EMU
   * @param context - Processing context containing potential group transform
   * @returns Transformed coordinates in EMU
   */
  static applyGroupTransformIfExists(
    x: number,
    y: number,
    context: ProcessingContext
  ): { x: number; y: number } {
    if (context.groupTransform) {
      return this.applyGroupTransformToCoordinates(x, y, context.groupTransform, context);
    }
    return { x, y };
  }
}