import { getHorizontalAlign } from './align';
import { getTextByPathList } from './utils';
import { getFontType, getFontColor, getFontSize, getFontBold, getFontItalic, getFontDecoration, } from './fontStyle';
export function genTextBody(textBodyNode, spNode, _slideLayoutSpNode, type, warpObj) {
    if (!textBodyNode || !warpObj)
        return '';
    let text = '';
    const pFontStyle = getTextByPathList(spNode, ['p:style', 'a:fontRef']);
    const pNode = textBodyNode['a:p'];
    const pNodes = Array.isArray(pNode) ? pNode : [pNode];
    for (const pNode of pNodes) {
        let rNode = pNode['a:r'];
        let fldNode = pNode['a:fld'];
        let brNode = pNode['a:br'];
        if (rNode) {
            rNode = Array.isArray(rNode) ? rNode : [rNode];
            if (fldNode) {
                fldNode = Array.isArray(fldNode) ? fldNode : [fldNode];
                rNode = rNode.concat(fldNode);
            }
            if (brNode) {
                brNode = Array.isArray(brNode) ? brNode : [brNode];
                brNode.forEach((item) => item.type = 'br');
                if (brNode.length > 1)
                    brNode.shift();
                rNode = rNode.concat(brNode);
                rNode.sort((a, b) => {
                    if (!a.attrs || !b.attrs)
                        return 0;
                    return a.attrs.order - b.attrs.order;
                });
            }
            const pPrNode = pNode['a:pPr'];
            const align = getHorizontalAlign(pNode, pNode, type, warpObj);
            const isRtl = getTextByPathList(pPrNode, ['attrs', 'rtl']) === '1';
            text += `<p style="text-align: ${align}; direction: ${isRtl ? 'rtl' : 'ltr'};">`;
            for (const rNodeItem of rNode) {
                if (rNodeItem.type === 'br') {
                    text += '<br>';
                    continue;
                }
                const tNode = rNodeItem['a:t'];
                if (!tNode)
                    continue;
                const fontFamily = getFontType(rNodeItem, type, warpObj);
                const fontSize = getFontSize(rNodeItem, textBodyNode, 1);
                const fontColor = getFontColor(rNodeItem, pNode, textBodyNode, pFontStyle, 1, warpObj);
                const fontBold = getFontBold(rNodeItem, textBodyNode, 1);
                const fontItalic = getFontItalic(rNodeItem, textBodyNode, 1);
                const textDecoration = getFontDecoration(rNodeItem);
                let styles = '';
                if (fontFamily)
                    styles += `font-family: ${fontFamily};`;
                if (fontSize)
                    styles += `font-size: ${fontSize}pt;`;
                if (fontColor)
                    styles += `color: ${fontColor};`;
                if (fontBold)
                    styles += 'font-weight: bold;';
                if (fontItalic)
                    styles += 'font-style: italic;';
                if (textDecoration !== 'none')
                    styles += `text-decoration: ${textDecoration};`;
                text += styles ? `<span style="${styles}">${tNode}</span>` : tNode;
            }
            text += '</p>';
        }
        else {
            // Empty paragraph
            text += '<p></p>';
        }
    }
    return text;
}
//# sourceMappingURL=text.js.map