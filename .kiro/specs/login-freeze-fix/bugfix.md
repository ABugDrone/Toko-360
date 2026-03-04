# Bugfix Requirements Document

## Introduction

The application suffers from widespread React state management issues causing UI freezes, infinite re-render loops, and broken functionality across multiple pages. The root cause is improper useEffect dependency arrays that include callbacks changing on every render, triggering infinite update cycles. This manifests as:

1. Login navigation freeze after credential submission
2. "Maximum update depth exceeded" errors on reports, messaging, and other pages
3. Database error console spam from repeated failed operations
4. Messaging functionality completely broken
5. Navigation freezing when moving between pages

These issues create a severely degraded user experience where the application appears broken and unresponsive.

## Bug Analysis

### Root Cause: Improper useEffect Dependencies Causing Infinite Re-render Loops

The application has a systemic issue with useEffect hooks that include callback dependencies changing on every render. This creates infinite update cycles that manifest in multiple ways:

**1. Login Navigation Race Condition (app/page.tsx)**
- When `login()` succeeds, it calls `setUser(result.user!)` in auth-context
- React state updates are asynchronous - `isAuthenticated` doesn't update immediately
- `router.push('/dashboard')` executes before state propagates
- Protected layout's guard sees stale `!isAuthenticated` and redirects back to login

**2. Infinite Re-render Loops (hooks/use-realtime-approvals.ts, hooks/use-realtime-messages.ts)**
- useEffect dependencies include `handleAttendanceUpdate`, `handleReportUpdate`, `handleInsert`, `handleUpdate` callbacks
- These callbacks are defined with `useCallback` but their dependencies (`onAttendanceUpdate`, `onReportUpdate`, `onNewMessage`, `onMessageRead`) change on every render
- This causes useEffect to re-run infinitely, creating/destroying Supabase subscriptions repeatedly
- Results in "Maximum update depth exceeded" errors

**3. Reports Page Issues (app/(protected)/reports/page.tsx)**
- `loadReports` callback depends on `user?.staffId` and is used in useEffect
- `loadReports` is recreated on every render, causing useEffect to re-run infinitely
- Database errors are logged repeatedly as the function executes in a loop
- Form state updates trigger re-renders that restart the cycle

**4. Messaging Page Broken (app/(protected)/messaging/page.tsx)**
- Similar callback dependency issues with `handleNewMessage` and `handleMessageRead`
- `otherUserId` changes trigger infinite loops in message loading
- Real-time subscriptions are created/destroyed repeatedly
- Messages fail to load or display properly

### Current Behavior (Defect)

1.1 WHEN a user submits valid login credentials THEN the system freezes the UI without providing feedback

1.2 WHEN a user submits valid login credentials THEN the system does not automatically navigate to the dashboard due to race condition

1.3 WHEN a user navigates to reports, messaging, or other pages THEN the system enters infinite re-render loops causing "Maximum update depth exceeded" errors

1.4 WHEN a user tries to use messaging THEN messages fail to load and the interface is unresponsive

1.5 WHEN a user navigates between pages THEN the system may freeze or become unresponsive due to state management issues

1.6 WHEN database operations fail THEN errors are logged repeatedly in console due to infinite retry loops

### Expected Behavior (Correct)

2.1 WHEN a user submits valid login credentials THEN the system SHALL display a loading indicator during authentication

2.2 WHEN authentication succeeds THEN the system SHALL automatically navigate to the dashboard without requiring a page refresh

2.3 WHEN a user submits invalid login credentials THEN the system SHALL display an error message indicating authentication failure

2.4 WHEN a user navigates to any page THEN the system SHALL NOT enter infinite re-render loops

2.5 WHEN a user uses messaging THEN messages SHALL load and display correctly without errors

2.6 WHEN database operations execute THEN they SHALL execute once per user action without infinite retry loops

2.7 WHEN real-time subscriptions are established THEN they SHALL remain stable without being recreated repeatedly

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user submits login credentials THEN the system SHALL CONTINUE TO validate credentials against the authentication service

3.2 WHEN authentication succeeds THEN the system SHALL CONTINUE TO establish a valid user session

3.3 WHEN authentication fails THEN the system SHALL CONTINUE TO prevent unauthorized access to protected resources

3.4 WHEN a user is already authenticated THEN the system SHALL CONTINUE TO maintain their session state correctly
