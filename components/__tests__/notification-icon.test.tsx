import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationIcon } from '../notification-icon';
import { Bell, MessageSquare } from 'lucide-react';
import { vi } from 'vitest';

/**
 * Unit Tests for NotificationIcon Component
 * 
 * Test Coverage:
 * - Badge display when count > 0
 * - Badge hidden when count = 0
 * - Navigation on click
 * - Error indicator display
 * - Keyboard navigation
 * - ARIA attributes
 */

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, onKeyDown, ...props }: any) => (
    <a href={href} onClick={onClick} onKeyDown={onKeyDown} {...props}>
      {children}
    </a>
  ),
}));

describe('NotificationIcon Unit Tests', () => {
  const defaultProps = {
    icon: Bell,
    count: 5,
    label: 'Test notifications',
    href: '/test',
  };

  describe('Badge Display', () => {
    it('should display badge when count > 0', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should hide badge when count = 0', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={0} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).not.toBeInTheDocument();
    });

    it('should display "99+" for counts greater than 99', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={150} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99+');
    });

    it('should display exact count for counts <= 99', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={99} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('99');
    });

    it('should display badge with correct styling', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toHaveStyle({
        backgroundColor: 'var(--theme-accent)',
        color: 'var(--theme-surface)',
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to href on click', () => {
      render(<NotificationIcon {...defaultProps} href="/messages" />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('href', '/messages');
    });

    it('should call onClick callback when provided', () => {
      const onClick = vi.fn();
      render(<NotificationIcon {...defaultProps} onClick={onClick} />);
      const link = screen.getByRole('link');
      
      fireEvent.click(link);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when onClick is not provided', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(() => fireEvent.click(link)).not.toThrow();
    });
  });

  describe('Error Indicator', () => {
    it('should display error indicator when hasError is true', () => {
      render(<NotificationIcon {...defaultProps} hasError={true} />);
      const errorIndicator = screen.getByLabelText('Connection error');
      
      expect(errorIndicator).toBeInTheDocument();
      expect(errorIndicator).toHaveAttribute('title', 'Connection error - counts may be outdated');
    });

    it('should not display error indicator when hasError is false', () => {
      render(<NotificationIcon {...defaultProps} hasError={false} />);
      const errorIndicator = screen.queryByLabelText('Connection error');
      
      expect(errorIndicator).not.toBeInTheDocument();
    });

    it('should not display error indicator by default', () => {
      render(<NotificationIcon {...defaultProps} />);
      const errorIndicator = screen.queryByLabelText('Connection error');
      
      expect(errorIndicator).not.toBeInTheDocument();
    });

    it('should display error indicator with correct styling', () => {
      render(<NotificationIcon {...defaultProps} hasError={true} />);
      const errorIndicator = screen.getByLabelText('Connection error');
      
      expect(errorIndicator).toHaveStyle({
        backgroundColor: 'var(--theme-error, #ef4444)',
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable with Tab key', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('tabIndex', '0');
    });

    it('should trigger onClick on Enter key press', () => {
      const onClick = vi.fn();
      render(<NotificationIcon {...defaultProps} onClick={onClick} />);
      const link = screen.getByRole('link');
      
      fireEvent.keyDown(link, { key: 'Enter' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick on Space key press', () => {
      const onClick = vi.fn();
      render(<NotificationIcon {...defaultProps} onClick={onClick} />);
      const link = screen.getByRole('link');
      
      fireEvent.keyDown(link, { key: ' ' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger onClick on other key presses', () => {
      const onClick = vi.fn();
      render(<NotificationIcon {...defaultProps} onClick={onClick} />);
      const link = screen.getByRole('link');
      
      fireEvent.keyDown(link, { key: 'Tab' });
      fireEvent.keyDown(link, { key: 'Escape' });
      fireEvent.keyDown(link, { key: 'a' });
      
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should prevent default behavior on Enter key', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      link.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent default behavior on Space key', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      link.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct ARIA label with count', () => {
      render(<NotificationIcon {...defaultProps} count={5} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('aria-label', 'Test notifications: 5 items');
    });

    it('should have singular "item" in ARIA label when count is 1', () => {
      render(<NotificationIcon {...defaultProps} count={1} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('aria-label', 'Test notifications: 1 item');
    });

    it('should have plural "items" in ARIA label when count is 0', () => {
      render(<NotificationIcon {...defaultProps} count={0} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('aria-label', 'Test notifications: 0 items');
    });

    it('should have ARIA live region for count changes', () => {
      render(<NotificationIcon {...defaultProps} />);
      const liveRegion = screen.getByRole('status');
      
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should update ARIA live region when count changes', () => {
      const { rerender } = render(<NotificationIcon {...defaultProps} count={5} />);
      const liveRegion = screen.getByRole('status');
      
      // Initial render - live region should be empty (no change yet)
      expect(liveRegion).toHaveTextContent('');
      
      // Update count
      rerender(<NotificationIcon {...defaultProps} count={10} />);
      
      // Live region should update with new count
      expect(liveRegion).toHaveTextContent('10 new Test notifications');
    });

    it('should announce "No new" when count becomes 0', () => {
      const { rerender } = render(<NotificationIcon {...defaultProps} count={5} />);
      const liveRegion = screen.getByRole('status');
      
      // Update count to 0
      rerender(<NotificationIcon {...defaultProps} count={0} />);
      
      // Live region should announce no new items
      expect(liveRegion).toHaveTextContent('No new Test notifications');
    });

    it('should hide badge from screen readers with aria-hidden', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Icon Rendering', () => {
    it('should render the provided icon component', () => {
      const { container } = render(<NotificationIcon {...defaultProps} icon={Bell} />);
      const icon = container.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
    });

    it('should render different icon components', () => {
      const { container } = render(<NotificationIcon {...defaultProps} icon={MessageSquare} />);
      const icon = container.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct icon styling', () => {
      const { container } = render(<NotificationIcon {...defaultProps} />);
      const icon = container.querySelector('svg');
      
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  describe('Styling and Theme', () => {
    it('should use theme variables for colors', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveStyle({ color: 'var(--theme-text)' });
    });

    it('should have minimum touch target size', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });

    it('should apply custom className when provided', () => {
      render(<NotificationIcon {...defaultProps} className="custom-class" />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('custom-class');
    });

    it('should have smooth transitions', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveStyle({
        transition: 'color 300ms ease, background-color 300ms ease, opacity 300ms ease, transform 300ms ease',
      });
    });

    it('should have hover scale effect class', () => {
      render(<NotificationIcon {...defaultProps} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveClass('hover:scale-105');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={999999} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      expect(badge).toHaveTextContent('99+');
    });

    it('should handle negative counts gracefully', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={-5} />);
      const badge = container.querySelector('span[aria-hidden="true"]');
      
      // Negative counts should not show badge (count <= 0)
      expect(badge).not.toBeInTheDocument();
    });

    it('should handle empty label', () => {
      render(<NotificationIcon {...defaultProps} label="" />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('aria-label', ': 5 items');
    });

    it('should handle long labels', () => {
      const longLabel = 'This is a very long notification label that should still work correctly';
      render(<NotificationIcon {...defaultProps} label={longLabel} />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('aria-label', `${longLabel}: 5 items`);
    });

    it('should handle special characters in href', () => {
      render(<NotificationIcon {...defaultProps} href="/test?param=value&other=123" />);
      const link = screen.getByRole('link');
      
      expect(link).toHaveAttribute('href', '/test?param=value&other=123');
    });
  });

  describe('Component Lifecycle', () => {
    it('should not update live region on initial render', () => {
      const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
      const liveRegion = screen.getByRole('status');
      
      // On initial render, the live region should be empty (no change yet)
      expect(liveRegion).toHaveTextContent('');
    });

    it('should only update live region when count changes', () => {
      const { rerender } = render(<NotificationIcon {...defaultProps} count={5} label="Messages" />);
      const liveRegion = screen.getByRole('status');
      
      // Initial render - live region should be empty
      expect(liveRegion).toHaveTextContent('');
      
      // Change label but not count - live region should still be empty
      rerender(<NotificationIcon {...defaultProps} count={5} label="Notifications" />);
      expect(liveRegion).toHaveTextContent('');
      
      // Change count - live region should update with new label
      rerender(<NotificationIcon {...defaultProps} count={6} label="Notifications" />);
      expect(liveRegion).toHaveTextContent('6 new Notifications');
    });

    it('should handle rapid count changes', () => {
      const { rerender } = render(<NotificationIcon {...defaultProps} count={1} />);
      const liveRegion = screen.getByRole('status');
      
      // Rapidly change count
      rerender(<NotificationIcon {...defaultProps} count={2} />);
      rerender(<NotificationIcon {...defaultProps} count={3} />);
      rerender(<NotificationIcon {...defaultProps} count={4} />);
      
      // Should show the latest count
      expect(liveRegion).toHaveTextContent('4 new Test notifications');
    });
  });
});
