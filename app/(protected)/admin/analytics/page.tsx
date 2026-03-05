'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { useAuth } from '@/app/auth-context';
import { getStaffMetrics, type AggregatedMetrics } from '@/lib/supabase-service';
import { BarChart3, Activity, Users, AlertCircle, Loader2, TrendingUp, Clock, Calendar } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast } from '@/lib/error-toast';

export default function AnalyticsPage() {
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
              setTimeout(() => loadMetrics(), 100);
            },
          });
        }
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => {
            setTimeout(() => loadMetrics(), 100);
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

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
          <p className="text-slate-400">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  const filteredStaff = metrics?.staffMetrics.filter(staff => 
    selectedDepartment === 'all' || staff.department === selectedDepartment
  ) || [];

  const departments = Array.from(new Set(metrics?.staffMetrics.map(s => s.department) || []));

  return (
    <>
      <TopNav title="Staff Analytics" />
      <div className="p-6 space-y-8">
        {/* Header with Period Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Staff Performance Analytics</h2>
            <p className="text-slate-400">Comprehensive metrics and insights across all staff members</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'day'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Today
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'week'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                period === 'month'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              This Month
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : !metrics ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Failed to load analytics</p>
            <p className="text-slate-400">Please try again later</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-white/80" />
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Staff</p>
                <p className="text-white text-3xl font-bold">{metrics.totalStaff}</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-white/80" />
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-green-100 text-sm font-medium mb-1">Avg Attendance Rate</p>
                <p className="text-white text-3xl font-bold">{metrics.avgAttendanceRate}%</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-white/80" />
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-purple-100 text-sm font-medium mb-1">Avg Tasks Approved</p>
                <p className="text-white text-3xl font-bold">{metrics.avgTasksApproved.toFixed(1)}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-white/80" />
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-orange-100 text-sm font-medium mb-1">Total Hours Worked</p>
                <p className="text-white text-3xl font-bold">{metrics.totalHoursWorked}h</p>
              </div>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-4">
              <label className="text-slate-400 font-medium">Filter by Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Staff Metrics Table */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Staff Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Department</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tasks Approved</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tasks Total</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Hours Worked</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No staff data available for the selected period
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr key={staff.staffId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {staff.staffName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{staff.staffName}</p>
                                <p className="text-slate-400 text-sm">{staff.staffId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {staff.department}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{staff.tasksApproved}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-slate-300">{staff.tasksTotal}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{staff.hoursWorked}h</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    staff.attendanceRate >= 90
                                      ? 'bg-green-500'
                                      : staff.attendanceRate >= 75
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${staff.attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-white font-semibold text-sm">{staff.attendanceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
