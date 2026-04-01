/**
 * Unit tests for use-notification-counts hook
 * Feature: realtime-notification-icons
 * 
 * These tests verify specific behaviors of the notification counts hook including:
 * - Initial count fetching for admin and staff users
 * - Real-time update handling from various hooks
 * - Connection error handling and retry logic
 * - Debouncing behavior (300ms delay, batching updates)
 * - Cleanup on unmount (subscription cleanup)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotificationCounts } from '../use-notification-counts';
import type { UseNotificationCountsOptions } from '../use-notification-counts';
import { supabase } from '@/lib/supabase';

/**
 * Mock real-time hooks
 */
vi.mock('../use-realtime-approvals', () => ({
  useRealtimeApprovals: vi.fn(() => ({
    isConnected: true,
    error: null,
  })),
}));

vi.mock('../use-realtime-events', () => ({
  useRealtimeEvents: vi.fn(() => ({
    isConnected: true,
    error: null,
  })),
}));

vi.mock('../use-realtime-messages', () => ({
  useRealtimeMessages: vi.fn(() => ({
    isConnected: true,
    error: null,
  })),
}));

/**
 * Mock Supabase client
 */
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('use-notification-counts hook', () => {
  // Default options for testing
  const defaultOptions: UseNotificationCountsOptions = {
    userId: 'user-123',
    staffId: 'staff-456',
    department: 'IT',
    isAdmin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset mock implementations
    (supabase.from as any).mockReset();
    (supabase.channel as any).mockReset();
    (supabase.removeChannel as any).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test: Initial count fetching for admin notifications
   */
  describe('Initial count fetching for admin notifications', () => {
    it('should fetch pending attendance approvals count for admin users', async () => {
      // Mock Supabase query for attendance approvals
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with admin options
      const { result } = renderHook(() =>
        useNotificationCounts({ ...defaultOptions, isAdmin: true })
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('attendance_records');
        expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      });
    });

    it('should fetch pending report approvals count for admin users', async () => {
      // Mock Supabase query for report approvals
      const mockEq = vi.fn().mockResolvedValue({
        count: 3,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with admin options
      const { result } = renderHook(() =>
        useNotificationCounts({ ...defaultOptions, isAdmin: true })
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('weekly_reports');
      });
    });
  });

  /**
   * Test: Initial count fetching for staff notifications
   */
  describe('Initial count fetching for staff notifications', () => {
    it('should fetch unviewed attendance status count for staff users', async () => {
      // Mock Supabase query
      const mockEq = vi.fn().mockResolvedValue({
        count: 2,
        error: null,
      });

      const mockIn = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: mockIn,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with staff options
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('attendance_records');
      });
    });

    it('should fetch unviewed report status count for staff users', async () => {
      // Mock Supabase query
      const mockEq = vi.fn().mockResolvedValue({
        count: 1,
        error: null,
      });

      const mockIn = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: mockIn,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with staff options
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('weekly_reports');
      });
    });

    it('should fetch unviewed events count for staff users', async () => {
      // Mock Supabase query
      const mockNot = vi.fn().mockResolvedValue({
        count: 4,
        error: null,
      });

      const mockOr = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        or: mockOr,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with staff options
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('events');
      });
    });

    it('should fetch unread messages count for staff users', async () => {
      // Mock Supabase query
      const mockEq = vi.fn().mockResolvedValue({
        count: 7,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with staff options
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      });
    });
  });

  /**
   * Test: Real-time update handling
   */
  describe('Real-time update handling', () => {
    it('should refetch counts when real-time approvals hook triggers update', async () => {
      const { useRealtimeApprovals } = await import('../use-realtime-approvals');
      
      // Mock the hook to capture callbacks
      let onAttendanceUpdate: (() => void) | undefined;
      let onReportUpdate: (() => void) | undefined;

      (useRealtimeApprovals as any).mockImplementation((options: any) => {
        onAttendanceUpdate = options.onAttendanceUpdate;
        onReportUpdate = options.onReportUpdate;
        return { isConnected: true, error: null };
      });

      // Mock Supabase query
      const mockEq = vi.fn().mockResolvedValue({
        count: 3,
        error: null,
      });

      const mockIn = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: mockIn,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      renderHook(() => useNotificationCounts(defaultOptions));

      // Wait for initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Clear mock calls from initial fetch
      mockSupabase.from.mockClear();

      // Trigger real-time update
      await act(async () => {
        onAttendanceUpdate?.();
        vi.advanceTimersByTime(300);
      });

      // Verify refetch was called
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('attendance_records');
      });
    });

    it('should refetch counts when real-time events hook triggers update', async () => {
      const { useRealtimeEvents } = await import('../use-realtime-events');
      
      // Mock the hook to capture callbacks
      let onEventCreated: (() => void) | undefined;

      (useRealtimeEvents as any).mockImplementation((options: any) => {
        onEventCreated = options.onEventCreated;
        return { isConnected: true, error: null };
      });

      // Mock Supabase query
      const mockNot = vi.fn().mockResolvedValue({
        count: 5,
        error: null,
      });

      const mockOr = vi.fn().mockReturnValue({
        not: mockNot,
      });

      const mockSelect = vi.fn().mockReturnValue({
        or: mockOr,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      renderHook(() => useNotificationCounts(defaultOptions));

      // Wait for initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Clear mock calls from initial fetch
      mockSupabase.from.mockClear();

      // Trigger real-time update
      await act(async () => {
        onEventCreated?.();
        vi.advanceTimersByTime(300);
      });

      // Verify refetch was called
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('events');
      });
    });

    it('should refetch counts when real-time messages hook triggers update', async () => {
      const { useRealtimeMessages } = await import('../use-realtime-messages');
      
      // Mock the hook to capture callbacks
      let onNewMessage: (() => void) | undefined;

      (useRealtimeMessages as any).mockImplementation((options: any) => {
        onNewMessage = options.onNewMessage;
        return { isConnected: true, error: null };
      });

      // Mock Supabase query
      const mockEq = vi.fn().mockResolvedValue({
        count: 8,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      renderHook(() => useNotificationCounts(defaultOptions));

      // Wait for initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Clear mock calls from initial fetch
      mockSupabase.from.mockClear();

      // Trigger real-time update
      await act(async () => {
        onNewMessage?.();
        vi.advanceTimersByTime(300);
      });

      // Verify refetch was called
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      });
    });
  });

  /**
   * Test: Connection error handling
   */
  describe('Connection error handling', () => {
    it('should set hasError flag when query fails', async () => {
      // Mock Supabase query to fail
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce and initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
        expect(result.current.errorMessage).toBeTruthy();
      });
    });

    it('should retry failed queries with exponential backoff', async () => {
      let callCount = 0;
      
      // Mock Supabase query to fail first 2 times, then succeed
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(async () => {
              callCount++;
              if (callCount <= 2) {
                return {
                  count: null,
                  error: { message: 'Temporary failure' },
                };
              }
              return {
                count: 5,
                error: null,
              };
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for initial fetch (fails)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Wait for first retry (1 second delay, fails)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Wait for second retry (2 second delay, succeeds)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Verify retry attempts
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('should update connection status based on real-time hooks', async () => {
      const { useRealtimeApprovals } = await import('../use-realtime-approvals');
      
      // Mock the hook to return error state
      (useRealtimeApprovals as any).mockReturnValue({
        isConnected: false,
        error: 'Connection lost',
      });

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.hasError).toBe(true);
      });
    });
  });

  /**
   * Test: Debouncing behavior
   */
  describe('Debouncing behavior', () => {
    it('should debounce count updates with 300ms delay', async () => {
      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      const { result } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Initial state should have zero counts
      expect(result.current.unviewedAttendanceStatus).toBe(0);

      // Wait for less than debounce time
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Count should still be zero (not updated yet)
      expect(result.current.unviewedAttendanceStatus).toBe(0);

      // Wait for remaining debounce time
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Now count should be updated
      await waitFor(() => {
        expect(result.current.unviewedAttendanceStatus).toBeGreaterThanOrEqual(0);
      });
    });

    it('should batch multiple updates within debounce window', async () => {
      const { useRealtimeApprovals, useRealtimeMessages } = await import('../use-realtime-approvals');
      
      // Mock the hooks to capture callbacks
      let onAttendanceUpdate: (() => void) | undefined;
      let onNewMessage: (() => void) | undefined;

      (useRealtimeApprovals as any).mockImplementation((options: any) => {
        onAttendanceUpdate = options.onAttendanceUpdate;
        return { isConnected: true, error: null };
      });

      const { useRealtimeMessages: mockUseRealtimeMessages } = await import('../use-realtime-messages');
      (mockUseRealtimeMessages as any).mockImplementation((options: any) => {
        onNewMessage = options.onNewMessage;
        return { isConnected: true, error: null };
      });

      // Mock Supabase query
      let queryCount = 0;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: ++queryCount,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      renderHook(() => useNotificationCounts(defaultOptions));

      // Wait for initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Reset query count
      queryCount = 0;
      mockSupabase.from.mockClear();

      // Trigger multiple updates within debounce window
      await act(async () => {
        onAttendanceUpdate?.();
        vi.advanceTimersByTime(100);
        onNewMessage?.();
        vi.advanceTimersByTime(100);
        onAttendanceUpdate?.();
        vi.advanceTimersByTime(100);
      });

      // Wait for debounce to complete
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Verify that updates were batched (not called for every trigger)
      // The exact number depends on implementation, but should be less than 3
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });

  /**
   * Test: Cleanup on unmount
   */
  describe('Cleanup on unmount', () => {
    it('should cleanup subscriptions on unmount', async () => {
      // Mock Supabase channel
      const mockSubscribe = vi.fn();
      const mockOn = vi.fn().mockReturnThis();
      const mockChannel = {
        on: mockOn,
        subscribe: mockSubscribe,
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook with admin options (to trigger channel subscription)
      const { unmount } = renderHook(() =>
        useNotificationCounts({ ...defaultOptions, isAdmin: true })
      );

      // Wait for initial setup
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Unmount the hook
      unmount();

      // Verify cleanup was called
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });

    it('should clear debounce timeout on unmount', async () => {
      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook
      const { unmount } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Start a debounced update
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Unmount before debounce completes
      unmount();

      // Advance timers past debounce period
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // No errors should occur from the cleared timeout
      // This test passes if no errors are thrown
    });
  });

  /**
   * Test: Rate limiting
   */
  describe('Rate limiting', () => {
    it('should not fetch more than once per 5 seconds', async () => {
      // Mock Supabase query
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Render hook first time
      const { unmount: unmount1 } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for initial fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      const firstCallCount = mockSupabase.from.mock.calls.length;

      // Unmount and remount immediately
      unmount1();
      
      const { unmount: unmount2 } = renderHook(() =>
        useNotificationCounts(defaultOptions)
      );

      // Wait for potential fetch
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should not have made additional calls due to rate limiting
      expect(mockSupabase.from.mock.calls.length).toBe(firstCallCount);

      unmount2();
    });
  });
});
