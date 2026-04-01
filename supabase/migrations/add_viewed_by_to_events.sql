-- Migration: add_viewed_by_to_events.sql
-- Add viewed_by column to events table

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '[]'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_viewed_by 
ON events USING gin(viewed_by);

-- Create function to check if user has viewed event
CREATE OR REPLACE FUNCTION user_has_viewed_event(event_viewed_by JSONB, user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN event_viewed_by @> to_jsonb(ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON COLUMN events.viewed_by IS 
'Array of user IDs who have viewed this event';
