-- ============================================================================
-- FORM SUBMISSION HANDLER FOR VOTERS TABLE
-- Maps form field names to database column names automatically
-- ============================================================================

-- ============================================================================
-- FORM FIELD TO DATABASE COLUMN MAPPING
-- ============================================================================
-- Form Field Name          → Database Column        → Notes
-- ---------------------------------------------------------------------------
-- Full Name                → first_name             → Stores entire name in first_name (last_name column doesn't exist)
-- Age                      → age                    → Direct mapping
-- Gender                   → gender                 → Direct mapping (lowercase)
-- Voter ID Card            → voter_id               → Direct mapping
-- Phone Number             → phone                  → Direct mapping
-- Email                    → email                  → Direct mapping
-- Caste                    → caste                  → Direct mapping
-- Religion                 → religion               → Direct mapping
-- Education                → education              → Direct mapping
-- Occupation               → occupation             → Direct mapping
-- Constituency             → constituency_id        → FK lookup by name
-- Booth                    → ward                   → Direct mapping
-- Address                  → address_line1          → Direct mapping
-- Political Interests      → tags                   → Convert to JSONB array
-- ---------------------------------------------------------------------------


-- ============================================================================
-- POSTGRESQL FUNCTION: insert_voter_from_form
-- ============================================================================
-- This function accepts form data and handles all the field mapping automatically

CREATE OR REPLACE FUNCTION insert_voter_from_form(
    p_full_name VARCHAR,
    p_age INTEGER,
    p_gender VARCHAR,
    p_voter_id_card VARCHAR,
    p_phone_number VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_caste VARCHAR DEFAULT NULL,
    p_religion VARCHAR DEFAULT NULL,
    p_education VARCHAR DEFAULT NULL,
    p_occupation VARCHAR DEFAULT NULL,
    p_constituency VARCHAR DEFAULT NULL,
    p_booth VARCHAR DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_political_interests JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    voter_id UUID
) AS $$
DECLARE
    v_constituency_id UUID;
    v_inserted_id UUID;
BEGIN
    -- Note: Storing entire full name in first_name column
    -- (last_name and middle_name columns don't exist in actual database)

    -- Lookup constituency_id if constituency name provided
    IF p_constituency IS NOT NULL THEN
        SELECT id INTO v_constituency_id
        FROM constituencies
        WHERE name = p_constituency
        LIMIT 1;
    END IF;

    -- Insert into voters table with mapped fields
    INSERT INTO voters (
        voter_id,
        first_name,
        age,
        gender,
        phone,
        email,
        caste,
        religion,
        education,
        occupation,
        constituency_id,
        ward,
        address_line1,
        tags,
        party_affiliation,
        sentiment,
        is_active,
        is_verified
    ) VALUES (
        p_voter_id_card,
        TRIM(p_full_name),  -- Store entire name in first_name
        p_age,
        LOWER(p_gender),  -- Ensure lowercase
        p_phone_number,
        p_email,
        p_caste,
        p_religion,
        p_education,
        p_occupation,
        v_constituency_id,
        p_booth,
        p_address,
        p_political_interests,
        'neutral',  -- Default value
        'neutral',  -- Default value
        true,       -- Default: active
        false       -- Default: not verified
    )
    RETURNING id INTO v_inserted_id;

    -- Return success response
    RETURN QUERY SELECT
        true AS success,
        'Voter added successfully' AS message,
        v_inserted_id AS voter_id;

EXCEPTION
    WHEN unique_violation THEN
        RETURN QUERY SELECT
            false AS success,
            'Voter ID already exists' AS message,
            NULL::UUID AS voter_id;
    WHEN OTHERS THEN
        RETURN QUERY SELECT
            false AS success,
            SQLERRM AS message,
            NULL::UUID AS voter_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- EXAMPLE USAGE 1: Call the function with form data
-- ============================================================================

SELECT * FROM insert_voter_from_form(
    p_full_name := 'Rajesh Kumar Murugan',
    p_age := 35,
    p_gender := 'Male',
    p_voter_id_card := 'TN12345678901',
    p_phone_number := '+91-9876543210',
    p_email := 'rajesh.kumar@example.com',
    p_caste := 'OBC',
    p_religion := 'Hindu',
    p_education := 'Graduate',
    p_occupation := 'Software Engineer',
    p_constituency := 'Chennai North',
    p_booth := 'Booth-42',
    p_address := '123, Anna Nagar, 2nd Street, Chennai - 600040',
    p_political_interests := '["Infrastructure", "Education", "Technology"]'::jsonb
);


-- ============================================================================
-- EXAMPLE USAGE 2: Minimal required fields only
-- ============================================================================

SELECT * FROM insert_voter_from_form(
    p_full_name := 'Priya Selvam',
    p_age := 28,
    p_gender := 'Female',
    p_voter_id_card := 'TN12345678902',
    p_phone_number := '+91-9876543211'
);


-- ============================================================================
-- EXAMPLE USAGE 3: With all political interests checked
-- ============================================================================

SELECT * FROM insert_voter_from_form(
    p_full_name := 'Arun Krishnan',
    p_age := 42,
    p_gender := 'Male',
    p_voter_id_card := 'TN12345678903',
    p_phone_number := '+91-9876543212',
    p_email := 'arun.k@example.com',
    p_caste := 'General',
    p_religion := 'Hindu',
    p_education := 'Post Graduate',
    p_occupation := 'Business Owner',
    p_constituency := 'Chennai South',
    p_booth := 'Booth-28',
    p_address := '78, Adyar, 4th Cross Street, Chennai - 600020',
    p_political_interests := '["Infrastructure", "Education", "Healthcare", "Employment", "Women Safety", "Economic Policy", "Environment", "Technology"]'::jsonb
);


-- ============================================================================
-- ALTERNATIVE APPROACH: Direct INSERT with inline name splitting
-- ============================================================================
-- Use this if you don't want to create a function

INSERT INTO voters (
    voter_id,
    first_name,
    age,
    gender,
    phone,
    email,
    caste,
    religion,
    education,
    occupation,
    constituency_id,
    ward,
    address_line1,
    tags,
    party_affiliation,
    sentiment,
    is_active,
    is_verified
)
VALUES (
    -- Direct mappings
    'TN12345678904',                                -- From: Voter ID Card
    'Mohammed Ali Khan',                            -- From: Full Name (stored entirely in first_name)
    38,                                             -- From: Age
    'male',                                         -- gender (lowercase)
    '+91-9876543214',                               -- phone
    'mohammed.ali@example.com',                     -- email
    'General',                                      -- caste
    'Muslim',                                       -- religion
    'Secondary',                                    -- education
    'Retail Shop Owner',                            -- occupation
    (SELECT id FROM constituencies WHERE name = 'Chennai North' LIMIT 1),  -- constituency_id (FK lookup)
    'Booth-35',                                     -- ward (From: Booth)
    '92, Perambur, Main Road, Chennai - 600011',   -- address_line1 (From: Address)
    '["Infrastructure", "Economic Policy", "Employment"]'::jsonb,  -- tags (From: Political Interests)
    'neutral',                                      -- party_affiliation (default)
    'neutral',                                      -- sentiment (default)
    true,                                           -- is_active (default)
    false                                           -- is_verified (default)
);


-- ============================================================================
-- BATCH INSERT: Submit multiple form submissions at once
-- ============================================================================

SELECT * FROM insert_voter_from_form('Lakshmi Narayanan', 31, 'Female', 'TN12345678905', '+91-9876543215', 'lakshmi.n@example.com', 'OBC', 'Hindu', 'Graduate', 'Government Employee', 'Chennai Central', 'Booth-12', '56, Mylapore, Temple Street, Chennai - 600004', '["Healthcare", "Women Safety", "Employment"]'::jsonb);

SELECT * FROM insert_voter_from_form('Suresh Babu', 45, 'Male', 'TN12345678906', '+91-9876543216', 'suresh.b@example.com', 'SC', 'Hindu', 'Secondary', 'Driver', 'Chennai South', 'Booth-20', '34, Guindy, 1st Avenue, Chennai - 600032', '["Employment", "Infrastructure"]'::jsonb);

SELECT * FROM insert_voter_from_form('Fatima Begum', 29, 'Female', 'TN12345678907', '+91-9876543217', NULL, 'General', 'Muslim', 'Graduate', 'Homemaker', 'Chennai North', 'Booth-15', '67, Royapuram, Beach Road, Chennai - 600013', '["Education", "Women Safety"]'::jsonb);


-- ============================================================================
-- VERIFICATION: Check the inserted records
-- ============================================================================

-- View all recently added voters
SELECT
    voter_id,
    first_name as full_name,        -- Note: entire name is stored in first_name
    age,
    gender,
    phone,
    email,
    caste,
    religion,
    education,
    occupation,
    ward as booth,
    address_line1 as address,
    tags as political_interests,
    created_at
FROM voters
ORDER BY created_at DESC
LIMIT 10;


-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- Note: Since last_name and middle_name columns don't exist in the actual database,
-- we store the entire name in first_name column

-- Check available constituencies
SELECT id, name FROM constituencies ORDER BY name;

-- Check if voter_id already exists
SELECT voter_id, first_name, last_name
FROM voters
WHERE voter_id = 'TN12345678901';

-- Delete test records (if needed)
-- DELETE FROM voters WHERE voter_id IN ('TN12345678901', 'TN12345678902', 'TN12345678903');


-- ============================================================================
-- QUICK REFERENCE: Political Interests Mapping
-- ============================================================================
-- Checkbox Checked    → Include in JSONB array
-- ---------------------------------------------------------------------------
-- ☑ Infrastructure    → "Infrastructure"
-- ☑ Education         → "Education"
-- ☑ Healthcare        → "Healthcare"
-- ☑ Employment        → "Employment"
-- ☑ Women Safety      → "Women Safety"
-- ☑ Economic Policy   → "Economic Policy"
-- ☑ Environment       → "Environment"
-- ☑ Technology        → "Technology"
--
-- Examples:
-- No checkboxes:      '[]'::jsonb
-- One checkbox:       '["Infrastructure"]'::jsonb
-- Multiple:           '["Infrastructure", "Education", "Healthcare"]'::jsonb
-- All:                '["Infrastructure", "Education", "Healthcare", "Employment", "Women Safety", "Economic Policy", "Environment", "Technology"]'::jsonb
-- ---------------------------------------------------------------------------


-- ============================================================================
-- NOTES FOR FRONTEND INTEGRATION
-- ============================================================================
--
-- If calling from JavaScript/TypeScript (e.g., Supabase client):
--
-- const { data, error } = await supabase.rpc('insert_voter_from_form', {
--   p_full_name: formData.fullName,
--   p_age: parseInt(formData.age),
--   p_gender: formData.gender.toLowerCase(),
--   p_voter_id_card: formData.voterIdCard,
--   p_phone_number: formData.phoneNumber,
--   p_email: formData.email || null,
--   p_caste: formData.caste || null,
--   p_religion: formData.religion || null,
--   p_education: formData.education || null,
--   p_occupation: formData.occupation || null,
--   p_constituency: formData.constituency || null,
--   p_booth: formData.booth || null,
--   p_address: formData.address || null,
--   p_political_interests: JSON.stringify(formData.politicalInterests) || '[]'
-- });
--
-- if (data && data[0].success) {
--   console.log('Success:', data[0].message);
--   console.log('Voter ID:', data[0].voter_id);
-- } else {
--   console.error('Error:', data ? data[0].message : error.message);
-- }
--
-- ============================================================================
