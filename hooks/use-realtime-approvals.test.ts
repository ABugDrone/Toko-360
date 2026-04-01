/**
 * Unit tests for real-time approval status updates hook
 * Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5, 28.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeApprovals } from './use-realtime-approvals';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('useRealtimeApprovals', () => {
  let mockChannel: any;
  let subscribeCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
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
   * Validates: Requirement 28.1 - Subscribe to Supabase real-time changes on attendance_records
   */
  it('should subscribe to attendance_records table changes', () => {
    const staffId = 'TA-2024-001';
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onAttendanceUpdate: vi.fn(),
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith('approvals-changes');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'attendance_records',
        filter: `staff_id=eq.${staffId}`,
      }),
      expect.any(Function)
    );
  });

  /**
   * Validates: Requirement 28.1 - Subscribe to Supabase real-time changes on weekly_reports
   */
  it('should subscribe to weekly_reports table changes', () => {
    const staffId = 'TA-2024-001';
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onReportUpdate: vi.fn(),
      })
    );

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'weekly_reports',
        filter: `staff_id=eq.${staffId}`,
      }),
      expect.any(Function)
    );
  });

  /**
   * Validates: Requirement 28.3 - Filter updates to authenticated user's records
   */
  it('should filter updates to only the authenticated user records', () => {
    const staffId = 'TA-2024-001';
    const onAttendanceUpdate = vi.fn();
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onAttendanceUpdate,
      })
    );

    // Get the attendance update handler
    const attendanceHandler = mockChannel.on.mock.calls.find(
      (call: any) => call[1].table === 'attendance_records'
    )?.[2];

    // Simulate update for the correct user
    attendanceHandler({
      new: { id: '1', staffId: 'TA-2024-001', approvalStatus: 'approved' },
      old: { approvalStatus: 'pending' },
    });

    expect(onAttendanceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ staffId: 'TA-2024-001' })
    );

    // Simulate update for a different user
    onAttendanceUpdate.mockClear();
    attendanceHandler({
      new: { id: '2', staffId: 'TA-2024-002', approvalStatus: 'approved' },
      old: { approvalStatus: 'pending' },
    });

    expect(onAttendanceUpdate).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirement 28.2 - Update approval badges and status in real-time
   */
  it('should call onAttendanceUpdate when approval status changes', () => {
    const staffId = 'TA-2024-001';
    const onAttendanceUpdate = vi.fn();
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onAttendanceUpdate,
      })
    );

    const attendanceHandler = mockChannel.on.mock.calls.find(
      (call: any) => call[1].table === 'attendance_records'
    )?.[2];

    const updatedRecord = {
      id: '1',
      staffId: 'TA-2024-001',
      approvalStatus: 'approved',
      approvedBy: 'admin-001',
      approvedAt: '2024-01-15T10:00:00Z',
    };

    attendanceHandler({
      new: updatedRecord,
      old: { approvalStatus: 'pending' },
    });

    expect(onAttendanceUpdate).toHaveBeenCalledWith(updatedRecord);
  });

  /**
   * Validates: Requirement 28.2 - Update approval badges and status in real-time
   */
  it('should call onReportUpdate when approval status changes', () => {
    const staffId = 'TA-2024-001';
    const onReportUpdate = vi.fn();
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onReportUpdate,
      })
    );

    const reportHandler = mockChannel.on.mock.calls.find(
      (call: any) => call[1].table === 'weekly_reports'
    )?.[2];

    const updatedReport = {
      id: '1',
      staffId: 'TA-2024-001',
      approvalStatus: 'rejected',
      reviewedBy: 'admin-001',
      reviewedAt: '2024-01-15T10:00:00Z',
    };

    reportHandler({
      new: updatedReport,
      old: { approvalStatus: 'pending' },
    });

    expect(onReportUpdate).toHaveBeenCalledWith(updatedReport);
  });

  /**
   * Validates: Requirement 28.5 - Handle connection drops and reconnection
   */
  it('should handle connection status changes', async () => {
    const { result } = renderHook(() =>
      useRealtimeApprovals({
        staffId: 'TA-2024-001',
      })
    );

    // Initial state
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);

    // Simulate successful subscription
    subscribeCallback('SUBSCRIBED');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isReconnecting).toBe(false);
      expect(result.current.error).toBe(null);
    });

    // Simulate connection error
    subscribeCallback('CHANNEL_ERROR');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('Failed to connect to real-time updates');
    });

    // Simulate timeout and reconnection
    subscribeCallback('TIMED_OUT');

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isReconnecting).toBe(true);
    });
  });

  /**
   * Validates: Requirement 28.6 - Handle subscription cleanup on unmount
   */
  it('should cleanup subscription on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeApprovals({
        staffId: 'TA-2024-001',
      })
    );

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  /**
   * Validates: Requirement 28.3 - Only notify when approval_status changes
   */
  it('should only notify when approval status actually changes', () => {
    const staffId = 'TA-2024-001';
    const onAttendanceUpdate = vi.fn();
    
    renderHook(() =>
      useRealtimeApprovals({
        staffId,
        onAttendanceUpdate,
      })
    );

    const attendanceHandler = mockChannel.on.mock.calls.find(
      (call: any) => call[1].table === 'attendance_records'
    )?.[2];

    // Simulate update where approval status didn't change
    attendanceHandler({
      new: { id: '1', staffId: 'TA-2024-001', approvalStatus: 'pending', checkOutTime: '17:00' },
      old: { approvalStatus: 'pending', checkOutTime: null },
    });

    expect(onAttendanceUpdate).not.toHaveBeenCalled();

    // Simulate update where approval status changed
    attendanceHandler({
      new: { id: '1', staffId: 'TA-2024-001', approvalStatus: 'approved' },
      old: { approvalStatus: 'pending' },
    });

    expect(onAttendanceUpdate).toHaveBeenCalledTimes(1);
  });

  /**
   * Validates: Requirement 28.1 - Should not subscribe if staffId is undefined
   */
  it('should not subscribe if staffId is undefined', () => {
    renderHook(() =>
      useRealtimeApprovals({
        staffId: undefined,
      })
    );

    expect(supabase.channel).not.toHaveBeenCalled();
  });
});
