export function getShapePath(shapType, width, height, _node) {
    // Basic shape path generation
    switch (shapType) {
        case 'rect':
            return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
        case 'ellipse':
            return `M ${width / 2} 0 A ${width / 2} ${height / 2} 0 1 1 ${width / 2} ${height} A ${width / 2} ${height / 2} 0 1 1 ${width / 2} 0 Z`;
        case 'triangle':
            return `M ${width / 2} 0 L ${width} ${height} L 0 ${height} Z`;
        case 'diamond':
            return `M ${width / 2} 0 L ${width} ${height / 2} L ${width / 2} ${height} L 0 ${height / 2} Z`;
        case 'pentagon':
            return `M ${width / 2} 0 L ${width} ${height * 0.4} L ${width * 0.8} ${height} L ${width * 0.2} ${height} L 0 ${height * 0.4} Z`;
        case 'hexagon':
            return `M ${width * 0.25} 0 L ${width * 0.75} 0 L ${width} ${height / 2} L ${width * 0.75} ${height} L ${width * 0.25} ${height} L 0 ${height / 2} Z`;
        case 'star5':
            const cx = width / 2;
            const cy = height / 2;
            const outerRadius = Math.min(cx, cy);
            const innerRadius = outerRadius * 0.4;
            let starPath = '';
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = cx + radius * Math.cos(angle - Math.PI / 2);
                const y = cy + radius * Math.sin(angle - Math.PI / 2);
                starPath += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
            }
            return starPath + ' Z';
        default:
            return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
    }
}
//# sourceMappingURL=shapePath.js.map