-- Migration: Add department targeting to events
-- Date: 2024-11
-- Description: Adds target_departments column to allow events to be broadcast to all or specific departments

-- Add target_departments column (JSONB array of department names)
-- NULL or empty array = broadcast to all departments
-- Array with department names = broadcast to specific departments only
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS target_departments TEXT[] DEFAULT NULL;

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_events_target_departments ON events USING GIN (target_departments);

-- Add comment
COMMENT ON COLUMN events.target_departments IS 'NULL or empty = all departments, otherwise specific departments';

