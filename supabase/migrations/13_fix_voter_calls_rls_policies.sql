-- Migration: Fix voter_calls RLS policies to use auth_user_id
-- Created: 2025-11-20
-- Description: Fixes RLS policies to correctly match auth.uid() with users.auth_user_id
--              instead of users.id. This resolves the "No calls found" issue in Call History.

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- voter_calls policies
DROP POLICY IF EXISTS "Users can view calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can create calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can update calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can delete calls in their organization" ON voter_calls;

-- call_campaigns policies
DROP POLICY IF EXISTS "Users can view campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their organization" ON call_campaigns;

-- call_sentiment_analysis policies
DROP POLICY IF EXISTS "Users can view sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can create sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can update sentiment in their organization" ON call_sentiment_analysis;

-- call_csv_uploads policies
DROP POLICY IF EXISTS "Users can view uploads in their organization" ON call_csv_uploads;
DROP POLICY IF EXISTS "Users can create uploads in their organization" ON call_csv_uploads;

-- ============================================================================
-- RECREATE POLICIES WITH CORRECT auth_user_id CHECK
-- ============================================================================

-- ----------------------------------------------------------------------------
-- voter_calls TABLE POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view calls in their organization"
    ON voter_calls FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create calls in their organization"
    ON voter_calls FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update calls in their organization"
    ON voter_calls FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete calls in their organization"
    ON voter_calls FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- call_campaigns TABLE POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view campaigns in their organization"
    ON call_campaigns FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create campaigns in their organization"
    ON call_campaigns FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update campaigns in their organization"
    ON call_campaigns FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- call_sentiment_analysis TABLE POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view sentiment in their organization"
    ON call_sentiment_analysis FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create sentiment in their organization"
    ON call_sentiment_analysis FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update sentiment in their organization"
    ON call_sentiment_analysis FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- call_csv_uploads TABLE POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view uploads in their organization"
    ON call_csv_uploads FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create uploads in their organization"
    ON call_csv_uploads FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration:
-- 1. Users should be able to view calls in their organization
-- 2. Call History tab should display stored calls
-- 3. New calls should save successfully with sentiment analysis

-- To verify RLS policies are working:
-- SELECT * FROM voter_calls; -- Should return calls for current user's organization
-- SELECT * FROM call_sentiment_analysis; -- Should return sentiment data
