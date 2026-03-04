-- Migration: Add events table
-- Date: 2024-11
-- Description: Creates events table for Business Intelligence users to create events visible to all users

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_by VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'other',
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "BI users can create events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "BI users can update events" ON events FOR UPDATE USING (true);
CREATE POLICY "BI users can delete events" ON events FOR DELETE USING (true);

-- Add comment
COMMENT ON TABLE events IS 'Events created by Business Intelligence users, visible to all staff';
