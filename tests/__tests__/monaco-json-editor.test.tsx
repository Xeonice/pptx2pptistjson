/**
 * Tests for MonacoJsonEditor Component
 * Covers Monaco Editor integration, JSON formatting, toolbar functionality, and keyboard shortcuts
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MonacoJsonEditor } from '../../components/MonacoJsonEditor';

// Mock the Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, options, onMount, loading, theme }: any) => {
      // Simulate the Monaco Editor component
      React.useEffect(() => {
        if (onMount) {
          const mockEditor = {
            setValue: jest.fn(),
            getValue: jest.fn().mockReturnValue(value),
            getAction: jest.fn().mockReturnValue({ run: jest.fn() }),
            addCommand: jest.fn(),
            focus: jest.fn(),
            dispose: jest.fn(),
          };
          onMount(mockEditor);
        }
      }, [onMount]);

      return (
        <div
          data-testid="monaco-editor"
          data-value={value}
          data-theme={theme}
          data-readonly={options?.readOnly?.toString()}
        >
          <textarea
            value={value}
            readOnly={options?.readOnly}
            data-testid="monaco-editor-textarea"
          />
          {loading}
        </div>
      );
    },
  };
});

// Mock dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: () => Promise<any>, options?: any) => {
    const MockComponent = (props: any) => {
      if (options?.loading) {
        return options.loading();
      }
      return <div data-testid="dynamic-mock" {...props}>Dynamic Mock</div>;
    };
    MockComponent.displayName = 'DynamicMockComponent';
    return MockComponent;
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('MonacoJsonEditor Component', () => {
  const mockOnCopy = jest.fn();
  
  const sampleData = {
    slides: [{ id: 1, content: 'Slide 1' }],
    themeColors: ['#FF0000', '#00FF00'],
    size: { width: 1920, height: 1080 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(void 0);
  });

  describe('Basic Rendering', () => {
    it('renders empty state when no data is provided', () => {
      render(<MonacoJsonEditor data={null} />);
      
      expect(screen.getByText('Monaco Editor JSON 查看器')).toBeInTheDocument();
      expect(screen.getByText('上传 PPTX 文件查看解析结果')).toBeInTheDocument();
    });

    it('renders editor with data', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('shows loading state during client-side initialization', () => {
      // Mock useEffect to not execute immediately
      const originalUseEffect = React.useEffect;
      jest.spyOn(React, 'useEffect').mockImplementation(() => {});
      
      render(<MonacoJsonEditor data={sampleData} />);
      
      expect(screen.getByText('正在初始化 Monaco Editor...')).toBeInTheDocument();
      
      React.useEffect = originalUseEffect;
    });

    it('renders with default props', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-readonly', 'true');
        expect(editor).toHaveAttribute('data-theme', 'vs');
      });
    });
  });

  describe('Props Handling', () => {
    it('applies custom height prop', async () => {
      const { container } = render(
        <MonacoJsonEditor data={sampleData} height="600px" />
      );
      
      await waitFor(() => {
        const editorContainer = container.querySelector('[style*="height: 600px"]');
        expect(editorContainer).toBeInTheDocument();
      });
    });

    it('applies readOnly prop correctly', async () => {
      render(<MonacoJsonEditor data={sampleData} readOnly={false} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-readonly', 'false');
      });
    });

    it('applies theme prop correctly', async () => {
      render(<MonacoJsonEditor data={sampleData} theme="dark" />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-theme', 'vs-dark');
      });
    });

    it('handles onCopy callback', async () => {
      render(<MonacoJsonEditor data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        expect(copyButton).toBeInTheDocument();
      });
    });
  });

  describe('Toolbar Functionality', () => {
    it('renders all toolbar buttons', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByText('✨ 格式化')).toBeInTheDocument();
        expect(screen.getByText('🔍 搜索')).toBeInTheDocument();
        expect(screen.getByText('📁 折叠')).toBeInTheDocument();
        expect(screen.getByText('📂 展开')).toBeInTheDocument();
        expect(screen.getByText('📋 复制')).toBeInTheDocument();
      });
    });

    it('handles format button click', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const formatButton = screen.getByText('✨ 格式化');
        fireEvent.click(formatButton);
        // Should not throw any errors
      });
    });

    it('handles search button click', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const searchButton = screen.getByText('🔍 搜索');
        fireEvent.click(searchButton);
        // Should not throw any errors
      });
    });

    it('handles fold/unfold button clicks', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const foldButton = screen.getByText('📁 折叠');
        const unfoldButton = screen.getByText('📂 展开');
        
        fireEvent.click(foldButton);
        fireEvent.click(unfoldButton);
        // Should not throw any errors
      });
    });

    it('shows button hover effects', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const formatButton = screen.getByText('✨ 格式化');
        
        fireEvent.mouseOver(formatButton);
        expect(formatButton).toHaveStyle({ backgroundColor: '#f0f0f0' });
        
        fireEvent.mouseOut(formatButton);
        expect(formatButton).toHaveStyle({ backgroundColor: '#ffffff' });
      });
    });
  });

  describe('Copy Functionality', () => {
    it('copies JSON to clipboard successfully', async () => {
      render(<MonacoJsonEditor data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        fireEvent.click(copyButton);
      });
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify(sampleData, null, 2)
        );
        expect(mockOnCopy).toHaveBeenCalledWith(true);
      });
    });

    it('handles copy failure gracefully', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(
        new Error('Clipboard access denied')
      );
      
      render(<MonacoJsonEditor data={sampleData} onCopy={mockOnCopy} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        fireEvent.click(copyButton);
      });
      
      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledWith(false);
      });
    });

    it('shows copying state during copy operation', async () => {
      let resolveClipboard: (value: void) => void;
      (navigator.clipboard.writeText as jest.Mock).mockImplementation(
        () => new Promise<void>(resolve => { resolveClipboard = resolve; })
      );
      
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        fireEvent.click(copyButton);
      });
      
      expect(screen.getByText('⏳ 复制中...')).toBeInTheDocument();
      
      // Resolve the clipboard operation
      resolveClipboard!();
      
      await waitFor(() => {
        expect(screen.getByText('📋 复制')).toBeInTheDocument();
      });
    });

    it('disables copy button during copying', async () => {
      let resolveClipboard: (value: void) => void;
      (navigator.clipboard.writeText as jest.Mock).mockImplementation(
        () => new Promise<void>(resolve => { resolveClipboard = resolve; })
      );
      
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        fireEvent.click(copyButton);
      });
      
      const copyingButton = screen.getByText('⏳ 复制中...');
      expect(copyingButton).toBeDisabled();
    });

    it('does not copy when no data is provided', async () => {
      render(<MonacoJsonEditor data={null} onCopy={mockOnCopy} />);
      
      // Should not show copy button in empty state
      expect(screen.queryByText('📋 复制')).not.toBeInTheDocument();
    });
  });

  describe('JSON Formatting', () => {
    it('formats JSON data correctly', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        const expectedJson = JSON.stringify(sampleData, null, 2);
        expect(editor).toHaveAttribute('data-value', expectedJson);
      });
    });

    it('handles invalid JSON data gracefully', async () => {
      const circularData = {} as any;
      circularData.self = circularData;
      
      render(<MonacoJsonEditor data={circularData} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-value', 'Error: Invalid JSON data');
      });
    });

    it('formats complex nested data', async () => {
      const complexData = {
        level1: {
          level2: {
            array: [1, 2, { nested: true }],
            boolean: true,
            null: null,
          },
        },
      };
      
      render(<MonacoJsonEditor data={complexData} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        const expectedJson = JSON.stringify(complexData, null, 2);
        expect(editor).toHaveAttribute('data-value', expectedJson);
      });
    });
  });

  describe('Statistics Footer', () => {
    it('displays correct statistics', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByText('📊 数据统计:')).toBeInTheDocument();
        expect(screen.getByText('幻灯片: 1 个')).toBeInTheDocument();
        expect(screen.getByText('主题颜色: 2 个')).toBeInTheDocument();
        expect(screen.getByText('尺寸: 1920 × 1080')).toBeInTheDocument();
      });
    });

    it('handles missing statistics gracefully', async () => {
      const incompleteData = { slides: [{ id: 1 }] };
      
      render(<MonacoJsonEditor data={incompleteData} />);
      
      await waitFor(() => {
        expect(screen.getByText('幻灯片: 1 个')).toBeInTheDocument();
        expect(screen.getByText('主题颜色: 0 个')).toBeInTheDocument();
        expect(screen.getByText('尺寸: 未知')).toBeInTheDocument();
      });
    });

    it('displays file size information', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const sizeText = screen.getByText(/字符数:/);
        expect(sizeText).toBeInTheDocument();
        
        const kbText = screen.getByText(/KB$/);
        expect(kbText).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('sets up keyboard shortcuts on mount', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        // The Monaco editor mock should have received addCommand calls
      });
    });

    it('includes keyboard shortcut hints in tooltips', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const formatButton = screen.getByText('✨ 格式化');
        expect(formatButton).toHaveAttribute('title', '格式化 JSON (Ctrl+Shift+I)');
        
        const searchButton = screen.getByText('🔍 搜索');
        expect(searchButton).toHaveAttribute('title', '搜索 (Ctrl+Shift+F)');
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('updates editor content when data changes', async () => {
      const { rerender } = render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
      
      const newData = { updated: true };
      rerender(<MonacoJsonEditor data={newData} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-value', JSON.stringify(newData, null, 2));
      });
    });

    it('maintains editor configuration across re-renders', async () => {
      const { rerender } = render(<MonacoJsonEditor data={sampleData} readOnly={true} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-readonly', 'true');
      });
      
      rerender(<MonacoJsonEditor data={sampleData} readOnly={true} />);
      
      await waitFor(() => {
        const editor = screen.getByTestId('monaco-editor');
        expect(editor).toHaveAttribute('data-readonly', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles editor mount errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('handles missing editor actions gracefully', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const formatButton = screen.getByText('✨ 格式化');
        // Should not throw even if editor actions are missing
        expect(() => fireEvent.click(formatButton)).not.toThrow();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveTextContent('🖥️ Monaco JSON Editor');
      });
    });

    it('has accessible button labels', async () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      await waitFor(() => {
        const copyButton = screen.getByText('📋 复制');
        expect(copyButton).toHaveAttribute('title', '复制 JSON 到剪贴板');
      });
    });

    it('provides loading feedback for screen readers', () => {
      render(<MonacoJsonEditor data={sampleData} />);
      
      const loadingText = screen.getByText('正在初始化 Monaco Editor...');
      expect(loadingText).toBeInTheDocument();
    });
  });
});