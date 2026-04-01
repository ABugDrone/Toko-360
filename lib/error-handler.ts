/**
 * Error Handling Utilities for Toko 360 Staff Portal
 * Requirements: 25.1, 25.2, 25.3, 25.4, 25.5
 */

// ============================================================================
// Error Types and Interfaces
// ============================================================================

export interface DatabaseError {
  message: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

// ============================================================================
// Error Code Mapping
// Requirements: 25.1, 25.2, 25.3, 25.4
// ============================================================================

/**
 * Maps database error codes to user-friendly messages
 * Requirement 25.1, 25.2, 25.3, 25.4
 */
export function mapDatabaseError(error: any): DatabaseError {
  // Log error for debugging (Requirement 25.5)
  console.error('[Database Error]', {
    code: error?.code,
    message: error?.message,
    details: error,
    timestamp: new Date().toISOString()
  });

  // Handle specific PostgreSQL error codes
  switch (error?.code) {
    // Connection errors (Requirement 25.1)
    case 'PGRST116':
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
      return {
        message: 'Unable to connect to database. Please try again.',
        code: error.code,
        details: error,
        retryable: true
      };

    // Timeout errors (Requirement 25.2)
    case 'PGRST301':
    case 'TIMEOUT':
      return {
        message: 'Request timed out. Please check your connection.',
        code: error.code,
        details: error,
        retryable: true
      };

    // Unique constraint violation (Requirement 25.3)
    case '23505':
      return {
        message: 'This record already exists.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Foreign key constraint violation (Requirement 25.4)
    case '23503':
      return {
        message: 'Referenced record not found.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Not null constraint violation
    case '23502':
      return {
        message: 'Required field is missing.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Check constraint violation
    case '23514':
      return {
        message: 'Invalid data provided.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Authentication errors
    case '28P01':
      return {
        message: 'Authentication failed. Please check your credentials.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Permission errors
    case '42501':
      return {
        message: 'You do not have permission to perform this action.',
        code: error.code,
        details: error,
        retryable: false
      };

    // Network errors
    case 'NETWORK_ERROR':
    case 'ERR_NETWORK':
      return {
        message: 'Network error. Please check your internet connection.',
        code: error.code,
        details: error,
        retryable: true
      };

    // Default error
    default:
      return {
        message: error?.message || 'An unexpected error occurred. Please try again.',
        code: error?.code || 'UNKNOWN_ERROR',
        details: error,
        retryable: true
      };
  }
}

// ============================================================================
// Retry Logic
// Requirement 25.6
// ============================================================================

/**
 * Retries a database operation with exponential backoff
 * Requirement 25.6
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  } = options;

  let lastError: any;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const dbError = mapDatabaseError(error);
      
      // Don't retry if error is not retryable
      if (!dbError.retryable) {
        console.log('[Retry] Error is not retryable, aborting');
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxAttempts) {
        console.log('[Retry] Max attempts reached, aborting');
        throw error;
      }

      // Wait before retrying with exponential backoff
      console.log(`[Retry] Waiting ${currentDelay}ms before retry`);
      await sleep(currentDelay);
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Error Logging
// Requirement 25.5
// ============================================================================

/**
 * Logs errors to console with structured format
 * Requirement 25.5
 */
export function logError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
): void {
  const errorLog = {
    context,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    },
    ...additionalInfo
  };

  console.error(`[Error: ${context}]`, errorLog);
}

/**
 * Logs successful operations for debugging
 */
export function logSuccess(
  context: string,
  message: string,
  additionalInfo?: Record<string, any>
): void {
  const successLog = {
    context,
    timestamp: new Date().toISOString(),
    message,
    ...additionalInfo
  };

  console.log(`[Success: ${context}]`, successLog);
}

// ============================================================================
// Error Handler Wrapper
// ============================================================================

/**
 * Wraps an async operation with error handling and optional retry logic
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  options?: {
    retry?: boolean;
    retryOptions?: RetryOptions;
    onError?: (error: DatabaseError) => void;
  }
): Promise<T> {
  try {
    const result = options?.retry
      ? await retryOperation(operation, options.retryOptions)
      : await operation();

    logSuccess(context, 'Operation completed successfully');
    return result;
  } catch (error: any) {
    const dbError = mapDatabaseError(error);
    logError(context, error);

    if (options?.onError) {
      options.onError(dbError);
    }

    throw dbError;
  }
}

// ============================================================================
// Specific Error Handlers
// ============================================================================

/**
 * Handles authentication errors specifically
 */
export function handleAuthError(error: any): DatabaseError {
  const dbError = mapDatabaseError(error);
  
  // Override message for authentication context
  if (error?.code === '28P01' || error?.message?.includes('Invalid')) {
    return {
      ...dbError,
      message: 'Invalid staff ID or password'
    };
  }

  return dbError;
}

/**
 * Handles duplicate record errors with context
 */
export function handleDuplicateError(error: any, recordType: string): DatabaseError {
  const dbError = mapDatabaseError(error);
  
  if (error?.code === '23505') {
    return {
      ...dbError,
      message: `This ${recordType} already exists.`
    };
  }

  return dbError;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const dbError = mapDatabaseError(error);
  return dbError.retryable ?? false;
}
