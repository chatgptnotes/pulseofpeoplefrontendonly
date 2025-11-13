# 🔧 Quick Fix: Run This in Supabase Dashboard

## ⚡ FAST SOLUTION (2 minutes)

### Step 1: Go to Supabase SQL Editor

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/eepwbydlfecosaqdysho/sql/new)
2. You'll see the SQL Editor

### Step 2: Copy and Paste This SQL

**This SQL is safe to run multiple times** - it checks before adding columns.

```sql
-- Quick fix: Ensure all voter columns exist
ALTER TABLE voters ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS voter_id VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(200);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS booth_number VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS caste VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS education VARCHAR(50);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE voters ADD COLUMN IF NOT EXISTS party_affiliation VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE voters ADD COLUMN IF NOT EXISTS sentiment VARCHAR(30) DEFAULT 'neutral';
ALTER TABLE voters ADD COLUMN IF NOT EXISTS influence_level VARCHAR(20) DEFAULT 'low';
ALTER TABLE voters ADD COLUMN IF NOT EXISTS voting_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_opinion_leader BOOLEAN DEFAULT false;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS contact_frequency INTEGER DEFAULT 0;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS positive_interactions INTEGER DEFAULT 0;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS negative_interactions INTEGER DEFAULT 0;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE voters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE voters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_voters_booth_number ON voters(booth_number);
```

### Step 3: Click "Run" (or press Ctrl+Enter)

You should see: **"Success. No rows returned"**

### Step 4: Test the Form!

1. Go back to your application
2. Refresh the page (F5)
3. Try adding a voter again
4. ✅ It should work now!

---

## 🔍 What This Does

- Adds all missing columns to the `voters` table
- Sets proper defaults for fields
- Creates indexes for better performance
- **Safe to run multiple times** (won't duplicate columns)

---

## ⚠️ If It Still Doesn't Work

1. **Clear your browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Select "Cached images and files"
   - Click "Clear data"

2. **Refresh Supabase schema:**
   - In Supabase Dashboard, go to **Table Editor**
   - Click on "voters" table
   - This forces Supabase to reload the schema

3. **Check the browser console:**
   - Press F12
   - Look at the "Console" tab
   - Look for red error messages
   - Take a screenshot if you see errors

---

## ✅ How to Verify It Worked

After running the SQL, check if columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'voters'
ORDER BY column_name;
```

You should see all these columns:
- first_name
- last_name
- age
- gender
- voter_id
- phone
- email
- booth_number ← Important!
- caste
- religion
- education
- occupation
- and more...
