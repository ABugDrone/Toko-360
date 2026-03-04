// User and Auth Types
export type UserRole = 'admin' | 'staff' | 'instructor' | 'department_head' | 'senior_instructor';
export type Department = 'IT' | 'Marketing' | 'Communications' | 'Student Support' | 'Business Intelligence' | 'Finance' | 'Logistics & Procurement' | 'Internship & SIWES';
export type AttendanceStatus = 'on_time' | 'late' | 'absent' | 'excused';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'ongoing';
export type MessageType = 'text' | 'file';

export interface User {
  id: string;
  staffId: string;
  name: string;
  email: string;
  department: Department;
  role: UserRole;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastPasswordChange?: number;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

// Attendance
export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  productivity?: number; // 0-100%
  department: Department;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

// Reports
export interface MediaLink {
  id: string;
  type: 'video' | 'audio' | 'document';
  platform: string; // e.g., 'YouTube', 'Vimeo', 'Google Drive', 'Google Docs', etc.
  url: string;
  title?: string;
  description?: string;
}

// TipTap JSON Content Type
export interface JSONContent {
  type: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
  text?: string;
}

export interface WeeklyReport {
  id: string;
  staffId: string;
  week: string; // Display format: "OCT 21 - OCT 27, 2024"
  
  // Legacy fields (maintained for backward compatibility)
  summary: string;
  challenges: string;
  goals: string;
  
  // New fields for rich text editor
  richContent?: JSONContent; // TipTap JSON format
  formatType?: 'word' | 'spreadsheet' | 'presentation'; // Default: 'word'
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  
  status: ReportStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  submittedAt?: number;
  reviewedBy?: string;
  reviewedAt?: number;
  feedback?: string;
  department: Department;
  mediaLinks?: MediaLink[]; // Optional media attachments
}

// Database mapping interface
export interface DbWeeklyReport {
  id: string;
  staff_id: string;
  week: string;
  summary: string;
  challenges: string;
  goals: string;
  rich_content: any; // JSONB
  format_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  approval_status: string | null;
  department: string;
  media_links: any; // JSONB
  created_at: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
}

// Messaging
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  type: MessageType;
  content: string;
  fileUrl?: string;
  timestamp: number;
  read: boolean;
}

export interface MessageConversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  lastMessageTime: number;
}

// Dashboard Metrics
export interface DashboardMetrics {
  activeStaff: number;
  attendanceRate: number;
  avgProductivity: number;
  lateInstances: number;
}

// Admin System Config
export interface SystemConfig {
  lateArrivalThreshold: number; // minutes
  attendanceMethod: 'in_app';
  darkModeForced: boolean;
  systemNotificationsEnabled: boolean;
  apiLatency: number;
  databaseLoad: number;
}

export interface UserManagementEntry {
  identity: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'STBY';
  actions?: string[];
}

// Upcoming Class
export interface UpcomingClass {
  id: string;
  title: string;
  time: string;
  room: string;
  icon?: string;
  color?: string;
}

// Events
export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string; // ISO date string
  eventTime: string; // e.g., "10:30 AM"
  location: string;
  createdBy: string; // staffId
  createdAt: number;
  updatedAt?: number;
  color?: string; // For visual distinction
  category?: 'meeting' | 'training' | 'announcement' | 'deadline' | 'webinar' | 'bootcamp' | 'tedx' | 'other';
  targetDepartments?: string[] | null; // null or empty = all departments, otherwise specific departments
}

// Department Management
export interface DepartmentRecord {
  id: string;
  name: string;
  head: string;
  status: 'active' | 'inactive';
  createdAt: number;
}
