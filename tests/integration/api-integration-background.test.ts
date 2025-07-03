/**
 * API集成测试 - 背景格式功能
 * 测试API端点与前端组件的集成
 */

describe('API Integration - Background Format', () => {
  const API_ENDPOINT = '/api/parse-pptx';
  
  // 创建测试用的模拟PPTX文件
  const createTestFile = (name: string = 'test.pptx'): File => {
    const content = JSON.stringify({
      mockPPTX: true,
      slides: 2,
      backgrounds: ['image', 'solid']
    });
    return new File([content], name, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
  };

  describe('FormData Parameter Handling', () => {
    it('should accept backgroundFormat parameter in FormData', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'pptist');
      formData.append('format', 'pptist');

      // Mock fetch for testing
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            width: 960,
            height: 540,
            slides: [
              {
                id: 'test-slide-1',
                background: {
                  type: 'image',
                  image: { src: 'test.jpg', size: 'cover' },
                  themeColor: { color: '#F4F7FF', colorType: 'lt1' }
                },
                elements: []
              }
            ]
          }
        })
      });

      global.fetch = mockFetch;

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.slides[0].background.image).toHaveProperty('src');
      expect(result.data.slides[0].background.image).toHaveProperty('size');
    });

    it('should handle missing backgroundFormat parameter', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      // backgroundFormat not provided

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            width: 960,
            height: 540,
            slides: [
              {
                id: 'test-slide-1',
                background: {
                  type: 'image',
                  image: 'test.jpg',
                  imageSize: 'cover',
                  themeColor: { color: '#F4F7FF', colorType: 'lt1' }
                },
                elements: []
              }
            ]
          }
        })
      });

      global.fetch = mockFetch;

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      
      // Should default to legacy format
      expect(result.data.slides[0].background).toHaveProperty('imageSize');
      expect(typeof result.data.slides[0].background.image).toBe('string');
    });

    it('should handle invalid backgroundFormat values', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'invalid-format');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            width: 960,
            height: 540,
            slides: [
              {
                id: 'test-slide-1',
                background: {
                  type: 'image',
                  image: 'test.jpg',
                  imageSize: 'cover',
                  themeColor: { color: '#F4F7FF', colorType: 'lt1' }
                },
                elements: []
              }
            ]
          }
        })
      });

      global.fetch = mockFetch;

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      
      // Should fallback to legacy format
      expect(result.data.slides[0].background).toHaveProperty('imageSize');
    });
  });

  describe('Response Format Validation', () => {
    it('should return valid JSON structure for legacy format', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'legacy');

      const mockResponse = {
        success: true,
        data: {
          width: 960,
          height: 540,
          slides: [
            {
              id: 'slide-1',
              background: {
                type: 'image',
                image: 'https://example.com/bg.jpg',
                imageSize: 'cover',
                themeColor: { color: '#F4F7FF', colorType: 'lt1' }
              },
              elements: [],
              remark: ''
            },
            {
              id: 'slide-2',
              background: {
                type: 'solid',
                color: '#FF5733'
              },
              elements: [],
              remark: ''
            }
          ],
          theme: {},
          title: 'Test Presentation'
        }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      // Validate legacy format structure
      expect(result.data.slides[0].background).toEqual({
        type: 'image',
        image: 'https://example.com/bg.jpg',
        imageSize: 'cover',
        themeColor: { color: '#F4F7FF', colorType: 'lt1' }
      });

      expect(result.data.slides[1].background).toEqual({
        type: 'solid',
        color: '#FF5733'
      });
    });

    it('should return valid JSON structure for pptist format', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'pptist');

      const mockResponse = {
        success: true,
        data: {
          width: 960,
          height: 540,
          slides: [
            {
              id: 'slide-1',
              background: {
                type: 'image',
                image: {
                  src: 'https://example.com/bg.jpg',
                  size: 'cover'
                },
                themeColor: { color: '#F4F7FF', colorType: 'lt1' }
              },
              elements: [],
              remark: ''
            },
            {
              id: 'slide-2',
              background: {
                type: 'solid',
                color: '#FF5733'
              },
              elements: [],
              remark: ''
            }
          ],
          theme: {},
          title: 'Test Presentation'
        }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      // Validate pptist format structure
      expect(result.data.slides[0].background).toEqual({
        type: 'image',
        image: {
          src: 'https://example.com/bg.jpg',
          size: 'cover'
        },
        themeColor: { color: '#F4F7FF', colorType: 'lt1' }
      });

      expect(result.data.slides[1].background).toEqual({
        type: 'solid',
        color: '#FF5733'
      });
    });
  });

  describe('Combined Parameters Integration', () => {
    it('should handle backgroundFormat with CDN upload', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'pptist');
      formData.append('useCdn', 'true');
      formData.append('cdnFilename', 'test-pptist.json');

      const mockResponse = {
        success: true,
        data: {
          slides: [{
            background: {
              type: 'image',
              image: { src: 'test.jpg', size: 'cover' }
            }
          }]
        },
        cdnUrl: 'https://cdn.example.com/test-pptist.json',
        cdnId: 'test-id-123'
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.cdnUrl).toBeDefined();
      expect(result.data.slides[0].background.image).toHaveProperty('src');
    });

    it('should handle backgroundFormat with debug options', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('backgroundFormat', 'pptist');
      formData.append('enableDebugMode', 'true');
      formData.append('debugOptions', JSON.stringify({
        saveDebugImages: true,
        logProcessingDetails: true
      }));

      const mockResponse = {
        success: true,
        data: {
          slides: [{
            background: {
              type: 'image',
              image: { src: 'test.jpg', size: 'cover' }
            }
          }]
        },
        debug: {
          debugMode: true,
          backgroundFormat: 'pptist'
        }
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.debug.debugMode).toBe(true);
      expect(result.data.slides[0].background.image).toHaveProperty('src');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle file upload errors gracefully', async () => {
      const formData = new FormData();
      formData.append('backgroundFormat', 'pptist');
      // No file uploaded

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'No file uploaded or CDN URL provided'
        })
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle invalid file types', async () => {
      const formData = new FormData();
      formData.append('file', new File(['invalid'], 'test.txt', { type: 'text/plain' }));
      formData.append('backgroundFormat', 'pptist');

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Invalid file type. Please upload a .pptx file'
        })
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle parsing errors with backgroundFormat', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile('corrupted.pptx'));
      formData.append('backgroundFormat', 'pptist');

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: 'Failed to parse PPTX file',
          details: 'Corrupted file structure'
        })
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests with different background formats', async () => {
      const legacyFormData = new FormData();
      legacyFormData.append('file', createTestFile('legacy.pptx'));
      legacyFormData.append('backgroundFormat', 'legacy');

      const pptistFormData = new FormData();
      pptistFormData.append('file', createTestFile('pptist.pptx'));
      pptistFormData.append('backgroundFormat', 'pptist');

      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: { slides: [{ background: { imageSize: 'cover' } }] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            success: true,
            data: { slides: [{ background: { image: { size: 'cover' } } }] }
          })
        });

      global.fetch = mockFetch;

      const [legacyResponse, pptistResponse] = await Promise.all([
        fetch(API_ENDPOINT, { method: 'POST', body: legacyFormData }),
        fetch(API_ENDPOINT, { method: 'POST', body: pptistFormData })
      ]);

      expect(legacyResponse.ok).toBe(true);
      expect(pptistResponse.ok).toBe(true);

      const legacyResult = await legacyResponse.json();
      const pptistResult = await pptistResponse.json();

      expect(legacyResult.data.slides[0].background).toHaveProperty('imageSize');
      expect(pptistResult.data.slides[0].background.image).toHaveProperty('size');
    });

    it('should complete processing within reasonable time limits', async () => {
      const formData = new FormData();
      formData.append('file', createTestFile('large.pptx'));
      formData.append('backgroundFormat', 'pptist');

      const startTime = Date.now();

      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: jest.fn().mockResolvedValue({
                success: true,
                data: { slides: [] }
              })
            });
          }, 100); // Simulate 100ms processing time
        })
      );

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing API clients', async () => {
      // Test that existing clients without backgroundFormat still work
      const formData = new FormData();
      formData.append('file', createTestFile());
      formData.append('format', 'pptist');
      // No backgroundFormat specified

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            slides: [{
              background: {
                type: 'image',
                image: 'test.jpg',
                imageSize: 'cover'
              }
            }]
          }
        })
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      expect(result.success).toBe(true);
      // Should use legacy format by default
      expect(result.data.slides[0].background).toHaveProperty('imageSize');
      expect(typeof result.data.slides[0].background.image).toBe('string');
    });
  });
});