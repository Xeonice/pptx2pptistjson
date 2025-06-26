import { getSchemeColorFromTheme } from './schemeColor';
import { getTextByPathList } from './utils';
export function getBorder(node, elType, warpObj) {
    let lineNode = getTextByPathList(node, ['p:spPr', 'a:ln']);
    if (!lineNode && warpObj) {
        const lnRefNode = getTextByPathList(node, ['p:style', 'a:lnRef']);
        if (lnRefNode) {
            const lnIdx = getTextByPathList(lnRefNode, ['attrs', 'idx']);
            const themeLines = warpObj.themeContent?.['a:theme']?.['a:themeElements']?.['a:fmtScheme']?.['a:lnStyleLst']?.['a:ln'];
            if (themeLines && Array.isArray(themeLines) && lnIdx) {
                lineNode = themeLines[Number(lnIdx) - 1];
            }
        }
    }
    if (!lineNode) {
        lineNode = node;
    }
    const isNoFill = getTextByPathList(lineNode, ['a:noFill']);
    let borderWidth = isNoFill ? 0 : (parseInt(getTextByPathList(lineNode, ['attrs', 'w'])) / 12700);
    if (isNaN(borderWidth)) {
        if (lineNode) {
            borderWidth = 0;
        }
        else if (elType !== 'obj') {
            borderWidth = 0;
        }
        else {
            borderWidth = 1;
        }
    }
    let borderColor = getTextByPathList(lineNode, ['a:solidFill', 'a:srgbClr', 'attrs', 'val']);
    if (!borderColor && warpObj) {
        const schemeClrNode = getTextByPathList(lineNode, ['a:solidFill', 'a:schemeClr']);
        const schemeClr = 'a:' + getTextByPathList(schemeClrNode, ['attrs', 'val']);
        borderColor = getSchemeColorFromTheme(schemeClr, warpObj);
    }
    if (borderColor) {
        borderColor = '#' + borderColor;
    }
    else {
        borderColor = 'rgba(0,0,0,0)';
    }
    const strokeType = getTextByPathList(lineNode, ['a:prstDash', 'attrs', 'val']);
    let borderType = 'solid';
    let strokeDasharray = '0';
    if (strokeType) {
        switch (strokeType) {
            case 'solid':
                borderType = 'solid';
                strokeDasharray = '0';
                break;
            case 'dash':
                borderType = 'dashed';
                strokeDasharray = '5';
                break;
            case 'dashDot':
                borderType = 'dashed';
                strokeDasharray = '5,5,1,5';
                break;
            case 'dot':
                borderType = 'dotted';
                strokeDasharray = '1,5';
                break;
            case 'lgDash':
                borderType = 'dashed';
                strokeDasharray = '10,5';
                break;
            case 'lgDashDot':
                borderType = 'dashed';
                strokeDasharray = '10,5,1,5';
                break;
            case 'lgDashDotDot':
                borderType = 'dashed';
                strokeDasharray = '10,5,1,5,1,5';
                break;
            case 'sysDash':
                borderType = 'dashed';
                strokeDasharray = '5,2';
                break;
            case 'sysDashDot':
                borderType = 'dashed';
                strokeDasharray = '5,2,1,2';
                break;
            case 'sysDashDotDot':
                borderType = 'dashed';
                strokeDasharray = '5,2,1,2,1,2';
                break;
            case 'sysDot':
                borderType = 'dotted';
                strokeDasharray = '2,2';
                break;
            default:
                borderType = 'solid';
                strokeDasharray = '0';
        }
    }
    return {
        borderColor,
        borderWidth,
        borderType,
        strokeDasharray,
    };
}
//# sourceMappingURL=border.js.map