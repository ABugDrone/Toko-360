/**
 * UnreadBadge Component
 * Displays unread message count badge
 * Requirements: 2.1, 2.3, 2.4
 */

import React from 'react';

export interface UnreadBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export function UnreadBadge({ count, size = 'md' }: UnreadBadgeProps) {
  // Hide badge when count is zero (Requirement 2.4)
  if (count === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 min-w-[1rem] text-[10px] px-1',
    md: 'h-5 min-w-[1.25rem] text-xs px-1.5',
    lg: 'h-6 min-w-[1.5rem] text-sm px-2'
  };

  // Format count for display (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span
      className={`
        inline-flex items-center justify-center
        rounded-full
        bg-red-500 text-white
        font-semibold
        ${sizeClasses[size]}
      `}
      aria-label={`${count} unread message${count === 1 ? '' : 's'}`}
      role="status"
    >
      {displayCount}
    </span>
  );
}
