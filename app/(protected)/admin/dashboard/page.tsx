'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { MetricCard } from '@/components/dashboard/metric-card';
import { PendingAttendanceApprovals } from '@/components/dashboard/pending-attendance-approvals';
import { useAuth } from '@/app/auth-context';
import { getStaffMetrics, type AggregatedMetrics, type StaffMetrics } from '@/lib/supabase-service';
import { BarChart3, Activity, Users, AlertCircle, Loader2, TrendingUp, Clock } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast } from '@/lib/error-toast';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const result = await getStaffMetrics(period);
        if (result.success) {
          setMetrics(result.data);
        } else {
          const dbError = mapDatabaseError(result.error);
          showErrorToast(dbError, {
            onRetry: () => {
              // Non-blocking retry
              setTimeout(() => loadMetrics(), 100);
            },
          });
        }
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => {
            // Non-blocking retry
            setTimeout(() => loadMetrics(), 100);
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Non-blocking load with slight delay to prevent UI freeze
    const timeoutId = setTimeout(() => {
      loadMetrics();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [period]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Access Denied</p>
          <p className="text-slate-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Filter staff by department
  const filteredStaff = metrics?.staffMetrics.filter(staff => 
    selectedDepartment === 'all' || staff.department === selectedDepartment
  ) || [];

  // Get unique departments
  const departments = Array.from(new Set(metrics?.staffMetrics.map(s => s.department) || []));

  return (
    <>
      <TopNav title="Admin Analytics Dashboard" />
      <div className="p-6 space-y-8">
        {/* Header with Period Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Analytics Overview</h2>
            <p className="text-slate-400">Real-time staff performance metrics and insights</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'day'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'week'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'month'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4" />
            <p className="text-slate-400">Loading analytics data...</p>
          </div>
        ) : metrics ? (
          <>
            {/* Aggregated Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                label="TOTAL STAFF"
                value={metrics.totalStaff.toString()}
                icon={<Users className="w-6 h-6" />}
                color="cyan"
              />
              <MetricCard
                label="AVG TASKS"
                value={`${metrics.avgTasksApproved.toFixed(1)}/${metrics.avgTasksTotal.toFixed(1)}`}
                icon={<BarChart3 className="w-6 h-6" />}
                color="pink"
              />
              <MetricCard
                label="AVG HOURS"
                value={metrics.avgHoursWorked.toFixed(1)}
                icon={<Clock className="w-6 h-6" />}
                color="purple"
              />
              <MetricCard
                label="TOTAL HOURS"
                value={metrics.totalHoursWorked.toFixed(1)}
                icon={<TrendingUp className="w-6 h-6" />}
                color="cyan"
              />
              <MetricCard
                label="AVG ATTENDANCE"
                value={`${metrics.avgAttendanceRate}%`}
                icon={<Activity className="w-6 h-6" />}
                color="green"
              />
            </div>

            {/* Department Filter */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur">
              <div className="flex items-center gap-4">
                <label className="text-slate-400 font-semibold">Filter by Department:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <span className="text-slate-400 text-sm">
                  Showing {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Individual Staff Metrics Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Individual Staff Performance</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/30">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Hours Worked</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No staff data available for this period
                        </td>
                      </tr>
                    ) : (
                      filteredStaff
                        .sort((a, b) => b.attendanceRate - a.attendanceRate)
                        .map((staff) => (
                          <tr
                            key={staff.staffId}
                            className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-white font-medium">{staff.staffName}</p>
                                <p className="text-slate-400 text-xs">{staff.staffId}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{staff.department}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 font-bold">{staff.tasksApproved}</span>
                                <span className="text-slate-500">/</span>
                                <span className="text-slate-300">{staff.tasksTotal}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-cyan-400 font-bold">{staff.hoursWorked.toFixed(1)}h</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-[120px]">
                                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        staff.attendanceRate >= 90
                                          ? 'bg-green-500'
                                          : staff.attendanceRate >= 75
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${staff.attendanceRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span
                                  className={`text-sm font-bold min-w-[3rem] ${
                                    staff.attendanceRate >= 90
                                      ? 'text-green-400'
                                      : staff.attendanceRate >= 75
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  {staff.attendanceRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredStaff.length > 0 && (
                <div className="p-6 bg-slate-800/20 border-t border-slate-800">
                  <p className="text-sm text-slate-400">
                    Showing {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} • 
                    Period: {period === 'day' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                  </p>
                </div>
              )}
            </div>

            {/* Pending Approvals Section */}
            <PendingAttendanceApprovals maxItems={5} showViewAll={true} />
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">No Data Available</p>
            <p className="text-slate-400">Unable to load analytics data</p>
          </div>
        )}
      </div>
    </>
  );
}
