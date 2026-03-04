'use client';

/**
 * Retry Button Component
 * Provides a button for retrying failed operations
 * Requirements: 25.6
 */

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface RetryButtonProps extends Omit<ButtonProps, 'onClick'> {
  onRetry: () => Promise<void> | void;
  retryLabel?: string;
  loadingLabel?: string;
  showIcon?: boolean;
}

/**
 * Retry Button Component
 * Displays a button that handles retry logic with loading state
 */
export function RetryButton({
  onRetry,
  retryLabel = 'Retry',
  loadingLabel = 'Retrying...',
  showIcon = true,
  className,
  disabled,
  ...props
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={cn(className)}
      {...props}
    >
      {showIcon && (
        <RefreshCw
          className={cn(
            'h-4 w-4 mr-2',
            isRetrying && 'animate-spin'
          )}
        />
      )}
      {isRetrying ? loadingLabel : retryLabel}
    </Button>
  );
}

/**
 * Inline Retry Link Component
 * Provides a text link for retrying operations
 */
export function RetryLink({
  onRetry,
  retryLabel = 'Try again',
  className,
}: {
  onRetry: () => Promise<void> | void;
  retryLabel?: string;
  className?: string;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <RefreshCw
        className={cn(
          'h-3 w-3',
          isRetrying && 'animate-spin'
        )}
      />
      {retryLabel}
    </button>
  );
}
