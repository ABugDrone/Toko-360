'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, LogIn, LogOut, Timer, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth-context';
import { getAttendanceRecords, addAttendanceRecord, updateAttendanceRecord } from '@/lib/storage';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'clock' | 'calendar';
type CheckInStatus = 'not_checked_in' | 'pending_approval' | 'approved' | 'checked_out';

export function AttendanceClock() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('clock');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('not_checked_in');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load today's attendance record
  useEffect(() => {
    if (!user) return;
    
    const loadTodayRecord = async () => {
      setIsLoadingRecords(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const records = await getAttendanceRecords(user.staffId);
        const record = records.find(r => r.date === today);
        
        if (record) {
          setTodayRecord(record);
          if (record.checkInTime && !record.checkOutTime) {
            setCheckInTime(new Date(record.checkInTime));
            setCheckInStatus(record.status === 'on_time' || record.status === 'late' || record.status === 'very_late' ? 'approved' : 'pending_approval');
          } else if (record.checkOutTime) {
            setCheckInStatus('checked_out');
          }
        }
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => {
            // Non-blocking retry
            setTimeout(() => loadTodayRecord(), 100);
          },
        });
      } finally {
        setIsLoadingRecords(false);
      }
    };
    
    // Non-blocking load
    const timeoutId = setTimeout(() => {
      loadTodayRecord();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Calculate elapsed time
  useEffect(() => {
    if (checkInStatus === 'approved' && checkInTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - checkInTime.getTime();
        
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkInStatus, checkInTime]);

  const handleCheckIn = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Determine attendance status based on time
    // Before 9:00 AM = on_time
    // 9:00 AM - 9:59 AM = late
    // 10:00 AM or later = very_late
    const hour = now.getHours();
    let status: AttendanceStatus = 'on_time';
    if (hour >= 10) {
      status = 'very_late';
    } else if (hour >= 9) {
      status = 'late';
    }
    
    const newRecord: Omit<AttendanceRecord, 'id'> = {
      staffId: user.staffId,
      date: today,
      checkInTime: now.toISOString(),
      status: status,
      department: user.department,
      productivity: 0,
    };
    
    try {
      await addAttendanceRecord(newRecord);
      // Fetch the newly created record to get its ID
      const records = await getAttendanceRecords(user.staffId);
      const createdRecord = records.find(r => r.date === today);
      
      if (createdRecord) {
        setTodayRecord(createdRecord);
        setCheckInTime(now);
        setCheckInStatus('pending_approval');
        
        showSuccessToast('Checked in successfully');
        
        // Auto-approve after 3 seconds (simulating admin approval)
        setTimeout(async () => {
          setCheckInStatus('approved');
          await updateAttendanceRecord(createdRecord.id, { status: status });
        }, 3000);
      }
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleCheckIn(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    
    setIsSubmitting(true);
    try {
      await updateAttendanceRecord(todayRecord.id, {
        checkOutTime: new Date().toISOString(),
      });
      setCheckInStatus('checked_out');
      showSuccessToast('Checked out successfully');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleCheckOut(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get attendance records for calendar view
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    const loadMonthRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const records = await getAttendanceRecords(user.staffId);
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        
        const filtered = records.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate.getMonth() === month && recordDate.getFullYear() === year;
        });
        
        setMonthRecords(filtered);
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => {
            // Non-blocking retry
            setTimeout(() => loadMonthRecords(), 100);
          },
        });
      } finally {
        setIsLoadingRecords(false);
      }
    };
    
    // Non-blocking load
    const timeoutId = setTimeout(() => {
      loadMonthRecords();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user, selectedDate]);

  return (
    <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 transition-colors duration-300" style={{ color: 'var(--theme-accent)' }} />
          <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
            {viewMode === 'clock' ? 'Attendance Clock' : 'Attendance Calendar'}
          </h3>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('clock')}
            className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'clock' ? 'scale-110' : 'opacity-50'}`}
            style={{ 
              backgroundColor: viewMode === 'clock' ? 'var(--theme-accent)' : 'transparent',
              color: viewMode === 'clock' ? '#ffffff' : 'var(--theme-text)',
            }}
            title="Clock View"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'calendar' ? 'scale-110' : 'opacity-50'}`}
            style={{ 
              backgroundColor: viewMode === 'calendar' ? 'var(--theme-accent)' : 'transparent',
              color: viewMode === 'calendar' ? '#ffffff' : 'var(--theme-text)',
            }}
            title="Calendar View"
          >
            <CalendarDays className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Clock View */}
      {viewMode === 'clock' && (
        <div className="space-y-6">
          {checkInStatus === 'not_checked_in' && (
            <>
              {/* Current Time Display */}
              <div className="text-center space-y-4">
                <div className="text-6xl font-mono font-bold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Check In Button */}
              <Button 
                onClick={handleCheckIn}
                disabled={isSubmitting}
                className="w-full py-6 text-lg font-bold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    CHECKING IN...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    CHECK IN
                  </>
                )}
              </Button>
            </>
          )}

          {checkInStatus === 'pending_approval' && (
            <>
              {/* Digital Clock */}
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Pending Approval Status */}
              <div className="p-4 rounded-lg border-2 border-dashed animate-pulse transition-colors duration-300" style={{ borderColor: 'var(--theme-accent)', backgroundColor: 'var(--theme-background)' }}>
                <div className="flex items-center justify-center gap-3">
                  <Timer className="w-5 h-5 animate-spin transition-colors duration-300" style={{ color: 'var(--theme-accent)' }} />
                  <span className="font-semibold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                    Pending Admin Approval...
                  </span>
                </div>
                <div className="text-xs text-center mt-2 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                  Checked in at {checkInTime ? formatTime(checkInTime) : ''}
                </div>
              </div>
            </>
          )}

          {checkInStatus === 'approved' && (
            <>
              {/* Digital Clock */}
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Elapsed Time */}
              <div className="p-6 rounded-lg border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
                <div className="text-xs uppercase tracking-wider mb-2 text-center transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                  Time Worked Today
                </div>
                <div className="text-4xl font-mono font-bold text-center transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                  {elapsedTime}
                </div>
                <div className="text-xs text-center mt-2 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                  Checked in at {checkInTime ? formatTime(checkInTime) : ''}
                </div>
              </div>

              {/* Check Out Button */}
              <Button 
                onClick={handleCheckOut}
                disabled={isSubmitting}
                className="w-full py-6 text-lg font-bold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    CHECKING OUT...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5 mr-2" />
                    CHECK OUT
                  </>
                )}
              </Button>
            </>
          )}

          {checkInStatus === 'checked_out' && (
            <>
              {/* Digital Clock */}
              <div className="text-center space-y-4">
                <div className="text-5xl font-mono font-bold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Checked Out Status */}
              <div className="p-6 rounded-lg border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
                <div className="text-center">
                  <div className="text-lg font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                    ✓ Checked Out
                  </div>
                  <div className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                    Thank you for your work today!
                  </div>
                  {todayRecord && (
                    <div className="mt-4 text-xs space-y-1 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                      <div>Check In: {new Date(todayRecord.checkInTime).toLocaleTimeString()}</div>
                      {todayRecord.checkOutTime && (
                        <div>Check Out: {new Date(todayRecord.checkOutTime).toLocaleTimeString()}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              className="px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
            >
              ←
            </button>
            <div className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              className="px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}
            >
              →
            </button>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg text-center transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
              <div className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-accent)' }}>
                {monthRecords.filter(r => r.status === 'on_time').length}
              </div>
              <div className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>On Time</div>
            </div>
            <div className="p-3 rounded-lg text-center transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
              <div className="text-2xl font-bold text-orange-500">
                {monthRecords.filter(r => r.status === 'late').length}
              </div>
              <div className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Late</div>
            </div>
            <div className="p-3 rounded-lg text-center transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
              <div className="text-2xl font-bold text-red-600">
                {monthRecords.filter(r => r.status === 'very_late').length}
              </div>
              <div className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Very Late</div>
            </div>
            <div className="p-3 rounded-lg text-center transition-colors duration-300" style={{ backgroundColor: 'var(--theme-background)', borderWidth: '1px', borderColor: 'var(--theme-border)' }}>
              <div className="text-2xl font-bold text-red-500">
                {monthRecords.filter(r => r.status === 'absent').length}
              </div>
              <div className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>Absent</div>
            </div>
          </div>

          {/* Attendance Records List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoadingRecords ? (
              <div className="text-center py-8 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading records...
              </div>
            ) : monthRecords.length === 0 ? (
              <div className="text-center py-8 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                No attendance records for this month
              </div>
            ) : (
              monthRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                <div 
                  key={record.id}
                  className="p-4 rounded-lg border transition-all duration-300 hover:scale-102"
                  style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>
                        In: {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {record.checkOutTime && ` • Out: ${new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'on_time' ? 'bg-green-500/20 text-green-500' :
                      record.status === 'late' ? 'bg-orange-500/20 text-orange-500' :
                      record.status === 'very_late' ? 'bg-red-600/20 text-red-600' :
                      record.status === 'absent' ? 'bg-red-500/20 text-red-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {record.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
