/**
 * Legacy compatibility layer for existing app code
 */

import { pptxParser } from './parser/InternalPPTXParser';

/**
 * Legacy parse function for compatibility
 */
export async function parse(file: ArrayBuffer | Blob): Promise<any> {
  const result = await pptxParser.parseToJSON(file);
  
  // Convert to legacy format for backward compatibility
  return {
    slides: result.slides.map((slide: any) => ({
      ...slide,
      elements: slide.elements.map((element: any) => ({
        ...element,
        // Ensure legacy position properties exist
        left: element.position?.x || element.left || 0,
        top: element.position?.y || element.top || 0,
        width: element.size?.width || element.width || 0,
        height: element.size?.height || element.height || 0,
        name: element.id, // Map id to name for legacy compatibility
      }))
    })),
    theme: result.theme,
    title: result.title || "Presentation"
  };
}

/**
 * Placeholder for PPTist format parsing
 * In the future, this could be implemented as a different export format
 */
export async function parseToPPTist(file: ArrayBuffer | Blob): Promise<any> {
  // For now, return the same format as the regular parser
  // This could be extended to format data specifically for PPTist
  const result = await pptxParser.parseToJSON(file);
  
  // Convert to PPTist-like format
  return {
    slides: result.slides.map((slide: any, index: number) => ({
      id: slide.id || `slide-${index + 1}`,
      elements: slide.elements.map((element: any) => ({
        id: element.id,
        type: element.type,
        left: element.position?.x || 0,
        top: element.position?.y || 0,
        width: element.size?.width || 100,
        height: element.size?.height || 100,
        ...element
      }))
    })),
    slideSize: result.slideSize,
    theme: result.theme
  };
}

// Export the parser instance for advanced usage
export { pptxParser };