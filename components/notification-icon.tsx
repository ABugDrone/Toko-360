'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * NotificationIcon Component
 * 
 * A fully accessible notification icon with badge count display.
 * 
 * Accessibility Features:
 * - ARIA labels with count information for screen readers
 * - ARIA live region that announces count changes
 * - Keyboard navigable with Tab key (tabIndex={0})
 * - Activatable with Enter or Space key
 * - Minimum 44x44px touch target for mobile accessibility
 * - Uses theme CSS variables that must maintain 4.5:1 contrast ratio (WCAG 2.1 AA)
 * 
 * Color Contrast Requirements:
 * - --theme-text must have 4.5:1 contrast with --theme-surface
 * - --theme-accent must have 4.5:1 contrast with --theme-surface
 * - These ratios must be maintained in both light and dark themes
 */
interface NotificationIconProps {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  label: string;
  href: string;
  onClick?: () => void;
  hasError?: boolean;
  className?: string;
}

export function NotificationIcon({
  icon: Icon,
  count,
  label,
  href,
  onClick,
  hasError = false,
  className = '',
}: NotificationIconProps) {
  const previousCountRef = useRef(count);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Update ARIA live region when count changes
  useEffect(() => {
    if (count !== previousCountRef.current && liveRegionRef.current) {
      const message = count > 0 
        ? `${count} new ${label}` 
        : `No new ${label}`;
      liveRegionRef.current.textContent = message;
      previousCountRef.current = count;
    }
  }, [count, label]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center justify-center rounded-lg hover:scale-105 ${className}`}
        style={{ 
          color: 'var(--theme-text)', 
          opacity: 0.7,
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          transition: 'color 300ms ease, background-color 300ms ease, opacity 300ms ease, transform 300ms ease',
        }}
        aria-label={`${label}: ${count} ${count === 1 ? 'item' : 'items'}`}
        tabIndex={0}
      >
        <Icon className="w-5 h-5" />
        
        {/* Badge overlay when count > 0 */}
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-xs font-semibold rounded-full"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--theme-surface)',
              transition: 'background-color 300ms ease, color 300ms ease',
            }}
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
        
        {/* Error indicator */}
        {hasError && (
          <span
            className="absolute top-0 right-0 w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: 'var(--theme-error, #ef4444)',
              transition: 'background-color 300ms ease',
            }}
            aria-label="Connection error"
            title="Connection error - counts may be outdated"
          />
        )}
      </Link>
      
      {/* ARIA live region for count changes */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
