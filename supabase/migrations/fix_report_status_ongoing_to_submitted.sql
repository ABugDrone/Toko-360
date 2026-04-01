-- Fix existing reports with status 'ongoing' to 'submitted'
-- This fixes reports that were submitted but have the wrong status

UPDATE weekly_reports
SET status = 'submitted'
WHERE status = 'ongoing'
  AND submitted_at IS NOT NULL;

-- Verify the update
SELECT 
  COUNT(*) as updated_reports,
  status,
  approval_status
FROM weekly_reports
WHERE status = 'submitted'
GROUP BY status, approval_status;
