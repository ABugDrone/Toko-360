import { User, AuthSession, AttendanceRecord, WeeklyReport, Message, SystemConfig } from './types';
import { authenticateUser } from './supabase-service';

const STORAGE_KEYS = {
  AUTH_SESSION: 'toko_auth_session',
  DARK_MODE: 'toko_dark_mode',
};

// Auth Session Management
export function setAuthSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
  if (!session) return null;

  try {
    const parsed = JSON.parse(session);
    // Check if session is expired
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

// Authentication with Supabase
// Requirement 16.1, 16.2, 16.3, 16.4, 16.6
export async function login(staffId: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const result = await authenticateUser(staffId, password);
    
    if (!result.success) {
      // Handle specific error messages
      if (result.error.message.includes('Unable to connect')) {
        return { success: false, error: 'Unable to connect to database. Please try again.' };
      }
      return { success: false, error: 'Invalid staff ID or password' };
    }

    // Create session
    const session: AuthSession = {
      user: result.data,
      token: `token-${Date.now()}`, // Generate a simple token for session management
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
    
    setAuthSession(session);
    return { success: true, user: result.data };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

// User Profile Management
// Requirement 17.1, 17.2, 17.3, 18.1, 18.2, 18.3, 18.4, 18.5
export async function getAllUsers(): Promise<User[]> {
  const result = await import('./supabase-service').then(m => m.getAllUsers());
  if (!result.success) {
    console.error('Failed to get all users:', result.error.message);
    return [];
  }
  return result.data;
}

export async function getUserByStaffId(staffId: string): Promise<User | undefined> {
  const result = await import('./supabase-service').then(m => m.getUserByStaffId(staffId));
  if (!result.success) {
    console.error('Failed to get user by staff ID:', result.error.message);
    return undefined;
  }
  return result.data;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateUser(userId, updates));
  if (!result.success) {
    console.error('Failed to update user:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function addUser(user: User): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addUser(user));
  if (!result.success) {
    console.error('Failed to add user:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const result = await import('./supabase-service').then(m => m.deleteUser(userId));
  if (!result.success) {
    console.error('Failed to delete user:', result.error.message);
    throw new Error(result.error.message);
  }
}

// Attendance Management
// Requirement 17.1, 17.2, 19.1, 19.2, 19.3, 19.4, 19.6
export async function getAttendanceRecords(staffId?: string): Promise<AttendanceRecord[]> {
  const result = await import('./supabase-service').then(m => m.getAttendanceRecords(staffId));
  if (!result.success) {
    console.error('Failed to get attendance records:', result.error.message);
    return [];
  }
  return result.data;
}

export async function addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addAttendanceRecord(record));
  if (!result.success) {
    console.error('Failed to add attendance record:', result.error.message);
    // Handle UNIQUE constraint for duplicate date entries
    if (result.error.code === '23505') {
      throw new Error('An attendance record for this date already exists.');
    }
    throw new Error(result.error.message);
  }
}

export async function updateAttendanceRecord(recordId: string, updates: Partial<Omit<AttendanceRecord, 'id' | 'staffId'>>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateAttendanceRecord(recordId, updates));
  if (!result.success) {
    console.error('Failed to update attendance record:', result.error.message);
    throw new Error(result.error.message);
  }
}

// Reports Management
// Requirement 17.1, 17.2, 20.1, 20.2, 20.3, 20.4, 20.5
export async function getReports(staffId?: string): Promise<WeeklyReport[]> {
  const result = await import('./supabase-service').then(m => m.getReports(staffId));
  if (!result.success) {
    console.error('Failed to get reports:', result.error.message);
    return [];
  }
  return result.data;
}

export async function addReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addReport(report));
  if (!result.success) {
    console.error('Failed to add report:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function updateReport(reportId: string, updates: Partial<Omit<WeeklyReport, 'id' | 'staffId' | 'createdAt'>>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateReport(reportId, updates));
  if (!result.success) {
    console.error('Failed to update report:', result.error.message);
    throw new Error(result.error.message);
  }
}

// Messages Management
// Requirement 17.1, 17.2, 21.1, 21.2, 21.3, 21.4, 21.5
export async function getMessages(senderId?: string, recipientId?: string): Promise<Message[]> {
  // If both sender and recipient are provided, filter for conversation between them
  if (senderId && recipientId) {
    const result = await import('./supabase-service').then(m => m.getMessages(senderId));
    if (!result.success) {
      console.error('Failed to get messages:', result.error.message);
      return [];
    }
    // Filter for conversation between the two users and sort by timestamp
    return result.data
      .filter((msg) => 
        (msg.senderId === senderId && msg.recipientId === recipientId) ||
        (msg.senderId === recipientId && msg.recipientId === senderId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // If only sender is provided, get all messages for that user
  if (senderId) {
    const result = await import('./supabase-service').then(m => m.getMessages(senderId));
    if (!result.success) {
      console.error('Failed to get messages:', result.error.message);
      return [];
    }
    return result.data.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  // No filters provided, return empty array
  return [];
}

export async function addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addMessage(message));
  if (!result.success) {
    console.error('Failed to add message:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const result = await import('./supabase-service').then(m => m.markMessageAsRead(messageId));
  if (!result.success) {
    console.error('Failed to mark message as read:', result.error.message);
    throw new Error(result.error.message);
  }
}

// System Config
// Requirement 17.1, 17.2, 22.1, 22.2, 22.3, 22.6
export async function getSystemConfig(): Promise<SystemConfig | null> {
  const result = await import('./supabase-service').then(m => m.getSystemConfig());
  if (!result.success) {
    console.error('Failed to get system config:', result.error.message);
    return null;
  }
  return result.data;
}

export async function updateSystemConfig(config: Partial<SystemConfig>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateSystemConfig(config));
  if (!result.success) {
    console.error('Failed to update system config:', result.error.message);
    throw new Error(result.error.message);
  }
}

// Theme
export function getDarkMode(): boolean {
  const mode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
  return mode ? JSON.parse(mode) : true;
}

export function setDarkMode(enabled: boolean) {
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(enabled));
}

// Department Management
// Requirement 17.1, 17.2, 26
export async function getDepartments(): Promise<import('./types').DepartmentRecord[]> {
  const result = await import('./supabase-service').then(m => m.getDepartments());
  if (!result.success) {
    console.error('Failed to get departments:', result.error.message);
    return [];
  }
  return result.data;
}

export async function addDepartment(department: Omit<import('./types').DepartmentRecord, 'id' | 'createdAt'>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addDepartment(department));
  if (!result.success) {
    console.error('Failed to add department:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function updateDepartment(departmentId: string, updates: Partial<Omit<import('./types').DepartmentRecord, 'id' | 'createdAt'>>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateDepartment(departmentId, updates));
  if (!result.success) {
    console.error('Failed to update department:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  const result = await import('./supabase-service').then(m => m.deleteDepartment(departmentId));
  if (!result.success) {
    console.error('Failed to delete department:', result.error.message);
    throw new Error(result.error.message);
  }
}

// Events Management
export async function getEvents(): Promise<import('./types').Event[]> {
  const result = await import('./supabase-service').then(m => m.getEvents());
  if (!result.success) {
    console.error('Failed to get events:', result.error.message);
    return [];
  }
  return result.data;
}

export async function getEventsByDepartment(department: string): Promise<import('./types').Event[]> {
  const result = await import('./supabase-service').then(m => m.getEventsByDepartment(department));
  if (!result.success) {
    console.error('Failed to get events by department:', result.error.message);
    return [];
  }
  return result.data;
}

export async function addEvent(event: Omit<import('./types').Event, 'id' | 'createdAt'>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.addEvent(event));
  if (!result.success) {
    console.error('Failed to add event:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function updateEvent(eventId: string, updates: Partial<Omit<import('./types').Event, 'id' | 'createdAt'>>): Promise<void> {
  const result = await import('./supabase-service').then(m => m.updateEvent(eventId, updates));
  if (!result.success) {
    console.error('Failed to update event:', result.error.message);
    throw new Error(result.error.message);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const result = await import('./supabase-service').then(m => m.deleteEvent(eventId));
  if (!result.success) {
    console.error('Failed to delete event:', result.error.message);
    throw new Error(result.error.message);
  }
}
