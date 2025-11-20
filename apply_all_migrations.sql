-- =====================================================
-- COMBINED MIGRATIONS: Fix Sentiment Preview Data
-- Date: 2025-11-20
-- Files: 14, 15, 16
-- =====================================================

-- MIGRATION 14: Add top_issue column
-- =====================================================
ALTER TABLE tvk_sentiment_reports
ADD COLUMN IF NOT EXISTS top_issue VARCHAR(100);

COMMENT ON COLUMN tvk_sentiment_reports.top_issue IS 'The most discussed or prominent issue in the sentiment report period';

-- MIGRATION 15: Fix RLS policies
-- =====================================================
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view TVK reports for their organization" ON tvk_sentiment_reports;
DROP POLICY IF EXISTS "Users can insert TVK reports for their organization" ON tvk_sentiment_reports;
DROP POLICY IF EXISTS "Users can update TVK reports for their organization" ON tvk_sentiment_reports;
DROP POLICY IF EXISTS "Users can delete TVK reports for their organization" ON tvk_sentiment_reports;

-- Create new auth-based policies
CREATE POLICY "Users can view TVK reports for their organization"
  ON tvk_sentiment_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert TVK reports for their organization"
  ON tvk_sentiment_reports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can delete TVK reports for their organization"
  ON tvk_sentiment_reports FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE auth_user_id = auth.uid()
    )
  );

-- MIGRATION 16: Sample sentiment data
-- =====================================================
-- Ensure we have an organization
INSERT INTO organizations (id, name, slug, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TVK Headquarters',
  'tvk-hq',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert 10 sample sentiment reports
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES
-- Today: Strong positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'daily',
 CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE,
 245, 198, 0.72, 'positive', 112, 58, 75, 45.7, 23.7, 30.6,
 ARRAY['TVK Launch', 'Vijay Leadership', 'Tamil Nadu Politics', 'Youth Movement'],
 ARRAY['TVK', 'Vijay', 'Politics', 'Tamil Nadu', 'Leadership'],
 ARRAY['The Hindu', 'Times of India', 'Dinamalar'], 'Infrastructure',
 0.08, 'improving',
 '{"joy": 0.45, "trust": 0.38, "anticipation": 0.52, "anger": 0.12, "sadness": 0.08}'::jsonb,
 NOW()),

-- 3 days ago: Moderate positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', 'daily',
 CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '3 days',
 198, 156, 0.64, 'positive', 89, 52, 57, 44.9, 26.3, 28.8,
 ARRAY['Jobs Creation', 'Economic Policy', 'TVK Vision'],
 ARRAY['Jobs', 'Economy', 'Development', 'TVK'],
 ARRAY['The Hindu', 'Indian Express', 'Deccan Chronicle'], 'Jobs',
 0.05, 'improving',
 '{"joy": 0.42, "trust": 0.35, "anticipation": 0.48, "anger": 0.15, "sadness": 0.11}'::jsonb,
 NOW() - INTERVAL '3 days'),

-- 7 days ago: Mixed sentiment
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', 'daily',
 CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '7 days',
 178, 142, 0.58, 'positive', 76, 58, 44, 42.7, 32.6, 24.7,
 ARRAY['Healthcare Reform', 'Education Policy', 'TVK Manifesto'],
 ARRAY['Healthcare', 'Education', 'Reform', 'Policy'],
 ARRAY['The Hindu', 'Times of India', 'The News Minute'], 'Health',
 -0.03, 'stable',
 '{"joy": 0.38, "trust": 0.32, "anticipation": 0.41, "anger": 0.22, "sadness": 0.15}'::jsonb,
 NOW() - INTERVAL '7 days'),

-- 10 days ago: Strong positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '10 days', 'daily',
 CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE - INTERVAL '10 days',
 212, 175, 0.68, 'positive', 98, 48, 66, 46.2, 22.6, 31.1,
 ARRAY['Infrastructure Development', 'Smart Cities', 'Digital Tamil Nadu'],
 ARRAY['Infrastructure', 'Development', 'Digital', 'Technology'],
 ARRAY['The Hindu', 'Business Line', 'Economic Times'], 'Infrastructure',
 0.12, 'improving',
 '{"joy": 0.46, "trust": 0.41, "anticipation": 0.55, "anger": 0.10, "sadness": 0.07}'::jsonb,
 NOW() - INTERVAL '10 days'),

-- 14 days ago: Moderate positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '14 days', 'daily',
 CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '14 days',
 189, 148, 0.61, 'positive', 82, 54, 53, 43.4, 28.6, 28.0,
 ARRAY['Education Reform', 'Skill Development', 'Youth Empowerment'],
 ARRAY['Education', 'Skills', 'Youth', 'Training'],
 ARRAY['The Hindu', 'Indian Express', 'The News Minute'], 'Education',
 0.04, 'stable',
 '{"joy": 0.40, "trust": 0.36, "anticipation": 0.45, "anger": 0.16, "sadness": 0.12}'::jsonb,
 NOW() - INTERVAL '14 days'),

-- 17 days ago: Slightly negative
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '17 days', 'daily',
 CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '17 days',
 156, 118, 0.38, 'negative', 52, 68, 36, 33.3, 43.6, 23.1,
 ARRAY['Controversy', 'Opposition Criticism', 'Policy Debate'],
 ARRAY['Controversy', 'Criticism', 'Debate', 'Opposition'],
 ARRAY['Times of India', 'The Hindu', 'Hindustan Times'], 'Law & Order',
 -0.15, 'declining',
 '{"joy": 0.22, "trust": 0.18, "anticipation": 0.28, "anger": 0.35, "sadness": 0.28}'::jsonb,
 NOW() - INTERVAL '17 days'),

-- 21 days ago: Neutral
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '21 days', 'daily',
 CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE - INTERVAL '21 days',
 172, 135, 0.51, 'neutral', 68, 58, 46, 39.5, 33.7, 26.7,
 ARRAY['Party Strategy', 'Alliance Talks', 'Political Analysis'],
 ARRAY['Strategy', 'Alliance', 'Politics', 'Analysis'],
 ARRAY['The Hindu', 'Indian Express', 'Times of India'], 'Infrastructure',
 0.02, 'stable',
 '{"joy": 0.32, "trust": 0.28, "anticipation": 0.35, "anger": 0.24, "sadness": 0.18}'::jsonb,
 NOW() - INTERVAL '21 days'),

-- 24 days ago: Positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '24 days', 'daily',
 CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '24 days',
 203, 168, 0.66, 'positive', 94, 51, 58, 46.3, 25.1, 28.6,
 ARRAY['Jobs Initiative', 'Startup Support', 'Economic Growth'],
 ARRAY['Jobs', 'Startup', 'Economy', 'Growth'],
 ARRAY['Economic Times', 'Business Line', 'The Hindu'], 'Jobs',
 0.09, 'improving',
 '{"joy": 0.44, "trust": 0.39, "anticipation": 0.51, "anger": 0.14, "sadness": 0.09}'::jsonb,
 NOW() - INTERVAL '24 days'),

-- 27 days ago: Moderate positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '27 days', 'daily',
 CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '27 days',
 185, 152, 0.59, 'positive', 78, 56, 51, 42.2, 30.3, 27.6,
 ARRAY['Healthcare Access', 'Medical Infrastructure', 'Public Health'],
 ARRAY['Healthcare', 'Medical', 'Health', 'Infrastructure'],
 ARRAY['The Hindu', 'Deccan Chronicle', 'The News Minute'], 'Health',
 0.06, 'stable',
 '{"joy": 0.39, "trust": 0.34, "anticipation": 0.43, "anger": 0.18, "sadness": 0.13}'::jsonb,
 NOW() - INTERVAL '27 days'),

-- 30 days ago: Positive
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '30 days', 'daily',
 CURRENT_DATE - INTERVAL '31 days', CURRENT_DATE - INTERVAL '30 days',
 221, 182, 0.70, 'positive', 105, 49, 67, 47.5, 22.2, 30.3,
 ARRAY['TVK Foundation', 'Party Launch', 'Vision Document', 'Grassroots Movement'],
 ARRAY['TVK', 'Launch', 'Vision', 'Movement', 'Vijay'],
 ARRAY['The Hindu', 'Times of India', 'Indian Express'], 'Infrastructure',
 0.11, 'improving',
 '{"joy": 0.48, "trust": 0.42, "anticipation": 0.56, "anger": 0.11, "sadness": 0.06}'::jsonb,
 NOW() - INTERVAL '30 days');

-- Verification
SELECT 'Migration completed successfully!' AS status,
       COUNT(*) AS total_sentiment_reports
FROM tvk_sentiment_reports;
