-- Migration: Add department filtering to events
-- This allows events to be broadcast to all departments or specific departments

-- Add target_departments column to events table
-- NULL or empty array means "all departments"
-- Array with department names means "specific departments only"
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS target_departments TEXT[] DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_target_departments ON events USING GIN (target_departments);

-- Add comment for documentation
COMMENT ON COLUMN events.target_departments IS 'NULL or empty array = all departments, otherwise specific departments only';
