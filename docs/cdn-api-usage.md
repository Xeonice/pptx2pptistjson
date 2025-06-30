# CDN API Usage Guide

The system now supports full CDN integration for both PPTX input and JSON output.

## API Endpoints

### 1. Upload PPTX to CDN
`POST /api/upload-pptx-to-cdn`

Uploads a PPTX file to CDN for later processing.

### 2. Parse PPTX
`POST /api/parse-pptx`

Parses PPTX files from direct upload or CDN URL.

## Request Parameters

### Upload PPTX to CDN (`/api/upload-pptx-to-cdn`)

**Form Data Fields:**
- `file` (File, required): The PPTX file to upload
- `filename` (string, optional): Custom filename for the CDN storage

### Parse PPTX (`/api/parse-pptx`)

**Form Data Fields:**
- `file` (File, optional): The PPTX file to upload directly
- `cdnUrl` (string, optional): URL of the PPTX file stored on CDN
- `format` (string, optional): Output format - "pptist" or "legacy" (default: "legacy")
- `useCdn` (boolean, optional): Whether to upload the parsed JSON result to CDN (default: false)
- `cdnFilename` (string, optional): Custom filename for CDN upload

**Note**: Either `file` or `cdnUrl` must be provided, but not both.

## Usage Examples

### 1. Two-Step CDN Workflow (Upload PPTX to CDN, then parse)

**Step 1: Upload PPTX to CDN**
```javascript
const formData = new FormData();
formData.append('file', pptxFile);
formData.append('filename', 'my-presentation.pptx'); // optional

const uploadResponse = await fetch('/api/upload-pptx-to-cdn', {
  method: 'POST',
  body: formData
});

const uploadResult = await uploadResponse.json();
// Returns: { success: true, cdnUrl: "https://cdn.example.com/...", ... }
```

**Step 2: Parse from CDN URL**
```javascript
const parseFormData = new FormData();
parseFormData.append('cdnUrl', uploadResult.cdnUrl);
parseFormData.append('format', 'pptist');
parseFormData.append('useCdn', 'true'); // Also upload JSON result to CDN

const parseResponse = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: parseFormData
});

const parseResult = await parseResponse.json();
```

### 2. Direct Parse from CDN URL
```javascript
const formData = new FormData();
formData.append('cdnUrl', 'https://cdn.example.com/presentation.pptx');
formData.append('format', 'pptist');
formData.append('useCdn', 'true');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### 3. Direct File Upload (existing functionality)
```javascript
const formData = new FormData();
formData.append('file', pptxFile);
formData.append('format', 'pptist');
formData.append('useCdn', 'true');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Response Formats

### Upload PPTX to CDN Response:
```json
{
  "success": true,
  "cdnUrl": "https://cdn.example.com/my-presentation.pptx",
  "cdnId": "unique-cdn-id",
  "filename": "presentation.pptx",
  "size": 54321,
  "contentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "metadata": {
    "originalFilename": "presentation.pptx",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "fileSize": 54321
  },
  "provider": "vercel-blob"
}
```

### Parse PPTX - When JSON CDN upload is successful:
```json
{
  "success": true,
  "cdnUrl": "https://cdn.example.com/pptx-result-1234567890.json",
  "cdnId": "unique-cdn-id",
  "filename": "presentation.pptx",
  "size": 12345,
  "contentType": "application/json",
  "metadata": {
    "originalFilename": "presentation.pptx",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "format": "pptist"
  },
  "debug": {
    "fileSize": 54321,
    "cdnProvider": "vercel-blob",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Parse PPTX - When JSON CDN upload is disabled or fails:
```json
{
  "success": true,
  "data": { /* parsed JSON data */ },
  "filename": "presentation.pptx",
  "debug": {
    "fileSize": 54321,
    "resultType": "object",
    "resultKeys": ["slides", "size", "fonts"],
    "hasData": true
  }
}
```

## Error Handling

### CDN Download Error:
```json
{
  "error": "Failed to download file from CDN",
  "details": "Failed to download from CDN: 404 Not Found"
}
```

### No Input Provided:
```json
{
  "error": "No file uploaded or CDN URL provided"
}
```