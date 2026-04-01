# Requirements Document

## Introduction

Toko 360 is an internal staff reporting and attendance portal for Toko Academy. The system provides role-based access to attendance tracking, performance reporting, internal messaging, and administrative analytics. The application is a single-page React application with mock data and local state management, featuring a dark cyberpunk-lite design theme.

## Glossary

- **Portal**: The Toko 360 web application
- **Staff_User**: An authenticated user with staff role privileges
- **Admin_User**: An authenticated user with admin role privileges
- **Dept_Head_User**: An authenticated user with department head role privileges
- **Super_Admin_User**: An authenticated user with super admin role privileges
- **Attendance_Record**: A record containing check-in time, check-out time, and date for a user
- **Performance_Report**: A structured document containing weekly performance data across three sections
- **Message_Thread**: A conversation containing multiple messages between users
- **Analytics_Dashboard**: A view displaying KPIs, charts, and activity feeds
- **Session**: An authenticated user's active login period
- **Reward_Points**: Numerical score tracking user engagement and performance

## Requirements

### Requirement 1: User Authentication

**User Story:** As a staff member, I want to log into the portal with my credentials, so that I can access my personalized dashboard and features.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Portal SHALL create an authenticated session
2. WHEN a user submits invalid credentials, THE Portal SHALL display an error message within 200ms
3. THE Portal SHALL store the authenticated session in local state
4. WHEN a user logs out, THE Portal SHALL clear the session and redirect to the login page
5. THE Portal SHALL support four role types: staff, admin, dept_head, and super_admin

### Requirement 2: Role-Based Access Control

**User Story:** As a system administrator, I want different user roles to have appropriate access levels, so that sensitive features are protected.

#### Acceptance Criteria

1. WHEN a Staff_User accesses the Portal, THE Portal SHALL display dashboard, reports, messages, and profile pages
2. WHEN an Admin_User accesses the Portal, THE Portal SHALL display all Staff_User pages plus admin overview
3. WHEN a Dept_Head_User accesses the Portal, THE Portal SHALL display all Admin_User pages
4. WHEN a Super_Admin_User accesses the Portal, THE Portal SHALL display all pages including system configuration
5. WHEN a user attempts to access an unauthorized page, THE Portal SHALL redirect to the dashboard

### Requirement 3: Attendance Tracking

**User Story:** As a staff member, I want to check in and check out daily, so that my attendance is recorded accurately.

#### Acceptance Criteria

1. WHEN a Staff_User clicks check-in, THE Portal SHALL create an Attendance_Record with current timestamp
2. WHEN a Staff_User clicks check-out, THE Portal SHALL update the Attendance_Record with check-out timestamp
3. THE Portal SHALL display attendance status as checked-in, checked-out, or not-checked-in
4. THE Portal SHALL calculate total hours worked from check-in and check-out times
5. THE Portal SHALL display attendance history for the past 30 days
6. WHEN an Attendance_Record is created, THE Portal SHALL store it in local state

### Requirement 4: Performance Reporting

**User Story:** As a staff member, I want to submit weekly performance reports, so that my work is documented and reviewed.

#### Acceptance Criteria

1. THE Portal SHALL provide a performance report form with three distinct sections
2. WHEN a Staff_User fills the report form, THE Portal SHALL save it as a draft in local state
3. WHEN a Staff_User submits a draft report, THE Portal SHALL change the report status to submitted
4. THE Portal SHALL display all reports with their status: draft, submitted, or reviewed
5. WHEN a report is submitted, THE Portal SHALL include a timestamp
6. THE Portal SHALL allow Staff_User to edit draft reports
7. THE Portal SHALL prevent Staff_User from editing submitted reports

### Requirement 5: Internal Messaging System

**User Story:** As a staff member, I want to send and receive messages with colleagues, so that I can communicate internally.

#### Acceptance Criteria

1. THE Portal SHALL display messages in a three-column layout: conversations list, message thread, and details panel
2. WHEN a Staff_User sends a message, THE Portal SHALL add it to the Message_Thread with timestamp
3. THE Portal SHALL display all Message_Thread items for the authenticated user
4. WHEN a Staff_User selects a conversation, THE Portal SHALL display all messages in that thread
5. THE Portal SHALL mark messages as read when viewed
6. THE Portal SHALL display unread message count for each conversation
7. THE Portal SHALL support message encryption indicator in the UI

### Requirement 6: Staff Dashboard

**User Story:** As a staff member, I want to see my dashboard with key information, so that I can quickly understand my status and tasks.

#### Acceptance Criteria

1. THE Portal SHALL display a live clock showing current time
2. THE Portal SHALL display attendance metrics including total hours and days present
3. THE Portal SHALL display reward points for the authenticated user
4. THE Portal SHALL display upcoming classes or events
5. THE Portal SHALL display recent activity feed
6. WHEN the dashboard loads, THE Portal SHALL fetch data from mock JSON files within 100ms

### Requirement 7: Admin Analytics Dashboard

**User Story:** As an administrator, I want to view analytics and KPIs, so that I can monitor overall system performance.

#### Acceptance Criteria

1. WHERE the user is an Admin_User, THE Portal SHALL display the admin overview page
2. THE Portal SHALL display KPI cards showing total staff, attendance rate, and active reports
3. THE Portal SHALL render attendance trends chart using historical data
4. THE Portal SHALL render performance metrics chart using report data
5. THE Portal SHALL display a live activity feed showing recent system events
6. THE Portal SHALL update charts when data changes in local state

### Requirement 8: User Profile Management

**User Story:** As a staff member, I want to view and update my profile settings, so that my information is current.

#### Acceptance Criteria

1. THE Portal SHALL display user profile information including name, email, role, and department
2. WHEN a Staff_User updates profile fields, THE Portal SHALL save changes to local state
3. THE Portal SHALL display reward points and attendance statistics on the profile page
4. THE Portal SHALL allow users to change notification preferences
5. WHEN profile data is saved, THE Portal SHALL display a confirmation message

### Requirement 9: System Configuration

**User Story:** As a super administrator, I want to configure system settings, so that I can manage the portal behavior.

#### Acceptance Criteria

1. WHERE the user is a Super_Admin_User, THE Portal SHALL display the system configuration page
2. THE Portal SHALL display configuration options for attendance rules, reporting periods, and notification settings
3. WHEN a Super_Admin_User updates configuration, THE Portal SHALL save changes to local state
4. THE Portal SHALL validate configuration values before saving
5. WHEN invalid configuration is submitted, THE Portal SHALL display validation errors

### Requirement 10: Responsive Design

**User Story:** As a staff member using a mobile device, I want the portal to work on my phone, so that I can access it anywhere.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Portal SHALL display a collapsible sidebar
2. THE Portal SHALL render all pages with responsive layouts that adapt to screen size
3. THE Portal SHALL maintain functionality on touch devices
4. WHEN the sidebar is collapsed on mobile, THE Portal SHALL display a menu toggle button
5. THE Portal SHALL use mobile-optimized spacing and font sizes on small screens

### Requirement 11: Mock Data Management

**User Story:** As a developer, I want the portal to use mock data, so that it functions without a backend.

#### Acceptance Criteria

1. THE Portal SHALL load user data from users.json containing 4 demo users with different roles
2. THE Portal SHALL load report data from reports.json containing 3 reports with varying statuses
3. THE Portal SHALL load attendance data from attendance.json containing 30 days of records
4. THE Portal SHALL load message data from messages.json containing 3 conversations
5. THE Portal SHALL load analytics data from analytics.json containing KPIs and metrics
6. WHEN mock data is modified in the UI, THE Portal SHALL persist changes in local state only
7. WHEN the Portal is refreshed, THE Portal SHALL reload original mock data from JSON files

### Requirement 12: Design System Implementation

**User Story:** As a user, I want a visually appealing interface, so that the portal is pleasant to use.

#### Acceptance Criteria

1. THE Portal SHALL use a dark theme with background color #0a0e27
2. THE Portal SHALL use neon green #00ff41 for primary accents
3. THE Portal SHALL use cyan #00e5ff for secondary accents
4. THE Portal SHALL use magenta #ff00ff for tertiary accents
5. THE Portal SHALL apply glassmorphism effects to panel components
6. THE Portal SHALL apply subtle glow effects to interactive elements
7. THE Portal SHALL use consistent spacing, typography, and component styles across all pages

### Requirement 13: Navigation and Routing

**User Story:** As a staff member, I want to navigate between different pages, so that I can access all portal features.

#### Acceptance Criteria

1. THE Portal SHALL implement client-side routing using React Router v6
2. THE Portal SHALL display a sidebar navigation menu with links to all accessible pages
3. WHEN a user clicks a navigation link, THE Portal SHALL navigate to the target page without page reload
4. THE Portal SHALL highlight the active page in the navigation menu
5. WHEN a user navigates to an invalid route, THE Portal SHALL redirect to the dashboard
6. THE Portal SHALL maintain navigation state during the session

### Requirement 14: Data Visualization

**User Story:** As an administrator, I want to see charts and graphs, so that I can understand trends visually.

#### Acceptance Criteria

1. THE Portal SHALL render line charts for attendance trends using Recharts library
2. THE Portal SHALL render bar charts for performance metrics using Recharts library
3. THE Portal SHALL display chart legends and axis labels
4. THE Portal SHALL use theme-consistent colors in charts
5. WHEN chart data updates, THE Portal SHALL re-render the chart with new data
6. THE Portal SHALL display tooltips when hovering over chart data points

### Requirement 15: State Management

**User Story:** As a developer, I want centralized state management, so that data flows consistently through the application.

#### Acceptance Criteria

1. THE Portal SHALL use Zustand for global state management
2. THE Portal SHALL maintain authentication state in the global store
3. THE Portal SHALL maintain user data, reports, attendance, and messages in the global store
4. WHEN state changes occur, THE Portal SHALL update all subscribed components within 50ms
5. THE Portal SHALL provide actions for updating each state slice
6. THE Portal SHALL initialize state from mock JSON data on application load

### Requirement 16: Supabase Authentication Integration

**User Story:** As a staff member, I want to authenticate using Supabase, so that my credentials are validated against the database.

#### Acceptance Criteria

1. WHEN a user submits credentials, THE Portal SHALL query the Supabase users table to validate staff_id and password
2. WHEN credentials are valid, THE Portal SHALL create an authenticated session with user data from the database
3. WHEN credentials are invalid, THE Portal SHALL display an error message "Invalid staff ID or password"
4. THE Portal SHALL handle database connection errors gracefully with user-friendly messages
5. WHEN a user logs out, THE Portal SHALL clear the session and redirect to the login page
6. THE Portal SHALL maintain backward compatibility with existing UI and user experience

### Requirement 17: Supabase Data Persistence

**User Story:** As a developer, I want all data operations to use Supabase, so that data persists across sessions and devices.

#### Acceptance Criteria

1. THE Portal SHALL replace all localStorage.getItem calls with Supabase SELECT queries
2. THE Portal SHALL replace all localStorage.setItem calls with Supabase INSERT or UPDATE queries
3. THE Portal SHALL migrate lib/storage.ts functions to use the Supabase client from lib/supabase.ts
4. WHEN a database query fails, THE Portal SHALL display an error message and log the error
5. THE Portal SHALL maintain the same function signatures in lib/storage.ts for backward compatibility
6. THE Portal SHALL remove mock data initialization from localStorage

### Requirement 18: User Management with Supabase

**User Story:** As an administrator, I want to manage users through Supabase, so that user data is centrally stored.

#### Acceptance Criteria

1. WHEN getAllUsers is called, THE Portal SHALL query the Supabase users table
2. WHEN getUserByStaffId is called, THE Portal SHALL query users WHERE staff_id = ?
3. WHEN updateUser is called, THE Portal SHALL execute UPDATE users SET ... WHERE id = ?
4. WHEN addUser is called, THE Portal SHALL execute INSERT INTO users with default password '54321'
5. WHEN deleteUser is called, THE Portal SHALL execute DELETE FROM users WHERE id = ?
6. THE Portal SHALL handle unique constraint violations with appropriate error messages

### Requirement 19: Attendance Management with Supabase

**User Story:** As a staff member, I want my attendance records stored in Supabase, so that they persist reliably.

#### Acceptance Criteria

1. WHEN getAttendanceRecords is called, THE Portal SHALL query attendance_records table filtered by staff_id if provided
2. WHEN addAttendanceRecord is called, THE Portal SHALL INSERT INTO attendance_records
3. WHEN updateAttendanceRecord is called, THE Portal SHALL UPDATE attendance_records WHERE id = ?
4. THE Portal SHALL handle duplicate date entries with UNIQUE constraint error messages
5. THE Portal SHALL calculate total hours from check_in_time and check_out_time timestamps
6. THE Portal SHALL include approval_status field in all attendance queries

### Requirement 20: Weekly Reports Management with Supabase

**User Story:** As a staff member, I want my weekly reports stored in Supabase, so that they are accessible to reviewers.

#### Acceptance Criteria

1. WHEN getReports is called, THE Portal SHALL query weekly_reports table filtered by staff_id if provided
2. WHEN addReport is called, THE Portal SHALL INSERT INTO weekly_reports with status 'draft'
3. WHEN updateReport is called, THE Portal SHALL UPDATE weekly_reports WHERE id = ?
4. THE Portal SHALL set submitted_at timestamp when status changes to 'submitted'
5. THE Portal SHALL include approval_status, reviewed_by, and reviewed_at fields in queries
6. THE Portal SHALL prevent editing reports with status 'submitted' or 'approved'

### Requirement 21: Messaging System with Supabase

**User Story:** As a staff member, I want my messages stored in Supabase, so that I can access them from any device.

#### Acceptance Criteria

1. WHEN getMessages is called, THE Portal SHALL query messages WHERE sender_id = ? OR recipient_id = ?
2. WHEN addMessage is called, THE Portal SHALL INSERT INTO messages with read = false
3. WHEN markMessageAsRead is called, THE Portal SHALL UPDATE messages SET read = true WHERE id = ?
4. THE Portal SHALL order messages by created_at timestamp
5. THE Portal SHALL support filtering messages by sender and recipient
6. THE Portal SHALL handle message delivery failures with retry logic

### Requirement 22: System Configuration with Supabase

**User Story:** As a super administrator, I want system configuration stored in Supabase, so that settings are shared across all users.

#### Acceptance Criteria

1. WHEN getSystemConfig is called, THE Portal SHALL query the system_config table
2. WHEN updateSystemConfig is called, THE Portal SHALL UPDATE system_config SET ... WHERE id = ?
3. THE Portal SHALL validate configuration values before saving to database
4. THE Portal SHALL handle concurrent updates with optimistic locking
5. THE Portal SHALL display current values from database on config page load
6. THE Portal SHALL update updated_at timestamp on every configuration change

### Requirement 23: Approval Workflow for Attendance

**User Story:** As a Business Intelligence admin, I want to approve or reject attendance records, so that I can verify staff check-ins.

#### Acceptance Criteria

1. WHERE the user role is 'admin', THE Portal SHALL display a pending attendance approvals section
2. THE Portal SHALL query attendance_records WHERE approval_status = 'pending'
3. WHEN an admin clicks approve, THE Portal SHALL UPDATE attendance_records SET approval_status = 'approved', approved_by = ?, approved_at = NOW()
4. WHEN an admin clicks reject, THE Portal SHALL UPDATE attendance_records SET approval_status = 'rejected', approved_by = ?, approved_at = NOW()
5. THE Portal SHALL display approval status badges on attendance records
6. THE Portal SHALL filter attendance by approval_status (pending, approved, rejected)

### Requirement 24: Approval Workflow for Weekly Reports

**User Story:** As a Business Intelligence admin, I want to review and approve weekly reports, so that I can provide feedback to staff.

#### Acceptance Criteria

1. WHERE the user role is 'admin', THE Portal SHALL display a pending reports review section
2. THE Portal SHALL query weekly_reports WHERE approval_status = 'pending' AND status = 'submitted'
3. WHEN an admin clicks approve, THE Portal SHALL UPDATE weekly_reports SET approval_status = 'approved', reviewed_by = ?, reviewed_at = NOW()
4. WHEN an admin clicks reject, THE Portal SHALL UPDATE weekly_reports SET approval_status = 'rejected', reviewed_by = ?, reviewed_at = NOW()
5. THE Portal SHALL allow admins to add feedback text when reviewing reports
6. THE Portal SHALL display approval status and reviewer information on report details

### Requirement 25: Error Handling for Database Operations

**User Story:** As a user, I want clear error messages when database operations fail, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a database connection fails, THE Portal SHALL display "Unable to connect to database. Please try again."
2. WHEN a query times out, THE Portal SHALL display "Request timed out. Please check your connection."
3. WHEN a unique constraint is violated, THE Portal SHALL display "This record already exists."
4. WHEN a foreign key constraint fails, THE Portal SHALL display "Referenced record not found."
5. THE Portal SHALL log all database errors to the console for debugging
6. THE Portal SHALL provide a retry button for failed operations

### Requirement 26: Department Management with Supabase

**User Story:** As an administrator, I want to manage departments through Supabase, so that department data is centrally stored.

#### Acceptance Criteria

1. THE Portal SHALL query the departments table for all department operations
2. WHEN an admin creates a department, THE Portal SHALL INSERT INTO departments
3. WHEN an admin updates a department, THE Portal SHALL UPDATE departments WHERE id = ?
4. WHEN an admin deletes a department, THE Portal SHALL UPDATE departments SET status = 'inactive'
5. THE Portal SHALL display department head and status in department listings
6. THE Portal SHALL validate department names for uniqueness before saving

### Requirement 27: Real-time Updates for Messages (Optional)

**User Story:** As a staff member, I want to see new messages in real-time, so that I can respond quickly.

#### Acceptance Criteria

1. THE Portal SHALL subscribe to Supabase real-time changes on the messages table
2. WHEN a new message is inserted, THE Portal SHALL update the UI without page refresh
3. WHEN a message is marked as read, THE Portal SHALL update the read status in real-time
4. THE Portal SHALL filter real-time updates to only messages for the authenticated user
5. THE Portal SHALL handle connection drops and reconnect automatically
6. THE Portal SHALL display a connection status indicator

### Requirement 28: Real-time Updates for Approvals (Optional)

**User Story:** As a staff member, I want to see approval status changes in real-time, so that I know when my submissions are reviewed.

#### Acceptance Criteria

1. THE Portal SHALL subscribe to Supabase real-time changes on attendance_records and weekly_reports
2. WHEN approval_status changes, THE Portal SHALL update the UI without page refresh
3. THE Portal SHALL filter real-time updates to only records for the authenticated user
4. THE Portal SHALL display a notification when an approval status changes
5. THE Portal SHALL update approval badges and status indicators in real-time
6. THE Portal SHALL handle subscription cleanup on component unmount
