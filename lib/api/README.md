# Clean API Layer - Plain English Functions

This directory contains a clean, readable API layer for all database operations in the Toko 360 Staff Portal.

## Philosophy

All function names use **plain English** to make the code self-documenting and easy to understand. No more cryptic abbreviations or technical jargon!

## Structure

```
lib/api/
├── index.ts          # Main export file
├── users.ts          # User management
├── attendance.ts     # Attendance tracking
├── reports.ts        # Weekly reports
├── messages.ts       # Messaging system
├── departments.ts    # Department management
└── events.ts         # Event management
```

## Usage Examples

### Users

```typescript
import { 
  getAllUsers,
  findUserByStaffId,
  createNewUser,
  updateUserInfo,
  removeUser,
  updateUserAvatar
} from '@/lib/api';

// Get all users
const users = await getAllUsers();

// Find a specific user
const user = await findUserByStaffId('TA-2024-001');

// Create a new user
const newUser = await createNewUser({
  staffId: 'TA-2024-100',
  name: 'John Doe',
  email: 'john@toko.edu',
  department: 'IT',
  role: 'staff'
});

// Update user information
await updateUserInfo(userId, { name: 'Jane Doe' });

// Remove a user
await removeUser(userId);
```

### Attendance

```typescript
import {
  getStaffAttendanceHistory,
  getPendingAttendanceApprovals,
  recordCheckIn,
  approveAttendance,
  rejectAttendance
} from '@/lib/api';

// Get attendance history
const records = await getStaffAttendanceHistory('TA-2024-001');

// Get pending approvals
const pending = await getPendingAttendanceApprovals();

// Record a check-in
await recordCheckIn({
  staffId: 'TA-2024-001',
  date: '2024-01-15',
  checkInTime: '08:45',
  status: 'on_time'
});

// Approve attendance
await approveAttendance(recordId, 'admin-001');

// Reject with feedback
await rejectAttendance(recordId, 'admin-001', 'Please provide more details');
```

### Reports

```typescript
import {
  getStaffReports,
  getPendingReportApprovals,
  submitWeeklyReport,
  approveWeeklyReport,
  rejectWeeklyReport
} from '@/lib/api';

// Get staff reports
const reports = await getStaffReports('TA-2024-001');

// Get pending approvals
const pending = await getPendingReportApprovals();

// Submit a new report
await submitWeeklyReport({
  staffId: 'TA-2024-001',
  week: 'JAN 15 - JAN 21, 2024',
  summary: 'Completed project tasks',
  challenges: 'Some technical issues',
  goals: 'Improve performance'
});

// Approve a report
await approveWeeklyReport(reportId, 'admin-001');

// Reject with feedback
await rejectWeeklyReport(reportId, 'admin-001', 'Please add more details');
```

### Messages

```typescript
import {
  getConversationBetween,
  getUnreadMessages,
  sendMessageTo,
  markMessageAsRead,
  sendFileAttachment
} from '@/lib/api';

// Get conversation
const messages = await getConversationBetween('user1', 'user2');

// Get unread messages
const unread = await getUnreadMessages('user1');

// Send a message
await sendMessageTo({
  senderId: 'user1',
  recipientId: 'user2',
  type: 'text',
  content: 'Hello!',
  read: false
});

// Mark as read
await markMessageAsRead(messageId);

// Send file
await sendFileAttachment('user1', 'user2', 'document.pdf', 'https://...');
```

### Departments

```typescript
import {
  getAllDepartments,
  getActiveDepartments,
  createNewDepartment,
  updateDepartmentInfo,
  changeDepartmentHead,
  deactivateDepartment
} from '@/lib/api';

// Get all departments
const departments = await getAllDepartments();

// Get only active ones
const active = await getActiveDepartments();

// Create new department
await createNewDepartment({
  name: 'Marketing',
  head: 'Jane Smith',
  status: 'active'
});

// Change department head
await changeDepartmentHead(deptId, 'John Doe');

// Deactivate department
await deactivateDepartment(deptId);
```

### Events

```typescript
import {
  getUpcomingEvents,
  getDepartmentEvents,
  createNewEvent,
  updateExistingEvent,
  cancelEvent,
  broadcastEventToAll
} from '@/lib/api';

// Get upcoming events
const events = await getUpcomingEvents();

// Get department-specific events
const deptEvents = await getDepartmentEvents('IT');

// Create new event
await createNewEvent({
  title: 'Team Meeting',
  description: 'Monthly sync',
  eventDate: '2024-01-20',
  eventTime: '14:00',
  location: 'Room 602',
  category: 'meeting',
  createdBy: 'admin-001'
});

// Broadcast to all
await broadcastEventToAll(eventId);

// Cancel event
await cancelEvent(eventId);
```

## Benefits

1. **Self-Documenting**: Function names clearly describe what they do
2. **Easy to Remember**: No need to memorize cryptic abbreviations
3. **Consistent**: All functions follow the same naming pattern
4. **Type-Safe**: Full TypeScript support with proper types
5. **Centralized**: All database operations in one place
6. **Maintainable**: Easy to update and extend

## Migration Guide

### Old Way (Direct Supabase)
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('staff_id', staffId)
  .single();
```

### New Way (Plain English API)
```typescript
const user = await findUserByStaffId(staffId);
```

Much cleaner and easier to understand!

## Function Naming Conventions

- **Get/Find**: Retrieve data
  - `getAllUsers()` - Get multiple items
  - `findUserById()` - Find a specific item
  
- **Create/Submit**: Add new data
  - `createNewUser()` - Create a new record
  - `submitWeeklyReport()` - Submit a report
  
- **Update/Change**: Modify existing data
  - `updateUserInfo()` - Update user details
  - `changeDepartmentHead()` - Change specific field
  
- **Remove/Delete/Cancel**: Delete data
  - `removeUser()` - Delete a user
  - `cancelEvent()` - Cancel an event
  
- **Approve/Reject**: Approval actions
  - `approveAttendance()` - Approve a record
  - `rejectWeeklyReport()` - Reject with feedback
  
- **Mark/Record**: Status changes
  - `markMessageAsRead()` - Change status
  - `recordCheckIn()` - Record an action

## Error Handling

All functions use the existing `handleDatabaseOperation` wrapper, so error handling remains consistent with the rest of the application.

```typescript
try {
  const user = await findUserByStaffId('TA-2024-001');
  console.log(user);
} catch (error) {
  // Error is already mapped to DatabaseError
  console.error(error.message);
}
```

## Contributing

When adding new functions:

1. Use plain English names
2. Follow the naming conventions above
3. Add JSDoc comments
4. Group related functions together
5. Update this README with examples
