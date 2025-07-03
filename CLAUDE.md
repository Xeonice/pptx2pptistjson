# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run dev` - Start Next.js development server with hot reload
- `npm run dev:debug` - Start development server with Node.js debugging enabled
- `npm run build` - Production build with Next.js optimization
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on app directory (.js,.jsx,.ts,.tsx files)
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing
- `npm test` - Run all Jest tests (850+ comprehensive test cases)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage reporting
- Run single test: `npx jest <test-file-name>` or `npx jest --testNamePattern="<test name>"`
- Run test category: `npx jest background-image`, `npx jest color-processing`, `npx jest shape-processor`

### Project Identity (v2.1.0)
- **Package Name**: `pptx2pptistjson` (specialized for PPTist integration)
- **Primary Focus**: PPTist-compatible JSON output format with pixel-perfect conversion
- **Target Integration**: [PPTist](https://github.com/pipipi-pikachu/PPTist) presentation editor
- **Architecture**: Full-stack Next.js application with modular service-oriented conversion engine

## Core Architecture

### Service-Oriented Design
The codebase uses **dependency injection** through `ServiceContainer` for modular, testable architecture:

```typescript
ServiceContainer
├── FileService           # ZIP/file operations using JSZip
├── XmlParseService      # XML parsing with PPTX namespace handling  
├── ImageDataService     # Image extraction, Base64 encoding, format detection
├── PresentationParser   # Main orchestration: relationship parsing, theme resolution
├── SlideParser         # Individual slide processing with background support
├── ThemeParser         # PowerPoint theme → PPTist color scheme conversion
└── Element Processors   # Specialized element converters
    ├── TextProcessor    # Rich text → PPTist HTML with color/font mapping
    ├── ShapeProcessor   # Geometric shapes → PPTist SVG paths with fill extraction
    └── ImageProcessor   # Images → PPTist format with Base64/URL modes
```

### Color Processing Pipeline
Advanced color transformation system matching PowerPoint behavior:

```typescript
FillExtractor.getSolidFill()
├── ColorUtils.toRgba()           # Normalize all color formats to rgba()
├── getSchemeColorFromTheme()     # Resolve theme color references
├── Color Transformations (applied in PowerPoint order):
│   ├── Alpha (transparency)
│   ├── HueMod (hue rotation)
│   ├── LumMod/LumOff (luminance)
│   ├── SatMod (saturation)
│   ├── Shade (darker)
│   └── Tint (lighter)
└── Always returns consistent rgba() format for PPTist
```

### Shape Processing Architecture
Comprehensive shape conversion supporting 100+ PowerPoint shape types:

```typescript
ShapeProcessor.process()
├── Geometry Detection:
│   ├── prstGeom → preset shapes (rect, ellipse, triangle, flowChart*, actionButton*)
│   └── custGeom → custom path analysis
├── Fill Extraction:
│   ├── solidFill → FillExtractor.getSolidFill()
│   ├── noFill → transparent
│   └── Theme color resolution with inheritance
├── Path Generation:
│   ├── getCustomShapePath() → SVG path with EMU→points conversion
│   ├── Enhanced support for arcTo, cubicBezTo commands
│   └── Coordinate scaling for different viewBox sizes
└── PPTist Format Output:
    ├── pathFormula (PowerPoint geometry identifier)
    ├── themeFill (resolved colors with debug info)
    └── enableShrink: true (PPTist compatibility)
```

### Unit Conversion System
Precise coordinate mapping for PPTist layout accuracy:
- **EMU to Points**: `value * 0.0007874015748031496` (UnitConverter.emuToPointsPrecise)
- **Precision**: 2 decimal places, configurable
- **Consistency**: All dimensions (position, size, paths) use points for PPTist

### Image Processing Pipeline
Multi-format image handling with PPTist optimization and PowerPoint stretch offset processing:

```typescript
ImageDataService.extractImageData()
├── Format Detection: JPEG, PNG, GIF, BMP, WebP, TIFF
├── Processing Modes:
│   ├── base64: Full Data URL embedding for offline PPTist usage
│   └── url: External URL references for cloud storage
├── PPTXImageProcessor: Sharp-based stretch offset handling
│   ├── fillRect processing (PowerPoint stretch algorithm)
│   ├── Transparent background composition
│   ├── Debug image generation for troubleshooting
│   └── Memory-efficient processing with fallback mechanisms
├── Metadata Extraction: dimensions, transparency, file size
├── Error Isolation: Individual image failures don't break conversion
└── Concurrent Processing: Semaphore-controlled batch processing (default: 3)
```

## Post-Modification Verification
After each modification, verify multiple command executions:
- `npm run build` - Ensures production build integrity  
- `npm run type-check` - Validates TypeScript type consistency
- `npm run lint` - Checks code quality and style guidelines
- `npm run test` - Confirms all test cases pass successfully (all 850+ tests must pass)

## Critical Implementation Details

### Color Format Consistency
- **All color functions MUST return rgba() format** for PPTist compatibility
- **Never return hex colors** in final output - always convert via `ColorUtils.toRgba()`
- **Color transformation order matters** - follow PowerPoint's official sequence

### Shape Processing Rules
- **pathFormula field** contains original PowerPoint geometry identifier for debugging
- **themeFill includes debug info** to trace color resolution path
- **Custom geometry analysis** detects circular patterns for proper PPTist shape type assignment
- **Enhanced preset shapes**: 15+ flowChart series, 7+ actionButton series support added

### Testing Strategy
- **850+ test cases** cover color processing, shape conversion, image handling
- **Integration tests** verify end-to-end PPTist compatibility
- **Performance tests** ensure memory management and concurrent processing
- **Edge case handling** for malformed PPTX files and missing resources
- **Comprehensive image processing tests** including PPTXImageProcessor, stretch offset handling, and debug functionality

### Sample Files Usage
- `sample/basic/input.pptx` and `output.json` - reference conversion format
- `sample/sample-1/` - detailed test case with expected outputs
- **Never delete sample files** - they serve as conversion format reference

### Debug System and Image Processing
The codebase includes advanced debugging capabilities for image processing:

```typescript
DebugHelper.isDebugEnabled(context)        # Check if debug mode is enabled
DebugHelper.shouldSaveDebugImages(context) # Check if debug images should be saved
PPTXImageProcessor.applyStretchOffset()    # Apply PowerPoint stretch transformations
ImageOffsetAdjuster.applyOffsetAdjustment() # Handle coordinate adjustments
```

**Key Features:**
- **Transparent padding handling** for images with negative stretch offsets
- **Debug image generation** with metadata and processing steps visualization
- **Sharp library integration** with graceful fallback when unavailable
- **Memory-efficient processing** with configurable concurrency limits
- **PowerPoint-compatible fillRect algorithm** for accurate stretch offset reproduction

### Service Container Pattern
Register services with dependency injection for testability:
```typescript
container.register('fileService', new FileService());
container.registerFactory('xmlParser', () => new XmlParseService(), true);
const service = container.resolve<IFileService>('fileService');
```

## Repository Management Guidelines

### Git Branch Strategy
- 这个项目的 master 分支不能直接提交，每次我需要让你提交时，需要先确保自己不在 master 分支上，在一个从 master 切出来的分支上