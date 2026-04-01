-- Migration: add_notification_viewed_to_attendance.sql
-- Add notification_viewed column to attendance_records table

ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS notification_viewed BOOLEAN DEFAULT false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_attendance_notification_viewed 
ON attendance_records(staff_id, approval_status, notification_viewed)
WHERE approval_status IN ('approved', 'rejected');

-- Create trigger to reset notification_viewed when approval_status changes
CREATE OR REPLACE FUNCTION reset_attendance_notification_viewed()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) 
     AND (NEW.approval_status IN ('approved', 'rejected')) THEN
    NEW.notification_viewed := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_approval_status_change ON attendance_records;
CREATE TRIGGER attendance_approval_status_change
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION reset_attendance_notification_viewed();

COMMENT ON COLUMN attendance_records.notification_viewed IS 
'Tracks whether staff user has viewed approval status notification';
