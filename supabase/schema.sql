-- Toko 360 Staff Portal Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '54321',
  department VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'online',
  avatar_url TEXT,
  last_password_change TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  approval_status VARCHAR(20) DEFAULT 'pending',
  approved_by VARCHAR(50),
  approved_at TIMESTAMP,
  productivity INTEGER CHECK (productivity >= 0 AND productivity <= 100),
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Weekly reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  week VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  challenges TEXT NOT NULL,
  goals TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  approval_status VARCHAR(20) DEFAULT 'pending',
  department VARCHAR(100) NOT NULL,
  media_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  reviewed_by VARCHAR(50),
  reviewed_at TIMESTAMP,
  feedback TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  recipient_id VARCHAR(50) NOT NULL REFERENCES users(staff_id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  file_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  head VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System config table
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  late_arrival_threshold INTEGER DEFAULT 15,
  attendance_method VARCHAR(50) DEFAULT 'in_app',
  dark_mode_forced BOOLEAN DEFAULT TRUE,
  system_notifications_enabled BOOLEAN DEFAULT TRUE,
  api_latency INTEGER DEFAULT 0,
  database_load INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
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
  target_departments TEXT[] DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_reports_staff_id ON weekly_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_target_departments ON events USING GIN (target_departments);

-- Insert default departments
INSERT INTO departments (name, head, status) VALUES
  ('IT', 'Alex Rivera', 'active'),
  ('Marketing', 'Sarah Jenkins', 'active'),
  ('Communications', 'Jordan Miller', 'active'),
  ('Student Support', 'Alex Chen', 'active'),
  ('Business Intelligence', 'Daniel Ishaku', 'active'),
  ('Finance', 'Julian Drax', 'active'),
  ('Logistics & Procurement', 'David Miller', 'active'),
  ('Internship & SIWES', 'Management Channel', 'active')
ON CONFLICT (name) DO NOTHING;

-- Insert default users
INSERT INTO users (staff_id, name, email, password, department, role, status) VALUES
  ('AR001', 'Alex Rivera', 'a.rivera@toko.edu', '54321', 'IT', 'department_head', 'online'),
  ('SJ002', 'Sarah Jenkins', 's.jenkins@toko.edu', '54321', 'Marketing', 'department_head', 'online'),
  ('JM003', 'Jordan Miller', 'j.miller@toko.edu', '54321', 'Communications', 'department_head', 'online'),
  ('AC004', 'Alex Chen', 'a.chen@toko.edu', '54321', 'Student Support', 'department_head', 'online'),
  ('DI005', 'Daniel Ishaku', 'd.ishaku@toko.edu', '54321', 'Business Intelligence', 'admin', 'online'),
  ('JD006', 'Julian Drax', 'j.drax@toko.edu', '54321', 'Finance', 'department_head', 'online'),
  ('DM007', 'David Miller', 'd.miller@toko.edu', '54321', 'Logistics & Procurement', 'department_head', 'online'),
  ('MC008', 'Management Channel', 'management@toko.edu', '54321', 'Internship & SIWES', 'department_head', 'online'),
  ('AY009', 'Abdulazeez Yunusa', 'a.yunusa@toko.edu', '54321', 'IT', 'staff', 'online')
ON CONFLICT (staff_id) DO NOTHING;

-- Insert default system config
INSERT INTO system_config (late_arrival_threshold, attendance_method, dark_mode_forced, system_notifications_enabled)
VALUES (15, 'in_app', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (true);

-- Create policies for attendance_records
CREATE POLICY "Users can view their own attendance" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Users can insert their own attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own attendance" ON attendance_records FOR UPDATE USING (true);

-- Create policies for weekly_reports
CREATE POLICY "Users can view all reports" ON weekly_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reports" ON weekly_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own reports" ON weekly_reports FOR UPDATE USING (true);

-- Create policies for messages
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE USING (true);

-- Create policies for departments
CREATE POLICY "Everyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (true);

-- Create policies for system_config
CREATE POLICY "Everyone can view config" ON system_config FOR SELECT USING (true);
CREATE POLICY "Admins can update config" ON system_config FOR UPDATE USING (true);

-- Create policies for events
CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "BI users can create events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "BI users can update events" ON events FOR UPDATE USING (true);
CREATE POLICY "BI users can delete events" ON events FOR DELETE USING (true);
