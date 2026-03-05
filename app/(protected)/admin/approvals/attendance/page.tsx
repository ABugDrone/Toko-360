'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth-context';
import { getPendingAttendanceRecords, approveAttendanceRecord, rejectAttendanceRecord } from '@/lib/supabase-service';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';

export default function AttendanceApprovalsPage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { toast } = useToast();

  const loadPendingRecords = async () => {
    setLoading(true);
    try {
      const result = await getPendingAttendanceRecords();
      if (result.success) {
        setAttendanceRecords(result.data);
      } else {
        const dbError = mapDatabaseError(result.error);
        showErrorToast(dbError, {
          onRetry: () => {
            // Non-blocking retry
            setTimeout(() => loadPendingRecords(), 100);
          },
        });
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => {
          // Non-blocking retry
          setTimeout(() => loadPendingRecords(), 100);
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Non-blocking load
    const timeoutId = setTimeout(() => {
      loadPendingRecords();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Access Denied</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (recordId: string) => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const result = await approveAttendanceRecord(recordId, user.staffId);
      if (result.success) {
        showSuccessToast('Attendance record approved successfully');
        // Refresh the list
        await loadPendingRecords();
        setSelectedRecord(null);
      } else {
        const dbError = mapDatabaseError(result.error);
        showErrorToast(dbError, {
          onRetry: () => handleApprove(recordId),
        });
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleApprove(recordId),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (recordId: string) => {
    if (!user) return;
    
    if (!feedback.trim()) {
      showErrorToast({ message: 'Please provide feedback for rejection (max 100 words)', retryable: false });
      return;
    }

    // Validate word count (100 words max)
    const wordCount = feedback.trim().split(/\s+/).length;
    if (wordCount > 100) {
      showErrorToast({ message: `Feedback is too long (${wordCount} words). Please limit to 100 words.`, retryable: false });
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await rejectAttendanceRecord(recordId, user.staffId, feedback.trim());
      if (result.success) {
        showSuccessToast('Attendance record rejected with feedback');
        // Refresh the list
        await loadPendingRecords();
        setSelectedRecord(null);
        setFeedback('');
        setFeedbackOpen(false);
      } else {
        const dbError = mapDatabaseError(result.error);
        showErrorToast(dbError, {
          onRetry: () => handleReject(recordId),
        });
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleReject(recordId),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'late':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'very_late':
        return 'text-red-600 bg-red-600/10 border-red-600/30';
      case 'absent':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'on_time':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'late':
        return 'LATE ARRIVAL';
      case 'very_late':
        return 'VERY LATE';
      case 'absent':
        return 'ABSENT';
      case 'on_time':
        return 'ON TIME';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <>
      <TopNav title="Attendance Approvals" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Pending Attendance Approvals</h2>
          <p className="text-slate-400">Review and approve or reject pending attendance records</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4" />
            <p className="text-slate-400">Loading pending attendance records...</p>
          </div>
        ) : (
          <>
            {/* Attendance Records */}
            <div className="neon-border-cyan bg-slate-900/60 rounded-xl p-6 backdrop-blur overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Staff ID</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Check-In</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Check-Out</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Department</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No pending attendance records for approval
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{record.staffId}</td>
                    <td className="py-3 px-4 text-slate-300">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-300">{new Date(record.checkInTime).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                        {getStatusBadge(record.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{record.department}</td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => setSelectedRecord(record)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold text-xs rounded px-3 py-1"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </>
        )}

        {/* Review Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="neon-border-cyan bg-slate-900/95 rounded-xl p-8 max-w-xl w-full backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-6">
                Attendance Review: {selectedRecord.staffId}
              </h3>

              <div className="space-y-4 mb-6 bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Date</p>
                    <p className="text-white font-semibold">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedRecord.status)}`}>
                      {getStatusBadge(selectedRecord.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Check-In</p>
                    <p className="text-cyan-400 font-mono font-bold">{selectedRecord.checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Department</p>
                    <p className="text-white">{selectedRecord.department}</p>
                  </div>
                  {selectedRecord.checkOutTime && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Check-Out</p>
                      <p className="text-white font-mono">{selectedRecord.checkOutTime}</p>
                    </div>
                  )}
                  {selectedRecord.productivity !== undefined && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Productivity</p>
                      <p className="text-green-400 font-bold">{selectedRecord.productivity}%</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-6">
                Review this attendance record and decide whether to approve or reject it.
              </p>

              {feedbackOpen && (
                <div className="mb-6">
                  <label className="text-red-400 font-semibold text-sm mb-2 block">
                    Rejection Feedback (Max 100 words) *
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Explain why this attendance is rejected and how to remedy it..."
                    className="w-full bg-slate-800/60 border border-red-500/30 rounded p-3 text-white text-sm focus:border-red-500/60 focus:outline-none min-h-[100px]"
                    rows={4}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    {feedback.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 words
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(selectedRecord.id)}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </Button>

                {!feedbackOpen ? (
                  <Button
                    onClick={() => setFeedbackOpen(true)}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleReject(selectedRecord.id)}
                      disabled={isProcessing || !feedback.trim()}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Send Rejection
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setFeedbackOpen(false);
                        setFeedback('');
                      }}
                      disabled={isProcessing}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                <Button
                  onClick={() => {
                    setSelectedRecord(null);
                    setFeedback('');
                    setFeedbackOpen(false);
                  }}
                  disabled={isProcessing}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-6 disabled:opacity-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
