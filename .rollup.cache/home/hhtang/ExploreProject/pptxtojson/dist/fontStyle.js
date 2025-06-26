import { getTextByPathList } from './utils';
import { getShadow } from './shadow';
import { getFillType, getSolidFill } from './fill';
export function getFontType(node, type, warpObj) {
    let typeface = getTextByPathList(node, ['a:rPr', 'a:latin', 'attrs', 'typeface']);
    if (!typeface) {
        const fontSchemeNode = getTextByPathList(warpObj.themeContent, ['a:theme', 'a:themeElements', 'a:fontScheme']);
        if (type === 'title' || type === 'subTitle' || type === 'ctrTitle') {
            typeface = getTextByPathList(fontSchemeNode, ['a:majorFont', 'a:latin', 'attrs', 'typeface']);
        }
        else if (type === 'body') {
            typeface = getTextByPathList(fontSchemeNode, ['a:minorFont', 'a:latin', 'attrs', 'typeface']);
        }
        else {
            typeface = getTextByPathList(fontSchemeNode, ['a:minorFont', 'a:latin', 'attrs', 'typeface']);
        }
    }
    return typeface || '';
}
export function getFontColor(node, pNode, lstStyle, pFontStyle, lvl, warpObj) {
    const rPrNode = getTextByPathList(node, ['a:rPr']);
    let filTyp;
    let color = '';
    if (rPrNode) {
        filTyp = getFillType(rPrNode);
        if (filTyp === 'SOLID_FILL') {
            const solidFillNode = rPrNode['a:solidFill'];
            color = getSolidFill(solidFillNode, undefined, undefined, warpObj);
        }
    }
    if (!color && getTextByPathList(lstStyle, ['a:lvl' + lvl + 'pPr', 'a:defRPr'])) {
        const lstStyledefRPr = getTextByPathList(lstStyle, ['a:lvl' + lvl + 'pPr', 'a:defRPr']);
        filTyp = getFillType(lstStyledefRPr);
        if (filTyp === 'SOLID_FILL') {
            const solidFillNode = lstStyledefRPr['a:solidFill'];
            color = getSolidFill(solidFillNode, undefined, undefined, warpObj);
        }
    }
    if (!color) {
        const sPstyle = getTextByPathList(pNode, ['p:style', 'a:fontRef']);
        if (sPstyle)
            color = getSolidFill(sPstyle, undefined, undefined, warpObj);
        if (!color && pFontStyle)
            color = getSolidFill(pFontStyle, undefined, undefined, warpObj);
    }
    return color || '';
}
export function getFontSize(node, lstStyle, lvl) {
    let fontSize = getTextByPathList(node, ['a:rPr', 'attrs', 'sz']);
    if (!fontSize && lstStyle) {
        fontSize = getTextByPathList(lstStyle, ['a:lvl' + lvl + 'pPr', 'a:defRPr', 'attrs', 'sz']);
    }
    return fontSize ? parseInt(fontSize) / 100 : 18;
}
export function getFontBold(node, lstStyle, lvl) {
    let bold = getTextByPathList(node, ['a:rPr', 'attrs', 'b']);
    if (!bold && lstStyle) {
        bold = getTextByPathList(lstStyle, ['a:lvl' + lvl + 'pPr', 'a:defRPr', 'attrs', 'b']);
    }
    return bold === '1';
}
export function getFontItalic(node, lstStyle, lvl) {
    let italic = getTextByPathList(node, ['a:rPr', 'attrs', 'i']);
    if (!italic && lstStyle) {
        italic = getTextByPathList(lstStyle, ['a:lvl' + lvl + 'pPr', 'a:defRPr', 'attrs', 'i']);
    }
    return italic === '1';
}
export function getFontDecoration(node) {
    const u = getTextByPathList(node, ['a:rPr', 'attrs', 'u']);
    const strike = getTextByPathList(node, ['a:rPr', 'attrs', 'strike']);
    if (u === 'sng')
        return 'underline';
    if (strike === 'sngStrike')
        return 'line-through';
    return 'none';
}
export function getFontDecorationLine(node) {
    return getFontDecoration(node);
}
export function getFontSpace(node) {
    const spacing = getTextByPathList(node, ['a:rPr', 'attrs', 'spc']);
    return spacing ? parseInt(spacing) / 100 : 0;
}
export function getFontSubscript(node) {
    const baseline = getTextByPathList(node, ['a:rPr', 'attrs', 'baseline']);
    return baseline ? parseInt(baseline) < 0 : false;
}
export function getFontShadow(node, warpObj) {
    const effectLst = getTextByPathList(node, ['a:rPr', 'a:effectLst']);
    if (effectLst) {
        const outerShdw = effectLst['a:outerShdw'];
        if (outerShdw) {
            const shadow = getShadow(outerShdw, warpObj);
            return `${shadow.h}pt ${shadow.v}pt ${shadow.blur}pt ${shadow.color}`;
        }
    }
    return '';
}
//# sourceMappingURL=fontStyle.js.map