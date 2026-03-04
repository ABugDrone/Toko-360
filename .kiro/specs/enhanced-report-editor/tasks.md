# Implementation Plan: Enhanced Report Editor

## Overview

This implementation transforms the Internal Reports page from a basic three-textarea form into a professional, Word-like document creation experience. The implementation focuses on Word document format only with a unified rich text editor, interactive calendar date picker, and maintained media links functionality. All existing features (approval workflows, real-time updates) are preserved.

## Tasks

- [x] 1. Database migration and schema updates
  - Create migration script to add new columns (rich_content, format_type, start_date, end_date)
  - Add database indexes for date range and format type queries
  - Add check constraint for format_type values
  - Test migration on development database
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 2. Install dependencies and update type definitions
  - Install TipTap packages (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-text-align, @tiptap/extension-placeholder, @tiptap/extension-character-count)
  - Update WeeklyReport interface to include richContent, formatType, startDate, endDate fields
  - Update DbWeeklyReport interface for database mapping
  - Create type definitions for TipTap JSONContent
  - _Requirements: 2.9, 3.1, 9.1, 9.2, 9.3_

- [x] 3. Implement data serialization and backward compatibility
  - [x] 3.1 Create serialization functions for TipTap JSON content
    - Implement reportToDbReport function to convert WeeklyReport to database format
    - Implement dbReportToReport function to convert database format to WeeklyReport
    - Add extractPlainText helper to populate legacy fields (summary, challenges, goals)
    - _Requirements: 2.9, 3.2, 3.4_

  - [ ]* 3.2 Write property test for serialization round-trip
    - **Property 3: Rich Content Formatting Round-Trip**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 3.2, 3.3**

  - [x] 3.3 Create legacy report conversion function
    - Implement convertLegacyToRichContent to transform plain text to TipTap JSON
    - Handle three sections: Weekly Summary, Challenges, Future Goals
    - Create proper heading and paragraph structure
    - _Requirements: 3.4, 3.5_

  - [ ]* 3.4 Write property test for legacy conversion
    - **Property 4: Legacy Report Conversion**
    - **Validates: Requirements 3.4, 3.5**

- [x] 4. Create DateRangePicker component
  - [x] 4.1 Implement calendar interface with react-day-picker
    - Set up react-day-picker with range selection mode
    - Configure week selection logic (7 consecutive days)
    - Apply dark theme styling (slate-900/slate-800 backgrounds, cyan accents)
    - _Requirements: 1.1, 1.2, 7.1, 7.5, 7.6_

  - [x] 4.2 Add date formatting and validation
    - Implement date formatting as "MMM DD - MMM DD, YYYY" (e.g., "OCT 28 - NOV 03, 2024")
    - Add validation to ensure exactly 7 consecutive days
    - Display validation error for invalid ranges
    - _Requirements: 1.3, 1.6, 12.1, 12.4_

  - [x] 4.3 Integrate with form state
    - Create DateRangePickerProps interface with value and onChange
    - Store formatted string in week field
    - Store start_date and end_date separately for database
    - Handle loading existing date ranges for edit mode
    - _Requirements: 1.4, 1.5, 1.7_

  - [ ]* 4.4 Write property test for date formatting
    - **Property 1: Date Range Formatting Consistency**
    - **Validates: Requirements 1.3, 1.6**

  - [ ]* 4.5 Write property test for date persistence
    - **Property 2: Date Range Round-Trip Persistence**
    - **Validates: Requirements 1.5, 1.7**

  - [ ]* 4.6 Write unit tests for DateRangePicker
    - Test calendar interface renders
    - Test week selection updates form state
    - Test validation error display for invalid ranges
    - Test loading existing date range in edit mode

- [x] 5. Create RichTextEditor component with TipTap
  - [x] 5.1 Set up TipTap editor instance
    - Initialize useEditor hook with StarterKit extension
    - Configure heading levels (H1, H2, H3)
    - Enable bullet lists and numbered lists
    - Add TextAlign extension for alignment controls
    - Add Placeholder extension with default text
    - Add CharacterCount extension with 50,000 character limit
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 11.5_

  - [x] 5.2 Implement editor content handling
    - Create RichTextEditorProps interface with content, onChange, formatType
    - Handle content prop to initialize editor with existing content
    - Handle onChange callback to update parent form state
    - Implement proper cleanup on component unmount
    - _Requirements: 2.8, 2.9, 2.10_

  - [x] 5.3 Add character count display and validation
    - Display character count indicator below editor
    - Show warning when approaching limit
    - Prevent input when limit exceeded
    - Display validation error message
    - _Requirements: 11.5, 12.3_

  - [ ]* 5.4 Write property test for content validation
    - **Property 5: Content Size Validation**
    - **Validates: Requirements 3.6, 12.3**

  - [ ]* 5.5 Write unit tests for RichTextEditor
    - Test editor initializes with empty content
    - Test editor loads existing content
    - Test character count updates on typing
    - Test validation error when limit exceeded

- [x] 6. Create EditorToolbar component
  - [x] 6.1 Implement text formatting controls
    - Add Bold, Italic, Underline buttons
    - Add Heading level buttons (H1, H2, H3)
    - Wire buttons to TipTap editor commands
    - Add active state highlighting for current formatting
    - _Requirements: 2.4, 8.2, 8.3, 8.8, 8.9_

  - [x] 6.2 Implement alignment and list controls
    - Add alignment buttons (left, center, right, justify)
    - Add bullet list and numbered list buttons
    - Wire buttons to TipTap editor commands
    - Add active state highlighting
    - _Requirements: 2.5, 2.6, 8.5, 8.6, 8.8, 8.9_

  - [x] 6.3 Add toolbar styling and accessibility
    - Apply dark theme styling (slate-900 background, cyan accents)
    - Add ARIA labels to all toolbar buttons
    - Add tooltips with keyboard shortcuts
    - Implement keyboard navigation through toolbar
    - _Requirements: 7.5, 7.6, 8.1, 13.1, 13.2, 13.5_

  - [ ]* 6.4 Write property test for toolbar formatting
    - **Property 13: Toolbar Formatting Application**
    - **Validates: Requirements 8.8**

  - [ ]* 6.5 Write property test for toolbar active state
    - **Property 14: Toolbar Active State Reflection**
    - **Validates: Requirements 8.9**

  - [ ]* 6.6 Write unit tests for EditorToolbar
    - Test all toolbar buttons render
    - Test clicking bold button applies bold formatting
    - Test active state highlights when text is bold
    - Test tooltips display on button focus

- [x] 7. Update storage layer for rich content
  - [x] 7.1 Update addReport function in supabase-service.ts
    - Serialize richContent to JSONB format
    - Store formatType (default 'word')
    - Store startDate and endDate
    - Extract and store plain text in legacy fields for backward compatibility
    - Handle validation errors
    - _Requirements: 2.9, 3.1, 3.2, 3.4_

  - [x] 7.2 Update updateReport function in supabase-service.ts
    - Handle partial updates to richContent
    - Update legacy fields when richContent changes
    - Preserve existing fields when not updated
    - _Requirements: 2.9, 3.2, 3.3_

  - [x] 7.3 Update getReports function in supabase-service.ts
    - Fetch richContent from database
    - Deserialize JSONB to TipTap JSONContent
    - Handle legacy reports without richContent (convert on load)
    - _Requirements: 2.10, 3.3, 3.5_

  - [ ]* 7.4 Write integration tests for storage layer
    - Test saving report with rich content
    - Test loading report and deserializing content
    - Test updating existing report
    - Test loading legacy report and converting to rich content

- [x] 8. Integrate components into ReportsPage
  - [x] 8.1 Update report form layout
    - Replace three text areas with DateRangePicker at top
    - Add RichTextEditor below date picker
    - Keep MediaLinksManager below editor (no changes to existing component)
    - Keep submit and cancel buttons at bottom
    - Remove document type selector (Word format only)
    - _Requirements: 2.1, 7.1, 7.2, 7.3, 7.4_

  - [x] 8.2 Wire form state management
    - Create form state with week, startDate, endDate, richContent, formatType (default 'word')
    - Handle DateRangePicker onChange to update dates
    - Handle RichTextEditor onChange to update content
    - Handle MediaLinksManager changes (existing functionality)
    - _Requirements: 1.2, 1.3, 2.8, 5.2_

  - [x] 8.3 Implement form validation
    - Validate date range is selected before submit
    - Validate rich content is not empty before submit
    - Validate content size does not exceed limit
    - Display validation errors with specific messages
    - Block form submission until errors resolved
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_

  - [ ]* 8.4 Write property test for form validation
    - **Property 16: Form Validation Blocking**
    - **Validates: Requirements 12.6**

  - [ ]* 8.5 Write unit tests for form integration
    - Test form displays all components in correct order
    - Test form state updates when components change
    - Test validation errors display correctly
    - Test submit button disabled when validation fails

- [ ] 9. Implement auto-save functionality
  - [ ] 9.1 Create auto-save hook with localStorage
    - Implement useAutoSave hook with 30-second interval
    - Save content to localStorage with timestamp
    - Store auto-save data with report ID as key
    - _Requirements: 14.1, 14.5_

  - [ ] 9.2 Add auto-save recovery on page load
    - Check localStorage for auto-saved content on form open
    - Restore content if found and less than 24 hours old
    - Display indicator showing content was recovered
    - _Requirements: 14.2_

  - [ ] 9.3 Implement auto-save cleanup
    - Clear localStorage on successful report submission
    - Prompt user to confirm before discarding auto-saved changes on cancel
    - Clean up old auto-saves (>24 hours) periodically
    - _Requirements: 14.3, 14.4_

  - [ ] 9.4 Add auto-save status indicator
    - Display "Last saved: X minutes ago" below editor
    - Update timestamp after each auto-save
    - Show saving indicator during save operation
    - _Requirements: 14.5_

  - [ ]* 9.5 Write property test for auto-save round-trip
    - **Property 23: Auto-Save Recovery Round-Trip**
    - **Validates: Requirements 14.2**

  - [ ]* 9.6 Write unit tests for auto-save
    - Test content saves to localStorage every 30 seconds
    - Test content recovers on page reload
    - Test localStorage clears on successful submit
    - Test confirmation prompt on cancel with unsaved changes

- [ ] 10. Implement responsive design
  - [ ] 10.1 Add responsive layout for mobile (<768px)
    - Stack all form elements vertically
    - Make toolbar collapsible or use dropdown menu
    - Optimize date picker for mobile (touch-friendly)
    - Increase touch target sizes to minimum 44x44px
    - _Requirements: 10.1, 10.4, 10.5, 10.6_

  - [ ] 10.2 Add responsive layout for tablet (768px-1024px)
    - Adapt toolbar to wrap if needed
    - Maintain vertical stacking for form elements
    - Ensure editor remains usable
    - _Requirements: 10.2, 10.6_

  - [ ] 10.3 Optimize desktop layout (>1024px)
    - Display full toolbar horizontally
    - Set maximum editor width to 1200px
    - Maintain existing dark theme styling
    - _Requirements: 10.3, 7.5, 7.6_

  - [ ]* 10.4 Write unit tests for responsive design
    - Test mobile layout renders correctly
    - Test tablet layout renders correctly
    - Test desktop layout renders correctly
    - Test toolbar collapses on mobile

- [ ] 11. Add accessibility features
  - [ ] 11.1 Implement keyboard navigation
    - Add keyboard shortcuts for formatting (Ctrl+B, Ctrl+I, Ctrl+U)
    - Add keyboard shortcuts for headings (Ctrl+Alt+1/2/3)
    - Add keyboard shortcuts for lists (Ctrl+Shift+L/O)
    - Ensure tab order flows logically through form elements
    - _Requirements: 13.1, 13.3, 13.6_

  - [ ] 11.2 Add ARIA labels and screen reader support
    - Add ARIA labels to all interactive elements
    - Add role attributes to toolbar and editor
    - Implement screen reader announcements for formatting changes
    - Add aria-pressed states to toolbar buttons
    - _Requirements: 13.2, 13.7_

  - [ ] 11.3 Add tooltips and focus indicators
    - Add tooltips to all toolbar buttons showing function and keyboard shortcut
    - Display tooltips on focus (keyboard) and hover (mouse)
    - Add visible focus indicators for keyboard navigation
    - _Requirements: 13.5_

  - [ ]* 11.4 Write property test for keyboard navigation
    - **Property 17: Keyboard Navigation Completeness**
    - **Validates: Requirements 13.1, 13.3, 13.4**

  - [ ]* 11.5 Write property test for ARIA labels
    - **Property 18: ARIA Label Completeness**
    - **Validates: Requirements 13.2**

  - [ ]* 11.6 Write accessibility tests
    - Test no accessibility violations with axe-core
    - Test all interactive elements have ARIA labels
    - Test keyboard navigation through all form elements
    - Test screen reader announcements

- [ ] 12. Implement error handling and validation
  - [ ] 12.1 Add client-side validation
    - Validate date range before submission
    - Validate content not empty before submission
    - Validate content size within limits
    - Validate media link URLs
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ] 12.2 Add error message display
    - Display specific error messages for each validation failure
    - Show errors inline near relevant form fields
    - Style error messages consistently with dark theme
    - Clear errors when user corrects issues
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 12.3 Implement error recovery
    - Add retry logic for network errors
    - Preserve form data on error
    - Show user-friendly error messages
    - Log errors for debugging
    - _Requirements: 6.3, 6.4_

  - [ ]* 12.4 Write unit tests for validation
    - Test error displays when submitting without date
    - Test error displays when submitting empty content
    - Test error displays when content exceeds size limit
    - Test error displays for invalid media link URL

- [ ] 13. Maintain approval workflow compatibility
  - [ ] 13.1 Preserve existing approval status fields
    - Ensure approval_status, reviewed_by, reviewed_at, feedback fields unchanged
    - Set approval_status to "pending" on report submission
    - Maintain real-time subscription to approval status changes
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ] 13.2 Implement edit permission checks
    - Allow editing only for reports with status "draft"
    - Block editing for submitted/approved/rejected reports
    - Display appropriate message when editing blocked
    - _Requirements: 6.6_

  - [ ] 13.3 Preserve approval notifications
    - Maintain existing notification system for approval status changes
    - Show success toast when report approved
    - Show error toast with feedback when report rejected
    - _Requirements: 6.4_

  - [ ]* 13.4 Write property test for draft status permission
    - **Property 10: Draft Status Edit Permission**
    - **Validates: Requirements 6.6**

  - [ ]* 13.5 Write integration tests for approval workflow
    - Test report submission sets status to pending
    - Test real-time approval status updates
    - Test editing blocked for non-draft reports
    - Test notifications display on approval status change

- [ ] 14. Optimize performance
  - [ ] 14.1 Implement lazy loading for editor
    - Lazy load RichTextEditor component
    - Lazy load TipTap extensions
    - Show loading indicator while editor initializes
    - _Requirements: 11.1_

  - [ ] 14.2 Add debouncing for auto-save
    - Debounce editor onChange events
    - Prevent excessive localStorage writes
    - Optimize for typing performance
    - _Requirements: 11.2, 14.1_

  - [ ] 14.3 Optimize large document handling
    - Configure TipTap for efficient rendering
    - Test with documents up to 50,000 characters
    - Ensure no performance degradation
    - _Requirements: 11.5_

  - [ ]* 14.4 Write performance tests
    - Test editor initializes within 500ms
    - Test typing latency under 50ms
    - Test formatting latency under 100ms
    - Test loading existing report within 1 second
    - **Property 27: Editor Initialization Performance**
    - **Property 28: Typing Latency Performance**
    - **Property 29: Formatting Latency Performance**
    - **Property 30: Load Performance**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Final integration and testing
  - [ ] 16.1 Run full test suite
    - Run all unit tests and verify 80%+ coverage
    - Run all property-based tests with 100+ iterations
    - Run all integration tests
    - Run accessibility tests with axe-core
    - _Requirements: All_

  - [ ] 16.2 Test with existing data
    - Test loading and editing legacy reports
    - Test migration script with production-like data
    - Verify backward compatibility
    - _Requirements: 3.4, 3.5, 9.5, 9.6_

  - [ ] 16.3 Manual testing
    - Test complete user flow: create, edit, submit report
    - Test on different screen sizes (mobile, tablet, desktop)
    - Test keyboard navigation throughout
    - Test with screen reader
    - _Requirements: All_

  - [ ] 16.4 Performance validation
    - Verify editor initialization time
    - Verify typing and formatting latency
    - Verify large document handling
    - Verify auto-save performance
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- This implementation focuses on Word format only (no document type selector)
- Spreadsheet and presentation formats are deferred to future phases
- All existing functionality (media links, approval workflows) is preserved
- The implementation uses TypeScript with React and TipTap
- Database migration is additive and backward compatible
