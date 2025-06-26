import { getSolidFill } from './fill';
import { RATIO_EMUs_Points } from './constants';
export function getShadow(node, warpObj) {
    const shadowColor = getSolidFill(node, undefined, undefined, warpObj);
    const outerShdwAttrs = node.attrs || {};
    const dir = outerShdwAttrs['dir'] ? (parseInt(String(outerShdwAttrs['dir'])) / 60000) : 0;
    const dist = outerShdwAttrs['dist'] ? parseInt(String(outerShdwAttrs['dist'])) * RATIO_EMUs_Points : 0;
    const blurRad = outerShdwAttrs['blurRad'] ? parseInt(String(outerShdwAttrs['blurRad'])) * RATIO_EMUs_Points : 0;
    const vx = dist * Math.sin(dir * Math.PI / 180);
    const hx = dist * Math.cos(dir * Math.PI / 180);
    return {
        h: hx,
        v: vx,
        blur: blurRad,
        color: shadowColor || '#000000',
    };
}
//# sourceMappingURL=shadow.js.map