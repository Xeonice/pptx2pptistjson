// Client-side wrapper for PPTX parsing API
export interface ParseResult {
  success: boolean
  data?: any
  filename?: string
  error?: string
}

export class PPTXParser {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async parseFile(file: File): Promise<ParseResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${this.baseUrl}/api/parse-pptx`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse file')
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async convertAndDownload(file: File): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('format', 'download')

      const response = await fetch(`${this.baseUrl}/api/convert`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to convert file')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = file.name.replace('.pptx', '.json')
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Download failed')
    }
  }

  async checkHealth(): Promise<{ status: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      return await response.json()
    } catch (error) {
      throw new Error('Health check failed')
    }
  }
}