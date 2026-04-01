# Requirements Document

## Introduction

This document specifies requirements for a real-time notification system in the TopNav component of the Toko 360 Staff Portal. The system provides visual notification icons with badge counts for attendance approvals, report approvals, and messages. It integrates with existing real-time infrastructure (`use-realtime-approvals.ts`, `use-realtime-messages.ts`) and implements role-based visibility, notification sounds, and accessibility features.

## Glossary

- **TopNav_Component**: The top navigation bar component located at `components/top-nav.tsx`
- **Notification_Icon**: A clickable icon that displays a badge count for pending items
- **Badge_Count**: A numeric indicator showing the number of pending or unread items
- **Admin_User**: A user with role 'admin' or department 'Business Intelligence'
- **Staff_User**: Any authenticated user in the system
- **Attendance_Approval**: An attendance record with `approval_status='pending'` requiring admin review
- **Report_Approval**: A weekly report with `status='submitted'` and `approval_status='pending'` requiring admin review
- **Attendance_Status_Notification**: An attendance record with `approval_status='approved'` OR `approval_status='rejected'` that the staff user has not viewed
- **Report_Status_Notification**: A weekly report with `approval_status='approved'` OR `approval_status='rejected'` that the staff user has not viewed
- **Event_Notification**: An event record targeted to the user's department that has not been viewed
- **Unread_Message**: A message record with `read=false` where the current user is the recipient
- **Notification_Sound**: An audio file that plays when new messages arrive
- **Real_Time_Hook**: Existing Supabase real-time subscription hooks (`use-realtime-approvals`, `use-realtime-messages`)
- **Bell_Icon**: The existing notification bell icon that will be removed from TopNav

## Requirements

### Requirement 1: Remove Existing Bell Icon

**User Story:** As a developer, I want to remove the non-functional bell icon, so that the TopNav only shows useful notification indicators.

#### Acceptance Criteria

1. THE TopNav_Component SHALL NOT render the Bell_Icon element
2. THE TopNav_Component SHALL remove the bell icon button and its associated span element

### Requirement 2: Display Attendance Approval Notifications for Admins

**User Story:** As an admin user, I want to see a count of pending attendance approvals, so that I know how many records need my review.

#### Acceptance Criteria

1. WHERE the current user is an Admin_User, THE TopNav_Component SHALL display an Attendance_Approval Notification_Icon for pending approvals
2. THE Attendance_Approval Notification_Icon SHALL display a Badge_Count showing the number of Attendance_Approvals with `approval_status='pending'`
3. WHEN an Attendance_Approval status changes, THE Badge_Count SHALL update within 500ms
4. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
5. WHEN an Admin_User clicks the Attendance_Approval Notification_Icon, THE TopNav_Component SHALL navigate to `/admin/approvals/attendance`

### Requirement 3: Display Report Approval Notifications for Admins

**User Story:** As an admin user, I want to see a count of pending report approvals, so that I know how many reports need my review.

#### Acceptance Criteria

1. WHERE the current user is an Admin_User, THE TopNav_Component SHALL display a Report_Approval Notification_Icon for pending approvals
2. THE Report_Approval Notification_Icon SHALL display a Badge_Count showing the number of Report_Approvals with `status='submitted'` AND `approval_status='pending'`
3. WHEN a Report_Approval status changes, THE Badge_Count SHALL update within 500ms
4. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
5. WHEN an Admin_User clicks the Report_Approval Notification_Icon, THE TopNav_Component SHALL navigate to `/admin/approvals/reports`

### Requirement 4: Display Attendance Status Notifications for Staff

**User Story:** As a staff user, I want to see when my attendance records are approved or rejected, so that I'm aware of the status of my submissions.

#### Acceptance Criteria

1. WHERE the current user is a Staff_User (not admin), THE TopNav_Component SHALL display an Attendance_Status Notification_Icon
2. THE Attendance_Status Notification_Icon SHALL display a Badge_Count showing the number of the user's attendance records with `approval_status='approved'` OR `approval_status='rejected'` that have not been viewed
3. WHEN an attendance record's approval_status changes to 'approved' or 'rejected', THE Badge_Count SHALL increment within 500ms
4. WHEN a Staff_User clicks the Attendance_Status Notification_Icon, THE TopNav_Component SHALL navigate to `/attendance` and mark notifications as viewed
5. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
6. THE Attendance_Status Notification_Icon SHALL use a different visual style (e.g., checkmark for approved, X for rejected) to distinguish from admin pending approvals

### Requirement 5: Display Report Status Notifications for Staff

**User Story:** As a staff user, I want to see when my reports are approved or rejected, so that I'm aware of the status of my submissions.

#### Acceptance Criteria

1. WHERE the current user is a Staff_User (not admin), THE TopNav_Component SHALL display a Report_Status Notification_Icon
2. THE Report_Status Notification_Icon SHALL display a Badge_Count showing the number of the user's reports with `approval_status='approved'` OR `approval_status='rejected'` that have not been viewed
3. WHEN a report's approval_status changes to 'approved' or 'rejected', THE Badge_Count SHALL increment within 500ms
4. WHEN a Staff_User clicks the Report_Status Notification_Icon, THE TopNav_Component SHALL navigate to `/reports` and mark notifications as viewed
5. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
6. THE Report_Status Notification_Icon SHALL use a different visual style to distinguish from admin pending approvals

### Requirement 6: Display Event Notifications

**User Story:** As a staff user, I want to see when new events are created for my department, so that I'm aware of upcoming activities.

#### Acceptance Criteria

1. THE TopNav_Component SHALL display an Event_Notification Icon for all Staff_Users
2. THE Event_Notification Icon SHALL display a Badge_Count showing the number of Event_Notifications targeted to the user's department that have not been viewed
3. WHEN a new event is created or updated for the user's department, THE Badge_Count SHALL increment within 500ms
4. WHEN a Staff_User clicks the Event_Notification Icon, THE TopNav_Component SHALL navigate to `/events` and mark event notifications as viewed
5. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
6. THE Event_Notification Icon SHALL show events where `target_departments` includes the user's department OR `target_departments` is 'All Departments'

### Requirement 7: Display Message Notifications

**User Story:** As a staff user, I want to see a count of unread messages, so that I know when I have new messages to read.

#### Acceptance Criteria

1. THE TopNav_Component SHALL display a Message Notification_Icon for all Staff_Users
2. THE Message Notification_Icon SHALL display a Badge_Count showing the number of Unread_Messages
3. WHEN a new Unread_Message arrives, THE Badge_Count SHALL increment within 500ms
4. WHEN an Unread_Message is marked as read, THE Badge_Count SHALL decrement within 500ms
5. WHERE the Badge_Count is zero, THE TopNav_Component SHALL hide the Badge_Count indicator
6. WHEN a Staff_User clicks the Message Notification_Icon, THE TopNav_Component SHALL navigate to `/messaging`

### Requirement 8: Integrate Real-Time Updates

**User Story:** As a developer, I want to use existing real-time hooks, so that the notification system leverages proven infrastructure without duplication.

#### Acceptance Criteria

1. THE TopNav_Component SHALL use the Real_Time_Hook `use-realtime-approvals` for attendance and report updates
2. THE TopNav_Component SHALL use the Real_Time_Hook `use-realtime-events` for event updates
3. THE TopNav_Component SHALL use the Real_Time_Hook `use-realtime-messages` for message updates
4. WHEN a Real_Time_Hook connection status changes to disconnected, THE TopNav_Component SHALL display a visual indicator
5. THE TopNav_Component SHALL NOT create duplicate Supabase subscriptions
6. WHEN the TopNav_Component unmounts, THE Real_Time_Hooks SHALL properly cleanup subscriptions

### Requirement 9: Play Notification Sound for Messages

**User Story:** As a staff user, I want to hear a pleasant sound when new messages arrive, so that I'm alerted even when not looking at the screen.

#### Acceptance Criteria

1. WHEN a new Unread_Message arrives, THE TopNav_Component SHALL play the Notification_Sound
2. THE Notification_Sound SHALL be corporate, simple, pleasant, and not exceed 70 decibels equivalent
3. THE Notification_Sound SHALL have a duration between 0.5 and 2 seconds
4. THE TopNav_Component SHALL NOT play the Notification_Sound more than once per 3 seconds (debounced)
5. WHERE the user's browser blocks autoplay, THE TopNav_Component SHALL request audio permission on first user interaction
6. THE TopNav_Component SHALL NOT play the Notification_Sound for messages sent by the current user

### Requirement 10: Track Viewed Status for Staff Notifications

**User Story:** As a developer, I want to track which approval/rejection notifications staff have viewed, so that badge counts accurately reflect new updates.

#### Acceptance Criteria

1. THE system SHALL add a `notification_viewed` boolean field to attendance_records table (default: false)
2. THE system SHALL add a `notification_viewed` boolean field to weekly_reports table (default: false)
3. THE system SHALL add a `viewed_by` JSONB field to events table to track which users have viewed each event (default: [])
4. WHEN a Staff_User's attendance record approval_status changes to 'approved' or 'rejected', THE system SHALL set `notification_viewed=false`
5. WHEN a Staff_User's report approval_status changes to 'approved' or 'rejected', THE system SHALL set `notification_viewed=false`
6. WHEN a new event is created, THE system SHALL NOT include any users in the `viewed_by` array
7. WHEN a Staff_User navigates to `/attendance`, THE system SHALL set `notification_viewed=true` for all their attendance records
8. WHEN a Staff_User navigates to `/reports`, THE system SHALL set `notification_viewed=true` for all their reports
9. WHEN a Staff_User navigates to `/events`, THE system SHALL add the user's ID to the `viewed_by` array for all events targeted to their department
10. THE Badge_Count for staff notifications SHALL only count records where `notification_viewed=false` or user ID is not in `viewed_by` array

### Requirement 11: Optimize Performance

**User Story:** As a developer, I want efficient badge count updates, so that the notification system doesn't degrade application performance.

#### Acceptance Criteria

1. THE TopNav_Component SHALL debounce Badge_Count updates with a 300ms delay
2. THE TopNav_Component SHALL fetch initial Badge_Counts using a single database query per notification type
3. THE TopNav_Component SHALL use React memoization to prevent unnecessary re-renders
4. WHEN multiple real-time updates arrive within 300ms, THE TopNav_Component SHALL batch Badge_Count updates
5. THE TopNav_Component SHALL NOT query the database more than once per 5 seconds for initial counts

### Requirement 12: Ensure Accessibility Compliance

**User Story:** As a user with disabilities, I want accessible notification icons, so that I can use the notification system with assistive technologies.

#### Acceptance Criteria

1. THE Notification_Icons SHALL have ARIA labels describing their purpose
2. THE Badge_Counts SHALL have ARIA live region announcements when values change
3. THE Notification_Icons SHALL be keyboard navigable with tab key
4. THE Notification_Icons SHALL be activatable with Enter or Space key
5. THE Notification_Icons SHALL have a minimum touch target size of 44x44 pixels
6. THE Notification_Icons SHALL maintain a color contrast ratio of at least 4.5:1 with the background
7. WHERE a Notification_Sound plays, THE TopNav_Component SHALL provide a visual indicator for deaf users

### Requirement 13: Maintain Theme Compatibility

**User Story:** As a user, I want notification icons to respect the current theme, so that the UI remains visually consistent.

#### Acceptance Criteria

1. THE Notification_Icons SHALL use CSS custom properties for colors (`--theme-text`, `--theme-accent`, `--theme-surface`)
2. THE Badge_Counts SHALL use CSS custom properties for background and text colors
3. WHEN the theme changes, THE Notification_Icons SHALL transition colors smoothly within 300ms
4. THE Notification_Icons SHALL maintain visual clarity in both light and dark themes

### Requirement 14: Handle Error States

**User Story:** As a user, I want to know when notifications aren't working, so that I can take appropriate action or contact support.

#### Acceptance Criteria

1. WHEN a Real_Time_Hook reports a connection error, THE TopNav_Component SHALL display an error indicator on affected Notification_Icons
2. WHEN initial Badge_Count queries fail, THE TopNav_Component SHALL display a fallback indicator (e.g., "!")
3. THE TopNav_Component SHALL log connection errors to the browser console for debugging
4. WHEN a Real_Time_Hook reconnects successfully, THE TopNav_Component SHALL remove error indicators
5. THE TopNav_Component SHALL retry failed Badge_Count queries with exponential backoff (1s, 2s, 4s)

### Requirement 15: Preserve Existing Functionality

**User Story:** As a developer, I want to ensure existing features continue working, so that the notification system doesn't introduce regressions.

#### Acceptance Criteria

1. THE TopNav_Component SHALL continue to display the search input, help icon, and user avatar
2. THE TopNav_Component SHALL maintain existing theme transition behavior
3. THE TopNav_Component SHALL preserve responsive design breakpoints (hidden search on mobile)
4. THE Real_Time_Hooks SHALL continue to filter updates by `staffId` or `userId` as currently implemented
5. THE TopNav_Component SHALL NOT interfere with messaging conversation loading (getUserByStaffId fix)
6. THE TopNav_Component SHALL NOT interfere with report approval system (status='submitted' logic)
7. THE TopNav_Component SHALL NOT interfere with rich text editor theme support

### Requirement 16: Implement Notification Sound Asset

**User Story:** As a developer, I want a suitable notification sound file, so that the audio notification feature can be implemented.

#### Acceptance Criteria

1. THE Notification_Sound SHALL be provided as an audio file in MP3 or OGG format
2. THE Notification_Sound file SHALL be located in the `public/sounds/` directory
3. THE Notification_Sound file SHALL have a file size less than 50KB
4. THE Notification_Sound SHALL be royalty-free or properly licensed for commercial use
5. THE Notification_Sound SHALL be tested for pleasantness with at least 3 team members

### Requirement 17: Support Role-Based Visibility Logic

**User Story:** As a developer, I want clear role-checking logic, so that notification icons appear only for authorized users.

#### Acceptance Criteria

1. THE TopNav_Component SHALL determine Admin_User status by checking if `user.role === 'admin'` OR `user.department === 'Business Intelligence'`
2. THE TopNav_Component SHALL access user information from the existing `useAuth` hook
3. WHERE user information is unavailable, THE TopNav_Component SHALL NOT display any Notification_Icons
4. THE TopNav_Component SHALL re-evaluate role-based visibility when the user object changes
