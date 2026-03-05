/**
 * Events Management API
 * Plain English functions for event operations
 */

import * as supabaseService from '../supabase-service';
import type { Event } from '../types';

// ============================================================================
// Event Retrieval
// ============================================================================

/**
 * Get all upcoming events
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const result = await supabaseService.getEvents();
  if (!result.success) {
    console.error('Failed to get upcoming events:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get events for a specific department
 */
export async function getDepartmentEvents(department: string): Promise<Event[]> {
  const result = await supabaseService.getEventsByDepartment(department);
  if (!result.success) {
    console.error('Failed to get department events:', result.error.message);
    return [];
  }
  return result.data;
}

/**
 * Get all events (alias for getUpcomingEvents)
 */
export async function getAllEvents(): Promise<Event[]> {
  return getUpcomingEvents();
}

// ============================================================================
// Event Creation & Management
// ============================================================================

/**
 * Create a new event
 */
export async function createNewEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<void> {
  const result = await supabaseService.addEvent(event);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Update an existing event
 */
export async function updateExistingEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  const result = await supabaseService.updateEvent(eventId, updates);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Cancel/delete an event
 */
export async function cancelEvent(eventId: string): Promise<void> {
  const result = await supabaseService.deleteEvent(eventId);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Broadcast event to all departments (set targetDepartments to null)
 */
export async function broadcastEventToAll(eventId: string): Promise<void> {
  const result = await supabaseService.updateEvent(eventId, { targetDepartments: null });
  if (!result.success) {
    throw new Error(result.error.message);
  }
}

/**
 * Target event to specific departments
 */
export async function targetEventToDepartments(eventId: string, departments: string[]): Promise<void> {
  const result = await supabaseService.updateEvent(eventId, { targetDepartments: departments });
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
