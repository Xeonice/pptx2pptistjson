# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run build` - Full TypeScript compilation and bundling
- `npm run dev` - Development mode with TypeScript watch compilation
- `npm run clean:dist` - Clean the dist directory before building
- `npm run lint` - Run ESLint on TypeScript source files (src/**/*.ts)
- `npm run type-check` - Run TypeScript type checking without emitting files

### Package Management
This project uses pnpm as the package manager. Run `pnpm install` to install dependencies.

## Architecture Overview

### Core Structure
This is a browser-based TypeScript library that parses .pptx files into readable JSON data. The main entry point is `src/pptxtojson.ts` which exports the `parse()` function. The codebase has been fully migrated from JavaScript to TypeScript with comprehensive type definitions.

### Key Architecture Components

**Main Parser Flow (`src/pptxtojson.ts`)**:
1. Uses JSZip to extract .pptx file contents
2. Parses XML files using custom XML reader (`src/readXmlFile.ts`)
3. Processes slides sequentially through `processSingleSlide()`
4. Extracts elements from slide content via `processNodesInSlide()`
5. Returns structured JSON with slides, theme colors, and dimensions

**Processing Pipeline**:
- **Content Types**: Identifies slides and layouts from `[Content_Types].xml`
- **Theme Processing**: Extracts theme colors and styling information
- **Slide Processing**: Handles individual slides with their layouts and master slides
- **Element Processing**: Converts PowerPoint elements to JSON objects

**Element Types Supported**:
- Text (`p:sp` nodes with text content)
- Shapes (`p:sp` nodes with geometry)
- Images/Videos/Audio (`p:pic` nodes)
- Tables (`p:graphicFrame` with table data)
- Charts (`p:graphicFrame` with chart data)
- Math formulas (`mc:AlternateContent` with math content)
- Groups (`p:grpSp` containing multiple elements)
- Diagrams (Smart Art)

### Modular Structure

**Core Processors**:
- `src/text.ts` - Text content and formatting
- `src/shape.ts` - Shape geometry and custom paths
- `src/table.ts` - Table processing with cell formatting
- `src/chart.ts` - Chart data extraction
- `src/math.ts` - Mathematical formula parsing
- `src/fill.ts` - Fill patterns (color, gradient, image)
- `src/border.ts` - Border styling
- `src/shadow.ts` - Shadow effects

**Utilities**:
- `src/position.ts` - Element positioning and sizing
- `src/color.ts` - Color processing and conversion
- `src/utils.ts` - General utilities and helpers
- `src/constants.ts` - Unit conversion constants (EMUs to Points)
- `src/types.ts` - Comprehensive TypeScript type definitions

### Unit System
All output dimensions use **points (pt)** as the unit. The conversion from EMUs (English Metric Units) to points is handled via `RATIO_EMUs_Points` constant.

### XML Processing
Uses a custom XML parser (`src/readXmlFile.ts`) that:
- Simplifies XML structure for easier navigation
- Preserves attributes and maintains element order
- Handles PowerPoint's complex namespace structure
- Fully typed with TypeScript interfaces

### Build System
- **TypeScript** for type-safe compilation
- **Rollup** for bundling with multiple output formats (UMD, CJS, ES)
- **Babel** for browser compatibility
- **ESLint** with TypeScript support for code quality
- **Terser** for minification
- Outputs to `dist/` directory with full TypeScript definitions

### Type Safety
The codebase includes comprehensive TypeScript types:
- `XmlNode` - Generic XML node structure
- `SlideElement` - Union type for all PowerPoint elements
- `ProcessingContext` - Parser state and dependencies
- `Fill`, `Border`, `Shadow` - Styling interfaces
- Element-specific interfaces for text, shapes, tables, etc.
- Error classes for better debugging (`PPTXParseError`, `XMLParseError`)

### Key Relationships
- Master slides provide default styling
- Layout slides inherit from masters and provide templates
- Individual slides inherit from layouts and contain actual content
- Theme provides color schemes and styling defaults
- Relationships defined in `_rels/*.xml.rels` files map IDs to resources

This codebase is primarily focused on accurate extraction and conversion of PowerPoint content while maintaining proper formatting and positioning information.