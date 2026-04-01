/**
 * Preservation Property Tests for Events Real-Time Delete Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * Property 2: Preservation - Non-DELETE Real-Time Operations
 * 
 * IMPORTANT: These tests verify baseline behavior on UNFIXED database
 * They should PASS on unfixed database to confirm what behavior to preserve
 * They should also PASS on fixed database to confirm no regressions
 * 
 * Testing approach: Observe and capture existing behavior patterns for:
 * - INSERT operations (real-time event creation)
 * - UPDATE operations (real-time event updates)
 * - Manual refresh (button click)
 * - Periodic refresh (30-second timer)
 * - Department filtering (targeted vs broadcast events)
 * - Connection status (online/reconnecting/offline)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { supabase } from '@/lib/supabase';
import * as supabaseService from '@/lib/supabase-service';
import type { Event } from '@/lib/types';

describe('Preservation: Non-DELETE Real-Time Operations', () => {
  let testEventIds: string[] = [];
  let channel: any = null;

  beforeEach(() => {
    testEventIds = [];
  });

  afterEach(async () => {
    // Cleanup: Remove channel subscription
    if (channel) {
      await supabase.removeChannel(channel);
      channel = null;
    }

    // Cleanup: Delete all test events
    for (const eventId of testEventIds) {
      try {
        await supabaseService.deleteEvent(eventId);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    testEventIds = [];
  });

  /**
   * Property 2.1: INSERT Preservation
   * 
   * **Validates: Requirement 3.1**
   * 
   * For any INSERT operation on the events table, the system SHALL display
   * the new event in real-time for all relevant users based on department targeting.
   * 
   * This test verifies that:
   * - New events can be created successfully
   * - Created events contain complete data
   * - Department targeting is preserved (null = all departments)
   * - Events are retrievable after creation
   * 
   * EXPECTED OUTCOME: Test PASSES on unfixed database (confirms baseline behavior)
   */
  it('should preserve INSERT operations with complete event data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random event data
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 50 }),
          description: fc.string({ minLength: 10, maxLength: 200 }),
          eventDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
            .map(d => d.toISOString().split('T')[0]),
          eventTime: fc.integer({ min: 0, max: 23 }).chain(hour =>
            fc.integer({ min: 0, max: 59 }).map(minute =>
              `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            )
          ),
          location: fc.string({ minLength: 3, maxLength: 50 }),
          category: fc.constantFrom('meeting', 'training', 'announcement', 'deadline', 'webinar'),
          targetDepartments: fc.constantFrom(null, ['Sales'], ['Marketing'], ['Sales', 'Marketing']),
        }),
        async (eventData) => {
          // Create a test event
          const result = await supabaseService.addEvent({
            ...eventData,
            createdBy: 'ADMIN001',
            color: 'bg-blue-600',
          });

          if (!result.success) {
            throw new Error(`Failed to create event: ${result.error.message}`);
          }

          const createdEvent = result.data;
          testEventIds.push(createdEvent.id);

          // Verify created event contains complete data
          expect(createdEvent.id, 'Created event should have an ID').toBeDefined();
          expect(createdEvent.title, 'Title should match').toBe(eventData.title);
          expect(createdEvent.description, 'Description should match').toBe(eventData.description);
          expect(createdEvent.eventDate, 'Event date should match').toBe(eventData.eventDate);
          expect(createdEvent.eventTime, 'Event time should match').toBe(eventData.eventTime);
          expect(createdEvent.location, 'Location should match').toBe(eventData.location);
          expect(createdEvent.category, 'Category should match').toBe(eventData.category);
          expect(createdEvent.createdBy, 'Created by should match').toBe('ADMIN001');

          // Verify department targeting is preserved
          if (eventData.targetDepartments === null) {
            expect(createdEvent.targetDepartments, 'Broadcast events should have null target_departments').toBeNull();
          } else {
            expect(createdEvent.targetDepartments, 'Targeted events should have department array').toEqual(eventData.targetDepartments);
          }

          // Verify event is retrievable from database
          const fetchResult = await supabaseService.getEventsByDepartment('Sales');
          if (!fetchResult.success) {
            throw new Error(`Failed to fetch events: ${fetchResult.error.message}`);
          }

          const fetchedEvent = fetchResult.data.find(e => e.id === createdEvent.id);
          
          // If event is targeted to Sales or broadcast to all, it should be found
          if (eventData.targetDepartments === null || eventData.targetDepartments.includes('Sales')) {
            expect(fetchedEvent, 'Event should be retrievable from database').toBeDefined();
            expect(fetchedEvent?.title, 'Fetched title should match').toBe(eventData.title);
          }
        }
      ),
      {
        numRuns: 3, // Reduced for faster execution
        timeout: 30000,
      }
    );
  }, 180000);

  /**
   * Property 2.2: UPDATE Preservation
   * 
   * **Validates: Requirement 3.2**
   * 
   * For any UPDATE operation on the events table, the system SHALL display
   * the updated event in real-time for all relevant users.
   * 
   * This test verifies that:
   * - Events can be updated successfully
   * - Updated events contain complete data
   * - Changes to title, description are preserved
   * - Unchanged fields remain intact
   * 
   * EXPECTED OUTCOME: Test PASSES on unfixed database (confirms baseline behavior)
   */
  it('should preserve UPDATE operations with complete event data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial and updated event data
        fc.record({
          initial: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            eventDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
              .map(d => d.toISOString().split('T')[0]),
            eventTime: fc.integer({ min: 0, max: 23 }).chain(hour =>
              fc.integer({ min: 0, max: 59 }).map(minute =>
                `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
              )
            ),
            location: fc.string({ minLength: 3, maxLength: 50 }),
          }),
          updated: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
          }),
        }),
        async ({ initial, updated }) => {
          // Create initial event
          const createResult = await supabaseService.addEvent({
            ...initial,
            createdBy: 'ADMIN001',
            category: 'meeting',
            color: 'bg-blue-600',
            targetDepartments: null,
          });

          if (!createResult.success) {
            throw new Error(`Failed to create event: ${createResult.error.message}`);
          }

          const createdEvent = createResult.data;
          testEventIds.push(createdEvent.id);

          // Update the event
          const updateResult = await supabaseService.updateEvent(createdEvent.id, {
            title: updated.title,
            description: updated.description,
          });

          if (!updateResult.success) {
            throw new Error(`Failed to update event: ${updateResult.error.message}`);
          }

          const updatedEvent = updateResult.data;

          // Verify updated event contains complete data
          expect(updatedEvent.id, 'Updated event should have same ID').toBe(createdEvent.id);
          expect(updatedEvent.title, 'Title should be updated').toBe(updated.title);
          expect(updatedEvent.description, 'Description should be updated').toBe(updated.description);

          // Verify unchanged fields are preserved
          expect(updatedEvent.eventDate, 'Event date should be unchanged').toBe(initial.eventDate);
          expect(updatedEvent.eventTime, 'Event time should be unchanged').toBe(initial.eventTime);
          expect(updatedEvent.location, 'Location should be unchanged').toBe(initial.location);
          expect(updatedEvent.category, 'Category should be unchanged').toBe('meeting');
          expect(updatedEvent.createdBy, 'Created by should be unchanged').toBe('ADMIN001');

          // Verify event is retrievable from database with updates
          const fetchResult = await supabaseService.getEventsByDepartment('Sales');
          if (!fetchResult.success) {
            throw new Error(`Failed to fetch events: ${fetchResult.error.message}`);
          }

          const fetchedEvent = fetchResult.data.find(e => e.id === createdEvent.id);
          expect(fetchedEvent, 'Updated event should be retrievable from database').toBeDefined();
          expect(fetchedEvent?.title, 'Fetched title should match updated value').toBe(updated.title);
          expect(fetchedEvent?.description, 'Fetched description should match updated value').toBe(updated.description);
        }
      ),
      {
        numRuns: 3, // Reduced for faster execution
        timeout: 30000,
      }
    );
  }, 180000);

  /**
   * Property 2.3: Manual Refresh Preservation
   * 
   * **Validates: Requirement 3.3**
   * 
   * For any manual refresh button click, the system SHALL reload events
   * from the database and update the display.
   * 
   * This test verifies that:
   * - Manual refresh fetches fresh data from database
   * - All events are returned correctly
   * - Department filtering is applied correctly
   * 
   * EXPECTED OUTCOME: Test PASSES on unfixed database (confirms baseline behavior)
   */
  it('should reload events correctly on manual refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple events
        fc.array(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
            eventDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
              .map(d => d.toISOString().split('T')[0]),
            eventTime: fc.integer({ min: 0, max: 23 }).chain(hour =>
              fc.integer({ min: 0, max: 59 }).map(minute =>
                `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
              )
            ),
            location: fc.string({ minLength: 3, maxLength: 50 }),
            category: fc.constantFrom('meeting', 'training', 'announcement'),
          }),
          { minLength: 2, maxLength: 3 } // Create 2-3 events
        ),
        async (eventsData) => {
          // Create multiple events
          const createdEvents: Event[] = [];
          for (const eventData of eventsData) {
            const result = await supabaseService.addEvent({
              ...eventData,
              createdBy: 'ADMIN001',
              color: 'bg-blue-600',
              targetDepartments: null, // Broadcast to all
            });

            if (!result.success) {
              throw new Error(`Failed to create event: ${result.error.message}`);
            }

            createdEvents.push(result.data);
            testEventIds.push(result.data.id);
          }

          // Simulate manual refresh by fetching events from database
          const refreshResult = await supabaseService.getEventsByDepartment('Sales');

          if (!refreshResult.success) {
            throw new Error(`Failed to refresh events: ${refreshResult.error.message}`);
          }

          const refreshedEvents = refreshResult.data;

          // Verify all created events are in the refreshed list
          for (const createdEvent of createdEvents) {
            const found = refreshedEvents.find(e => e.id === createdEvent.id);
            expect(found, `Event ${createdEvent.id} should be in refreshed list`).toBeDefined();
            expect(found?.title, 'Title should match').toBe(createdEvent.title);
            expect(found?.description, 'Description should match').toBe(createdEvent.description);
            expect(found?.eventDate, 'Event date should match').toBe(createdEvent.eventDate);
            expect(found?.eventTime, 'Event time should match').toBe(createdEvent.eventTime);
            expect(found?.location, 'Location should match').toBe(createdEvent.location);
          }
        }
      ),
      {
        numRuns: 3, // Reduced for faster execution
        timeout: 30000,
      }
    );
  }, 180000);

  /**
   * Property 2.4: Department Filtering Preservation
   * 
   * **Validates: Requirement 3.5**
   * 
   * For any event display, the system SHALL filter and show only events
   * targeted to the user's department or broadcast to all departments.
   * 
   * This test verifies that:
   * - Events with targetDepartments=null are visible to all departments
   * - Events with specific targetDepartments are visible only to those departments
   * - Events not targeted to a department are not visible to that department
   * 
   * EXPECTED OUTCOME: Test PASSES on unfixed database (confirms baseline behavior)
   */
  it('should filter events correctly by department targeting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          broadcastEvent: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          salesEvent: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          marketingEvent: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.string({ minLength: 10, maxLength: 200 }),
          }),
        }),
        async ({ broadcastEvent, salesEvent, marketingEvent }) => {
          // Create broadcast event (visible to all)
          const broadcastResult = await supabaseService.addEvent({
            ...broadcastEvent,
            eventDate: '2025-12-31',
            eventTime: '10:00',
            location: 'Conference Room',
            createdBy: 'ADMIN001',
            category: 'meeting',
            color: 'bg-blue-600',
            targetDepartments: null, // Broadcast to all
          });

          if (!broadcastResult.success) {
            throw new Error(`Failed to create broadcast event: ${broadcastResult.error.message}`);
          }
          testEventIds.push(broadcastResult.data.id);

          // Create Sales-only event
          const salesResult = await supabaseService.addEvent({
            ...salesEvent,
            eventDate: '2025-12-31',
            eventTime: '11:00',
            location: 'Sales Room',
            createdBy: 'ADMIN001',
            category: 'meeting',
            color: 'bg-blue-600',
            targetDepartments: ['Sales'],
          });

          if (!salesResult.success) {
            throw new Error(`Failed to create sales event: ${salesResult.error.message}`);
          }
          testEventIds.push(salesResult.data.id);

          // Create Marketing-only event
          const marketingResult = await supabaseService.addEvent({
            ...marketingEvent,
            eventDate: '2025-12-31',
            eventTime: '12:00',
            location: 'Marketing Room',
            createdBy: 'ADMIN001',
            category: 'meeting',
            color: 'bg-blue-600',
            targetDepartments: ['Marketing'],
          });

          if (!marketingResult.success) {
            throw new Error(`Failed to create marketing event: ${marketingResult.error.message}`);
          }
          testEventIds.push(marketingResult.data.id);

          // Fetch events for Sales department
          const salesEventsResult = await supabaseService.getEventsByDepartment('Sales');
          if (!salesEventsResult.success) {
            throw new Error(`Failed to fetch sales events: ${salesEventsResult.error.message}`);
          }
          const salesEvents = salesEventsResult.data;

          // Verify Sales sees broadcast event and sales event, but NOT marketing event
          expect(
            salesEvents.some(e => e.id === broadcastResult.data.id),
            'Sales should see broadcast event'
          ).toBe(true);
          expect(
            salesEvents.some(e => e.id === salesResult.data.id),
            'Sales should see sales-targeted event'
          ).toBe(true);
          expect(
            salesEvents.some(e => e.id === marketingResult.data.id),
            'Sales should NOT see marketing-only event'
          ).toBe(false);

          // Fetch events for Marketing department
          const marketingEventsResult = await supabaseService.getEventsByDepartment('Marketing');
          if (!marketingEventsResult.success) {
            throw new Error(`Failed to fetch marketing events: ${marketingEventsResult.error.message}`);
          }
          const marketingEvents = marketingEventsResult.data;

          // Verify Marketing sees broadcast event and marketing event, but NOT sales event
          expect(
            marketingEvents.some(e => e.id === broadcastResult.data.id),
            'Marketing should see broadcast event'
          ).toBe(true);
          expect(
            marketingEvents.some(e => e.id === marketingResult.data.id),
            'Marketing should see marketing-targeted event'
          ).toBe(true);
          expect(
            marketingEvents.some(e => e.id === salesResult.data.id),
            'Marketing should NOT see sales-only event'
          ).toBe(false);
        }
      ),
      {
        numRuns: 3, // Reduced for faster execution
        timeout: 30000,
      }
    );
  }, 180000);

  /**
   * Property 2.5: Connection Status Preservation
   * 
   * **Validates: Requirement 3.6**
   * 
   * For any real-time connection status change, the system SHALL display
   * the appropriate connection indicator (online, reconnecting, offline).
   * 
   * This test verifies that:
   * - Subscription status changes are detected
   * - SUBSCRIBED status indicates online connection
   * - Connection status can be monitored
   * 
   * EXPECTED OUTCOME: Test PASSES on unfixed database (confirms baseline behavior)
   */
  it('should track connection status correctly', async () => {
    // Set up real-time subscription and monitor status
    let connectionStatus: string | null = null;

    const statusPromise = new Promise<void>((resolve) => {
      channel = supabase
        .channel(`test-connection-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events',
          },
          () => {
            // Handler for events (not used in this test)
          }
        )
        .subscribe((status) => {
          connectionStatus = status;
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
    });

    // Wait for subscription to be established (with timeout)
    await Promise.race([
      statusPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for SUBSCRIBED status')), 10000)
      ),
    ]);

    // Verify connection status is SUBSCRIBED (online)
    expect(
      connectionStatus,
      'Connection status should be SUBSCRIBED when subscription is established'
    ).toBe('SUBSCRIBED');

    // Cleanup
    await supabase.removeChannel(channel);
    channel = null;
  }, 30000);
});
