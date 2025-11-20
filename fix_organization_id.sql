-- ============================================================================
-- FIX: Update user's organization_id to match dev org
-- ============================================================================

-- Step 1: Check current state of user
SELECT
    id,
    email,
    organization_id,
    auth_user_id,
    full_name,
    role,
    created_at
FROM users
WHERE email = 'venkat.murugan.admin@tvk.com';

-- Expected: organization_id might be NULL or different from dev org ID


-- Step 2: Update user's organization_id to dev org
UPDATE users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'venkat.murugan.admin@tvk.com';

-- Should update 1 row


-- Step 3: Verify update was successful
SELECT
    id,
    email,
    organization_id,
    auth_user_id,
    full_name,
    role
FROM users
WHERE email = 'venkat.murugan.admin@tvk.com';

-- Expected: organization_id should now be '00000000-0000-0000-0000-000000000001'


-- Step 4: Check if calls exist for this organization
SELECT
    id,
    call_id,
    phone_number,
    organization_id,
    status,
    created_at,
    transcript
FROM voter_calls
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 5;

-- Should show the calls that were saved


-- Step 5: If no calls found, check ALL calls (might have wrong org_id)
SELECT
    id,
    call_id,
    phone_number,
    organization_id,
    status,
    created_at
FROM voter_calls
ORDER BY created_at DESC
LIMIT 10;

-- This shows all calls regardless of organization_id


-- ============================================================================
-- OPTIONAL: Fix calls with wrong organization_id
-- ============================================================================

-- If calls were saved with NULL or wrong organization_id, update them:
UPDATE voter_calls
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL
   OR organization_id != '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- VERIFICATION COMPLETE
-- ============================================================================

-- After running these queries:
-- 1. User will have organization_id = '00000000-0000-0000-0000-000000000001'
-- 2. All calls will have the same organization_id
-- 3. RLS policies will allow the user to see the calls
-- 4. Call History should display data when refreshed
