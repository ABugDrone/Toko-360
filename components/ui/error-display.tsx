'use client';

/**
 * Error Display Component
 * Displays error messages in a consistent, user-friendly format
 * Requirements: 25.1, 25.2, 25.6
 */

import React from 'react';
import { AlertCircle, AlertTriangle, XCircle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { RetryButton } from './retry-button';
import { DatabaseError } from '@/lib/error-handler';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: DatabaseError | Error | string;
  title?: string;
  onRetry?: () => Promise<void> | void;
  className?: string;
  variant?: 'default' | 'destructive';
  showIcon?: boolean;
}

/**
 * Error Display Component
 * Shows error messages with optional retry button
 */
export function ErrorDisplay({
  error,
  title = 'Error',
  onRetry,
  className,
  variant = 'destructive',
  showIcon = true,
}: ErrorDisplayProps) {
  // Extract error message and metadata
  const errorMessage = typeof error === 'string' 
    ? error 
    : 'message' in error 
      ? error.message 
      : 'An unexpected error occurred';

  const isRetryable = typeof error === 'object' && 'retryable' in error 
    ? error.retryable 
    : false;

  // Determine icon based on error type
  const getIcon = () => {
    if (typeof error === 'object' && 'code' in error) {
      const code = error.code;
      if (code === 'PGRST116' || code === 'ECONNREFUSED' || code === 'NETWORK_ERROR') {
        return WifiOff;
      }
      if (code === '23505' || code === '23503') {
        return AlertCircle;
      }
    }
    return XCircle;
  };

  const Icon = getIcon();

  return (
    <Alert variant={variant} className={cn('', className)}>
      {showIcon && <Icon className="h-4 w-4" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{errorMessage}</p>
        {isRetryable && onRetry && (
          <div className="flex items-center gap-2">
            <RetryButton
              onRetry={onRetry}
              variant="outline"
              size="sm"
            />
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline Error Message Component
 * Displays a compact error message inline with content
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => Promise<void> | void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-primary hover:underline font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Connection Error Display
 * Specialized component for connection errors
 */
export function ConnectionError({
  onRetry,
  className,
}: {
  onRetry?: () => Promise<void> | void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={{
        message: 'Unable to connect to database. Please check your connection and try again.',
        code: 'CONNECTION_ERROR',
        retryable: true,
      } as DatabaseError}
      title="Connection Error"
      onRetry={onRetry}
      className={className}
    />
  );
}

/**
 * Empty State with Error
 * Shows an empty state with error message
 */
export function EmptyStateError({
  title = 'Unable to load data',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => Promise<void> | void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <RetryButton onRetry={onRetry} variant="outline" />
      )}
    </div>
  );
}
