/**
 * Error Components Usage Examples
 * This file demonstrates how to use the error UI components
 * Requirements: 25.1, 25.2, 25.6
 */

import React from 'react';
import {
  ErrorBoundary,
  ErrorDisplay,
  InlineError,
  ConnectionError,
  EmptyStateError,
  RetryButton,
  RetryLink,
  ConnectionStatus,
  useConnectionStatus,
} from './error-components';
import { showErrorToast, showConnectionErrorToast } from '@/lib/error-toast';
import { mapDatabaseError } from '@/lib/error-handler';

// ============================================================================
// Example 1: Using Error Boundary to catch component errors
// ============================================================================

function ExampleWithErrorBoundary() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Optional: Send to error tracking service
        console.error('Caught by boundary:', error, errorInfo);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}

// ============================================================================
// Example 2: Displaying database errors with retry
// ============================================================================

function ExampleDatabaseError() {
  const [error, setError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Your database operation
      const result = await fetch('/api/data');
      if (!result.ok) throw new Error('Failed to fetch');
    } catch (err) {
      const dbError = mapDatabaseError(err);
      setError(dbError);
      showErrorToast(dbError, { onRetry: fetchData });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        title="Failed to load data"
        onRetry={fetchData}
      />
    );
  }

  return <div>Your content here</div>;
}

// ============================================================================
// Example 3: Connection status indicator
// ============================================================================

function ExampleConnectionStatus() {
  const { status, setOffline, setOnline, setReconnecting } = useConnectionStatus();

  // Monitor database connection
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        setReconnecting();
        await fetch('/api/health');
        setOnline();
      } catch (error) {
        setOffline(error as Error);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [setOffline, setOnline, setReconnecting]);

  return (
    <div className="flex items-center gap-2">
      <ConnectionStatus status={status} />
      <span className="text-sm text-muted-foreground">
        Database Status
      </span>
    </div>
  );
}

// ============================================================================
// Example 4: Inline error with retry link
// ============================================================================

function ExampleInlineError() {
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      // Your operation
      await submitForm();
      setError(null);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        {error && (
          <InlineError
            message={error}
            onRetry={handleSubmit}
            className="mt-2"
          />
        )}
      </form>
    </div>
  );
}

// ============================================================================
// Example 5: Empty state with error
// ============================================================================

function ExampleEmptyStateError() {
  const [data, setData] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = async () => {
    try {
      const result = await fetchData();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Unable to load data. Please try again.');
    }
  };

  if (error) {
    return (
      <EmptyStateError
        title="Failed to load items"
        message={error}
        onRetry={loadData}
      />
    );
  }

  if (data.length === 0) {
    return <div>No items found</div>;
  }

  return <div>{/* Render data */}</div>;
}

// ============================================================================
// Example 6: Retry button in custom UI
// ============================================================================

function ExampleRetryButton() {
  const handleRetry = async () => {
    // Your retry logic
    await retryOperation();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground">Operation failed</p>
      <RetryButton
        onRetry={handleRetry}
        variant="outline"
        size="lg"
      />
      {/* Or use inline retry link */}
      <RetryLink onRetry={handleRetry} />
    </div>
  );
}

// ============================================================================
// Example 7: Connection error component
// ============================================================================

function ExampleConnectionError() {
  const [isConnected, setIsConnected] = React.useState(true);

  const reconnect = async () => {
    try {
      await checkConnection();
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
    }
  };

  if (!isConnected) {
    return <ConnectionError onRetry={reconnect} />;
  }

  return <div>Your content here</div>;
}

// ============================================================================
// Example 8: Using error toast notifications
// ============================================================================

function ExampleErrorToast() {
  const handleOperation = async () => {
    try {
      await performOperation();
    } catch (err) {
      const dbError = mapDatabaseError(err);
      
      // Show toast with retry option
      showErrorToast(dbError, {
        onRetry: handleOperation,
        retryLabel: 'Try Again',
      });
    }
  };

  return (
    <button onClick={handleOperation}>
      Perform Operation
    </button>
  );
}

// ============================================================================
// Example 9: Wrapping component with error boundary HOC
// ============================================================================

const SafeComponent = withErrorBoundary(YourComponent, {
  showDetails: true,
  onError: (error) => {
    console.error('Component error:', error);
  },
});

// ============================================================================
// Helper functions (placeholders for examples)
// ============================================================================

function YourComponent() {
  return <div>Your component content</div>;
}

async function submitForm() {
  // Placeholder
}

async function fetchData() {
  // Placeholder
  return [];
}

async function retryOperation() {
  // Placeholder
}

async function performOperation() {
  // Placeholder
}

async function checkConnection() {
  // Placeholder
}

export {
  ExampleWithErrorBoundary,
  ExampleDatabaseError,
  ExampleConnectionStatus,
  ExampleInlineError,
  ExampleEmptyStateError,
  ExampleRetryButton,
  ExampleConnectionError,
  ExampleErrorToast,
  SafeComponent,
};
