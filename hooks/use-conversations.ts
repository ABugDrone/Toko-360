/**
 * useConversations Hook
 * Manages conversation state and provides conversation aggregation logic
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 4.1
 */

import { useState, useEffect, useCallback } from 'react';
import { getConversations, getUserByStaffId, type ConversationSummary } from '@/lib/storage';
import type { User } from '@/lib/types';

export interface ConversationData {
  id: string; // Derived from participant IDs
  participantIds: string[];
  otherUser: User;
  lastMessage: ConversationSummary['lastMessage'];
  lastMessageTime: number;
  unreadCount: number;
}

export interface UseConversationsOptions {
  userId: string | undefined;
  refreshTrigger?: number; // Increment to force refresh
}

export interface UseConversationsReturn {
  conversations: ConversationData[];
  totalUnreadCount: number;
  isLoading: boolean;
  error: Error | null;
  refreshConversations: () => Promise<void>;
}

/**
 * Generate deterministic conversation ID from participant IDs
 */
function generateConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv-${sorted[0]}-${sorted[1]}`;
}

/**
 * Custom hook for managing conversations
 */
export function useConversations(options: UseConversationsOptions): UseConversationsReturn {
  const { userId, refreshTrigger } = options;
  
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setTotalUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get conversation summaries
      const summaries = await getConversations(userId);

      // Enrich with user data
      const enrichedConversations: ConversationData[] = [];
      let totalUnread = 0;

      for (const summary of summaries) {
        try {
          const otherUser = await getUserByStaffId(summary.otherUserId);
          
          if (otherUser) {
            enrichedConversations.push({
              id: generateConversationId(userId, summary.otherUserId),
              participantIds: [userId, summary.otherUserId],
              otherUser,
              lastMessage: summary.lastMessage,
              lastMessageTime: summary.lastMessageTime,
              unreadCount: summary.unreadCount
            });
            
            totalUnread += summary.unreadCount;
          }
        } catch (userError) {
          console.error(`Failed to fetch user ${summary.otherUserId}:`, userError);
          // Continue with other conversations even if one user fetch fails
        }
      }

      // Sort by most recent activity (already sorted from getConversations, but ensure it)
      enrichedConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

      setConversations(enrichedConversations);
      setTotalUnreadCount(totalUnread);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch conversations');
      setError(error);
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  // Initial load and refresh on userId or refreshTrigger change
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  return {
    conversations,
    totalUnreadCount,
    isLoading,
    error,
    refreshConversations
  };
}
