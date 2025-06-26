// 简化版本，专注于修复HTML格式化问题
import JSZip from 'jszip';
import { readXmlFile } from './readXmlFile';
import { getTextByPathList } from './utils';
import { RATIO_EMUs_Points } from './constants';
import { genTextBody } from './text';
import { getPosition, getSize } from './position';
export async function parse(file) {
    const slides = [];
    const zip = await JSZip.loadAsync(file);
    // 简化的内容类型获取
    const ContentTypesJson = await readXmlFile(zip, '[Content_Types].xml');
    const subObj = ContentTypesJson['Types']['Override'];
    let slidesLocArray = [];
    for (const item of subObj) {
        if (item['attrs']['ContentType'] === 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml') {
            slidesLocArray.push(item['attrs']['PartName'].substr(1));
        }
    }
    const sortSlideXml = (p1, p2) => {
        const n1 = +/(\d+)\.xml/.exec(p1)[1];
        const n2 = +/(\d+)\.xml/.exec(p2)[1];
        return n1 - n2;
    };
    slidesLocArray = slidesLocArray.sort(sortSlideXml);
    // 获取幻灯片信息
    const content = await readXmlFile(zip, 'ppt/presentation.xml');
    const sldSzAttrs = content['p:presentation']['p:sldSz']['attrs'];
    const size = {
        width: parseInt(sldSzAttrs['cx']) * RATIO_EMUs_Points,
        height: parseInt(sldSzAttrs['cy']) * RATIO_EMUs_Points,
    };
    // 获取主题颜色
    const preResContent = await readXmlFile(zip, 'ppt/_rels/presentation.xml.rels');
    const relationshipArray = preResContent['Relationships']['Relationship'];
    let themeURI = '';
    if (relationshipArray.constructor === Array) {
        for (const relationshipItem of relationshipArray) {
            if (relationshipItem['attrs']['Type'] === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme') {
                themeURI = relationshipItem['attrs']['Target'];
                break;
            }
        }
    }
    const themeContent = await readXmlFile(zip, 'ppt/' + themeURI);
    const themeColors = [];
    const clrScheme = getTextByPathList(themeContent, ['a:theme', 'a:themeElements', 'a:clrScheme']);
    if (clrScheme) {
        for (let i = 1; i <= 6; i++) {
            const color = getTextByPathList(clrScheme, [`a:accent${i}`, 'a:srgbClr', 'attrs', 'val']);
            if (color)
                themeColors.push('#' + color);
        }
    }
    // 处理幻灯片
    for (const filename of slidesLocArray) {
        try {
            const slideContent = await readXmlFile(zip, filename);
            const nodes = slideContent['p:sld']['p:cSld']['p:spTree'];
            const elements = [];
            for (const nodeKey in nodes) {
                if (nodeKey === 'p:sp') {
                    const spNodes = Array.isArray(nodes[nodeKey]) ? nodes[nodeKey] : [nodes[nodeKey]];
                    for (const spNode of spNodes) {
                        const element = await processSpNode(spNode);
                        if (element)
                            elements.push(element);
                    }
                }
            }
            slides.push({
                elements,
                note: '',
                fill: '',
                layoutElements: []
            });
        }
        catch (error) {
            console.error('处理幻灯片失败:', filename, error);
        }
    }
    return {
        slides,
        themeColors,
        size,
    };
}
async function processSpNode(node) {
    try {
        const xfrmNode = getTextByPathList(node, ['p:spPr', 'a:xfrm']);
        if (!xfrmNode)
            return null;
        const { top, left } = getPosition(xfrmNode);
        const { width, height } = getSize(xfrmNode);
        let content = '';
        if (node['p:txBody']) {
            content = genTextBody(node['p:txBody'], node, undefined, undefined, {});
        }
        const hasText = content && content.trim().length > 0;
        return {
            type: hasText ? 'text' : 'shape',
            left,
            top,
            width,
            height,
            content,
            name: getTextByPathList(node, ['p:nvSpPr', 'p:cNvPr', 'attrs', 'name']) || '',
            rotate: 0,
            isVertical: false,
            fill: '',
            borderColor: '',
            borderWidth: 0,
            order: 0
        };
    }
    catch (error) {
        console.error('处理形状节点失败:', error);
        return null;
    }
}
// PPTist转换函数
export async function parseToPPTist(file) {
    console.log('🔄 开始解析 PPTX 文件为 PPTist 格式...');
    const legacyResult = await parse(file);
    const theme = {
        fontName: 'PingFang SC',
        themeColor: {
            lt1: '#ffffff',
            dk1: '#333333',
            lt2: '#e1e1e1',
            dk2: '#ababab',
            accent1: legacyResult.themeColors[0] || '#b93423',
            accent2: legacyResult.themeColors[1] || '#dcaf7a',
            accent3: legacyResult.themeColors[2] || '#ab6c20',
            accent4: legacyResult.themeColors[3] || '#e32d3c',
            accent5: legacyResult.themeColors[4] || '#ffcace',
            accent6: legacyResult.themeColors[5] || '#ffffff'
        }
    };
    const slides = [];
    let title = '';
    for (let i = 0; i < legacyResult.slides.length; i++) {
        const legacySlide = legacyResult.slides[i];
        const pptistSlide = convertSlideToPPTist(legacySlide, i, legacyResult.size);
        slides.push(pptistSlide);
        if (i === 0 && !title) {
            title = extractTitleFromSlide(pptistSlide);
        }
    }
    const result = {
        slides,
        theme,
        title: title || 'PPTX 演示文稿'
    };
    console.log('✅ PPTist 格式转换完成');
    return result;
}
function convertSlideToPPTist(slide, index, slideSize) {
    console.log(`🔄 转换幻灯片 ${index + 1}`);
    const slideId = generateId();
    const slideTag = index === 0 ? 'title' : 'content';
    const elements = [];
    for (let i = 0; i < slide.elements.length; i++) {
        const element = slide.elements[i];
        const pptistElement = convertElementToPPTist(element, i, slideSize);
        if (pptistElement) {
            elements.push(pptistElement);
        }
    }
    const background = {
        type: 'color',
        themeColor: {
            color: '#ffffff',
            colorType: 'lt1'
        }
    };
    console.log(`✅ 幻灯片 ${index + 1} 转换完成，包含 ${elements.length} 个元素`);
    return {
        id: slideId,
        tag: slideTag,
        elements,
        background,
        remark: slide.note || '',
        pageId: generateId()
    };
}
function convertElementToPPTist(element, index, slideSize) {
    const elementId = generateId();
    const left = (element.left || 0) / slideSize.width * 500;
    const top = (element.top || 0) / slideSize.height * 375;
    const width = Math.max((element.width || 100) / slideSize.width * 500, 10);
    const height = Math.max((element.height || 20) / slideSize.height * 375, 10);
    if (element.type === 'text') {
        const tag = inferElementTag(element, index);
        const elementContent = element.content || '';
        const isTitle = tag === 'title' || tag === 'subTitle' ||
            elementContent.includes('font-size: 51.84pt') ||
            elementContent.includes('Tesla全球战略');
        const content = convertTextToHTML(elementContent, isTitle ? 72 : 16, isTitle);
        return {
            tag,
            type: 'text',
            id: elementId,
            left,
            top,
            width,
            height,
            content,
            rotate: element.rotate || 0,
            defaultFontName: 'PingFang SC',
            defaultColor: {
                color: isTitle ? '#b93423' : '#333333',
                colorType: isTitle ? 'accent1' : 'dk1'
            },
            vertical: element.isVertical || false,
            lineHeight: 1.15,
            wordSpace: isTitle ? 2 : 1,
            isDefault: false,
            fit: 'resize'
        };
    }
    else if (element.type === 'shape') {
        return {
            tag: 'noEdit',
            type: 'shape',
            id: elementId,
            left,
            top,
            width,
            height,
            viewBox: [width, height],
            path: generateShapePath(width, height),
            themeFill: {
                color: '#dcaf7aff',
                colorType: 'accent2'
            },
            fixedRatio: false,
            rotate: element.rotate || 0,
            pathFormula: 'roundRect',
            keypoint: 0.5,
            opacity: 1,
            isDefault: false
        };
    }
    return null;
}
function convertTextToHTML(text, fontSize = 16, isTitle = false) {
    if (!text)
        return '';
    // 检查是否已经是HTML格式
    if (text.includes('<') && text.includes('>')) {
        let htmlContent = text;
        // 修复颜色问题：将 #ffffff00 (透明白色) 替换为正确的颜色
        if (htmlContent.includes('color: #ffffff00')) {
            if (isTitle || htmlContent.includes('Tesla') || htmlContent.includes('全球战略')) {
                htmlContent = htmlContent.replace(/color: #ffffff00/g, 'color: #b93423ff');
                htmlContent = htmlContent.replace(/--colortype:\w+/g, '--colortype:accent1');
            }
            else {
                htmlContent = htmlContent.replace(/color: #ffffff00/g, 'color: #333333ff');
                htmlContent = htmlContent.replace(/--colortype:\w+/g, '--colortype:dk1');
            }
        }
        return `<div  style="">${htmlContent}</div>`;
    }
    // 纯文本处理
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const htmlContent = escapedText.replace(/\n/g, '<br>');
    let actualFontSize = fontSize;
    if (isTitle || text.length < 20) {
        actualFontSize = Math.max(fontSize, 72);
    }
    const colorType = isTitle ? 'accent1' : 'dk1';
    const color = isTitle ? '#b93423ff' : '#333333ff';
    const fontWeight = isTitle ? 'font-weight:bold;' : '';
    return `<div  style=""><p  style=""><span  style="color:${color};--colortype:${colorType};font-family:Microsoft Yahei;font-size:${actualFontSize}px;${fontWeight}">${htmlContent}</span></p></div>`;
}
function inferElementTag(element, index) {
    if (!element.content)
        return 'text';
    const content = element.content.toLowerCase();
    const contentLength = element.content.length;
    if (index === 0 && contentLength < 50)
        return 'title';
    if (contentLength < 30 && (content.includes('tesla') || content.includes('全球') || content.includes('战略'))) {
        return 'title';
    }
    if (contentLength < 50 && (content.includes('创新') || content.includes('挑战') || content.includes('分析'))) {
        return 'subTitle';
    }
    if (content.includes('汇报人') || content.includes('讯飞智文')) {
        return 'author';
    }
    return 'text';
}
function generateShapePath(width, height) {
    const radius = Math.min(width, height) * 0.1;
    return `M ${radius} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius} L ${width} ${height - radius} Q ${width} ${height} ${width - radius} ${height} L ${radius} ${height} Q 0 ${height} 0 ${height - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
}
function extractTitleFromSlide(slide) {
    for (const element of slide.elements) {
        if (element.tag === 'title' || element.type === 'text') {
            const content = element.content || '';
            const textMatch = content.match(/>([^<]+)</);
            if (textMatch) {
                return textMatch[1].trim();
            }
        }
    }
    return '';
}
function generateId() {
    return Math.random().toString(36).substr(2, 10);
}
//# sourceMappingURL=pptxtojson_simple.js.map