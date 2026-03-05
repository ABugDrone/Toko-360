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
