-- ============================================================================
-- FIX: Drop Problematic Trigger on Voters Table
-- ============================================================================
--
-- PROBLEM: The trigger function 'update_booth_voter_count()' references a
-- non-existent column 'polling_booth_id' which causes INSERT operations to fail
--
-- ERROR MESSAGE:
-- ERROR: 42703: record "new" has no field "polling_booth_id"
-- CONTEXT: SQL expression "NEW.polling_booth_id IS NOT NULL"
-- PL/pgSQL function update_booth_voter_count() line 3 at IF
--
-- SOLUTION: Drop the trigger and trigger function
--
-- ============================================================================

-- Drop function with CASCADE to automatically drop all dependent triggers
-- CASCADE will handle any triggers like trigger_update_booth_stats that depend on this function
DROP FUNCTION IF EXISTS update_booth_voter_count() CASCADE;

-- Confirmation message
SELECT 'Trigger and function dropped successfully (with CASCADE)' AS status;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if any triggers remain on the voters table
SELECT
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS is_enabled,
    proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'voters'::regclass
  AND NOT tgisinternal;

-- If the above query returns no rows, the trigger has been successfully removed


-- ============================================================================
-- CHECK FOR OTHER POTENTIAL ISSUES
-- ============================================================================

-- List all triggers on the voters table (including system triggers)
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'voters'
  AND n.nspname = 'public'
ORDER BY t.tgname;


-- ============================================================================
-- OPTIONAL: Re-create a Fixed Version of the Trigger (For Future Use)
-- ============================================================================
--
-- If you want to track booth voter counts in the future, you can use this
-- corrected version that uses the 'ward' column instead of 'polling_booth_id'
--
-- IMPORTANT: Do NOT run this section now - it's for future reference only
--
-- CREATE OR REPLACE FUNCTION update_booth_voter_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- This is a placeholder for a properly implemented trigger
--     -- that would update polling_booths.total_voters based on
--     -- voter changes using the ward column
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_booth_voter_count_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON voters
--     FOR EACH ROW
--     EXECUTE FUNCTION update_booth_voter_count();
--
-- ============================================================================


-- ============================================================================
-- INSTRUCTIONS FOR RUNNING THIS SCRIPT
-- ============================================================================
--
-- Method 1: Using Supabase SQL Editor
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste lines 17-23 (the DROP statements)
-- 4. Click "Run"
-- 5. Run the verification query (lines 32-39) to confirm
--
-- Method 2: Using psql command line
-- $ psql -h your-db-host -U your-username -d your-database -f drop_booth_trigger.sql
--
-- Method 3: Using any PostgreSQL client (DBeaver, pgAdmin, etc.)
-- - Connect to your database
-- - Open this file or copy the DROP statements
-- - Execute the commands
--
-- ============================================================================


-- ============================================================================
-- WHAT TO DO AFTER DROPPING THE TRIGGER
-- ============================================================================
--
-- 1. Run this script to drop the trigger
-- 2. Verify the trigger is removed using the verification query
-- 3. Now you can run your INSERT statements from insert_voter_data.sql
-- 4. Consider whether you need booth voter counting functionality:
--    - If YES: Design a proper implementation with the correct column
--    - If NO: Leave it dropped and continue without it
--
-- ============================================================================


-- ============================================================================
-- ADDITIONAL DIAGNOSTIC QUERIES
-- ============================================================================

-- Check if polling_booth_id column exists (it shouldn't)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'voters'
  AND column_name LIKE '%booth%'
ORDER BY ordinal_position;

-- List all columns in the voters table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'voters'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check polling_booths table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'polling_booths'
  AND table_schema = 'public'
ORDER BY ordinal_position;
