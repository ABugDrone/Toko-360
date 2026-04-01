# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Real-Time Event Deletion Payload
  - **CRITICAL**: This test MUST FAIL on unfixed database - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing case - DELETE operation on events table without REPLICA IDENTITY FULL
  - Test that when an admin deletes an event, the real-time DELETE handler receives complete row data in `payload.old` including the event ID
  - Test implementation details from Fault Condition: `input.operation == 'DELETE' AND input.table == 'events' AND input.replicaIdentity != 'FULL'`
  - The test assertions should verify that `payload.old` is defined and contains the event ID
  - Run test on UNFIXED database (without REPLICA IDENTITY FULL)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: `payload.old` is undefined or missing event ID
  - Verify replica identity setting: Query `SELECT relreplident FROM pg_class WHERE relname = 'events';` should return 'd' (DEFAULT)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [-] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-DELETE Real-Time Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED database for non-DELETE operations
  - Observe: INSERT operations add new events to all relevant users' displays based on department targeting
  - Observe: UPDATE operations modify existing events in all relevant users' displays
  - Observe: Manual refresh button reloads events from database
  - Observe: 30-second periodic refresh syncs events in background
  - Observe: Department filtering shows only events targeted to user's department or broadcast to all
  - Observe: Connection status indicator displays online/reconnecting/offline states
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test INSERT preservation: Create new events and verify they appear in real-time for all relevant users
  - Test UPDATE preservation: Edit existing events and verify changes appear in real-time for all relevant users
  - Test manual refresh preservation: Click refresh button and verify events reload correctly
  - Test periodic refresh preservation: Wait for 30-second timer and verify events sync in background
  - Test department filtering preservation: Verify events are filtered correctly by department targeting
  - Test connection status preservation: Verify connection indicator displays correct status
  - Run tests on UNFIXED database
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed database
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for events real-time delete propagation

  - [x] 3.1 Add REPLICA IDENTITY FULL to events table
    - Open `supabase/schema.sql` file
    - Locate the events table creation statement
    - Add the following SQL statement after the `CREATE TABLE events` statement and before the index creation section:
    ```sql
    -- Enable full row replication for real-time DELETE events
    ALTER TABLE events REPLICA IDENTITY FULL;
    ```
    - This configuration tells PostgreSQL to include all columns of the deleted row in the replication stream
    - _Bug_Condition: isBugCondition(input) where input.operation == 'DELETE' AND input.table == 'events' AND input.replicaIdentity != 'FULL'_
    - _Expected_Behavior: DELETE operations broadcast complete row data in payload.old, enabling handleEventDeleted callback to extract event ID and remove from local state_
    - _Preservation: INSERT and UPDATE real-time operations, manual refresh, periodic refresh, department filtering, and connection status remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Apply migration to existing database
    - Open Supabase SQL Editor for the production database
    - Run the ALTER TABLE statement: `ALTER TABLE events REPLICA IDENTITY FULL;`
    - This is a metadata-only change and does not require table rebuilding or data migration
    - The change takes effect immediately for all future DELETE operations
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify the configuration is applied
    - Query the replica identity setting: `SELECT relreplident FROM pg_class WHERE relname = 'events';`
    - Expected result: `f` (which represents FULL)
    - If result is still `d` (DEFAULT), the migration did not apply correctly
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Real-Time Event Deletion Payload
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify that `payload.old` is now defined and contains the complete event data including event ID
    - Verify that deleted events are removed from local state for all subscribed users
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-DELETE Real-Time Operations
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify INSERT operations still add new events to all relevant users' displays
    - Verify UPDATE operations still modify existing events in all relevant users' displays
    - Verify manual refresh button still reloads events correctly
    - Verify 30-second periodic refresh still syncs events in background
    - Verify department filtering still shows only relevant events
    - Verify connection status indicator still displays correct states
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (exploration test from task 1 and preservation tests from task 2)
  - Verify bug condition exploration test passes (confirms DELETE events now propagate correctly)
  - Verify all preservation tests pass (confirms no regressions in INSERT, UPDATE, refresh, filtering, and connection status)
  - If any test fails, investigate and resolve before proceeding
  - Ask the user if questions arise
