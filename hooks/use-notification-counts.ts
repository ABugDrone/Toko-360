import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeApprovals } from './use-realtime-approvals';
import { useRealtimeEvents } from './use-realtime-events';
import { useRealtimeMessages } from './use-realtime-messages';

/**
 * Notification counts for all notification types
 */
export interface NotificationCounts {
  // Admin notifications
  pendingAttendanceApprovals: number;
  pendingReportApprovals: number;
  
  // Staff notifications
  unviewedAttendanceStatus: number;
  unviewedReportStatus: number;
  unviewedEvents: number;
  unreadMessages: number;
  
  // Connection status
  isConnected: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Options for configuring the notification counts hook
 */
export interface UseNotificationCountsOptions {
  userId: string;
  staffId: string;
  department: string;
  isAdmin: boolean;
}

/**
 * Custom hook that aggregates notification counts from multiple sources.
 * 
 * This hook:
 * - Fetches initial counts on mount (single query per type)
 * - Subscribes to real-time updates via existing hooks
 * - Debounces count updates (300ms)
 * - Batches multiple updates within debounce window
 * - Handles connection errors with retry logic
 * - Memoizes results to prevent unnecessary re-renders
 * 
 * @param options - Configuration options including user context and role
 * @returns NotificationCounts object with all counts and connection status
 */
export function useNotificationCounts(
  options: UseNotificationCountsOptions
): NotificationCounts {
  const { userId, staffId, department, isAdmin } = options;

  // State management for all count types
  const [counts, setCounts] = useState<NotificationCounts>({
    pendingAttendanceApprovals: 0,
    pendingReportApprovals: 0,
    unviewedAttendanceStatus: 0,
    unviewedReportStatus: 0,
    unviewedEvents: 0,
    unreadMessages: 0,
    isConnected: false,
    hasError: false,
    errorMessage: null,
  });

  // Ref to track pending updates for debouncing
  const pendingUpdatesRef = useRef<Partial<NotificationCounts>>({});
  
  // Ref to track debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track last fetch time for rate limiting
  const lastFetchTimeRef = useRef<number>(0);

  // Ref to track retry count for exponential backoff
  const retryCountRef = useRef<number>(0);

  /**
   * Apply batched updates after debounce period
   */
  const applyPendingUpdates = useCallback(() => {
    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      setCounts(prev => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }
  }, []);

  /**
   * Queue an update to be applied after debounce period
   */
  const queueUpdate = useCallback((updates: Partial<NotificationCounts>) => {
    // Merge new updates with pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to apply updates after 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      applyPendingUpdates();
    }, 300);
  }, [applyPendingUpdates]);

  /**
   * Calculate exponential backoff delay for retries
   */
  const getRetryDelay = useCallback(() => {
    const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
    return delays[Math.min(retryCountRef.current, delays.length - 1)];
  }, []);

  /**
   * Fetch pending attendance approvals count for admin users
   */
  const fetchPendingAttendanceApprovals = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      if (error) throw error;

      queueUpdate({ 
        pendingAttendanceApprovals: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch pending attendance approvals:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch attendance approvals',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchPendingAttendanceApprovals, getRetryDelay());
      }
    }
  }, [queueUpdate, getRetryDelay]);

  /**
   * Fetch pending report approvals count for admin users
   */
  const fetchPendingReportApprovals = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('weekly_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .eq('approval_status', 'pending');

      if (error) throw error;

      queueUpdate({ 
        pendingReportApprovals: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch pending report approvals:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch report approvals',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchPendingReportApprovals, getRetryDelay());
      }
    }
  }, [queueUpdate, getRetryDelay]);

  /**
   * Fetch unviewed attendance status count for staff users
   */
  const fetchUnviewedAttendanceStatus = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', staffId)
        .in('approval_status', ['approved', 'rejected'])
        .eq('notification_viewed', false);

      if (error) throw error;

      queueUpdate({ 
        unviewedAttendanceStatus: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch unviewed attendance status:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch attendance status',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchUnviewedAttendanceStatus, getRetryDelay());
      }
    }
  }, [staffId, queueUpdate, getRetryDelay]);

  /**
   * Fetch unviewed report status count for staff users
   */
  const fetchUnviewedReportStatus = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('weekly_reports')
        .select('*', { count: 'exact', head: true })
        .eq('staff_id', staffId)
        .in('approval_status', ['approved', 'rejected'])
        .eq('notification_viewed', false);

      if (error) throw error;

      queueUpdate({ 
        unviewedReportStatus: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch unviewed report status:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch report status',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchUnviewedReportStatus, getRetryDelay());
      }
    }
  }, [staffId, queueUpdate, getRetryDelay]);

  /**
   * Fetch unviewed events count for staff users
   */
  const fetchUnviewedEvents = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .or(`target_departments.is.null,target_departments.cs.{${department}}`)
        .not('viewed_by', 'cs', `{${userId}}`);

      if (error) throw error;

      queueUpdate({ 
        unviewedEvents: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch unviewed events:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch events',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchUnviewedEvents, getRetryDelay());
      }
    }
  }, [userId, department, queueUpdate, getRetryDelay]);

  /**
   * Fetch unread messages count for staff users
   */
  const fetchUnreadMessages = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) throw error;

      queueUpdate({ 
        unreadMessages: count || 0,
        hasError: false,
        errorMessage: null,
      });
      
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
      queueUpdate({
        hasError: true,
        errorMessage: 'Failed to fetch messages',
      });
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(fetchUnreadMessages, getRetryDelay());
      }
    }
  }, [userId, queueUpdate, getRetryDelay]);

  /**
   * Fetch initial counts on mount for admin users
   */
  useEffect(() => {
    // Rate limiting: don't fetch more than once per 5 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      return;
    }
    lastFetchTimeRef.current = now;

    // Fetch admin notification counts if user is admin
    if (isAdmin) {
      fetchPendingAttendanceApprovals();
      fetchPendingReportApprovals();
    } else {
      // Fetch staff notification counts if user is not admin
      fetchUnviewedAttendanceStatus();
      fetchUnviewedReportStatus();
      fetchUnviewedEvents();
      fetchUnreadMessages();
    }

    // Set connection status
    queueUpdate({ isConnected: true });
  }, [
    isAdmin, 
    fetchPendingAttendanceApprovals, 
    fetchPendingReportApprovals,
    fetchUnviewedAttendanceStatus,
    fetchUnviewedReportStatus,
    fetchUnviewedEvents,
    fetchUnreadMessages,
    queueUpdate
  ]);

  /**
   * Integrate real-time approvals hook for attendance and report updates (staff users)
   * Validates: Requirements 8.1, 8.6
   */
  const approvalsConnectionStatus = useRealtimeApprovals({
    staffId: isAdmin ? undefined : staffId, // Only subscribe for staff users
    onAttendanceUpdate: useCallback(() => {
      // Refetch counts when attendance approval status changes for staff
      if (!isAdmin) {
        fetchUnviewedAttendanceStatus();
      }
    }, [isAdmin, fetchUnviewedAttendanceStatus]),
    onReportUpdate: useCallback(() => {
      // Refetch counts when report approval status changes for staff
      if (!isAdmin) {
        fetchUnviewedReportStatus();
      }
    }, [isAdmin, fetchUnviewedReportStatus]),
  });

  /**
   * Set up real-time subscription for admin users to listen to ALL approval changes
   * Validates: Requirements 8.1, 8.6
   */
  useEffect(() => {
    if (!isAdmin) {
      return; // Only set up for admin users
    }

    // Subscribe to all attendance_records and weekly_reports changes for admin
    const channel = supabase
      .channel('admin-approvals-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          // Refetch pending approvals when any attendance record is updated
          if (payload.old?.approval_status !== payload.new?.approval_status) {
            fetchPendingAttendanceApprovals();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
        },
        () => {
          // Refetch when new attendance record is created (might be pending)
          fetchPendingAttendanceApprovals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weekly_reports',
        },
        (payload) => {
          // Refetch pending approvals when any report is updated
          if (payload.old?.approval_status !== payload.new?.approval_status || 
              payload.old?.status !== payload.new?.status) {
            fetchPendingReportApprovals();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'weekly_reports',
        },
        () => {
          // Refetch when new report is created (might be pending)
          fetchPendingReportApprovals();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchPendingAttendanceApprovals, fetchPendingReportApprovals]);

  /**
   * Integrate real-time events hook for event updates
   * Validates: Requirements 8.2, 8.6
   */
  const eventsConnectionStatus = useRealtimeEvents({
    department,
    onEventCreated: useCallback(() => {
      // Refetch event counts when new event is created
      fetchUnviewedEvents();
    }, [fetchUnviewedEvents]),
    onEventUpdated: useCallback(() => {
      // Refetch event counts when event is updated
      fetchUnviewedEvents();
    }, [fetchUnviewedEvents]),
    onEventDeleted: useCallback(() => {
      // Refetch event counts when event is deleted
      fetchUnviewedEvents();
    }, [fetchUnviewedEvents]),
  });

  /**
   * Integrate real-time messages hook for message updates
   * Validates: Requirements 8.3, 8.6
   */
  const messagesConnectionStatus = useRealtimeMessages({
    userId,
    onNewMessage: useCallback(() => {
      // Refetch message counts when new message arrives
      fetchUnreadMessages();
    }, [fetchUnreadMessages]),
    onMessageRead: useCallback(() => {
      // Refetch message counts when message is marked as read
      fetchUnreadMessages();
    }, [fetchUnreadMessages]),
  });

  /**
   * Update connection status based on real-time hooks
   * Validates: Requirements 8.4
   */
  useEffect(() => {
    const hasError = 
      approvalsConnectionStatus.error !== null ||
      eventsConnectionStatus.error !== null ||
      messagesConnectionStatus.error !== null;

    const isConnected = 
      approvalsConnectionStatus.isConnected &&
      eventsConnectionStatus.isConnected &&
      messagesConnectionStatus.isConnected;

    queueUpdate({
      isConnected,
      hasError,
      errorMessage: hasError 
        ? (approvalsConnectionStatus.error || eventsConnectionStatus.error || messagesConnectionStatus.error)
        : null,
    });
  }, [
    approvalsConnectionStatus.isConnected,
    approvalsConnectionStatus.error,
    eventsConnectionStatus.isConnected,
    eventsConnectionStatus.error,
    messagesConnectionStatus.isConnected,
    messagesConnectionStatus.error,
    queueUpdate,
  ]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the counts object to prevent unnecessary re-renders
  const memoizedCounts = useMemo(() => counts, [
    counts.pendingAttendanceApprovals,
    counts.pendingReportApprovals,
    counts.unviewedAttendanceStatus,
    counts.unviewedReportStatus,
    counts.unviewedEvents,
    counts.unreadMessages,
    counts.isConnected,
    counts.hasError,
    counts.errorMessage,
  ]);

  return memoizedCounts;
}
