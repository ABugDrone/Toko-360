# Design Document: Enhanced Report Editor

## Overview

The Enhanced Report Editor transforms the Internal Reports page from a basic three-textarea form into a professional, Word-like document creation experience. This redesign maintains all existing functionality (media links, approval workflows, real-time updates) while introducing a unified rich text editor, interactive calendar date picker, and document type selector.

### Current State

The existing implementation uses:
- Three separate textarea fields (Weekly Summary, Challenges, Future Goals)
- Basic text input for report week (manual typing)
- Plain text storage in database
- Media links manager with platform detection
- Real-time approval status updates via Supabase subscriptions
- Dark theme with cyan accents (slate-900/slate-800 backgrounds)

### Target State

The enhanced implementation will provide:
- Single unified rich text editor with formatting toolbar (Word format)
- Interactive calendar date picker for week selection
- Rich text content storage (JSON format)
- Maintained media links functionality
- Preserved approval workflow compatibility
- Enhanced accessibility and responsive design
- Auto-save functionality with local storage

### Key Design Goals

1. **Professional Experience**: Provide Word-like editing capabilities
2. **Backward Compatibility**: Support existing plain text reports
3. **Performance**: Fast loading and responsive editing
4. **Accessibility**: Full keyboard navigation and screen reader support
5. **Maintainability**: Clean architecture with clear separation of concerns


## Architecture

### Technology Stack

#### Rich Text Editor: TipTap
- **Rationale**: TipTap is a headless, framework-agnostic rich text editor built on ProseMirror
- **Benefits**:
  - Full control over UI/UX (matches existing dark theme)
  - Excellent TypeScript support
  - Extensible architecture with plugins
  - Active community and maintenance
  - Smaller bundle size than alternatives (Quill, Draft.js)
  - Built-in React integration
- **Alternatives Considered**:
  - Quill: Less flexible styling, larger bundle
  - Draft.js: More complex API, less maintained
  - Slate: More low-level, steeper learning curve

#### Date Picker: react-day-picker
- **Rationale**: Already in dependencies (date-fns 4.1.0, react-day-picker 9.13.2)
- **Benefits**:
  - Lightweight and customizable
  - Excellent accessibility support
  - Works well with date-fns for date manipulation
  - Supports custom styling for dark theme
  - Week selection mode available

#### Storage Format: JSON (TipTap JSON)
- **Rationale**: TipTap's native JSON format provides structured, queryable content
- **Benefits**:
  - Type-safe serialization/deserialization
  - Easier to validate and sanitize
  - Supports future content analysis/search
  - Smaller storage footprint than HTML
  - Can generate HTML for display/export
- **Alternatives Considered**:
  - HTML: Larger size, harder to validate, XSS risks
  - Markdown: Limited formatting support, conversion overhead

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Reports Page (page.tsx)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ReportEditorForm Component                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         DateRangePicker Component              │  │  │
│  │  │  (react-day-picker + date-fns)                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │      DocumentTypeSelector Component            │  │  │
│  │  │  (Word / Spreadsheet / Presentation)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         RichTextEditor Component               │  │  │
│  │  │  ┌───────────────────────────────────────────┐ │  │  │
│  │  │  │      EditorToolbar Component              │ │  │  │
│  │  │  │  (Formatting controls)                    │ │  │  │
│  │  │  └───────────────────────────────────────────┘ │  │  │
│  │  │  ┌───────────────────────────────────────────┐ │  │  │
│  │  │  │      TipTap Editor Instance               │ │  │  │
│  │  │  │  (ProseMirror core)                       │ │  │  │
│  │  │  └───────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │      MediaLinksManager Component               │  │  │
│  │  │  (Existing, maintained)                        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer (lib/storage.ts)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Report Serialization/Deserialization          │  │
│  │  • JSON to TipTap format conversion                   │  │
│  │  • Legacy plain text migration                        │  │
│  │  • Validation and sanitization                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Database (weekly_reports)              │
│  • rich_content: JSONB (TipTap JSON)                        │
│  • format_type: VARCHAR (word/spreadsheet/presentation)     │
│  • start_date: DATE                                         │
│  • end_date: DATE                                           │
│  • summary, challenges, goals: TEXT (legacy, maintained)    │
│  • media_links: JSONB (existing)                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Creating/Editing a Report

1. User opens report form
2. DateRangePicker loads with current/saved date range
3. DocumentTypeSelector loads with default/saved format type
4. RichTextEditor initializes:
   - New report: Empty editor
   - Edit existing: Deserialize JSON to TipTap format
   - Edit legacy: Convert plain text to TipTap format
5. User edits content (auto-save to localStorage every 30s)
6. User submits:
   - Serialize TipTap content to JSON
   - Validate content size
   - Save to database via storage layer
   - Clear localStorage auto-save

#### Loading Reports

1. Fetch reports from Supabase
2. For each report:
   - Check if rich_content exists (new format)
   - If yes: Use rich_content
   - If no: Use legacy fields (summary, challenges, goals)
3. Display in reports list with formatted preview


## Components and Interfaces

### DateRangePicker Component

**Purpose**: Interactive calendar for selecting week-long date ranges

**Props**:
```typescript
interface DateRangePickerProps {
  value: { start: Date; end: Date } | null;
  onChange: (range: { start: Date; end: Date }) => void;
  disabled?: boolean;
}
```

**Features**:
- Week selection mode (7 consecutive days)
- Custom styling for dark theme
- Keyboard navigation support
- Validation for 7-day range
- Format display: "MMM DD - MMM DD, YYYY"

**Implementation Notes**:
- Use react-day-picker's `mode="range"` with custom week selection logic
- Integrate date-fns for date manipulation and formatting
- Apply custom CSS for slate-900/cyan theme
- Add ARIA labels for accessibility

### DocumentTypeSelector Component

**Purpose**: Toggle between document format types

**Props**:
```typescript
interface DocumentTypeSelectorProps {
  value: 'word' | 'spreadsheet' | 'presentation';
  onChange: (type: 'word' | 'spreadsheet' | 'presentation') => void;
  disabled?: boolean;
}
```

**Features**:
- Three-option toggle (Word, Spreadsheet, Presentation)
- Visual icons for each type
- Keyboard navigation (arrow keys)
- Active state highlighting

**Implementation Notes**:
- Use Radix UI Tabs or custom button group
- Icons from lucide-react (FileText, Table, Presentation)
- Conditional rendering of editor features based on type
- Phase 1: Word format only (Spreadsheet/Presentation in future phases)

### RichTextEditor Component

**Purpose**: Unified rich text editing with formatting toolbar

**Props**:
```typescript
interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  formatType: 'word' | 'spreadsheet' | 'presentation';
  placeholder?: string;
  disabled?: boolean;
  onAutoSave?: (content: JSONContent) => void;
}
```

**Features**:
- TipTap editor instance
- Formatting toolbar
- Auto-save mechanism
- Character count display
- Responsive layout

**TipTap Extensions**:
```typescript
const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: true,
    orderedList: true,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
  }),
  Placeholder.configure({
    placeholder: 'Start writing your report...',
  }),
  CharacterCount.configure({
    limit: 50000,
  }),
];
```

### EditorToolbar Component

**Purpose**: Formatting controls for rich text editor

**Props**:
```typescript
interface EditorToolbarProps {
  editor: Editor | null;
  formatType: 'word' | 'spreadsheet' | 'presentation';
}
```

**Toolbar Sections**:

1. **Text Formatting**:
   - Bold, Italic, Underline
   - Heading levels (H1, H2, H3)
   - Font selection (system fonts)

2. **Alignment**:
   - Left, Center, Right, Justify

3. **Lists**:
   - Bullet list
   - Numbered list

4. **Advanced** (Phase 2):
   - Margins and spacing controls
   - Table insertion (for spreadsheet format)
   - Slide layout (for presentation format)

**Implementation Notes**:
- Sticky positioning at top of editor
- Responsive: collapse to dropdown on mobile
- Active state highlighting for current formatting
- Tooltips with keyboard shortcuts

### MediaLinksManager Component

**Purpose**: Existing component for managing media attachments

**Changes**: None - maintain existing implementation

**Integration**: Position below RichTextEditor in form layout


## Data Models

### Database Schema Changes

#### New Columns for weekly_reports Table

```sql
-- Add new columns for enhanced editor
ALTER TABLE weekly_reports
ADD COLUMN rich_content JSONB DEFAULT NULL,
ADD COLUMN format_type VARCHAR(20) DEFAULT 'word',
ADD COLUMN start_date DATE DEFAULT NULL,
ADD COLUMN end_date DATE DEFAULT NULL;

-- Add index for date range queries
CREATE INDEX idx_reports_date_range ON weekly_reports(start_date, end_date);

-- Add check constraint for format_type
ALTER TABLE weekly_reports
ADD CONSTRAINT check_format_type 
CHECK (format_type IN ('word', 'spreadsheet', 'presentation'));
```

**Column Descriptions**:

- `rich_content` (JSONB): Stores TipTap JSON format content
  - NULL for legacy reports
  - Contains full document structure with formatting
  - Example structure:
    ```json
    {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Weekly Summary" }]
        },
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Content here..." }]
        }
      ]
    }
    ```

- `format_type` (VARCHAR): Document format type
  - Values: 'word', 'spreadsheet', 'presentation'
  - Default: 'word'
  - Used to determine editor features and export format

- `start_date` (DATE): Week start date
  - Extracted from week string for querying
  - Enables date range filtering

- `end_date` (DATE): Week end date
  - Extracted from week string for querying
  - Validates 7-day range

**Legacy Columns (Maintained)**:
- `summary` (TEXT): Kept for backward compatibility
- `challenges` (TEXT): Kept for backward compatibility
- `goals` (TEXT): Kept for backward compatibility
- `week` (VARCHAR): Kept for display purposes

### Migration Strategy

#### Phase 1: Additive Migration (No Breaking Changes)

```sql
-- Migration script: 001_add_rich_editor_columns.sql
-- Safe to run on production without downtime

BEGIN;

-- Add new columns with defaults
ALTER TABLE weekly_reports
ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS format_type VARCHAR(20) DEFAULT 'word',
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

-- Add constraints
ALTER TABLE weekly_reports
ADD CONSTRAINT IF NOT EXISTS check_format_type 
CHECK (format_type IN ('word', 'spreadsheet', 'presentation'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reports_date_range 
ON weekly_reports(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reports_format_type 
ON weekly_reports(format_type);

COMMIT;
```

#### Phase 2: Data Population (Background Process)

```typescript
// Migration utility: populateDateFields()
// Parses existing week strings and populates start_date/end_date
// Run as background job or admin script

async function populateDateFields() {
  const reports = await supabase
    .from('weekly_reports')
    .select('id, week')
    .is('start_date', null);

  for (const report of reports) {
    const dates = parseWeekString(report.week);
    if (dates) {
      await supabase
        .from('weekly_reports')
        .update({
          start_date: dates.start,
          end_date: dates.end,
        })
        .eq('id', report.id);
    }
  }
}

function parseWeekString(week: string): { start: string; end: string } | null {
  // Parse "OCT 28 - NOV 03, 2024" format
  // Return ISO date strings or null if invalid
}
```

### TypeScript Interfaces

#### Updated WeeklyReport Interface

```typescript
export interface WeeklyReport {
  id: string;
  staffId: string;
  week: string; // Display format: "OCT 28 - NOV 03, 2024"
  
  // Legacy fields (maintained for backward compatibility)
  summary: string;
  challenges: string;
  goals: string;
  
  // New fields
  richContent?: JSONContent; // TipTap JSON format
  formatType: 'word' | 'spreadsheet' | 'presentation';
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  
  // Existing fields
  status: ReportStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  submittedAt?: number;
  reviewedBy?: string;
  reviewedAt?: number;
  feedback?: string;
  department: Department;
  mediaLinks?: MediaLink[];
}
```

#### TipTap JSON Content Type

```typescript
import { JSONContent } from '@tiptap/core';

// TipTap provides this type, but for reference:
interface JSONContent {
  type: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
  text?: string;
}
```

#### Database Mapping

```typescript
export interface DbWeeklyReport {
  id: string;
  staff_id: string;
  week: string;
  summary: string;
  challenges: string;
  goals: string;
  rich_content: any; // JSONB
  format_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  approval_status: string | null;
  department: string;
  media_links: any; // JSONB
  created_at: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
}

function dbReportToReport(dbReport: DbWeeklyReport): WeeklyReport {
  return {
    id: dbReport.id,
    staffId: dbReport.staff_id,
    week: dbReport.week,
    summary: dbReport.summary,
    challenges: dbReport.challenges,
    goals: dbReport.goals,
    richContent: dbReport.rich_content,
    formatType: (dbReport.format_type as 'word' | 'spreadsheet' | 'presentation') || 'word',
    startDate: dbReport.start_date || undefined,
    endDate: dbReport.end_date || undefined,
    status: dbReport.status as ReportStatus,
    approvalStatus: dbReport.approval_status as 'pending' | 'approved' | 'rejected' | undefined,
    department: dbReport.department as Department,
    mediaLinks: dbReport.media_links || [],
    createdAt: new Date(dbReport.created_at).getTime(),
    submittedAt: dbReport.submitted_at ? new Date(dbReport.submitted_at).getTime() : undefined,
    reviewedBy: dbReport.reviewed_by || undefined,
    reviewedAt: dbReport.reviewed_at ? new Date(dbReport.reviewed_at).getTime() : undefined,
    feedback: dbReport.feedback || undefined,
  };
}
```

### Backward Compatibility Strategy

#### Reading Reports

```typescript
function getReportContent(report: WeeklyReport): JSONContent {
  // Prefer rich_content if available
  if (report.richContent) {
    return report.richContent;
  }
  
  // Fallback: Convert legacy plain text to TipTap format
  return convertLegacyToRichContent({
    summary: report.summary,
    challenges: report.challenges,
    goals: report.goals,
  });
}

function convertLegacyToRichContent(legacy: {
  summary: string;
  challenges: string;
  goals: string;
}): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Weekly Summary' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: legacy.summary }],
      },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Challenges' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: legacy.challenges }],
      },
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Future Goals' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: legacy.goals }],
      },
    ],
  };
}
```

#### Writing Reports

```typescript
async function saveReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>) {
  const dbReport = {
    staff_id: report.staffId,
    week: report.week,
    rich_content: report.richContent,
    format_type: report.formatType,
    start_date: report.startDate,
    end_date: report.endDate,
    // Also save as plain text for backward compatibility
    summary: extractPlainText(report.richContent, 'summary'),
    challenges: extractPlainText(report.richContent, 'challenges'),
    goals: extractPlainText(report.richContent, 'goals'),
    // ... other fields
  };
  
  return supabase.from('weekly_reports').insert(dbReport);
}

function extractPlainText(content: JSONContent | undefined, section: string): string {
  // Extract plain text from rich content for legacy fields
  // This ensures old clients/reports can still read the data
  if (!content) return '';
  
  // Simple extraction: concatenate all text nodes
  // More sophisticated: identify sections by headings
  return extractTextFromJSON(content);
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Formatting Preservation**: Multiple criteria (2.2-2.7, 2.8, 2.10, 3.3) test that formatting is preserved. These can be combined into comprehensive round-trip properties.

2. **Round-Trip Properties**: Several criteria test save/load cycles (1.5, 1.7, 2.10, 3.3, 4.7, 4.8, 5.4, 14.2). These can be consolidated into fewer, more comprehensive properties.

3. **UI Structure Tests**: Many criteria (7.1-7.5, 8.1-8.7, 9.1-9.5) test that UI elements exist. These are better suited as examples rather than properties.

4. **Error Handling**: Criteria 12.1-12.5 test specific error cases. These are examples, not properties.

5. **Performance**: Criteria 11.1-11.4 test timing requirements. These are properties but should be tested separately from functional correctness.

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Date Range Formatting Consistency

*For any* valid 7-day date range selected in the DatePicker, the formatted display string should match the pattern "MMM DD - MMM DD, YYYY" and be parseable back to the original dates.

**Validates: Requirements 1.3, 1.6**

### Property 2: Date Range Round-Trip Persistence

*For any* valid date range, saving a report and then loading it should restore the exact same start and end dates.

**Validates: Requirements 1.5, 1.7**

### Property 3: Rich Content Formatting Round-Trip

*For any* rich text content with formatting (headers, bold, italic, underline, alignment, lists), serializing to JSON, saving to database, loading, and deserializing should preserve all formatting exactly.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 3.2, 3.3**

### Property 4: Legacy Report Conversion

*For any* legacy report with plain text fields (summary, challenges, goals), loading and converting to rich content format should produce valid TipTap JSON that can be edited and saved.

**Validates: Requirements 3.4, 3.5**

### Property 5: Content Size Validation

*For any* rich text content, serialization should either succeed (if within size limits) or fail with a clear validation error (if exceeding limits), never silently truncate or corrupt data.

**Validates: Requirements 3.6, 12.3**

### Property 6: Format Type Persistence

*For any* document format type (word, spreadsheet, presentation), saving a report and then loading it should restore the exact same format type.

**Validates: Requirements 4.7, 4.8**

### Property 7: Format Type UI Adaptation

*For any* format type selection, the editor interface should display the appropriate tools (text formatting for word, table tools for spreadsheet, slide tools for presentation).

**Validates: Requirements 4.3**

### Property 8: Media Links Platform Detection

*For any* URL from a supported platform (YouTube, Vimeo, Google Drive, etc.), the platform detection function should return the correct platform name.

**Validates: Requirements 5.3, 5.6**

### Property 9: Media Links Round-Trip Persistence

*For any* set of media links added to a report, saving and then loading the report should restore all links with their complete metadata (type, platform, URL, title).

**Validates: Requirements 5.2, 5.4, 5.5**

### Property 10: Draft Status Edit Permission

*For any* report, editing should be allowed if and only if the status is "draft". Reports with status "submitted", "approved", or "rejected" should block editing.

**Validates: Requirements 6.6**

### Property 11: Approval Status Persistence

*For any* report submission, the approval_status field should be set to "pending" and persist correctly through the approval workflow.

**Validates: Requirements 6.2**

### Property 12: Real-Time Approval Updates

*For any* approval status change in the database, the UI should receive a real-time update and display the new status within 2 seconds.

**Validates: Requirements 6.3, 6.4**

### Property 13: Toolbar Formatting Application

*For any* text selection and toolbar formatting button (bold, italic, underline, heading, alignment, list), clicking the button should apply the formatting to the selected text and update the editor content.

**Validates: Requirements 8.8**

### Property 14: Toolbar Active State Reflection

*For any* text selection with existing formatting, the toolbar should highlight all active formatting options that apply to that selection.

**Validates: Requirements 8.9**

### Property 15: Migration Data Preservation

*For any* existing report in the database, running the migration script should preserve all original data (week, summary, challenges, goals, media_links, status, approval fields) without loss or corruption.

**Validates: Requirements 9.6, 9.7**

### Property 16: Form Validation Blocking

*For any* form state with validation errors (missing date, empty content, invalid URL), the submit button should be disabled or submission should be blocked until all errors are resolved.

**Validates: Requirements 12.6**

### Property 17: Keyboard Navigation Completeness

*For any* interactive element in the editor (toolbar buttons, date picker, format selector), there should be a keyboard-only method to access and activate it (tab navigation, arrow keys, or keyboard shortcuts).

**Validates: Requirements 13.1, 13.3, 13.4**

### Property 18: ARIA Label Completeness

*For any* interactive element in the editor, an appropriate ARIA label or description should be present for screen reader accessibility.

**Validates: Requirements 13.2**

### Property 19: Tooltip Display on Focus

*For any* toolbar button, focusing the button (via keyboard or mouse) should display a tooltip describing its function.

**Validates: Requirements 13.5**

### Property 20: Tab Order Logical Flow

*For any* form state, pressing Tab repeatedly should move focus through form elements in a logical order: date picker → format selector → editor → media links → submit/cancel buttons.

**Validates: Requirements 13.6**

### Property 21: Screen Reader Formatting Announcements

*For any* formatting change applied in the editor, screen readers should receive an announcement describing the change (e.g., "Bold applied", "Heading 1 applied").

**Validates: Requirements 13.7**

### Property 22: Auto-Save Interval Consistency

*For any* editing session lasting longer than 30 seconds, the content should be saved to localStorage at 30-second intervals, with each save updating the last-saved timestamp.

**Validates: Requirements 14.1, 14.5**

### Property 23: Auto-Save Recovery Round-Trip

*For any* auto-saved content in localStorage, closing and reopening the editor should restore the exact same content that was auto-saved.

**Validates: Requirements 14.2**

### Property 24: Auto-Save Cleanup on Submit

*For any* successful report submission, the auto-saved data in localStorage should be immediately cleared.

**Validates: Requirements 14.3**

### Property 25: Print Formatting Preservation

*For any* rich text content with formatting, generating print output should preserve all formatting (headers, bold, italic, alignment, lists) in the printed document.

**Validates: Requirements 15.1**

### Property 26: Print Metadata Inclusion

*For any* report, the print output should include report metadata (week, creator, submission date) in the header and media links in a separate section.

**Validates: Requirements 15.6, 15.7**

### Property 27: Editor Initialization Performance

*For any* report form opening, the editor should initialize and be ready for input within 500 milliseconds.

**Validates: Requirements 11.1**

### Property 28: Typing Latency Performance

*For any* keystroke in the editor, the display should update within 50 milliseconds.

**Validates: Requirements 11.2**

### Property 29: Formatting Latency Performance

*For any* formatting operation (bold, italic, heading, etc.), the visual change should render within 100 milliseconds.

**Validates: Requirements 11.3**

### Property 30: Load Performance

*For any* existing report, loading and deserializing the content should complete within 1 second.

**Validates: Requirements 11.4**


## Error Handling

### Validation Errors

#### Date Selection Validation

```typescript
function validateDateRange(start: Date, end: Date): ValidationResult {
  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff !== 6) {
    return {
      valid: false,
      error: 'Please select a valid 7-day week range',
      code: 'INVALID_DATE_RANGE',
    };
  }
  
  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before end date',
      code: 'INVALID_DATE_ORDER',
    };
  }
  
  return { valid: true };
}
```

#### Content Validation

```typescript
function validateReportContent(content: JSONContent | null): ValidationResult {
  if (!content || !content.content || content.content.length === 0) {
    return {
      valid: false,
      error: 'Report content cannot be empty',
      code: 'EMPTY_CONTENT',
    };
  }
  
  const serialized = JSON.stringify(content);
  const sizeInBytes = new Blob([serialized]).size;
  const maxSize = 1024 * 1024; // 1MB limit for JSONB
  
  if (sizeInBytes > maxSize) {
    const charCount = getCharacterCount(content);
    return {
      valid: false,
      error: `Content exceeds maximum size. Current: ${charCount} characters, Limit: 50,000 characters`,
      code: 'CONTENT_TOO_LARGE',
    };
  }
  
  return { valid: true };
}
```

#### Media Link Validation

```typescript
function validateMediaLink(url: string): ValidationResult {
  try {
    new URL(url);
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL',
      code: 'INVALID_URL',
    };
  }
  
  const supportedDomains = [
    'youtube.com', 'youtu.be', 'vimeo.com', 'tiktok.com',
    'facebook.com', 'instagram.com', 'drive.google.com',
    'docs.google.com', 'sheets.google.com', 'slides.google.com',
    'onedrive.live.com', 'sharepoint.com', 'dropbox.com',
  ];
  
  const isSupported = supportedDomains.some(domain => url.includes(domain));
  
  if (!isSupported) {
    return {
      valid: false,
      error: 'URL is not from a supported platform',
      code: 'UNSUPPORTED_PLATFORM',
      details: { supportedPlatforms: supportedDomains },
    };
  }
  
  return { valid: true };
}
```

### Database Errors

#### Serialization Errors

```typescript
async function saveReport(report: WeeklyReport): Promise<ServiceResult<WeeklyReport>> {
  try {
    // Validate before serialization
    const contentValidation = validateReportContent(report.richContent);
    if (!contentValidation.valid) {
      return {
        success: false,
        error: {
          message: contentValidation.error,
          code: contentValidation.code,
          details: contentValidation.details,
        },
      };
    }
    
    // Serialize and save
    const dbReport = reportToDbReport(report);
    const { data, error } = await supabase
      .from('weekly_reports')
      .insert(dbReport)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: mapDatabaseError(error),
      };
    }
    
    return {
      success: true,
      data: dbReportToReport(data),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Failed to save report',
        code: 'SERIALIZATION_ERROR',
        details: error,
      },
    };
  }
}
```

#### Deserialization Errors

```typescript
function deserializeReportContent(richContent: any): JSONContent | null {
  try {
    // Validate JSON structure
    if (!richContent || typeof richContent !== 'object') {
      console.warn('Invalid rich content format, using empty content');
      return null;
    }
    
    // Validate TipTap structure
    if (!richContent.type || richContent.type !== 'doc') {
      console.warn('Invalid TipTap document structure');
      return null;
    }
    
    return richContent as JSONContent;
  } catch (error) {
    console.error('Failed to deserialize report content:', error);
    return null;
  }
}
```

### User-Facing Error Messages

```typescript
const ERROR_MESSAGES = {
  INVALID_DATE_RANGE: 'Please select a valid 7-day week range',
  EMPTY_CONTENT: 'Report content cannot be empty',
  CONTENT_TOO_LARGE: 'Content exceeds maximum size',
  INVALID_URL: 'Please enter a valid URL',
  UNSUPPORTED_PLATFORM: 'URL is not from a supported platform',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  DATABASE_ERROR: 'Failed to save report. Please try again.',
  SERIALIZATION_ERROR: 'Failed to process report content. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to edit this report',
};
```

### Error Recovery Strategies

#### Auto-Save Recovery

```typescript
function recoverFromAutoSave(reportId: string): JSONContent | null {
  try {
    const key = `report-autosave-${reportId}`;
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;
    
    const { content, timestamp } = JSON.parse(saved);
    const age = Date.now() - timestamp;
    
    // Discard auto-saves older than 24 hours
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    
    return content;
  } catch (error) {
    console.error('Failed to recover auto-save:', error);
    return null;
  }
}
```

#### Network Error Retry

```typescript
async function saveReportWithRetry(
  report: WeeklyReport,
  maxRetries = 3
): Promise<ServiceResult<WeeklyReport>> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await saveReport(report);
    
    if (result.success) {
      return result;
    }
    
    lastError = result.error;
    
    // Only retry on network errors
    if (result.error?.code === 'NETWORK_ERROR') {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    
    // Don't retry validation or permission errors
    break;
  }
  
  return {
    success: false,
    error: lastError,
  };
}
```


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI structure
- **Property tests**: Verify universal properties across all inputs using randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs and validate specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library**: fast-check (already in devDependencies)

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: enhanced-report-editor, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Enhanced Report Editor - Property Tests', () => {
  // Feature: enhanced-report-editor, Property 3: Rich Content Formatting Round-Trip
  it('should preserve all formatting through serialize/deserialize cycle', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 1000 }),
          formatting: fc.record({
            bold: fc.boolean(),
            italic: fc.boolean(),
            underline: fc.boolean(),
            heading: fc.option(fc.constantFrom(1, 2, 3)),
            alignment: fc.constantFrom('left', 'center', 'right', 'justify'),
            listType: fc.option(fc.constantFrom('bullet', 'ordered')),
          }),
        }),
        ({ text, formatting }) => {
          // Create rich content with formatting
          const content = createFormattedContent(text, formatting);
          
          // Serialize to JSON
          const serialized = JSON.stringify(content);
          
          // Deserialize back
          const deserialized = JSON.parse(serialized);
          
          // Verify formatting is preserved
          expect(deserialized).toEqual(content);
          expect(extractFormatting(deserialized)).toEqual(formatting);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: enhanced-report-editor, Property 8: Media Links Platform Detection
  it('should correctly detect platform for any supported URL', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { domain: 'youtube.com', expected: 'YouTube' },
          { domain: 'youtu.be', expected: 'YouTube' },
          { domain: 'vimeo.com', expected: 'Vimeo' },
          { domain: 'drive.google.com', expected: 'Google Drive' },
          { domain: 'docs.google.com', expected: 'Google Docs' },
          { domain: 'sheets.google.com', expected: 'Google Sheets' },
          { domain: 'slides.google.com', expected: 'Google Slides' },
          { domain: 'tiktok.com', expected: 'TikTok' },
          { domain: 'facebook.com', expected: 'Facebook' },
          { domain: 'instagram.com', expected: 'Instagram' },
          { domain: 'dropbox.com', expected: 'Dropbox' }
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        ({ domain, expected }, path) => {
          const url = `https://${domain}/${path}`;
          const detected = detectPlatform(url);
          expect(detected).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Focus Areas**:

1. **Component Rendering**:
   - DateRangePicker displays calendar interface
   - DocumentTypeSelector shows three format options
   - RichTextEditor displays toolbar and editor
   - MediaLinksManager is present in form

2. **User Interactions**:
   - Clicking toolbar buttons applies formatting
   - Selecting date range updates form state
   - Adding media links updates list
   - Submitting form triggers validation

3. **Edge Cases**:
   - Empty content submission blocked
   - Invalid date range rejected
   - Content exceeding size limit rejected
   - Legacy report conversion
   - Auto-save with browser close

4. **Error Conditions**:
   - Network errors show retry option
   - Validation errors show specific messages
   - Permission errors block editing
   - Database errors handled gracefully

**Example Unit Tests**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportEditorForm } from './report-editor-form';

describe('ReportEditorForm - Unit Tests', () => {
  it('should display date picker at top of form', () => {
    render(<ReportEditorForm />);
    const form = screen.getByRole('form');
    const datePicker = screen.getByLabelText(/report week/i);
    
    // Check that date picker is first child
    expect(form.children[0]).toContain(datePicker);
  });
  
  it('should show error when submitting without date', async () => {
    render(<ReportEditorForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please select a report week/i)).toBeInTheDocument();
    });
  });
  
  it('should show error when submitting empty content', async () => {
    render(<ReportEditorForm />);
    
    // Select date but leave content empty
    const datePicker = screen.getByLabelText(/report week/i);
    fireEvent.change(datePicker, { target: { value: '2024-10-28' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/report content cannot be empty/i)).toBeInTheDocument();
    });
  });
  
  it('should convert legacy report to rich content format', () => {
    const legacy = {
      summary: 'Test summary',
      challenges: 'Test challenges',
      goals: 'Test goals',
    };
    
    const richContent = convertLegacyToRichContent(legacy);
    
    expect(richContent.type).toBe('doc');
    expect(richContent.content).toHaveLength(6); // 3 headings + 3 paragraphs
    
    // Verify structure
    expect(richContent.content[0].type).toBe('heading');
    expect(richContent.content[0].content[0].text).toBe('Weekly Summary');
    expect(richContent.content[1].type).toBe('paragraph');
    expect(richContent.content[1].content[0].text).toBe('Test summary');
  });
  
  it('should auto-save content every 30 seconds', async () => {
    vi.useFakeTimers();
    const mockAutoSave = vi.fn();
    
    render(<ReportEditorForm onAutoSave={mockAutoSave} />);
    
    // Type some content
    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { textContent: 'Test content' } });
    
    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(mockAutoSave).toHaveBeenCalledTimes(1);
    });
    
    // Fast-forward another 30 seconds
    vi.advanceTimersByTime(30000);
    
    await waitFor(() => {
      expect(mockAutoSave).toHaveBeenCalledTimes(2);
    });
    
    vi.useRealTimers();
  });
});
```

### Integration Testing

**Focus Areas**:

1. **Database Integration**:
   - Save report with rich content
   - Load report and deserialize
   - Update existing report
   - Migration script execution

2. **Real-Time Updates**:
   - Approval status changes trigger UI updates
   - Multiple users editing different reports
   - Connection status handling

3. **Approval Workflow**:
   - Submit report sets status to pending
   - Approval updates status and timestamps
   - Rejection updates status and adds feedback
   - Draft reports remain editable

**Example Integration Test**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { saveReport, getReports } from '@/lib/storage';

describe('Report Storage Integration', () => {
  let supabase;
  let testReportId;
  
  beforeEach(async () => {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  });
  
  afterEach(async () => {
    // Cleanup test data
    if (testReportId) {
      await supabase.from('weekly_reports').delete().eq('id', testReportId);
    }
  });
  
  it('should save and load report with rich content', async () => {
    const report = {
      staffId: 'TEST-001',
      week: 'OCT 28 - NOV 03, 2024',
      startDate: '2024-10-28',
      endDate: '2024-11-03',
      formatType: 'word' as const,
      richContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Test Report' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is ', marks: [] },
              { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
              { type: 'text', text: ' text', marks: [] },
            ],
          },
        ],
      },
      status: 'draft' as const,
      department: 'IT' as const,
      mediaLinks: [],
    };
    
    // Save report
    const saved = await saveReport(report);
    expect(saved.success).toBe(true);
    testReportId = saved.data.id;
    
    // Load report
    const loaded = await getReports('TEST-001');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].richContent).toEqual(report.richContent);
    expect(loaded[0].formatType).toBe('word');
  });
});
```

### Performance Testing

**Metrics to Track**:

1. **Initialization Time**: Editor ready within 500ms
2. **Typing Latency**: Display updates within 50ms
3. **Formatting Latency**: Visual changes within 100ms
4. **Load Time**: Content displayed within 1 second
5. **Large Document Handling**: 50,000 characters without degradation

**Example Performance Test**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextEditor } from './rich-text-editor';

describe('RichTextEditor - Performance', () => {
  it('should initialize within 500ms', async () => {
    const startTime = performance.now();
    
    render(<RichTextEditor content={null} onChange={() => {}} />);
    
    await screen.findByRole('textbox');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500);
  });
  
  it('should handle large documents without performance degradation', async () => {
    const largeContent = {
      type: 'doc',
      content: Array.from({ length: 1000 }, (_, i) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: `Paragraph ${i} with some content` }],
      })),
    };
    
    const startTime = performance.now();
    
    render(<RichTextEditor content={largeContent} onChange={() => {}} />);
    
    await screen.findByRole('textbox');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should still load within 1 second even with large content
    expect(duration).toBeLessThan(1000);
  });
});
```

### Accessibility Testing

**Tools**:
- @testing-library/jest-dom for ARIA assertions
- axe-core for automated accessibility checks
- Manual keyboard navigation testing

**Example Accessibility Test**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReportEditorForm } from './report-editor-form';

expect.extend(toHaveNoViolations);

describe('ReportEditorForm - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ReportEditorForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have ARIA labels on all interactive elements', () => {
    render(<ReportEditorForm />);
    
    const datePicker = screen.getByLabelText(/report week/i);
    expect(datePicker).toHaveAttribute('aria-label');
    
    const formatSelector = screen.getByRole('radiogroup', { name: /document type/i });
    expect(formatSelector).toHaveAttribute('aria-label');
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('aria-label');
  });
  
  it('should support keyboard navigation through all form elements', () => {
    render(<ReportEditorForm />);
    
    const datePicker = screen.getByLabelText(/report week/i);
    datePicker.focus();
    expect(document.activeElement).toBe(datePicker);
    
    // Tab to next element
    fireEvent.keyDown(datePicker, { key: 'Tab' });
    
    const formatSelector = screen.getByRole('radiogroup');
    expect(document.activeElement).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Property Tests**: All 30 properties implemented
- **Integration Tests**: All critical user flows covered
- **Accessibility Tests**: Zero violations on automated checks
- **Performance Tests**: All timing requirements validated


## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         Top Navigation                       │
│                    "Weekly Reports"                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Header Section                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Weekly Performance Reports                          │   │
│  │  Document your key contributions...                  │   │
│  │                                    [New Report] ──────┼──►│
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Report Editor Form (when active)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Date Picker                                      │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  📅  OCT 28 - NOV 03, 2024  [▼]              │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  2. Document Type Selector                           │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  [📄 Word] [📊 Spreadsheet] [📽️ Presentation] │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  3. Rich Text Editor                                 │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Toolbar: [B][I][U][H1][H2][H3][≡][•][1.]    │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │                                                │  │   │
│  │  │  [Editor content area]                         │  │   │
│  │  │                                                │  │   │
│  │  │                                                │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  Character count: 1,234 / 50,000                    │   │
│  │  Last saved: 2 minutes ago                           │   │
│  │                                                       │   │
│  │  4. Media Links Manager                              │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  💡 Add links to videos, audio, or documents  │  │   │
│  │  │  [URL input] [Type ▼] [Title] [+ Add Link]   │  │   │
│  │  │  • YouTube: Project Demo (video)              │  │   │
│  │  │  • Google Drive: Resources (document)         │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  5. Action Buttons                                   │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  [SUBMIT REPORT]           [CANCEL]           │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Reports List (when form not active)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📄 Weekly Report                    [ONGOING] [PENDING]│
│  │  OCT 28 - NOV 03, 2024                              │   │
│  │  Core achievements and milestones...                │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Challenges | Future Goals | Submitted: Nov 3      │   │
│  │  🎥 YouTube: Demo  📄 Google Drive: Resources      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Theme Integration

**Color Palette** (existing dark theme):
- Background: `slate-900` (#0f172a)
- Secondary background: `slate-800` (#1e293b)
- Border: `slate-700` (#334155)
- Text primary: `white` (#ffffff)
- Text secondary: `slate-400` (#94a3b8)
- Accent: `cyan-500` (#06b6d4)
- Accent hover: `cyan-600` (#0891b2)

**Component Styling**:

```typescript
// DatePicker custom styles
const datePickerStyles = {
  container: 'bg-slate-800 border border-slate-700 rounded-lg p-4',
  input: 'bg-slate-700 border-slate-600 text-white',
  calendar: 'bg-slate-800 border border-slate-700',
  day: 'text-slate-300 hover:bg-slate-700',
  selectedDay: 'bg-cyan-500 text-slate-950',
  weekRange: 'bg-cyan-500/20 border-cyan-500/50',
};

// DocumentTypeSelector styles
const formatSelectorStyles = {
  container: 'flex gap-2 p-1 bg-slate-800 rounded-lg',
  button: 'px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors',
  activeButton: 'bg-cyan-500 text-slate-950 font-bold',
  icon: 'w-5 h-5 mr-2',
};

// RichTextEditor styles
const editorStyles = {
  container: 'bg-slate-800 border border-slate-700 rounded-lg overflow-hidden',
  toolbar: 'bg-slate-900 border-b border-slate-700 p-2 flex gap-1',
  toolbarButton: 'p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-white',
  activeToolbarButton: 'bg-slate-700 text-cyan-400',
  editor: 'p-4 min-h-[400px] text-white prose prose-invert max-w-none',
  footer: 'bg-slate-900 border-t border-slate-700 p-2 text-xs text-slate-400',
};
```

### Responsive Breakpoints

**Desktop (>1024px)**:
- Full toolbar visible
- Side-by-side layout for some controls
- Maximum editor width: 1200px

**Tablet (768px - 1024px)**:
- Toolbar remains horizontal but may wrap
- Stacked layout for controls
- Full-width editor

**Mobile (<768px)**:
- Toolbar collapses to dropdown menu
- Vertical stacking for all elements
- Touch-optimized date picker
- Larger touch targets (min 44x44px)

```typescript
// Responsive toolbar component
function EditorToolbar({ editor, isMobile }: EditorToolbarProps) {
  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Format ▼</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleBold().run()}>
            Bold
          </DropdownMenuItem>
          {/* ... more items */}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <div className="flex gap-1 flex-wrap">
      <Button onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </Button>
      {/* ... more buttons */}
    </div>
  );
}
```

### Accessibility Features

**Keyboard Shortcuts**:
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + Alt + 1/2/3`: Heading levels
- `Ctrl/Cmd + Shift + L`: Bullet list
- `Ctrl/Cmd + Shift + O`: Numbered list
- `Ctrl/Cmd + S`: Save (auto-save)
- `Esc`: Close dialogs/dropdowns

**ARIA Labels**:
```typescript
<div role="toolbar" aria-label="Text formatting toolbar">
  <button
    aria-label="Bold"
    aria-pressed={editor.isActive('bold')}
    onClick={() => editor.chain().focus().toggleBold().run()}
  >
    <Bold />
  </button>
</div>

<div role="textbox" aria-label="Report content editor" aria-multiline="true">
  {/* TipTap editor */}
</div>

<div role="radiogroup" aria-label="Document format type">
  <button role="radio" aria-checked={formatType === 'word'}>
    Word Document
  </button>
  {/* ... more options */}
</div>
```

**Screen Reader Announcements**:
```typescript
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Usage
editor.on('update', ({ editor }) => {
  if (editor.isActive('bold')) {
    announceToScreenReader('Bold formatting applied');
  }
});
```

### Animation and Transitions

**Smooth Transitions**:
```css
/* Toolbar button hover */
.toolbar-button {
  transition: background-color 150ms ease, color 150ms ease;
}

/* Editor focus */
.editor-container:focus-within {
  border-color: theme('colors.cyan.500');
  transition: border-color 200ms ease;
}

/* Form slide-in */
.report-form {
  animation: slideIn 300ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Auto-save indicator pulse */
.auto-save-indicator {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
```

### Loading States

```typescript
function ReportEditorForm({ reportId }: { reportId?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
        <p className="text-slate-400">Loading editor...</p>
      </div>
    );
  }
  
  return (
    <div className="report-form">
      {/* Editor content */}
    </div>
  );
}
```

### Empty States

```typescript
function ReportsList({ reports }: { reports: WeeklyReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">No reports yet. Create your first weekly report.</p>
        <Button
          onClick={handleNewReport}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold"
        >
          Create Report
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {reports.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```


## Integration Points

### Existing Approval Workflow

**Compatibility Requirements**:
- Maintain all existing approval status fields
- Support real-time updates via Supabase subscriptions
- Preserve approval notifications
- Keep draft/submitted/approved/rejected status flow

**Implementation**:

```typescript
// Existing approval workflow integration
function ReportEditorForm() {
  const { user } = useAuth();
  
  // Use existing real-time hook
  const connectionStatus = useRealtimeApprovals({
    staffId: user?.staffId,
    onReportUpdate: (updatedReport) => {
      // Update report in list
      setReports(prev =>
        prev.map(r => r.id === updatedReport.id ? updatedReport : r)
      );
      
      // Show notification (existing functionality)
      if (updatedReport.approvalStatus === 'approved') {
        showSuccessToast('Your weekly report has been approved');
      } else if (updatedReport.approvalStatus === 'rejected') {
        showErrorToast({
          message: 'Your weekly report has been rejected',
          details: updatedReport.feedback,
        });
      }
    },
  });
  
  // Existing status-based editing logic
  const canEdit = report.status === 'draft';
  
  return (
    <div>
      {/* Connection status indicator (existing) */}
      <ConnectionStatus
        status={connectionStatus.isConnected ? 'online' : 'offline'}
        showLabel={true}
      />
      
      {/* Editor form */}
      <form onSubmit={handleSubmit}>
        {/* ... editor components ... */}
        
        <Button
          type="submit"
          disabled={!canEdit || isSubmitting}
        >
          Submit Report
        </Button>
      </form>
    </div>
  );
}
```

### Real-Time Updates via Supabase

**Subscription Setup**:

```typescript
// Existing hook: hooks/use-realtime-approvals.ts
// No changes needed - already handles approval status updates

// The hook subscribes to weekly_reports table changes
// and filters by staff_id to only receive relevant updates

export function useRealtimeApprovals({
  staffId,
  onReportUpdate,
}: {
  staffId?: string;
  onReportUpdate: (report: WeeklyReport) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  useEffect(() => {
    if (!staffId) return;
    
    const channel = supabase
      .channel('weekly_reports_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weekly_reports',
          filter: `staff_id=eq.${staffId}`,
        },
        (payload) => {
          const updatedReport = dbReportToReport(payload.new as DbWeeklyReport);
          onReportUpdate(updatedReport);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setIsReconnecting(false);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setIsReconnecting(true);
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffId, onReportUpdate]);
  
  return { isConnected, isReconnecting };
}
```

### Media Links Functionality

**Integration Strategy**:
- Keep existing MediaLinksManager component unchanged
- Position it below RichTextEditor in form layout
- Maintain existing platform detection logic
- Preserve media_links JSONB column structure

**Component Integration**:

```typescript
function ReportEditorForm() {
  const [formData, setFormData] = useState({
    richContent: null,
    formatType: 'word',
    startDate: null,
    endDate: null,
    mediaLinks: [] as MediaLink[],
  });
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Date Picker */}
      <DateRangePicker
        value={{ start: formData.startDate, end: formData.endDate }}
        onChange={(range) => setFormData({ ...formData, ...range })}
      />
      
      {/* Document Type Selector */}
      <DocumentTypeSelector
        value={formData.formatType}
        onChange={(type) => setFormData({ ...formData, formatType: type })}
      />
      
      {/* Rich Text Editor */}
      <RichTextEditor
        content={formData.richContent}
        onChange={(content) => setFormData({ ...formData, richContent: content })}
        formatType={formData.formatType}
      />
      
      {/* Existing Media Links Manager - no changes */}
      <MediaLinksManager
        links={formData.mediaLinks}
        onAdd={(link) => setFormData({
          ...formData,
          mediaLinks: [...formData.mediaLinks, link],
        })}
        onRemove={(linkId) => setFormData({
          ...formData,
          mediaLinks: formData.mediaLinks.filter(l => l.id !== linkId),
        })}
      />
      
      {/* Submit buttons */}
      <div className="flex gap-4">
        <Button type="submit">Submit Report</Button>
        <Button type="button" onClick={handleCancel}>Cancel</Button>
      </div>
    </form>
  );
}
```

### Storage Layer Integration

**Updated Storage Functions**:

```typescript
// lib/storage.ts - Updated functions

export async function addReport(
  report: Omit<WeeklyReport, 'id' | 'createdAt'>
): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addReport(report));
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to add report');
  }
}

export async function updateReport(
  reportId: string,
  updates: Partial<Omit<WeeklyReport, 'id' | 'staffId' | 'createdAt'>>
): Promise<void> {
  const result = await import('./supabase-service').then(m => 
    m.updateReport(reportId, updates)
  );
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to update report');
  }
}

export async function getReports(staffId?: string): Promise<WeeklyReport[]> {
  const result = await import('./supabase-service').then(m => m.getReports(staffId));
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to get reports');
  }
  return result.data || [];
}
```

**Supabase Service Updates**:

```typescript
// lib/supabase-service.ts - Updated functions

export async function addReport(
  report: Omit<WeeklyReport, 'id' | 'createdAt'>
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    const dbReport = {
      staff_id: report.staffId,
      week: report.week,
      start_date: report.startDate,
      end_date: report.endDate,
      rich_content: report.richContent,
      format_type: report.formatType,
      // Also save as plain text for backward compatibility
      summary: extractPlainText(report.richContent, 'summary') || '',
      challenges: extractPlainText(report.richContent, 'challenges') || '',
      goals: extractPlainText(report.richContent, 'goals') || '',
      status: report.status,
      approval_status: report.approvalStatus,
      department: report.department,
      media_links: report.mediaLinks || [],
      submitted_at: report.submittedAt ? new Date(report.submittedAt).toISOString() : null,
    };

    const { data, error } = await supabase
      .from('weekly_reports')
      .insert(dbReport)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

export async function updateReport(
  reportId: string,
  updates: Partial<Omit<WeeklyReport, 'id' | 'staffId' | 'createdAt'>>
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {};
    
    if (updates.week !== undefined) dbUpdates.week = updates.week;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.richContent !== undefined) {
      dbUpdates.rich_content = updates.richContent;
      // Update plain text fields for backward compatibility
      dbUpdates.summary = extractPlainText(updates.richContent, 'summary') || '';
      dbUpdates.challenges = extractPlainText(updates.richContent, 'challenges') || '';
      dbUpdates.goals = extractPlainText(updates.richContent, 'goals') || '';
    }
    if (updates.formatType !== undefined) dbUpdates.format_type = updates.formatType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.approvalStatus !== undefined) dbUpdates.approval_status = updates.approvalStatus;
    if (updates.mediaLinks !== undefined) dbUpdates.media_links = updates.mediaLinks;
    if (updates.submittedAt !== undefined) {
      dbUpdates.submitted_at = new Date(updates.submittedAt).toISOString();
    }
    if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
    if (updates.reviewedAt !== undefined) {
      dbUpdates.reviewed_at = new Date(updates.reviewedAt).toISOString();
    }
    if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('weekly_reports')
      .update(dbUpdates)
      .eq('id', reportId)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

// Helper function to extract plain text from rich content
function extractPlainText(content: JSONContent | undefined, section: string): string {
  if (!content || !content.content) return '';
  
  // Simple extraction: concatenate all text nodes
  let text = '';
  let inSection = false;
  
  for (const node of content.content) {
    if (node.type === 'heading' && node.content) {
      const headingText = node.content.map(n => n.text || '').join('');
      if (headingText.toLowerCase().includes(section.toLowerCase())) {
        inSection = true;
        continue;
      } else if (inSection) {
        // Hit next section, stop
        break;
      }
    }
    
    if (inSection && node.type === 'paragraph' && node.content) {
      text += node.content.map(n => n.text || '').join('') + '\n';
    }
  }
  
  return text.trim();
}
```

### Authentication Integration

**No Changes Required**:
- Use existing `useAuth()` hook
- Maintain existing permission checks
- Preserve staff_id filtering

```typescript
function ReportsPage() {
  const { user } = useAuth();
  
  // Existing auth integration works as-is
  useEffect(() => {
    if (user?.staffId) {
      loadReports(user.staffId);
    }
  }, [user?.staffId]);
  
  // ... rest of component
}
```


## Performance Considerations

### Lazy Loading Strategy

**TipTap Editor Lazy Loading**:

```typescript
import { lazy, Suspense } from 'react';

// Lazy load the editor to reduce initial bundle size
const RichTextEditor = lazy(() => import('./components/rich-text-editor'));

function ReportEditorForm() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
          <p className="text-slate-400 text-sm">Loading editor...</p>
        </div>
      }
    >
      <RichTextEditor {...props} />
    </Suspense>
  );
}
```

**TipTap Extensions Lazy Loading**:

```typescript
// Only load extensions when needed
async function loadEditorExtensions(formatType: 'word' | 'spreadsheet' | 'presentation') {
  const baseExtensions = await import('@tiptap/starter-kit');
  const textAlign = await import('@tiptap/extension-text-align');
  const placeholder = await import('@tiptap/extension-placeholder');
  const characterCount = await import('@tiptap/extension-character-count');
  
  const extensions = [
    baseExtensions.StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      bulletList: true,
      orderedList: true,
    }),
    textAlign.TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    placeholder.Placeholder.configure({
      placeholder: 'Start writing your report...',
    }),
    characterCount.CharacterCount.configure({
      limit: 50000,
    }),
  ];
  
  // Load format-specific extensions
  if (formatType === 'spreadsheet') {
    const table = await import('@tiptap/extension-table');
    const tableRow = await import('@tiptap/extension-table-row');
    const tableCell = await import('@tiptap/extension-table-cell');
    const tableHeader = await import('@tiptap/extension-table-header');
    
    extensions.push(
      table.Table.configure({ resizable: true }),
      tableRow.TableRow,
      tableCell.TableCell,
      tableHeader.TableHeader
    );
  }
  
  return extensions;
}
```

### Debouncing for Auto-Save

**Implementation**:

```typescript
import { useEffect, useRef, useCallback } from 'react';

function useAutoSave(
  content: JSONContent | null,
  reportId: string,
  interval: number = 30000 // 30 seconds
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<number>(Date.now());
  
  const saveToLocalStorage = useCallback(() => {
    if (!content) return;
    
    const key = `report-autosave-${reportId}`;
    const data = {
      content,
      timestamp: Date.now(),
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      lastSavedRef.current = Date.now();
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  }, [content, reportId]);
  
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, interval);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, interval, saveToLocalStorage]);
  
  return {
    lastSaved: lastSavedRef.current,
    forceSave: saveToLocalStorage,
  };
}

// Usage in component
function RichTextEditor({ content, onChange, reportId }: RichTextEditorProps) {
  const { lastSaved } = useAutoSave(content, reportId);
  
  return (
    <div>
      <Editor content={content} onChange={onChange} />
      <div className="text-xs text-slate-400">
        Last saved: {formatDistanceToNow(lastSaved)} ago
      </div>
    </div>
  );
}
```

### Optimization for Large Documents

**Virtual Scrolling for Long Content**:

```typescript
// TipTap configuration for large documents
const editor = useEditor({
  extensions: [
    StarterKit,
    // Enable virtual scrolling for performance
    Document.extend({
      content: 'block+',
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none',
    },
    // Optimize rendering for large documents
    handleDOMEvents: {
      scroll: (view, event) => {
        // Implement virtual scrolling if needed
        return false;
      },
    },
  },
  // Debounce updates for better performance
  onUpdate: debounce(({ editor }) => {
    onChange(editor.getJSON());
  }, 100),
});
```

**Content Chunking for Serialization**:

```typescript
function serializeContent(content: JSONContent): string {
  // For very large content, consider chunking
  const serialized = JSON.stringify(content);
  const sizeInBytes = new Blob([serialized]).size;
  
  if (sizeInBytes > 500000) { // 500KB threshold
    console.warn('Large content detected, consider optimization');
    // Could implement compression here if needed
  }
  
  return serialized;
}
```

### Bundle Size Optimization

**Code Splitting**:

```typescript
// Split editor components into separate chunks
const DateRangePicker = lazy(() => import('./components/date-range-picker'));
const DocumentTypeSelector = lazy(() => import('./components/document-type-selector'));
const RichTextEditor = lazy(() => import('./components/rich-text-editor'));
const MediaLinksManager = lazy(() => import('./components/media-links-manager'));

// Split by route
const ReportsPage = lazy(() => import('./pages/reports'));
const ReportEditorForm = lazy(() => import('./components/report-editor-form'));
```

**Tree Shaking**:

```typescript
// Import only what's needed from TipTap
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

// Don't import entire library
// ❌ import * as TipTap from '@tiptap/react';
// ✅ import { useEditor } from '@tiptap/react';
```

### Caching Strategy

**Report Content Caching**:

```typescript
// Cache loaded reports in memory
const reportCache = new Map<string, WeeklyReport>();

async function getReport(reportId: string): Promise<WeeklyReport> {
  // Check cache first
  if (reportCache.has(reportId)) {
    return reportCache.get(reportId)!;
  }
  
  // Fetch from database
  const report = await fetchReportFromDatabase(reportId);
  
  // Cache for future use
  reportCache.set(reportId, report);
  
  return report;
}

// Clear cache when report is updated
async function updateReport(reportId: string, updates: Partial<WeeklyReport>) {
  await updateReportInDatabase(reportId, updates);
  
  // Invalidate cache
  reportCache.delete(reportId);
}
```

**LocalStorage Caching**:

```typescript
// Cache frequently accessed data
function cacheReportMetadata(reports: WeeklyReport[]) {
  const metadata = reports.map(r => ({
    id: r.id,
    week: r.week,
    status: r.status,
    approvalStatus: r.approvalStatus,
  }));
  
  localStorage.setItem('reports-metadata', JSON.stringify(metadata));
}

function getCachedReportMetadata(): Partial<WeeklyReport>[] | null {
  const cached = localStorage.getItem('reports-metadata');
  if (!cached) return null;
  
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}
```

### Database Query Optimization

**Indexed Queries**:

```sql
-- Indexes already defined in schema
CREATE INDEX IF NOT EXISTS idx_reports_staff_id ON weekly_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_date_range ON weekly_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reports_format_type ON weekly_reports(format_type);

-- Optimized query for loading reports
SELECT 
  id, staff_id, week, start_date, end_date,
  rich_content, format_type, status, approval_status,
  media_links, created_at, submitted_at
FROM weekly_reports
WHERE staff_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

**Pagination for Large Result Sets**:

```typescript
async function getReportsPaginated(
  staffId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ reports: WeeklyReport[]; total: number }> {
  const offset = (page - 1) * pageSize;
  
  const { data, error, count } = await supabase
    .from('weekly_reports')
    .select('*', { count: 'exact' })
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  if (error) throw error;
  
  return {
    reports: data ? data.map(dbReportToReport) : [],
    total: count || 0,
  };
}
```

### Memory Management

**Cleanup on Unmount**:

```typescript
function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [...],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });
  
  // Cleanup editor instance on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);
  
  return <EditorContent editor={editor} />;
}
```

**Clear Auto-Save Data**:

```typescript
function clearAutoSaveData(reportId: string) {
  const key = `report-autosave-${reportId}`;
  localStorage.removeItem(key);
}

// Clear on successful submit
async function handleSubmit() {
  await saveReport(report);
  clearAutoSaveData(report.id);
}

// Clear old auto-saves periodically
function cleanupOldAutoSaves() {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  keys.forEach(key => {
    if (key.startsWith('report-autosave-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (now - data.timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    }
  });
}
```

### Performance Monitoring

**Metrics to Track**:

```typescript
// Track editor initialization time
function trackEditorInit() {
  const startTime = performance.now();
  
  const editor = useEditor({
    extensions: [...],
    onCreate: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log to analytics
      console.log(`Editor initialized in ${duration}ms`);
      
      if (duration > 500) {
        console.warn('Editor initialization exceeded 500ms threshold');
      }
    },
  });
  
  return editor;
}

// Track typing latency
function trackTypingLatency(editor: Editor) {
  let lastKeyTime = 0;
  
  editor.on('update', () => {
    const now = performance.now();
    if (lastKeyTime > 0) {
      const latency = now - lastKeyTime;
      if (latency > 50) {
        console.warn(`Typing latency: ${latency}ms (threshold: 50ms)`);
      }
    }
    lastKeyTime = now;
  });
}
```


## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goals**: Set up basic infrastructure and database changes

**Tasks**:
1. Database migration
   - Add new columns (rich_content, format_type, start_date, end_date)
   - Create indexes
   - Test migration on development database
   
2. Install dependencies
   - TipTap and required extensions
   - Update TypeScript types
   
3. Update data models
   - Extend WeeklyReport interface
   - Update DbWeeklyReport interface
   - Implement serialization/deserialization functions
   
4. Backward compatibility layer
   - Implement legacy report conversion
   - Test with existing reports

**Deliverables**:
- Migration script tested and ready
- Updated type definitions
- Conversion utilities implemented

### Phase 2: Core Components (Week 3-4)

**Goals**: Build the main editor components

**Tasks**:
1. DateRangePicker component
   - Implement week selection logic
   - Add date formatting
   - Integrate with react-day-picker
   - Add validation
   
2. DocumentTypeSelector component
   - Create three-option toggle
   - Add icons and styling
   - Implement keyboard navigation
   
3. RichTextEditor component (Word format only)
   - Set up TipTap editor
   - Implement basic toolbar
   - Add formatting controls (bold, italic, underline, headings)
   - Add alignment controls
   - Add list controls
   
4. EditorToolbar component
   - Create toolbar UI
   - Implement button actions
   - Add active state highlighting
   - Add tooltips

**Deliverables**:
- Working DateRangePicker
- Working DocumentTypeSelector
- Working RichTextEditor with basic formatting
- All components styled with dark theme

### Phase 3: Integration (Week 5)

**Goals**: Integrate new components with existing system

**Tasks**:
1. Update ReportsPage
   - Replace old form with new components
   - Maintain existing layout structure
   - Preserve MediaLinksManager integration
   
2. Update storage layer
   - Modify addReport function
   - Modify updateReport function
   - Modify getReports function
   - Add plain text extraction for backward compatibility
   
3. Form validation
   - Implement date validation
   - Implement content validation
   - Add error messages
   - Add form submission blocking
   
4. Auto-save functionality
   - Implement localStorage auto-save
   - Add auto-save indicator
   - Add recovery on page reload
   - Add cleanup on submit

**Deliverables**:
- Fully integrated report editor
- Working auto-save
- Complete validation

### Phase 4: Polish & Accessibility (Week 6)

**Goals**: Enhance UX and ensure accessibility

**Tasks**:
1. Responsive design
   - Implement mobile layout
   - Implement tablet layout
   - Test on different screen sizes
   
2. Accessibility
   - Add ARIA labels
   - Implement keyboard shortcuts
   - Add screen reader announcements
   - Test with keyboard navigation
   - Test with screen readers
   
3. Performance optimization
   - Implement lazy loading
   - Add debouncing
   - Optimize large document handling
   - Test performance metrics
   
4. Error handling
   - Implement error recovery
   - Add retry logic
   - Improve error messages
   - Test error scenarios

**Deliverables**:
- Responsive design working on all devices
- Full accessibility compliance
- Optimized performance
- Robust error handling

### Phase 5: Testing & Documentation (Week 7)

**Goals**: Comprehensive testing and documentation

**Tasks**:
1. Unit tests
   - Component rendering tests
   - User interaction tests
   - Edge case tests
   - Error condition tests
   
2. Property-based tests
   - Implement all 30 properties
   - Configure fast-check
   - Run with 100+ iterations
   
3. Integration tests
   - Database integration tests
   - Real-time update tests
   - Approval workflow tests
   
4. Documentation
   - Component API documentation
   - Usage examples
   - Migration guide
   - Troubleshooting guide

**Deliverables**:
- 80%+ test coverage
- All property tests passing
- Complete documentation

### Phase 6: Advanced Features (Future)

**Goals**: Implement spreadsheet and presentation formats

**Tasks**:
1. Spreadsheet format
   - Add table extensions to TipTap
   - Implement table toolbar
   - Add cell formatting
   - Add row/column operations
   
2. Presentation format
   - Add slide layout system
   - Implement slide navigation
   - Add slide-specific formatting
   - Add presenter notes
   
3. Export functionality
   - Implement PDF export
   - Implement DOCX export
   - Implement print optimization
   
4. Advanced formatting
   - Add font selection
   - Add margin/spacing controls
   - Add color picker
   - Add image insertion

**Deliverables**:
- Working spreadsheet format
- Working presentation format
- Export functionality
- Advanced formatting options

## Migration Guide

### For Developers

**Step 1: Run Database Migration**

```bash
# Connect to Supabase SQL Editor
# Run the migration script

-- Migration: 001_add_rich_editor_columns.sql
BEGIN;

ALTER TABLE weekly_reports
ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS format_type VARCHAR(20) DEFAULT 'word',
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

ALTER TABLE weekly_reports
ADD CONSTRAINT IF NOT EXISTS check_format_type 
CHECK (format_type IN ('word', 'spreadsheet', 'presentation'));

CREATE INDEX IF NOT EXISTS idx_reports_date_range 
ON weekly_reports(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reports_format_type 
ON weekly_reports(format_type);

COMMIT;
```

**Step 2: Install Dependencies**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-align @tiptap/extension-placeholder @tiptap/extension-character-count
```

**Step 3: Update Environment**

No environment variable changes needed.

**Step 4: Deploy Code**

```bash
# Build and deploy
npm run build
npm run deploy
```

**Step 5: Verify Migration**

```bash
# Run tests
npm test

# Check database
# Verify new columns exist
# Verify indexes created
# Verify constraints applied
```

### For Users

**What's Changing**:
- New rich text editor with formatting options
- Interactive calendar for date selection
- Document type selector (Word format available now)
- Auto-save functionality

**What's Staying the Same**:
- All existing reports remain accessible
- Media links functionality unchanged
- Approval workflow unchanged
- Real-time updates unchanged

**How to Use New Features**:

1. **Creating a Report**:
   - Click "New Report"
   - Select week using calendar picker
   - Choose document type (Word)
   - Write content with formatting toolbar
   - Add media links as before
   - Submit report

2. **Formatting Text**:
   - Select text to format
   - Click toolbar buttons (Bold, Italic, etc.)
   - Or use keyboard shortcuts (Ctrl+B, Ctrl+I)

3. **Auto-Save**:
   - Content saves automatically every 30 seconds
   - "Last saved" indicator shows save status
   - Content recovers if browser closes

4. **Editing Existing Reports**:
   - Legacy reports convert automatically
   - Edit as normal with new formatting options
   - Save updates as before

### Rollback Plan

If issues arise, rollback is safe:

1. **Code Rollback**:
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

2. **Database Rollback** (if needed):
   ```sql
   -- Remove new columns (data preserved in legacy columns)
   ALTER TABLE weekly_reports
   DROP COLUMN IF EXISTS rich_content,
   DROP COLUMN IF EXISTS format_type,
   DROP COLUMN IF EXISTS start_date,
   DROP COLUMN IF EXISTS end_date;
   
   -- Remove indexes
   DROP INDEX IF EXISTS idx_reports_date_range;
   DROP INDEX IF EXISTS idx_reports_format_type;
   ```

3. **Data Integrity**:
   - Legacy columns (summary, challenges, goals) remain populated
   - No data loss occurs
   - Old system continues to work

## Security Considerations

### Input Sanitization

**Rich Text Content**:

```typescript
import DOMPurify from 'dompurify';

function sanitizeRichContent(content: JSONContent): JSONContent {
  // TipTap JSON is already structured and safe
  // But sanitize any HTML if converting to HTML
  return content;
}

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'],
  });
}
```

### XSS Prevention

**Content Rendering**:

```typescript
// TipTap handles XSS prevention internally
// But when rendering HTML, use sanitization

function renderReportContent(content: JSONContent): string {
  const html = generateHTML(content, extensions);
  return sanitizeHTML(html);
}
```

### SQL Injection Prevention

**Parameterized Queries**:

```typescript
// Supabase client handles parameterization automatically
// Never construct raw SQL with user input

// ✅ Safe
const { data } = await supabase
  .from('weekly_reports')
  .select('*')
  .eq('staff_id', staffId);

// ❌ Unsafe (don't do this)
// const { data } = await supabase.rpc('raw_query', {
//   query: `SELECT * FROM weekly_reports WHERE staff_id = '${staffId}'`
// });
```

### Authorization

**Row-Level Security**:

```sql
-- Ensure RLS policies are in place
CREATE POLICY "Users can view their own reports"
ON weekly_reports FOR SELECT
USING (staff_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can insert their own reports"
ON weekly_reports FOR INSERT
WITH CHECK (staff_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can update their own draft reports"
ON weekly_reports FOR UPDATE
USING (
  staff_id = current_setting('app.current_user_id')
  AND status = 'draft'
);
```

### Data Validation

**Server-Side Validation**:

```typescript
// Always validate on server side, not just client side

function validateReportOnServer(report: WeeklyReport): ValidationResult {
  // Validate staff_id matches authenticated user
  if (report.staffId !== authenticatedUser.staffId) {
    return { valid: false, error: 'Unauthorized' };
  }
  
  // Validate content size
  const size = JSON.stringify(report.richContent).length;
  if (size > 1024 * 1024) { // 1MB
    return { valid: false, error: 'Content too large' };
  }
  
  // Validate date range
  if (report.startDate && report.endDate) {
    const days = daysBetween(report.startDate, report.endDate);
    if (days !== 6) {
      return { valid: false, error: 'Invalid date range' };
    }
  }
  
  return { valid: true };
}
```

### Rate Limiting

**Auto-Save Rate Limiting**:

```typescript
// Limit auto-save frequency to prevent abuse
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds minimum
const MAX_AUTO_SAVES_PER_HOUR = 120; // 2 per minute max

let autoSaveCount = 0;
let autoSaveResetTime = Date.now() + 3600000; // 1 hour

function canAutoSave(): boolean {
  if (Date.now() > autoSaveResetTime) {
    autoSaveCount = 0;
    autoSaveResetTime = Date.now() + 3600000;
  }
  
  if (autoSaveCount >= MAX_AUTO_SAVES_PER_HOUR) {
    console.warn('Auto-save rate limit exceeded');
    return false;
  }
  
  autoSaveCount++;
  return true;
}
```

## Conclusion

The Enhanced Report Editor design provides a comprehensive upgrade to the Internal Reports system while maintaining full backward compatibility. The phased implementation approach ensures a smooth transition with minimal risk.

Key design decisions:
- **TipTap** for flexible, performant rich text editing
- **JSON storage** for structured, queryable content
- **Additive migration** for zero-downtime deployment
- **Backward compatibility** to preserve existing reports
- **Property-based testing** for comprehensive correctness validation

The design addresses all 15 requirements with 30 testable correctness properties, ensuring the system behaves correctly across all scenarios.

