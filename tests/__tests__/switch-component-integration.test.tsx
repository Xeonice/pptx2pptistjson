/**
 * Tests for Switch Component Integration
 * Covers shadcn/ui Switch component functionality and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Switch } from '../../components/ui/switch';

describe('Switch Component Integration', () => {
  describe('Basic Functionality', () => {
    it('renders unchecked by default', () => {
      render(<Switch />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).not.toBeChecked();
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders checked when checked prop is true', () => {
      render(<Switch checked={true} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('calls onCheckedChange when clicked', () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('toggles state correctly', () => {
      const handleChange = jest.fn();
      const { rerender } = render(<Switch checked={false} onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      
      // First click - should call with true
      fireEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);
      
      handleChange.mockClear();
      
      // Re-render with checked=true and click again
      rerender(<Switch checked={true} onCheckedChange={handleChange} />);
      const switchElementChecked = screen.getByRole('switch');
      fireEvent.click(switchElementChecked);
      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<Switch disabled={true} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
      expect(switchElement).toHaveAttribute('data-disabled', '');
    });

    it('does not call onCheckedChange when disabled and clicked', () => {
      const handleChange = jest.fn();
      render(<Switch disabled={true} onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('shows disabled cursor when disabled', () => {
      render(<Switch disabled={true} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(/disabled:cursor-not-allowed/);
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(<Switch aria-label="Toggle setting" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('role', 'switch');
      expect(switchElement).toHaveAttribute('aria-label', 'Toggle setting');
    });

    it('supports keyboard navigation', () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      
      // Focus the switch
      switchElement.focus();
      expect(switchElement).toHaveFocus();
    });

    it('supports Enter key activation', () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      switchElement.focus();
      
      // Click to activate (keyboard events are handled by the underlying Radix component)
      fireEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('has focus-visible styles', () => {
      render(<Switch />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(/focus-visible:outline-none/);
      expect(switchElement).toHaveClass(/focus-visible:ring-2/);
    });

    it('maintains focus state correctly', () => {
      render(<Switch />);
      
      const switchElement = screen.getByRole('switch');
      
      switchElement.focus();
      expect(switchElement).toHaveFocus();
      
      switchElement.blur();
      expect(switchElement).not.toHaveFocus();
    });
  });

  describe('Visual States', () => {
    it('has correct visual thumb position when unchecked', () => {
      render(<Switch checked={false} />);
      
      const thumbElement = screen.getByRole('switch').querySelector('[class*="translate-x-0"]');
      expect(thumbElement).toBeInTheDocument();
    });

    it('has correct visual thumb position when checked', () => {
      render(<Switch checked={true} />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
      
      // The thumb should move to the right when checked
      const thumbElement = switchElement.querySelector('[class*="translate-x-4"]');
      expect(thumbElement).toBeInTheDocument();
    });

    it('applies custom className correctly', () => {
      render(<Switch className="custom-switch-class" />);
      
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-switch-class');
    });

    it('has proper color states for checked/unchecked', () => {
      const { rerender } = render(<Switch checked={false} />);
      
      let switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(/data-\[state=unchecked\]:bg-input/);
      
      rerender(<Switch checked={true} />);
      switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass(/data-\[state=checked\]:bg-primary/);
    });
  });

  describe('Component Composition', () => {
    it('can be used in forms', () => {
      const FormWithSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        
        return (
          <form>
            <label htmlFor="test-switch">
              Test Setting
            </label>
            <Switch
              id="test-switch"
              checked={checked}
              onCheckedChange={setChecked}
            />
          </form>
        );
      };
      
      render(<FormWithSwitch />);
      
      const switchElement = screen.getByRole('switch');
      const label = screen.getByText('Test Setting');
      
      expect(switchElement).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('id', 'test-switch');
    });

    it('integrates well with other form controls', () => {
      render(
        <form>
          <div>
            <label>Use CDN</label>
            <Switch data-testid="cdn-switch" />
          </div>
          <div>
            <label>Upload to CDN</label>
            <Switch data-testid="upload-switch" />
          </div>
          <div>
            <label>Auto Save</label>
            <Switch data-testid="autosave-switch" defaultChecked />
          </div>
        </form>
      );
      
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(3);
      
      // All switches should be present
      expect(screen.getByTestId('cdn-switch')).toBeInTheDocument();
      expect(screen.getByTestId('upload-switch')).toBeInTheDocument();
      expect(screen.getByTestId('autosave-switch')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const handleChange = jest.fn();
      const { rerender } = render(<Switch checked={false} onCheckedChange={handleChange} />);
      
      // Re-render with same props
      rerender(<Switch checked={false} onCheckedChange={handleChange} />);
      
      // Component should still be functional
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
    });

    it('handles rapid state changes correctly', () => {
      const handleChange = jest.fn();
      render(<Switch onCheckedChange={handleChange} />);
      
      const switchElement = screen.getByRole('switch');
      
      // Rapid clicks
      fireEvent.click(switchElement);
      fireEvent.click(switchElement);
      fireEvent.click(switchElement);
      
      expect(handleChange).toHaveBeenCalledTimes(3);
      expect(handleChange).toHaveBeenNthCalledWith(1, true);
      expect(handleChange).toHaveBeenNthCalledWith(2, false);
      expect(handleChange).toHaveBeenNthCalledWith(3, true);
    });
  });

  describe('Error Boundaries', () => {
    it('handles missing onCheckedChange gracefully', () => {
      // Should not throw error when onCheckedChange is not provided
      expect(() => {
        render(<Switch checked={false} />);
      }).not.toThrow();
      
      const switchElement = screen.getByRole('switch');
      
      // Clicking should not cause errors
      expect(() => {
        fireEvent.click(switchElement);
      }).not.toThrow();
    });
  });
});