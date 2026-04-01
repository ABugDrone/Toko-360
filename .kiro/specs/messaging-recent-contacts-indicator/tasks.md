# Implementation Plan: Messaging Recent Contacts Indicator

## Overview

This implementation plan breaks down the messaging recent contacts indicator feature into discrete coding tasks. The feature adds visual indicators to the contact selection dialog showing which contacts have existing conversations, and enhances navigation to open existing conversations when those contacts are selected.

The implementation leverages existing infrastructure (useConversations hook, real-time subscriptions) and follows the established patterns in the Next.js/React codebase. Tasks are ordered to enable incremental validation and early testing of core functionality.

## Tasks

- [x] 1. Create RecentIndicator component
  - Create new file `components/messaging/RecentIndicator.tsx`
  - Implement component with clock icon (lucide-react) and "Recent" label
  - Add size prop ('sm' | 'md') with appropriate styling (sm: 16px icon/12px text, md: 20px icon/14px text)
  - Add ARIA label "Has existing conversation" for accessibility
  - Use theme accent color with reduced opacity for styling
  - Add data-testid="recent-indicator" for testing
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.4_

- [ ]* 1.1 Write unit tests for RecentIndicator component
  - Test component renders with clock icon and "Recent" label
  - Test size prop variations (sm, md)
  - Test ARIA label presence
  - Test color contrast meets WCAG AA (4.5:1 ratio)
  - Test className prop application
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 2. Add conversation lookup logic to MessagingPage
  - [x] 2.1 Create memoized conversation user ID set
    - Add useMemo hook to derive Set of user IDs from conversations array
    - Optimize for O(1) lookup performance
    - Update when conversations array changes
    - _Requirements: 1.1, 1.2, 5.1, 5.2_

  - [ ]* 2.2 Write property test for conversation lookup
    - **Property 1: Indicator Display for Active Conversations**
    - **Property 2: No Indicator for Inactive Conversations**
    - **Validates: Requirements 1.1, 1.2**
    - Generate random contact and conversation lists
    - Verify indicators appear only for contacts with conversations
    - Use fast-check with 100 iterations

  - [x] 2.3 Enhance contact item rendering in dialog
    - Import RecentIndicator component
    - Add conditional rendering: show indicator when contact ID exists in conversation set
    - Position indicator at end of contact item flex layout
    - Maintain existing avatar and user info layout
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.4 Write unit tests for contact item rendering
    - Test indicator appears for contacts with conversations
    - Test indicator absent for contacts without conversations
    - Test empty contact list edge case
    - Test empty conversation list edge case
    - _Requirements: 1.1, 1.2_

- [x] 3. Checkpoint - Verify indicator display
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance navigation logic
  - [x] 4.1 Modify handleStartConversation function
    - Add logic to check if conversation exists for selected user
    - If exists: navigate to existing conversation (setSelectedConvId with existing ID)
    - If exists: call loadMessagesForConversation immediately
    - If not exists: create temporary conversation ID (conv-new-{userId})
    - If not exists: clear messages array
    - Close dialog and reset search query in both cases
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 4.2 Write property tests for navigation behavior
    - **Property 4: Navigation to Existing Conversation**
    - **Property 5: New Conversation Creation**
    - **Validates: Requirements 2.1, 2.2**
    - Generate random contacts with/without conversations
    - Verify correct navigation behavior for each case
    - Use fast-check with 100 iterations

  - [ ]* 4.3 Write unit tests for navigation logic
    - Test navigation to existing conversation when contact has indicator
    - Test new conversation creation when contact lacks indicator
    - Test dialog closes after selection
    - Test search query resets after selection
    - Test loadMessagesForConversation called for existing conversations
    - _Requirements: 2.1, 2.2_

- [x] 5. Enhance accessibility features
  - [x] 5.1 Add enhanced ARIA labels to contact buttons
    - Update contact button aria-label to include conversation status
    - Format: "{name}, {department}, has existing conversation" when indicator present
    - Format: "{name}, {department}" when no indicator
    - Ensure keyboard navigation works (Tab, Enter, Space)
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 5.2 Write accessibility tests
    - Test screen reader announces conversation status
    - Test keyboard navigation (Tab to focus, Enter/Space to select)
    - Test ARIA labels on contact buttons
    - Use jest-axe to verify no accessibility violations
    - _Requirements: 4.1, 4.3, 4.4_

- [x] 6. Checkpoint - Verify navigation and accessibility
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement real-time synchronization
  - [x] 7.1 Verify real-time update flow
    - Confirm useRealtimeMessages hook triggers refreshTrigger on new messages
    - Confirm useConversations refetches when refreshTrigger changes
    - Confirm memoized conversation set updates when conversations change
    - Confirm contact list re-renders with updated indicators
    - Add error handling for conversation data load failures (fail safe: show no indicators)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 7.2 Write property test for synchronization
    - **Property 8: Indicator Synchronization with Conversation List**
    - **Validates: Requirements 3.2, 3.3**
    - Generate random conversation list states
    - Simulate conversation list updates (add/remove conversations)
    - Verify indicators always reflect current state
    - Use fast-check with 100 iterations

  - [ ]* 7.3 Write integration tests for real-time updates
    - Test indicator appears within 2 seconds after conversation creation
    - Test indicator appears within 3 seconds after incoming message
    - Mock real-time subscription and trigger updates
    - Use waitFor with appropriate timeouts
    - _Requirements: 1.4, 3.1_

- [x] 8. Optimize performance
  - [x] 8.1 Add performance optimizations
    - Verify useMemo for conversation lookup set (already implemented in 2.1)
    - Add debounced search input (300ms delay) if not already present
    - Ensure conditional rendering (don't render hidden indicators)
    - Add error boundaries for graceful degradation
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.2 Write property tests for performance
    - **Property 9: Large Contact List Render Performance**
    - **Property 10: Search Filter Performance**
    - **Validates: Requirements 5.1, 5.2**
    - Generate contact lists with 400-500 contacts
    - Measure render time (must be < 500ms)
    - Measure search filter update time (must be < 200ms)
    - Use performance.now() for timing
    - Use fast-check with 100 iterations

  - [ ]* 8.3 Write performance benchmark tests
    - Test render time with 500 contacts
    - Test search filtering with various query lengths
    - Test conversation lookup set creation time
    - Log performance metrics for monitoring
    - _Requirements: 5.1, 5.2_

- [x] 9. Add error handling and edge cases
  - [x] 9.1 Implement error handling
    - Add try-catch in conversation lookup set creation (return empty Set on error)
    - Add error logging for debugging
    - Ensure UI doesn't crash on data fetch failures
    - Add fallback behavior: show contact without indicator if data unavailable
    - Handle race conditions with optimistic UI updates
    - _Requirements: 1.1, 1.2, 3.2_

  - [ ]* 9.2 Write tests for error scenarios
    - Test conversation data load failure (show no indicators)
    - Test user data fetch failure for specific conversation
    - Test rapid conversation creation (race condition)
    - Test real-time subscription failure (indicators remain stale)
    - Verify graceful degradation in all cases
    - _Requirements: 1.1, 1.2, 3.2_

- [x] 10. Final integration and validation
  - [x] 10.1 Integration testing
    - Test complete user flow: open dialog → see indicators → select contact → navigate
    - Test with various conversation list sizes (0, 1, 10, 100 conversations)
    - Test with various contact list sizes (0, 1, 50, 500 contacts)
    - Test search functionality with indicators
    - Verify no regressions in existing messaging functionality
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.2, 5.1, 5.2_

  - [ ]* 10.2 Write end-to-end integration tests
    - Test full user journey from contact selection to conversation load
    - Test indicator updates after sending first message to new contact
    - Test indicator updates after receiving message from new contact
    - Test multiple rapid contact selections
    - _Requirements: 1.4, 2.1, 2.2, 3.1_

- [x] 11. Final checkpoint - Complete validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- Unit tests use Jest + React Testing Library
- Accessibility tests use jest-axe and @testing-library/jest-dom
- Performance tests use performance.now() and React Profiler
- The feature leverages existing infrastructure (useConversations, useRealtimeMessages)
- No database schema changes required - this is a UI-only feature
- Implementation uses TypeScript and React with Next.js
- Checkpoints ensure incremental validation at key milestones
