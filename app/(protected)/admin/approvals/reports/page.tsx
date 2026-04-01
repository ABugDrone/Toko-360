'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getReports, updateReport } from '@/lib/storage';
import { AlertCircle, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { WeeklyReport } from '@/lib/types';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';

export default function ReportApprovalsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load submitted reports on mount
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const allReports = await getReports();
        setReports(allReports.filter(r => r.status === 'submitted'));
      } catch (error: any) {
        const dbError = mapDatabaseError(error);
        showErrorToast(dbError, {
          onRetry: () => loadReports(),
        });
      } finally {
        setLoading(false);
      }
    };
    loadReports();
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

  const handleApprove = async (reportId: string) => {
    if (!user?.staffId) {
      showErrorToast({ message: 'User not authenticated', code: 'AUTH_ERROR', details: null });
      return;
    }
    
    setIsProcessing(true);
    try {
      await updateReport(reportId, {
        status: 'approved',
        reviewedBy: user.staffId,
        reviewedAt: Date.now(),
      });
      // Reload reports after approval
      const allReports = await getReports();
      setReports(allReports.filter(r => r.status === 'submitted'));
      setSelectedReport(null);
      showSuccessToast('Report approved successfully');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleApprove(reportId),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reportId: string) => {
    if (!user?.staffId) {
      showErrorToast({ message: 'User not authenticated', code: 'AUTH_ERROR', details: null });
      return;
    }
    
    if (!feedback.trim()) {
      showErrorToast({ message: 'Please provide feedback for rejection', code: 'VALIDATION_ERROR', details: null });
      return;
    }
    setIsProcessing(true);
    try {
      await updateReport(reportId, {
        status: 'rejected',
        reviewedBy: user.staffId,
        reviewedAt: Date.now(),
        feedback: feedback.substring(0, 500),
      });
      // Reload reports after rejection
      const allReports = await getReports();
      setReports(allReports.filter(r => r.status === 'submitted'));
      setFeedback('');
      setFeedbackOpen(false);
      setSelectedReport(null);
      showSuccessToast('Report rejected with feedback');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleReject(reportId),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <TopNav title="Report Approvals" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Weekly Report Approvals</h2>
          <p className="text-slate-400">Review and approve pending staff reports with optional feedback</p>
        </div>

        {/* Reports Table */}
        <div className="neon-border-cyan bg-slate-900/60 rounded-xl p-6 backdrop-blur overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Staff</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Week</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Department</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Submitted</th>
                <th className="text-left py-3 px-4 text-cyan-400 font-semibold uppercase text-xs tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No pending reports for approval
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{report.staffId}</td>
                    <td className="py-3 px-4 text-slate-300">{report.week}</td>
                    <td className="py-3 px-4 text-slate-300">{report.department}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {new Date(report.submittedAt || 0).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => setSelectedReport(report)}
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

        {/* Review Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="neon-border-cyan bg-slate-900/95 rounded-xl p-8 max-w-2xl w-full backdrop-blur-sm max-h-96 overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                Report Review: {selectedReport.staffId}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-cyan-400 font-semibold text-sm mb-2 block">Week</label>
                  <p className="text-slate-200">{selectedReport.week}</p>
                </div>

                <div>
                  <label className="text-cyan-400 font-semibold text-sm mb-2 block">Summary</label>
                  <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-slate-700">
                    {selectedReport.summary}
                  </p>
                </div>

                <div>
                  <label className="text-cyan-400 font-semibold text-sm mb-2 block">Challenges</label>
                  <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-slate-700">
                    {selectedReport.challenges}
                  </p>
                </div>

                <div>
                  <label className="text-cyan-400 font-semibold text-sm mb-2 block">Goals</label>
                  <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-slate-700">
                    {selectedReport.goals}
                  </p>
                </div>

                {feedbackOpen && (
                  <div>
                    <label className="text-magenta-400 font-semibold text-sm mb-2 block">
                      Rejection Feedback (Max 100 words)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value.substring(0, 500))}
                      placeholder="Provide constructive feedback for rejection..."
                      className="w-full bg-slate-800/60 border border-magenta-500/30 rounded p-3 text-white text-sm focus:border-magenta-500/60 focus:outline-none"
                      rows={3}
                    />
                    <div className="text-xs text-slate-400 mt-1">
                      {feedback.split(' ').length} / 100 words
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(selectedReport.id)}
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
                      Approve Report
                    </>
                  )}
                </Button>

                {!feedbackOpen ? (
                  <Button
                    onClick={() => setFeedbackOpen(true)}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleReject(selectedReport.id)}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={() => setSelectedReport(null)}
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
