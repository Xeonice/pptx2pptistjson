import { Element } from '../../models/domain/elements/Element';
import { XmlNode } from '../../models/xml/XmlNode';
import { ProcessingContext } from './ProcessingContext';

/**
 * Interface for element processors
 */
export interface IElementProcessor<T extends Element = Element> {
  /**
   * Check if this processor can handle the given XML node
   */
  canProcess(xmlNode: XmlNode): boolean;

  /**
   * Process the XML node and return an element
   */
  process(xmlNode: XmlNode, context: ProcessingContext): Promise<T>;

  /**
   * Get the element type this processor handles
   */
  getElementType(): string;
}