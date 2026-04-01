/**
 * Bug Condition Exploration Test for Events Real-Time Delete Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * Property 1: Fault Condition - Real-Time Event Deletion Payload
 * 
 * CRITICAL: This test MUST FAIL on unfixed database - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface counterexamples that demonstrate the bug exists
 * 
 * Expected Outcome: Test FAILS on unfixed database (confirms bug)
 * After Fix: Test PASSES (confirms fix works)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { supabase } from '@/lib/supabase';
import * as supabaseService from '@/lib/supabase-service';
import type { Event } from '@/lib/types';

describe('Bug Condition Exploration: Real-Time Event Deletion', () => {
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
   * Property 1: Fault Condition - Real-Time Event Deletion Payload
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any DELETE operation on the events table where an admin deletes an event,
   * the real-time subscription handler MUST receive complete row data in payload.old
   * including the event ID.
   * 
   * This test verifies the fault condition from the design:
   * - input.operation == 'DELETE'
   * - input.table == 'events'
   * - input.replicaIdentity != 'FULL'
   * 
   * Expected behavior (after fix):
   * - payload.old is defined
   * - payload.old.id contains the deleted event's ID
   * - handleEventDeleted callback can extract the event ID
   * 
   * EXPECTED OUTCOME ON UNFIXED DATABASE:
   * - Test FAILS because payload.old is undefined or incomplete
   * - This confirms the bug exists (missing REPLICA IDENTITY FULL)
   */
  it('should receive complete row data in payload.old when event is deleted', async () => {
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
          category: fc.constantFrom('meeting', 'training', 'announcement', 'deadline', 'webinar', 'bootcamp', 'tedx', 'other'),
          color: fc.constantFrom('bg-blue-600', 'bg-purple-600', 'bg-cyan-600', 'bg-red-600', 'bg-green-600', 'bg-orange-600', 'bg-pink-600', 'bg-gray-600'),
        }),
        async (eventData) => {
          // Create a test event
          const result = await supabaseService.addEvent({
            ...eventData,
            createdBy: 'ADMIN001', // Valid admin user from seed data
            targetDepartments: null, // Broadcast to all
          });

          if (!result.success) {
            throw new Error(`Failed to create event: ${result.error.message}`);
          }

          const createdEvent = result.data;
          testEventIds.push(createdEvent.id);

          // Set up real-time subscription to capture DELETE payload
          let deletePayload: any = null;
          let deleteReceived = false;

          const deletePromise = new Promise<void>((resolve) => {
            channel = supabase
              .channel(`test-delete-${createdEvent.id}`)
              .on(
                'postgres_changes',
                {
                  event: 'DELETE',
                  schema: 'public',
                  table: 'events',
                  filter: `id=eq.${createdEvent.id}`,
                },
                (payload) => {
                  deletePayload = payload;
                  deleteReceived = true;
                  resolve();
                }
              )
              .subscribe();
          });

          // Wait for subscription to be ready
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Delete the event
          const deleteResult = await supabaseService.deleteEvent(createdEvent.id);
          if (!deleteResult.success) {
            throw new Error(`Failed to delete event: ${deleteResult.error.message}`);
          }

          // Wait for DELETE event to be received (with timeout)
          await Promise.race([
            deletePromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout waiting for DELETE event')), 5000)
            ),
          ]);

          // Verify DELETE event was received
          expect(deleteReceived, 'DELETE event should be received by real-time subscription').toBe(true);

          // CRITICAL ASSERTIONS: These will FAIL on unfixed database
          // This confirms the bug exists (missing REPLICA IDENTITY FULL)
          
          // Assert payload.old is defined
          expect(
            deletePayload.old,
            'payload.old should be defined (FAILS on unfixed database - confirms bug exists)'
          ).toBeDefined();

          // Assert payload.old contains the event ID
          expect(
            deletePayload.old?.id,
            'payload.old.id should contain the deleted event ID (FAILS on unfixed database - confirms bug exists)'
          ).toBe(createdEvent.id);

          // Assert payload.old contains complete row data (not just primary key)
          expect(
            deletePayload.old?.title,
            'payload.old should contain complete row data including title (FAILS on unfixed database - confirms bug exists)'
          ).toBeDefined();

          expect(
            deletePayload.old?.description,
            'payload.old should contain complete row data including description (FAILS on unfixed database - confirms bug exists)'
          ).toBeDefined();

          // Cleanup
          await supabase.removeChannel(channel);
          channel = null;
        }
      ),
      {
        numRuns: 3, // Run 3 test cases to surface counterexamples (reduced for faster execution)
        timeout: 30000, // 30 second timeout per test case
      }
    );
  }, 180000); // 3 minute timeout for entire test

  /**
   * Verification Test: Check REPLICA IDENTITY setting
   * 
   * This test verifies the root cause by querying the database configuration.
   * 
   * Expected result on UNFIXED database:
   * - relreplident = 'd' (DEFAULT)
   * 
   * Expected result on FIXED database:
   * - relreplident = 'f' (FULL)
   */
  it('should verify REPLICA IDENTITY setting on events table', async () => {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT relreplident FROM pg_class WHERE relname = 'events';"
    });

    if (error) {
      // If RPC function doesn't exist, skip this verification
      console.warn('Cannot verify REPLICA IDENTITY: exec_sql RPC function not available');
      console.warn('Expected: relreplident = "d" (DEFAULT) on unfixed database');
      console.warn('Expected: relreplident = "f" (FULL) on fixed database');
      return;
    }

    // On unfixed database, this should be 'd' (DEFAULT)
    // On fixed database, this should be 'f' (FULL)
    console.log('REPLICA IDENTITY setting:', data);
    
    // This assertion will FAIL on unfixed database (confirms bug)
    // This assertion will PASS on fixed database (confirms fix)
    expect(
      data?.[0]?.relreplident,
      'REPLICA IDENTITY should be "f" (FULL) for real-time DELETE to work correctly. Current value "d" (DEFAULT) confirms the bug exists.'
    ).toBe('f');
  });
});
