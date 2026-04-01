-- Migration: Add missing columns to weekly_reports table
-- Purpose: Add columns required by the approved reports viewer feature
-- Feature: approved-reports-viewer
-- Date: 2024-12-19

-- Add missing columns to weekly_reports table
ALTER TABLE weekly_reports 
ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS format_type VARCHAR(50) DEFAULT 'word',
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notification_viewed BOOLEAN DEFAULT FALSE;

-- Add missing column to attendance_records table (used by notification system)
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS notification_viewed BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_reports_notification_viewed ON weekly_reports(notification_viewed);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_approval_status ON weekly_reports(approval_status);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_reviewed_at ON weekly_reports(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_attendance_notification_viewed ON attendance_records(notification_viewed);

-- Add comments for documentation
COMMENT ON COLUMN weekly_reports.rich_content IS 'Rich text content in JSON format for enhanced report editing';
COMMENT ON COLUMN weekly_reports.format_type IS 'Report format type: word, spreadsheet, or presentation';
COMMENT ON COLUMN weekly_reports.start_date IS 'Start date of the reporting period';
COMMENT ON COLUMN weekly_reports.end_date IS 'End date of the reporting period';
COMMENT ON COLUMN weekly_reports.notification_viewed IS 'Whether the user has viewed approval/rejection notifications';
COMMENT ON COLUMN attendance_records.notification_viewed IS 'Whether the user has viewed approval/rejection notifications';