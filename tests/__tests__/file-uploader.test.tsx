/**
 * Tests for FileUploader Component
 * Covers file upload functionality, loading states, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FileUploader } from '../../components/FileUploader';

describe('FileUploader Component', () => {
  const mockOnFileUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders upload button with correct text when not loading', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('点击上传 .pptx 文件');
      expect(button).not.toBeDisabled();
    });

    it('renders loading state correctly', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('解析中...');
      expect(button).toBeDisabled();
    });

    it('displays file size limit message', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      expect(screen.getByText('支持最大 50MB 的 .pptx 文件')).toBeInTheDocument();
    });
  });

  describe('File Input Behavior', () => {
    it('has hidden file input with correct accept attribute', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute(
        'accept',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    it('triggers file input click when button is clicked', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Mock click method
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      await userEvent.click(button);
      
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not trigger file input when loading', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      const button = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      await userEvent.click(button);
      
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('File Upload Handling', () => {
    it('calls onFileUpload when a file is selected', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const file = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalledWith(file);
      });
    });

    it('does not call onFileUpload when no file is selected', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate empty file selection
      fireEvent.change(fileInput, { target: { files: [] } });
      
      expect(mockOnFileUpload).not.toHaveBeenCalled();
    });

    it('handles multiple file selection (takes first file)', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const file1 = new File(['content1'], 'test1.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const file2 = new File(['content2'], 'test2.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate multiple file selection
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalledWith(file1);
        expect(mockOnFileUpload).toHaveBeenCalledTimes(1);
      });
    });

    it('clears file input value before new selection', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Set initial value
      Object.defineProperty(fileInput, 'value', {
        writable: true,
        value: 'existing-file.pptx',
      });
      
      await userEvent.click(button);
      
      expect(fileInput.value).toBe('');
    });
  });

  describe('Styling and Visual States', () => {
    it('applies correct button styles when not loading', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: '#d14424',
        color: '#fff',
        cursor: 'pointer',
        width: '300px',
        height: '80px',
      });
    });

    it('applies correct button styles when loading', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: '#999',
        cursor: 'not-allowed',
      });
    });

    it('shows spinner animation when loading', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      // Look for the spinner by checking the loading text
      const loadingText = screen.getByText('解析中...');
      expect(loadingText).toBeInTheDocument();
      
      // Check if parent contains the spinner span
      const button = screen.getByRole('button');
      const spinnerSpan = button.querySelector('span[style*="animation"]');
      expect(spinnerSpan).toBeInTheDocument();
    });

    it('centers content properly', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      const container = button.parentElement!;
      expect(container).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      });
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      
      // Tab to button
      await userEvent.tab();
      expect(button).toHaveFocus();
    });

    it('disabled state prevents keyboard activation', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      const button = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      // Try to activate with Enter key
      button.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('file input is properly hidden from screen readers', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveStyle({ display: 'none' });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid button clicks gracefully', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const button = screen.getByRole('button');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');
      
      // Rapid clicks
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);
      
      // Should handle all clicks without errors
      expect(clickSpy).toHaveBeenCalledTimes(3);
      clickSpy.mockRestore();
    });

    it('handles file with invalid type gracefully', async () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Browser will typically prevent this due to accept attribute,
      // but we test the component handles it if it happens
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalledWith(file);
      });
    });

    it('handles null files array', () => {
      render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      
      // Simulate null files
      fireEvent.change(fileInput, { target: { files: null } });
      
      expect(mockOnFileUpload).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('maintains ref across re-renders', () => {
      const { rerender } = render(
        <FileUploader onFileUpload={mockOnFileUpload} loading={false} />
      );
      
      const fileInput1 = document.querySelector('input[type="file"]');
      expect(fileInput1).toBeInTheDocument();
      
      rerender(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      const fileInput2 = document.querySelector('input[type="file"]');
      expect(fileInput2).toBeInTheDocument();
      
      // Should be the same element
      expect(fileInput1).toBe(fileInput2);
    });

    it('updates loading state dynamically', () => {
      const { rerender } = render(
        <FileUploader onFileUpload={mockOnFileUpload} loading={false} />
      );
      
      expect(screen.getByText('点击上传 .pptx 文件')).toBeInTheDocument();
      
      rerender(<FileUploader onFileUpload={mockOnFileUpload} loading={true} />);
      
      expect(screen.getByText('解析中...')).toBeInTheDocument();
    });
  });
});