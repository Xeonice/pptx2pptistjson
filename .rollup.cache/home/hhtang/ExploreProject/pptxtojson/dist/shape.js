import { getTextByPathList } from './utils';
export function getCustomShapePath(custGeom, w, h) {
    // This is a simplified implementation
    // The actual shape path generation is very complex
    const pathLst = getTextByPathList(custGeom, ['a:pathLst', 'a:path']);
    if (!pathLst)
        return '';
    // Basic path processing - in a real implementation this would be much more complex
    let path = '';
    // Simple rectangle fallback
    if (!path) {
        path = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    }
    return path;
}
//# sourceMappingURL=shape.js.map