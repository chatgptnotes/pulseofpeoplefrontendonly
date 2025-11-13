-- ============================================================================
-- DIAGNOSTIC: Check Actual Voters Table Schema
-- ============================================================================
-- Run these queries to see what columns actually exist in your database
-- ============================================================================

-- ============================================================================
-- QUERY 1: List ALL columns in voters table
-- ============================================================================
-- This shows every column with its data type, nullability, and default value

SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'voters'
ORDER BY ordinal_position;


-- ============================================================================
-- QUERY 2: Check for specific name-related columns
-- ============================================================================
-- This checks if first_name, last_name, middle_name exist

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'first_name')
        THEN '✓ EXISTS' ELSE '✗ MISSING'
    END AS first_name_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'last_name')
        THEN '✓ EXISTS' ELSE '✗ MISSING'
    END AS last_name_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'middle_name')
        THEN '✓ EXISTS' ELSE '✗ MISSING'
    END AS middle_name_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voters' AND column_name = 'polling_booth_id')
        THEN '✓ EXISTS' ELSE '✗ MISSING'
    END AS polling_booth_id_status;


-- ============================================================================
-- QUERY 3: Check for all expected columns
-- ============================================================================
-- This shows which columns from our SQL files exist vs missing

WITH expected_columns AS (
    SELECT column_name FROM (VALUES
        ('id'),
        ('voter_id'),
        ('first_name'),
        ('last_name'),
        ('middle_name'),
        ('age'),
        ('gender'),
        ('phone'),
        ('email'),
        ('caste'),
        ('religion'),
        ('education'),
        ('occupation'),
        ('constituency_id'),
        ('ward'),
        ('address_line1'),
        ('tags'),
        ('party_affiliation'),
        ('sentiment'),
        ('is_active'),
        ('is_verified'),
        ('created_at'),
        ('updated_at')
    ) AS t(column_name)
),
actual_columns AS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'voters'
)
SELECT
    e.column_name,
    CASE
        WHEN a.column_name IS NOT NULL THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END AS status
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY
    CASE WHEN a.column_name IS NOT NULL THEN 0 ELSE 1 END,
    e.column_name;


-- ============================================================================
-- QUERY 4: Show table constraints
-- ============================================================================
-- This shows primary keys, unique constraints, foreign keys, etc.

SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'voters'
ORDER BY tc.constraint_type, tc.constraint_name;


-- ============================================================================
-- QUERY 5: Check triggers on voters table
-- ============================================================================
-- This shows any triggers that might cause INSERT errors

SELECT
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'voters'::regclass
  AND NOT tgisinternal;


-- ============================================================================
-- QUERY 6: Sample data from voters table
-- ============================================================================
-- This shows what columns actually have data (if any voters exist)

SELECT *
FROM voters
LIMIT 3;


-- ============================================================================
-- QUERY 7: Count existing voters
-- ============================================================================

SELECT
    COUNT(*) AS total_voters,
    COUNT(DISTINCT voter_id) AS unique_voter_ids
FROM voters;


-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Run QUERY 1 first - Copy the results and paste them back to me
-- 2. Run QUERY 2 - This will quickly show which name columns exist
-- 3. Run QUERY 3 - This shows all expected vs actual columns
-- 4. Run QUERY 5 - Check if any problematic triggers remain
--
-- Once you provide the results, I'll update all SQL files to match your
-- actual database schema exactly.
-- ============================================================================


-- ============================================================================
-- COMMON SCENARIOS
-- ============================================================================

-- Scenario 1: If last_name and middle_name are MISSING
-- → We'll update all SQL files to use only first_name for the full name
-- → OR create a migration to add these columns

-- Scenario 2: If only first_name exists
-- → We'll store the entire "Full Name" in first_name column
-- → Update all queries accordingly

-- Scenario 3: If there's a "name" or "full_name" column instead
-- → We'll map the form's "Full Name" directly to that column
-- → Update all field mappings

-- ============================================================================
