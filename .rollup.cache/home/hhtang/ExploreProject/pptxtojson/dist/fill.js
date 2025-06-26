import tinycolor from 'tinycolor2';
import { getSchemeColorFromTheme } from './schemeColor';
import { applyShade, applyTint, applyLumOff, applyLumMod, applyHueMod, applySatMod, hslToRgb, getColorName2Hex, } from './color';
import { base64ArrayBuffer, getTextByPathList, angleToDegrees, escapeHtml, getMimeType, toHex, } from './utils';
export function getFillType(node) {
    if (node['a:noFill'])
        return 'NO_FILL';
    if (node['a:solidFill'])
        return 'SOLID_FILL';
    if (node['a:gradFill'])
        return 'GRADIENT_FILL';
    if (node['a:pattFill'])
        return 'PATTERN_FILL';
    if (node['a:blipFill'])
        return 'PIC_FILL';
    if (node['a:grpFill'])
        return 'GROUP_FILL';
    return 'NO_FILL';
}
export async function getPicFill(type, node, warpObj) {
    if (!node)
        return '';
    const rId = getTextByPathList(node, ['a:blip', 'attrs', 'r:embed']);
    let imgPath;
    if (type === 'slideBg' || type === 'slide') {
        imgPath = getTextByPathList(warpObj.slideResObj, [rId, 'target']);
    }
    else if (type === 'slideLayoutBg') {
        imgPath = getTextByPathList(warpObj.layoutResObj, [rId, 'target']);
    }
    else if (type === 'slideMasterBg') {
        imgPath = getTextByPathList(warpObj.masterResObj, [rId, 'target']);
    }
    else if (type === 'themeBg') {
        imgPath = getTextByPathList(warpObj.themeResObj, [rId, 'target']);
    }
    else if (type === 'diagramBg') {
        imgPath = getTextByPathList(warpObj.diagramResObj, [rId, 'target']);
    }
    else {
        return '';
    }
    if (!imgPath)
        return '';
    // Check cache
    const loadedImages = warpObj['loaded-images'] || {};
    let img = loadedImages[imgPath];
    if (!img) {
        imgPath = escapeHtml(imgPath);
        const imgExt = imgPath.split('.').pop();
        if (imgExt === 'xml')
            return '';
        try {
            const imgArrayBuffer = await warpObj.zip.file(imgPath)?.async('arraybuffer');
            if (!imgArrayBuffer)
                return '';
            const imgMimeType = getMimeType(imgExt || '');
            img = `data:${imgMimeType};base64,${base64ArrayBuffer(imgArrayBuffer)}`;
            loadedImages[imgPath] = img;
            warpObj['loaded-images'] = loadedImages;
        }
        catch (error) {
            console.warn(`Failed to load image: ${imgPath}`, error);
            return '';
        }
    }
    return img;
}
export function getPicFillOpacity(node) {
    const aBlipNode = node['a:blip'];
    const aphaModFixNode = getTextByPathList(aBlipNode, ['a:alphaModFix', 'attrs']);
    let opacity = 1;
    if (aphaModFixNode?.amt) {
        opacity = parseInt(aphaModFixNode.amt) / 100000;
    }
    return opacity;
}
export async function getBgPicFill(bgPr, source, warpObj) {
    const picBase64 = await getPicFill(source, bgPr['a:blipFill'], warpObj);
    const aBlipNode = bgPr['a:blipFill']?.['a:blip'];
    const aphaModFixNode = getTextByPathList(aBlipNode, ['a:alphaModFix', 'attrs']);
    let opacity = 1;
    if (aphaModFixNode?.amt) {
        opacity = parseInt(aphaModFixNode.amt) / 100000;
    }
    return { picBase64, opacity };
}
export function getGradientFill(node, warpObj) {
    const gsLst = node['a:gsLst']?.['a:gs'];
    if (!gsLst || !Array.isArray(gsLst))
        return null;
    const colors = [];
    for (let i = 0; i < gsLst.length; i++) {
        const colorValue = getSolidFill(gsLst[i], undefined, undefined, warpObj);
        const pos = getTextByPathList(gsLst[i], ['attrs', 'pos']);
        colors[i] = {
            pos: pos ? (pos / 1000 + '%') : '0%',
            color: colorValue || '#000000',
        };
    }
    const lin = node['a:lin'];
    let rot = 0;
    let pathType = 'line';
    if (lin) {
        rot = angleToDegrees(lin.attrs?.ang);
    }
    else {
        const path = node['a:path'];
        if (path?.attrs?.path) {
            pathType = path.attrs.path;
        }
    }
    return {
        rot,
        path: pathType,
        colors: colors.sort((a, b) => parseInt(a.pos) - parseInt(b.pos)),
    };
}
export function getBgGradientFill(bgPr, phClr, slideMasterContent, warpObj) {
    if (bgPr) {
        const grdFill = bgPr['a:gradFill'];
        if (!grdFill)
            return null;
        const gsLst = grdFill['a:gsLst']?.['a:gs'];
        if (!gsLst || !Array.isArray(gsLst))
            return null;
        const colors = [];
        for (let i = 0; i < gsLst.length; i++) {
            const colorValue = getSolidFill(gsLst[i], slideMasterContent['p:sldMaster']?.['p:clrMap']?.['attrs'], phClr, warpObj);
            const pos = getTextByPathList(gsLst[i], ['attrs', 'pos']);
            colors[i] = {
                pos: pos ? (pos / 1000 + '%') : '0%',
                color: colorValue || '#000000',
            };
        }
        const lin = grdFill['a:lin'];
        let rot = 0;
        let pathType = 'line';
        if (lin) {
            rot = angleToDegrees(lin.attrs?.ang);
        }
        else {
            const path = grdFill['a:path'];
            if (path?.attrs?.path) {
                pathType = path.attrs.path;
            }
        }
        return {
            rot,
            path: pathType,
            colors: colors.sort((a, b) => parseInt(a.pos) - parseInt(b.pos)),
        };
    }
    else if (phClr) {
        return phClr.indexOf('#') === -1 ? `#${phClr}` : phClr;
    }
    return null;
}
export async function getSlideBackgroundFill(warpObj) {
    const slideContent = warpObj.slideContent;
    const slideLayoutContent = warpObj.slideLayoutContent;
    const slideMasterContent = warpObj.slideMasterContent;
    let bgPr = getTextByPathList(slideContent, ['p:sld', 'p:cSld', 'p:bg', 'p:bgPr']);
    let background = '#ffffff';
    let backgroundType = 'color';
    if (bgPr) {
        const bgFillTyp = getFillType(bgPr);
        if (bgFillTyp === 'SOLID_FILL') {
            const sldFill = bgPr['a:solidFill'];
            let clrMapOvr = getColorMapOverride(slideContent, slideLayoutContent || {}, slideMasterContent || {});
            const sldBgClr = getSolidFill(sldFill, clrMapOvr, undefined, warpObj);
            background = sldBgClr;
        }
        else if (bgFillTyp === 'GRADIENT_FILL') {
            const gradientFill = getBgGradientFill(bgPr, undefined, slideMasterContent || {}, warpObj);
            if (typeof gradientFill === 'string') {
                background = gradientFill;
            }
            else if (gradientFill) {
                background = gradientFill;
                backgroundType = 'gradient';
            }
        }
        else if (bgFillTyp === 'PIC_FILL') {
            background = await getBgPicFill(bgPr, 'slideBg', warpObj);
            backgroundType = 'image';
        }
    }
    // Handle bgRef and other cases...
    // (Similar logic but simplified for brevity)
    return {
        type: backgroundType,
        value: background,
    };
}
function getColorMapOverride(slideContent, slideLayoutContent, slideMasterContent) {
    let clrMapOvr = getTextByPathList(slideContent, ['p:sld', 'p:clrMapOvr', 'a:overrideClrMapping', 'attrs']);
    if (clrMapOvr)
        return clrMapOvr;
    clrMapOvr = getTextByPathList(slideLayoutContent, ['p:sldLayout', 'p:clrMapOvr', 'a:overrideClrMapping', 'attrs']);
    if (clrMapOvr)
        return clrMapOvr;
    return getTextByPathList(slideMasterContent, ['p:sldMaster', 'p:clrMap', 'attrs']);
}
export async function getShapeFill(node, _pNode, isSvgMode, warpObj, source) {
    if (!warpObj)
        return '';
    const fillType = getFillType(getTextByPathList(node, ['p:spPr']) || {});
    let type = 'color';
    let fillValue = '';
    if (fillType === 'NO_FILL') {
        return isSvgMode ? 'none' : '';
    }
    else if (fillType === 'SOLID_FILL') {
        const shpFill = node['p:spPr']?.['a:solidFill'];
        fillValue = getSolidFill(shpFill, undefined, undefined, warpObj);
        type = 'color';
    }
    else if (fillType === 'GRADIENT_FILL') {
        const shpFill = node['p:spPr']?.['a:gradFill'];
        fillValue = getGradientFill(shpFill, warpObj);
        type = 'gradient';
    }
    else if (fillType === 'PIC_FILL') {
        const shpFill = node['p:spPr']?.['a:blipFill'];
        const picBase64 = await getPicFill(source || 'slide', shpFill, warpObj);
        const opacity = getPicFillOpacity(shpFill);
        fillValue = { picBase64, opacity };
        type = 'image';
    }
    if (!fillValue) {
        const clrName = getTextByPathList(node, ['p:style', 'a:fillRef']);
        fillValue = getSolidFill(clrName, undefined, undefined, warpObj);
        type = 'color';
    }
    return { type, value: fillValue };
}
export function getSolidFill(solidFill, clrMap, phClr, warpObj) {
    if (!solidFill)
        return '';
    let color = '';
    let clrNode;
    if (solidFill['a:srgbClr']) {
        clrNode = solidFill['a:srgbClr'];
        color = getTextByPathList(clrNode, ['attrs', 'val']) || '';
    }
    else if (solidFill['a:schemeClr']) {
        clrNode = solidFill['a:schemeClr'];
        const schemeClr = 'a:' + getTextByPathList(clrNode, ['attrs', 'val']);
        color = getSchemeColorFromTheme(schemeClr, warpObj, clrMap, phClr) || '';
    }
    else if (solidFill['a:scrgbClr']) {
        clrNode = solidFill['a:scrgbClr'];
        const defBultColorVals = clrNode?.attrs || {};
        const red = String(defBultColorVals.r || '').includes('%') ? String(defBultColorVals.r).split('%')[0] : String(defBultColorVals.r);
        const green = String(defBultColorVals.g || '').includes('%') ? String(defBultColorVals.g).split('%')[0] : String(defBultColorVals.g);
        const blue = String(defBultColorVals.b || '').includes('%') ? String(defBultColorVals.b).split('%')[0] : String(defBultColorVals.b);
        color = toHex(255 * (Number(red) / 100)) + toHex(255 * (Number(green) / 100)) + toHex(255 * (Number(blue) / 100));
    }
    else if (solidFill['a:prstClr']) {
        clrNode = solidFill['a:prstClr'];
        const prstClr = getTextByPathList(clrNode, ['attrs', 'val']);
        color = getColorName2Hex(prstClr) || '';
    }
    else if (solidFill['a:hslClr']) {
        clrNode = solidFill['a:hslClr'];
        const defBultColorVals = clrNode?.attrs || {};
        const hue = Number(defBultColorVals.hue) / 100000;
        const sat = Number(String(defBultColorVals.sat || '').includes('%') ? String(defBultColorVals.sat).split('%')[0] : String(defBultColorVals.sat)) / 100;
        const lum = Number(String(defBultColorVals.lum || '').includes('%') ? String(defBultColorVals.lum).split('%')[0] : String(defBultColorVals.lum)) / 100;
        const hsl2rgb = hslToRgb(hue, sat, lum);
        color = toHex(hsl2rgb.r) + toHex(hsl2rgb.g) + toHex(hsl2rgb.b);
    }
    else if (solidFill['a:sysClr']) {
        clrNode = solidFill['a:sysClr'];
        const sysClr = getTextByPathList(clrNode, ['attrs', 'lastClr']);
        if (sysClr)
            color = sysClr;
    }
    // Apply color transformations
    if (clrNode) {
        let isAlpha = false;
        // Alpha
        const alpha = parseInt(getTextByPathList(clrNode, ['a:alpha', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(alpha)) {
            const al_color = tinycolor(color);
            al_color.setAlpha(alpha);
            color = al_color.toHex8();
            isAlpha = true;
        }
        // Color modifications
        const hueMod = parseInt(getTextByPathList(clrNode, ['a:hueMod', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(hueMod)) {
            color = applyHueMod(color, hueMod, isAlpha);
        }
        const lumMod = parseInt(getTextByPathList(clrNode, ['a:lumMod', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(lumMod)) {
            color = applyLumMod(color, lumMod, isAlpha);
        }
        const lumOff = parseInt(getTextByPathList(clrNode, ['a:lumOff', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(lumOff)) {
            color = applyLumOff(color, lumOff, isAlpha);
        }
        const satMod = parseInt(getTextByPathList(clrNode, ['a:satMod', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(satMod)) {
            color = applySatMod(color, satMod, isAlpha);
        }
        const shade = parseInt(getTextByPathList(clrNode, ['a:shade', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(shade)) {
            color = applyShade(color, shade, isAlpha);
        }
        const tint = parseInt(getTextByPathList(clrNode, ['a:tint', 'attrs', 'val']) || '0') / 100000;
        if (!isNaN(tint)) {
            color = applyTint(color, tint, isAlpha);
        }
    }
    if (color && !color.includes('#')) {
        color = '#' + color;
    }
    return color;
}
//# sourceMappingURL=fill.js.map