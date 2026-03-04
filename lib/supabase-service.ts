import { supabase } from './supabase';
import type {
  User,
  AttendanceRecord,
  WeeklyReport,
  Message,
  SystemConfig,
  DepartmentRecord,
  UserRole,
  Department,
  AttendanceStatus,
  ReportStatus,
  MessageType
} from './types';
import { reportToDbReport, dbReportToReport } from './report-serialization';

// ============================================================================
// Database Types (matching schema.sql)
// ============================================================================

export interface DbUser {
  id: string;
  staff_id: string;
  name: string;
  email: string;
  password: string;
  department: string;
  role: string;
  status: string;
  avatar_url: string | null;
  last_password_change: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  productivity: number | null;
  department: string;
  created_at: string;
  updated_at: string;
}

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
  approval_status: string;
  department: string;
  media_links: any; // JSONB
  created_at: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  content: string;
  file_url: string | null;
  read: boolean;
  created_at: string;
}

export interface DbDepartment {
  id: string;
  name: string;
  head: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbSystemConfig {
  id: string;
  late_arrival_threshold: number;
  attendance_method: string;
  dark_mode_forced: boolean;
  system_notifications_enabled: boolean;
  api_latency: number;
  database_load: number;
  updated_at: string;
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface ServiceError {
  message: string;
  code?: string;
  details?: any;
}

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ServiceError };

// ============================================================================
// Error Handling Wrapper
// ============================================================================

/**
 * Wraps database operations with comprehensive error handling
 * Requirement 25.1, 25.2, 25.5
 */
async function handleDatabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await operation();

    if (error) {
      // Handle specific error types
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            message: 'Unable to connect to database. Please try again.',
            code: error.code,
            details: error
          }
        };
      }

      if (error.code === '23505') {
        return {
          success: false,
          error: {
            message: 'This record already exists.',
            code: error.code,
            details: error
          }
        };
      }

      if (error.code === '23503') {
        return {
          success: false,
          error: {
            message: 'Referenced record not found.',
            code: error.code,
            details: error
          }
        };
      }

      // Generic error
      console.error('Database operation error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred.',
          code: error.code,
          details: error
        }
      };
    }

    if (!data) {
      return {
        success: false,
        error: {
          message: 'No data returned from operation.',
          code: 'NO_DATA'
        }
      };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error in database operation:', err);
    
    // Handle timeout errors
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      return {
        success: false,
        error: {
          message: 'Request timed out. Please check your connection.',
          code: 'TIMEOUT'
        }
      };
    }

    return {
      success: false,
      error: {
        message: err.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR',
        details: err
      }
    };
  }
}

// ============================================================================
// Data Transformation Helpers
// ============================================================================

function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    staffId: dbUser.staff_id,
    name: dbUser.name,
    email: dbUser.email,
    department: dbUser.department as Department,
    role: dbUser.role as UserRole,
    avatar: dbUser.avatar_url || undefined,
    status: dbUser.status as 'online' | 'offline' | 'away',
    lastPasswordChange: dbUser.last_password_change 
      ? new Date(dbUser.last_password_change).getTime() 
      : undefined
  };
}

function dbAttendanceToAttendance(dbRecord: DbAttendanceRecord): AttendanceRecord {
  return {
    id: dbRecord.id,
    staffId: dbRecord.staff_id,
    date: dbRecord.date,
    checkInTime: dbRecord.check_in_time,
    checkOutTime: dbRecord.check_out_time || undefined,
    status: dbRecord.status as AttendanceStatus,
    productivity: dbRecord.productivity || undefined,
    department: dbRecord.department as Department,
    approvalStatus: dbRecord.approval_status as 'pending' | 'approved' | 'rejected',
    approvedBy: dbRecord.approved_by || undefined,
    approvedAt: dbRecord.approved_at || undefined
  };
}

// dbReportToReport function removed - now using the one from report-serialization.ts

function dbMessageToMessage(dbMessage: DbMessage): Message {
  return {
    id: dbMessage.id,
    senderId: dbMessage.sender_id,
    recipientId: dbMessage.recipient_id,
    type: dbMessage.type as MessageType,
    content: dbMessage.content,
    fileUrl: dbMessage.file_url || undefined,
    timestamp: new Date(dbMessage.created_at).getTime(),
    read: dbMessage.read
  };
}

function dbDepartmentToDepartment(dbDept: DbDepartment): DepartmentRecord {
  return {
    id: dbDept.id,
    name: dbDept.name,
    head: dbDept.head,
    status: dbDept.status as 'active' | 'inactive',
    createdAt: new Date(dbDept.created_at).getTime()
  };
}

function dbConfigToConfig(dbConfig: DbSystemConfig): SystemConfig {
  return {
    lateArrivalThreshold: dbConfig.late_arrival_threshold,
    attendanceMethod: dbConfig.attendance_method as 'in_app',
    darkModeForced: dbConfig.dark_mode_forced,
    systemNotificationsEnabled: dbConfig.system_notifications_enabled,
    apiLatency: dbConfig.api_latency,
    databaseLoad: dbConfig.database_load
  };
}

// ============================================================================
// User Service Functions
// Requirement 16.4, 17.4, 18
// ============================================================================

/**
 * Authenticate user by staff_id and password
 * Requirement 16.4
 */
export async function authenticateUser(
  staffId: string,
  password: string
): Promise<ServiceResult<User>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('staff_id', staffId)
      .eq('password', password)
      .single();

    return { data: data ? dbUserToUser(data as DbUser) : null, error };
  });
}

/**
 * Get all users
 * Requirement 17.4
 */
export async function getAllUsers(): Promise<ServiceResult<User[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    return { 
      data: data ? data.map((u: any) => dbUserToUser(u as DbUser)) : null, 
      error 
    };
  });
}

/**
 * Get user by staff_id
 * Requirement 17.4
 */
export async function getUserByStaffId(staffId: string): Promise<ServiceResult<User>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('staff_id', staffId)
      .single();

    return { data: data ? dbUserToUser(data as DbUser) : null, error };
  });
}

/**
 * Update user information
 * Requirement 17.4
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'staffId'>>
): Promise<ServiceResult<User>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.department) dbUpdates.department = updates.department;
    if (updates.role) dbUpdates.role = updates.role;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.status) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    return { data: data ? dbUserToUser(data as DbUser) : null, error };
  });
}

/**
 * Add new user
 * Requirement 17.4
 */
export async function addUser(
  user: Omit<User, 'id'>
): Promise<ServiceResult<User>> {
  return handleDatabaseOperation(async () => {
    const dbUser = {
      staff_id: user.staffId,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      password: '54321', // Default password
      status: user.status || 'online',
      avatar_url: user.avatar || null
    };

    const { data, error } = await supabase
      .from('users')
      .insert(dbUser)
      .select()
      .single();

    return { data: data ? dbUserToUser(data as DbUser) : null, error };
  });
}

/**
 * Delete user
 * Requirement 17.4
 */
export async function deleteUser(userId: string): Promise<ServiceResult<void>> {
  return handleDatabaseOperation(async () => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    return { data: undefined as any, error };
  });
}

// ============================================================================
// Attendance Service Functions
// Requirement 17.4, 19, 23
// ============================================================================

/**
 * Get attendance records, optionally filtered by staff_id
 * Requirement 17.4, 19
 */
export async function getAttendanceRecords(
  staffId?: string
): Promise<ServiceResult<AttendanceRecord[]>> {
  return handleDatabaseOperation(async () => {
    let query = supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    return { 
      data: data ? data.map((r: any) => dbAttendanceToAttendance(r as DbAttendanceRecord)) : null, 
      error 
    };
  });
}

/**
 * Add new attendance record
 * Requirement 17.4, 19
 */
export async function addAttendanceRecord(
  record: Omit<AttendanceRecord, 'id'>
): Promise<ServiceResult<AttendanceRecord>> {
  return handleDatabaseOperation(async () => {
    const dbRecord = {
      staff_id: record.staffId,
      date: record.date,
      check_in_time: record.checkInTime,
      check_out_time: record.checkOutTime || null,
      status: record.status,
      productivity: record.productivity || null,
      department: record.department,
      approval_status: 'pending'
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(dbRecord)
      .select()
      .single();

    return { data: data ? dbAttendanceToAttendance(data as DbAttendanceRecord) : null, error };
  });
}

/**
 * Update attendance record
 * Requirement 17.4, 19
 */
export async function updateAttendanceRecord(
  recordId: string,
  updates: Partial<Omit<AttendanceRecord, 'id' | 'staffId'>>
): Promise<ServiceResult<AttendanceRecord>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.checkInTime) dbUpdates.check_in_time = updates.checkInTime;
    if (updates.checkOutTime) dbUpdates.check_out_time = updates.checkOutTime;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.productivity !== undefined) dbUpdates.productivity = updates.productivity;

    const { data, error } = await supabase
      .from('attendance_records')
      .update(dbUpdates)
      .eq('id', recordId)
      .select()
      .single();

    return { data: data ? dbAttendanceToAttendance(data as DbAttendanceRecord) : null, error };
  });
}

/**
 * Approve attendance record
 * Requirement 23
 */
export async function approveAttendanceRecord(
  recordId: string,
  approvedBy: string
): Promise<ServiceResult<AttendanceRecord>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        approval_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    return { data: data ? dbAttendanceToAttendance(data as DbAttendanceRecord) : null, error };
  });
}

/**
 * Reject attendance record
 * Requirement 23
 */
export async function rejectAttendanceRecord(
  recordId: string,
  rejectedBy: string
): Promise<ServiceResult<AttendanceRecord>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        approval_status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    return { data: data ? dbAttendanceToAttendance(data as DbAttendanceRecord) : null, error };
  });
}

/**
 * Get pending attendance records for approval
 * Requirement 23
 */
export async function getPendingAttendanceRecords(): Promise<ServiceResult<AttendanceRecord[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('approval_status', 'pending')
      .order('date', { ascending: false });

    return { 
      data: data ? data.map((r: any) => dbAttendanceToAttendance(r as DbAttendanceRecord)) : null, 
      error 
    };
  });
}

// ============================================================================
// Weekly Reports Service Functions
// Requirement 17.4, 20, 24
// ============================================================================

/**
 * Get weekly reports, optionally filtered by staff_id
 * Requirement 17.4, 20
 */
export async function getReports(staffId?: string): Promise<ServiceResult<WeeklyReport[]>> {
  return handleDatabaseOperation(async () => {
    let query = supabase
      .from('weekly_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    return { 
      data: data ? data.map((r: any) => dbReportToReport(r as DbWeeklyReport)) : null, 
      error 
    };
  });
}

/**
 * Add new weekly report
 * Requirement 17.4, 20
 */
export async function addReport(
  report: Omit<WeeklyReport, 'id' | 'createdAt'>
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    // Use reportToDbReport to serialize richContent and populate all fields
    const dbReport = reportToDbReport(report);

    const { data, error } = await supabase
      .from('weekly_reports')
      .insert(dbReport)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

/**
 * Update weekly report
 * Requirement 17.4, 20
 */
export async function updateReport(
  reportId: string,
  updates: Partial<Omit<WeeklyReport, 'id' | 'staffId' | 'createdAt'>>
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    // Handle basic fields
    if (updates.week) dbUpdates.week = updates.week;
    if (updates.status) {
      dbUpdates.status = updates.status;
      // Set submitted_at when status changes to submitted
      if (updates.status === 'submitted') {
        dbUpdates.submitted_at = new Date().toISOString();
      }
    }
    if (updates.feedback) dbUpdates.feedback = updates.feedback;

    // Handle rich content and related fields
    if (updates.richContent !== undefined) {
      // Use reportToDbReport to serialize richContent and extract plain text
      const tempReport: WeeklyReport = {
        id: reportId,
        staffId: '', // Not needed for serialization
        week: updates.week || '',
        summary: updates.summary || '',
        challenges: updates.challenges || '',
        goals: updates.goals || '',
        richContent: updates.richContent,
        formatType: updates.formatType,
        startDate: updates.startDate,
        endDate: updates.endDate,
        status: updates.status || 'draft',
        department: updates.department || 'IT',
        createdAt: Date.now(),
        mediaLinks: updates.mediaLinks
      };
      
      const serialized = reportToDbReport(tempReport);
      
      dbUpdates.rich_content = serialized.rich_content;
      dbUpdates.summary = serialized.summary;
      dbUpdates.challenges = serialized.challenges;
      dbUpdates.goals = serialized.goals;
    } else {
      // If richContent not provided, update legacy fields directly
      if (updates.summary) dbUpdates.summary = updates.summary;
      if (updates.challenges) dbUpdates.challenges = updates.challenges;
      if (updates.goals) dbUpdates.goals = updates.goals;
    }

    // Handle format type and dates
    if (updates.formatType) dbUpdates.format_type = updates.formatType;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;

    // Handle media links
    if (updates.mediaLinks !== undefined) {
      dbUpdates.media_links = updates.mediaLinks;
    }

    const { data, error } = await supabase
      .from('weekly_reports')
      .update(dbUpdates)
      .eq('id', reportId)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

/**
 * Approve weekly report
 * Requirement 24
 */
export async function approveReport(
  reportId: string,
  reviewedBy: string,
  feedback?: string
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('weekly_reports')
      .update({
        approval_status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        feedback: feedback || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

/**
 * Reject weekly report
 * Requirement 24
 */
export async function rejectReport(
  reportId: string,
  reviewedBy: string,
  feedback?: string
): Promise<ServiceResult<WeeklyReport>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('weekly_reports')
      .update({
        approval_status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        feedback: feedback || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    return { data: data ? dbReportToReport(data as DbWeeklyReport) : null, error };
  });
}

/**
 * Get pending reports for review
 * Requirement 24
 */
export async function getPendingReports(): Promise<ServiceResult<WeeklyReport[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('approval_status', 'pending')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    return { 
      data: data ? data.map((r: any) => dbReportToReport(r as DbWeeklyReport)) : null, 
      error 
    };
  });
}

// ============================================================================
// Messaging Service Functions
// Requirement 17.4, 21
// ============================================================================

/**
 * Get messages for a user (sent or received)
 * Requirement 17.4, 21
 */
export async function getMessages(staffId: string): Promise<ServiceResult<Message[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${staffId},recipient_id.eq.${staffId}`)
      .order('created_at', { ascending: true });

    return { 
      data: data ? data.map((m: any) => dbMessageToMessage(m as DbMessage)) : null, 
      error 
    };
  });
}

/**
 * Add new message
 * Requirement 17.4, 21
 */
export async function addMessage(
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<ServiceResult<Message>> {
  return handleDatabaseOperation(async () => {
    const dbMessage = {
      sender_id: message.senderId,
      recipient_id: message.recipientId,
      type: message.type,
      content: message.content,
      file_url: message.fileUrl || null,
      read: false
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(dbMessage)
      .select()
      .single();

    return { data: data ? dbMessageToMessage(data as DbMessage) : null, error };
  });
}

/**
 * Mark message as read
 * Requirement 17.4, 21
 */
export async function markMessageAsRead(messageId: string): Promise<ServiceResult<Message>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .select()
      .single();

    return { data: data ? dbMessageToMessage(data as DbMessage) : null, error };
  });
}

// ============================================================================
// Department Service Functions
// Requirement 17.4, 26
// ============================================================================

/**
 * Get all departments
 * Requirement 17.4, 26
 */
export async function getDepartments(): Promise<ServiceResult<DepartmentRecord[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    return { 
      data: data ? data.map((d: any) => dbDepartmentToDepartment(d as DbDepartment)) : null, 
      error 
    };
  });
}

/**
 * Add new department
 * Requirement 17.4, 26
 */
export async function addDepartment(
  department: Omit<DepartmentRecord, 'id' | 'createdAt'>
): Promise<ServiceResult<DepartmentRecord>> {
  return handleDatabaseOperation(async () => {
    const dbDept = {
      name: department.name,
      head: department.head,
      status: department.status || 'active'
    };

    const { data, error } = await supabase
      .from('departments')
      .insert(dbDept)
      .select()
      .single();

    return { data: data ? dbDepartmentToDepartment(data as DbDepartment) : null, error };
  });
}

/**
 * Update department
 * Requirement 17.4, 26
 */
export async function updateDepartment(
  departmentId: string,
  updates: Partial<Omit<DepartmentRecord, 'id' | 'createdAt'>>
): Promise<ServiceResult<DepartmentRecord>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.head) dbUpdates.head = updates.head;
    if (updates.status) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('departments')
      .update(dbUpdates)
      .eq('id', departmentId)
      .select()
      .single();

    return { data: data ? dbDepartmentToDepartment(data as DbDepartment) : null, error };
  });
}

/**
 * Delete department (soft delete by setting status to inactive)
 * Requirement 17.4, 26
 */
export async function deleteDepartment(departmentId: string): Promise<ServiceResult<DepartmentRecord>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('departments')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', departmentId)
      .select()
      .single();

    return { data: data ? dbDepartmentToDepartment(data as DbDepartment) : null, error };
  });
}

// ============================================================================
// System Configuration Service Functions
// Requirement 17.4, 22
// ============================================================================

/**
 * Get system configuration
 * Requirement 17.4, 22
 */
export async function getSystemConfig(): Promise<ServiceResult<SystemConfig>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .limit(1)
      .single();

    return { data: data ? dbConfigToConfig(data as DbSystemConfig) : null, error };
  });
}

/**
 * Update system configuration
 * Requirement 17.4, 22
 */
export async function updateSystemConfig(
  updates: Partial<SystemConfig>
): Promise<ServiceResult<SystemConfig>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.lateArrivalThreshold !== undefined) {
      dbUpdates.late_arrival_threshold = updates.lateArrivalThreshold;
    }
    if (updates.attendanceMethod) {
      dbUpdates.attendance_method = updates.attendanceMethod;
    }
    if (updates.darkModeForced !== undefined) {
      dbUpdates.dark_mode_forced = updates.darkModeForced;
    }
    if (updates.systemNotificationsEnabled !== undefined) {
      dbUpdates.system_notifications_enabled = updates.systemNotificationsEnabled;
    }
    if (updates.apiLatency !== undefined) {
      dbUpdates.api_latency = updates.apiLatency;
    }
    if (updates.databaseLoad !== undefined) {
      dbUpdates.database_load = updates.databaseLoad;
    }

    // Get the first config record
    const { data: configData } = await supabase
      .from('system_config')
      .select('id')
      .limit(1)
      .single();

    if (!configData) {
      return { 
        data: null, 
        error: { message: 'System configuration not found' } 
      };
    }

    const { data, error } = await supabase
      .from('system_config')
      .update(dbUpdates)
      .eq('id', configData.id)
      .select()
      .single();

    return { data: data ? dbConfigToConfig(data as DbSystemConfig) : null, error };
  });
}

// ============================================================================
// Events Management
// ============================================================================

interface DbEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  created_by: string;
  category: string;
  color: string | null;
  target_departments: string[] | null;
  created_at: string;
  updated_at: string | null;
}

function dbEventToEvent(dbEvent: DbEvent): import('./types').Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    eventDate: dbEvent.event_date,
    eventTime: dbEvent.event_time,
    location: dbEvent.location,
    createdBy: dbEvent.created_by,
    category: dbEvent.category as any,
    color: dbEvent.color || undefined,
    targetDepartments: dbEvent.target_departments || null,
    createdAt: new Date(dbEvent.created_at).getTime(),
    updatedAt: dbEvent.updated_at ? new Date(dbEvent.updated_at).getTime() : undefined,
  };
}

/**
 * Get all events
 */
export async function getEvents(): Promise<ServiceResult<import('./types').Event[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    return { 
      data: data ? data.map((event: any) => dbEventToEvent(event as DbEvent)) : [], 
      error 
    };
  });
}

/**
 * Get events filtered by department
 * Returns events where target_departments is null (all departments) or includes the specified department
 */
export async function getEventsByDepartment(department: string): Promise<ServiceResult<import('./types').Event[]>> {
  return handleDatabaseOperation(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`target_departments.is.null,target_departments.cs.{${department}}`)
      .order('event_date', { ascending: true });

    return { 
      data: data ? data.map((event: any) => dbEventToEvent(event as DbEvent)) : [], 
      error 
    };
  });
}

/**
 * Add new event
 */
export async function addEvent(
  event: Omit<import('./types').Event, 'id' | 'createdAt'>
): Promise<ServiceResult<import('./types').Event>> {
  return handleDatabaseOperation(async () => {
    const dbEvent = {
      title: event.title,
      description: event.description,
      event_date: event.eventDate,
      event_time: event.eventTime,
      location: event.location,
      created_by: event.createdBy,
      category: event.category || 'other',
      color: event.color || null,
      target_departments: event.targetDepartments || null,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(dbEvent)
      .select()
      .single();

    return { data: data ? dbEventToEvent(data as DbEvent) : null, error };
  });
}

/**
 * Update event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<import('./types').Event, 'id' | 'createdAt'>>
): Promise<ServiceResult<import('./types').Event>> {
  return handleDatabaseOperation(async () => {
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.eventDate) dbUpdates.event_date = updates.eventDate;
    if (updates.eventTime) dbUpdates.event_time = updates.eventTime;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.color) dbUpdates.color = updates.color;
    if (updates.targetDepartments !== undefined) dbUpdates.target_departments = updates.targetDepartments;

    const { data, error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', eventId)
      .select()
      .single();

    return { data: data ? dbEventToEvent(data as DbEvent) : null, error };
  });
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string): Promise<ServiceResult<null>> {
  return handleDatabaseOperation(async () => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    return { data: null, error };
  });
}
