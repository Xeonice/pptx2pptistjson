# CDN API Usage Guide

The `parsePPTX` API now supports downloading PPTX files from CDN URLs.

## API Endpoint
`POST /api/parse-pptx`

## Request Parameters

### Form Data Fields:
- `file` (File, optional): The PPTX file to upload directly
- `cdnUrl` (string, optional): URL of the PPTX file stored on CDN
- `format` (string, optional): Output format - "pptist" or "legacy" (default: "legacy")
- `useCdn` (boolean, optional): Whether to upload the parsed JSON result to CDN (default: false)
- `cdnFilename` (string, optional): Custom filename for CDN upload

**Note**: Either `file` or `cdnUrl` must be provided, but not both.

## Usage Examples

### 1. Upload PPTX from CDN URL
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

### 2. Direct File Upload (existing functionality)
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

## Response Format

### When CDN upload is successful:
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

### When CDN upload is disabled or fails:
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