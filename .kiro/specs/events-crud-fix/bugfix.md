# Bugfix Requirements Document

## Introduction

The events functionality is completely broken with multiple critical issues affecting all CRUD operations. Users from the Business Intelligence department cannot create new events (experiencing freeze effect during creation), cannot edit existing events, and cannot delete existing events. This bug prevents any event management functionality from working properly.

The root cause is in the `updateEvent` function in `lib/supabase-service.ts` (lines 1127-1157), which uses conditional checks that only update fields if they are truthy. This causes several problems:
1. Empty strings, null values, and other falsy values are ignored during updates
2. The `updatedAt` field is not properly set during creation (since `addEvent` doesn't set it)
3. Fields cannot be cleared or set to empty values during editing

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a Business Intelligence user submits the create event form with valid data THEN the system appears to freeze (showing "SAVING..." indefinitely) because the optimistic UI closes the form but the backend operation fails silently

1.2 WHEN a Business Intelligence user attempts to edit an existing event and changes any field to an empty string or falsy value THEN the system ignores those changes and the field retains its old value

1.3 WHEN a Business Intelligence user attempts to edit an existing event and submits the form THEN the system fails to update the event because the conditional field checks prevent proper updates

1.4 WHEN a Business Intelligence user attempts to delete an event THEN the system may fail to delete the event due to related data integrity issues or the delete operation not being properly executed

### Expected Behavior (Correct)

2.1 WHEN a Business Intelligence user submits the create event form with valid data THEN the system SHALL successfully create the event, show a success toast, close the form, and refresh the events list

2.2 WHEN a Business Intelligence user attempts to edit an existing event and changes any field (including to empty strings where allowed) THEN the system SHALL update all changed fields to their new values

2.3 WHEN a Business Intelligence user attempts to edit an existing event and submits the form THEN the system SHALL successfully update the event with all form data, show a success toast, close the form, and refresh the events list

2.4 WHEN a Business Intelligence user attempts to delete an event and confirms the deletion THEN the system SHALL successfully delete the event, show a success toast, and remove it from the events list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user from any department views the events page THEN the system SHALL CONTINUE TO display all events that are either broadcast to all departments or specifically targeted to their department

3.2 WHEN a user from a non-Business Intelligence department views the events page THEN the system SHALL CONTINUE TO hide the create, edit, and delete buttons (read-only access)

3.3 WHEN events are loaded on page mount THEN the system SHALL CONTINUE TO fetch events filtered by the user's department using `getEventsByDepartment`

3.4 WHEN the events list is empty THEN the system SHALL CONTINUE TO display the "No upcoming events" message with appropriate UI

3.5 WHEN an event has `targetDepartments` set to null THEN the system SHALL CONTINUE TO broadcast it to all departments

3.6 WHEN an event has `targetDepartments` set to a specific array of department names THEN the system SHALL CONTINUE TO show it only to users in those departments
