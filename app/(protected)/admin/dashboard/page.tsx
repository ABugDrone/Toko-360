'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { MetricCard } from '@/components/dashboard/metric-card';
import { PendingAttendanceApprovals } from '@/components/dashboard/pending-attendance-approvals';
import { useAuth } from '@/app/auth-context';
import { mockDashboardMetrics, mockSystemConfig } from '@/lib/mock-data';
import { BarChart3, Activity, Users, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [systemStats] = useState(mockDashboardMetrics);
  const [systemConfig] = useState(mockSystemConfig);

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

  return (
    <>
      <TopNav title="Admin Controller" />
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Status: OPERATIONAL</h2>
          <p className="text-slate-400">Real-time aggregate data for the current academic cycle.</p>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="ACTIVE STAFF"
            value={systemStats.activeStaff.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            trend="up"
            trendValue="+4.2%"
            color="cyan"
          />
          <MetricCard
            label="ATTENDANCE RATE"
            value={`${systemStats.attendanceRate}%`}
            icon={<Activity className="w-6 h-6" />}
            trend="up"
            trendValue="+1.5%"
            color="green"
          />
          <MetricCard
            label="AVG PRODUCTIVITY"
            value={systemStats.avgProductivity}
            icon={<BarChart3 className="w-6 h-6" />}
            trend="down"
            trendValue="-0.8%"
            color="purple"
          />
          <MetricCard
            label="LATE INSTANCES"
            value={systemStats.lateInstances}
            icon={<AlertCircle className="w-6 h-6" />}
            trend="down"
            trendValue="-5 this week"
            color="pink"
          />
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Core System Integrity */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Core System Integrity</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-medium">API Latency</span>
                  <span className="text-green-400 font-bold">{systemConfig.apiLatency}ms</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: `${systemConfig.apiLatency}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-medium">Database Load</span>
                  <span className="text-yellow-400 font-bold">{systemConfig.databaseLoad}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" style={{ width: `${systemConfig.databaseLoad}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-medium">System Uptime</span>
                  <span className="text-green-400 font-bold">100%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Active Sessions</h3>
            <div className="space-y-3">
              {['Dashboard Access', 'Report Submissions', 'Attendance Check-ins', 'Message Queue'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">{item}</span>
                  <span className="text-cyan-400 font-bold">0</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <PendingAttendanceApprovals maxItems={5} showViewAll={true} />

        {/* Configuration Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur">
          <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">Configuration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Late Arrival Threshold</p>
              <p className="text-2xl font-bold text-cyan-400">{systemConfig.lateArrivalThreshold}min</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Attendance Method</p>
              <p className="text-sm font-bold text-green-400">{systemConfig.attendanceMethod.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Dark Mode</p>
              <p className="text-sm font-bold text-purple-400">{systemConfig.darkModeForced ? 'FORCED' : 'OPTIONAL'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
