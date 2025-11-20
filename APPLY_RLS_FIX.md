# How to Apply the RLS Policy Fix

## Problem
Call History shows "No calls found" because database RLS policies are using the wrong column to match authenticated users.

## Solution
Apply the migration: `supabase/migrations/13_fix_voter_calls_rls_policies.sql`

---

## Method 1: Supabase Dashboard (RECOMMENDED)

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: "Pulse of People"

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open file: `supabase/migrations/13_fix_voter_calls_rls_policies.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

4. **Paste and Execute**
   - Paste into SQL Editor
   - Click "Run" button (or Ctrl+Enter)

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - This is expected for DDL operations

6. **Test in App**
   - Refresh your browser
   - Go to Call History tab
   - Calls should now appear!

---

## Method 2: Supabase CLI (if installed)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push
```

---

## Method 3: psql (if PostgreSQL client installed)

```bash
# Install PostgreSQL client (macOS)
brew install postgresql

# Run migration
npm run db:migrate
```

---

## What This Fix Does

Updates Row Level Security (RLS) policies for 4 tables:
- ✅ `voter_calls` - Call records and transcripts
- ✅ `call_sentiment_analysis` - Sentiment analysis results
- ✅ `call_campaigns` - Campaign management
- ✅ `call_csv_uploads` - CSV upload tracking

**Change:** Updates policies from `users.id = auth.uid()` to `users.auth_user_id = auth.uid()`

---

## Verification Steps

After applying the migration:

1. **Login to your app**
2. **Go to Voter Sentiment Analysis page**
3. **Click "Call History" tab**
4. **Verify:**
   - If calls exist, they should now display
   - Create a test call to verify INSERT works
   - Check sentiment analysis appears

---

## Need Help?

If you encounter errors:
1. Check Supabase Dashboard → Database → Logs
2. Verify `users` table has `auth_user_id` column
3. Ensure you have database admin permissions

---

**Created:** 2025-11-20
**Migration File:** `supabase/migrations/13_fix_voter_calls_rls_policies.sql`
