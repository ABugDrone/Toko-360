# Events CRUD Fix Bugfix Design

## Overview

The events CRUD functionality is completely broken due to a critical flaw in the `updateEvent` function in `lib/supabase-service.ts`. The function uses conditional checks (`if (updates.field)`) that only update fields when they are truthy, which prevents proper handling of empty strings, null values, and falsy data. This causes three major issues:

1. Event creation appears to freeze because `updatedAt` is never set (addEvent doesn't set it, and updateEvent's conditional check prevents it from being added)
2. Event editing fails because fields with falsy values are ignored, preventing users from clearing fields or updating to empty strings
3. Event deletion may fail due to related data integrity issues

The fix requires replacing conditional field checks with explicit undefined checks, ensuring all provided fields are updated regardless of their truthiness.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when updateEvent is called with any field that has a falsy value (empty string, null, 0, false) or when a newly created event needs its updatedAt field set
- **Property (P)**: The desired behavior - all fields in the updates object should be written to the database regardless of their truthiness, and updatedAt should always be set
- **Preservation**: Existing event filtering by department, read-only access for non-BI users, and event display functionality must remain unchanged
- **updateEvent**: The function in `lib/supabase-service.ts` (lines 1127-1157) that updates existing events in the database
- **addEvent**: The function in `lib/supabase-service.ts` (lines 1097-1125) that creates new events in the database
- **targetDepartments**: The property that determines event visibility - null means broadcast to all departments, array means specific departments only

## Bug Details

### Fault Condition

The bug manifests when the `updateEvent` function is called with any updates object containing fields with falsy values (empty strings, null, 0, false). The function uses conditional checks like `if (updates.title)` which evaluate to false for falsy values, causing those fields to be excluded from the database update. Additionally, newly created events lack an `updatedAt` timestamp because `addEvent` doesn't set it and the conditional check in `updateEvent` would prevent it from being added later.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { eventId: string, updates: Partial<Event> }
  OUTPUT: boolean
  
  RETURN (updates.title === "" OR updates.title === null OR updates.title === 0 OR updates.title === false)
         OR (updates.description === "" OR updates.description === null)
         OR (updates.location === "" OR updates.location === null)
         OR (updates.eventTime === "" OR updates.eventTime === null)
         OR (updates.color === "" OR updates.color === null)
         OR (updates.category === "" OR updates.category === null)
         OR (updates.targetDepartments === null)
         OR (isNewlyCreatedEvent(eventId) AND updates.updatedAt === undefined)
END FUNCTION
```

### Examples

- **Create Event**: User submits form with title="Team Meeting", description="", location="Room 101" → System freezes because updatedAt is never set, causing optimistic UI to close but backend operation to fail
- **Edit Event - Clear Description**: User edits event and clears description field (empty string) → System ignores the empty string and description retains old value instead of being cleared
- **Edit Event - Set Location to Empty**: User removes location from event → System ignores the empty string and location remains unchanged
- **Edit Event - Set targetDepartments to null**: User changes event from department-specific to broadcast (null) → System may ignore the null value depending on the conditional check
- **Edge Case - Set color to null**: User removes custom color from event → The conditional check `if (updates.color)` evaluates to false for null, preventing the color from being cleared

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Event filtering by department must continue to work - events with targetDepartments=null are broadcast to all, events with specific departments are filtered
- Read-only access for non-Business Intelligence users must remain unchanged - create/edit/delete buttons stay hidden
- Event loading on page mount must continue to use `getEventsByDepartment` with proper department filtering
- Empty events list must continue to display "No upcoming events" message
- Event display UI and formatting must remain unchanged

**Scope:**
All inputs that do NOT involve calling `updateEvent` with falsy field values should be completely unaffected by this fix. This includes:
- Event viewing and filtering by department
- Event list display and rendering
- Permission checks for create/edit/delete buttons
- Event creation flow (addEvent) - though it will benefit from the fix
- Event deletion flow (deleteEvent)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Conditional Truthy Checks**: The `updateEvent` function uses `if (updates.field)` checks which evaluate to false for falsy values like empty strings, null, 0, and false. This prevents legitimate updates where users want to clear fields or set them to falsy values.

2. **Missing updatedAt in addEvent**: The `addEvent` function doesn't set an `updated_at` field when creating events, relying on the database default or subsequent updates. However, if the first update after creation contains falsy values, the conditional checks prevent proper updates.

3. **Incorrect Undefined Handling**: The code should check `if (updates.field !== undefined)` instead of `if (updates.field)` to distinguish between "field not provided in updates" vs "field provided with falsy value". Only truly undefined fields should be excluded from the update.

4. **targetDepartments Special Case**: The code has `if (updates.targetDepartments !== undefined)` which is correct, but all other fields use the incorrect truthy check, creating inconsistency.

## Correctness Properties

Property 1: Fault Condition - Update All Provided Fields

_For any_ updateEvent call where the updates object contains fields with falsy values (empty strings, null, 0, false), the fixed updateEvent function SHALL include those fields in the database update operation, allowing users to clear fields or set them to falsy values as intended.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Update Operations

_For any_ operation that does NOT involve calling updateEvent (such as viewing events, filtering by department, checking permissions, or displaying the events list), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing event viewing and filtering functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

The root cause analysis is confirmed by examining the code. The fix is straightforward:

**File**: `lib/supabase-service.ts`

**Function**: `updateEvent` (lines 1127-1157)

**Specific Changes**:
1. **Replace Truthy Checks with Undefined Checks**: Change all `if (updates.field)` checks to `if (updates.field !== undefined)` to allow falsy values to be updated
   - `if (updates.title !== undefined) dbUpdates.title = updates.title;`
   - `if (updates.description !== undefined) dbUpdates.description = updates.description;`
   - `if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;`
   - `if (updates.eventTime !== undefined) dbUpdates.event_time = updates.eventTime;`
   - `if (updates.location !== undefined) dbUpdates.location = updates.location;`
   - `if (updates.category !== undefined) dbUpdates.category = updates.category;`
   - `if (updates.color !== undefined) dbUpdates.color = updates.color;`

2. **Keep targetDepartments Check**: The existing `if (updates.targetDepartments !== undefined)` is already correct and should remain unchanged

3. **Ensure updatedAt is Always Set**: The `updated_at: new Date().toISOString()` assignment is already unconditional and correct - it should remain as-is

4. **Optional - Add updatedAt to addEvent**: Consider adding `updated_at: new Date().toISOString()` to the `addEvent` function's dbEvent object to ensure new events have this field set from creation (though the database may handle this with a default value)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the conditional truthy checks prevent falsy values from being updated.

**Test Plan**: Write tests that call `updateEvent` with various falsy values and assert that the database is updated correctly. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Clear Description Test**: Call updateEvent with `{ description: "" }` and verify the description is cleared in the database (will fail on unfixed code - description will retain old value)
2. **Clear Location Test**: Call updateEvent with `{ location: "" }` and verify the location is cleared (will fail on unfixed code)
3. **Set targetDepartments to null**: Call updateEvent with `{ targetDepartments: null }` and verify it's set to null for broadcast (should pass on unfixed code due to existing !== undefined check)
4. **Clear Color Test**: Call updateEvent with `{ color: null }` and verify the color is cleared (will fail on unfixed code)
5. **Multiple Falsy Fields**: Call updateEvent with multiple falsy fields and verify all are updated (will fail on unfixed code)

**Expected Counterexamples**:
- Fields with empty strings, null, or other falsy values are not updated in the database
- The database retains old values instead of accepting the new falsy values
- Possible causes: conditional truthy checks (`if (updates.field)`) evaluate to false for falsy values

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := updateEvent_fixed(input.eventId, input.updates)
  ASSERT expectedBehavior(result)
  // expectedBehavior: all fields in updates are written to database regardless of truthiness
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT updateEvent_original(input.eventId, input.updates) = updateEvent_fixed(input.eventId, input.updates)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for truthy field updates, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Truthy Field Updates**: Observe that updating fields with truthy values (non-empty strings, valid dates, etc.) works correctly on unfixed code, then write test to verify this continues after fix
2. **Event Viewing Preservation**: Observe that viewing and filtering events by department works correctly on unfixed code, then write test to verify this continues after fix
3. **Permission Checks Preservation**: Observe that permission checks for create/edit/delete buttons work correctly on unfixed code, then write test to verify this continues after fix
4. **Event Creation Preservation**: Observe that creating events with all truthy values works correctly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test updateEvent with empty string for each field (title, description, location, eventTime)
- Test updateEvent with null for optional fields (color, targetDepartments)
- Test updateEvent with multiple falsy fields simultaneously
- Test updateEvent with mix of truthy and falsy fields
- Test that updatedAt is always set regardless of other field values
- Test edge cases (undefined vs null vs empty string)

### Property-Based Tests

- Generate random event updates with various combinations of truthy and falsy values, verify all provided fields are updated
- Generate random event configurations and verify preservation of event filtering by department
- Test that all non-updateEvent operations continue to work across many scenarios (viewing, filtering, permission checks)

### Integration Tests

- Test full event creation flow: create event → verify it appears in list → verify updatedAt is set
- Test full event editing flow: edit event with falsy values → verify changes are saved → verify UI updates
- Test full event deletion flow: delete event → verify it's removed from list
- Test event filtering: create events with different targetDepartments → verify correct users see correct events
- Test permission checks: verify non-BI users cannot see create/edit/delete buttons
