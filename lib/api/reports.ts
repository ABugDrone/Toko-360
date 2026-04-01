/**
 * Reports Management API
 * Plain English functions for report operations
 */

import * as supabaseService from '../supabase-service';
import { supabase } from '../supabase';
import type { WeeklyReport } from '../types';

// ============================================================================
// Report Retrieval
// ============================================================================

/**
 * Get all reports for a specific staff member
 */
export async function getStaffReports(staffId: string): Promise<WeeklyReport[]> {
  const result = await supabaseService.getReports(staffId);
  if (!result.success) {
    console.error('Failed to get staff reports:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get all reports in the system
 */
export async function getAllReports(): Promise<WeeklyReport[]> {
  const result = await supabaseService.getReports();
  if (!result.success) {
    console.error('Failed to get all reports:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get reports waiting for approval
 */
export async function getPendingReportApprovals(): Promise<WeeklyReport[]> {
  const result = await supabaseService.getPendingReports();
  if (!result.success) {
    console.error('Failed to get pending report approvals:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get reports by approval status
 */
export async function getReportsByApprovalStatus(status: 'pending' | 'approved' | 'rejected'): Promise<WeeklyReport[]> {
  const result = await supabaseService.getReportsByStatus(status);
  if (!result.success) {
    console.error('Failed to get reports by status:', result.error.message);
    return [];
  }
  return result.data;
}

// ============================================================================
// Report Submission
// ============================================================================

/**
 * Submit a new weekly report
 */
export async function submitWeeklyReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>): Promise<void> {
  const result = await supabaseService.addReport(report);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Update an existing report
 */
export async function updateWeeklyReport(reportId: string, updates: Partial<WeeklyReport>): Promise<void> {
  const result = await supabaseService.updateReport(reportId, updates);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

// ============================================================================
// Report Approval
// ============================================================================

/**
 * Approve a weekly report
 */
export async function approveWeeklyReport(reportId: string, reviewedBy: string, feedback?: string): Promise<void> {
  const result = await supabaseService.approveReport(reportId, reviewedBy, feedback);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Reject a weekly report with feedback
 */
export async function rejectWeeklyReport(reportId: string, reviewedBy: string, feedback: string): Promise<void> {
  const result = await supabaseService.rejectReport(reportId, reviewedBy, feedback);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

// ============================================================================
// Notification Management
// ============================================================================

/**
 * Mark report notifications as viewed for a staff member
 * Updates notification_viewed to true for approved/rejected reports
 */
export async function markReportsAsViewed(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_reports')
    .update({ notification_viewed: true })
    .eq('staff_id', staffId)
    .in('approval_status', ['approved', 'rejected'])
    .eq('notification_viewed', false);
  
  if (error) {
    console.error('Failed to mark reports as viewed:', error.message);
    throw new Error(`Failed to mark report notifications as viewed: ${error.message}`);
  }
}

// ============================================================================
// Approved Reports Viewer
// ============================================================================

/**
 * Get all reports for admin with filtering and pagination
 * Admin sees ALL reports regardless of approval status
 */
export async function getApprovedReports(
  userRole: 'admin' | 'staff',
  userId: string,
  filters?: import('../types').ReportFilterParams
): Promise<import('../types').PaginatedReportsResponse> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 100; // Increased default for admin
  const offset = (page - 1) * pageSize;

  // Start building the query
  let query = supabase
    .from('weekly_reports')
    .select(`
      *,
      users(name, department)
    `, { count: 'exact' });

  // For admin, show ALL reports (not just approved)
  // For staff, show only approved reports
  if (userRole === 'staff') {
    query = query.eq('approval_status', 'approved');
  }
  // Admin sees all reports - no approval_status filter

  // Apply date range filter
  if (filters?.startDate && filters?.endDate) {
    const startTime = new Date(filters.startDate).toISOString();
    const endTime = new Date(filters.endDate).toISOString();
    query = query.gte('reviewed_at', startTime).lte('reviewed_at', endTime);
  }

  // Apply week/year filter
  if (filters?.week && filters?.year) {
    // Calculate date range from ISO 8601 week number
    const { startDate, endDate } = getWeekDateRange(filters.week, filters.year);
    query = query.gte('reviewed_at', startDate).lte('reviewed_at', endDate);
  } else if (filters?.year) {
    // Filter by year only
    const yearStart = new Date(Date.UTC(filters.year, 0, 1)).toISOString();
    const yearEnd = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59)).toISOString();
    query = query.gte('reviewed_at', yearStart).lte('reviewed_at', yearEnd);
  }

  // Apply name filter (case-insensitive partial match on week field)
  if (filters?.name) {
    query = query.ilike('week', `%${filters.name}%`);
  }

  // Apply department filter
  if (filters?.department) {
    query = query.eq('department', filters.department);
  }

  // Apply author name filter (case-insensitive partial match)
  if (filters?.authorName) {
    // Note: Supabase doesn't support filtering on joined tables directly
    // We'll need to fetch and filter in memory for author name
    // This is a limitation we'll handle by fetching more data
  }

  // Apply pagination and ordering
  query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to get reports:', error.message);
    console.error('Error details:', error);
    throw new Error(`Failed to get reports: ${error.message}`);
  }

  console.log('Raw data from Supabase:', data); // Debug log

  // Transform database records to application format
  let reports = (data || []).map((record: any) => {
    console.log('Processing record:', record); // Debug log
    const report: import('../types').ApprovedReportWithAuthor = {
      id: record.id,
      staffId: record.staff_id,
      week: record.week,
      summary: record.summary,
      challenges: record.challenges,
      goals: record.goals,
      richContent: record.rich_content,
      formatType: record.format_type || 'word',
      startDate: record.start_date,
      endDate: record.end_date,
      status: record.status as import('../types').ReportStatus,
      approvalStatus: record.approval_status || 'pending',
      department: record.department as import('../types').Department,
      mediaLinks: record.media_links || [],
      createdAt: new Date(record.created_at).getTime(),
      submittedAt: record.submitted_at ? new Date(record.submitted_at).getTime() : undefined,
      reviewedBy: record.reviewed_by,
      reviewedAt: record.reviewed_at ? new Date(record.reviewed_at).getTime() : undefined,
      feedback: record.feedback,
      notificationViewed: record.notification_viewed || false,
      authorName: record.users?.name || 'Unknown',
      authorDepartment: record.users?.department as import('../types').Department,
      approvedByName: undefined,
    };
    return report;
  });

  // Apply author name filter in memory (if specified)
  if (filters?.authorName) {
    const searchTerm = filters.authorName.toLowerCase();
    reports = reports.filter(report => 
      report.authorName.toLowerCase().includes(searchTerm)
    );
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    reports,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Calculate date range for ISO 8601 week number
 * Week starts on Monday, week 1 contains the first Thursday of the year
 */
function getWeekDateRange(week: number, year: number): { startDate: string; endDate: string } {
  // Find the first Thursday of the year
  const jan4 = new Date(year, 0, 4);
  const firstThursday = new Date(jan4);
  firstThursday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + 3);
  
  // Find Monday of week 1
  const firstMonday = new Date(firstThursday);
  firstMonday.setDate(firstThursday.getDate() - 3);
  
  // Calculate the start date of the target week
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Calculate the end date (Sunday of the target week)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Check if a user has permission to edit a specific report
 * Admins can only edit their own reports
 * Staff can edit reports if they have valid approval
 */
export async function checkEditPermission(
  userId: string,
  reportId: string,
  userRole: 'admin' | 'staff'
): Promise<{ canEdit: boolean; reason?: string }> {
  // Fetch the report
  const { data: report, error: reportError } = await supabase
    .from('weekly_reports')
    .select('staff_id')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    return { canEdit: false, reason: 'Report not found' };
  }

  // Admin logic: can only edit own reports
  if (userRole === 'admin') {
    if (report.staff_id === userId) {
      return { canEdit: true };
    }
    return { canEdit: false, reason: 'Can only edit own reports' };
  }

  // Staff logic: check for edit approval
  const { data: approval, error: approvalError } = await supabase
    .from('report_edit_approvals')
    .select('*')
    .eq('report_id', reportId)
    .eq('staff_id', userId)
    .single();

  if (approvalError || !approval) {
    return { canEdit: false, reason: 'Admin approval required' };
  }

  // Check if approval has expired
  if (approval.expires_at) {
    const expiresAt = new Date(approval.expires_at).getTime();
    const now = Date.now();
    if (now > expiresAt) {
      return { canEdit: false, reason: 'Edit approval has expired' };
    }
  }

  return { canEdit: true };
}

/**
 * Download a report as a file
 * Generates timestamped filename and converts content to appropriate format
 */
export async function downloadReport(
  reportId: string
): Promise<{ filename: string; content: Blob }> {
  // Fetch the report
  const { data: report, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    throw new Error('Report not found');
  }

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  // Generate filename
  const reportName = report.week.replace(/[^a-zA-Z0-9]/g, '_');
  const extension = 'json'; // Default to JSON for rich content
  const filename = `${reportName}_${timestamp}.${extension}`;

  // Convert content to JSON blob
  const content = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });

  return { filename, content };
}

/**
 * Share a report via the messaging system
 * Generates report link and sends message with report reference
 */
export async function shareReportViaMessaging(
  senderId: string,
  recipientId: string,
  reportId: string,
  reportName: string,
  customMessage?: string
): Promise<void> {
  // Generate report link - now points to main reports page
  const reportLink = `/reports?reportId=${reportId}`;

  // Construct message content
  const messageContent = customMessage
    ? `${customMessage}\n\nShared Report: ${reportName}\nView Report: ${reportLink}`
    : `Shared Report: ${reportName}\nView Report: ${reportLink}`;

  // Send message using existing messaging API
  const { error } = await supabase.from('messages').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    type: 'text',
    content: messageContent,
    read: false,
  });

  if (error) {
    throw new Error(`Failed to share report: ${error.message}`);
  }
}
