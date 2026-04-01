# Implementation Plan: Real-Time Notification Icons

## Overview

This implementation adds a comprehensive real-time notification system to the TopNav component, replacing the non-functional bell icon with role-specific notification icons. The system displays badge counts for attendance approvals, report approvals, events, and messages, with real-time updates, audio notifications, and full accessibility support.

## Tasks

- [x] 1. Create database migrations for notification tracking
  - [x] 1.1 Create migration for attendance_records notification_viewed field
    - Add `notification_viewed` boolean column with default false
    - Create index on (staff_id, approval_status, notification_viewed)
    - Create trigger to reset notification_viewed when approval_status changes to approved/rejected
    - _Requirements: 10.1, 10.4, 10.7_
  
  - [x] 1.2 Create migration for weekly_reports notification_viewed field
    - Add `notification_viewed` boolean column with default false
    - Create index on (staff_id, approval_status, notification_viewed)
    - Create trigger to reset notification_viewed when approval_status changes to approved/rejected
    - _Requirements: 10.2, 10.5, 10.8_
  
  - [x] 1.3 Create migration for events viewed_by field
    - Add `viewed_by` JSONB column with default empty array
    - Create GIN index on viewed_by for efficient querying
    - Create helper function to check if user has viewed event
    - _Requirements: 10.3, 10.6, 10.9_

- [x] 2. Update TypeScript type definitions
  - [x] 2.1 Add notification fields to AttendanceRecord type
    - Add optional `notificationViewed` boolean field
    - Update type in lib/types.ts
    - _Requirements: 10.1_
  
  - [x] 2.2 Add notification fields to WeeklyReport type
    - Add optional `notificationViewed` boolean field
    - Update type in lib/types.ts
    - _Requirements: 10.2_
  
  - [x] 2.3 Add notification fields to Event type
    - Add optional `viewedBy` string array field
    - Update type in lib/types.ts
    - _Requirements: 10.3_

- [x] 3. Create NotificationIcon component
  - [x] 3.1 Implement NotificationIcon component with props interface
    - Create components/notification-icon.tsx
    - Define NotificationIconProps interface (icon, count, label, href, onClick, hasError, className)
    - Implement basic rendering with icon and badge overlay
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_
  
  - [x] 3.2 Add badge count display logic
    - Show badge when count > 0
    - Hide badge when count = 0
    - Format large counts (e.g., 99+)
    - _Requirements: 2.2, 2.4, 3.2, 3.4_
  
  - [x] 3.3 Implement navigation and click handling
    - Handle onClick callback execution
    - Navigate to href on click
    - Support keyboard navigation (Enter, Space)
    - _Requirements: 2.5, 3.5, 4.4, 5.4, 6.4, 7.6_
  
  - [x] 3.4 Add error indicator display
    - Show red dot or exclamation when hasError is true
    - Add tooltip for error state
    - _Requirements: 14.1, 14.2_
  
  - [x] 3.5 Implement accessibility features
    - Add ARIA labels with count information
    - Add ARIA live region for count changes
    - Ensure keyboard navigability with Tab key
    - Add minimum 44x44px touch target
    - Ensure 4.5:1 color contrast ratio
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 3.6 Add theme-aware styling
    - Use CSS custom properties for colors
    - Implement smooth color transitions (300ms)
    - Support light and dark themes
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 3.7 Write property test for badge visibility
    - **Property 1: Badge Count Hidden When Zero**
    - **Validates: Requirements 2.4, 3.4, 5.5, 6.5, 7.5**
  
  - [x] 3.8 Write unit tests for NotificationIcon component
    - Test badge display when count > 0
    - Test badge hidden when count = 0
    - Test navigation on click
    - Test error indicator display
    - Test keyboard navigation
    - Test ARIA attributes

- [ ] 4. Create use-notification-counts hook
  - [x] 4.1 Implement hook structure and interface
    - Create hooks/use-notification-counts.ts
    - Define NotificationCounts interface
    - Define UseNotificationCountsOptions interface
    - Set up state management for all count types
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 4.2 Implement initial count fetching for admin notifications
    - Fetch pending attendance approvals count
    - Fetch pending report approvals count
    - Use count queries with head: true for efficiency
    - _Requirements: 2.2, 3.2, 11.2_
  
  - [x] 4.3 Implement initial count fetching for staff notifications
    - Fetch unviewed attendance status count
    - Fetch unviewed report status count
    - Fetch unviewed events count
    - Fetch unread messages count
    - _Requirements: 4.2, 5.2, 6.2, 7.2_
  
  - [x] 4.4 Integrate real-time hooks for updates
    - Use use-realtime-approvals for attendance and report updates
    - Use use-realtime-events for event updates
    - Use use-realtime-messages for message updates
    - Ensure proper subscription cleanup on unmount
    - _Requirements: 8.1, 8.2, 8.3, 8.6_
  
  - [x] 4.5 Implement debouncing for count updates
    - Debounce updates with 300ms delay
    - Batch multiple updates within debounce window
    - Use useRef to track pending updates
    - _Requirements: 11.1, 11.4_
  
  - [x] 4.6 Implement error handling and retry logic
    - Monitor connection status from real-time hooks
    - Set hasError flag on connection failures
    - Implement exponential backoff retry (1s, 2s, 4s)
    - Log errors to console
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [x] 4.7 Add performance optimizations
    - Use useMemo for derived values
    - Use useCallback for event handlers
    - Prevent queries more than once per 5 seconds
    - _Requirements: 11.3, 11.5_
  
  - [x] 4.8 Write property tests for count accuracy
    - **Property 2: Admin Attendance Approval Count Accuracy**
    - **Validates: Requirements 2.2**
    - **Property 3: Admin Report Approval Count Accuracy**
    - **Validates: Requirements 3.2**
    - **Property 4: Staff Attendance Status Count Accuracy**
    - **Validates: Requirements 4.2**
    - **Property 5: Staff Report Status Count Accuracy**
    - **Validates: Requirements 5.2**
    - **Property 6: Event Notification Count Accuracy**
    - **Validates: Requirements 6.2, 6.6**
    - **Property 8: Message Count Accuracy**
    - **Validates: Requirements 7.2**
  
  - [x] 4.9 Write property test for subscription management
    - **Property 12: No Duplicate Subscriptions**
    - **Validates: Requirements 8.5**
  
  - [x] 4.10 Write unit tests for use-notification-counts hook
    - Test initial count fetching
    - Test real-time update handling
    - Test connection error handling
    - Test debouncing behavior
    - Test cleanup on unmount

- [ ] 5. Create use-audio-notification hook
  - [x] 5.1 Implement hook structure and audio management
    - Create hooks/use-audio-notification.ts
    - Define UseAudioNotificationOptions interface
    - Define AudioNotificationControls interface
    - Set up audio element reference and state
    - _Requirements: 9.1_
  
  - [x] 5.2 Implement audio loading and initialization
    - Load audio file from /sounds/notification.mp3
    - Set up event listeners for load/error
    - Set volume to appropriate level
    - _Requirements: 9.2, 16.1, 16.2_
  
  - [x] 5.3 Implement play function with debouncing
    - Check if enabled before playing
    - Implement 3-second debounce
    - Track last played timestamp
    - Handle playback errors gracefully
    - _Requirements: 9.4_
  
  - [x] 5.4 Handle browser autoplay restrictions
    - Detect autoplay blocking
    - Request permission on first user interaction
    - Provide fallback when permission denied
    - _Requirements: 9.5_
  
  - [x] 5.5 Implement cleanup on unmount
    - Remove event listeners
    - Pause audio if playing
    - Clear references
    - _Requirements: 8.6_
  
  - [ ] 5.6 Write property test for debouncing
    - **Property 9: Notification Sound Debouncing**
    - **Validates: Requirements 9.4**
  
  - [ ] 5.7 Write unit tests for use-audio-notification hook
    - Test audio loading
    - Test play function
    - Test debouncing behavior
    - Test autoplay restriction handling
    - Test cleanup

- [ ] 6. Implement mark as viewed functions
  - [x] 6.1 Create markAttendanceAsViewed function
    - Update notification_viewed to true for user's attendance records
    - Filter by staff_id and approval_status in ['approved', 'rejected']
    - Only update records where notification_viewed is false
    - Handle errors gracefully
    - _Requirements: 10.7_
  
  - [x] 6.2 Create markReportsAsViewed function
    - Update notification_viewed to true for user's reports
    - Filter by staff_id and approval_status in ['approved', 'rejected']
    - Only update records where notification_viewed is false
    - Handle errors gracefully
    - _Requirements: 10.8_
  
  - [x] 6.3 Create markEventsAsViewed function
    - Fetch unviewed events for user's department
    - Add user ID to viewed_by array for each event
    - Handle null target_departments (all departments)
    - Use Promise.all for batch updates
    - Handle errors gracefully
    - _Requirements: 10.9_
  
  - [ ] 6.4 Write property test for viewed status tracking
    - **Property 11: Badge Count Reflects Viewed Status**
    - **Validates: Requirements 10.10**
  
  - [ ] 6.5 Write unit tests for mark as viewed functions
    - Test markAttendanceAsViewed updates correct records
    - Test markReportsAsViewed updates correct records
    - Test markEventsAsViewed adds user to viewed_by array
    - Test error handling for each function

- [ ] 7. Modify TopNav component
  - [x] 7.1 Remove existing bell icon
    - Remove bell icon button element
    - Remove associated span element
    - _Requirements: 1.1, 1.2_
  
  - [x] 7.2 Add use-notification-counts hook integration
    - Import and initialize use-notification-counts hook
    - Pass user context (userId, staffId, department, isAdmin)
    - Handle case when user context is unavailable
    - _Requirements: 8.1, 8.2, 8.3, 17.3_
  
  - [x] 7.3 Add use-audio-notification hook integration
    - Import and initialize use-audio-notification hook
    - Enable audio notifications for messages
    - _Requirements: 9.1_
  
  - [x] 7.4 Implement role detection logic
    - Check if user.role === 'admin' OR user.department === 'Business Intelligence'
    - Use useMemo for performance
    - Re-evaluate when user object changes
    - _Requirements: 17.1, 17.2, 17.4_
  
  - [x] 7.5 Add admin notification icons
    - Render attendance approval icon for admin users
    - Render report approval icon for admin users
    - Use ClipboardCheck and FileText icons from lucide-react
    - Pass correct counts and navigation paths
    - _Requirements: 2.1, 2.5, 3.1, 3.5_
  
  - [x] 7.6 Add staff notification icons
    - Render attendance status icon for non-admin users
    - Render report status icon for non-admin users
    - Use CheckCircle and FileCheck icons for visual distinction
    - Pass onClick callbacks to mark as viewed
    - _Requirements: 4.1, 4.4, 4.6, 5.1, 5.4, 5.6_
  
  - [x] 7.7 Add universal notification icons
    - Render event notification icon for all users
    - Render message notification icon for all users
    - Use Calendar and MessageSquare icons from lucide-react
    - Pass onClick callback for events to mark as viewed
    - _Requirements: 6.1, 6.4, 7.1, 7.6_
  
  - [x] 7.8 Implement audio notification trigger
    - Add useEffect to watch for new messages
    - Play sound when unread message count increases
    - Don't play sound for messages sent by current user
    - _Requirements: 9.1, 9.6_
  
  - [x] 7.9 Add visual indicator for audio playback
    - Show visual indicator when sound plays
    - Ensure indicator is visible for deaf users
    - _Requirements: 12.7_
  
  - [x] 7.10 Preserve existing TopNav functionality
    - Ensure search input still works
    - Ensure help icon still works
    - Ensure user avatar still works
    - Maintain theme transition behavior
    - Preserve responsive design breakpoints
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 7.11 Write property test for role detection
    - **Property 14: Admin Role Detection**
    - **Validates: Requirements 17.1**
  
  - [ ] 7.12 Write property test for role-based visibility
    - **Property 15: Role-Based Visibility Reactivity**
    - **Validates: Requirements 17.4**
  
  - [ ] 7.13 Write property test for self-sent messages
    - **Property 10: Self-Sent Messages Don't Trigger Sound**
    - **Validates: Requirements 9.6**
  
  - [ ] 7.14 Write property test for real-time filtering
    - **Property 13: Real-Time Hook Filtering**
    - **Validates: Requirements 15.4**
  
  - [ ] 7.15 Write integration tests for TopNav
    - Test admin users see admin notification icons
    - Test staff users see staff notification icons
    - Test navigation on icon click
    - Test mark as viewed on navigation
    - Test audio plays on new message
    - Test existing functionality preserved

- [ ] 8. Add notification sound asset
  - [x] 8.1 Obtain notification sound file
    - Find royalty-free notification sound (MP3 format)
    - Ensure duration is 0.5-2 seconds
    - Ensure file size is < 50KB
    - Verify sound is pleasant and corporate
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [x] 8.2 Add sound file to project
    - Create public/sounds/ directory if needed
    - Add notification.mp3 to public/sounds/
    - Verify file is accessible at /sounds/notification.mp3
    - _Requirements: 16.2_
  
  - [x] 8.3 Test audio playback
    - Test sound plays correctly in browser
    - Test volume level is appropriate
    - Get feedback from team members on pleasantness
    - _Requirements: 16.5_

- [x] 9. Checkpoint - Verify core functionality
  - Ensure all tests pass
  - Test notification icons display correctly for admin and staff users
  - Test badge counts update in real-time
  - Test navigation works for all icons
  - Test mark as viewed functions work correctly
  - Test audio notification plays for new messages
  - Ask the user if questions arise

- [ ] 10. Add database migration trigger tests
  - [ ] 10.1 Write property test for notification_viewed reset
    - **Property 7: Status Change Resets Notification Viewed Flag**
    - **Validates: Requirements 10.4, 10.5**
  
  - [ ] 10.2 Write unit tests for database triggers
    - Test attendance trigger resets notification_viewed on approval
    - Test attendance trigger resets notification_viewed on rejection
    - Test report trigger resets notification_viewed on approval
    - Test report trigger resets notification_viewed on rejection

- [ ] 11. Perform accessibility testing
  - [ ] 11.1 Test with keyboard navigation
    - Verify all icons are reachable with Tab key
    - Verify icons activate with Enter and Space keys
    - Verify focus indicators are visible
    - _Requirements: 12.3, 12.4_
  
  - [ ] 11.2 Test with screen reader
    - Verify ARIA labels are announced correctly
    - Verify badge count changes are announced
    - Verify error states are announced
    - _Requirements: 12.1, 12.2_
  
  - [ ] 11.3 Verify visual accessibility
    - Check color contrast ratios (minimum 4.5:1)
    - Check touch target sizes (minimum 44x44px)
    - Check visual indicator for audio playback
    - _Requirements: 12.5, 12.6, 12.7_

- [ ] 12. Perform cross-browser and responsive testing
  - [ ] 12.1 Test in multiple browsers
    - Test in Chrome, Firefox, Safari, Edge
    - Test audio playback in each browser
    - Test autoplay restrictions handling
    - _Requirements: 9.5_
  
  - [ ] 12.2 Test responsive design
    - Test on mobile devices
    - Test on tablets
    - Verify icons don't break layout
    - Ensure touch targets work on mobile
    - _Requirements: 15.3_
  
  - [ ] 12.3 Test theme compatibility
    - Test in light theme
    - Test in dark theme
    - Verify smooth color transitions
    - Verify visual clarity in both themes
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 13. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Test real-time updates with multiple users
  - Test error handling and recovery
  - Test performance with large notification counts
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Database migrations must be run before testing notification features
- Property tests use fast-check library with minimum 100 iterations
- All notification icons must maintain accessibility compliance
- Real-time updates should occur within 500ms of database changes
- Audio notifications are debounced to prevent spam
- The system preserves all existing TopNav functionality
