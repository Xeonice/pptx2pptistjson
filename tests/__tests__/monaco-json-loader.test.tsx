/**
 * Tests for MonacoJsonLoader Component
 * Covers JSON loading from URLs and direct data, error handling, and file operations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MonacoJsonLoader } from '../../components/MonacoJsonLoader';

// Mock MonacoJsonEditor
jest.mock('../../components/MonacoJsonEditor', () => ({
  MonacoJsonEditor: ({ data, height, readOnly, onCopy }: any) => (
    <div
      data-testid="monaco-json-editor"
      data-height={height}
      data-readonly={readOnly?.toString()}
    >
      <div>Monaco JSON Editor</div>
      <button onClick={() => onCopy?.(true)}>Copy</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  ),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.open
global.open = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(),
  revokeObjectURL: jest.fn(),
} as any;

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback) => {
  setTimeout(callback, 0);
  return 1; // Return a number as required by the type
}) as any;

describe('MonacoJsonLoader Component', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockClipboard = navigator.clipboard.writeText as jest.Mock;
  const mockCreateObjectURL = URL.createObjectURL as jest.Mock;
  const mockRevokeObjectURL = URL.revokeObjectURL as jest.Mock;

  const sampleData = {
    slides: [{ id: 1, content: 'Test slide' }],
    themeColors: ['#FF0000'],
    size: { width: 1920, height: 1080 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockClipboard.mockResolvedValue(void 0);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    // Mock alert
    global.alert = jest.fn();
  });

  describe('Basic Rendering', () => {
    it('renders without source', () => {
      render(<MonacoJsonLoader />);
      
      expect(screen.getByText('📋 Copy')).toBeInTheDocument();
      expect(screen.getByText('💾 Download')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<MonacoJsonLoader />);
      
      const copyButton = screen.getByText('📋 Copy');
      const downloadButton = screen.getByText('💾 Download');
      
      expect(copyButton).toBeDisabled();
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Data Source Handling', () => {
    it('loads direct data source', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
        filename: 'test.json',
      };

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('Direct Data')).toBeInTheDocument();
        expect(screen.getByText('test.json')).toBeInTheDocument();
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });

    it('handles URL source loading', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
        filename: 'test.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('CDN URL')).toBeInTheDocument();
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });

    it('shows loading state during fetch', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise as Promise<Response>);

      render(<MonacoJsonLoader source={source} />);
      
      expect(screen.getByText('Loading JSON...')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading JSON...')).not.toBeInTheDocument();
      });
    });

    it('handles fetch errors', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('❌ Loading Error')).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
        expect(screen.getByText('🔄 Retry Loading')).toBeInTheDocument();
      });
    });
  });

  describe('Large File Handling', () => {
    it('handles large files with optimized loading', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/large-file.json',
      };

      const largeFileSize = 15 * 1024 * 1024; // 15MB
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(sampleData)),
        headers: new Headers({ 'content-length': largeFileSize.toString() }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Processing.*MB file/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });

    it('shows progress for large file downloads', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/large-file.json',
      };

      const largeFileSize = 12 * 1024 * 1024; // 12MB
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(sampleData)),
        headers: new Headers({ 'content-length': largeFileSize.toString() }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Processing.*MB file/)).toBeInTheDocument();
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('implements retry logic for failed requests', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(sampleData),
          headers: new Headers({ 'content-length': '1000' }),
        } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });

      // Should have made 3 attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('handles timeout errors with detailed message', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      const timeoutError = new Error('timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValue(timeoutError);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Request timeout/)).toBeInTheDocument();
        expect(screen.getByText(/Large file size/)).toBeInTheDocument();
      });
    });

    it('allows manual retry from error state', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('🔄 Retry Loading')).toBeInTheDocument();
      });

      // Setup successful response for retry
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      const retryButton = screen.getByText('🔄 Retry Loading');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Header Actions', () => {
    it('displays source information correctly', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
        filename: 'test.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('CDN URL')).toBeInTheDocument();
        expect(screen.getByText('test.json')).toBeInTheDocument();
        expect(screen.getByText(source.url)).toBeInTheDocument();
      });
    });

    it('allows copying URL to clipboard', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const urlElement = screen.getByText(source.url);
        fireEvent.click(urlElement);
      });

      expect(mockClipboard).toHaveBeenCalledWith(source.url);
    });

    it('opens URL in new tab', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const openButton = screen.getByText('🔗');
        fireEvent.click(openButton);
      });

      expect(global.open).toHaveBeenCalledWith(source.url, '_blank');
    });

    it('handles refresh action', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleData),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('🔄 Refresh');
        fireEvent.click(refreshButton);
      });

      // Should trigger another fetch
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Copy and Download Actions', () => {
    it('copies JSON to clipboard', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
      };

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copy');
        fireEvent.click(copyButton);
      });

      expect(mockClipboard).toHaveBeenCalledWith(JSON.stringify(sampleData, null, 2));
    });

    it('handles copy failure gracefully', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
      };

      mockClipboard.mockRejectedValue(new Error('Clipboard error'));

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copy');
        fireEvent.click(copyButton);
      });

      expect(global.alert).toHaveBeenCalledWith('Failed to copy JSON to clipboard');
    });

    it('downloads JSON file', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
        filename: 'test.json',
      };

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      Object.defineProperty(document, 'createElement', {
        value: jest.fn().mockReturnValue(mockLink),
        writable: true,
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const downloadButton = screen.getByText('💾 Download');
        fireEvent.click(downloadButton);
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe('test.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('JSON Parsing', () => {
    it('handles invalid JSON gracefully', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/invalid.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
      });
    });

    it('handles malformed JSON in editor', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/malformed.json',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{ invalid json }'),
        headers: new Headers({ 'content-length': '1000' }),
      } as Response);

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Component Updates', () => {
    it('reloads when source changes', async () => {
      const source1 = {
        type: 'data' as const,
        data: sampleData,
      };

      const source2 = {
        type: 'data' as const,
        data: { different: 'data' },
      };

      const { rerender } = render(<MonacoJsonLoader source={source1} />);
      
      await waitFor(() => {
        expect(screen.getByText(/"slides"/)).toBeInTheDocument();
      });

      rerender(<MonacoJsonLoader source={source2} />);
      
      await waitFor(() => {
        expect(screen.getByText(/"different"/)).toBeInTheDocument();
      });
    });

    it('handles readonly prop changes', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
      };

      const { rerender } = render(<MonacoJsonLoader source={source} readonly={true} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-json-editor');
        expect(editor).toHaveAttribute('data-readonly', 'true');
      });

      rerender(<MonacoJsonLoader source={source} readonly={false} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-json-editor');
        expect(editor).toHaveAttribute('data-readonly', 'false');
      });
    });
  });

  describe('Error Boundary', () => {
    it('handles component errors gracefully', async () => {
      const source = {
        type: 'data' as const,
        data: undefined,
      };

      expect(() => {
        render(<MonacoJsonLoader source={source} />);
      }).not.toThrow();
    });

    it('handles missing clipboard API', async () => {
      const originalClipboard = navigator.clipboard;
      delete (navigator as any).clipboard;

      const source = {
        type: 'data' as const,
        data: sampleData,
      };

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 Copy');
        fireEvent.click(copyButton);
      });

      expect(global.alert).toHaveBeenCalledWith('Clipboard API not available');

      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
      });
    });
  });

  describe('Accessibility', () => {
    it('disables buttons during loading', async () => {
      const source = {
        type: 'url' as const,
        url: 'https://example.com/test.json',
      };

      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(fetchPromise as Promise<Response>);

      render(<MonacoJsonLoader source={source} />);
      
      expect(screen.getByText('📋 Copy')).toBeDisabled();
      expect(screen.getByText('💾 Download')).toBeDisabled();
      expect(screen.getByText('🔄 Refresh')).toBeDisabled();
    });

    it('provides proper button states', async () => {
      const source = {
        type: 'data' as const,
        data: sampleData,
      };

      render(<MonacoJsonLoader source={source} />);
      
      await waitFor(() => {
        expect(screen.getByText('📋 Copy')).not.toBeDisabled();
        expect(screen.getByText('💾 Download')).not.toBeDisabled();
      });
    });
  });
});