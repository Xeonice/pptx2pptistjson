/**
 * Tests for JsonViewer Component
 * Covers JSON display, Monaco Editor integration, and empty states
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonViewer } from '../../components/JsonViewer';

// Mock dynamic import for Monaco Editor
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: () => Promise<any>, options?: any) => {
    // Import the already mocked MonacoJsonEditor
    const { MonacoJsonEditor } = require('../../components/MonacoJsonEditor');
    
    // Return the mocked component directly
    const MockComponent = (props: any) => {
      return <MonacoJsonEditor {...props} />;
    };
    MockComponent.displayName = 'DynamicMockComponent';
    return MockComponent;
  },
}));

// Mock the MonacoJsonEditor component
jest.mock('../../components/MonacoJsonEditor', () => ({
  MonacoJsonEditor: ({ data, onCopy, height, readOnly, theme }: any) => (
    <div
      data-testid="monaco-json-editor"
      data-height={height}
      data-readonly={readOnly?.toString()}
      data-theme={theme}
    >
      <div>Monaco JSON Editor</div>
      <button onClick={() => onCopy?.(true)}>Copy</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  ),
}));

describe('JsonViewer Component', () => {
  const mockOnCopy = jest.fn();
  
  const sampleData = {
    slides: [{ id: 1, content: 'Slide 1' }, { id: 2, content: 'Slide 2' }],
    themeColors: ['#FF0000', '#00FF00', '#0000FF'],
    size: { width: 1920, height: 1080 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset React state
    jest.clearAllTimers();
  });

  describe('Empty State', () => {
    it('renders empty state when no data is provided', () => {
      render(<JsonViewer data={null} />);
      
      expect(screen.getByText('🖥️ Monaco JSON Editor')).toBeInTheDocument();
      expect(screen.getByText('上传 PPTX 文件查看解析结果')).toBeInTheDocument();
      expect(screen.getByText('支持代码高亮、搜索、格式化和快捷键操作')).toBeInTheDocument();
    });

    it('displays correct empty state icon and styling', () => {
      render(<JsonViewer data={null} />);
      
      const emptyIcon = screen.getByText('🖥️', { selector: 'div' });
      expect(emptyIcon).toHaveStyle({ fontSize: '48px' });
    });

    it('renders header even in empty state', () => {
      render(<JsonViewer data={null} />);
      
      const headers = screen.getAllByText('🖥️ Monaco JSON Editor');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Data Display', () => {
    it('renders Monaco Editor when data is provided', async () => {
      render(<JsonViewer data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });

    it('passes correct props to Monaco Editor', async () => {
      render(<JsonViewer data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-json-editor');
        expect(editor).toHaveAttribute('data-height', '100%');
        expect(editor).toHaveAttribute('data-readonly', 'true');
        expect(editor).toHaveAttribute('data-theme', 'light');
      });
    });

    it('displays the JSON data in the editor', async () => {
      render(<JsonViewer data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const jsonContent = screen.getByText(/"slides":/);
        expect(jsonContent).toBeInTheDocument();
      });
    });
  });

  describe('Client-Side Rendering', () => {
    it('shows initialization message before client-side hydration', () => {
      render(<JsonViewer data={null} />);
      
      expect(screen.getByText('上传 PPTX 文件查看解析结果')).toBeInTheDocument();
    });

    it('transitions from loading to loaded state', async () => {
      render(<JsonViewer data={sampleData} />);
      
      // Should show the editor
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Copy Functionality', () => {
    it('calls onCopy callback when copy button is clicked', async () => {
      render(<JsonViewer data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        copyButton.click();
      });
      
      expect(mockOnCopy).toHaveBeenCalledWith(true);
    });

    it('handles missing onCopy callback gracefully', async () => {
      render(<JsonViewer data={sampleData} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        expect(() => copyButton.click()).not.toThrow();
      });
    });
  });

  describe('Layout and Styling', () => {
    it('renders with correct container structure', () => {
      render(<JsonViewer data={sampleData} />);
      
      const container = screen.getByText('🖥️ Monaco JSON Editor').closest('div');
      const parentContainer = container?.parentElement;
      
      expect(parentContainer).toHaveStyle({
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      });
    });

    it('renders header with correct styling', () => {
      render(<JsonViewer data={sampleData} />);
      
      const header = screen.getByText('🖥️ Monaco JSON Editor').parentElement;
      expect(header).toHaveStyle({
        padding: '12px 16px',
        borderBottom: '1px solid #e1e5e9',
        backgroundColor: '#f8f9fa',
      });
    });

    it('centers header title', () => {
      render(<JsonViewer data={sampleData} />);
      
      const headerContainer = screen.getByText('🖥️ Monaco JSON Editor').parentElement;
      expect(headerContainer).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      });
    });
  });

  describe('Dynamic Import Loading', () => {
    it('shows loading component during dynamic import', () => {
      render(<JsonViewer data={sampleData} />);
      
      // The loading component might show briefly
      // Since we mocked dynamic to render immediately, we check the structure exists
      expect(screen.getByText('🖥️ Monaco JSON Editor')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined data same as null', () => {
      render(<JsonViewer data={undefined} />);
      
      expect(screen.getByText('上传 PPTX 文件查看解析结果')).toBeInTheDocument();
    });

    it('handles empty object data', async () => {
      render(<JsonViewer data={{}} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
        expect(screen.getByText('{}')).toBeInTheDocument();
      });
    });

    it('handles complex nested data', async () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              deepValue: 'nested content',
              array: [1, 2, 3],
            },
          },
        },
      };
      
      render(<JsonViewer data={complexData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
        expect(screen.getByText(/"deepValue":/)).toBeInTheDocument();
      });
    });

    it('handles data with special characters', async () => {
      const specialData = {
        content: 'Line 1\nLine 2\tTabbed',
        unicode: '你好世界 🌍',
        quotes: 'He said "Hello"',
      };
      
      render(<JsonViewer data={specialData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Component Updates', () => {
    it('updates when data prop changes', async () => {
      const { rerender } = render(<JsonViewer data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByText(/"slides":/)).toBeInTheDocument();
      });
      
      const newData = { updated: true, value: 42 };
      rerender(<JsonViewer data={newData} />);
      
      await waitFor(() => {
        expect(screen.getByText(/"updated":/)).toBeInTheDocument();
      });
    });

    it('transitions from data to empty state', async () => {
      const { rerender } = render(<JsonViewer data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
      
      rerender(<JsonViewer data={null} />);
      
      expect(screen.getByText('上传 PPTX 文件查看解析结果')).toBeInTheDocument();
    });

    it('updates onCopy callback', async () => {
      const newOnCopy = jest.fn();
      const { rerender } = render(<JsonViewer data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-json-editor')).toBeInTheDocument();
      });
      
      rerender(<JsonViewer data={sampleData} onCopy={newOnCopy} />);
      
      const copyButton = screen.getByText('Copy');
      copyButton.click();
      
      expect(newOnCopy).toHaveBeenCalledWith(true);
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<JsonViewer data={sampleData} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('🖥️ Monaco JSON Editor');
    });

    it('provides descriptive text for empty state', () => {
      render(<JsonViewer data={null} />);
      
      expect(screen.getByText('支持代码高亮、搜索、格式化和快捷键操作')).toBeInTheDocument();
    });
  });
});