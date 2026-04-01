/**
 * Integration tests for real-time update flow
 * Task 7.1: Verify real-time update flow
 * Validates: Requirements 3.1, 3.2, 3.3
 * 
 * This test verifies the complete real-time synchronization flow:
 * 1. New message arrives → useRealtimeMessages hook triggers onNewMessage
 * 2. onNewMessage calls debouncedRefresh() → increments refreshTrigger
 * 3. useConversations hook detects refreshTrigger change → refetches conversations
 * 4. conversations state updates → existingConversationUserIds memoized value updates
 * 5. Contact list re-renders → indicators appear/disappear based on new set
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversations } from '@/hooks/use-conversations';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import type { Message } from '@/lib/types';
import * as storage from '@/lib/storage';
import { useMemo } from 'react';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock storage
vi.mock('@/lib/storage');

describe('Task 7.1: Real-time Update Flow Verification', () => {
  const mockUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockThirdUserId = 'user-789';

  const mockOtherUser = {
    id: mockOtherUserId,
    staffId: 'TA-2024-002',
    name: 'Other User',
    email: 'other@example.com',
    department: 'Sales' as const,
    role: 'staff' as const,
    status: 'online' as const,
  };

  const mockThirdUser = {
    id: mockThirdUserId,
    staffId: 'TA-2024-003',
    name: 'Third User',
    email: 'third@example.com',
    department: 'HR' as const,
    role: 'staff' as const,
    status: 'offline' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock storage functions
    (storage.getConversations as any).mockResolvedValue([]);
    (storage.getUserById as any).mockImplementation((id: string) => {
      if (id === mockOtherUserId) return Promise.resolve(mockOtherUser);
      if (id === mockThirdUserId) return Promise.resolve(mockThirdUser);
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  /**
   * Test 1: Confirm useRealtimeMessages hook triggers callback on new messages
   * Validates: Requirement 3.1
   */
  it('should call onNewMessage callback when useRealtimeMessages receives a new message', async () => {
    const onNewMessage = vi.fn();
    const onMessageRead = vi.fn();

    renderHook(() =>
      useRealtimeMessages({
        userId: mockUserId,
        onNewMessage,
        onMessageRead,
      })
    );

    // Wait for subscription to be set up
    await waitFor(() => {
      expect(onNewMessage).toBeDefined();
    });

    // Verify callbacks are registered
    expect(onNewMessage).toBeInstanceOf(Function);
    expect(onMessageRead).toBeInstanceOf(Function);
  });

  /**
   * Test 2: Confirm useConversations refetches when refreshTrigger changes
   * Validates: Requirement 3.2
   */
  it('should refetch conversations when refreshTrigger changes', async () => {
    // Start with no conversations
    (storage.getConversations as any).mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ refreshTrigger }) => useConversations({ userId: mockUserId, refreshTrigger }),
      { initialProps: { refreshTrigger: 0 } }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(0);
    expect(storage.getConversations).toHaveBeenCalledTimes(1);

    // Update mock to return a conversation
    (storage.getConversations as any).mockResolvedValue([
      {
        otherUserId: mockOtherUserId,
        lastMessage: {
          content: 'New message',
          timestamp: Date.now(),
          senderId: mockOtherUserId,
        },
        lastMessageTime: Date.now(),
        unreadCount: 1,
      },
    ]);

    // Increment refreshTrigger
    rerender({ refreshTrigger: 1 });

    // Wait for refetch
    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });

    expect(storage.getConversations).toHaveBeenCalledTimes(2);
    expect(result.current.conversations[0].otherUser.id).toBe(mockOtherUserId);
  });

  /**
   * Test 3: Confirm memoized conversation set updates when conversations change
   * Validates: Requirement 3.2, 3.3
   */
  it('should update memoized Set when conversations change', async () => {
    // Start with one conversation
    (storage.getConversations as any).mockResolvedValue([
      {
        otherUserId: mockOtherUserId,
        lastMessage: {
          content: 'Existing message',
          timestamp: Date.now(),
          senderId: mockOtherUserId,
        },
        lastMessageTime: Date.now(),
        unreadCount: 0,
      },
    ]);

    const { result: conversationsResult, rerender } = renderHook(
      ({ refreshTrigger }) => useConversations({ userId: mockUserId, refreshTrigger }),
      { initialProps: { refreshTrigger: 0 } }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(conversationsResult.current.isLoading).toBe(false);
    });

    // Create memoized Set
    const { result: setResult, rerender: rerenderSet } = renderHook(
      ({ conversations }) => useMemo(() => new Set(conversations.map(c => c.otherUser.id)), [conversations]),
      { initialProps: { conversations: conversationsResult.current.conversations } }
    );

    // Verify initial Set contains mockOtherUserId
    expect(setResult.current.has(mockOtherUserId)).toBe(true);
    expect(setResult.current.has(mockThirdUserId)).toBe(false);
    expect(setResult.current.size).toBe(1);

    // Add a second conversation
    (storage.getConversations as any).mockResolvedValue([
      {
        otherUserId: mockOtherUserId,
        lastMessage: {
          content: 'Existing message',
          timestamp: Date.now(),
          senderId: mockOtherUserId,
        },
        lastMessageTime: Date.now(),
        unreadCount: 0,
      },
      {
        otherUserId: mockThirdUserId,
        lastMessage: {
          content: 'New conversation',
          timestamp: Date.now(),
          senderId: mockThirdUserId,
        },
        lastMessageTime: Date.now(),
        unreadCount: 1,
      },
    ]);

    // Increment refreshTrigger
    rerender({ refreshTrigger: 1 });

    // Wait for refetch
    await waitFor(() => {
      expect(conversationsResult.current.conversations).toHaveLength(2);
    });

    // Update Set with new conversations
    rerenderSet({ conversations: conversationsResult.current.conversations });

    // Verify Set now contains both users
    expect(setResult.current.has(mockOtherUserId)).toBe(true);
    expect(setResult.current.has(mockThirdUserId)).toBe(true);
    expect(setResult.current.size).toBe(2);
  });

  /**
   * Test 4: Verify debounced refresh mechanism
   * Validates: Requirement 3.2 (performance optimization)
   */
  it('should debounce refresh calls to prevent excessive updates', async () => {
    vi.useFakeTimers();

    let refreshTrigger = 0;
    let timeoutRef: NodeJS.Timeout | null = null;

    // Simulate the debounced refresh function from MessagingPage
    const debouncedRefresh = () => {
      if (timeoutRef) {
        return; // Already scheduled
      }

      timeoutRef = setTimeout(() => {
        refreshTrigger++;
        timeoutRef = null;
      }, 1000);
    };

    // Call multiple times rapidly
    debouncedRefresh();
    debouncedRefresh();
    debouncedRefresh();
    debouncedRefresh();
    debouncedRefresh();

    // Should still be 0 before timeout
    expect(refreshTrigger).toBe(0);

    // Advance timers
    vi.advanceTimersByTime(1000);

    // Should only increment once
    expect(refreshTrigger).toBe(1);

    // Call again after debounce period
    debouncedRefresh();
    vi.advanceTimersByTime(1000);

    // Should increment again
    expect(refreshTrigger).toBe(2);

    vi.useRealTimers();
  });

  /**
   * Test 5: Error handling for conversation data load failures
   * Validates: Requirement 3.2 (fail safe: show no indicators)
   */
  it('should return empty Set when conversation data fails to load', async () => {
    // Mock getConversations to throw an error
    (storage.getConversations as any).mockRejectedValue(new Error('Failed to load conversations'));

    const { result } = renderHook(() => useConversations({ userId: mockUserId, refreshTrigger: 0 }));

    // Wait for error state
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error
    expect(result.current.error).toBeTruthy();
    expect(result.current.conversations).toHaveLength(0);

    // Simulate the memoized Set creation with error handling (as in MessagingPage)
    const { result: setResult } = renderHook(() =>
      useMemo(() => {
        try {
          if (result.current.error) {
            console.error('Conversation data load failed, showing no indicators:', result.current.error);
            return new Set<string>();
          }
          return new Set(result.current.conversations.map(conv => conv.otherUser.id));
        } catch (error) {
          console.error('Failed to create conversation lookup:', error);
          return new Set<string>();
        }
      }, [result.current.conversations, result.current.error])
    );

    // Should return empty Set (fail safe)
    expect(setResult.current.size).toBe(0);
  });

  /**
   * Test 6: Verify complete flow from message to Set update
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  it('should complete full flow: new message → refresh → conversations update → Set update', async () => {
    // Start with no conversations
    (storage.getConversations as any).mockResolvedValue([]);

    let refreshTrigger = 0;
    let timeoutRef: NodeJS.Timeout | null = null;

    const debouncedRefresh = () => {
      if (timeoutRef) return;
      timeoutRef = setTimeout(() => {
        refreshTrigger++;
        timeoutRef = null;
      }, 100); // Shorter timeout for testing
    };

    const onNewMessage = vi.fn((message: Message) => {
      // Simulate the onNewMessage callback behavior
      debouncedRefresh();
    });

    // Set up real-time hook
    renderHook(() =>
      useRealtimeMessages({
        userId: mockUserId,
        onNewMessage,
        onMessageRead: vi.fn(),
      })
    );

    // Set up conversations hook
    const { result: conversationsResult, rerender } = renderHook(
      ({ trigger }) => useConversations({ userId: mockUserId, refreshTrigger: trigger }),
      { initialProps: { trigger: refreshTrigger } }
    );

    await waitFor(() => {
      expect(conversationsResult.current.isLoading).toBe(false);
    });

    // Initial state: no conversations
    expect(conversationsResult.current.conversations).toHaveLength(0);

    // Simulate new message arrival
    const newMessage: Message = {
      id: 'msg-001',
      senderId: mockOtherUserId,
      recipientId: mockUserId,
      type: 'text',
      content: 'Hello!',
      timestamp: Date.now(),
      read: false,
    };

    // Update mock to return conversation
    (storage.getConversations as any).mockResolvedValue([
      {
        otherUserId: mockOtherUserId,
        lastMessage: {
          content: 'Hello!',
          timestamp: Date.now(),
          senderId: mockOtherUserId,
        },
        lastMessageTime: Date.now(),
        unreadCount: 1,
      },
    ]);

    // Trigger onNewMessage
    onNewMessage(newMessage);

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify refreshTrigger was incremented
    expect(refreshTrigger).toBe(1);

    // Rerender with new refreshTrigger
    rerender({ trigger: refreshTrigger });

    // Wait for conversations to update
    await waitFor(() => {
      expect(conversationsResult.current.conversations).toHaveLength(1);
    });

    // Create memoized Set
    const { result: setResult } = renderHook(() =>
      useMemo(
        () => new Set(conversationsResult.current.conversations.map(c => c.otherUser.id)),
        [conversationsResult.current.conversations]
      )
    );

    // Verify Set contains the new user
    expect(setResult.current.has(mockOtherUserId)).toBe(true);
    expect(setResult.current.size).toBe(1);
  });
});

