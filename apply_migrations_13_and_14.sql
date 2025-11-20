-- ============================================================================
-- MIGRATION 13: Fix voter_calls RLS policies to use auth_user_id
-- ============================================================================

-- DROP EXISTING POLICIES
DROP POLICY IF EXISTS "Users can view calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can create calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can update calls in their organization" ON voter_calls;
DROP POLICY IF EXISTS "Users can delete calls in their organization" ON voter_calls;

DROP POLICY IF EXISTS "Users can view campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can create campaigns in their organization" ON call_campaigns;
DROP POLICY IF EXISTS "Users can update campaigns in their organization" ON call_campaigns;

DROP POLICY IF EXISTS "Users can view sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can create sentiment in their organization" ON call_sentiment_analysis;
DROP POLICY IF EXISTS "Users can update sentiment in their organization" ON call_sentiment_analysis;

DROP POLICY IF EXISTS "Users can view uploads in their organization" ON call_csv_uploads;
DROP POLICY IF EXISTS "Users can create uploads in their organization" ON call_csv_uploads;

-- RECREATE POLICIES WITH CORRECT auth_user_id CHECK

-- voter_calls TABLE POLICIES
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

-- call_campaigns TABLE POLICIES
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

-- call_sentiment_analysis TABLE POLICIES
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

-- call_csv_uploads TABLE POLICIES
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
-- MIGRATION 14: Backfill auth_user_id for existing users
-- ============================================================================

UPDATE users
SET auth_user_id = id
WHERE auth_user_id IS NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

SELECT
    COUNT(*) as total_users,
    COUNT(auth_user_id) as users_with_auth_id,
    COUNT(*) - COUNT(auth_user_id) as users_missing_auth_id
FROM users;
