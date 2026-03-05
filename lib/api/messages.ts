/**
 * Messaging API
 * Plain English functions for messaging operations
 */

import * as supabaseService from '../supabase-service';
import type { Message } from '../types';

// ============================================================================
// Message Retrieval
// ============================================================================

/**
 * Get all messages for a user (sent and received)
 */
export async function getUserMessages(staffId: string): Promise<Message[]> {
  const result = await supabaseService.getMessages(staffId);
  if (!result.success) {
    console.error('Failed to get user messages:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get conversation between two users
 */
export async function getConversationBetween(user1Id: string, user2Id: string): Promise<Message[]> {
  const result = await supabaseService.getMessages(user1Id);
  if (!result.success) {
    console.error('Failed to get conversation:', result.error.message);
    return [];
  }
  
  // Filter for conversation between the two users
  return result.data
    .filter(msg => 
      (msg.senderId === user1Id && msg.recipientId === user2Id) ||
      (msg.senderId === user2Id && msg.recipientId === user1Id)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get unread messages for a user
 */
export async function getUnreadMessages(userId: string): Promise<Message[]> {
  const result = await supabaseService.getMessages(userId);
  if (!result.success) {
    console.error('Failed to get unread messages:', result.error.message);
    return [];
  }
  
  return result.data.filter(msg => !msg.read && msg.recipientId === userId);
}

// ============================================================================
// Message Sending
// ============================================================================

/**
 * Send a text message to another user
 */
export async function sendMessageTo(message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
  const result = await supabaseService.addMessage(message);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Send a file attachment to another user
 */
export async function sendFileAttachment(
  senderId: string,
  recipientId: string,
  fileName: string,
  fileUrl: string
): Promise<void> {
  const message: Omit<Message, 'id' | 'timestamp'> = {
    senderId,
    recipientId,
    type: 'file',
    content: fileName,
    fileUrl,
    read: false
  };
  
  const result = await supabaseService.addMessage(message);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

// ============================================================================
// Message Status
// ============================================================================

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const result = await supabaseService.markMessageAsRead(messageId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
