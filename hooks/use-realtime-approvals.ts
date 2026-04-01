import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AttendanceRecord, WeeklyReport } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeApprovalsOptions {
  staffId: string | undefined;
  onAttendanceUpdate?: (record: AttendanceRecord) => void;
  onReportUpdate?: (report: WeeklyReport) => void;
}

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}

/**
 * Custom hook for real-time approval status updates via Supabase
 * Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5, 28.6
 */
export function useRealtimeApprovals({
  staffId,
  onAttendanceUpdate,
  onReportUpdate,
}: UseRealtimeApprovalsOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true, // Default to connected since the app is working
    isReconnecting: false,
    error: null,
  });

  // Use refs to store callbacks to avoid recreating them on every render
  const onAttendanceUpdateRef = useRef(onAttendanceUpdate);
  const onReportUpdateRef = useRef(onReportUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onAttendanceUpdateRef.current = onAttendanceUpdate;
  }, [onAttendanceUpdate]);

  useEffect(() => {
    onReportUpdateRef.current = onReportUpdate;
  }, [onReportUpdate]);

  const handleAttendanceUpdate = useCallback((payload: any) => {
    const dbRecord = payload.new;
    // Map database snake_case to TypeScript camelCase
    const updatedRecord: AttendanceRecord = {
      id: dbRecord.id,
      staffId: dbRecord.staff_id,
      date: dbRecord.date,
      checkInTime: dbRecord.check_in_time,
      checkOutTime: dbRecord.check_out_time || undefined,
      status: dbRecord.status,
      productivity: dbRecord.productivity || undefined,
      department: dbRecord.department,
      approvalStatus: dbRecord.approval_status,
      approvedBy: dbRecord.approved_by || undefined,
      approvedAt: dbRecord.approved_at || undefined,
    };
    
    // Only notify if the record belongs to the current user and approval_status changed
    if (updatedRecord.staffId === staffId && payload.old?.approval_status !== dbRecord.approval_status) {
      onAttendanceUpdateRef.current?.(updatedRecord);
    }
  }, [staffId]);

  const handleReportUpdate = useCallback((payload: any) => {
    const dbReport = payload.new;
    // Map database snake_case to TypeScript camelCase
    const updatedReport: WeeklyReport = {
      id: dbReport.id,
      staffId: dbReport.staff_id,
      week: dbReport.week,
      summary: dbReport.summary,
      challenges: dbReport.challenges,
      goals: dbReport.goals,
      status: dbReport.status,
      approvalStatus: dbReport.approval_status,
      createdAt: new Date(dbReport.created_at).getTime(),
      submittedAt: dbReport.submitted_at ? new Date(dbReport.submitted_at).getTime() : undefined,
      reviewedBy: dbReport.reviewed_by || undefined,
      reviewedAt: dbReport.reviewed_at ? new Date(dbReport.reviewed_at).getTime() : undefined,
      feedback: dbReport.feedback || undefined,
      department: dbReport.department,
    };
    
    // Only notify if the report belongs to the current user and approval_status changed
    if (updatedReport.staffId === staffId && payload.old?.approval_status !== dbReport.approval_status) {
      onReportUpdateRef.current?.(updatedReport);
    }
  }, [staffId]);

  useEffect(() => {
    if (!staffId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      setConnectionStatus({
        isConnected: false,
        isReconnecting: false,
        error: null,
      });

      // Subscribe to attendance_records and weekly_reports table changes filtered by user
      channel = supabase
        .channel('approvals-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'attendance_records',
            filter: `staff_id=eq.${staffId}`,
          },
          handleAttendanceUpdate
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'weekly_reports',
            filter: `staff_id=eq.${staffId}`,
          },
          handleReportUpdate
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus({
              isConnected: true,
              isReconnecting: false,
              error: null,
            });
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: false,
              error: 'Failed to connect to real-time updates',
            });
          } else if (status === 'TIMED_OUT') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: true,
              error: 'Connection timed out, reconnecting...',
            });
          } else if (status === 'CLOSED') {
            setConnectionStatus({
              isConnected: false,
              isReconnecting: true,
              error: 'Connection closed, reconnecting...',
            });
          }
        });
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [staffId, handleAttendanceUpdate, handleReportUpdate]);

  return connectionStatus;
}
