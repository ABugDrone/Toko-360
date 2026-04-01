/**
 * Tests for useRealtimeMessages hook
 * Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5, 27.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeMessages } from './use-realtime-messages';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('useRealtimeMessages', () => {
  let mockChannel: any;
  let subscribeCallback: any;

  beforeEach(() => {
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        subscribeCallback = callback;
        return mockChannel;
      }),
    };

    (supabase.channel as any).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 27.1 - Subscribe to Supabase real-time changes on messages table
   */
  it('should set up subscription when userId is provided', () => {
    const userId = 'user-123';
    
    renderHook(() => useRealtimeMessages({ userId }));

    expect(supabase.channel).toHaveBeenCalledWith('messages-changes');
    expect(mockChannel.on).toHaveBeenCalledTimes(2); // INSERT and UPDATE events
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 27.4 - Filter updates to authenticated user's messages
   */
  it('should filter messages for the authenticated user', () => {
    const userId = 'user-123';
    
    renderHook(() => useRealtimeMessages({ userId }));

    // Check that filters are applied correctly
    const insertCall = mockChannel.on.mock.calls[0];
    expect(insertCall[1].filter).toContain(userId);
    
    const updateCall = mockChannel.on.mock.calls[1];
    expect(updateCall[1].filter).toContain(userId);
  });

  /**
   * Validates: Requirement 27.2 - Update UI when new messages arrive
   */
  it('should call onNewMessage when a new message is inserted', () => {
    const userId = 'user-123';
    const onNewMessage = vi.fn();
    
    renderHook(() => useRealtimeMessages({ userId, onNewMessage }));

    // Simulate INSERT event
    const insertHandler = mockChannel.on.mock.calls[0][2];
    const newMessage = {
      id: 'msg-1',
      senderId: 'user-456',
      recipientId: userId,
      content: 'Hello',
      timestamp: Date.now(),
      read: false,
    };

    insertHandler({ new: newMessage });

    expect(onNewMessage).toHaveBeenCalledWith(newMessage);
  });

  /**
   * Validates: Requirement 27.3 - Update read status in real-time
   */
  it('should call onMessageRead when a message is marked as read', () => {
    const userId = 'user-123';
    const onMessageRead = vi.fn();
    
    renderHook(() => useRealtimeMessages({ userId, onMessageRead }));

    // Simulate UPDATE event
    const updateHandler = mockChannel.on.mock.calls[1][2];
    const updatedMessage = {
      id: 'msg-1',
      senderId: 'user-456',
      recipientId: userId,
      content: 'Hello',
      timestamp: Date.now(),
      read: true,
    };

    updateHandler({ new: updatedMessage });

    expect(onMessageRead).toHaveBeenCalledWith('msg-1');
  });

  /**
   * Validates: Requirement 27.6 - Display connection status indicator
   */
  it('should update connection status when subscribed', async () => {
    const userId = 'user-123';
    
    const { result } = renderHook(() => useRealtimeMessages({ userId }));

    // Initially not connected
    expect(result.current.isConnected).toBe(false);

    // Simulate successful subscription
    subscribeCallback('SUBSCRIBED');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  /**
   * Validates: Requirement 27.5 - Handle connection drops and reconnection
   */
  it('should handle connection errors', async () => {
    const userId = 'user-123';
    
    const { result } = renderHook(() => useRealtimeMessages({ userId }));

    // Simulate connection error
    subscribeCallback('CHANNEL_ERROR');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  /**
   * Validates: Requirement 27.5 - Handle connection drops and reconnection
   */
  it('should handle connection timeout and set reconnecting status', async () => {
    const userId = 'user-123';
    
    const { result } = renderHook(() => useRealtimeMessages({ userId }));

    // Simulate timeout
    subscribeCallback('TIMED_OUT');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(true);
    });
  });

  /**
   * Validates: Requirement 27.5 - Handle connection drops and reconnection
   */
  it('should handle connection closed and set reconnecting status', async () => {
    const userId = 'user-123';
    
    const { result } = renderHook(() => useRealtimeMessages({ userId }));

    // Simulate connection closed
    subscribeCallback('CLOSED');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(true);
    });
  });

  it('should not set up subscription when userId is undefined', () => {
    renderHook(() => useRealtimeMessages({ userId: undefined }));

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('should clean up subscription on unmount', () => {
    const userId = 'user-123';
    
    const { unmount } = renderHook(() => useRealtimeMessages({ userId }));

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should only notify for messages involving the current user', () => {
    const userId = 'user-123';
    const onNewMessage = vi.fn();
    
    renderHook(() => useRealtimeMessages({ userId, onNewMessage }));

    const insertHandler = mockChannel.on.mock.calls[0][2];
    
    // Message not involving current user
    const irrelevantMessage = {
      id: 'msg-1',
      senderId: 'user-456',
      recipientId: 'user-789',
      content: 'Hello',
      timestamp: Date.now(),
      read: false,
    };

    insertHandler({ new: irrelevantMessage });

    expect(onNewMessage).not.toHaveBeenCalled();
  });
});
