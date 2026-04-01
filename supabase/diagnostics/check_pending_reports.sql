-- Diagnostic query to check pending reports
-- Run this in Supabase SQL Editor to see what reports exist and their status

SELECT 
  id,
  staff_id,
  week,
  status,
  approval_status,
  submitted_at,
  created_at,
  department
FROM weekly_reports
ORDER BY created_at DESC
LIMIT 20;

-- Check specifically for submitted reports
SELECT 
  COUNT(*) as total_submitted,
  status,
  approval_status
FROM weekly_reports
WHERE status = 'submitted'
GROUP BY status, approval_status;

-- Check for any reports that might be pending approval
SELECT 
  COUNT(*) as total_pending,
  status,
  approval_status
FROM weekly_reports
WHERE approval_status = 'pending'
GROUP BY status, approval_status;
