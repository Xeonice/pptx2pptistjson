export function base64ArrayBuffer(arrayBuffer) {
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes = new Uint8Array(arrayBuffer);
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;
    let base64 = '';
    let a, b, c, d;
    let chunk;
    for (let i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        a = (chunk & 16515072) >> 18;
        b = (chunk & 258048) >> 12;
        c = (chunk & 4032) >> 6;
        d = chunk & 63;
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }
    if (byteRemainder === 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2;
        b = (chunk & 3) << 4;
        base64 += encodings[a] + encodings[b] + '==';
    }
    else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10;
        b = (chunk & 1008) >> 4;
        c = (chunk & 15) << 2;
        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }
    return base64;
}
export function extractFileExtension(filename) {
    return filename.substr((~-filename.lastIndexOf('.') >>> 0) + 2);
}
export function eachElement(node, func) {
    if (!node)
        return '';
    let result = '';
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            result += func(node[i], i);
        }
    }
    else {
        result += func(node, 0);
    }
    return result;
}
export function getTextByPathList(node, path) {
    if (!node)
        return node;
    let current = node;
    for (const key of path) {
        current = current[key];
        if (!current)
            return current;
    }
    return current;
}
export function angleToDegrees(angle) {
    if (!angle)
        return 0;
    const numAngle = typeof angle === 'string' ? parseFloat(angle) : angle;
    return Math.round(numAngle / 60000);
}
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
export function getMimeType(imgFileExt) {
    switch (imgFileExt.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'emf':
            return 'image/x-emf';
        case 'wmf':
            return 'image/x-wmf';
        case 'svg':
            return 'image/svg+xml';
        case 'mp4':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        case 'ogg':
            return 'video/ogg';
        case 'avi':
            return 'video/avi';
        case 'mpg':
            return 'video/mpg';
        case 'wmv':
            return 'video/wmv';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'tif':
            return 'image/tiff';
        case 'tiff':
            return 'image/tiff';
        default:
            return '';
    }
}
export function isVideoLink(vdoFile) {
    const urlRegex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlRegex.test(vdoFile);
}
export function toHex(n) {
    let hex = n.toString(16);
    while (hex.length < 2) {
        hex = '0' + hex;
    }
    return hex;
}
export function hasValidText(htmlString) {
    if (typeof DOMParser === 'undefined') {
        // Server-side fallback
        const text = htmlString.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
        return text.trim() !== '';
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const text = doc.body.textContent || doc.body.innerText || '';
    return text.trim() !== '';
}
//# sourceMappingURL=utils.js.map