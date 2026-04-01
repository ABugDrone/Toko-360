# Implementation Plan: Toko 360 Staff Portal - Supabase Backend Migration

## Overview

This implementation plan migrates the Toko 360 Staff Portal from localStorage-based data persistence to Supabase backend. The migration maintains all existing UI/UX while replacing the data layer with Supabase queries. Key additions include authentication against the database, approval workflows for Business Intelligence admins, and optional real-time features.

## Tasks

- [x] 1. Migrate storage layer to Supabase
  - [x] 1.1 Create Supabase database service layer
    - Create lib/supabase-service.ts with typed query functions
    - Implement error handling wrapper for all database operations
    - Add TypeScript interfaces matching database schema
    - _Requirements: 16.4, 17.4, 25.1, 25.2, 25.5_

  - [x] 1.2 Migrate authentication functions to Supabase
    - Update login function to query users table with staff_id and password
    - Replace mock authentication with database validation
    - Maintain session management in auth-context.tsx
    - Add error handling for invalid credentials and connection errors
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.6_

  - [x] 1.3 Migrate user management functions to Supabase
    - Replace getAllUsers with SELECT * FROM users query
    - Replace getUserByStaffId with SELECT WHERE staff_id = ? query
    - Replace getUserById with SELECT WHERE id = ? query
    - Replace updateUser with UPDATE users query
    - Replace addUser with INSERT INTO users query (default password '54321')
    - Replace deleteUser with DELETE FROM users query
    - _Requirements: 17.1, 17.2, 17.3, 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 1.4 Migrate attendance functions to Supabase
    - Replace getAttendanceRecords with SELECT FROM attendance_records query
    - Replace addAttendanceRecord with INSERT INTO attendance_records query
    - Replace updateAttendanceRecord with UPDATE attendance_records query
    - Add approval_status field handling in all queries
    - Handle UNIQUE constraint for duplicate date entries
    - _Requirements: 17.1, 17.2, 19.1, 19.2, 19.3, 19.4, 19.6_

  - [x] 1.5 Migrate reports functions to Supabase
    - Replace getReports with SELECT FROM weekly_reports query
    - Replace addReport with INSERT INTO weekly_reports query (status 'draft')
    - Replace updateReport with UPDATE weekly_reports query
    - Add submitted_at timestamp when status changes to 'submitted'
    - Include approval_status, reviewed_by, reviewed_at fields
    - _Requirements: 17.1, 17.2, 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 1.6 Migrate messaging functions to Supabase
    - Replace getMessages with SELECT FROM messages query
    - Replace addMessage with INSERT INTO messages query (read = false)
    - Replace markMessageAsRead with UPDATE messages SET read = true query
    - Add ORDER BY created_at for message ordering
    - Support filtering by sender_id and recipient_id
    - _Requirements: 17.1, 17.2, 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 1.7 Migrate system config functions to Supabase
    - Replace getSystemConfig with SELECT FROM system_config query
    - Replace updateSystemConfig with UPDATE system_config query
    - Add updated_at timestamp on every update
    - Validate configuration values before saving
    - _Requirements: 17.1, 17.2, 22.1, 22.2, 22.3, 22.6_

  - [x] 1.8 Remove localStorage initialization and mock data dependencies
    - Remove initializeStorage function calls
    - Remove localStorage.setItem calls for mock data
    - Update imports to remove mock data references where no longer needed
    - Keep lib/storage.ts function signatures for backward compatibility
    - _Requirements: 17.3, 17.5, 17.6_

- [x] 2. Update authentication system
  - [x] 2.1 Update login page to use Supabase authentication
    - Modify app/page.tsx login handler to call new Supabase auth function
    - Add loading state during authentication
    - Display database connection errors with user-friendly messages
    - Maintain existing UI and error display patterns
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.6_

  - [x] 2.2 Update auth context to use Supabase session
    - Modify app/auth-context.tsx login function to use Supabase queries
    - Keep session storage in localStorage for client-side persistence
    - Update logout to clear session properly
    - Maintain isAuthenticated and isLoading states
    - _Requirements: 16.1, 16.5, 17.3_

  - [x] 2.3 Add authentication error handling tests
    - Test invalid credentials error display
    - Test database connection failure handling
    - Test session expiration handling
    - _Requirements: 16.3, 16.4, 25.1_

- [x] 3. Update dashboard and attendance components
  - [x] 3.1 Update dashboard to fetch data from Supabase
    - Modify dashboard page to call Supabase service functions
    - Add loading states for data fetching
    - Handle query errors with error messages
    - Maintain existing dashboard layout and metrics
    - _Requirements: 17.1, 17.4, 19.1_

  - [x] 3.2 Update attendance clock component to use Supabase
    - Modify components/dashboard/attendance-clock.tsx check-in/check-out handlers
    - Call addAttendanceRecord and updateAttendanceRecord with Supabase
    - Add error handling for duplicate check-ins
    - Display success/error messages to user
    - _Requirements: 19.2, 19.3, 19.4, 25.3_

  - [x] 3.3 Update attendance history page to use Supabase
    - Modify attendance page to fetch records from Supabase
    - Display approval_status badges (pending, approved, rejected)
    - Add loading and error states
    - Maintain existing calendar and table views
    - _Requirements: 19.1, 19.6, 23.5_

- [x] 4. Update reports components
  - [x] 4.1 Update reports list page to use Supabase
    - Modify reports list to fetch from Supabase
    - Display approval_status and reviewed_by information
    - Add loading and error states
    - Maintain existing table and filter functionality
    - _Requirements: 20.1, 20.5, 24.6_

  - [x] 4.2 Update new report form to use Supabase
    - Modify report creation to INSERT via Supabase
    - Update report submission to set submitted_at timestamp
    - Add error handling for save and submit operations
    - Prevent editing submitted reports
    - _Requirements: 20.2, 20.3, 20.4, 20.6_

  - [x] 4.3 Add report validation tests
    - Test draft save functionality
    - Test submit with timestamp
    - Test prevention of editing submitted reports
    - _Requirements: 20.4, 20.6_

- [x] 5. Update messaging components
  - [x] 5.1 Update messaging page to use Supabase
    - Modify messaging page to fetch messages from Supabase
    - Update send message to INSERT via Supabase
    - Update mark as read to use Supabase UPDATE
    - Add error handling for message operations
    - Maintain three-column layout and existing UI
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [x] 5.2 Add message ordering and filtering
    - Implement ORDER BY created_at in message queries
    - Add filtering by sender_id and recipient_id
    - Update conversation list to show latest messages
    - _Requirements: 21.4, 21.5_

- [x] 6. Update profile and user management
  - [x] 6.1 Update profile page to use Supabase
    - Modify profile page to fetch user data from Supabase
    - Update profile save to use Supabase UPDATE
    - Add error handling for update operations
    - Display success confirmation on save
    - _Requirements: 18.3, 17.4, 25.1_

  - [x] 6.2 Update admin staff directory to use Supabase
    - Modify staff directory to fetch all users from Supabase
    - Update add user to INSERT with default password '54321'
    - Update edit user to use Supabase UPDATE
    - Update delete user to use Supabase DELETE
    - Add error handling for unique constraint violations
    - _Requirements: 18.1, 18.4, 18.5, 18.6, 25.3_

- [x] 7. Implement approval workflows for Business Intelligence admin
  - [x] 7.1 Create attendance approval component
    - Create new component for pending attendance approvals
    - Query attendance_records WHERE approval_status = 'pending'
    - Add approve button that updates approval_status to 'approved'
    - Add reject button that updates approval_status to 'rejected'
    - Set approved_by to current user staff_id and approved_at to NOW()
    - Display in admin dashboard for users with role 'admin'
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

  - [x] 7.2 Create weekly reports review component
    - Create new component for pending report reviews
    - Query weekly_reports WHERE approval_status = 'pending' AND status = 'submitted'
    - Add approve button that updates approval_status to 'approved'
    - Add reject button that updates approval_status to 'rejected'
    - Set reviewed_by to current user staff_id and reviewed_at to NOW()
    - Add feedback textarea for admin comments
    - Display in admin dashboard for users with role 'admin'
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [x] 7.3 Add approval status filters and badges
    - Add filter dropdown for approval_status (all, pending, approved, rejected)
    - Display approval status badges with color coding
    - Show reviewer name and review date on approved/rejected items
    - Update attendance and reports lists to show approval information
    - _Requirements: 23.5, 23.6, 24.6_

  - [x] 7.4 Integrate approval sections into admin dashboard
    - Add "Pending Approvals" section to admin overview page
    - Display count of pending attendance approvals
    - Display count of pending report reviews
    - Add quick links to approval pages
    - _Requirements: 23.1, 24.1_

- [x] 8. Implement department management
  - [x] 8.1 Create departments management page (admin only)
    - Create new page for department CRUD operations
    - Query departments table for all departments
    - Display department list with name, head, and status
    - Add create department form with validation
    - _Requirements: 26.1, 26.2, 26.6_

  - [x] 8.2 Add department edit and delete functionality
    - Add edit button that opens modal with department form
    - Update department with UPDATE departments query
    - Add delete button that sets status to 'inactive'
    - Validate department name uniqueness
    - _Requirements: 26.3, 26.4, 26.5, 26.6_

- [x] 9. Add comprehensive error handling
  - [x] 9.1 Implement error handling utilities
    - Create error handling utility functions in lib/error-handler.ts
    - Map database error codes to user-friendly messages
    - Add retry logic for transient failures
    - Log errors to console for debugging
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

  - [x] 9.2 Add error UI components
    - Create error toast/notification component
    - Add retry button for failed operations
    - Display connection status indicator
    - Add error boundaries for component-level errors
    - _Requirements: 25.1, 25.2, 25.6_

  - [x] 9.3 Update all components with error handling
    - Wrap all Supabase queries with try-catch blocks
    - Display appropriate error messages for each operation
    - Add loading states during async operations
    - Provide user feedback for all database operations
    - _Requirements: 17.4, 25.1, 25.2, 25.5_

- [x] 10. Checkpoint - Test core functionality
  - Ensure all tests pass, verify authentication works with database, test CRUD operations for all entities, ask the user if questions arise.

- [ ] 11. Implement real-time features (Optional)
  - [x] 11.1 Add real-time messaging updates
    - Subscribe to Supabase real-time changes on messages table
    - Filter updates to authenticated user's messages
    - Update UI when new messages arrive
    - Update read status in real-time
    - Handle connection drops and reconnection
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

  - [x] 11.2 Add real-time approval status updates
    - Subscribe to Supabase real-time changes on attendance_records
    - Subscribe to Supabase real-time changes on weekly_reports
    - Filter updates to authenticated user's records
    - Update approval badges and status in real-time
    - Display notification when approval status changes
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5_

  - [x] 11.3 Add connection status indicator
    - Create connection status component
    - Display online/offline status
    - Show reconnecting state during connection issues
    - Handle subscription cleanup on unmount
    - _Requirements: 27.5, 27.6, 28.6_

- [x] 12. Update admin analytics dashboard
  - [x] 12.1 Update KPI calculations to use Supabase data
    - Query attendance_records for attendance rate calculation
    - Query weekly_reports for active reports count
    - Query users for total staff count
    - Update KPI cards with real database metrics
    - _Requirements: 17.1, 19.1, 20.1_

  - [x] 12.2 Update charts to use Supabase data
    - Fetch attendance velocity data from attendance_records
    - Fetch performance metrics from weekly_reports
    - Update Recharts components with database data
    - Add loading states for chart data
    - _Requirements: 17.1, 19.1, 20.1_

  - [x] 12.3 Update activity feed to use Supabase data
    - Query recent attendance_records for activity feed
    - Order by created_at DESC
    - Display real-time check-ins and status changes
    - Add pagination for activity feed
    - _Requirements: 17.1, 19.1_

- [x] 13. Final testing and cleanup
  - [x] 13.1 Remove all localStorage mock data code
    - Remove mock data imports from components
    - Remove initializeStorage calls
    - Clean up unused mock data files (optional)
    - Verify no localStorage calls remain except for session
    - _Requirements: 17.6_

  - [x] 13.2 Add loading states to all data-fetching components
    - Add skeleton loaders for dashboard
    - Add loading spinners for lists and tables
    - Add loading states for forms during submission
    - Ensure smooth UX during data fetching
    - _Requirements: 17.4_

  - [x] 13.3 Test all user roles and permissions
    - Test staff role access and functionality
    - Test admin role with approval workflows
    - Test dept_head role access
    - Test super_admin role with system config
    - Verify role-based UI rendering
    - _Requirements: 16.1, 23.1, 24.1_

  - [x] 13.4 Write integration tests for critical flows
    - Test login flow with database
    - Test attendance check-in/check-out flow
    - Test report creation and submission flow
    - Test approval workflows
    - _Requirements: 16.1, 19.2, 20.2, 23.3, 24.3_

- [x] 14. Final checkpoint - Complete migration verification
  - Ensure all tests pass, verify all features work with Supabase, test error handling and edge cases, confirm UI/UX unchanged, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Real-time features (section 11) are optional enhancements
- All existing UI/UX must remain unchanged during migration
- Default password for all users is '54321' (plain text for demo purposes)
- Business Intelligence admin role has access to approval workflows
- Error handling is critical for production readiness
