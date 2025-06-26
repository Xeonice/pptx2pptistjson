import type { XmlNode, ProcessingContext } from './types';
/**
 * Load slide relationships and populate the resource objects
 */
export declare function loadSlideRelationships(zip: any, slideFileName: string, context: ProcessingContext): Promise<void>;
/**
 * Get position node from slide, layout, or master
 */
export declare function getPositionNode(element: XmlNode, elementType: string, context: ProcessingContext): {
    slideNode?: XmlNode;
    layoutNode?: XmlNode;
    masterNode?: XmlNode;
};
//# sourceMappingURL=slideRelationships.d.ts.map