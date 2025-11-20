-- Migration: Backfill auth_user_id for existing users
-- Created: 2025-11-20
-- Description: Updates existing users who have NULL auth_user_id to set it equal to their id.
--              This is required for RLS policies to work correctly after migration 13.

-- ============================================================================
-- BACKFILL auth_user_id FOR EXISTING USERS
-- ============================================================================

-- Update all users where auth_user_id is NULL
-- Set auth_user_id = id (since id is the Supabase auth user ID)
UPDATE users
SET auth_user_id = id
WHERE auth_user_id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check how many users were updated
-- Run this after migration to verify:
-- SELECT COUNT(*) as total_users,
--        COUNT(auth_user_id) as users_with_auth_id,
--        COUNT(*) - COUNT(auth_user_id) as users_missing_auth_id
-- FROM users;

-- Result should show: users_missing_auth_id = 0
