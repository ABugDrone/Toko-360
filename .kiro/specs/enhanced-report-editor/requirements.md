# Requirements Document

## Introduction

The Enhanced Report Editor redesigns the Internal Reports page to provide a professional, Word-like report creation experience. The current implementation uses three separate text areas (Weekly Summary, Challenges, Future Goals) and a basic text input for the report week. This feature will replace these with a unified rich text editor and an interactive calendar date picker while maintaining all existing functionality including media links, approval workflows, and real-time updates.

**Scope:** This implementation focuses on Word document format only with calendar-based week selection.

## Glossary

- **Report_Editor**: The unified rich text editing component that replaces the three separate text areas
- **Date_Picker**: The interactive calendar component for selecting report week date ranges
- **Media_Links_Manager**: The existing component for attaching video, audio, and document links to reports
- **Report_Week**: A date range representing the week covered by the report (e.g., "OCT 28 - NOV 03, 2024")
- **Rich_Text_Content**: Formatted text content including headers, fonts, styling, alignment, and lists
- **Weekly_Reports_Table**: The Supabase database table storing report data
- **Approval_Workflow**: The existing system for submitting, reviewing, and approving reports
- **Platform_Detection**: The existing feature that auto-detects media link platforms (YouTube, Google Drive, etc.)

## Requirements

### Requirement 1: Calendar Date Picker for Report Week

**User Story:** As a report creator, I want to select the report week using an interactive calendar, so that I can easily choose date ranges without manual typing.

#### Acceptance Criteria

1. THE Date_Picker SHALL display an interactive calendar interface for date selection
2. WHEN a user opens the Date_Picker, THE Date_Picker SHALL allow selection of a week-long date range
3. WHEN a user selects a date range, THE Date_Picker SHALL format the display as "MMM DD - MMM DD, YYYY" (e.g., "OCT 28 - NOV 03, 2024")
4. THE Date_Picker SHALL replace the existing text input field for Report_Week
5. WHEN a user edits an existing report, THE Date_Picker SHALL display the previously selected date range
6. THE Date_Picker SHALL validate that the selected date range spans exactly 7 consecutive days
7. THE Date_Picker SHALL store the formatted date string in the Weekly_Reports_Table week column

### Requirement 2: Unified Rich Text Editor

**User Story:** As a report creator, I want to use a single rich text editor with formatting options, so that I can structure my entire report professionally in one place.

#### Acceptance Criteria

1. THE Report_Editor SHALL replace the three separate text areas (summary, challenges, goals) with one unified editor
2. THE Report_Editor SHALL support header formatting (H1, H2, H3)
3. THE Report_Editor SHALL support font selection from a predefined list of fonts
4. THE Report_Editor SHALL support text styling (bold, italic, underline)
5. THE Report_Editor SHALL support text alignment (left, center, right, justify)
6. THE Report_Editor SHALL support bullet lists and numbered lists
7. THE Report_Editor SHALL support configurable page margins and spacing
8. WHEN a user types in the Report_Editor, THE Report_Editor SHALL preserve all formatting in real-time
9. WHEN a user submits a report, THE Report_Editor SHALL serialize the Rich_Text_Content to a format compatible with Weekly_Reports_Table storage
10. WHEN a user edits an existing report, THE Report_Editor SHALL deserialize and display the previously saved Rich_Text_Content with all formatting intact

### Requirement 3: Rich Text Content Storage

**User Story:** As a system administrator, I want formatted report content stored efficiently, so that reports can be retrieved and displayed with their original formatting.

#### Acceptance Criteria

1. THE Weekly_Reports_Table SHALL store Rich_Text_Content in a structured format (JSON or HTML)
2. WHEN a report is saved, THE System SHALL serialize Rich_Text_Content including all formatting metadata
3. WHEN a report is loaded, THE System SHALL deserialize Rich_Text_Content and restore all formatting
4. THE System SHALL maintain backward compatibility with existing plain text reports in the database
5. WHEN loading a legacy plain text report, THE System SHALL convert it to Rich_Text_Content format for editing
6. THE System SHALL validate that serialized Rich_Text_Content does not exceed database column size limits

### Requirement 4: Word Document Format (REMOVED - Out of Scope)

**Note:** Document type selector has been removed from scope. All reports will use Word document format by default.

### Requirement 5: Media Links Integration

**User Story:** As a report creator, I want to continue attaching media links to my reports, so that I can include supporting video, audio, and document references.

#### Acceptance Criteria

1. THE Media_Links_Manager SHALL remain accessible in the enhanced report editor interface
2. THE Media_Links_Manager SHALL maintain all existing functionality for adding video, audio, and document links
3. THE Media_Links_Manager SHALL continue to use Platform_Detection for auto-detecting link sources
4. WHEN a user adds a media link, THE System SHALL store it in the Weekly_Reports_Table media_links column
5. WHEN a user views a report, THE System SHALL display all attached media links with platform icons
6. THE Media_Links_Manager SHALL support the same platforms as the current implementation (YouTube, Vimeo, Google Drive, Google Docs, Google Sheets, Google Slides, Microsoft 365, Dropbox, TikTok, Facebook, Instagram)

### Requirement 6: Approval Workflow Compatibility

**User Story:** As a system administrator, I want the enhanced editor to work with existing approval workflows, so that report review processes remain unchanged.

#### Acceptance Criteria

1. THE System SHALL maintain compatibility with the existing Approval_Workflow
2. WHEN a user submits a report, THE System SHALL set the approval_status to "pending" in Weekly_Reports_Table
3. THE System SHALL continue to support real-time approval status updates via Supabase subscriptions
4. WHEN an approval status changes, THE System SHALL display notifications to the report creator
5. THE System SHALL preserve all existing approval workflow fields (approval_status, reviewed_by, reviewed_at, feedback)
6. THE System SHALL allow editing only for reports with status "draft"

### Requirement 7: User Interface Layout

**User Story:** As a report creator, I want an intuitive layout for the enhanced editor, so that I can easily access all features without confusion.

#### Acceptance Criteria

1. THE Report_Editor SHALL display the Date_Picker at the top of the form
2. THE Report_Editor SHALL display the unified rich text editor below the Date_Picker
3. THE Report_Editor SHALL display the Media_Links_Manager below the rich text editor
4. THE Report_Editor SHALL display submit and cancel buttons at the bottom of the form
5. THE Report_Editor SHALL maintain the existing dark theme styling (slate-900/slate-800 backgrounds)
6. THE Report_Editor SHALL maintain the existing cyan accent color for primary actions
7. THE Report_Editor SHALL display section labels and visual hierarchy consistent with the current design

### Requirement 8: Rich Text Editor Toolbar

**User Story:** As a report creator, I want a visible toolbar with formatting options, so that I can easily apply formatting without memorizing keyboard shortcuts.

#### Acceptance Criteria

1. THE Report_Editor SHALL display a formatting toolbar above the text editing area
2. THE toolbar SHALL include buttons for header levels (H1, H2, H3)
3. THE toolbar SHALL include a font selection dropdown
4. THE toolbar SHALL include buttons for bold, italic, and underline
5. THE toolbar SHALL include buttons for text alignment (left, center, right, justify)
6. THE toolbar SHALL include buttons for bullet lists and numbered lists
7. THE toolbar SHALL include controls for margins and spacing
8. WHEN a user clicks a toolbar button, THE Report_Editor SHALL apply the corresponding formatting to the selected text
9. WHEN text is selected, THE toolbar SHALL highlight active formatting options for that text

### Requirement 9: Database Schema Migration

**User Story:** As a system administrator, I want a clear migration path for the database schema, so that the new editor can store formatted content without breaking existing reports.

#### Acceptance Criteria

1. THE System SHALL add a new column to Weekly_Reports_Table for storing Rich_Text_Content
2. THE System SHALL add a new column to Weekly_Reports_Table for storing the start_date of Report_Week
3. THE System SHALL add a new column to Weekly_Reports_Table for storing the end_date of Report_Week
4. THE System SHALL maintain existing columns (summary, challenges, goals) for backward compatibility
5. WHEN migrating, THE System SHALL preserve all existing report data
6. THE System SHALL provide a migration script that can be executed without data loss

### Requirement 10: Responsive Design

**User Story:** As a report creator, I want the enhanced editor to work on different screen sizes, so that I can create reports on desktop, tablet, or mobile devices.

#### Acceptance Criteria

1. THE Report_Editor SHALL adapt its layout for screen widths below 768px (mobile)
2. THE Report_Editor SHALL adapt its layout for screen widths between 768px and 1024px (tablet)
3. THE Report_Editor SHALL adapt its layout for screen widths above 1024px (desktop)
4. WHEN displayed on mobile, THE toolbar SHALL stack vertically or use a collapsible menu
5. WHEN displayed on mobile, THE Date_Picker SHALL use a mobile-optimized calendar interface
6. THE Report_Editor SHALL maintain usability and readability across all screen sizes

### Requirement 11: Performance and Loading

**User Story:** As a report creator, I want the editor to load quickly and respond smoothly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN the report form opens, THE Report_Editor SHALL initialize within 500 milliseconds
2. WHEN a user types in the Report_Editor, THE System SHALL update the display within 50 milliseconds
3. WHEN a user applies formatting, THE Report_Editor SHALL render the change within 100 milliseconds
4. WHEN loading an existing report, THE System SHALL deserialize and display Rich_Text_Content within 1 second
5. THE Report_Editor SHALL handle documents up to 50,000 characters without performance degradation

### Requirement 12: Validation and Error Handling

**User Story:** As a report creator, I want clear validation messages, so that I know what needs to be corrected before submitting my report.

#### Acceptance Criteria

1. WHEN a user attempts to submit without selecting a Report_Week, THE System SHALL display an error message "Please select a report week"
2. WHEN a user attempts to submit with empty Rich_Text_Content, THE System SHALL display an error message "Report content cannot be empty"
3. WHEN Rich_Text_Content exceeds the maximum allowed size, THE System SHALL display an error message with the character count and limit
4. WHEN a Date_Picker selection is invalid, THE System SHALL display an error message "Please select a valid 7-day week range"
5. WHEN a media link URL is invalid, THE System SHALL display an error message "Please enter a valid URL"
6. THE System SHALL prevent form submission until all validation errors are resolved

### Requirement 13: Accessibility

**User Story:** As a report creator with accessibility needs, I want the editor to support keyboard navigation and screen readers, so that I can create reports independently.

#### Acceptance Criteria

1. THE Report_Editor SHALL support keyboard navigation for all toolbar functions
2. THE Report_Editor SHALL provide ARIA labels for all interactive elements
3. THE Date_Picker SHALL support keyboard navigation for date selection
4. THE Document_Type_Selector SHALL be navigable using keyboard arrow keys
5. WHEN a user focuses on a toolbar button, THE System SHALL display a tooltip describing its function
6. THE Report_Editor SHALL maintain a logical tab order through all form elements
7. THE Report_Editor SHALL announce formatting changes to screen readers

### Requirement 14: Data Persistence and Auto-save

**User Story:** As a report creator, I want my work to be saved automatically, so that I don't lose progress if my browser crashes or I navigate away accidentally.

#### Acceptance Criteria

1. WHILE a user is editing a report, THE System SHALL auto-save the Rich_Text_Content to local storage every 30 seconds
2. WHEN a user returns to an unsaved report, THE System SHALL restore the content from local storage
3. WHEN a user successfully submits a report, THE System SHALL clear the auto-saved local storage data
4. WHEN a user explicitly cancels editing, THE System SHALL prompt to confirm before discarding auto-saved changes
5. THE System SHALL display a visual indicator showing the last auto-save timestamp

### Requirement 15: Export and Print Formatting

**User Story:** As a report creator, I want my formatted reports to look professional when exported or printed, so that I can share them outside the system.

#### Acceptance Criteria

1. WHEN a user prints a report, THE System SHALL preserve all Rich_Text_Content formatting
2. WHEN a user prints a report, THE System SHALL apply appropriate page breaks for multi-page content
3. WHERE Format_Type is "word", THE System SHALL optimize print layout for document-style formatting
4. WHERE Format_Type is "spreadsheet", THE System SHALL optimize print layout for table-style formatting
5. WHERE Format_Type is "presentation", THE System SHALL optimize print layout for slide-style formatting
6. THE System SHALL include report metadata (week, creator, submission date) in the print header
7. THE System SHALL include media links as a separate section in the print output
