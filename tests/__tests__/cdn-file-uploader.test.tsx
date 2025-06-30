/**
 * Tests for CdnFileUploader Component
 * Covers Switch component integration, CDN upload workflows, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CdnFileUploader } from '../../components/CdnFileUploader';

// Mock the @vercel/blob/client module
jest.mock('@vercel/blob/client', () => ({
  upload: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('CdnFileUploader Component', () => {
  const mockOnFileUpload = jest.fn();
  const mockOnUploadResult = jest.fn();

  const defaultProps = {
    onFileUpload: mockOnFileUpload,
    onUploadResult: mockOnUploadResult,
    loading: false,
    outputFormat: 'pptist',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('renders with default state', () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      expect(screen.getByText('Upload PPTX to CDN first (recommended for large PPTX files)')).toBeInTheDocument();
      expect(screen.getByText('Upload JSON result to CDN (recommended for large outputs)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose pptx file/i })).toBeInTheDocument();
    });

    it('renders with loading state', () => {
      render(<CdnFileUploader {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Converting...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows custom filename input when useCdn is enabled', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      // Find and click the CDN result upload switch
      const switches = screen.getAllByRole('switch');
      const cdnResultSwitch = switches[1]; // Second switch is for JSON CDN upload
      
      fireEvent.click(cdnResultSwitch);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('e.g., my-presentation.json')).toBeInTheDocument();
      });
    });
  });

  describe('Switch Component Integration', () => {
    it('toggles PPTX CDN upload switch', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      const switches = screen.getAllByRole('switch');
      const pptxCdnSwitch = switches[0]; // First switch is for PPTX CDN upload
      
      expect(pptxCdnSwitch).not.toBeChecked();
      
      fireEvent.click(pptxCdnSwitch);
      
      await waitFor(() => {
        expect(pptxCdnSwitch).toBeChecked();
      });
    });

    it('toggles JSON CDN upload switch', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      const switches = screen.getAllByRole('switch');
      const jsonCdnSwitch = switches[1]; // Second switch is for JSON CDN upload
      
      expect(jsonCdnSwitch).not.toBeChecked();
      
      fireEvent.click(jsonCdnSwitch);
      
      await waitFor(() => {
        expect(jsonCdnSwitch).toBeChecked();
      });
    });

    it('disables switches when loading', () => {
      render(<CdnFileUploader {...defaultProps} loading={true} />);
      
      const switches = screen.getAllByRole('switch');
      
      switches.forEach(switchElement => {
        expect(switchElement).toBeDisabled();
      });
    });
  });

  describe('File Upload Workflows', () => {
    it('handles direct file upload without CDN', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      const fileInput = screen.getByTestId('file-input') || document.querySelector('input[type="file"]');
      
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(mockOnFileUpload).toHaveBeenCalledWith(file, {
            useCdn: false,
            cdnFilename: undefined,
            uploadPptxToCdn: false,
          });
        });
      }
    });

    it('handles CDN-first upload workflow', async () => {
      const { upload } = require('@vercel/blob/client');
      upload.mockResolvedValue({
        url: 'https://test-cdn.vercel-storage.com/test-123.pptx',
        pathname: 'test.pptx',
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 12345
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { slides: [], theme: {} },
          filename: 'test.pptx'
        })
      });

      render(<CdnFileUploader {...defaultProps} />);
      
      // Enable PPTX CDN upload
      const switches = screen.getAllByRole('switch');
      const pptxCdnSwitch = switches[0];
      fireEvent.click(pptxCdnSwitch);
      
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(upload).toHaveBeenCalled();
        });
        
        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith('/api/parse-pptx', expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          }));
        });
        
        await waitFor(() => {
          expect(mockOnUploadResult).toHaveBeenCalledWith({
            success: true,
            data: { slides: [], theme: {} },
            filename: 'test.pptx'
          });
        });
      }
    });

    it('generates unique filenames for CDN uploads', async () => {
      const { upload } = require('@vercel/blob/client');
      upload.mockResolvedValue({
        url: 'https://test-cdn.vercel-storage.com/test-123.pptx'
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      render(<CdnFileUploader {...defaultProps} />);
      
      // Enable PPTX CDN upload
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);
      
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(upload).toHaveBeenCalled();
          const uploadCall = upload.mock.calls[0];
          const filename = uploadCall[0];
          
          // Should contain timestamp and random suffix
          expect(filename).toMatch(/test-\d+-[a-z0-9]+\.pptx/);
        });
      }
    });

    it('handles CDN upload errors gracefully', async () => {
      const { upload } = require('@vercel/blob/client');
      upload.mockRejectedValue(new Error('CDN upload failed'));

      // Mock window.alert
      window.alert = jest.fn();

      render(<CdnFileUploader {...defaultProps} />);
      
      // Enable PPTX CDN upload
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);
      
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      });
      
      const fileInput = document.querySelector('input[type="file"]');
      
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('Failed to upload PPTX to CDN: CDN upload failed')
          );
        });
      }
    });
  });

  describe('Results Display', () => {
    it('displays CDN upload success result', () => {
      const lastResult = {
        success: true,
        cdnUrl: 'https://cdn.example.com/result.json',
        cdnId: 'test-id-123',
        filename: 'presentation.json',
        size: 54321,
        metadata: {
          uploadedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      render(<CdnFileUploader {...defaultProps} lastResult={lastResult} />);
      
      expect(screen.getByText('JSON Uploaded to CDN Successfully')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://cdn.example.com/result.json')).toBeInTheDocument();
      expect(screen.getByText('presentation.json')).toBeInTheDocument();
      expect(screen.getByText('53.05 KB')).toBeInTheDocument();
    });

    it('displays direct response result', () => {
      const lastResult = {
        success: true,
        data: {
          slides: [{ id: '1' }, { id: '2' }],
          theme: { colors: {} }
        },
        filename: 'presentation.json'
      };

      render(<CdnFileUploader {...defaultProps} lastResult={lastResult} />);
      
      expect(screen.getByText('JSON Response (Direct)')).toBeInTheDocument();
      expect(screen.getByText('presentation.json')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Number of slides
      expect(screen.getByText('Yes')).toBeInTheDocument(); // Theme exists
    });

    it('displays CDN error warning', () => {
      const lastResult = {
        success: true,
        cdnError: {
          message: 'Upload failed',
          details: 'Network timeout'
        },
        filename: 'presentation.json'
      };

      render(<CdnFileUploader {...defaultProps} lastResult={lastResult} />);
      
      expect(screen.getByText('CDN Upload Warning')).toBeInTheDocument();
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles custom filename input', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      // Enable CDN result upload
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[1]);
      
      await waitFor(() => {
        const filenameInput = screen.getByPlaceholderText('e.g., my-presentation.json');
        fireEvent.change(filenameInput, { target: { value: 'custom-name.json' } });
        
        expect(filenameInput).toHaveValue('custom-name.json');
      });
    });

    it('copies CDN URL to clipboard', async () => {
      const lastResult = {
        success: true,
        cdnUrl: 'https://cdn.example.com/result.json',
        filename: 'test.json'
      };

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      // Mock window.alert
      window.alert = jest.fn();

      render(<CdnFileUploader {...defaultProps} lastResult={lastResult} />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://cdn.example.com/result.json');
        expect(window.alert).toHaveBeenCalledWith('URL copied to clipboard!');
      });
    });

    it('opens CDN URL in new tab', () => {
      const lastResult = {
        success: true,
        cdnUrl: 'https://cdn.example.com/result.json',
        filename: 'test.json'
      };

      // Mock window.open
      window.open = jest.fn();

      render(<CdnFileUploader {...defaultProps} lastResult={lastResult} />);
      
      const openButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(openButton);
      
      expect(window.open).toHaveBeenCalledWith('https://cdn.example.com/result.json', '_blank');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for switches', () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      const switches = screen.getAllByRole('switch');
      
      expect(switches).toHaveLength(2);
      switches.forEach(switchElement => {
        expect(switchElement).toBeInTheDocument();
        expect(switchElement).toHaveAttribute('role', 'switch');
      });
    });

    it('maintains focus management during interactions', async () => {
      render(<CdnFileUploader {...defaultProps} />);
      
      const fileButton = screen.getByRole('button', { name: /choose pptx file/i });
      
      fireEvent.focus(fileButton);
      expect(fileButton).toHaveFocus();
      
      fireEvent.blur(fileButton);
      expect(fileButton).not.toHaveFocus();
    });
  });
});