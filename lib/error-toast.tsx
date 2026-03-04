/**
 * Error Toast Utilities for Toko 360 Staff Portal
 * Integrates error handling with toast notifications
 * Requirements: 25.1, 25.2, 25.6
 */

import { toast } from '@/hooks/use-toast';
import { DatabaseError } from './error-handler';

/**
 * Display an error toast notification
 * Requirement 25.1, 25.2
 */
export function showErrorToast(
  error: DatabaseError,
  options?: {
    onRetry?: () => void;
    retryLabel?: string;
  }
) {
  const { onRetry, retryLabel = 'Retry' } = options || {};

  toast({
    variant: 'destructive',
    title: 'Error',
    description: error.message,
    action: error.retryable && onRetry ? (
      <button
        onClick={onRetry}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {retryLabel}
      </button>
    ) : undefined,
  });
}

/**
 * Display a success toast notification
 */
export function showSuccessToast(message: string) {
  toast({
    title: 'Success',
    description: message,
  });
}

/**
 * Display a connection error toast
 * Requirement 25.1
 */
export function showConnectionErrorToast(onRetry?: () => void) {
  toast({
    variant: 'destructive',
    title: 'Connection Error',
    description: 'Unable to connect to database. Please try again.',
    action: onRetry ? (
      <button
        onClick={onRetry}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Retry
      </button>
    ) : undefined,
  });
}

/**
 * Display a timeout error toast
 * Requirement 25.2
 */
export function showTimeoutErrorToast(onRetry?: () => void) {
  toast({
    variant: 'destructive',
    title: 'Request Timeout',
    description: 'Request timed out. Please check your connection.',
    action: onRetry ? (
      <button
        onClick={onRetry}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Retry
      </button>
    ) : undefined,
  });
}
