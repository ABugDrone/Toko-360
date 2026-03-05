/**
 * Attendance Management API
 * Plain English functions for attendance operations
 */

import * as supabaseService from '../supabase-service';
import type { AttendanceRecord } from '../types';

// ============================================================================
// Attendance Retrieval
// ============================================================================

/**
 * Get attendance history for a specific staff member
 */
export async function getStaffAttendanceHistory(staffId: string): Promise<AttendanceRecord[]> {
  const result = await supabaseService.getAttendanceRecords(staffId);
  if (!result.success) {
    console.error('Failed to get staff attendance history:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get all attendance records
 */
export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const result = await supabaseService.getAttendanceRecords();
  if (!result.success) {
    console.error('Failed to get all attendance records:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get pending attendance approvals
 */
export async function getPendingAttendanceApprovals(): Promise<AttendanceRecord[]> {
  const result = await supabaseService.getPendingAttendanceRecords();
  if (!result.success) {
    console.error('Failed to get pending attendance approvals:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get attendance records by approval status
 */
export async function getAttendanceByApprovalStatus(status: 'pending' | 'approved' | 'rejected'): Promise<AttendanceRecord[]> {
  const result = await supabaseService.getAttendanceRecordsByStatus(status);
  if (!result.success) {
    console.error('Failed to get attendance by status:', result.error.message);
    return [];
  }
  return result.data;
}

// ============================================================================
// Attendance Recording
// ============================================================================

/**
 * Record a check-in
 */
export async function recordCheckIn(record: Omit<AttendanceRecord, 'id'>): Promise<void> {
  const result = await supabaseService.addAttendanceRecord(record);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Update attendance record
 */
export async function updateAttendanceRecord(recordId: string, updates: Partial<AttendanceRecord>): Promise<void> {
  const result = await supabaseService.updateAttendanceRecord(recordId, updates);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

// ============================================================================
// Attendance Approval
// ============================================================================

/**
 * Approve attendance record
 */
export async function approveAttendance(recordId: string, approvedBy: string): Promise<void> {
  const result = await supabaseService.approveAttendanceRecord(recordId, approvedBy);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Reject attendance record with feedback
 */
export async function rejectAttendance(recordId: string, rejectedBy: string, feedback: string): Promise<void> {
  const result = await supabaseService.rejectAttendanceRecord(recordId, rejectedBy, feedback);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
