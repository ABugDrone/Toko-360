/**
 * Reports Management API
 * Plain English functions for report operations
 */

import * as supabaseService from '../supabase-service';
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
