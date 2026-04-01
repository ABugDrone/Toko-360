/**
 * Integration test for real-time approval status updates on attendance page
 * Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AttendancePage from './page';
import { useAuth } from '@/app/auth-context';
import { getAttendanceRecords } from '@/lib/storage';
import { useRealtimeApprovals } from '@/hooks/use-realtime-approvals';

// Mock Supabase first
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// Mock dependencies
vi.mock('@/app/auth-context');
vi.mock('@/lib/storage');
vi.mock('@/hooks/use-realtime-approvals');
vi.mock('@/components/top-nav', () => ({
  TopNav: () => <div>TopNav</div>,
}));

describe('AttendancePage - Real-time Approval Updates', () => {
  const mockUser = {
    id: '1',
    staffId: 'TA-2024-001',
    name: 'Test User',
    email: 'test@toko.edu',
    department: 'IT' as const,
    role: 'staff' as const,
  };

  const mockAttendanceRecords = [
    {
      id: '1',
      staffId: 'TA-2024-001',
      date: '2024-01-15',
      checkInTime: '09:00:00',
      checkOutTime: '17:00:00',
      status: 'on_time' as const,
      productivity: 85,
      department: 'IT' as const,
      approvalStatus: 'pending' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (getAttendanceRecords as any).mockResolvedValue(mockAttendanceRecords);
    (useRealtimeApprovals as any).mockReturnValue({
      isConnected: true,
      isReconnecting: false,
      error: null,
    });
  });

  /**
   * Validates: Requirement 28.1 - Subscribe to Supabase real-time changes
   */
  it('should set up real-time subscription on mount', async () => {
    render(<AttendancePage />);

    await waitFor(() => {
      expect(useRealtimeApprovals).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: mockUser.staffId,
          onAttendanceUpdate: expect.any(Function),
        })
      );
    });
  });

  /**
   * Validates: Requirement 28.2 - Update approval badges in real-time
   */
  it('should display approval status badges', async () => {
    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.3 - Filter updates to authenticated user's records
   */
  it('should only subscribe to current user records', async () => {
    render(<AttendancePage />);

    await waitFor(() => {
      const call = (useRealtimeApprovals as any).mock.calls[0][0];
      expect(call.staffId).toBe(mockUser.staffId);
    });
  });

  /**
   * Validates: Requirement 28.4 - Display notification when approval status changes
   */
  it('should handle approval status updates', async () => {
    let onAttendanceUpdate: any;
    (useRealtimeApprovals as any).mockImplementation((options: any) => {
      onAttendanceUpdate = options.onAttendanceUpdate;
      return {
        isConnected: true,
        isReconnecting: false,
        error: null,
      };
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(onAttendanceUpdate).toBeDefined();
    });

    // Simulate real-time update
    const updatedRecord = {
      ...mockAttendanceRecords[0],
      approvalStatus: 'approved' as const,
      approvedBy: 'admin-001',
      approvedAt: '2024-01-15T10:00:00Z',
    };

    onAttendanceUpdate(updatedRecord);

    // The component should update the record in the list
    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.5 - Display connection status
   */
  it('should display connection status indicator', async () => {
    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.5 - Handle reconnection
   */
  it('should display reconnecting status', async () => {
    (useRealtimeApprovals as any).mockReturnValue({
      isConnected: false,
      isReconnecting: true,
      error: 'Connection timed out, reconnecting...',
    });

    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });
  });
});
