# Critical Fixes Needed - Action Required

## Issue Summary from Screenshots

### ✅ FIXED: Text Editor
- Dark text on light background is now working correctly
- No action needed

### ❌ NEEDS SQL: Report Approval  
- Shows "No pending reports for approval"
- **Root Cause**: Reports in database have `status = 'ongoing'` instead of `status = 'submitted'`
- **Action Required**: Run SQL migration below

### ❌ FIXED IN CODE: Messaging
- Shows "No conversations yet" even though messages were inserted
- **Root Cause**: Code was using `user?.id` (UUID) instead of `user?.staffId`
- **Fix Applied**: Changed to use `user?.staffId` in messaging page
- **Action Required**: Restart dev server to see fix

---

## SQL Migration to Run NOW

### Fix Report Status (Run this in Supabase SQL Editor)

```sql
-- Fix existing reports with status 'ongoing' to 'submitted'
UPDATE weekly_reports
SET status = 'submitted'
WHERE status = 'ongoing'
  AND submitted_at IS NOT NULL;

-- Verify the update worked
SELECT 
  COUNT(*) as total_submitted_reports,
  status,
  approval_status
FROM weekly_reports
WHERE status = 'submitted'
GROUP BY status, approval_status;
```

**Expected Result**: Should show count of reports that were updated

---

## Actions Checklist

- [x] Run message test data SQL (DONE - Success)
- [x] Run message indexes SQL (Should run for performance)
- [ ] **Run report status fix SQL** (CRITICAL - Reports won't show without this)
- [ ] Restart dev server (To apply messaging fix)
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Test all three features

---

## After Running SQL and Restarting

### Test Report Approval:
1. Login as admin (Daniel: D.ISHAKU / 235711)
2. Go to Admin → Approvals → Reports
3. Should now see the pending report(s)

### Test Messaging:
1. Stay logged in as Daniel
2. Go to Messaging
3. Should see conversation with Abdulazeez
4. Should see unread badge and recent indicator

### Test Text Editor:
1. Go to Reports
2. Toggle light/dark theme
3. Text should be readable in both modes

---

## Why These Issues Happened

1. **Reports**: Old code was saving reports with wrong status
2. **Messaging**: Hook was using UUID instead of staff_id  
3. **Text Editor**: Was using dark-mode-only prose class

All code fixes are complete. Just need to run the SQL and restart!
