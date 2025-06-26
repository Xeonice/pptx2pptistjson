import { eachElement, getTextByPathList } from './utils';
import { applyTint } from './color';
function extractChartColors(serNode, warpObj) {
    const nodes = Array.isArray(serNode) ? serNode : [serNode];
    const schemeClrs = [];
    for (const node of nodes) {
        let schemeClr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:schemeClr']);
        if (!schemeClr)
            schemeClr = getTextByPathList(node, ['c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr']);
        if (!schemeClr)
            schemeClr = getTextByPathList(node, ['c:marker', 'c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr']);
        let clr = getTextByPathList(schemeClr, ['attrs', 'val']);
        if (clr) {
            clr = getTextByPathList(warpObj.themeContent, ['a:theme', 'a:themeElements', 'a:clrScheme', `a:${clr}`, 'a:srgbClr', 'attrs', 'val']);
            const tint = getTextByPathList(schemeClr, ['a:tint', 'attrs', 'val']) / 100000;
            if (clr && !isNaN(tint)) {
                clr = applyTint(clr, tint);
            }
        }
        else {
            clr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:srgbClr', 'attrs', 'val']);
        }
        if (clr)
            clr = '#' + clr;
        schemeClrs.push(clr);
    }
    return schemeClrs;
}
function extractChartData(serNode) {
    const dataMat = [];
    if (!serNode)
        return dataMat;
    if (serNode['c:xVal']) {
        let dataRow = [];
        eachElement(serNode['c:xVal']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
            dataRow.push(parseFloat(innerNode['c:v']));
            return '';
        });
        dataMat.push(dataRow);
        dataRow = [];
        eachElement(serNode['c:yVal']['c:numRef']['c:numCache']['c:pt'], (innerNode) => {
            dataRow.push(parseFloat(innerNode['c:v']));
            return '';
        });
        dataMat.push(dataRow);
    }
    else {
        eachElement(serNode, (innerNode, index) => {
            const dataRow = [];
            const colName = getTextByPathList(innerNode, ['c:tx', 'c:strRef', 'c:strCache', 'c:pt', 'c:v']) || index;
            dataRow.push(colName);
            eachElement(innerNode['c:val']['c:numRef']['c:numCache']['c:pt'], (valNode) => {
                dataRow.push(parseFloat(valNode['c:v']));
                return '';
            });
            dataMat.push(dataRow);
            return '';
        });
    }
    return dataMat;
}
export function getChartInfo(plotArea, warpObj) {
    if (!plotArea)
        return null;
    // Detect chart type
    let chartType = '';
    let seriesNode = null;
    if (plotArea['c:barChart']) {
        chartType = 'bar';
        seriesNode = plotArea['c:barChart']['c:ser'];
    }
    else if (plotArea['c:lineChart']) {
        chartType = 'line';
        seriesNode = plotArea['c:lineChart']['c:ser'];
    }
    else if (plotArea['c:pieChart']) {
        chartType = 'pie';
        seriesNode = plotArea['c:pieChart']['c:ser'];
    }
    else if (plotArea['c:doughnutChart']) {
        chartType = 'doughnut';
        seriesNode = plotArea['c:doughnutChart']['c:ser'];
    }
    else if (plotArea['c:areaChart']) {
        chartType = 'area';
        seriesNode = plotArea['c:areaChart']['c:ser'];
    }
    else if (plotArea['c:scatterChart']) {
        chartType = 'scatter';
        seriesNode = plotArea['c:scatterChart']['c:ser'];
    }
    if (!seriesNode)
        return null;
    const data = extractChartData(seriesNode);
    const colors = extractChartColors(seriesNode, warpObj);
    const result = {
        data,
        colors,
        type: chartType,
    };
    // Additional chart properties
    if (chartType === 'bar') {
        const barDir = getTextByPathList(plotArea['c:barChart'], ['c:barDir', 'attrs', 'val']);
        if (barDir)
            result.barDir = barDir;
        const grouping = getTextByPathList(plotArea['c:barChart'], ['c:grouping', 'attrs', 'val']);
        if (grouping)
            result.grouping = grouping;
    }
    if (chartType === 'line') {
        const marker = getTextByPathList(plotArea['c:lineChart'], ['c:marker', 'attrs', 'val']);
        result.marker = marker === '1';
    }
    if (chartType === 'doughnut') {
        const holeSize = getTextByPathList(plotArea['c:doughnutChart'], ['c:holeSize', 'attrs', 'val']);
        if (holeSize)
            result.holeSize = parseInt(holeSize);
    }
    return result;
}
//# sourceMappingURL=chart.js.map