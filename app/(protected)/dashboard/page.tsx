'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { AttendanceClock } from '@/components/dashboard/attendance-clock';
import { MetricCard } from '@/components/dashboard/metric-card';
import { mockUpcomingClasses } from '@/lib/mock-data';
import { useAuth } from '@/app/auth-context';
import { ChevronRight, Star, Briefcase, Phone, Loader2 } from 'lucide-react';
import { getAttendanceRecords, getReports } from '@/lib/supabase-service';
import type { AttendanceRecord, WeeklyReport } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';
import { ErrorDisplay } from '@/components/ui/error-display';

export default function DashboardPage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch data from Supabase with non-blocking pattern
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both in parallel to reduce wait time
        const [attendanceResult, reportsResult] = await Promise.all([
          getAttendanceRecords(user.staffId),
          getReports(user.staffId)
        ]);
        
        if (attendanceResult.success) {
          setAttendanceRecords(attendanceResult.data);
        } else {
          console.error('Failed to fetch attendance records:', attendanceResult.error);
          const dbError = mapDatabaseError(attendanceResult.error);
          setError(dbError);
        }
        
        if (reportsResult.success) {
          setReports(reportsResult.data);
        } else {
          console.error('Failed to fetch reports:', reportsResult.error);
          const dbError = mapDatabaseError(reportsResult.error);
          setError(dbError);
        }
      } catch (err: any) {
        console.error('Unexpected error fetching dashboard data:', err);
        const dbError = mapDatabaseError(err);
        setError(dbError);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Non-blocking fetch with slight delay
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user]);

  // Calculate metrics from fetched data
  const calculateMetrics = () => {
    const now = new Date();
    
    // ============================================================================
    // TASKS METRIC - Weekly reset (Monday to Sunday)
    // ============================================================================
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekReports = reports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= startOfWeek;
    });
    
    const totalTasks = thisWeekReports.length;
    const approvedTasks = thisWeekReports.filter(r => r.approvalStatus === 'approved').length;
    const tasksDisplay = `${approvedTasks}/${totalTasks}`;
    
    // ============================================================================
    // HOURS WORKED - Monthly sum of 9am-5pm work hours (Mon-Fri + Sat bonuses)
    // ============================================================================
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfMonth;
    });
    
    const hoursWorked = thisMonthRecords.reduce((total, record) => {
      if (record.checkInTime && record.checkOutTime) {
        const recordDate = new Date(record.date);
        const dayOfWeek = recordDate.getDay();
        
        // Only count Mon-Fri (1-5) and Saturday (6) if present
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          const checkIn = new Date(record.checkInTime);
          const checkOut = new Date(record.checkOutTime);
          
          // Cap check-in at 9am and check-out at 5pm for calculation
          const workStart = new Date(checkIn);
          workStart.setHours(9, 0, 0, 0);
          const workEnd = new Date(checkOut);
          workEnd.setHours(17, 0, 0, 0);
          
          const effectiveCheckIn = checkIn > workStart ? checkIn : workStart;
          const effectiveCheckOut = checkOut < workEnd ? checkOut : workEnd;
          
          if (effectiveCheckOut > effectiveCheckIn) {
            const hours = (effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }
        }
      }
      return total;
    }, 0);
    
    // ============================================================================
    // ATTENDANCE RATE - Dynamic based on check-in times and missed days
    // ============================================================================
    // Get all weekdays (Mon-Fri) from start of month to today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    let expectedWorkDays = 0;
    const currentDate = new Date(startOfMonth);
    
    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();
      // Count Mon-Fri (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        expectedWorkDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate attendance score
    let attendanceScore = 0;
    let maxScore = expectedWorkDays * 100; // Each day worth 100 points
    
    thisMonthRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const dayOfWeek = recordDate.getDay();
      
      // Only count Mon-Fri for attendance calculation
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (record.status === 'on_time') {
          attendanceScore += 100; // Full points
        } else if (record.status === 'late') {
          attendanceScore += 85; // 85% for late
        } else if (record.status === 'very_late') {
          attendanceScore += 70; // 70% for very late
        } else if (record.status === 'excused') {
          attendanceScore += 90; // 90% for excused absence
        }
        // absent = 0 points
      }
    });
    
    const attendanceRate = maxScore > 0 ? Math.round((attendanceScore / maxScore) * 100) : 100;
    
    return {
      tasksDisplay,
      hoursWorked: hoursWorked.toFixed(1),
      attendanceRate: Math.min(attendanceRate, 100), // Cap at 100%
    };
  };
  
  const metrics = calculateMetrics();

  const reportTypes = [
    // Removed mock data - will be populated from actual reports
  ];

  return (
    <>
      <TopNav title="Staff Dashboard" />
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Welcome back, {user?.name.split(' ')[0]}</h2>
          </div>
          <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Check your daily schedule and reports.</p>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorDisplay
            error={error}
            title="Failed to load dashboard data"
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
            <span className="ml-3 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* Attendance Clock and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Attendance Clock */}
              <div className="lg:col-span-1">
                <AttendanceClock />
              </div>

              {/* Quick Metrics */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="TASKS (THIS WEEK)"
                  value={metrics.tasksDisplay}
                  color="pink"
                />
                <MetricCard
                  label="HOURS (THIS MONTH)"
                  value={metrics.hoursWorked}
                  color="cyan"
                />
                <MetricCard
                  label="ATTENDANCE"
                  value={`${metrics.attendanceRate}%`}
                  color="green"
                />
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Upcoming Events</h3>
                <a href="/events" className="text-sm font-semibold transition-colors duration-300 hover:opacity-80" style={{ color: 'var(--theme-accent)' }}>
                  View All →
                </a>
              </div>
              <div className="space-y-3">
                {mockUpcomingClasses.length === 0 ? (
                  <p className="text-center py-4 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                    No upcoming events scheduled
                  </p>
                ) : (
                  mockUpcomingClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 rounded-lg transition-all duration-300 group cursor-pointer border" style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${cls.color}`}></div>
                        <div>
                          <p className="font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{cls.title}</p>
                          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>{cls.time}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 transition-colors duration-300" style={{ color: 'var(--theme-accent)' }} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reporting Summary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>Reporting Summary</h3>
                <a href="/reports" className="text-sm font-semibold transition-colors duration-300 hover:opacity-80" style={{ color: 'var(--theme-accent)' }}>
                  View All Reports →
                </a>
              </div>
              {reportTypes.length === 0 ? (
                <div className="rounded-xl p-12 border text-center transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
                  <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                    No reports available. Create your first report to see it here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reportTypes.map((report) => (
                    <div
                      key={report.id}
                      className="group cursor-pointer rounded-xl p-6 border transition-all duration-300 hover:scale-105"
                      style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center text-white/80`}>
                          {report.icon}
                        </div>
                        {report.status && (
                          <span className={`text-xs font-bold tracking-wider ${report.status === 'URGENT' ? 'text-pink-400' : ''}`} style={{ color: report.status === 'URGENT' ? undefined : 'var(--theme-text)', opacity: report.status === 'URGENT' ? undefined : 0.6 }}>
                            {report.status}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>{report.title}</h4>
                      <p className="text-sm mb-4 line-clamp-2 transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>{report.description}</p>
                      <div className="w-full rounded-full h-1 overflow-hidden" style={{ backgroundColor: 'var(--theme-border)' }}>
                        <div
                          className={`h-full bg-gradient-to-r ${report.color}`}
                          style={{ width: report.progress.includes('%') ? report.progress : '0%' }}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs font-semibold transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.6 }}>{report.progress}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
