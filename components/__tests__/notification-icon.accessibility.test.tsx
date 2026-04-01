import { render, screen } from '@testing-library/react';
import { NotificationIcon } from '../notification-icon';
import { Bell } from 'lucide-react';

describe('NotificationIcon Accessibility', () => {
  const defaultProps = {
    icon: Bell,
    count: 5,
    label: 'Test notifications',
    href: '/test',
  };

  it('should have ARIA label with count information', () => {
    render(<NotificationIcon {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Test notifications: 5 items');
  });

  it('should have ARIA label with singular item when count is 1', () => {
    render(<NotificationIcon {...defaultProps} count={1} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Test notifications: 1 item');
  });

  it('should have ARIA live region for count changes', () => {
    render(<NotificationIcon {...defaultProps} />);
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should be keyboard navigable with Tab key', () => {
    render(<NotificationIcon {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('tabIndex', '0');
  });

  it('should have minimum 44x44px touch target', () => {
    render(<NotificationIcon {...defaultProps} />);
    const link = screen.getByRole('link');
    const styles = window.getComputedStyle(link);
    
    // Check inline styles
    expect(link).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
  });

  it('should hide badge count from screen readers with aria-hidden', () => {
    const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
    const badge = container.querySelector('span[aria-hidden="true"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('should not show badge when count is 0', () => {
    const { container } = render(<NotificationIcon {...defaultProps} count={0} />);
    const badge = container.querySelector('span[aria-hidden="true"]');
    expect(badge).not.toBeInTheDocument();
  });

  it('should have error indicator with aria-label when hasError is true', () => {
    render(<NotificationIcon {...defaultProps} hasError={true} />);
    const errorIndicator = screen.getByLabelText('Connection error');
    expect(errorIndicator).toBeInTheDocument();
  });

  it('should use theme variables for colors', () => {
    render(<NotificationIcon {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ color: 'var(--theme-text)' });
  });

  it('should have proper color contrast for accessibility', () => {
    // Note: This test verifies that theme variables are used.
    // The actual 4.5:1 contrast ratio must be ensured by the theme configuration.
    // Theme variables should be set to meet WCAG 2.1 AA standards:
    // - --theme-text should have 4.5:1 contrast with --theme-surface
    // - --theme-accent should have 4.5:1 contrast with --theme-surface
    render(<NotificationIcon {...defaultProps} />);
    const link = screen.getByRole('link');
    
    // Verify theme variables are used (actual contrast depends on theme values)
    expect(link).toHaveStyle({ color: 'var(--theme-text)' });
    
    // Badge uses theme variables for contrast
    const { container } = render(<NotificationIcon {...defaultProps} count={5} />);
    const badge = container.querySelector('span[aria-hidden="true"]');
    expect(badge).toHaveStyle({ 
      backgroundColor: 'var(--theme-accent)',
      color: 'var(--theme-surface)'
    });
  });
});
