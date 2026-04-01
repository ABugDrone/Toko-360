/**
 * Department Management API
 * Plain English functions for department operations
 */

import * as supabaseService from '../supabase-service';
import type { DepartmentRecord } from '../types';

// ============================================================================
// Department Retrieval
// ============================================================================

/**
 * Get all departments in the system
 */
export async function getAllDepartments(): Promise<DepartmentRecord[]> {
  const result = await supabaseService.getDepartments();
  if (!result.success) {
    console.error('Failed to get all departments:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get only active departments
 */
export async function getActiveDepartments(): Promise<DepartmentRecord[]> {
  const result = await supabaseService.getDepartments();
  if (!result.success) {
    console.error('Failed to get active departments:', result.error.message);
    return [];
  }
  return result.data.filter(dept => dept.status === 'active');
}

// ============================================================================
// Department Management
// ============================================================================

/**
 * Create a new department
 */
export async function createNewDepartment(department: Omit<DepartmentRecord, 'id' | 'createdAt'>): Promise<void> {
  const result = await supabaseService.addDepartment(department);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Update department information
 */
export async function updateDepartmentInfo(departmentId: string, updates: Partial<DepartmentRecord>): Promise<void> {
  const result = await supabaseService.updateDepartment(departmentId, updates);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Change the head of a department
 */
export async function changeDepartmentHead(departmentId: string, newHead: string): Promise<void> {
  const result = await supabaseService.updateDepartment(departmentId, { head: newHead });
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Deactivate a department (soft delete)
 */
export async function deactivateDepartment(departmentId: string): Promise<void> {
  const result = await supabaseService.deleteDepartment(departmentId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
