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
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage reporting
- Test files: Located in `tests/` directory and `tests/__tests__/` subdirectory
- Run single test: `npx jest <test-file-name>` or `npx jest --testNamePattern="<test name>"`

### Package Management
This project uses npm as the package manager. Run `npm install` to install dependencies.

## Architecture Overview

### Core Structure
This is a Next.js application that provides both a web interface and a TypeScript library for parsing .pptx files into readable JSON data. The project has been migrated from a browser-only library to a full-stack Next.js application with comprehensive PPTX parsing capabilities.

### Application Layers

#### **1. Next.js Application Layer (`app/`)**
- **Web Interface**: React-based UI for file upload and JSON visualization
- **API Routes**: RESTful endpoints for PPTX processing
- **Pages**: 
  - `/` - Main file upload and parsing interface
  - `/api-docs` - API documentation
  - `/test-position` - Position testing utilities

#### **2. Core Library Layer (`app/lib/`)**
- **Entry Points**:
  - `pptxtojson.ts` - Legacy compatibility layer with `parse()` and `parseToPPTist()` functions
  - `parser/InternalPPTXParser.ts` - Modern parsing engine

#### **3. Domain Model Layer (`app/lib/models/`)**
- **Domain Objects**: `Presentation`, `Slide`, `Theme`, `Element` hierarchy
- **Data Transfer Objects**: `ParseOptions`, `ParseResult`, `ExportOptions`
- **XML Structures**: `XmlNode` for typed XML processing

#### **4. Service Layer (`app/lib/services/`)**
- **Dependency Injection**: `ServiceContainer` and `ServiceConfiguration`
- **Core Services**: `FileService`, `XmlParseService`
- **Parsers**: `PresentationParser`, `SlideParser`, `ThemeParser`
- **Element Processors**: `TextProcessor`, `ShapeProcessor`, `ImageProcessor`
- **Utilities**: `ColorUtils`, `IdGenerator`, `UnitConverter`

### Key Architecture Components

#### **Modern Parser Flow**
1. **File Processing**: Uses JSZip to extract .pptx contents
2. **Content Type Analysis**: Identifies slides, layouts, and themes
3. **XML Parsing**: Custom typed XML parser with namespace handling
4. **Element Processing**: Specialized processors for different element types
5. **JSON Serialization**: Domain objects convert to clean JSON output

#### **Processing Pipeline**
- **PresentationParser**: Orchestrates overall parsing workflow
- **SlideParser**: Processes individual slides with layouts and masters
- **Element Processors**: Convert PowerPoint elements (text, shapes, images) to typed objects
- **Utility Integration**: ID generation, color standardization, unit conversion

#### **Element Types Supported**
- **Text**: Rich text with formatting, fonts, colors (`TextElement`)
- **Shapes**: Geometric shapes with fills, borders, custom paths (`ShapeElement`)
- **Images**: Pictures with positioning, cropping, transformations (`ImageElement`)
  - **Base64 Mode**: Complete image data embedded as Data URLs
  - **URL Mode**: Image references for external hosting
  - **Format Detection**: JPEG, PNG, GIF, BMP, WebP, TIFF support
  - **Metadata Extraction**: Original size, format, MIME type
  - **Crop Information**: PowerPoint cropping data preservation
- **Tables**: Structured data with cell formatting
- **Charts**: Data visualization elements
- **Groups**: Nested element hierarchies
- **Math**: Mathematical formulas and equations

### New Utility System (2024 Enhancements)

#### **IdGenerator** (`app/lib/services/utils/IdGenerator.ts`)
- Ensures unique element IDs across entire presentation
- Handles PowerPoint XML ID conflicts with automatic renaming
- Tracks used IDs and provides collision detection

#### **ColorUtils** (`app/lib/services/utils/ColorUtils.ts`)
- Standardizes all colors to `rgba(r,g,b,a)` format
- Converts between hex, rgb, and rgba formats
- Supports theme color resolution and luminance modifications
- Handles transparent colors and color inheritance
- **Robust Error Handling**: Returns fallback colors instead of throwing exceptions
- **Edge Case Support**: Handles malformed RGBA, case-insensitive formats, and incomplete color specifications
- **Color Conversion Note**: 
  - 这里不需要过度关注 rgba 和 hex 颜色的差别问题，保证两种颜色是完全对应一致的即可
- **Critical Implementation Details**:
  - `toRgba()` MUST return `"rgba(0,0,0,1)"` for invalid/null inputs, never throw errors
  - `toRgba()` MUST return `"rgba(0,0,0,0)"` for 'transparent' and 'none' values
  - Malformed RGBA patterns like `rgba(100,100,100)` should be completed with alpha=1
  - All transformation functions must clamp values to valid ranges (0-255 for RGB, 0-1 for alpha)

#### **UnitConverter** (`app/lib/services/utils/UnitConverter.ts`)
- High-precision EMU (English Metric Units) to points conversion
- Configurable precision (default: 2 decimal places)
- Tolerance checking for position/size validation
- Consistent unit handling across all elements

### Image Processing System (2024 Base64 Implementation)

#### **ImageDataService** (`app/lib/services/images/ImageDataService.ts`)
- **Binary Data Extraction**: Extracts image files from PPTX zip archives
- **Format Detection**: Automatic detection of JPEG, PNG, GIF, BMP, WebP, TIFF formats
- **Base64 Encoding**: Converts binary data to Data URLs for embedding
- **Batch Processing**: Concurrent processing with semaphore-based memory management
- **Error Recovery**: Graceful handling of missing or corrupted images

#### **ImageElement Enhancement** (`app/lib/models/domain/elements/ImageElement.ts`)
- **Dual Output Modes**: Supports both base64 and URL output formats
- **Metadata Support**: Original size, format, MIME type preservation
- **Crop Information**: PowerPoint srcRect cropping data processing
- **Backward Compatibility**: Maintains legacy URL format when image data unavailable

#### **ImageProcessor Integration** (`app/lib/services/element/processors/ImageProcessor.ts`)
- **Seamless Processing**: Automatic image data extraction during element processing
- **Relationship Resolution**: Resolves PPTX relationship IDs to image paths
- **Crop Data Extraction**: Processes PowerPoint srcRect cropping information
- **Fallback Handling**: Continues processing when image extraction fails

#### **Storage Strategy Architecture** (`app/lib/services/images/interfaces/ImageStorageStrategy.ts`)
- **Strategy Pattern**: Pluggable storage backends (Base64, CDN, Custom)
- **Priority System**: Automatic fallback to available strategies
- **Health Monitoring**: Strategy availability and performance tracking
- **Base64 Default**: Built-in Base64StorageStrategy as reliable fallback

#### **Image Processing Features**
- **Memory Management**: Semaphore-controlled concurrent processing (default: 3 concurrent)
- **Format Support**: Comprehensive format detection with magic number validation
- **Error Isolation**: Individual image failures don't affect overall parsing
- **Performance Optimization**: Batch processing for multiple images
- **CDN Ready**: Interface designed for future CDN integration

### API Architecture

#### **Main API Endpoint** (`app/api/parse-pptx/route.ts`)
- Handles file uploads via FormData
- Validates .pptx file types
- Returns structured JSON with parsing results
- Includes debug information and error handling

#### **Response Format**
```typescript
{
  success: boolean;
  data: {
    slides: Slide[];
    theme: Theme;
    title: string;
  };
  filename: string;
  debug?: object;
  error?: string;
}
```

### Testing Architecture

#### **Test Structure** (`tests/`)
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end parsing workflow
- **Regression Tests**: Validation against known outputs
- **Utility Tests**: Specific testing for new utility classes

#### **Test Categories**
- **ID Uniqueness**: Element ID generation and collision handling
- **Color Format**: rgba standardization and theme color mapping
- **Output Structure**: JSON format validation and backward compatibility
- **Precision**: EMU conversion accuracy and position/size precision
- **Edge Cases**: Error handling and malformed input processing
- **Color Processing**: Comprehensive testing of color transformations and error recovery
- **HTML Output Integrity**: CSS formatting consistency and property ordering
- **Integration Testing**: Cross-component interaction validation
- **Image Processing**: Base64 encoding, format detection, batch processing, and storage strategies
- **Memory Management**: Large image handling and concurrent processing validation
- **Storage Strategy**: CDN interface testing and fallback mechanism validation

#### **Test Configuration**
- **Jest** with TypeScript support
- **Coverage reporting** with HTML and LCOV outputs
- **Watch mode** for development
- **Module path mapping** (`@/` -> `app/`)

### Unit System
All output dimensions use **points (pt)** as the unit. The conversion from EMUs (English Metric Units) to points is handled via the `UnitConverter` utility with a correction factor of 1.395 for accurate scaling.

### Backward Compatibility
The library maintains compatibility with the original API through:
- **Legacy Format Support**: Position properties (`left`, `top`, `width`, `height`) alongside modern format
- **Theme Structure**: Both old and new theme color formats
- **Element Naming**: `name` property mapped from `id` for legacy compatibility

### Type Safety
Comprehensive TypeScript coverage with:
- **Domain Models**: Strongly typed presentation structure
- **Processing Context**: Shared state and dependencies
- **Error Classes**: `PPTXParseError`, `XMLParseError` for debugging
- **Utility Interfaces**: Type-safe color, ID, and unit conversion

### Key Design Patterns
- **Dependency Injection**: Service container manages component dependencies
- **Strategy Pattern**: Element processors handle different PowerPoint element types
- **Factory Pattern**: Utility classes provide standardized conversion methods
- **Chain of Responsibility**: Processing pipeline with context passing
- **Error Recovery**: Graceful degradation with fallback values instead of exceptions

## Parsing Principles

### PPTX File Reading
- **File Attribute Reading**: 
  - 这里读取 pptx 文件属性时，不应该有默认值的概念，读不到就是读不到，不需要任何 fallback

This architecture supports both standalone library usage and full Next.js application deployment, with comprehensive testing and utility enhancements for accurate PPTX parsing.

## Critical Implementation Insights (2024 Test Suite Fixes)

### **Theme Class API Requirements**
The `Theme` class must provide these methods for test compatibility:
```typescript
setThemeColor(colorType: string, color: string): void
getThemeColor(colorType: string): string | undefined  
setFontName(fontName: string): void
getFontName(): string
```
- Constructor must accept optional name parameter: `constructor(name?: string)`
- All methods must handle undefined/null inputs gracefully

### **TextElement HTML Output Standards**
- **CSS Property Order**: `color` → `font-size` → `font-weight` → `font-style` → `--colortype`
- **Property Formatting**: No trailing semicolon in style attributes
- **Required Properties**: `enableShrink: true` must be included in JSON output
- **Multiple Text Runs**: TextProcessor must handle multiple `<r>` elements per paragraph separately

### **Color Processing Error Handling Philosophy**
```typescript
// NEVER do this:
if (!color) throw new Error("Invalid color");

// ALWAYS do this:
if (!color || !color.trim()) return "rgba(0,0,0,1)";
```

**Critical Color Mappings**:
- `null`, `undefined`, `""`, `"   "` → `"rgba(0,0,0,1)"` (black)
- `"none"`, `"transparent"` → `"rgba(0,0,0,0)"` (transparent)
- Invalid formats → `"rgba(0,0,0,1)"` (fallback black)

### **Test-Driven Development Lessons**
1. **Comprehensive Test Coverage**: The color system required 6 additional specialized test files
2. **Edge Case Priority**: 25% of test failures were edge cases (null, malformed input, boundary values)
3. **API Consistency**: Tests enforce strict API contracts between components
4. **Error Recovery**: Tests validate graceful degradation, not just happy path scenarios

### **HTML Output Formatting Rules**
```html
<!-- Correct format -->
<span style="color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1">Text</span>

<!-- Incorrect formats that will fail tests -->
<span style="color:#5b9bd5ff;font-size:54px;font-weight:bold;--colortype:accent1;">Text</span>  <!-- trailing ; -->
<span style="--colortype:accent1;color:#5b9bd5ff;font-size:54px">Text</span>  <!-- wrong order -->
```

### **Component Integration Patterns**
- **TextProcessor**: Must extract individual text runs, not concatenate them
- **Theme**: Must provide dynamic property access for theme colors
- **ColorUtils**: Must be stateless and never throw exceptions in production paths
- **Element Properties**: Properties like `enableShrink` are required for UI framework compatibility

### **Testing Strategy Insights**
- **Parallel Test Execution**: All 451 tests complete in <2 seconds with proper organization
- **Error Message Quality**: Specific test failures help identify exact component mismatches
- **Regression Prevention**: Comprehensive edge case coverage prevents future color processing issues
- **Performance Testing**: Memory stress tests ensure system handles large presentations

### **Code Quality Standards**
- **No Deprecated APIs**: Update `substr()` to `substring()`, avoid deprecated TypeScript patterns
- **Input Validation**: Always validate and sanitize inputs at service boundaries  
- **Consistent Error Handling**: Use the same error recovery patterns across all utilities
- **Type Safety**: Maintain strict TypeScript compliance without `any` types where possible