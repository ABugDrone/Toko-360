-- Migration: Add Rich Editor Columns to weekly_reports
-- Description: Adds columns for rich text content, format type, and date range fields
-- Safe to run on production without downtime (additive migration)

BEGIN;

-- Add new columns with defaults
ALTER TABLE weekly_reports
ADD COLUMN IF NOT EXISTS rich_content JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS format_type VARCHAR(20) DEFAULT 'word',
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL;

-- Add check constraint for format_type (drop first if exists to make idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_format_type'
  ) THEN
    ALTER TABLE weekly_reports
    ADD CONSTRAINT check_format_type 
    CHECK (format_type IN ('word', 'spreadsheet', 'presentation'));
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_date_range 
ON weekly_reports(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reports_format_type 
ON weekly_reports(format_type);

-- Add comment for documentation
COMMENT ON COLUMN weekly_reports.rich_content IS 'TipTap JSON format content with formatting';
COMMENT ON COLUMN weekly_reports.format_type IS 'Document format type: word, spreadsheet, or presentation';
COMMENT ON COLUMN weekly_reports.start_date IS 'Week start date extracted from week string';
COMMENT ON COLUMN weekly_reports.end_date IS 'Week end date extracted from week string';

COMMIT;
