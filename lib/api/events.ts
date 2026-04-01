/**
 * Events Management API
 * Plain English functions for event operations
 */

import * as supabaseService from '../supabase-service';
import { supabase } from '../supabase';
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

// ============================================================================
// Event Notification Management
// ============================================================================

/**
 * Mark events as viewed for a user
 * Fetches unviewed events for the user's department and adds the user ID to the viewed_by array
 */
export async function markEventsAsViewed(userId: string, department: string): Promise<void> {
  try {
    // Fetch unviewed events for user's department
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, viewed_by')
      .or(`target_departments.is.null,target_departments.cs.{${department}}`)
      .not('viewed_by', 'cs', `{${userId}}`);
    
    if (fetchError) {
      console.error('Failed to fetch events:', fetchError);
      throw new Error(fetchError.message);
    }
    
    if (!events || events.length === 0) {
      // No unviewed events, nothing to update
      return;
    }
    
    // Update each event to add userId to viewed_by array
    const updates = events.map(event => {
      const viewedBy = event.viewed_by || [];
      return supabase
        .from('events')
        .update({ viewed_by: [...viewedBy, userId] })
        .eq('id', event.id);
    });
    
    // Execute all updates in parallel
    const results = await Promise.all(updates);
    
    // Check for any errors in the updates
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Failed to update some events:', errors);
      throw new Error(`Failed to update ${errors.length} event(s)`);
    }
  } catch (error) {
    console.error('Error marking events as viewed:', error);
    throw error;
  }
}
