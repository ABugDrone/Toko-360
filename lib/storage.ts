import { User, AuthSession, AttendanceRecord, WeeklyReport, Message, SystemConfig } from './types';
import * as api from './api';

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
    const user = await api.checkUserCredentials(staffId, password);
    
    // Create session
    const session: AuthSession = {
      user,
      token: `token-${Date.now()}`, // Generate a simple token for session management
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };
    
    setAuthSession(session);
    return { success: true, user };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific error messages
    if (error.message.includes('Unable to connect')) {
      return { success: false, error: 'Unable to connect to database. Please try again.' };
    }
    
    return { success: false, error: 'Invalid staff ID or password' };
  }
}

// User Profile Management
// Requirement 17.1, 17.2, 17.3, 18.1, 18.2, 18.3, 18.4, 18.5
export async function getAllUsers(): Promise<User[]> {
  return api.getAllUsers();
}

export async function getUserByStaffId(staffId: string): Promise<User | undefined> {
  const user = await api.findUserByStaffId(staffId);
  return user || undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await api.findUserById(id);
  return user || undefined;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  await api.updateUserInfo(userId, updates);
}

export async function addUser(user: User): Promise<void> {
  await api.createNewUser(user);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.removeUser(userId);
}

// Attendance Management
// Requirement 17.1, 17.2, 19.1, 19.2, 19.3, 19.4, 19.6
export async function getAttendanceRecords(staffId?: string): Promise<AttendanceRecord[]> {
  if (staffId) {
    return api.getStaffAttendanceHistory(staffId);
  }
  return api.getAllAttendanceRecords();
}

export async function addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<void> {
  try {
    await api.recordCheckIn(record);
  } catch (error: any) {
    // Handle UNIQUE constraint for duplicate date entries
    if (error.message.includes('already exists')) {
      throw new Error('An attendance record for this date already exists.');
    }
    throw error;
  }
}

export async function updateAttendanceRecord(recordId: string, updates: Partial<Omit<AttendanceRecord, 'id' | 'staffId'>>): Promise<void> {
  await api.updateAttendanceRecord(recordId, updates);
}

// Reports Management
// Requirement 17.1, 17.2, 20.1, 20.2, 20.3, 20.4, 20.5
export async function getReports(staffId?: string): Promise<WeeklyReport[]> {
  if (staffId) {
    return api.getStaffReports(staffId);
  }
  return api.getAllReports();
}

export async function addReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>): Promise<void> {
  await api.submitWeeklyReport(report);
}

export async function updateReport(reportId: string, updates: Partial<Omit<WeeklyReport, 'id' | 'staffId' | 'createdAt'>>): Promise<void> {
  await api.updateWeeklyReport(reportId, updates);
}

// Messages Management
// Requirement 17.1, 17.2, 21.1, 21.2, 21.3, 21.4, 21.5
export async function getMessages(senderId?: string, recipientId?: string): Promise<Message[]> {
  // If both sender and recipient are provided, filter for conversation between them
  if (senderId && recipientId) {
    return api.getConversationBetween(senderId, recipientId);
  }
  
  // If only sender is provided, get all messages for that user
  if (senderId) {
    return api.getUserMessages(senderId);
  }
  
  // No filters provided, return empty array
  return [];
}

// Conversation Summary Interface
export interface ConversationSummary {
  otherUserId: string;
  lastMessage: Message | null;
  lastMessageTime: number;
  unreadCount: number;
}

/**
 * Get conversation summaries for a user
 * Aggregates messages into conversations with last message, timestamp, and unread count
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 4.1
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  try {
    // Get all messages for the user
    const messages = await api.getUserMessages(userId);
    
    if (messages.length === 0) {
      return [];
    }
    
    // Group messages by conversation partner
    const conversationMap = new Map<string, Message[]>();
    
    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, []);
      }
      conversationMap.get(otherUserId)!.push(message);
    }
    
    // Create conversation summaries
    const conversations: ConversationSummary[] = [];
    
    for (const [otherUserId, conversationMessages] of conversationMap.entries()) {
      // Sort messages by timestamp to get the most recent
      const sortedMessages = conversationMessages.sort((a, b) => b.timestamp - a.timestamp);
      const lastMessage = sortedMessages[0];
      
      // Count unread messages where current user is recipient
      const unreadCount = conversationMessages.filter(
        msg => msg.recipientId === userId && !msg.read
      ).length;
      
      conversations.push({
        otherUserId,
        lastMessage,
        lastMessageTime: lastMessage.timestamp,
        unreadCount
      });
    }
    
    // Sort conversations by most recent activity (descending)
    return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
  } catch (error: any) {
    console.error('Failed to get conversations:', error);
    throw new Error(`Failed to get conversations: ${error.message}`);
  }
}

export async function addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
  await api.sendMessageTo(message);
}

/**
 * Mark all messages in a conversation as read
 * Only marks messages where the current user is the recipient
 * Requirements: 5.1, 5.4
 */
export async function markConversationAsRead(
  userId: string,
  otherUserId: string
): Promise<void> {
  try {
    // Get all messages in the conversation
    const messages = await api.getConversationBetween(userId, otherUserId);
    
    // Filter for unread messages where current user is recipient
    const unreadMessages = messages.filter(
      msg => msg.recipientId === userId && !msg.read
    );
    
    // Mark each unread message as read
    for (const message of unreadMessages) {
      await api.markMessageAsRead(message.id);
    }
  } catch (error: any) {
    console.error('Failed to mark conversation as read:', error);
    throw new Error(`Failed to mark conversation as read: ${error.message}`);
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await api.markMessageAsRead(messageId);
}

export async function clearChat(user1Id: string, user2Id: string): Promise<void> {
  await api.clearConversation(user1Id, user2Id);
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
  return api.getAllDepartments();
}

export async function addDepartment(department: Omit<import('./types').DepartmentRecord, 'id' | 'createdAt'>): Promise<void> {
  await api.createNewDepartment(department);
}

export async function updateDepartment(departmentId: string, updates: Partial<Omit<import('./types').DepartmentRecord, 'id' | 'createdAt'>>): Promise<void> {
  await api.updateDepartmentInfo(departmentId, updates);
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  await api.deactivateDepartment(departmentId);
}

// Events Management
export async function getEvents(): Promise<import('./types').Event[]> {
  return api.getUpcomingEvents();
}

export async function getEventsByDepartment(department: string): Promise<import('./types').Event[]> {
  return api.getDepartmentEvents(department);
}

export async function addEvent(event: Omit<import('./types').Event, 'id' | 'createdAt'>): Promise<void> {
  await api.createNewEvent(event);
}

export async function updateEvent(eventId: string, updates: Partial<Omit<import('./types').Event, 'id' | 'createdAt'>>): Promise<void> {
  await api.updateExistingEvent(eventId, updates);
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.cancelEvent(eventId);
}
