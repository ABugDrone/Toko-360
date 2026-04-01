/**
 * Real-time subscription hook for approved reports
 * Monitors weekly_reports table for approval status changes
 * Gracefully handles connection failures
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { WeeklyReport } from '../lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeApprovedReportsOptions {
  userId: string;
  userRole: 'admin' | 'staff';
  onReportApproved: (report: WeeklyReport) => void;
  onReportUpdated: (report: WeeklyReport) => void;
}

interface UseRealtimeApprovedReportsReturn {
  isConnected: boolean;
  isReconnecting: boolean;
}

export function useRealtimeApprovedReports({
  userId,
  userRole,
  onReportApproved,
  onReportUpdated,
}: UseRealtimeApprovedReportsOptions): UseRealtimeApprovedReportsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const setupSubscription = useCallback(() => {
    try {
      // Clean up existing subscription
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.warn('Error removing channel:', e);
        }
        channelRef.current = null;
      }

      // Create new subscription with error handling
      const channel = supabase
        .channel(`approved-reports-${userId}`, {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weekly_reports',
            filter: 'approval_status=eq.approved',
          },
          (payload) => {
            try {
              const record = payload.new as any;
              
              if (record && record.id) {
                const report: WeeklyReport = {
                  id: record.id,
                  staffId: record.staff_id,
                  week: record.week,
                  summary: record.summary,
                  challenges: record.challenges,
                  goals: record.goals,
                  richContent: record.rich_content,
                  formatType: record.format_type,
                  startDate: record.start_date,
                  endDate: record.end_date,
                  status: record.status,
                  approvalStatus: record.approval_status,
                  department: record.department,
                  mediaLinks: record.media_links,
                  createdAt: new Date(record.created_at).getTime(),
                  submittedAt: record.submitted_at ? new Date(record.submitted_at).getTime() : undefined,
                  reviewedBy: record.reviewed_by,
                  reviewedAt: record.reviewed_at ? new Date(record.reviewed_at).getTime() : undefined,
                  feedback: record.feedback,
                  notificationViewed: record.notification_viewed,
                };

                if (payload.eventType === 'INSERT') {
                  onReportApproved(report);
                } else if (payload.eventType === 'UPDATE') {
                  onReportUpdated(report);
                }
              }
            } catch (error) {
              console.error('Error processing real-time event:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setIsReconnecting(false);
            reconnectAttemptsRef.current = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              handleReconnect();
            }
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setIsConnected(false);
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        handleReconnect();
      }
    }
  }, [userId, userRole, onReportApproved, onReportUpdated]);

  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    setIsReconnecting(true);
    reconnectAttemptsRef.current += 1;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      setupSubscription();
    }, delay);
  }, [setupSubscription]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.warn('Error removing channel on cleanup:', e);
        }
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [setupSubscription]);

  return {
    isConnected,
    isReconnecting,
  };
}
