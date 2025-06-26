import { getTextByPathList } from './utils';
export function findOMath(obj) {
    let results = [];
    if (typeof obj !== 'object' || obj === null)
        return results;
    if (obj['m:oMath'])
        results = results.concat(obj['m:oMath']);
    Object.values(obj).forEach(value => {
        if (Array.isArray(value) || typeof value === 'object') {
            results = results.concat(findOMath(value));
        }
    });
    return results;
}
export function parseFraction(fraction) {
    const numerator = parseOMath(fraction['m:num']);
    const denominator = parseOMath(fraction['m:den']);
    return `\\frac{${numerator}}{${denominator}}`;
}
export function parseSuperscript(superscript) {
    const base = parseOMath(superscript['m:e']);
    const sup = parseOMath(superscript['m:sup']);
    return `${base}^{${sup}}`;
}
export function parseSubscript(subscript) {
    const base = parseOMath(subscript['m:e']);
    const sub = parseOMath(subscript['m:sub']);
    return `${base}_{${sub}}`;
}
export function parseRadical(radical) {
    const degree = parseOMath(radical['m:deg']);
    const expression = parseOMath(radical['m:e']);
    return degree ? `\\sqrt[${degree}]{${expression}}` : `\\sqrt{${expression}}`;
}
export function parseMatrix(matrix) {
    const rows = matrix['m:mr'];
    if (!Array.isArray(rows))
        return '';
    const matrixRows = rows.map((row) => {
        if (!row['m:e'] || !Array.isArray(row['m:e']))
            return '';
        return row['m:e'].map((element) => parseOMath(element)).join(' & ');
    });
    return `\\begin{matrix} ${matrixRows.join(' \\\\ ')} \\end{matrix}`;
}
export function parseNary(nary) {
    const op = getTextByPathList(nary, ['m:naryPr', 'm:chr', 'attrs', 'm:val']) || '∫';
    const sub = parseOMath(nary['m:sub']);
    const sup = parseOMath(nary['m:sup']);
    const e = parseOMath(nary['m:e']);
    return `${op}_{${sub}}^{${sup}}{${e}}`;
}
export function parseLimit(limit, type) {
    const base = parseOMath(limit['m:e']);
    const lim = parseOMath(limit['m:lim']);
    return type === 'low' ? `${base}_{${lim}}` : `${base}^{${lim}}`;
}
export function parseDelimiter(delimiter) {
    let left = getTextByPathList(delimiter, ['m:dPr', 'm:begChr', 'attrs', 'm:val']);
    let right = getTextByPathList(delimiter, ['m:dPr', 'm:endChr', 'attrs', 'm:val']);
    if (!left && !right) {
        left = '(';
        right = ')';
    }
    if (left && right) {
        left = `\\left${left}`;
        right = `\\right${right}`;
    }
    const e = parseOMath(delimiter['m:e']);
    return `${left}${e}${right}`;
}
export function parseFunction(func) {
    const name = parseOMath(func['m:fName']);
    const arg = parseOMath(func['m:e']);
    return `\\${name}{${arg}}`;
}
export function parseGroupChr(groupChr) {
    const chr = getTextByPathList(groupChr, ['m:groupChrPr', 'm:chr', 'attrs', 'm:val']) || '';
    const e = parseOMath(groupChr['m:e']);
    return `${chr}${e}${chr}`;
}
export function parseEqArr(eqArr) {
    if (!eqArr['m:e'] || !Array.isArray(eqArr['m:e']))
        return '';
    const equations = eqArr['m:e'].map((eq) => parseOMath(eq)).join(' \\\\ ');
    return `\\begin{cases} ${equations} \\end{cases}`;
}
export function parseBar(bar) {
    const e = parseOMath(bar['m:e']);
    const pos = getTextByPathList(bar, ['m:barPr', 'm:pos', 'attrs', 'm:val']);
    return pos === 'top' ? `\\overline{${e}}` : `\\underline{${e}}`;
}
export function parseAccent(accent) {
    const chr = getTextByPathList(accent, ['m:accPr', 'm:chr', 'attrs', 'm:val']) || '^';
    const e = parseOMath(accent['m:e']);
    switch (chr) {
        case '\u0301':
            return `\\acute{${e}}`;
        case '\u0300':
            return `\\grave{${e}}`;
        case '\u0302':
            return `\\hat{${e}}`;
        case '\u0303':
            return `\\tilde{${e}}`;
        case '\u0304':
            return `\\bar{${e}}`;
        case '\u0306':
            return `\\breve{${e}}`;
        case '\u0307':
            return `\\dot{${e}}`;
        case '\u0308':
            return `\\ddot{${e}}`;
        case '\u030A':
            return `\\mathring{${e}}`;
        case '\u030B':
            return `\\H{${e}}`;
        case '\u030C':
            return `\\check{${e}}`;
        case '\u0327':
            return `\\c{${e}}`;
        default:
            return `\\${chr}{${e}}`;
    }
}
export function parseBox(box) {
    const e = parseOMath(box['m:e']);
    return `\\boxed{${e}}`;
}
export function parseOMath(oMath) {
    if (!oMath)
        return '';
    if (Array.isArray(oMath)) {
        return oMath.map(item => parseOMath(item)).join('');
    }
    if (typeof oMath === 'string') {
        return oMath;
    }
    if (typeof oMath !== 'object') {
        return String(oMath);
    }
    const oMathList = [];
    const keys = Object.keys(oMath);
    for (const key of keys) {
        if (Array.isArray(oMath[key])) {
            oMathList.push(...oMath[key].map((item) => ({ key, value: item })));
        }
        else {
            oMathList.push({ key, value: oMath[key] });
        }
    }
    oMathList.sort((a, b) => {
        let oA = 0;
        if (a.key === 'm:r' && a.value?.['a:rPr']?.['attrs']?.['order']) {
            oA = parseInt(a.value['a:rPr']['attrs']['order']);
        }
        else if (a.value?.[`${a.key}Pr`]?.['m:ctrlPr']?.['a:rPr']?.['attrs']?.['order']) {
            oA = parseInt(a.value[`${a.key}Pr`]['m:ctrlPr']['a:rPr']['attrs']['order']);
        }
        let oB = 0;
        if (b.key === 'm:r' && b.value?.['a:rPr']?.['attrs']?.['order']) {
            oB = parseInt(b.value['a:rPr']['attrs']['order']);
        }
        else if (b.value?.[`${b.key}Pr`]?.['m:ctrlPr']?.['a:rPr']?.['attrs']?.['order']) {
            oB = parseInt(b.value[`${b.key}Pr`]['m:ctrlPr']['a:rPr']['attrs']['order']);
        }
        return oA - oB;
    });
    return oMathList.map(({ key, value }) => {
        switch (key) {
            case 'm:f': return parseFraction(value);
            case 'm:sSup': return parseSuperscript(value);
            case 'm:sSub': return parseSubscript(value);
            case 'm:rad': return parseRadical(value);
            case 'm:nary': return parseNary(value);
            case 'm:limLow': return parseLimit(value, 'low');
            case 'm:limUpp': return parseLimit(value, 'upp');
            case 'm:d': return parseDelimiter(value);
            case 'm:func': return parseFunction(value);
            case 'm:groupChr': return parseGroupChr(value);
            case 'm:eqArr': return parseEqArr(value);
            case 'm:bar': return parseBar(value);
            case 'm:acc': return parseAccent(value);
            case 'm:borderBox': return parseBox(value);
            case 'm:m': return parseMatrix(value);
            case 'm:r': return parseOMath(value);
            case 'm:t': return value;
            default: return '';
        }
    }).join('');
}
export function latexFormart(latex) {
    return latex
        .replaceAll(/&lt;/g, '<')
        .replaceAll(/&gt;/g, '>')
        .replaceAll(/&amp;/g, '&')
        .replaceAll(/&apos;/g, "'")
        .replaceAll(/&quot;/g, '"');
}
//# sourceMappingURL=math.js.map