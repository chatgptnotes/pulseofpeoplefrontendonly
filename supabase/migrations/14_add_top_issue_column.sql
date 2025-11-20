-- Migration: Add top_issue column to tvk_sentiment_reports table
-- Date: 2025-11-20
-- Description: Adds the missing top_issue column that is referenced in the Reports.tsx frontend code

-- Add top_issue column to store the most discussed issue in each report
ALTER TABLE tvk_sentiment_reports
ADD COLUMN IF NOT EXISTS top_issue VARCHAR(100);

-- Add comment to document the column
COMMENT ON COLUMN tvk_sentiment_reports.top_issue IS 'The most discussed or prominent issue in the sentiment report period';
