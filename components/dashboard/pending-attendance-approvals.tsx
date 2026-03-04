'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth-context';
import { getPendingAttendanceRecords, approveAttendanceRecord, rejectAttendanceRecord } from '@/lib/supabase-service';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import Link from 'next/link';

interface PendingAttendanceApprovalsProps {
  maxItems?: number;
  showViewAll?: boolean;
}

export function PendingAttendanceApprovals({ 
  maxItems = 5, 
  showViewAll = true 
}: PendingAttendanceApprovalsProps) {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingRecords = async () => {
    setLoading(true);
    try {
      const result = await getPendingAttendanceRecords();
      if (result.success) {
        setAttendanceRecords(result.data.slice(0, maxItems));
      } else {
        const dbError = mapDatabaseError(result.error);
        console.error('Failed to load pending attendance records:', dbError);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      console.error('Failed to load pending attendance records:', dbError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingRecords();
    }
  }, [user]);

  const handleApprove = async (recordId: string) => {
    if (!user) return;
    
    setProcessingId(recordId);
    try {
      const result = await approveAttendanceRecord(recordId, user.staffId);
      if (result.success) {
        showSuccessToast('Attendance record approved');
        await loadPendingRecords();
      } else {
        const dbError = mapDatabaseError(result.error);
        showErrorToast(dbError);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (recordId: string) => {
    if (!user) return;
    
    setProcessingId(recordId);
    try {
      const result = await rejectAttendanceRecord(recordId, user.staffId);
      if (result.success) {
        showSuccessToast('Attendance record rejected');
        await loadPendingRecords();
      } else {
        const dbError = mapDatabaseError(result.error);
        showErrorToast(dbError);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'late':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
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
        return 'LATE';
      case 'absent':
        return 'ABSENT';
      case 'on_time':
        return 'ON TIME';
      default:
        return status.toUpperCase();
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
          <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
            Pending Attendance Approvals
          </h3>
        </div>
        {showViewAll && attendanceRecords.length > 0 && (
          <Link 
            href="/admin/approvals/attendance"
            className="text-sm font-semibold transition-colors duration-300 hover:opacity-80" 
            style={{ color: 'var(--theme-accent)' }}
          >
            View All →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--theme-accent)' }} />
          <span className="ml-3 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            Loading...
          </span>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--theme-accent)', opacity: 0.5 }} />
          <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            No pending attendance records
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attendanceRecords.map((record) => (
            <div 
              key={record.id} 
              className="p-4 rounded-lg border transition-all duration-300"
              style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                      {record.staffId}
                    </p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                      {getStatusBadge(record.status)}
                    </span>
                  </div>
                  <p className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                    {new Date(record.date).toLocaleDateString()} • {new Date(record.checkInTime).toLocaleTimeString()}
                  </p>
                  <p className="text-xs mt-1 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                    {record.department}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(record.id)}
                  disabled={processingId === record.id}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs rounded px-3 py-2 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === record.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleReject(record.id)}
                  disabled={processingId === record.id}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs rounded px-3 py-2 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === record.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Reject
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
