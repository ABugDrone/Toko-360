# Bugfix Requirements Document

## Introduction

When an admin user (Business Intelligence department) deletes an event from the Events page, the event remains visible on other users' Events pages across all departments. The deleted event does not disappear in real-time, requiring users to manually refresh or wait for the 30-second periodic refresh to see the updated events list. This breaks the expected real-time synchronization behavior that works correctly in the messaging system.

The bug affects all users viewing events, regardless of department, when an admin performs a delete operation. While INSERT and UPDATE operations work correctly with real-time synchronization, DELETE operations fail to propagate to other connected clients.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin user deletes an event from their Events page THEN the event remains visible on other users' Events pages until manual refresh or periodic refresh occurs

1.2 WHEN an admin user deletes an event THEN the real-time DELETE subscription handler is not triggered for other connected clients

1.3 WHEN the Supabase real-time DELETE event fires THEN the `handleEventDeleted` callback does not execute to remove the event from the local state

### Expected Behavior (Correct)

2.1 WHEN an admin user deletes an event THEN the event SHALL immediately disappear from ALL users' Events pages across all departments without requiring a page refresh

2.2 WHEN a DELETE operation occurs on the events table THEN the real-time subscription SHALL trigger the `handleEventDeleted` callback for all connected clients

2.3 WHEN the `handleEventDeleted` callback is triggered THEN the system SHALL remove the deleted event from the local events state using the event ID from the DELETE payload

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an admin user creates a new event THEN the system SHALL CONTINUE TO display the new event in real-time for all relevant users based on department targeting

3.2 WHEN an admin user updates an existing event THEN the system SHALL CONTINUE TO display the updated event in real-time for all relevant users

3.3 WHEN a user manually clicks the refresh button THEN the system SHALL CONTINUE TO reload events from the database and update the display

3.4 WHEN the 30-second periodic refresh timer fires THEN the system SHALL CONTINUE TO reload events from the database in the background

3.5 WHEN a user views events THEN the system SHALL CONTINUE TO filter and display only events targeted to their department or broadcast to all departments

3.6 WHEN the real-time connection status changes THEN the system SHALL CONTINUE TO display the appropriate connection indicator (online, reconnecting, offline)
