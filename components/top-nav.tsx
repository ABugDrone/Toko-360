'use client';

import { useAuth } from '@/app/auth-context';
import { HelpCircle, Search, ClipboardCheck, FileText, CheckCircle, FileCheck, Calendar, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNotificationCounts } from '@/hooks/use-notification-counts';
import { useAudioNotification } from '@/hooks/use-audio-notification';
import { NotificationIcon } from './notification-icon';
import { markAttendanceAsViewed } from '@/lib/api/attendance';
import { markReportsAsViewed } from '@/lib/api/reports';
import { markEventsAsViewed } from '@/lib/api/events';

interface TopNavProps {
  title?: string;
  searchPlaceholder?: string;
}

export function TopNav({ title = 'Staff Portal', searchPlaceholder = 'Search reports...' }: TopNavProps) {
  const { user } = useAuth();
  
  // Track previous message count for audio notification
  const previousMessageCountRef = useRef<number>(0);

  /**
   * Implement role detection logic
   * Admin users are those with role='admin' OR department='Business Intelligence'
   * Validates: Requirements 17.1, 17.2, 17.4
   */
  const isAdmin = useMemo(
    () => user?.role === 'admin' || user?.department === 'Business Intelligence',
    [user?.role, user?.department]
  );

  /**
   * Initialize use-notification-counts hook with user context
   * Validates: Requirements 8.1, 8.2, 8.3, 17.3
   */
  const counts = useNotificationCounts({
    userId: user?.id || '',
    staffId: user?.staffId || '',
    department: user?.department || '',
    isAdmin,
  });

  /**
   * Initialize use-audio-notification hook
   * Validates: Requirements 9.1
   */
  const { play: playNotificationSound, canPlay } = useAudioNotification({
    enabled: true,
    debounceMs: 3000,
  });

  /**
   * Play audio notification when new messages arrive
   * Don't play sound for messages sent by current user
   * Validates: Requirements 9.1, 9.6
   */
  useEffect(() => {
    // Only play sound if:
    // 1. Message count increased (new message arrived)
    // 2. Audio is ready to play
    // 3. User context is available
    if (
      counts.unreadMessages > previousMessageCountRef.current &&
      canPlay &&
      user
    ) {
      playNotificationSound();
    }
    
    // Update previous count
    previousMessageCountRef.current = counts.unreadMessages;
  }, [counts.unreadMessages, canPlay, user, playNotificationSound]);

  /**
   * Memoized callback to mark attendance notifications as viewed
   * Validates: Requirements 4.4, 10.7
   */
  const handleAttendanceClick = useCallback(async () => {
    if (user?.staffId) {
      try {
        await markAttendanceAsViewed(user.staffId);
      } catch (error) {
        console.error('Failed to mark attendance as viewed:', error);
      }
    }
  }, [user?.staffId]);

  /**
   * Memoized callback to mark report notifications as viewed
   * Validates: Requirements 5.4, 10.8
   */
  const handleReportsClick = useCallback(async () => {
    if (user?.staffId) {
      try {
        await markReportsAsViewed(user.staffId);
      } catch (error) {
        console.error('Failed to mark reports as viewed:', error);
      }
    }
  }, [user?.staffId]);

  /**
   * Memoized callback to mark event notifications as viewed
   * Validates: Requirements 6.4, 10.9
   */
  const handleEventsClick = useCallback(async () => {
    if (user?.id && user?.department) {
      try {
        await markEventsAsViewed(user.id, user.department);
      } catch (error) {
        console.error('Failed to mark events as viewed:', error);
      }
    }
  }, [user?.id, user?.department]);

  return (
    <header className="border-b sticky top-0 z-40 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title */}
        <div>
          <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{title}</h1>
        </div>

        {/* Center: Search (optional) */}
        <div className="flex-1 max-w-xs mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--theme-background)', 
                borderColor: 'var(--theme-border)', 
                color: 'var(--theme-text)',
              }}
            />
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-4">
          {/* Notification Icons - Only render when user context is available */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Admin Notification Icons */}
              {isAdmin && (
                <>
                  {/* Attendance Approvals - Validates: Requirements 2.1, 2.5 */}
                  <NotificationIcon
                    icon={ClipboardCheck}
                    count={counts.pendingAttendanceApprovals}
                    label="Pending attendance approvals"
                    href="/admin/approvals/attendance"
                    hasError={!counts.isConnected}
                  />
                  
                  {/* Report Approvals - Validates: Requirements 3.1, 3.5 */}
                  <NotificationIcon
                    icon={FileText}
                    count={counts.pendingReportApprovals}
                    label="Pending report approvals"
                    href="/admin/approvals/reports"
                    hasError={!counts.isConnected}
                  />
                </>
              )}
              
              {/* Staff Notification Icons */}
              {!isAdmin && (
                <>
                  {/* Attendance Status - Validates: Requirements 4.1, 4.4, 4.6 */}
                  <NotificationIcon
                    icon={CheckCircle}
                    count={counts.unviewedAttendanceStatus}
                    label="Attendance status updates"
                    href="/attendance"
                    onClick={handleAttendanceClick}
                    hasError={!counts.isConnected}
                  />
                  
                  {/* Report Status - Validates: Requirements 5.1, 5.4, 5.6 */}
                  <NotificationIcon
                    icon={FileCheck}
                    count={counts.unviewedReportStatus}
                    label="Report status updates"
                    href="/reports"
                    onClick={handleReportsClick}
                    hasError={!counts.isConnected}
                  />
                </>
              )}
              
              {/* Universal Notification Icons - For all users */}
              
              {/* Events - Validates: Requirements 6.1, 6.4 */}
              <NotificationIcon
                icon={Calendar}
                count={counts.unviewedEvents}
                label="New events"
                href="/events"
                onClick={handleEventsClick}
                hasError={!counts.isConnected}
              />
              
              {/* Messages - Validates: Requirements 7.1, 7.6 */}
              <NotificationIcon
                icon={MessageSquare}
                count={counts.unreadMessages}
                label="Unread messages"
                href="/messaging"
                hasError={!counts.isConnected}
              />
            </div>
          )}
          
          {/* Help */}
          <button className="p-2 rounded-lg transition-all duration-300 hover:scale-105" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l transition-colors duration-300" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{user.name}</div>
                <div className="text-xs uppercase transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>{user.role.replace('_', ' ')}</div>
              </div>
              {/* Profile Image */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
