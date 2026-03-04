# Error UI Components

This document describes the error handling UI components for the Toko 360 Staff Portal.

## Overview

The error UI components provide a consistent, user-friendly way to display errors, handle retries, and show connection status throughout the application. These components integrate with the error handling utilities in `lib/error-handler.ts` and `lib/error-toast.ts`.

**Requirements Addressed:**
- 25.1: Connection error handling with user-friendly messages
- 25.2: Timeout error handling with retry functionality
- 25.6: Retry button for failed operations

## Components

### 1. ErrorBoundary

A React Error Boundary component that catches JavaScript errors in child components.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ui/error-components';

<ErrorBoundary
  showDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    // Optional: Send to error tracking service
    console.error('Caught by boundary:', error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `children`: React components to wrap
- `fallback?`: Custom fallback UI to display on error
- `onError?`: Callback function when error is caught
- `showDetails?`: Whether to show error details (recommended for development only)

**Features:**
- Catches component-level errors
- Displays user-friendly error message
- Provides "Try Again" and "Reload Page" buttons
- Shows error details in development mode
- Logs errors to console (Requirement 25.5)

### 2. ErrorDisplay

Displays error messages in a consistent format with optional retry button.

**Usage:**
```tsx
import { ErrorDisplay } from '@/components/ui/error-components';
import { mapDatabaseError } from '@/lib/error-handler';

const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    await loadData();
  } catch (err) {
    setError(mapDatabaseError(err));
  }
};

{error && (
  <ErrorDisplay
    error={error}
    title="Failed to load data"
    onRetry={fetchData}
  />
)}
```

**Props:**
- `error`: DatabaseError, Error, or string message
- `title?`: Error title (default: "Error")
- `onRetry?`: Function to call when retry button is clicked
- `className?`: Additional CSS classes
- `variant?`: 'default' or 'destructive'
- `showIcon?`: Whether to show error icon

**Variants:**
- `InlineError`: Compact inline error message
- `ConnectionError`: Specialized for connection errors
- `EmptyStateError`: Empty state with error message

### 3. RetryButton

A button component that handles retry logic with loading state.

**Usage:**
```tsx
import { RetryButton } from '@/components/ui/error-components';

<RetryButton
  onRetry={async () => {
    await retryOperation();
  }}
  variant="outline"
  size="lg"
/>
```

**Props:**
- `onRetry`: Async function to execute on retry
- `retryLabel?`: Button text (default: "Retry")
- `loadingLabel?`: Text while retrying (default: "Retrying...")
- `showIcon?`: Whether to show refresh icon
- All standard Button props

**Features:**
- Automatic loading state management
- Spinning icon during retry
- Disabled state while retrying
- Supports async operations

**Variant:**
- `RetryLink`: Text link version for inline use

### 4. ConnectionStatus

Displays real-time connection status indicator.

**Usage:**
```tsx
import { ConnectionStatus, useConnectionStatus } from '@/components/ui/error-components';

// Simple usage with browser online status
<ConnectionStatus showLabel={true} />

// Advanced usage with custom status
const { status, setOnline, setOffline, setReconnecting } = useConnectionStatus();

<ConnectionStatus status={status} />
```

**Props:**
- `status?`: 'online', 'offline', or 'reconnecting'
- `className?`: Additional CSS classes
- `showLabel?`: Whether to show status label (default: true)

**Features:**
- Monitors browser online/offline events
- Color-coded status badges (green/red/yellow)
- Animated reconnecting indicator
- Can be controlled externally via hook

**Hook: useConnectionStatus()**
```tsx
const {
  status,        // Current connection status
  lastError,     // Last error that caused offline status
  setOnline,     // Set status to online
  setOffline,    // Set status to offline (with optional error)
  setReconnecting // Set status to reconnecting
} = useConnectionStatus();
```

## Error Toast Notifications

The `lib/error-toast.ts` module provides toast notification helpers.

**Usage:**
```tsx
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { mapDatabaseError } from '@/lib/error-handler';

try {
  await performOperation();
  showSuccessToast('Operation completed successfully');
} catch (err) {
  const dbError = mapDatabaseError(err);
  showErrorToast(dbError, {
    onRetry: performOperation,
    retryLabel: 'Try Again'
  });
}
```

**Functions:**
- `showErrorToast(error, options?)`: Display error toast with optional retry
- `showSuccessToast(message)`: Display success toast
- `showConnectionErrorToast(onRetry?)`: Display connection error toast
- `showTimeoutErrorToast(onRetry?)`: Display timeout error toast

## Integration Examples

### Example 1: Data Fetching with Error Handling

```tsx
import { useState } from 'react';
import { ErrorDisplay } from '@/components/ui/error-components';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast } from '@/lib/error-toast';

function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadData();
      setData(result);
    } catch (err) {
      const dbError = mapDatabaseError(err);
      setError(dbError);
      showErrorToast(dbError, { onRetry: fetchData });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }

  return <div>{/* Render data */}</div>;
}
```

### Example 2: Form Submission with Inline Error

```tsx
import { InlineError } from '@/components/ui/error-components';

function FormComponent() {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitForm();
      setError(null);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <InlineError message={error} onRetry={handleSubmit} />}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Example 3: Page with Error Boundary

```tsx
import { ErrorBoundary } from '@/components/ui/error-components';

export default function Page() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <PageContent />
    </ErrorBoundary>
  );
}
```

### Example 4: Connection Status in Header

```tsx
import { ConnectionStatus, useConnectionStatus } from '@/components/ui/error-components';

function Header() {
  const { status, setOffline, setOnline } = useConnectionStatus();

  // Monitor database connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch('/api/health');
        setOnline();
      } catch (error) {
        setOffline(error);
      }
    };

    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header>
      <ConnectionStatus status={status} />
    </header>
  );
}
```

## Best Practices

1. **Always map database errors** using `mapDatabaseError()` before displaying to users
2. **Use ErrorBoundary** at page or section level to catch unexpected errors
3. **Provide retry functionality** for retryable errors (connection, timeout)
4. **Show loading states** during retry operations
5. **Log errors** to console for debugging (handled automatically)
6. **Use appropriate error variants** based on context (inline, alert, empty state)
7. **Display connection status** in critical areas (header, data-heavy pages)
8. **Test error scenarios** to ensure good UX

## Styling

All components use Tailwind CSS and follow the application's design system:
- Error states use `destructive` variant (red)
- Success states use green colors
- Connection status uses color-coded badges
- Components are responsive and accessible

## Accessibility

- Error messages are announced to screen readers
- Retry buttons have proper focus states
- Color is not the only indicator (icons + text)
- Keyboard navigation is fully supported

## Files

- `components/ui/error-boundary.tsx` - Error boundary component
- `components/ui/error-display.tsx` - Error display components
- `components/ui/retry-button.tsx` - Retry button components
- `components/ui/connection-status.tsx` - Connection status indicator
- `components/ui/error-components.tsx` - Barrel export
- `components/ui/error-components.example.tsx` - Usage examples
- `lib/error-toast.ts` - Toast notification helpers
- `lib/error-handler.ts` - Error handling utilities

## Requirements Mapping

- **Requirement 25.1**: Connection error handling ✓
  - `ConnectionError` component
  - `showConnectionErrorToast()` function
  - Connection status indicator

- **Requirement 25.2**: Timeout error handling ✓
  - `showTimeoutErrorToast()` function
  - Automatic retry for timeout errors

- **Requirement 25.6**: Retry button for failed operations ✓
  - `RetryButton` component
  - `RetryLink` component
  - Retry functionality in all error displays

- **Additional**: Error boundaries for component-level errors ✓
  - `ErrorBoundary` component
  - `withErrorBoundary` HOC
