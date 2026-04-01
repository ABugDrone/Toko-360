# Implementation Plan: Approved Reports Viewer

## Overview

This implementation plan creates a dedicated interface for viewing, managing, and sharing approved reports with role-based access control. The feature integrates with the existing Next.js staff portal, leveraging Supabase for real-time data synchronization and the existing messaging system for report sharing.

## Tasks

- [x] 1. Set up database schema and TypeScript interfaces
  - [x] 1.1 Create report_edit_approvals table migration
    - Write Supabase migration to create report_edit_approvals table with indexes
    - Include foreign key constraints to weekly_reports and users tables
    - _Requirements: 6.1, 6.2_
  
  - [x] 1.2 Create TypeScript interfaces for data models
    - Define ReportEditApproval, ApprovedReportWithAuthor, ReportFilterParams, PaginatedReportsResponse interfaces
    - Add to appropriate types file (e.g., lib/types/reports.ts)
    - _Requirements: 1.1, 2.1, 8.1, 9.1, 10.1, 11.1, 12.1_

- [x] 2. Implement core API functions
  - [x] 2.1 Implement getApprovedReports function
    - Create function in lib/api/reports.ts with role-based filtering
    - Implement all filter parameters (date range, week, year, name, department, author)
    - Add pagination support with metadata
    - Join with users table for author information
    - _Requirements: 1.1, 2.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1_
  
  - [x] 2.2 Write property tests for getApprovedReports
    - **Property 1: Admin Access to All Approved Reports**
    - **Property 2: Staff Access to Permitted Reports**
    - **Property 12: Date Range Filter Accuracy**
    - **Property 13: Week Filter Accuracy**
    - **Property 14: Year Filter Accuracy**
    - **Property 16: Name Filter Substring Matching**
    - **Property 17: Name Filter Case Insensitivity**
    - **Property 18: Department Filter Accuracy**
    - **Property 20: Author Filter Matching**
    - **Property 21: Author Filter Case Insensitivity**
    - **Property 22: Author Filter Full Name Matching**
    - **Property 23: Multiple Filter AND Logic**
    - **Property 24: Filter Result Count Accuracy**
    - **Validates: Requirements 1.1, 2.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 13.3**
  
  - [x] 2.3 Implement checkEditPermission function
    - Create function to check admin own-report permission
    - Check staff edit approval with expiration validation
    - Return structured response with canEdit boolean and reason
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_
  
  - [x] 2.4 Write property tests for checkEditPermission
    - **Property 9: Admin Edit Permission**
    - **Property 10: Staff Edit Permission**
    - **Validates: Requirements 5.1, 5.2, 6.2, 6.3**
  
  - [x] 2.5 Implement downloadReport function
    - Create function to fetch report and generate download file
    - Generate timestamped filename in format {reportName}_{timestamp}.{extension}
    - Convert rich content to appropriate format (HTML/JSON)
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 2.6 Write property tests for downloadReport
    - **Property 7: Download Format Preservation**
    - **Property 8: Download Filename Generation**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 2.7 Implement shareReportViaMessaging function
    - Create function to generate report link and message content
    - Integrate with existing messaging API (addMessage)
    - Include report ID, name, and clickable link in message
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 2.8 Write property tests for shareReportViaMessaging
    - **Property 11: Share Message Content**
    - **Validates: Requirements 7.2, 7.3**

- [x] 3. Checkpoint - Ensure API functions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement real-time subscription hook
  - [x] 4.1 Create useRealtimeApprovedReports hook
    - Implement Supabase real-time subscription for weekly_reports table
    - Filter for approval_status = 'approved' events
    - Apply role-based filtering for events
    - Provide connection state (isConnected, isReconnecting)
    - Handle reconnection with exponential backoff
    - _Requirements: 1.1, 2.1_
  
  - [x] 4.2 Write unit tests for useRealtimeApprovedReports
    - Test subscription setup and teardown
    - Test role-based event filtering
    - Test reconnection logic
    - _Requirements: 1.1, 2.1_

- [ ] 5. Implement core UI components
  - [x] 5.1 Create ReportCard component
    - Display report name, department, author name, approval date
    - Render action buttons (preview, download, edit, share) based on permissions
    - Handle action button click callbacks
    - Use shadcn/ui Card component
    - _Requirements: 1.2, 2.2, 3.1, 4.1, 5.1, 6.1, 7.1_
  
  - [x] 5.2 Write unit tests for ReportCard
    - Test metadata display completeness
    - Test action button visibility based on permissions
    - Test action callbacks
    - _Requirements: 1.2, 2.2_
  
  - [x] 5.3 Create ReportPreview component
    - Render report content in read-only modal
    - Use shadcn/ui Dialog component
    - Preserve TipTap JSON formatting
    - Display all report fields (rich content, media links, metadata)
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.4 Write property tests for ReportPreview
    - **Property 5: Preview Content Completeness**
    - **Property 6: Preview Format Preservation**
    - **Validates: Requirements 3.2, 3.3**
  
  - [x] 5.5 Create ReportFilters component
    - Implement date range picker (reuse existing date-range-picker component)
    - Implement week/year selectors
    - Implement name search with 300ms debounce
    - Implement department dropdown with role-based options
    - Implement author search with 300ms debounce
    - Add clear filters button
    - Display active filter count
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.2, 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 14.1, 14.2, 14.3_
  
  - [x] 5.6 Write property tests for ReportFilters
    - **Property 15: ISO 8601 Week Calculation**
    - **Property 19: Staff Department Filter Options**
    - **Validates: Requirements 9.3, 11.3**
  
  - [x] 5.7 Create ShareReportDialog component
    - Implement user selection interface
    - Pre-populate message with report reference
    - Integrate with shareReportViaMessaging API
    - Use shadcn/ui Dialog component
    - Display success/error feedback
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 5.8 Write unit tests for ShareReportDialog
    - Test user selection
    - Test message pre-population
    - Test share success/error handling
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Implement main list component
  - [x] 6.1 Create ApprovedReportsList component
    - Fetch approved reports using getApprovedReports API
    - Integrate useRealtimeApprovedReports hook for live updates
    - Manage filter state and pass to ReportFilters
    - Implement pagination controls
    - Render ReportCard components for each report
    - Handle preview, download, edit, share actions
    - Display loading, empty, and error states
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1, 6.1, 7.1, 13.1, 13.2_
  
  - [x] 6.2 Write property tests for ApprovedReportsList
    - **Property 3: Report Card Display Completeness**
    - **Property 4: Pagination Correctness**
    - **Validates: Requirements 1.2, 1.3, 2.2, 2.3**
  
  - [x] 6.3 Write unit tests for ApprovedReportsList
    - Test empty state display
    - Test loading state display
    - Test error handling and retry
    - Test real-time update integration
    - Test filter state management
    - _Requirements: 1.1, 2.1, 13.1, 13.2_

- [x] 7. Checkpoint - Ensure components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create page routes
  - [x] 8.1 Create admin approved reports page
    - Create /app/(protected)/admin/reports/approved/page.tsx
    - Fetch user authentication and role
    - Render ApprovedReportsList with userRole='admin'
    - Add page metadata and title
    - _Requirements: 1.1, 15.3_
  
  - [x] 8.2 Create staff approved reports page
    - Create /app/(protected)/reports/approved/page.tsx
    - Fetch user authentication and role
    - Render ApprovedReportsList with userRole='staff'
    - Add page metadata and title
    - _Requirements: 2.1, 15.2_
  
  - [x] 8.3 Write unit tests for page routes
    - Test admin page renders with correct props
    - Test staff page renders with correct props
    - Test authentication requirement
    - _Requirements: 1.1, 2.1, 15.2, 15.3_

- [x] 9. Update navigation menu
  - [x] 9.1 Add approved reports link to navigation
    - Update sidebar/navigation component to include "Approved Reports" menu item
    - Place under Reports dropdown section
    - Route to /reports/approved for staff, /admin/reports/approved for admin
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [x] 9.2 Write unit tests for navigation updates
    - Test menu item visibility based on role
    - Test correct route navigation
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 10. Implement error handling
  - [x] 10.1 Add error handling to API functions
    - Implement mapDatabaseError utility for user-friendly error messages
    - Add try-catch blocks with appropriate error responses
    - Log errors for debugging
    - _Requirements: All requirements (error handling is cross-cutting)_
  
  - [x] 10.2 Add error handling to components
    - Display error toasts using existing toast system
    - Provide retry functionality for transient errors
    - Show permission denial messages with guidance
    - Display connection status for real-time subscription
    - _Requirements: All requirements (error handling is cross-cutting)_
  
  - [x] 10.3 Write unit tests for error scenarios
    - Test database connection failures
    - Test permission denied scenarios
    - Test invalid filter parameters
    - Test download generation errors
    - Test real-time subscription failures
    - _Requirements: All requirements (error handling is cross-cutting)_

- [x] 11. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples, edge cases, and error conditions
- The design uses TypeScript, so all implementation will be in TypeScript
- Leverage existing components: rich-text-editor, date-range-picker, shadcn/ui components
- Integrate with existing systems: Supabase backend, messaging feature
- Real-time updates provide live synchronization of approved reports
