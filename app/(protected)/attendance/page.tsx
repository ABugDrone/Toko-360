'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth-context';
import { getAttendanceRecords } from '@/lib/storage';
import { Calendar, TrendingUp, TrendingDown, Clock, Loader2, XCircle } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeApprovals } from '@/hooks/use-realtime-approvals';
import { ConnectionStatus } from '@/components/ui/connection-status';

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadRecords = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const data = await getAttendanceRecords(user.staffId);
        setRecords(data);
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => {
            // Non-blocking retry
            setTimeout(() => loadRecords(), 100);
          },
        });
      } finally {
        setLoading(false);
      }
    };

    // Non-blocking load
    const timeoutId = setTimeout(() => {
      loadRecords();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user?.staffId]);

  // Set up real-time approval status updates
  // Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5
  const connectionStatus = useRealtimeApprovals({
    staffId: user?.staffId,
    onAttendanceUpdate: (updatedRecord) => {
      // Update the record in the list
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === updatedRecord.id ? updatedRecord : record
        )
      );
      
      // Show notification when approval status changes
      // Validates: Requirement 28.4
      const statusMessages = {
        approved: 'Your attendance record has been approved',
        rejected: 'Your attendance record has been rejected',
        pending: 'Your attendance record is pending review',
      };
      
      const message = statusMessages[updatedRecord.approvalStatus as keyof typeof statusMessages];
      if (message) {
        showSuccessToast(message);
      }
    },
  });

  const attendanceStats = {
    totalDays: records.length,
    onTimeCount: records.filter(r => r.status === 'on_time').length,
    lateCount: records.filter(r => r.status === 'late').length,
    veryLateCount: records.filter(r => r.status === 'very_late').length,
    absentCount: records.filter(r => r.status === 'absent').length,
    attendanceRate: records.length > 0 ? Math.round((records.filter(r => r.status !== 'absent').length / records.length) * 100) : 0,
    avgProductivity: records.length > 0 ? Math.round(records.reduce((sum, r) => sum + (r.productivity || 0), 0) / records.length) : 0,
  };

  const statusColor = {
    on_time: 'text-green-400 bg-green-500/10',
    late: 'text-yellow-400 bg-yellow-500/10',
    very_late: 'text-red-600 bg-red-600/10',
    absent: 'text-red-400 bg-red-500/10',
    excused: 'text-blue-400 bg-blue-500/10',
  };

  const statusBadgeColor = {
    on_time: 'border-green-500/50 text-green-400',
    late: 'border-yellow-500/50 text-yellow-400',
    very_late: 'border-red-600/50 text-red-600',
    absent: 'border-red-500/50 text-red-400',
    excused: 'border-blue-500/50 text-blue-400',
  };

  return (
    <>
      <TopNav title="Attendance" searchPlaceholder="Search attendance..." />
      <div className="p-6 space-y-8">
        {/* Header with Connection Status */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Attendance Overview</h2>
            <p className="text-slate-400">Track your check-in/check-out times and productivity metrics.</p>
          </div>
          <ConnectionStatus
            status={
              connectionStatus.isConnected
                ? 'online'
                : connectionStatus.isReconnecting
                ? 'reconnecting'
                : 'offline'
            }
            showLabel={true}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4" />
            <p className="text-slate-400">Loading attendance records...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-400">Total Days</p>
            </div>
            <p className="text-3xl font-bold text-white">{attendanceStats.totalDays}</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 backdrop-blur">
            <p className="text-sm text-green-400 mb-2">On Time</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-green-400">{attendanceStats.onTimeCount}</p>
              <p className="text-sm text-green-400 mb-1">days</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 backdrop-blur">
            <p className="text-sm text-yellow-400 mb-2">Late</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-yellow-400">{attendanceStats.lateCount}</p>
              <p className="text-sm text-yellow-400 mb-1">times</p>
            </div>
          </div>

          <div className="bg-red-600/10 border border-red-600/50 rounded-xl p-6 backdrop-blur">
            <p className="text-sm text-red-600 mb-2">Very Late</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-red-600">{attendanceStats.veryLateCount}</p>
              <p className="text-sm text-red-600 mb-1">times</p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-xl p-6 backdrop-blur">
            <p className="text-sm text-cyan-400 mb-2">Attendance Rate</p>
            <p className="text-3xl font-bold text-cyan-400">{attendanceStats.attendanceRate}%</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-6 backdrop-blur">
            <p className="text-sm text-purple-400 mb-2">Avg Productivity</p>
            <p className="text-3xl font-bold text-purple-400">{attendanceStats.avgProductivity}%</p>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white">Recent Check-ins</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Approval</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <>
                      <tr
                        key={record.id}
                        className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            {record.checkInTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {record.checkOutTime || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeColor[record.status]} ${statusColor[record.status]}`}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {record.approvalStatus ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                              record.approvalStatus === 'approved'
                                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                                : record.approvalStatus === 'rejected'
                                ? 'border-red-500/50 text-red-400 bg-red-500/10'
                                : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                            }`}>
                              {record.approvalStatus.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                                style={{ width: `${record.productivity || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-slate-300 font-medium min-w-[3rem]">
                              {record.productivity || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Rejection Feedback Row - Show for rejected attendance */}
                      {record.approvalStatus === 'rejected' && record.feedback && (
                        <tr key={`${record.id}-feedback`} className="border-b border-slate-800 bg-red-500/5">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-400 mb-2">Rejection Feedback</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{record.feedback}</p>
                                {record.approvedBy && record.approvedAt && (
                                  <p className="text-xs text-slate-500 mt-2">
                                    Reviewed by {record.approvedBy} on {new Date(record.approvedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {records.length > 0 && (
            <div className="p-6 bg-slate-800/20 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Showing {records.length} recent attendance records. Last update: {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Punctuality Trend</p>
                <p className="text-2xl font-bold text-green-400">+4.2%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Productivity Trend</p>
                <p className="text-2xl font-bold text-cyan-400">+1.5%</p>
              </div>
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-2">Late Instances</p>
                <p className="text-2xl font-bold text-yellow-400">-0.8%</p>
              </div>
              <TrendingDown className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </>
  );
}
