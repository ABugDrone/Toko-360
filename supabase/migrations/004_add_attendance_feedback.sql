-- Add feedback column to attendance_records table for rejection reasons
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN attendance_records.feedback IS 'Feedback provided by admin when rejecting attendance (max 100 words)';
