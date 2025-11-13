-- ============================================================================
-- SQL INSERT Query for Voters Table
-- Based on "Add New Voter" Form Structure
-- ============================================================================
--
-- ⚠️ IMPORTANT: TRIGGER ERROR FIX REQUIRED FIRST ⚠️
--
-- If you get this error when running INSERT:
--   ERROR: 42703: record "new" has no field "polling_booth_id"
--   PL/pgSQL function update_booth_voter_count() line 3 at IF
--
-- SOLUTION:
-- 1. First run the commands in 'drop_booth_trigger.sql' to remove the trigger
-- 2. Then come back and run the INSERT queries below
--
-- The trigger references a non-existent column and must be dropped before
-- any INSERT operations will work.
--
-- ============================================================================

-- ============================================================================
-- VERSION 1: COMPLETE EXAMPLE WITH SAMPLE DATA
-- ============================================================================
-- This example inserts a complete voter record with realistic sample data

INSERT INTO voters (
    -- Identity Information
    voter_id,
    first_name,
    age,
    gender,

    -- Contact Information
    phone,
    email,

    -- Demographic Information
    caste,
    religion,
    education,
    occupation,

    -- Location Information
    constituency_id,
    ward,
    address_line1,

    -- Political Data
    tags,
    party_affiliation,
    sentiment,

    -- Status Flags
    is_active,
    is_verified
)
VALUES (
    -- Identity Information
    'TN12345678901',                    -- voter_id (Voter ID Card)
    'Rajesh Kumar',                     -- first_name (Full Name stored here)
    35,                                 -- age
    'male',                             -- gender (Options: 'male', 'female', 'other')

    -- Contact Information
    '+91-9876543210',                   -- phone
    'rajesh.kumar@example.com',         -- email

    -- Demographic Information
    'OBC',                              -- caste (Options: General, OBC, SC, ST, Other)
    'Hindu',                            -- religion (Options: Hindu, Muslim, Christian, Sikh, Buddhist, Jain, Other)
    'Graduate',                         -- education (Options: Illiterate, Primary, Secondary, Graduate, Post Graduate, Doctorate)
    'Software Engineer',                -- occupation

    -- Location Information - Using subquery to lookup constituency_id
    (SELECT id FROM constituencies WHERE name = 'Chennai North' LIMIT 1),  -- constituency_id (replace 'Chennai North' with actual constituency name)
    'Booth-42',                         -- ward (storing Booth number here)
    '123, Anna Nagar, 2nd Street, Chennai - 600040',  -- address_line1 (full address)

    -- Political Data
    '["Infrastructure", "Education", "Technology"]'::jsonb,  -- tags (Political Interests as JSON array)
    'neutral',                          -- party_affiliation (Options: 'bjp', 'congress', 'aap', 'tvk', 'dmk', 'aiadmk', 'neutral', 'unknown', 'other')
    'neutral',                          -- sentiment (Options: 'strong_supporter', 'supporter', 'neutral', 'opposition', 'strong_opposition')

    -- Status Flags
    true,                               -- is_active
    false                               -- is_verified
);


-- ============================================================================
-- VERSION 2: TEMPLATE WITH PLACEHOLDERS
-- ============================================================================
-- Replace the placeholders with actual data from your form

INSERT INTO voters (
    -- Identity Information
    voter_id,
    first_name,
    age,
    gender,

    -- Contact Information
    phone,
    email,

    -- Demographic Information
    caste,
    religion,
    education,
    occupation,

    -- Location Information
    constituency_id,
    ward,
    address_line1,

    -- Political Data
    tags,
    party_affiliation,
    sentiment,

    -- Status Flags
    is_active,
    is_verified
)
VALUES (
    -- Identity Information
    '<VOTER_ID_CARD>',                  -- voter_id: Enter Voter ID Card number
    '<FULL_NAME>',                      -- first_name: Enter Full Name (stored in first_name column)
    <AGE>,                              -- age: Enter age (18-120)
    '<GENDER>',                         -- gender: 'male', 'female', or 'other'

    -- Contact Information
    '<PHONE_NUMBER>',                   -- phone: Enter phone number
    '<EMAIL>',                          -- email: Enter email address (or NULL)

    -- Demographic Information
    '<CASTE>',                          -- caste: General, OBC, SC, ST, Other
    '<RELIGION>',                       -- religion: Hindu, Muslim, Christian, Sikh, Buddhist, Jain, Other
    '<EDUCATION>',                      -- education: Illiterate, Primary, Secondary, Graduate, Post Graduate, Doctorate
    '<OCCUPATION>',                     -- occupation: Enter occupation/profession

    -- Location Information
    (SELECT id FROM constituencies WHERE name = '<CONSTITUENCY_NAME>' LIMIT 1),  -- constituency_id
    '<BOOTH_NUMBER>',                   -- ward: Enter Booth number (e.g., 'Booth-42')
    '<ADDRESS>',                        -- address_line1: Enter full address

    -- Political Data
    '<POLITICAL_INTERESTS>'::jsonb,     -- tags: e.g., '["Infrastructure", "Education"]'::jsonb
    'neutral',                          -- party_affiliation: Set default or actual value
    'neutral',                          -- sentiment: Set default or actual value

    -- Status Flags
    true,                               -- is_active
    false                               -- is_verified
);


-- ============================================================================
-- ALTERNATIVE: INSERT WITH DISTRICT AND STATE LOOKUP
-- ============================================================================
-- Use this if you also want to populate district_id and state_id

INSERT INTO voters (
    voter_id, first_name, last_name, age, gender,
    phone, email,
    caste, religion, education, occupation,
    constituency_id, district_id, state_id, ward, address_line1,
    tags, party_affiliation, sentiment,
    is_active, is_verified
)
VALUES (
    'TN12345678902',
    'Priya',
    'Selvam',
    28,
    'female',
    '+91-9876543211',
    'priya.selvam@example.com',
    'SC',
    'Hindu',
    'Post Graduate',
    'Teacher',
    (SELECT id FROM constituencies WHERE name = 'Chennai Central' LIMIT 1),
    (SELECT id FROM districts WHERE name = 'Chennai' LIMIT 1),
    (SELECT id FROM states WHERE name = 'Tamil Nadu' LIMIT 1),
    'Booth-15',
    '45, T Nagar, 3rd Main Road, Chennai - 600017',
    '["Education", "Women Safety", "Healthcare"]'::jsonb,
    'neutral',
    'neutral',
    true,
    false
);


-- ============================================================================
-- FIELD MAPPING REFERENCE
-- ============================================================================
-- Form Field              → Database Column(s)        → Data Type
-- ---------------------------------------------------------------------------
-- Full Name               → first_name                → VARCHAR(100) (entire name stored here)
-- Age                     → age                       → INTEGER (18-120)
-- Gender                  → gender                    → VARCHAR(10)
-- Voter ID Card           → voter_id                  → VARCHAR(50) UNIQUE
-- Phone Number            → phone                     → VARCHAR(20)
-- Email                   → email                     → VARCHAR(255)
-- Caste                   → caste                     → VARCHAR(50)
-- Religion                → religion                  → VARCHAR(50)
-- Education               → education                 → VARCHAR(50)
-- Occupation              → occupation                → VARCHAR(100)
-- Constituency            → constituency_id           → UUID (FK)
-- Booth                   → ward                      → VARCHAR(100)
-- Address                 → address_line1             → VARCHAR(200)
-- Political Interests     → tags                      → JSONB array
-- ---------------------------------------------------------------------------


-- ============================================================================
-- POLITICAL INTERESTS VALUES (for tags column)
-- ============================================================================
-- Available checkboxes from form:
-- - Infrastructure
-- - Education
-- - Healthcare
-- - Employment
-- - Women Safety
-- - Economic Policy
-- - Environment
-- - Technology

-- Example tags values:
-- '["Infrastructure"]'::jsonb
-- '["Infrastructure", "Education"]'::jsonb
-- '["Healthcare", "Employment", "Women Safety"]'::jsonb
-- '["Infrastructure", "Education", "Healthcare", "Employment", "Women Safety", "Economic Policy", "Environment", "Technology"]'::jsonb


-- ============================================================================
-- NOTES AND TIPS
-- ============================================================================
-- 1. Full Name Storage:
--    - Store the entire Full Name in the first_name column
--    - Example: "Rajesh Kumar" → first_name = 'Rajesh Kumar'
--    - Note: last_name and middle_name columns don't exist in the actual database

-- 2. Constituency Lookup:
--    - Make sure the constituency name exists in the constituencies table
--    - Use: SELECT * FROM constituencies; to see available options
--    - If lookup fails, constituency_id will be NULL

-- 3. Political Interests:
--    - Must be valid JSON array format
--    - Values should match exactly from the form checkboxes
--    - Empty interests: '[]'::jsonb

-- 4. Gender Values:
--    - Must be one of: 'male', 'female', 'other'
--    - Database enforces CHECK constraint

-- 5. Party Affiliation Values:
--    - Allowed: 'bjp', 'congress', 'aap', 'tvk', 'dmk', 'aiadmk',
--               'neutral', 'unknown', 'other'
--    - Default: 'neutral'

-- 6. Optional Fields (can be NULL or omitted):
--    - email, date_of_birth
--    - address_line2, landmark, pincode
--    - All foreign keys (constituency_id, district_id, state_id, created_by)

-- 7. Auto-populated Fields (do not include in INSERT):
--    - id (auto-generated UUID)
--    - created_at (default NOW())
--    - updated_at (default NOW())
--    - contact_frequency (default 0)
--    - interaction_count (default 0)


-- ============================================================================
-- BATCH INSERT EXAMPLE (Multiple voters at once)
-- ============================================================================

INSERT INTO voters (
    voter_id, first_name, last_name, age, gender,
    phone, email, caste, religion, education, occupation,
    constituency_id, ward, address_line1, tags,
    is_active, is_verified
)
VALUES
    (
        'TN12345678903',
        'Arun',
        'Krishnan',
        42,
        'male',
        '+91-9876543212',
        'arun.k@example.com',
        'General',
        'Hindu',
        'Post Graduate',
        'Business Owner',
        (SELECT id FROM constituencies WHERE name = 'Chennai South' LIMIT 1),
        'Booth-28',
        '78, Adyar, 4th Cross Street, Chennai - 600020',
        '["Economic Policy", "Infrastructure"]'::jsonb,
        true,
        false
    ),
    (
        'TN12345678904',
        'Lakshmi',
        'Narayanan',
        31,
        'female',
        '+91-9876543213',
        'lakshmi.n@example.com',
        'OBC',
        'Hindu',
        'Graduate',
        'Government Employee',
        (SELECT id FROM constituencies WHERE name = 'Chennai Central' LIMIT 1),
        'Booth-12',
        '56, Mylapore, Temple Street, Chennai - 600004',
        '["Healthcare", "Women Safety", "Employment"]'::jsonb,
        true,
        false
    ),
    (
        'TN12345678905',
        'Mohammed',
        'Ali',
        38,
        'male',
        '+91-9876543214',
        'mohammed.ali@example.com',
        'General',
        'Muslim',
        'Secondary',
        'Retail Shop Owner',
        (SELECT id FROM constituencies WHERE name = 'Chennai North' LIMIT 1),
        'Booth-35',
        '92, Perambur, Main Road, Chennai - 600011',
        '["Infrastructure", "Economic Policy", "Employment"]'::jsonb,
        true,
        false
    );


-- ============================================================================
-- VERIFICATION QUERIES (Run after INSERT)
-- ============================================================================

-- Check if the voter was inserted successfully
SELECT * FROM voters
WHERE voter_id = 'TN12345678901';

-- View the most recently added voters
SELECT
    voter_id,
    first_name as full_name,    -- Note: entire name stored in first_name
    age,
    gender,
    phone,
    caste,
    education,
    occupation,
    ward as booth,
    tags as political_interests,
    created_at
FROM voters
ORDER BY created_at DESC
LIMIT 10;

-- Count voters by constituency
SELECT
    c.name as constituency,
    COUNT(v.id) as voter_count
FROM voters v
LEFT JOIN constituencies c ON v.constituency_id = c.id
GROUP BY c.name
ORDER BY voter_count DESC;
