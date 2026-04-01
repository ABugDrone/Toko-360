/**
 * RecentIndicator Component
 * Displays "Recent" indicator for contacts with existing conversations
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.4
 */

import React from 'react';
import { Clock } from 'lucide-react';

export interface RecentIndicatorProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function RecentIndicator({ size = 'sm', className = '' }: RecentIndicatorProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm'
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1
        text-blue-600/70
        ${className}
      `}
      aria-label="Has existing conversation"
      role="img"
      data-testid="recent-indicator"
    >
      <Clock className={sizeClasses[size].icon} />
      <span className={`font-medium ${sizeClasses[size].text}`}>
        Recent
      </span>
    </div>
  );
}
