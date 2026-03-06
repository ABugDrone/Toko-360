-- Ensure uuid extension exists (needed for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Creators or BI can update events" ON public.events;
DROP POLICY IF EXISTS "Creators or BI can delete events" ON public.events;

-- Create events table (if not exists)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_by VARCHAR(50) NOT NULL REFERENCES public.users(staff_id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'other',
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Enable full row replication for real-time DELETE events
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Policy: authenticated users can SELECT (view) all events
CREATE POLICY "Everyone can view events" ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

-- Helper expressions:
-- auth.jwt() ->> 'staff_id'  -> user's staff_id from JWT (string)
-- auth.jwt() ->> 'user_role' -> user's role (e.g. 'bi', 'admin')
-- Adjust claim keys if your JWT uses different names.

-- Policy: allow CREATE if the JWT staff_id equals created_by OR user has BI role
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'staff_id') IS NOT NULL AND
    (
      (auth.jwt() ->> 'staff_id') = created_by
      OR (auth.jwt() ->> 'user_role') = 'bi'
    )
  );

-- Policy: allow UPDATE only for creator or BI users
CREATE POLICY "Creators or BI can update events" ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'staff_id') IS NOT NULL AND
    (
      (auth.jwt() ->> 'staff_id') = created_by
      OR (auth.jwt() ->> 'user_role') = 'bi'
    )
  )
  WITH CHECK (
    -- ensure updates do not spoof created_by unless BI user
    (
      (auth.jwt() ->> 'user_role') = 'bi'
      OR (auth.jwt() ->> 'staff_id') = created_by
    )
  );

-- Policy: allow DELETE only for creator or BI users
CREATE POLICY "Creators or BI can delete events" ON public.events
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'staff_id') IS NOT NULL AND
    (
      (auth.jwt() ->> 'staff_id') = created_by
      OR (auth.jwt() ->> 'user_role') = 'bi'
    )
  );

-- Add comment
COMMENT ON TABLE public.events IS 'Events created by Business Intelligence users, visible to all staff';