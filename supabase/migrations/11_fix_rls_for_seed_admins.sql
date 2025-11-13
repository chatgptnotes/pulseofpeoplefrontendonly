-- Migration: Fix RLS function to work with seed admin accounts
-- This allows admins to create voters even if auth_user_id doesn't match exactly
-- by also checking email as fallback

-- Drop and recreate the function with email fallback
DROP FUNCTION IF EXISTS get_current_user_role();

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- First try the standard way: by auth_user_id
    SELECT role INTO user_role
    FROM users
    WHERE auth_user_id = auth.uid();

    -- If not found, try by email (for seed accounts with mismatched auth_user_id)
    IF user_role IS NULL THEN
        -- Get email from auth.users
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = auth.uid();

        -- Find user by email in users table
        IF user_email IS NOT NULL THEN
            SELECT role INTO user_role
            FROM users
            WHERE email = user_email;
        END IF;
    END IF;

    -- Return role or default to 'viewer'
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_current_user_role() IS 'Returns user role by auth_user_id or email fallback for seed accounts';
