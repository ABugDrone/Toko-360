# SQL Migrations Checklist for Supabase

Run these SQL scripts in your Supabase SQL Editor **in this exact order**.

---

## ✅ Migration 1: Message Indexes (Performance)

**Purpose**: Optimize messaging queries for better performance

**File**: `supabase/migrations/add_message_indexes.sql`

```sql
-- Migration: Add indexes for message queries optimization
-- Requirements: 1.1, 2.1, 4.1
-- Purpose: Optimize conversation aggregation and unread count queries

-- Index for sender queries (used in conversation aggregation)
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC);

-- Index for recipient queries (used in conversation aggregation)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created 
ON messages(recipient_id, created_at DESC);

-- Index for unread message queries (used in unread count calculation)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read 
ON messages(recipient_id, read) 
WHERE read = false;

-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, recipient_id, created_at DESC);

-- Comment explaining the indexes
COMMENT ON INDEX idx_messages_sender_created IS 'Optimizes queries for messages sent by a user, sorted by creation time';
COMMENT ON INDEX idx_messages_recipient_created IS 'Optimizes queries for messages received by a user, sorted by creation time';
COMMENT ON INDEX idx_messages_recipient_read IS 'Optimizes queries for unread messages received by a user';
COMMENT ON INDEX idx_messages_conversation IS 'Optimizes queries for conversations between two users';
```

**Expected Result**: "Success. No rows returned"

---

## ✅ Migration 2: Test Messages (Demo Data)

**Purpose**: Add test conversation between Daniel and Abdulazeez

**File**: `supabase/migrations/add_test_message_daniel_abdulazeez.sql`

```sql
-- Add test message between Daniel Ishaku (BI Admin) and Abdulazeez Yunusa (IT Staff)
-- This demonstrates that the messaging system fixes are working

-- Insert message from Daniel to Abdulazeez (5 minutes ago)
INSERT INTO messages (sender_id, recipient_id, type, content, read, created_at)
SELECT 
  'D.ISHAKU',
  'A.YUNUSA',
  'text',
  'Hi Abdulazeez! The messaging system has been updated with new features. You should now see unread message indicators, recent contact badges, and improved real-time notifications. Let me know if everything is working smoothly on your end!',
  false,
  NOW() - INTERVAL '5 minutes'
WHERE EXISTS (SELECT 1 FROM users WHERE staff_id = 'D.ISHAKU')
  AND EXISTS (SELECT 1 FROM users WHERE staff_id = 'A.YUNUSA');

-- Insert response from Abdulazeez to Daniel (2 minutes ago)
INSERT INTO messages (sender_id, recipient_id, type, content, read, created_at)
SELECT 
  'A.YUNUSA',
  'D.ISHAKU',
  'text',
  'Thanks for the update, Daniel! I can confirm the new features are working great. The unread badges and recent indicators make it much easier to track conversations. Great work on the improvements!',
  false,
  NOW() - INTERVAL '2 minutes'
WHERE EXISTS (SELECT 1 FROM users WHERE staff_id = 'D.ISHAKU')
  AND EXISTS (SELECT 1 FROM users WHERE staff_id = 'A.YUNUSA');
```

**Expected Result**: "Success. No rows returned" (messages inserted silently)

---

## ✅ Migration 3: Fix Report Status (CRITICAL)

**Purpose**: Fix existing reports so they appear in admin approval page

**File**: `supabase/migrations/fix_report_status_ongoing_to_submitted.sql`

```sql
-- Fix existing reports with status 'ongoing' to 'submitted'
-- This fixes reports that were submitted but have the wrong status

UPDATE weekly_reports
SET status = 'submitted'
WHERE status = 'ongoing'
  AND submitted_at IS NOT NULL;

-- Verify the update
SELECT 
  COUNT(*) as updated_reports,
  status,
  approval_status
FROM weekly_reports
WHERE status = 'submitted'
GROUP BY status, approval_status;
```

**Expected Result**: Should show a table with count of updated reports

Example:
```
updated_reports | status    | approval_status
----------------|-----------|----------------
2               | submitted | pending
```

---

## 📋 Quick Copy-Paste Version

### Run 1: Message Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read ON messages(recipient_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);
```

### Run 2: Test Messages
```sql
INSERT INTO messages (sender_id, recipient_id, type, content, read, created_at)
SELECT 'D.ISHAKU', 'A.YUNUSA', 'text', 
'Hi Abdulazeez! The messaging system has been updated with new features. You should now see unread message indicators, recent contact badges, and improved real-time notifications. Let me know if everything is working smoothly on your end!',
false, NOW() - INTERVAL '5 minutes'
WHERE EXISTS (SELECT 1 FROM users WHERE staff_id = 'D.ISHAKU')
  AND EXISTS (SELECT 1 FROM users WHERE staff_id = 'A.YUNUSA');

INSERT INTO messages (sender_id, recipient_id, type, content, read, created_at)
SELECT 'A.YUNUSA', 'D.ISHAKU', 'text',
'Thanks for the update, Daniel! I can confirm the new features are working great. The unread badges and recent indicators make it much easier to track conversations. Great work on the improvements!',
false, NOW() - INTERVAL '2 minutes'
WHERE EXISTS (SELECT 1 FROM users WHERE staff_id = 'D.ISHAKU')
  AND EXISTS (SELECT 1 FROM users WHERE staff_id = 'A.YUNUSA');
```

### Run 3: Fix Report Status
```sql
UPDATE weekly_reports
SET status = 'submitted'
WHERE status = 'ongoing'
  AND submitted_at IS NOT NULL;

SELECT COUNT(*) as updated_reports, status, approval_status
FROM weekly_reports
WHERE status = 'submitted'
GROUP BY status, approval_status;
```

---

## ✅ Verification Checklist

After running all 3 migrations:

- [ ] Migration 1: Check indexes exist
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'messages';
  ```
  Should show: `idx_messages_sender_created`, `idx_messages_recipient_created`, `idx_messages_recipient_read`, `idx_messages_conversation`

- [ ] Migration 2: Check messages inserted
  ```sql
  SELECT sender_id, recipient_id, content FROM messages 
  WHERE sender_id IN ('D.ISHAKU', 'A.YUNUSA') 
  ORDER BY created_at DESC;
  ```
  Should show 2 messages

- [ ] Migration 3: Check reports fixed
  ```sql
  SELECT COUNT(*), status FROM weekly_reports GROUP BY status;
  ```
  Should show reports with status 'submitted' (not 'ongoing')

---

## 🎯 After Running All SQL

1. **Refresh browser** (Ctrl + Shift + R)
2. **Test on** http://localhost:3001
3. **Login as Daniel** (D.ISHAKU / 235711)
4. **Check**:
   - ✅ Messaging: See conversation with Abdulazeez
   - ✅ Reports: Admin sees pending reports
   - ✅ Text Editor: Readable in light/dark mode

---

## ⚠️ Important Notes

- Run migrations in order (1 → 2 → 3)
- Migration 3 is CRITICAL for reports to show
- If Migration 2 fails, check if users D.ISHAKU and A.YUNUSA exist
- All migrations are safe to run multiple times (idempotent)
