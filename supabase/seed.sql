-- Toko 360 Staff Portal - Seed Data
-- Run this AFTER running schema.sql

-- Insert Departments
INSERT INTO departments (name, head, status, created_at) VALUES
  ('IT', 'Alex Rivera', 'active', NOW()),
  ('Marketing', 'Sarah Jenkins', 'active', NOW()),
  ('Communications', 'Jordan Miller', 'active', NOW()),
  ('Student Support', 'Alex Chen', 'active', NOW()),
  ('Business Intelligence', 'Daniel Ishaku', 'active', NOW()),
  ('Finance', 'Julian Drax', 'active', NOW()),
  ('Logistics & Procurement', 'David Miller', 'active', NOW()),
  ('Internship & SIWES', 'Management Channel', 'active', NOW())
ON CONFLICT (name) DO UPDATE SET head = EXCLUDED.head;

-- Insert Users
INSERT INTO users (staff_id, name, email, department, role, status) VALUES
  ('ADMIN001', 'Daniel Ishaku', 'daniel.ishaku@toko360.com', 'Business Intelligence', 'admin', 'online'),
  ('ADMIN002', 'Sunshine', 'sunshine@toko360.com', 'Business Intelligence', 'admin', 'online'),
  ('AR001', 'Arinze Raphael', 'arinze.raphael@toko360.com', 'Business Intelligence', 'staff', 'online'),
  ('AR002', 'Adaeze Rita', 'adaeze.rita@toko360.com', 'Business Intelligence', 'staff', 'online'),
  ('SJ001', 'Samuel Johnson', 'samuel.johnson@toko360.com', 'Sales & Marketing', 'staff', 'online'),
  ('SJ002', 'Sarah James', 'sarah.james@toko360.com', 'Sales & Marketing', 'staff', 'online'),
  ('OP001', 'Oluwaseun Peters', 'oluwaseun.peters@toko360.com', 'Operations', 'staff', 'online'),
  ('OP002', 'Onyeka Paul', 'onyeka.paul@toko360.com', 'Operations', 'staff', 'online'),
  ('CS001', 'Chioma Stephen', 'chioma.stephen@toko360.com', 'Customer Service', 'staff', 'online'),
  ('CS002', 'Chiamaka Samuel', 'chiamaka.samuel@toko360.com', 'Customer Service', 'staff', 'online'),
  ('FN001', 'Funmilayo Nelson', 'funmilayo.nelson@toko360.com', 'Finance', 'staff', 'online'),
  ('FN002', 'Felix Nnamdi', 'felix.nnamdi@toko360.com', 'Finance', 'staff', 'online'),
  ('HR001', 'Hannah Roberts', 'hannah.roberts@toko360.com', 'Human Resources', 'staff', 'online'),
  ('HR002', 'Henry Richard', 'henry.richard@toko360.com', 'Human Resources', 'staff', 'online'),
  ('IT001', 'Ibrahim Thomas', 'ibrahim.thomas@toko360.com', 'IT', 'staff', 'online'),
  ('IT002', 'Ifeoma Timothy', 'ifeoma.timothy@toko360.com', 'IT', 'staff', 'online'),
  ('LG001', 'Lawrence Gabriel', 'lawrence.gabriel@toko360.com', 'Logistics', 'staff', 'online'),
  ('LG002', 'Linda George', 'linda.george@toko360.com', 'Logistics', 'staff', 'online')
ON CONFLICT (staff_id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  role = EXCLUDED.role;

-- Insert System Config
INSERT INTO system_config (late_arrival_threshold, attendance_method, dark_mode_forced, system_notifications_enabled)
VALUES (15, 'in_app', TRUE, TRUE);

-- Insert Sample Attendance Records
-- No sample attendance records - starting fresh
-- Users can start clocking in from today


-- Insert Sample Weekly Reports with Media Links
-- No sample reports - starting fresh
-- Users can start submitting reports from today


-- Insert Sample Events
INSERT INTO events (title, description, event_date, event_time, location, created_by, category, color) VALUES
  (
    'Welcome to Toko 360',
    'System is now live and ready for use. All staff can start using the portal for attendance, reports, and messaging.',
    CURRENT_DATE,
    '09:00 AM',
    'Online',
    'ADMIN001',
    'announcement',
    'bg-cyan-600'
  ),
  (
    'Weekly Report Submission',
    'Submit your weekly reports through the Internal Reports section. Reports help track progress and achievements.',
    CURRENT_DATE + INTERVAL '7 days',
    '05:00 PM',
    'Online Submission',
    'ADMIN001',
    'deadline',
    'bg-red-600'
  )
ON CONFLICT DO NOTHING;
