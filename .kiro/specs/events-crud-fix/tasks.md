# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Update All Provided Fields
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - updateEvent calls with falsy field values (empty strings, null, 0, false)
  - Test that updateEvent with falsy values (empty string for description, null for color, empty string for location) writes those values to the database
  - The test assertions should verify all fields in the updates object are written to the database regardless of their truthiness
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "updateEvent with {description: ''} retains old description instead of clearing it")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Update Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (truthy field updates, event viewing, filtering)
  - Observe: updateEvent with truthy values (non-empty strings, valid dates) works correctly on unfixed code
  - Observe: Event filtering by department works correctly on unfixed code
  - Observe: Permission checks for create/edit/delete buttons work correctly on unfixed code
  - Write property-based tests capturing observed behavior patterns: for all operations NOT involving updateEvent with falsy values, behavior remains unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for events CRUD functionality

  - [x] 3.1 Implement the fix in updateEvent function
    - Replace truthy checks with undefined checks for all fields: `if (updates.field !== undefined)` instead of `if (updates.field)`
    - Update title check: `if (updates.title !== undefined) dbUpdates.title = updates.title;`
    - Update description check: `if (updates.description !== undefined) dbUpdates.description = updates.description;`
    - Update eventDate check: `if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;`
    - Update eventTime check: `if (updates.eventTime !== undefined) dbUpdates.event_time = updates.eventTime;`
    - Update location check: `if (updates.location !== undefined) dbUpdates.location = updates.location;`
    - Update category check: `if (updates.category !== undefined) dbUpdates.category = updates.category;`
    - Update color check: `if (updates.color !== undefined) dbUpdates.color = updates.color;`
    - Keep targetDepartments check unchanged (already correct): `if (updates.targetDepartments !== undefined)`
    - Ensure updatedAt is always set (already correct): `updated_at: new Date().toISOString()`
    - _Bug_Condition: isBugCondition(input) where updates contain falsy values (empty strings, null, 0, false) or newly created events need updatedAt set_
    - _Expected_Behavior: All fields in updates object are written to database regardless of truthiness, updatedAt always set_
    - _Preservation: Event filtering by department, read-only access for non-BI users, event display functionality remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Update All Provided Fields
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Update Operations
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
