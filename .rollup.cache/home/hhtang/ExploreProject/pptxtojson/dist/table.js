import { getBorder } from './border';
import { getSolidFill } from './fill';
export function getTableBorders(tblBorderStyl, warpObj) {
    return getBorder(tblBorderStyl, undefined, warpObj);
}
export function getTableCellParams(tcNode, thisTblStyle, a_source, warpObj) {
    const tcPr = tcNode['a:tcPr'];
    let rowSpan;
    let colSpan;
    let vMerge;
    let hMerge;
    let borders;
    let fillColor;
    let fontColor;
    let fontBold;
    if (tcPr) {
        // Row and column span
        if (tcPr.attrs?.rowSpan)
            rowSpan = parseInt(tcPr.attrs.rowSpan);
        if (tcPr.attrs?.gridSpan)
            colSpan = parseInt(tcPr.attrs.gridSpan);
        if (tcPr.attrs?.vMerge)
            vMerge = tcPr.attrs.vMerge === '1';
        if (tcPr.attrs?.hMerge)
            hMerge = tcPr.attrs.hMerge === '1';
        // Cell borders
        const tcBorders = tcPr['a:tcBdr'];
        if (tcBorders) {
            borders = getTableBorders(tcBorders, warpObj);
        }
        // Cell fill
        const solidFill = tcPr['a:solidFill'];
        if (solidFill) {
            fillColor = getSolidFill(solidFill, undefined, undefined, warpObj);
        }
    }
    // Get style from table style if available
    if (thisTblStyle && a_source) {
        const styleNode = thisTblStyle[a_source];
        if (styleNode) {
            const tcStyle = styleNode['a:tcStyle'];
            if (tcStyle) {
                if (!fillColor && tcStyle['a:fill']) {
                    fillColor = getSolidFill(tcStyle['a:fill']['a:solidFill'], undefined, undefined, warpObj);
                }
                if (!borders && tcStyle['a:tcBdr']) {
                    borders = getTableBorders(tcStyle['a:tcBdr'], warpObj);
                }
            }
        }
    }
    return {
        rowSpan,
        colSpan,
        vMerge,
        hMerge,
        borders,
        fillColor,
        fontColor,
        fontBold,
    };
}
export function getTableRowParams(trNodes, rowIndex, tblStylAttrObj, thisTblStyle, warpObj) {
    let fillColor;
    let fontColor;
    let fontBold;
    // Check for banded rows
    if (tblStylAttrObj.isBandRowAttr === 1 && thisTblStyle) {
        const isEvenRow = rowIndex % 2 === 0;
        const bandStyle = isEvenRow ? thisTblStyle['a:band1H'] : thisTblStyle['a:band2H'];
        if (bandStyle) {
            const tcStyle = bandStyle['a:tcStyle'];
            if (tcStyle) {
                if (tcStyle['a:fill']) {
                    fillColor = getSolidFill(tcStyle['a:fill']['a:solidFill'], undefined, undefined, warpObj);
                }
            }
        }
    }
    // Check for first/last row styling
    if (rowIndex === 0 && tblStylAttrObj.isFrstRowAttr === 1 && thisTblStyle) {
        const firstRowStyle = thisTblStyle['a:firstRow'];
        if (firstRowStyle) {
            const tcStyle = firstRowStyle['a:tcStyle'];
            if (tcStyle) {
                if (tcStyle['a:fill']) {
                    fillColor = getSolidFill(tcStyle['a:fill']['a:solidFill'], undefined, undefined, warpObj);
                }
                fontBold = true;
            }
        }
    }
    if (rowIndex === trNodes.length - 1 && tblStylAttrObj.isLstRowAttr === 1 && thisTblStyle) {
        const lastRowStyle = thisTblStyle['a:lastRow'];
        if (lastRowStyle) {
            const tcStyle = lastRowStyle['a:tcStyle'];
            if (tcStyle) {
                if (tcStyle['a:fill']) {
                    fillColor = getSolidFill(tcStyle['a:fill']['a:solidFill'], undefined, undefined, warpObj);
                }
                fontBold = true;
            }
        }
    }
    return {
        fillColor,
        fontColor,
        fontBold,
    };
}
//# sourceMappingURL=table.js.map