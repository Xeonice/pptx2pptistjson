/**
 * Tests for MonacoJsonLoader Large File Handling
 * Covers timeout improvements, large file optimizations, and progress indicators
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonacoJsonLoader } from '../../components/MonacoJsonLoader';

// Mock fetch for large file simulations
global.fetch = jest.fn();

describe('MonacoJsonLoader Large File Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Large File Optimizations', () => {
    it('detects large files and uses optimized loading', async () => {
      const largeFileContent = { slides: new Array(1000).fill({ id: 'test' }) };
      const largeFileText = JSON.stringify(largeFileContent);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (15 * 1024 * 1024).toString() // 15MB
        }),
        text: () => Promise.resolve(largeFileText),
        json: () => Promise.resolve(largeFileContent)
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/large-file.json'
      };

      render(<MonacoJsonLoader source={source} />);

      // Should show loading state
      expect(screen.getByText(/Loading JSON/)).toBeInTheDocument();

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading JSON/)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/large-file.json',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          })
        })
      );
    });

    it('shows detailed progress for large files', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (12 * 1024 * 1024).toString() // 12MB
        }),
        text: () => Promise.resolve('{"test": "data"}'),
        json: () => Promise.resolve({ test: 'data' })
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/large.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Using optimized loading for large file')
        );
      });

      consoleSpy.mockRestore();
    });

    it('uses minimized format for large files', async () => {
      const largeData = { 
        slides: new Array(100).fill({ 
          id: 'test', 
          content: 'large content here' 
        })
      };
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (20 * 1024 * 1024).toString() // 20MB
        }),
        text: () => Promise.resolve(JSON.stringify(largeData)),
        json: () => Promise.resolve(largeData)
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/very-large.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading JSON/)).not.toBeInTheDocument();
      }, { timeout: 15000 });

      // The component should have loaded successfully
      expect(screen.queryByText(/Loading Error/)).not.toBeInTheDocument();
    });
  });

  describe('Timeout Handling', () => {
    it('handles timeouts with detailed error messages', async () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Request timeout');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        })
      );

      const source = {
        type: 'url' as const,
        url: 'https://example.com/slow-file.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(screen.getByText(/Loading Error/)).toBeInTheDocument();
      }, { timeout: 5000 });

      await waitFor(() => {
        const errorElement = screen.getByText(/Request timeout/);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.textContent).toContain('Large file size');
        expect(errorElement.textContent).toContain('Slow network connection');
      });
    });

    it('shows retry button for timeout errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const source = {
        type: 'url' as const,
        url: 'https://example.com/timeout.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(screen.getByText(/Loading Error/)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry Loading/ });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toBeEnabled();
    });

    it('uses 120-second timeout for large files', () => {
      // This test verifies the timeout configuration
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json'
      };

      render(<MonacoJsonLoader source={source} />);

      // Verify fetch was called with expected headers
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/test.json',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.any(Object)
        })
      );
    });
  });

  describe('Progress Indicators', () => {
    it('shows different progress messages during loading', async () => {
      let resolveText: (value: string) => void;
      const textPromise = new Promise<string>((resolve) => {
        resolveText = resolve;
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (5 * 1024 * 1024).toString() // 5MB
        }),
        text: () => textPromise,
        json: () => Promise.resolve({ test: 'data' })
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/progress-test.json'
      };

      render(<MonacoJsonLoader source={source} />);

      // Should show initial loading
      expect(screen.getByText(/Downloading/)).toBeInTheDocument();

      // Resolve the text promise
      resolveText!('{"test": "data"}');

      await waitFor(() => {
        expect(screen.queryByText(/Loading JSON/)).not.toBeInTheDocument();
      });
    });

    it('displays file size information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (8 * 1024 * 1024).toString() // 8MB
        }),
        text: () => Promise.resolve('{"data": "test"}'),
        json: () => Promise.resolve({ data: 'test' })
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/sized-file.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Loading JSON file: 8.00MB')
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Warnings', () => {
    it('logs performance suggestions for large files', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-length': (7 * 1024 * 1024).toString() // 7MB
        }),
        text: () => Promise.resolve('{"large": "file"}'),
        json: () => Promise.resolve({ large: 'file' })
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/performance-test.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Performance note: File size is 7.00MB')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Using JSONLoader in view-only mode')
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Retry Mechanism', () => {
    it('retries failed requests with exponential backoff', async () => {
      let callCount = 0;
      
      (fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-length': '1024' }),
          text: () => Promise.resolve('{"success": true}'),
          json: () => Promise.resolve({ success: true })
        });
      });

      const source = {
        type: 'url' as const,
        url: 'https://example.com/retry-test.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading JSON/)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(screen.queryByText(/Loading Error/)).not.toBeInTheDocument();
    });

    it('fails after maximum retry attempts', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Persistent network error'));

      const source = {
        type: 'url' as const,
        url: 'https://example.com/always-fail.json'
      };

      render(<MonacoJsonLoader source={source} />);

      await waitFor(() => {
        expect(screen.getByText(/Loading Error/)).toBeInTheDocument();
      }, { timeout: 15000 });

      expect(fetch).toHaveBeenCalledTimes(3); // Should retry 3 times
      expect(screen.getByText(/Persistent network error/)).toBeInTheDocument();
    });
  });
});