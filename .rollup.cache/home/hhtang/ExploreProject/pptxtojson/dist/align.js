import { getTextByPathList } from './utils';
export function getHorizontalAlign(node, pNode, type, warpObj) {
    let algn = getTextByPathList(node, ['a:pPr', 'attrs', 'algn']);
    if (!algn) {
        algn = getTextByPathList(pNode, ['a:pPr', 'attrs', 'algn']);
    }
    if (!algn) {
        if (type === 'title' || type === 'ctrTitle' || type === 'subTitle') {
            let lvlIdx = 1;
            const lvlNode = getTextByPathList(pNode, ['a:pPr', 'attrs', 'lvl']);
            if (lvlNode) {
                lvlIdx = parseInt(lvlNode) + 1;
            }
            const lvlStr = 'a:lvl' + lvlIdx + 'pPr';
            algn = getTextByPathList(warpObj.slideLayoutTables, ['typeTable', type, 'p:txBody', 'a:lstStyle', lvlStr, 'attrs', 'algn']);
            if (!algn) {
                algn = getTextByPathList(warpObj.slideMasterTables, ['typeTable', type, 'p:txBody', 'a:lstStyle', lvlStr, 'attrs', 'algn']);
            }
            if (!algn) {
                algn = getTextByPathList(warpObj.slideMasterTextStyles, ['p:titleStyle', lvlStr, 'attrs', 'algn']);
            }
            if (!algn && type === 'subTitle') {
                algn = getTextByPathList(warpObj.slideMasterTextStyles, ['p:bodyStyle', lvlStr, 'attrs', 'algn']);
            }
        }
        else if (type === 'body') {
            algn = getTextByPathList(warpObj.slideMasterTextStyles, ['p:bodyStyle', 'a:lvl1pPr', 'attrs', 'algn']);
        }
        else if (type) {
            algn = getTextByPathList(warpObj.slideMasterTables, ['typeTable', type, 'p:txBody', 'a:lstStyle', 'a:lvl1pPr', 'attrs', 'algn']);
        }
    }
    if (algn) {
        switch (algn) {
            case 'l':
                return 'left';
            case 'r':
                return 'right';
            case 'ctr':
                return 'center';
            case 'just':
            case 'dist':
                return 'justify';
            default:
                return 'left';
        }
    }
    return 'left';
}
export function getVerticalAlign(node, slideLayoutSpNode, slideMasterSpNode) {
    let anchor = getTextByPathList(node, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor']);
    if (!anchor) {
        anchor = getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor']);
        if (!anchor) {
            anchor = getTextByPathList(slideMasterSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor']);
            if (!anchor) {
                anchor = 't';
            }
        }
    }
    if (anchor === 'ctr')
        return 'mid';
    if (anchor === 'b')
        return 'bottom';
    return 'top';
}
//# sourceMappingURL=align.js.map