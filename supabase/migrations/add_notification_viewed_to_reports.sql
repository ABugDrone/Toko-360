-- Migration: add_notification_viewed_to_reports.sql
-- Add notification_viewed column to weekly_reports table

ALTER TABLE weekly_reports 
ADD COLUMN IF NOT EXISTS notification_viewed BOOLEAN DEFAULT false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_reports_notification_viewed 
ON weekly_reports(staff_id, approval_status, notification_viewed)
WHERE approval_status IN ('approved', 'rejected');

-- Create trigger to reset notification_viewed when approval_status changes
CREATE OR REPLACE FUNCTION reset_report_notification_viewed()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) 
     AND (NEW.approval_status IN ('approved', 'rejected')) THEN
    NEW.notification_viewed := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_approval_status_change ON weekly_reports;
CREATE TRIGGER report_approval_status_change
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION reset_report_notification_viewed();

COMMENT ON COLUMN weekly_reports.notification_viewed IS 
'Tracks whether staff user has viewed approval status notification';
