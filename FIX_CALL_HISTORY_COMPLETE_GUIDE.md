# Complete Guide: Fix "No calls found" in Call History

## Problem Summary
Call History shows "No calls found" because:
1. Seed users don't have `auth_user_id` populated
2. RLS policies can't match users without this field
3. Database migrations haven't been applied yet

---

## Complete Solution (3 Steps)

### STEP 1: Apply Database Migrations

#### Option A: Supabase Dashboard (RECOMMENDED - 2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your "Pulse of People" project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query" button

3. **Copy and Paste This SQL**

   Copy the ENTIRE content below (migrations 13 + 14 combined):

   ```sql
-- ============================================================================
-- MIGRATION 13: Fix voter_calls RLS policies to use auth_user_id
-- ============================================================================

-- DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Users can view calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can create calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can update calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can delete calls in their organization" ON voter_calls;

DROP POLICY IF EXISTS "Users can view campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their organization" ON call_campaigns;

DROP POLICY IF EXISTS "Users can view sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can create sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can update sentiment in their organization" ON call_sentiment_analysis;

DROP POLICY IF EXISTS "Users can view uploads in their organization" ON call_csv_uploads;
DROP POLICY IF EXISTS "Users can create uploads in their organization" ON call_csv_uploads;

-- RECREATE POLICIES WITH CORRECT auth_user_id CHECK

-- voter_calls TABLE POLICIES
CREATE POLICY "Users can view calls in their organization"
    ON voter_calls FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create calls in their organization"
    ON voter_calls FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update calls in their organization"
    ON voter_calls FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete calls in their organization"
    ON voter_calls FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- call_campaigns TABLE POLICIES
CREATE POLICY "Users can view campaigns in their organization"
    ON call_campaigns FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create campaigns in their organization"
    ON call_campaigns FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update campaigns in their organization"
    ON call_campaigns FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- call_sentiment_analysis TABLE POLICIES
CREATE POLICY "Users can view sentiment in their organization"
    ON call_sentiment_analysis FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create sentiment in their organization"
    ON call_sentiment_analysis FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update sentiment in their organization"
    ON call_sentiment_analysis FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- call_csv_uploads TABLE POLICIES
CREATE POLICY "Users can view uploads in their organization"
    ON call_csv_uploads FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create uploads in their organization"
    ON call_csv_uploads FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- ============================================================================
-- MIGRATION 14: Backfill auth_user_id for existing users
-- ============================================================================

-- Update all users where auth_user_id is NULL
UPDATE users
SET auth_user_id = id
WHERE auth_user_id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify users have auth_user_id
SELECT
    COUNT(*) as total_users,
    COUNT(auth_user_id) as users_with_auth_id,
    COUNT(*) - COUNT(auth_user_id) as users_missing_auth_id
FROM users;

-- Should show: users_missing_auth_id = 0
   ```

4. **Execute the SQL**
   - Click "Run" button (or press Cmd+Enter / Ctrl+Enter)
   - Wait for execution to complete
   - You should see "Success. No rows returned" (this is normal for DDL operations)

5. **Verify Results**
   - The last query in the SQL shows verification results
   - Check that `users_missing_auth_id = 0`

---

### STEP 2: Re-seed Test Users (IMPORTANT!)

Now that we fixed the seed script, re-run it to update existing users:

```bash
npm run db:seed-users
```

**Expected Output:**
```
🚀 Starting test users seed script...
✅ Successfully connected to Supabase!

📝 Creating user: testadmin@tvk.com
   ⚠️  User already exists: testadmin@tvk.com
   ✓ Found existing user ID: xxx-xxx-xxx
   ✓ Profile updated successfully

... (repeats for all users)

✅ Seed script completed!
```

**What this does:**
- Updates ALL existing test users to have `auth_user_id` populated
- Ensures future users will have this field set automatically

---

### STEP 3: Test the Fix

1. **Refresh Your Browser**
   - Go back to: http://localhost:5173/voter-sentiment-analysis
   - Click on "Call History" tab
   - Click the "REFRESH" button

2. **Expected Results:**

   **If calls exist in database:**
   - ✅ Calls should now appear in the table
   - ✅ You'll see phone numbers, voter names, status, duration, sentiment, date
   - ✅ Click on a call to view transcript and analysis

   **If no calls exist yet:**
   - Still shows "No calls found" (which is correct - no data)
   - To create test data:
     1. Click "Single Call Test" tab
     2. Enter a phone number
     3. Click "Initiate Call"
     4. Wait for call to complete
     5. Return to "Call History" tab
     6. Your call should now appear!

---

## Troubleshooting

### Issue: Migration fails with "policy already exists"
**Solution:** The migration includes `DROP POLICY IF EXISTS` - safe to re-run

### Issue: Still shows "No calls found" after fix
**Check:**
1. Did you run `npm run db:seed-users` after applying migrations?
2. Do you have any actual call data in the database?
3. Are you logged in with a test user?
4. Check browser console for errors

**Verify data exists:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM voter_calls;
```

### Issue: RLS errors in console
**Check:**
1. Verify migrations were applied successfully
2. Verify users have `auth_user_id` populated:
```sql
SELECT id, email, auth_user_id FROM users LIMIT 10;
```

---

## What Changed

### Files Modified:
1. ✅ `scripts/seed-test-users.js` - Now sets `auth_user_id` for all users
2. ✅ `supabase/migrations/13_fix_voter_calls_rls_policies.sql` - Fixed RLS policies
3. ✅ `supabase/migrations/14_backfill_auth_user_id.sql` - Backfills existing users

### Database Changes:
1. ✅ All RLS policies now use `auth_user_id = auth.uid()` instead of `id = auth.uid()`
2. ✅ Existing users updated to have `auth_user_id` populated
3. ✅ Future users will automatically have `auth_user_id` set

---

## Testing Checklist

After completing all steps:

- [ ] Applied migrations in Supabase Dashboard
- [ ] Ran `npm run db:seed-users`
- [ ] Logged into app with test user (e.g., admin1@tvk.com / Admin@2024)
- [ ] Navigated to Voter Sentiment Analysis page
- [ ] Clicked Call History tab
- [ ] Verified calls appear (if data exists) OR
- [ ] Made a test call via Single Call Test
- [ ] Verified test call appears in Call History
- [ ] Clicked on a call to view transcript and sentiment analysis

---

## Summary

The fix involves 3 key changes:

1. **Database Schema**: Update RLS policies to check `auth_user_id` correctly
2. **Data Backfill**: Update existing users to have `auth_user_id` populated
3. **Seed Script**: Ensure future users always have `auth_user_id` set

**Total Time**: ~5 minutes
**Difficulty**: Easy (copy-paste SQL and run one command)
**Impact**: Call History will work correctly for all users

---

**Questions or Issues?**
Check the browser console for detailed error messages, or verify migrations in Supabase Dashboard → Database → Policies.
