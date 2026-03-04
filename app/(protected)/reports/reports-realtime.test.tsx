/**
 * Integration test for real-time approval status updates on reports page
 * Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReportsPage from './page';
import { useAuth } from '@/app/auth-context';
import { getReports } from '@/lib/storage';
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

describe('ReportsPage - Real-time Approval Updates', () => {
  const mockUser = {
    id: '1',
    staffId: 'TA-2024-001',
    name: 'Test User',
    email: 'test@toko.edu',
    department: 'IT' as const,
    role: 'staff' as const,
  };

  const mockReports = [
    {
      id: '1',
      staffId: 'TA-2024-001',
      week: 'JAN 15 - JAN 21, 2024',
      summary: 'Completed project tasks',
      challenges: 'Some technical issues',
      goals: 'Improve performance',
      status: 'submitted' as const,
      approvalStatus: 'pending' as const,
      createdAt: Date.now(),
      submittedAt: Date.now(),
      department: 'IT' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (getReports as any).mockResolvedValue(mockReports);
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
    render(<ReportsPage />);

    await waitFor(() => {
      expect(useRealtimeApprovals).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: mockUser.staffId,
          onReportUpdate: expect.any(Function),
        })
      );
    });
  });

  /**
   * Validates: Requirement 28.2 - Update approval badges in real-time
   */
  it('should display approval status badges', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.3 - Filter updates to authenticated user's records
   */
  it('should only subscribe to current user reports', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      const call = (useRealtimeApprovals as any).mock.calls[0][0];
      expect(call.staffId).toBe(mockUser.staffId);
    });
  });

  /**
   * Validates: Requirement 28.4 - Display notification when approval status changes
   */
  it('should handle approval status updates', async () => {
    let onReportUpdate: any;
    (useRealtimeApprovals as any).mockImplementation((options: any) => {
      onReportUpdate = options.onReportUpdate;
      return {
        isConnected: true,
        isReconnecting: false,
        error: null,
      };
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(onReportUpdate).toBeDefined();
    });

    // Simulate real-time update
    const updatedReport = {
      ...mockReports[0],
      approvalStatus: 'approved' as const,
      reviewedBy: 'admin-001',
      reviewedAt: Date.now(),
    };

    onReportUpdate(updatedReport);

    // The component should update the report in the list
    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.5 - Display connection status
   */
  it('should display connection status indicator', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 28.5 - Handle offline status
   */
  it('should display offline status', async () => {
    (useRealtimeApprovals as any).mockReturnValue({
      isConnected: false,
      isReconnecting: false,
      error: 'Failed to connect to real-time updates',
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });
});
