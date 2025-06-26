// Error Types for better error handling
export class PPTXParseError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'PPTXParseError';
    }
}
export class XMLParseError extends Error {
    constructor(message, filename, cause) {
        super(message);
        this.filename = filename;
        this.cause = cause;
        this.name = 'XMLParseError';
    }
}
// Type Guards
export function isTextElement(element) {
    return element.type === 'text';
}
export function isShapeElement(element) {
    return element.type === 'shape';
}
export function isImageElement(element) {
    return element.type === 'image';
}
export function isVideoElement(element) {
    return element.type === 'video';
}
export function isAudioElement(element) {
    return element.type === 'audio';
}
export function isMathElement(element) {
    return element.type === 'math';
}
export function isTableElement(element) {
    return element.type === 'table';
}
export function isChartElement(element) {
    return element.type === 'chart';
}
export function isGroupElement(element) {
    return element.type === 'group';
}
export function isDiagramElement(element) {
    return element.type === 'diagram';
}
//# sourceMappingURL=types.js.map