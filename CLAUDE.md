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

#### **UnitConverter** (`app/lib/services/utils/UnitConverter.ts`)
- High-precision EMU (English Metric Units) to points conversion
- Configurable precision (default: 2 decimal places)
- Tolerance checking for position/size validation
- Consistent unit handling across all elements

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

This architecture supports both standalone library usage and full Next.js application deployment, with comprehensive testing and utility enhancements for accurate PPTX parsing.