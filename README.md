# 🎨 PPTXtoJSON - Advanced PowerPoint Parser & Web Application

A comprehensive Next.js application and TypeScript library for parsing .pptx files into structured JSON data with advanced image processing, background support, and modern web interface.

[![Tests](https://img.shields.io/badge/tests-450%2B-green)](./tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](./tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **🚀 Modern Full-Stack Application**: Unlike other PPTX parsers, this is a complete web application with API endpoints, web interface, and sophisticated parsing architecture that produces human-readable JSON data.

## 🌟 Key Features

### 📱 Web Application
- **Interactive File Upload**: Drag-and-drop .pptx file processing
- **Real-time JSON Visualization**: Monaco Editor with syntax highlighting
- **JSON Diff Comparison**: Compare parsing results with expected outputs
- **Position Testing Tools**: Utilities for element positioning validation
- **API Documentation**: Interactive API reference at `/api-docs`

### 🔧 Parsing Engine
- **Service-Oriented Architecture**: Modular design with dependency injection
- **Advanced Image Processing**: Base64 encoding with format detection (JPEG, PNG, GIF, BMP, WebP, TIFF)
- **Background Image Support**: Complete slide background processing
- **Theme Color Management**: Dynamic theme color resolution
- **Precision Unit Conversion**: High-accuracy EMU to points conversion
- **Comprehensive Element Support**: Text, shapes, images, tables, charts, math formulas

### 🧪 Quality Assurance
- **450+ Test Cases**: Comprehensive test coverage across all components
- **Integration Testing**: End-to-end parsing workflow validation
- **Edge Case Handling**: Robust error recovery and graceful degradation
- **Performance Testing**: Memory management and concurrent processing validation

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Library Usage

#### Browser / Frontend
```javascript
import { parse } from 'pptxtojson'

// Basic parsing
const json = await parse(arrayBuffer)

// Advanced configuration
const json = await parse(arrayBuffer, {
  imageMode: 'base64',     // 'base64' | 'url'
  includeNotes: true,      // Include speaker notes
  includeMaster: true,     // Include master slide elements
  enableDebug: false       // Debug information
})
```

#### API Endpoint
```javascript
// Upload via REST API
const formData = new FormData()
formData.append('file', pptxFile)

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

#### Node.js / Server
```javascript
import { parse } from 'pptxtojson'
import fs from 'fs'

const buffer = fs.readFileSync('presentation.pptx')
const json = await parse(buffer, {
  imageMode: 'base64',
  includeNotes: true
})
```

## 🏗️ Architecture Overview

### Application Structure
```
app/
├── api/                    # REST API endpoints
│   └── parse-pptx/        # PPTX parsing endpoint
├── lib/                   # Core parsing library
│   ├── models/            # Domain models & DTOs
│   ├── services/          # Service layer with DI
│   ├── parser/            # Main parsing engine
│   └── utils.ts          # Shared utilities
├── json-diff/             # JSON comparison tool
├── api-docs/             # API documentation
└── test-position/        # Position testing utilities
```

### Core Services Architecture
```
ServiceContainer
├── FileService           # File & ZIP processing
├── XmlParseService      # XML parsing with namespaces
├── ImageDataService     # Image extraction & processing
├── PresentationParser   # Orchestrates parsing workflow
├── SlideParser         # Individual slide processing
├── ThemeParser         # Theme & color processing
└── Element Processors   # Specialized element handlers
    ├── TextProcessor    # Rich text processing
    ├── ShapeProcessor   # Geometric shapes
    └── ImageProcessor   # Image elements
```

### Utility System
```
utils/
├── ColorUtils          # RGBA color standardization
├── IdGenerator         # Unique element ID management
├── UnitConverter       # EMU to points conversion
└── FillExtractor       # Fill & background processing
```

## 🖼️ Advanced Image Processing

### Image Processing Modes

#### 1. Base64 Mode (Recommended)
Complete image data embedded as Data URLs for offline usage:

```javascript
const json = await parse(arrayBuffer, { imageMode: 'base64' })

// Output includes full image data
{
  "type": "image",
  "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "format": "jpeg",
  "mimeType": "image/jpeg",
  "originalSize": 45678,
  "metadata": {
    "width": 1920,
    "height": 1080,
    "hasTransparency": false
  }
}
```

#### 2. URL Mode
Lightweight URLs for cloud storage integration:

```javascript
const json = await parse(arrayBuffer, { imageMode: 'url' })

// Output with external URLs
{
  "type": "image",
  "src": "https://cdn.example.com/images/slide1_image1.jpg",
  "originalSrc": "../media/image1.jpeg"
}
```

### Background Image Support
Complete slide background processing with multiple fill types:

```javascript
// Solid color background
{
  "background": {
    "type": "solid",
    "color": "#FF5733"
  }
}

// Image background with base64
{
  "background": {
    "type": "image",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "imageSize": "cover"
  }
}

// Gradient background
{
  "background": {
    "type": "gradient",
    "colors": [
      { "color": "#FF5733", "position": 0 },
      { "color": "#33A1FF", "position": 100 }
    ]
  }
}
```

### Supported Formats
- **JPEG** (.jpg, .jpeg) - Optimized compression
- **PNG** (.png) - Transparency support  
- **GIF** (.gif) - Animation support
- **BMP** (.bmp) - Uncompressed bitmap
- **WebP** (.webp) - Modern web format
- **TIFF** (.tiff) - High-quality images

### Performance Features
- **Concurrent Processing**: Semaphore-controlled batch processing (default: 3 concurrent)
- **Memory Management**: Optimized for large presentations
- **Error Isolation**: Individual image failures don't affect overall parsing
- **Storage Strategies**: Pluggable storage backends (Base64, CDN, Custom)

## 📋 Complete Element Support

### Text Elements
```javascript
{
  "type": "text",
  "content": "<p style=\"color:#5b9bd5;font-size:54px;font-weight:bold\">Rich Text</p>",
  "left": 100, "top": 200, "width": 400, "height": 100,
  "vAlign": "middle",
  "isVertical": false,
  "enableShrink": true
}
```

### Shape Elements
```javascript
{
  "type": "shape",
  "shapType": "rect",
  "fill": { "type": "color", "value": "#FF5733" },
  "border": { "color": "#000000", "width": 2, "type": "solid" },
  "path": "M 0,0 L 100,0 L 100,100 L 0,100 Z"
}
```

### Image Elements
```javascript
{
  "type": "image",
  "src": "data:image/jpeg;base64,...",
  "format": "jpeg",
  "clip": { "range": [[10, 20], [90, 80]] },  // Crop information
  "rotate": 15
}
```

### Table Elements
```javascript
{
  "type": "table",
  "data": [["Header 1", "Header 2"], ["Cell 1", "Cell 2"]],
  "colWidths": [200, 300],
  "rowHeights": [40, 60],
  "borders": { "top": true, "right": true, "bottom": true, "left": true }
}
```

### Chart Elements
```javascript
{
  "type": "chart",
  "chartType": "column",
  "data": { "categories": ["Q1", "Q2"], "series": [10, 20] },
  "colors": ["#FF5733", "#33A1FF"],
  "style": { "marker": true, "gridlines": true }
}
```

## 🧪 Testing & Quality

### Test Suite Overview
- **450+ Test Cases** across all components
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: End-to-end parsing workflows  
- **Background Image Tests**: Comprehensive background processing validation
- **Edge Case Testing**: Error handling and malformed input processing
- **Performance Tests**: Memory management and concurrent processing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test category
npx jest background-image
npx jest color-processing
npx jest image-base64
```

### Test Categories
```
tests/
├── __tests__/                    # Specialized test suites
│   ├── color-*.test.ts          # Color processing tests
│   ├── image-*.test.ts          # Image processing tests
│   ├── integration.test.ts      # End-to-end tests
│   └── edge-cases.test.ts       # Error handling tests
├── background-image.test.ts     # Background processing
├── element-types.test.ts        # Element parsing
└── pptx-parser-integration.test.ts # Parser integration
```

## 🛠️ Development & API

### Development Commands
```bash
npm run dev          # Start development server with hot reload
npm run dev:debug    # Start with Node.js debugging enabled
npm run build        # Production build with optimization
npm run lint         # ESLint code quality check
npm run type-check   # TypeScript type validation
```

### API Endpoints

#### POST `/api/parse-pptx`
Parse uploaded PPTX file and return JSON structure.

**Request:**
```javascript
const formData = new FormData()
formData.append('file', pptxFile)
formData.append('options', JSON.stringify({
  imageMode: 'base64',
  includeNotes: true
}))
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "slides": [...],
    "theme": {...},
    "title": "Presentation Title"
  },
  "filename": "presentation.pptx",
  "debug": {...}  // Optional debug information
}
```

### Configuration Options
```typescript
interface ParseOptions {
  imageMode?: 'base64' | 'url'        // Image processing mode
  includeNotes?: boolean              // Include speaker notes
  includeMaster?: boolean             // Include master slide elements
  enableDebug?: boolean               // Debug information
  maxConcurrency?: number             // Image processing concurrency
  precision?: number                  // Unit conversion precision
}
```

## 📈 Output Format

### Complete JSON Structure
```javascript
{
  "slides": [
    {
      "id": "slide_1",
      "background": {
        "type": "image",
        "image": "data:image/jpeg;base64,...",
        "imageSize": "cover"
      },
      "elements": [
        {
          "type": "text",
          "content": "<p>Rich text content</p>",
          "left": 100, "top": 200, "width": 400, "height": 100,
          "style": { /* Comprehensive styling */ }
        }
      ],
      "remark": "Speaker notes content"
    }
  ],
  "theme": {
    "colors": ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000"],
    "fonts": { "major": "Calibri", "minor": "Calibri" }
  },
  "size": { "width": 960, "height": 540 },
  "title": "Presentation Title"
}
```

### Unit System
All dimensional values use **points (pt)** as the unit with high-precision conversion:
- EMU to Points: `value * 0.0007874015748031496`
- Precision: 2 decimal places (configurable)
- Consistent across all element types

## 🔧 Advanced Features

### Theme Color Resolution
Automatic resolution of PowerPoint theme colors to actual RGB values:

```javascript
// Theme color reference
"color": { "type": "accent1", "tint": 0.5 }

// Resolved to actual color
"color": "#8AB6E7"
```

### ID Uniqueness System
Ensures unique element IDs across entire presentation:

```javascript
// Automatic ID generation with collision detection
"id": "textBox_1", "textBox_2", "shape_1"
```

### Error Recovery
Graceful handling of malformed or corrupted PPTX files:

```javascript
{
  "success": true,
  "data": { /* Parsed content */ },
  "warnings": ["Image not found: media/missing.jpg"],
  "errors": []  // Non-fatal errors
}
```

## 🌐 Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Node.js**: 16.0+ required for server-side usage
- **ES Modules**: Full ESM support with TypeScript
- **File API**: Drag-and-drop file upload support

## 📚 Documentation

### Additional Resources
- [API Documentation](./docs/API.md) - Complete API reference
- [Usage Examples](./docs/EXAMPLES.md) - Practical implementation examples
- [Architecture Guide](./CLAUDE.md) - Detailed development insights
- [Type Definitions](./app/lib/models/) - TypeScript interfaces

### Migration from v0.x
Version 1.5.0+ introduces breaking changes:
- Unit system changed from pixels to points
- Image processing enhanced with base64 support
- Background processing completely rewritten
- Service-oriented architecture replaces monolithic parser

## 🤝 Contributing

### Development Setup
```bash
git clone https://github.com/pipipi-pikachu/pptxtojson.git
cd pptxtojson
npm install
npm run dev
```

### Testing Contributions
```bash
# Run existing tests
npm test

# Add new test cases
# Follow patterns in tests/__tests__/ directory
```

### Code Quality
- **TypeScript**: Strict type checking required
- **ESLint**: Code style enforcement
- **Jest**: Test coverage maintenance
- **Documentation**: Update README for new features

## 🙏 Acknowledgments

This project builds upon and significantly extends:
- [PPTX2HTML](https://github.com/g21589/PPTX2HTML) - Original parsing concepts
- [PPTXjs](https://github.com/meshesha/PPTXjs) - Base implementation reference

**Key Differences:**
- **Full-Stack Application**: Complete web interface vs. library-only
- **Advanced Architecture**: Service-oriented design with dependency injection
- **Superior Image Processing**: Base64 encoding, format detection, background support
- **Comprehensive Testing**: 450+ tests vs. minimal test coverage
- **Modern TypeScript**: Strict typing and latest language features
- **Production Ready**: Error handling, performance optimization, and scalability

## 📄 License

MIT License | Copyright © 2020-PRESENT [pipipi-pikachu](https://github.com/pipipi-pikachu)

---

**🚀 Ready to parse PPTX files like never before?** Start with `npm run dev` and experience the modern PowerPoint parsing solution.