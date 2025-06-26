import { getBorder } from './border';
import { getSolidFill } from './fill';
import type { XmlNode, ProcessingContext } from './types';

export function getTableBorders(tblBorderStyl: XmlNode, warpObj: ProcessingContext): any {
  return getBorder(tblBorderStyl, undefined, warpObj);
}

export function getTableCellParams(
  tcNode: XmlNode, 
  thisTblStyle: XmlNode, 
  a_source: string, 
  warpObj: ProcessingContext
): any {
  const tcPr = tcNode['a:tcPr'];
  let rowSpan: number | undefined;
  let colSpan: number | undefined;
  let vMerge: boolean | undefined;
  let hMerge: boolean | undefined;
  let borders: any;
  let fillColor: string | undefined;
  let fontColor: string | undefined;
  let fontBold: boolean | undefined;

  if (tcPr) {
    // Row and column span
    if (tcPr.attrs?.rowSpan) rowSpan = parseInt(tcPr.attrs.rowSpan);
    if (tcPr.attrs?.gridSpan) colSpan = parseInt(tcPr.attrs.gridSpan);
    if (tcPr.attrs?.vMerge) vMerge = tcPr.attrs.vMerge === '1';
    if (tcPr.attrs?.hMerge) hMerge = tcPr.attrs.hMerge === '1';

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

export function getTableRowParams(
  trNodes: XmlNode[], 
  rowIndex: number, 
  tblStylAttrObj: any, 
  thisTblStyle: XmlNode, 
  warpObj: ProcessingContext
): any {
  let fillColor: string | undefined;
  let fontColor: string | undefined;
  let fontBold: boolean | undefined;

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