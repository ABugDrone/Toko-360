# Implementation Plan: Messaging Notifications and Recents

## Overview

This implementation plan converts the messaging system from mock data to real database-driven conversations with unread notifications, visual indicators, and real-time updates. The plan follows a 6-phase approach: Storage Layer → Hooks → UI Components → Real-time Integration → Property-Based Testing → Polish.

## Tasks

- [x] 1. Implement Storage Layer Functions
  - [x] 1.1 Add getConversations function to lib/storage.ts
    - Implement SQL query for conversation aggregation (single query with CTEs)
    - Map database results to ConversationSummary interface
    - Handle edge cases (no messages, missing users)
    - Add error handling and logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 4.1_
  
  - [x] 1.2 Add markConversationAsRead function to lib/storage.ts
    - Implement SQL update query to mark messages as read
    - Only update messages where current user is recipient
    - Handle edge cases (no unread messages, invalid user IDs)
    - Add error handling
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 1.3 Write unit tests for storage functions
    - Test getConversations with various database states
    - Test markConversationAsRead success and failure cases
    - Test edge cases (empty database, single conversation)
    - _Requirements: 1.1, 5.1_

- [x] 2. Create useConversations Hook
  - [x] 2.1 Create hooks/use-conversations.ts with conversation state management
    - Implement conversation fetching logic using getConversations
    - Add refresh mechanism with refreshTrigger support
    - Implement loading and error states
    - Calculate total unread count across conversations
    - Fetch and enrich user data for conversation partners
    - Sort conversations by most recent activity
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 4.1_
  
  - [ ]* 2.2 Write property test for conversation filtering
    - **Property 1: Conversation List Filtering**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.3 Write property test for last message accuracy
    - **Property 2: Last Message Data Accuracy**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ]* 2.4 Write property test for unread count calculation
    - **Property 4: Unread Count Per Conversation**
    - **Validates: Requirements 2.1**
  
  - [ ]* 2.5 Write property test for total unread count
    - **Property 5: Total Unread Count Aggregation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 2.6 Write unit tests for useConversations hook
    - Test initial load behavior
    - Test refresh trigger mechanism
    - Test error handling
    - Test loading states
    - _Requirements: 1.1, 2.1, 2.2_

- [x] 3. Checkpoint - Verify storage and hook functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement UI Components
  - [x] 4.1 Create components/messaging/UnreadBadge.tsx
    - Implement badge component with count display
    - Support different sizes (sm, md, lg)
    - Hide badge when count is zero
    - Add proper styling and accessibility
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 4.2 Create components/messaging/ConversationListItem.tsx
    - Implement conversation item with visual indicators
    - Display bold text for unread conversations
    - Display distinct background color for unread conversations
    - Display normal styling for read conversations
    - Show unread badge with count
    - Display last message preview and timestamp
    - Display user department
    - Add click handling and active state styling
    - Ensure keyboard navigation and accessibility
    - _Requirements: 1.3, 1.4, 1.5, 2.1, 3.1, 3.2, 3.3_
  
  - [ ]* 4.3 Write property test for visual styling
    - **Property 6: Visual Styling Based on Unread Status**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 4.4 Write unit tests for UI components
    - Test UnreadBadge rendering and hiding
    - Test ConversationListItem with unread messages
    - Test ConversationListItem with read messages
    - Test active state styling
    - _Requirements: 2.1, 3.1, 3.2, 3.3_

- [x] 5. Integrate with Messaging Page
  - [x] 5.1 Update messaging page to use useConversations hook
    - Replace mockConversations with useConversations hook
    - Add refreshTrigger state for real-time updates
    - Integrate ConversationListItem component
    - Display total unread count in UI
    - Handle empty state with helpful message
    - Add loading states and error handling
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 7.1, 7.2_
  
  - [x] 5.2 Implement mark as read on conversation open
    - Call markConversationAsRead when user opens conversation
    - Implement optimistic UI updates
    - Handle errors and revert on failure
    - Refresh conversation list after marking as read
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 5.3 Write property test for mark as read behavior
    - **Property 9: Mark as Read on Open**
    - **Validates: Requirements 5.1**
  
  - [ ]* 5.4 Write property test for UI updates after mark as read
    - **Property 11: UI Updates After Mark as Read**
    - **Validates: Requirements 5.2, 5.3**

- [x] 6. Implement Real-time Integration
  - [x] 6.1 Add real-time refresh trigger to messaging page
    - Increment refreshTrigger when new message arrives via useRealtimeMessages
    - Ensure conversation list refreshes automatically
    - Verify new message moves conversation to top
    - Add notification indicators for new messages
    - _Requirements: 4.2, 4.3, 6.1, 6.2, 6.4_
  
  - [ ]* 6.2 Write property test for conversation sorting
    - **Property 7: Conversation Sorting by Recent Activity**
    - **Validates: Requirements 4.1**
  
  - [ ]* 6.3 Write property test for new message reordering
    - **Property 8: New Message Reordering**
    - **Validates: Requirements 4.2**
  
  - [ ]* 6.4 Write property test for notification indicators
    - **Property 12: Notification Indicators for Unread Messages**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [ ]* 6.5 Write integration tests for real-time updates
    - Test conversation list refresh on new message
    - Test unread count updates
    - Test sorting updates
    - Test notification clearing
    - _Requirements: 4.2, 4.3, 6.1, 6.4_

- [x] 7. Checkpoint - Verify end-to-end functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Property-Based Testing Implementation
  - [ ]* 8.1 Set up fast-check library and test infrastructure
    - Configure fast-check with 100+ iterations
    - Create test data generators (messageArbitrary, conversationArbitrary)
    - Set up test tagging format
    - _Requirements: All_
  
  - [ ]* 8.2 Write property test for department display
    - **Property 3: Department Display Accuracy**
    - **Validates: Requirements 1.5**
  
  - [ ]* 8.3 Write property test for read status persistence
    - **Property 10: Read Status Persistence**
    - **Validates: Requirements 5.4**
  
  - [ ]* 8.4 Run all property tests and fix discovered edge cases
    - Execute all 12 property tests
    - Analyze failures and fix implementation
    - Re-run tests to verify fixes
    - _Requirements: All_

- [x] 9. Polish and Optimization
  - [x] 9.1 Add loading skeletons for conversation list
    - Create skeleton component for conversation items
    - Display during initial load
    - Improve perceived performance
    - _Requirements: 1.1_
  
  - [x] 9.2 Optimize database queries with indexes
    - Add index on messages(sender_id, created_at)
    - Add index on messages(recipient_id, created_at)
    - Add index on messages(recipient_id, read)
    - Document index creation in migration file
    - _Requirements: 1.1, 2.1, 4.1_
  
  - [x] 9.3 Implement debouncing for rapid real-time updates
    - Add debounce to refreshTrigger updates (max 1 per second)
    - Prevent excessive re-renders
    - Maintain smooth user experience
    - _Requirements: 4.2, 4.3, 6.4_
  
  - [x] 9.4 Add error recovery and retry mechanisms
    - Implement retry logic for failed database operations
    - Add user-friendly error messages with retry buttons
    - Log errors for debugging
    - _Requirements: All_

- [x] 10. Final Checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation follows the 6-phase plan from the design document
- Real-time integration leverages existing useRealtimeMessages hook
- All database operations use existing error handling patterns from lib/storage.ts
