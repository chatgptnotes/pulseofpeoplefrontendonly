-- Migration: Fix RLS policies for tvk_sentiment_reports table
-- Date: 2025-11-20
-- Description: Replaces session variable-based RLS with auth context-based RLS
--              Fixes query blocking issues where app.current_organization_id is not set

-- Drop the existing problematic RLS policy
DROP POLICY IF EXISTS "Users can view TVK reports for their organization" ON tvk_sentiment_reports;

-- Create new RLS policy that uses auth context instead of session variables
CREATE POLICY "Users can view TVK reports for their organization"
  ON tvk_sentiment_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Also update the INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert TVK reports for their organization" ON tvk_sentiment_reports;

CREATE POLICY "Users can insert TVK reports for their organization"
  ON tvk_sentiment_reports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Add UPDATE policy for completeness
DROP POLICY IF EXISTS "Users can update TVK reports for their organization" ON tvk_sentiment_reports;

CREATE POLICY "Users can update TVK reports for their organization"
  ON tvk_sentiment_reports FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Add DELETE policy for completeness
DROP POLICY IF EXISTS "Users can delete TVK reports for their organization" ON tvk_sentiment_reports;

CREATE POLICY "Users can delete TVK reports for their organization"
  ON tvk_sentiment_reports FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
