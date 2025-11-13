-- ============================================================================
-- OPTIONAL MIGRATION: Add Missing Columns to Voters Table
-- ============================================================================
--
-- IMPORTANT: Only run this if you want to add last_name and middle_name columns
-- to your voters table. This is OPTIONAL.
--
-- Current Status:
-- - Your database has: first_name column only
-- - Migration files suggest: first_name, middle_name, last_name
--
-- If you run this migration:
-- - You can split names properly (first/middle/last)
-- - You'll need to migrate existing data (see script below)
-- - All future INSERT queries can use all three name fields
--
-- ============================================================================


-- ============================================================================
-- STEP 1: Add Missing Columns
-- ============================================================================

-- Add last_name column
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add middle_name column
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Add polling_booth_id column (if you want booth tracking)
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS polling_booth_id UUID REFERENCES polling_booths(id) ON DELETE SET NULL;

COMMENT ON COLUMN voters.last_name IS 'Last name of the voter';
COMMENT ON COLUMN voters.middle_name IS 'Middle name of the voter (optional)';
COMMENT ON COLUMN voters.polling_booth_id IS 'Foreign key to polling_booths table';


-- ============================================================================
-- STEP 2: Migrate Existing Data (Split Names)
-- ============================================================================
-- This will attempt to split existing names in first_name into separate fields

-- Preview what will happen (run this first to check)
SELECT
    id,
    first_name AS current_full_name,
    SPLIT_PART(first_name, ' ', 1) AS will_be_first_name,
    CASE
        WHEN array_length(string_to_array(first_name, ' '), 1) = 3
        THEN SPLIT_PART(first_name, ' ', 2)
        ELSE NULL
    END AS will_be_middle_name,
    CASE
        WHEN array_length(string_to_array(first_name, ' '), 1) >= 2
        THEN SPLIT_PART(first_name, ' ', array_length(string_to_array(first_name, ' '), 1))
        ELSE NULL
    END AS will_be_last_name
FROM voters
WHERE first_name IS NOT NULL
LIMIT 10;


-- Actually perform the migration (only run after reviewing preview above)
/*
UPDATE voters
SET
    last_name = CASE
        WHEN array_length(string_to_array(first_name, ' '), 1) >= 2
        THEN SPLIT_PART(first_name, ' ', array_length(string_to_array(first_name, ' '), 1))
        ELSE NULL
    END,
    middle_name = CASE
        WHEN array_length(string_to_array(first_name, ' '), 1) = 3
        THEN SPLIT_PART(first_name, ' ', 2)
        ELSE NULL
    END,
    first_name = SPLIT_PART(first_name, ' ', 1)
WHERE first_name IS NOT NULL
  AND first_name LIKE '% %';  -- Only split if there are spaces
*/


-- ============================================================================
-- STEP 3: Create Indexes (Optional but Recommended)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_voters_last_name ON voters(last_name);
CREATE INDEX IF NOT EXISTS idx_voters_full_name ON voters(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_voters_polling_booth ON voters(polling_booth_id);


-- ============================================================================
-- STEP 4: Update RLS Policies (if using Row Level Security)
-- ============================================================================
-- If you're using Supabase or have RLS enabled, you may need to update policies
-- This is a placeholder - adjust based on your actual RLS setup

-- Example:
-- DROP POLICY IF EXISTS voters_select_policy ON voters;
-- CREATE POLICY voters_select_policy ON voters
--     FOR SELECT
--     USING (true);  -- Adjust based on your security requirements


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'voters'
  AND column_name IN ('first_name', 'middle_name', 'last_name', 'polling_booth_id')
ORDER BY
    CASE column_name
        WHEN 'first_name' THEN 1
        WHEN 'middle_name' THEN 2
        WHEN 'last_name' THEN 3
        WHEN 'polling_booth_id' THEN 4
    END;


-- Check sample data after migration
SELECT
    voter_id,
    first_name,
    middle_name,
    last_name,
    CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), COALESCE(last_name, '')) as reconstructed_full_name
FROM voters
LIMIT 10;


-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If something goes wrong, you can remove the columns:

/*
ALTER TABLE voters DROP COLUMN IF EXISTS last_name;
ALTER TABLE voters DROP COLUMN IF EXISTS middle_name;
ALTER TABLE voters DROP COLUMN IF EXISTS polling_booth_id;

DROP INDEX IF EXISTS idx_voters_last_name;
DROP INDEX IF EXISTS idx_voters_full_name;
DROP INDEX IF EXISTS idx_voters_polling_booth;
*/


-- ============================================================================
-- AFTER RUNNING THIS MIGRATION
-- ============================================================================
-- 1. You can now use the original INSERT queries with first_name, middle_name, last_name
-- 2. Update your form submission logic to split names before inserting
-- 3. Or use the insert_voter_from_form function which handles splitting automatically
-- 4. Consider whether you want to enforce name splitting in your application or allow
--    users to still store full names in first_name (more flexible)
-- ============================================================================


-- ============================================================================
-- ALTERNATIVE APPROACH: Add Computed Column
-- ============================================================================
-- Instead of migrating data, you could add a computed column for full_name

-- Add a generated column that concatenates the names
ALTER TABLE voters
ADD COLUMN IF NOT EXISTS full_name VARCHAR(300)
GENERATED ALWAYS AS (
    CONCAT(
        first_name,
        COALESCE(' ' || middle_name, ''),
        COALESCE(' ' || last_name, '')
    )
) STORED;

CREATE INDEX IF NOT EXISTS idx_voters_full_name_generated ON voters(full_name);

-- Now you can query like this:
-- SELECT voter_id, full_name FROM voters WHERE full_name ILIKE '%kumar%';


-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================
--
-- Option A: Keep current schema (no last_name/middle_name)
-- PRO: Simpler, works with current form, no data migration needed
-- CON: Can't easily query by last name, less structured
-- RECOMMENDATION: Use this if your users typically use single names or full names
--
-- Option B: Add columns but don't migrate data
-- PRO: New entries can use proper structure, old data still works
-- CON: Inconsistent data structure
-- RECOMMENDATION: Good transitional approach
--
-- Option C: Add columns and migrate all data
-- PRO: Consistent, structured, better for analytics
-- CON: May incorrectly split some names, requires testing
-- RECOMMENDATION: Best if you need proper name-based querying and sorting
--
-- ============================================================================
