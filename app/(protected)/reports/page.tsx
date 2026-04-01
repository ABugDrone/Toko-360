'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/app/auth-context';
import { getReports, updateReport, addReport, getAllUsers } from '@/lib/storage';
import { FileText, Save, X, Loader2, Plus, Trash2, ExternalLink, Video, Music, FileIcon, Link as LinkIcon, XCircle, Edit, Share2 } from 'lucide-react';
import { mapDatabaseError } from '@/lib/error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeApprovals } from '@/hooks/use-realtime-approvals';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { DateRangePicker } from '@/components/reports/date-range-picker';
import { RichTextEditor } from '@/components/reports/rich-text-editor';
import { getReportContent, validateContentSize } from '@/lib/report-serialization';
import { ApprovedReportsCards } from '@/components/reports/ApprovedReportsCards';
import { ShareReportDialog } from '@/components/reports/ShareReportDialog';
import type { MediaLink, JSONContent, Department, User } from '@/lib/types';

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

  // Available departments and users for ApprovedReportsCards
  const availableDepartments: Department[] = [
    'IT',
    'Marketing',
    'Communications',
    'Student Support',
    'Business Intelligence',
    'Finance',
    'Logistics & Procurement',
    'Internship & SIWES',
  ];

  // Fetch available users for sharing
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [shareReport, setShareReport] = useState<any | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all users from the backend
        const users = await getAllUsers();
        
        if (users && Array.isArray(users)) {
          // Filter out current user
          const filteredUsers = users.filter((u: User) => u.staffId !== user?.staffId);
          setAvailableUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (user?.staffId) {
      fetchUsers();
    }
  }, [user?.staffId]);

  // Load reports on mount and when user changes
  useEffect(() => {
    const loadReports = async () => {
      if (user?.staffId) {
        setLoading(true);
        try {
          const data = await getReports(user.staffId);
          console.log('Loaded reports:', data); // Debug: Check report structure
          console.log('First report approval status:', data[0]?.approvalStatus); // Debug specific field
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

  // Handle edit approved report event
  useEffect(() => {
    const handleEditApprovedReport = (event: Event) => {
      const customEvent = event as CustomEvent;
      const report = customEvent.detail;
      
      // Load the report content and populate the form
      const content = getReportContent(report);
      let range: { start: Date; end: Date } | null = null;
      if (report.startDate && report.endDate) {
        range = {
          start: new Date(report.startDate),
          end: new Date(report.endDate),
        };
      }
      
      setEditingId(report.id);
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
      
      // Scroll to form
      setTimeout(() => {
        const formElement = document.querySelector('[data-report-form]');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };

    window.addEventListener('editApprovedReport', handleEditApprovedReport);
    return () => window.removeEventListener('editApprovedReport', handleEditApprovedReport);
  }, []);

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

  const handleShareReport = (report: any) => {
    setShareReport(report);
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
          status: 'submitted',
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
          status: 'submitted' as const,
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
        {/* Approved Reports Section - Only show if user is authenticated */}
        {user && (
          <ApprovedReportsCards
            userRole={user.role === 'admin' ? 'admin' : 'staff'}
            userId={user.staffId}
            availableDepartments={availableDepartments}
            availableUsers={availableUsers}
          />
        )}

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
            <p className="text-muted-foreground">Document your key contributions, resolve operational friction, and synchronize next week's strategic objectives.</p>
          </div>
          {!showForm && (
            <Button
              onClick={handleNewReport}
              className="font-bold px-6 rounded-lg ml-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              New Report
            </Button>
          )}
        </div>

        {/* Report Form */}
        {showForm && (
          <div data-report-form className="rounded-xl p-8 backdrop-blur border bg-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {editingId ? 'Edit Report' : 'Create New Report'}
              </h3>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Range Picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Report Week</label>
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  disabled={isSubmitting}
                  error={validationErrors.dateRange}
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium mb-2">Report Content</label>
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
                  <label className="block text-sm font-medium">Media Links (Optional)</label>
                  <span className="text-xs text-muted-foreground">SECTION 04</span>
                </div>
                <div className="rounded-lg p-4 space-y-4 border bg-muted/50">
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
                        />
                      </div>
                      <div>
                        <select
                          value={newLink.type}
                          onChange={(e) => setNewLink({ ...newLink, type: e.target.value as 'video' | 'audio' | 'document' })}
                          className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none"
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
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!newLink.url.trim()}
                        className="font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                  </div>

                  {/* Added Links List */}
                  {formData.mediaLinks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground">Added Links ({formData.mediaLinks.length})</p>
                      {formData.mediaLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-3 rounded-lg group bg-background"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {link.type === 'video' && <Video className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                            {link.type === 'audio' && <Music className="w-4 h-4 text-green-400 flex-shrink-0" />}
                            {link.type === 'document' && <FileIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{link.title}</p>
                              <p className="text-xs truncate text-muted-foreground">{link.platform} • {link.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(link.id)}
                              className="p-1 text-muted-foreground hover:text-foreground"
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
                  className="flex-1 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  variant="outline"
                  className="flex-1 font-bold rounded-lg disabled:opacity-50"
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
              <div className="rounded-xl p-12 text-center backdrop-blur border bg-card">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-xl p-12 text-center backdrop-blur border bg-card">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="mb-4 text-muted-foreground">No reports yet. Create your first weekly report.</p>
                <Button
                  onClick={handleNewReport}
                  className="font-bold rounded-lg"
                >
                  Create Report
                </Button>
              </div>
            ) : (
              reports.map((report: any) => (
                <div
                  key={report.id}
                  className="rounded-xl p-6 backdrop-blur border bg-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">Weekly Report</h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor[report.status as keyof typeof statusColor] || statusColor.draft}`}>
                            {report.status.toUpperCase()}
                          </span>
                          {report.approvalStatus && (
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${approvalStatusColor[report.approvalStatus as keyof typeof approvalStatusColor]}`}>
                              {report.approvalStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-3 text-muted-foreground">{report.week}</p>
                        <p className="line-clamp-2 text-muted-foreground">{report.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.status === 'draft' && (
                        <Button
                          onClick={() => handleEditReport(report)}
                          variant="outline"
                          className="font-bold rounded-lg text-sm"
                        >
                          Edit
                        </Button>
                      )}
                      {/* Show edit/share buttons for approved reports */}
                      {(() => {
                        const isApproved = report.approvalStatus === 'approved' || 
                          (report.status === 'approved') ||
                          // Show for any report that has an approval status badge showing "APPROVED"
                          (report.approvalStatus && report.approvalStatus.toLowerCase() === 'approved');
                        
                        console.log('Button visibility check:', {
                          reportId: report.id,
                          week: report.week,
                          status: report.status,
                          approvalStatus: report.approvalStatus,
                          isApproved
                        });
                        
                        return isApproved;
                      })() && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report)}
                            className="h-8 px-3 bg-blue-500/10 border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            title="Edit report"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareReport(report)}
                            className="h-8 px-3 bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20"
                            title="Share report"
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rejection Feedback - Show for rejected reports */}
                  {report.approvalStatus === 'rejected' && report.feedback && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-400 mb-2">Rejection Feedback</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{report.feedback}</p>
                          {report.reviewedBy && report.reviewedAt && (
                            <p className="text-xs mt-2 text-muted-foreground/50">
                              Reviewed by {report.reviewedBy} on {new Date(report.reviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Report Details */}
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs mb-1 text-muted-foreground">Submitted</p>
                      <p className="text-sm text-muted-foreground">
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

      {/* Share Report Dialog */}
      {shareReport && (
        <ShareReportDialog
          report={shareReport}
          isOpen={!!shareReport}
          onClose={() => setShareReport(null)}
          currentUserId={user?.staffId || ''}
          availableUsers={availableUsers}
        />
      )}
    </>
  );
}
