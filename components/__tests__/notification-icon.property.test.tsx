import { render } from '@testing-library/react';
import { NotificationIcon } from '../notification-icon';
import { Bell } from 'lucide-react';
import fc from 'fast-check';

/**
 * Property-Based Tests for NotificationIcon Component
 * 
 * Feature: realtime-notification-icons, Property 1: Badge Count Hidden When Zero
 * 
 * **Validates: Requirements 2.4, 3.4, 5.5, 6.5, 7.5**
 * 
 * These tests verify that badge visibility behavior holds across all possible inputs.
 */

describe('NotificationIcon Property-Based Tests', () => {
  const defaultProps = {
    icon: Bell,
    label: 'Test notifications',
    href: '/test',
  };

  /**
   * Property 1: Badge Count Hidden When Zero
   * 
   * For any notification icon, when the badge count is zero, 
   * the badge indicator should not be visible in the rendered output.
   */
  it('should hide badge when count is zero', () => {
    fc.assert(
      fc.property(
        fc.constant(0),
        fc.string({ minLength: 1, maxLength: 50 }), // label
        fc.constantFrom('/test', '/admin', '/messages', '/events', '/reports'), // href
        (count, label, href) => {
          const { container } = render(
            <NotificationIcon 
              {...defaultProps} 
              count={count}
              label={label}
              href={href}
            />
          );
          
          // Badge should not be rendered when count is 0
          const badge = container.querySelector('span[aria-hidden="true"]');
          expect(badge).not.toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 (Inverse): Badge Visible When Count Greater Than Zero
   * 
   * For any notification icon, when the badge count is greater than zero,
   * the badge indicator should be visible in the rendered output.
   */
  it('should show badge when count is greater than zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999 }), // count > 0
        fc.string({ minLength: 1, maxLength: 50 }), // label
        fc.constantFrom('/test', '/admin', '/messages', '/events', '/reports'), // href
        (count, label, href) => {
          const { container } = render(
            <NotificationIcon 
              {...defaultProps} 
              count={count}
              label={label}
              href={href}
            />
          );
          
          // Badge should be rendered when count > 0
          const badge = container.querySelector('span[aria-hidden="true"]');
          expect(badge).toBeInTheDocument();
          
          // Badge should display the count (or 99+ for counts > 99)
          const expectedText = count > 99 ? '99+' : count.toString();
          expect(badge).toHaveTextContent(expectedText);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 (Edge Cases): Badge Visibility Across All Count Values
   * 
   * Verifies badge visibility behavior across the full range of possible count values,
   * including zero, positive integers, and edge cases like very large numbers.
   */
  it('should correctly handle badge visibility for any count value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // Full range of counts
        fc.string({ minLength: 1, maxLength: 50 }), // label
        (count, label) => {
          const { container } = render(
            <NotificationIcon 
              {...defaultProps} 
              count={count}
              label={label}
            />
          );
          
          const badge = container.querySelector('span[aria-hidden="true"]');
          
          if (count === 0) {
            // Badge should NOT be visible when count is 0
            expect(badge).not.toBeInTheDocument();
          } else {
            // Badge SHOULD be visible when count > 0
            expect(badge).toBeInTheDocument();
            
            // Verify correct display text
            const expectedText = count > 99 ? '99+' : count.toString();
            expect(badge).toHaveTextContent(expectedText);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
