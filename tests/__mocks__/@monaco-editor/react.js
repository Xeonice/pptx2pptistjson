// Mock for @monaco-editor/react
import React from 'react';

const MockEditor = React.forwardRef(({ value, onMount, loading, ...props }, ref) => {
  React.useEffect(() => {
    if (onMount) {
      const mockEditor = {
        dispose: jest.fn(),
        getValue: jest.fn(() => value || '{}'),
        setValue: jest.fn(),
        getModel: jest.fn(() => ({
          dispose: jest.fn()
        })),
        onDidChangeModelContent: jest.fn(),
        layout: jest.fn(),
        focus: jest.fn(),
        addCommand: jest.fn(),
        getAction: jest.fn(() => ({
          run: jest.fn()
        })),
        getContentHeight: jest.fn(() => 200),
        setSelection: jest.fn(),
        revealLine: jest.fn(),
        trigger: jest.fn()
      };
      
      // Call onMount with mock editor
      setTimeout(() => onMount(mockEditor), 0);
    }
  }, [onMount, value]);

  return React.createElement('div', {
    'data-testid': 'monaco-editor',
    'data-value': value,
    style: { height: props.height || '100%', width: '100%' }
  }, loading || 'Monaco Editor Mock');
});

MockEditor.displayName = 'MockEditor';

module.exports = MockEditor;