'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getReports, updateReport, addReport } from '@/lib/storage';
import { FileText, Save, X, Loader2, Plus, Trash2, ExternalLink, Video, Music, FileIcon, Link as LinkIcon } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeApprovals } from '@/hooks/use-realtime-approvals';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { RichTextEditor } from '@/components/reports/rich-text-editor';
import { getReportContent, validateContentSize } from '@/lib/report-serialization';
import type { MediaLink, JSONContent, Department } from '@/lib/types';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    week: '',
    startDate: '',
    endDate: '',
    richContent: null as JSONContent | null,
    formatType: 'word' as const,
    mediaLinks: [] as MediaLink[],
  });
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    dateRange: '',
    content: '',
  });
  const [newLink, setNewLink] = useState({
    url: '',
    title: '',
    type: 'video' as 'video' | 'audio' | 'document',
  });

  // Load reports on mount and when user changes
  useEffect(() => {
    const loadReports = async () => {
      if (user?.staffId) {
        setLoading(true);
        try {
          const data = await getReports(user.staffId);
          setReports(data);
        } catch (error: any) {
          const dbError = mapDatabaseError(error);
          showErrorToast(dbError, {
            onRetry: () => loadReports(),
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadReports();
  }, [user?.staffId]); // Only depend on staffId, not the function

  // Set up real-time approval status updates
  // Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5
  const connectionStatus = useRealtimeApprovals({
    staffId: user?.staffId,
    onReportUpdate: (updatedReport) => {
      // Update the report in the list
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report
        )
      );
      
      // Show notification when approval status changes
      // Validates: Requirement 28.4
      const statusMessages = {
        approved: 'Your weekly report has been approved',
        rejected: 'Your weekly report has been rejected',
        pending: 'Your weekly report is pending review',
      };
      
      const message = statusMessages[updatedReport.approvalStatus as keyof typeof statusMessages];
      if (message) {
        showSuccessToast(message);
      }
    },
  });

  const handleNewReport = () => {
    setEditingId(null);
    setFormData({
      week: '',
      startDate: '',
      endDate: '',
      richContent: null,
      formatType: 'word',
      mediaLinks: [],
    });
    setDateRange(null);
    setValidationErrors({ dateRange: '', content: '' });
    setNewLink({ url: '', title: '', type: 'video' });
    setShowForm(true);
  };

  const handleEditReport = (report: any) => {
    setEditingId(report.id);
    
    // Load rich content or convert legacy report
    const content = getReportContent(report);
    
    // Parse date range if available
    let range: { start: Date; end: Date } | null = null;
    if (report.startDate && report.endDate) {
      range = {
        start: new Date(report.startDate),
        end: new Date(report.endDate),
      };
    }
    
    setFormData({
      week: report.week,
      startDate: report.startDate || '',
      endDate: report.endDate || '',
      richContent: content,
      formatType: report.formatType || 'word',
      mediaLinks: report.mediaLinks || [],
    });
    setDateRange(range);
    setValidationErrors({ dateRange: '', content: '' });
    setNewLink({ url: '', title: '', type: 'video' });
    setShowForm(true);
  };

  // Handle date range change
  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    
    // Format for display: "OCT 28 - NOV 03, 2024"
    const startStr = range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const endStr = range.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    const formattedWeek = `${startStr} - ${endStr}`;
    
    // Store ISO date strings for database
    const startDate = range.start.toISOString().split('T')[0];
    const endDate = range.end.toISOString().split('T')[0];
    
    setFormData({
      ...formData,
      week: formattedWeek,
      startDate,
      endDate,
    });
    
    // Clear date validation error
    setValidationErrors({ ...validationErrors, dateRange: '' });
  };

  // Handle rich content change
  const handleContentChange = (content: JSONContent) => {
    setFormData({
      ...formData,
      richContent: content,
    });
    
    // Clear content validation error
    setValidationErrors({ ...validationErrors, content: '' });
  };

  // Detect platform from URL
  const detectPlatform = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('drive.google.com')) return 'Google Drive';
    if (url.includes('docs.google.com')) return 'Google Docs';
    if (url.includes('sheets.google.com')) return 'Google Sheets';
    if (url.includes('slides.google.com')) return 'Google Slides';
    if (url.includes('onedrive.live.com') || url.includes('sharepoint.com')) return 'Microsoft 365';
    if (url.includes('dropbox.com')) return 'Dropbox';
    return 'Other';
  };

  // Add media link
  const handleAddLink = () => {
    if (!newLink.url.trim()) {
      showErrorToast({ message: 'Please enter a URL', code: 'VALIDATION_ERROR', details: null });
      return;
    }

    const platform = detectPlatform(newLink.url);
    const link: MediaLink = {
      id: `link-${Date.now()}`,
      type: newLink.type,
      platform,
      url: newLink.url.trim(),
      title: newLink.title.trim() || `${newLink.type} link`,
    };

    setFormData({
      ...formData,
      mediaLinks: [...formData.mediaLinks, link],
    });

    setNewLink({ url: '', title: '', type: 'video' });
    showSuccessToast('Link added successfully');
  };

  // Remove media link
  const handleRemoveLink = (linkId: string) => {
    setFormData({
      ...formData,
      mediaLinks: formData.mediaLinks.filter(link => link.id !== linkId),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date range
    if (!dateRange || !formData.startDate || !formData.endDate) {
      setValidationErrors({
        ...validationErrors,
        dateRange: 'Please select a report week',
      });
      return;
    }
    
    // Validate content is not empty
    if (!formData.richContent || !formData.richContent.content || formData.richContent.content.length === 0) {
      setValidationErrors({
        ...validationErrors,
        content: 'Report content cannot be empty',
      });
      return;
    }
    
    // Validate content size
    const sizeValidation = validateContentSize(formData.richContent);
    if (!sizeValidation.valid) {
      setValidationErrors({
        ...validationErrors,
        content: sizeValidation.error || 'Content validation failed',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateReport(editingId, {
          week: formData.week,
          startDate: formData.startDate,
          endDate: formData.endDate,
          richContent: formData.richContent,
          formatType: formData.formatType,
          mediaLinks: formData.mediaLinks,
          status: 'ongoing',
          submittedAt: Date.now(),
        });
      } else {
        const newReport = {
          staffId: user?.staffId || '',
          week: formData.week,
          startDate: formData.startDate,
          endDate: formData.endDate,
          richContent: formData.richContent,
          formatType: formData.formatType,
          summary: '', // Will be extracted from richContent in storage layer
          challenges: '',
          goals: '',
          mediaLinks: formData.mediaLinks,
          status: 'ongoing' as const,
          submittedAt: Date.now(),
          department: (user?.department || 'IT') as Department,
        };
        await addReport(newReport);
      }
      // Reload reports after submission
      const updatedReports = await getReports(user?.staffId);
      setReports(updatedReports);
      setShowForm(false);
      setFormData({
        week: '',
        startDate: '',
        endDate: '',
        richContent: null,
        formatType: 'word',
        mediaLinks: [],
      });
      setDateRange(null);
      setValidationErrors({ dateRange: '', content: '' });
      showSuccessToast(editingId ? 'Report updated successfully' : 'Report submitted successfully');
    } catch (error: any) {
      const dbError = mapDatabaseError(error);
      showErrorToast(dbError, {
        onRetry: () => handleSubmit(e),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      week: '',
      startDate: '',
      endDate: '',
      richContent: null,
      formatType: 'word',
      mediaLinks: [],
    });
    setDateRange(null);
    setValidationErrors({ dateRange: '', content: '' });
    setNewLink({ url: '', title: '', type: 'video' });
  };

  const statusColor = {
    draft: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
    ongoing: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    submitted: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
    approved: 'border-green-500/50 text-green-400 bg-green-500/10',
    rejected: 'border-red-500/50 text-red-400 bg-red-500/10',
  };

  const approvalStatusColor = {
    pending: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
    approved: 'border-green-500/50 text-green-400 bg-green-500/10',
    rejected: 'border-red-500/50 text-red-400 bg-red-500/10',
  };

  return (
    <>
      <TopNav title="Weekly Reports" />
      <div className="p-6 space-y-8">
        {/* Header and Action */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-3xl font-bold text-white">Weekly Performance Reports</h2>
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
            <p className="text-slate-400">Document your key contributions, resolve operational friction, and synchronize next week's strategic objectives.</p>
          </div>
          {!showForm && (
            <Button
              onClick={handleNewReport}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-6 rounded-lg transition-colors ml-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              New Report
            </Button>
          )}
        </div>

        {/* Report Form */}
        {showForm && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Edit Report' : 'Create New Report'}
              </h3>
              <button onClick={handleCancel} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Range Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Report Week</label>
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  disabled={isSubmitting}
                  error={validationErrors.dateRange}
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Report Content</label>
                <RichTextEditor
                  content={formData.richContent}
                  onChange={handleContentChange}
                  formatType={formData.formatType}
                />
                {validationErrors.content && (
                  <p className="mt-2 text-sm text-red-500">{validationErrors.content}</p>
                )}
              </div>

              {/* Media Links Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-200">Media Links (Optional)</label>
                  <span className="text-xs text-slate-400">SECTION 04</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
                  {/* Info Message */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-xs text-blue-300">
                      💡 Add links to videos, audio, or documents. For multiple files of the same type, upload them to a single folder (Google Drive, etc.) and share one link.
                    </p>
                  </div>

                  {/* Add Link Form */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Input
                          type="url"
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                          placeholder="Paste link (YouTube, Google Drive, Docs, etc.)"
                          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <select
                          value={newLink.type}
                          onChange={(e) => setNewLink({ ...newLink, type: e.target.value as 'video' | 'audio' | 'document' })}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                          <option value="document">Document</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        placeholder="Title (optional)"
                        className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                      <Button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!newLink.url.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                  </div>

                  {/* Added Links List */}
                  {formData.mediaLinks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400 font-medium">Added Links ({formData.mediaLinks.length})</p>
                      {formData.mediaLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3 bg-slate-700 rounded-lg group hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {link.type === 'video' && <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                            {link.type === 'audio' && <Music className="w-4 h-4 text-green-400 flex-shrink-0" />}
                            {link.type === 'document' && <FileIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{link.title}</p>
                              <p className="text-xs text-slate-400 truncate">{link.platform} • {link.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(link.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !dateRange || !formData.richContent}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      SUBMITTING...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      SUBMIT REPORT
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        {!showForm && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center backdrop-blur">
                <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-400">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center backdrop-blur">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No reports yet. Create your first weekly report.</p>
                <Button
                  onClick={handleNewReport}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Create Report
                </Button>
              </div>
            ) : (
              reports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">Weekly Report</h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor[report.status]}`}>
                            {report.status.toUpperCase()}
                          </span>
                          {report.approvalStatus && (
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${approvalStatusColor[report.approvalStatus as keyof typeof approvalStatusColor]}`}>
                              {report.approvalStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{report.week}</p>
                        <p className="text-slate-300 line-clamp-2">{report.summary}</p>
                      </div>
                    </div>
                    {report.status === 'draft' && (
                      <Button
                        onClick={() => handleEditReport(report)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-sm"
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Report Details */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Challenges</p>
                      <p className="text-sm text-slate-300 line-clamp-1">{report.challenges}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Future Goals</p>
                      <p className="text-sm text-slate-300 line-clamp-1">{report.goals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Submitted</p>
                      <p className="text-sm text-slate-300">
                        {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Media Links Display */}
                  {report.mediaLinks && report.mediaLinks.length > 0 && (
                    <div className="pt-4 border-t border-slate-800 mt-4">
                      <p className="text-xs text-slate-400 mb-3 font-medium">Attached Media ({report.mediaLinks.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {report.mediaLinks.map((link: MediaLink) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors group"
                          >
                            {link.type === 'video' && <Video className="w-4 h-4 text-cyan-400" />}
                            {link.type === 'audio' && <Music className="w-4 h-4 text-green-400" />}
                            {link.type === 'document' && <FileIcon className="w-4 h-4 text-orange-400" />}
                            <span className="text-slate-300 group-hover:text-white">{link.title}</span>
                            <span className="text-xs text-slate-500">({link.platform})</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
