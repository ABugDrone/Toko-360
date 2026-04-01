# Events Real-Time Delete Fix Design

## Overview

The bug prevents deleted events from disappearing in real-time for other users viewing the Events page. When an admin deletes an event, the DELETE operation completes successfully in the database, but the real-time subscription handler does not receive the necessary data to identify which event was deleted. This is caused by a missing database configuration: the `events` table lacks `REPLICA IDENTITY FULL`, which is required for Supabase real-time to include the deleted row's data (`payload.old`) in DELETE events.

The fix requires adding `REPLICA IDENTITY FULL` to the events table, which will enable Supabase to broadcast the complete deleted row data to all subscribed clients, allowing the `handleEventDeleted` callback to extract the event ID and remove it from local state.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an admin deletes an event and other users are viewing the Events page with an active real-time subscription
- **Property (P)**: The desired behavior when an event is deleted - all connected clients should immediately remove the deleted event from their local state without requiring a page refresh
- **Preservation**: Existing INSERT and UPDATE real-time behavior, manual refresh, periodic refresh, and department filtering that must remain unchanged by the fix
- **REPLICA IDENTITY**: PostgreSQL table setting that determines which columns are included in the replication stream for UPDATE and DELETE operations
- **REPLICA IDENTITY FULL**: Setting that includes all columns of the old row in the replication stream, required for Supabase real-time DELETE events to include `payload.old` data
- **payload.old**: The Supabase real-time event payload property that contains the deleted row's data, only available when REPLICA IDENTITY FULL is configured
- **handleEventDeleted**: The callback function in `use-realtime-events.ts` that removes a deleted event from local state using the event ID
- **Real-time subscription**: The Supabase channel subscription in `use-realtime-events.ts` that listens for INSERT, UPDATE, and DELETE events on the events table

## Bug Details

### Fault Condition

The bug manifests when an admin user (Business Intelligence department) deletes an event while other users are viewing the Events page with an active real-time subscription. The DELETE operation succeeds in the database, but the real-time subscription handler receives a payload with `payload.old` containing only the primary key (id) instead of all row columns. This occurs because the `events` table is missing the `REPLICA IDENTITY FULL` configuration.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { operation: 'DELETE', table: 'events', replicaIdentity: string }
  OUTPUT: boolean
  
  RETURN input.operation == 'DELETE'
         AND input.table == 'events'
         AND input.replicaIdentity != 'FULL'
         AND realtimeSubscriptionActive()
         AND otherUsersViewingEventsPage()
END FUNCTION
```

### Examples

- **Example 1**: Admin deletes "Team Meeting" event → Other users still see the event in their list → They must manually refresh to see it removed
- **Example 2**: Admin deletes "Training Session" event → Real-time DELETE handler fires but `payload.old.id` is undefined → Event remains in local state
- **Example 3**: Admin deletes "Webinar" event → Connection status shows "online" but event doesn't disappear → Users wait for 30-second periodic refresh
- **Edge Case**: Admin deletes event while user is offline → When user reconnects, periodic refresh correctly removes the event (this works because it fetches fresh data from database)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- INSERT real-time operations must continue to add new events to all relevant users' displays based on department targeting
- UPDATE real-time operations must continue to modify existing events in all relevant users' displays
- Manual refresh button must continue to reload events from the database
- 30-second periodic refresh must continue to sync events in the background
- Department filtering logic must continue to show only events targeted to the user's department or broadcast to all
- Connection status indicator must continue to display online/reconnecting/offline states
- Event creation, editing, and deletion UI flows must continue to work as before

**Scope:**
All inputs that do NOT involve DELETE operations on the events table should be completely unaffected by this fix. This includes:
- INSERT operations (new event creation)
- UPDATE operations (event editing)
- Manual refresh operations
- Periodic refresh operations
- Initial page load and data fetching
- Department filtering logic
- Connection status monitoring

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

**Missing REPLICA IDENTITY FULL Configuration**

The `events` table in the Supabase database does not have `REPLICA IDENTITY FULL` configured. By default, PostgreSQL tables use `REPLICA IDENTITY DEFAULT`, which only includes the primary key in the replication stream for DELETE operations.

**Evidence:**
1. The `supabase/schema.sql` file creates the events table but does not include `ALTER TABLE events REPLICA IDENTITY FULL`
2. The `handleDelete` callback in `use-realtime-events.ts` attempts to access `payload.old.id`, but this property is undefined when REPLICA IDENTITY is not FULL
3. The messaging system works correctly because the `messages` table likely has REPLICA IDENTITY FULL configured (or was configured manually in Supabase dashboard)
4. INSERT and UPDATE operations work correctly because they always include the new row data in `payload.new`, regardless of REPLICA IDENTITY setting

**Why This Causes the Bug:**
- When REPLICA IDENTITY is DEFAULT (the default setting), DELETE events only include the primary key in the replication stream
- Supabase real-time broadcasts this limited data, resulting in `payload.old` being undefined or containing only the id
- The `handleEventDeleted` callback cannot extract the event ID from an undefined payload
- Without the event ID, the callback cannot filter the deleted event from local state
- The event remains visible until a manual or periodic refresh fetches fresh data from the database

**Comparison with Working Messaging System:**
The messaging system's DELETE operations work correctly (though not explicitly shown in the code, the pattern suggests it would work). The key difference is that the messages table likely has REPLICA IDENTITY FULL configured, either through:
- Manual configuration in Supabase dashboard
- A migration script not present in the current schema.sql
- Default configuration for certain table types

## Correctness Properties

Property 1: Fault Condition - Real-Time Event Deletion

_For any_ DELETE operation on the events table where an admin deletes an event and other users have active real-time subscriptions, the fixed system SHALL immediately broadcast the deleted event's complete row data (including the event ID) to all subscribed clients, triggering the `handleEventDeleted` callback to remove the event from local state without requiring a page refresh.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-DELETE Real-Time Operations

_For any_ INSERT or UPDATE operation on the events table, the fixed system SHALL produce exactly the same real-time behavior as the original system, preserving the correct propagation of new and updated events to all relevant users based on department targeting.

**Validates: Requirements 3.1, 3.2**

Property 3: Preservation - Manual and Periodic Refresh

_For any_ manual refresh button click or 30-second periodic refresh timer event, the fixed system SHALL produce exactly the same behavior as the original system, fetching fresh event data from the database and updating the display.

**Validates: Requirements 3.3, 3.4**

Property 4: Preservation - Department Filtering and Connection Status

_For any_ event display or connection status update, the fixed system SHALL produce exactly the same behavior as the original system, correctly filtering events by department and displaying accurate connection indicators.

**Validates: Requirements 3.5, 3.6**

## Fix Implementation

### Changes Required

The fix requires a single database configuration change with no code modifications needed.

**File**: `supabase/schema.sql`

**Specific Changes**:

1. **Add REPLICA IDENTITY FULL to events table**:
   - Add the following SQL statement after the events table creation:
   ```sql
   -- Enable full row replication for real-time DELETE events
   ALTER TABLE events REPLICA IDENTITY FULL;
   ```
   - This should be placed after the `CREATE TABLE events` statement and before the index creation section
   - This configuration tells PostgreSQL to include all columns of the deleted row in the replication stream

2. **Apply the migration to existing database**:
   - Run the ALTER TABLE statement in the Supabase SQL Editor for the production database
   - This is a metadata-only change and does not require table rebuilding or data migration
   - The change takes effect immediately for all future DELETE operations

3. **Verify the configuration**:
   - Query the replica identity setting: `SELECT relreplident FROM pg_class WHERE relname = 'events';`
   - Expected result: `f` (which represents FULL)
   - Default value before fix: `d` (which represents DEFAULT)

**Why No Code Changes Are Needed**:
- The `handleEventDeleted` callback in `use-realtime-events.ts` already correctly accesses `payload.old.id`
- The real-time subscription already listens for DELETE events on the events table
- The callback already correctly filters the deleted event from local state
- The only issue is that `payload.old` is undefined due to missing REPLICA IDENTITY FULL
- Once REPLICA IDENTITY FULL is configured, `payload.old` will contain the complete deleted row data
- The existing code will then work correctly without any modifications

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the unfixed database configuration, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the root cause is indeed the missing REPLICA IDENTITY FULL configuration.

**Test Plan**: Write tests that simulate event deletion and verify that the real-time DELETE handler receives the complete deleted row data. Run these tests on the UNFIXED database to observe failures and confirm the root cause.

**Test Cases**:
1. **DELETE Payload Structure Test**: Delete an event and inspect the real-time payload structure (will fail on unfixed database - `payload.old` will be undefined or incomplete)
2. **Multi-User DELETE Propagation Test**: Admin deletes event while another user is viewing the Events page (will fail on unfixed database - event remains visible for other user)
3. **Replica Identity Verification Test**: Query the database to check the current REPLICA IDENTITY setting for events table (will show 'd' for DEFAULT on unfixed database)
4. **Comparison with Messages Table Test**: Verify that messages table has REPLICA IDENTITY FULL and DELETE operations work correctly (should pass, confirming the pattern works when configured correctly)

**Expected Counterexamples**:
- `payload.old` is undefined or contains only the primary key when DELETE event fires
- Other users' Events pages do not update when admin deletes an event
- Replica identity query returns 'd' (DEFAULT) instead of 'f' (FULL)
- Possible causes: missing REPLICA IDENTITY FULL configuration, incorrect table name, RLS policy blocking replication

### Fix Checking

**Goal**: Verify that for all DELETE operations where the bug condition holds, the fixed database configuration produces the expected behavior.

**Pseudocode:**
```
FOR ALL deleteOperation WHERE isBugCondition(deleteOperation) DO
  result := performDeleteWithRealtimeSubscription(deleteOperation)
  ASSERT result.payload.old IS NOT NULL
  ASSERT result.payload.old.id IS NOT NULL
  ASSERT result.eventRemovedFromLocalState == TRUE
  ASSERT result.otherUsersSeeDeletion == TRUE
END FOR
```

**Test Cases**:
1. **Single Event Deletion**: Admin deletes one event → Verify all users see it disappear immediately
2. **Multiple Event Deletion**: Admin deletes multiple events in sequence → Verify all deletions propagate correctly
3. **Concurrent Deletion**: Multiple admins delete different events simultaneously → Verify all deletions propagate without conflicts
4. **Department-Targeted Event Deletion**: Admin deletes event targeted to specific departments → Verify only relevant users see the deletion
5. **Broadcast Event Deletion**: Admin deletes event broadcast to all departments → Verify all users see the deletion

### Preservation Checking

**Goal**: Verify that for all operations where the bug condition does NOT hold, the fixed database configuration produces the same result as the original configuration.

**Pseudocode:**
```
FOR ALL operation WHERE NOT isBugCondition(operation) DO
  ASSERT performOperation_original(operation) = performOperation_fixed(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-DELETE operations

**Test Plan**: Observe behavior on UNFIXED database first for INSERT, UPDATE, manual refresh, and periodic refresh operations, then write property-based tests capturing that behavior and verify it remains unchanged after applying the fix.

**Test Cases**:
1. **INSERT Preservation**: Create new events and verify they appear in real-time for all relevant users (should work identically before and after fix)
2. **UPDATE Preservation**: Edit existing events and verify changes appear in real-time for all relevant users (should work identically before and after fix)
3. **Manual Refresh Preservation**: Click refresh button and verify events reload correctly (should work identically before and after fix)
4. **Periodic Refresh Preservation**: Wait for 30-second timer and verify events sync in background (should work identically before and after fix)
5. **Department Filtering Preservation**: Verify events are filtered correctly by department targeting (should work identically before and after fix)
6. **Connection Status Preservation**: Verify connection indicator displays correct status (should work identically before and after fix)

### Unit Tests

- Test that REPLICA IDENTITY FULL is configured on events table
- Test that DELETE payload includes complete row data with all columns
- Test that `handleEventDeleted` callback receives valid event ID
- Test that deleted event is removed from local state
- Test edge cases (deleting non-existent event, deleting while offline, deleting with invalid permissions)

### Property-Based Tests

- Generate random event deletion scenarios and verify real-time propagation works correctly
- Generate random combinations of INSERT, UPDATE, DELETE operations and verify all propagate correctly
- Test that department filtering continues to work across many random event configurations
- Test that connection status remains accurate across many random network conditions

### Integration Tests

- Test full event deletion flow: admin deletes → other users see deletion → manual refresh shows correct state
- Test switching between contexts: create event → delete event → verify both operations propagate correctly
- Test that visual feedback occurs correctly (loading states, success toasts, error handling)
- Test offline/online scenarios: delete while offline → reconnect → verify state syncs correctly
