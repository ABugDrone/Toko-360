/**
 * User Management API
 * Plain English functions for user operations
 */

import * as supabaseService from '../supabase-service';
import type { User } from '../types';

// ============================================================================
// Authentication
// ============================================================================

/**
 * Check if user credentials are valid
 */
export async function checkUserCredentials(staffId: string, password: string): Promise<User | null> {
  const result = await supabaseService.authenticateUser(staffId, password);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

// ============================================================================
// User Retrieval
// ============================================================================

/**
 * Get all users in the system
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await supabaseService.getAllUsers();
  if (!result.success) {
    console.error('Failed to get all users:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Find a specific user by their staff ID
 */
export async function findUserByStaffId(staffId: string): Promise<User | null> {
  const result = await supabaseService.getUserByStaffId(staffId);
  if (!result.success) {
    console.error('Failed to find user by staff ID:', result.error.message);
    return null;
  }
  return result.data;
}

/**
 * Find a specific user by their unique ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.id === userId) || null;
}

// ============================================================================
// User Modification
// ============================================================================

/**
 * Update user information
 */
export async function updateUserInfo(userId: string, updates: Partial<User>): Promise<void> {
  const result = await supabaseService.updateUser(userId, updates);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Create a new user account
 */
export async function createNewUser(user: Omit<User, 'id'>): Promise<void> {
  const result = await supabaseService.addUser(user);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Remove a user from the system
 */
export async function removeUser(userId: string): Promise<void> {
  const result = await supabaseService.deleteUser(userId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Update user's profile picture
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await updateUserInfo(userId, { avatar: avatarUrl });
}
