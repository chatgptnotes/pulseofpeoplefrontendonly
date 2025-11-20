-- Migration: Add sample sentiment data for testing
-- Date: 2025-11-20
-- Description: Inserts sample TVK sentiment reports for the last 30 days
--              Provides realistic data for testing the Reports preview functionality

-- Insert sample sentiment data for the last 30 days
-- Note: We'll use the first organization in the system, or create a default one

-- First, ensure we have an organization to work with
INSERT INTO organizations (id, name, slug, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'TVK Headquarters',
  'tvk-hq',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert 10 sample sentiment reports spanning the last 30 days
-- Report 1: Today - Strong positive sentiment
INSERT INTO tvk_sentiment_reports (
  organization_id,
  report_date,
  period_type,
  start_time,
  end_time,
  total_articles,
  tvk_mentioned_articles,
  overall_sentiment_score,
  overall_sentiment_polarity,
  positive_count,
  negative_count,
  neutral_count,
  positive_percentage,
  negative_percentage,
  neutral_percentage,
  trending_topics,
  top_keywords,
  top_sources,
  top_issue,
  sentiment_change,
  trend_direction,
  emotion_scores,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  'daily',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE,
  245,
  198,
  0.72,
  'positive',
  112,
  58,
  75,
  45.7,
  23.7,
  30.6,
  ARRAY['TVK Launch', 'Vijay Leadership', 'Tamil Nadu Politics', 'Youth Movement'],
  ARRAY['TVK', 'Vijay', 'Politics', 'Tamil Nadu', 'Leadership'],
  ARRAY['The Hindu', 'Times of India', 'Dinamalar'],
  'Infrastructure',
  0.08,
  'improving',
  '{"joy": 0.45, "trust": 0.38, "anticipation": 0.52, "anger": 0.12, "sadness": 0.08}'::jsonb,
  NOW()
);

-- Report 2: 3 days ago - Moderate positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '3 days',
  'daily',
  CURRENT_DATE - INTERVAL '4 days',
  CURRENT_DATE - INTERVAL '3 days',
  198,
  156,
  0.64,
  'positive',
  89,
  52,
  57,
  44.9,
  26.3,
  28.8,
  ARRAY['Jobs Creation', 'Economic Policy', 'TVK Vision'],
  ARRAY['Jobs', 'Economy', 'Development', 'TVK'],
  ARRAY['The Hindu', 'Indian Express', 'Deccan Chronicle'],
  'Jobs',
  0.05,
  'improving',
  '{"joy": 0.42, "trust": 0.35, "anticipation": 0.48, "anger": 0.15, "sadness": 0.11}'::jsonb,
  NOW() - INTERVAL '3 days'
);

-- Report 3: 7 days ago - Mixed sentiment
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '7 days',
  'daily',
  CURRENT_DATE - INTERVAL '8 days',
  CURRENT_DATE - INTERVAL '7 days',
  178,
  142,
  0.58,
  'positive',
  76,
  58,
  44,
  42.7,
  32.6,
  24.7,
  ARRAY['Healthcare Reform', 'Education Policy', 'TVK Manifesto'],
  ARRAY['Healthcare', 'Education', 'Reform', 'Policy'],
  ARRAY['The Hindu', 'Times of India', 'The News Minute'],
  'Health',
  -0.03,
  'stable',
  '{"joy": 0.38, "trust": 0.32, "anticipation": 0.41, "anger": 0.22, "sadness": 0.15}'::jsonb,
  NOW() - INTERVAL '7 days'
);

-- Report 4: 10 days ago - Strong positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '10 days',
  'daily',
  CURRENT_DATE - INTERVAL '11 days',
  CURRENT_DATE - INTERVAL '10 days',
  212,
  175,
  0.68,
  'positive',
  98,
  48,
  66,
  46.2,
  22.6,
  31.1,
  ARRAY['Infrastructure Development', 'Smart Cities', 'Digital Tamil Nadu'],
  ARRAY['Infrastructure', 'Development', 'Digital', 'Technology'],
  ARRAY['The Hindu', 'Business Line', 'Economic Times'],
  'Infrastructure',
  0.12,
  'improving',
  '{"joy": 0.46, "trust": 0.41, "anticipation": 0.55, "anger": 0.10, "sadness": 0.07}'::jsonb,
  NOW() - INTERVAL '10 days'
);

-- Report 5: 14 days ago - Moderate positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '14 days',
  'daily',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE - INTERVAL '14 days',
  189,
  148,
  0.61,
  'positive',
  82,
  54,
  53,
  43.4,
  28.6,
  28.0,
  ARRAY['Education Reform', 'Skill Development', 'Youth Empowerment'],
  ARRAY['Education', 'Skills', 'Youth', 'Training'],
  ARRAY['The Hindu', 'Indian Express', 'The News Minute'],
  'Education',
  0.04,
  'stable',
  '{"joy": 0.40, "trust": 0.36, "anticipation": 0.45, "anger": 0.16, "sadness": 0.12}'::jsonb,
  NOW() - INTERVAL '14 days'
);

-- Report 6: 17 days ago - Slightly negative
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '17 days',
  'daily',
  CURRENT_DATE - INTERVAL '18 days',
  CURRENT_DATE - INTERVAL '17 days',
  156,
  118,
  0.38,
  'negative',
  52,
  68,
  36,
  33.3,
  43.6,
  23.1,
  ARRAY['Controversy', 'Opposition Criticism', 'Policy Debate'],
  ARRAY['Controversy', 'Criticism', 'Debate', 'Opposition'],
  ARRAY['Times of India', 'The Hindu', 'Hindustan Times'],
  'Law & Order',
  -0.15,
  'declining',
  '{"joy": 0.22, "trust": 0.18, "anticipation": 0.28, "anger": 0.35, "sadness": 0.28}'::jsonb,
  NOW() - INTERVAL '17 days'
);

-- Report 7: 21 days ago - Neutral
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '21 days',
  'daily',
  CURRENT_DATE - INTERVAL '22 days',
  CURRENT_DATE - INTERVAL '21 days',
  172,
  135,
  0.51,
  'neutral',
  68,
  58,
  46,
  39.5,
  33.7,
  26.7,
  ARRAY['Party Strategy', 'Alliance Talks', 'Political Analysis'],
  ARRAY['Strategy', 'Alliance', 'Politics', 'Analysis'],
  ARRAY['The Hindu', 'Indian Express', 'Times of India'],
  'Infrastructure',
  0.02,
  'stable',
  '{"joy": 0.32, "trust": 0.28, "anticipation": 0.35, "anger": 0.24, "sadness": 0.18}'::jsonb,
  NOW() - INTERVAL '21 days'
);

-- Report 8: 24 days ago - Positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '24 days',
  'daily',
  CURRENT_DATE - INTERVAL '25 days',
  CURRENT_DATE - INTERVAL '24 days',
  203,
  168,
  0.66,
  'positive',
  94,
  51,
  58,
  46.3,
  25.1,
  28.6,
  ARRAY['Jobs Initiative', 'Startup Support', 'Economic Growth'],
  ARRAY['Jobs', 'Startup', 'Economy', 'Growth'],
  ARRAY['Economic Times', 'Business Line', 'The Hindu'],
  'Jobs',
  0.09,
  'improving',
  '{"joy": 0.44, "trust": 0.39, "anticipation": 0.51, "anger": 0.14, "sadness": 0.09}'::jsonb,
  NOW() - INTERVAL '24 days'
);

-- Report 9: 27 days ago - Moderate positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '27 days',
  'daily',
  CURRENT_DATE - INTERVAL '28 days',
  CURRENT_DATE - INTERVAL '27 days',
  185,
  152,
  0.59,
  'positive',
  78,
  56,
  51,
  42.2,
  30.3,
  27.6,
  ARRAY['Healthcare Access', 'Medical Infrastructure', 'Public Health'],
  ARRAY['Healthcare', 'Medical', 'Health', 'Infrastructure'],
  ARRAY['The Hindu', 'Deccan Chronicle', 'The News Minute'],
  'Health',
  0.06,
  'stable',
  '{"joy": 0.39, "trust": 0.34, "anticipation": 0.43, "anger": 0.18, "sadness": 0.13}'::jsonb,
  NOW() - INTERVAL '27 days'
);

-- Report 10: 30 days ago - Positive
INSERT INTO tvk_sentiment_reports (
  organization_id, report_date, period_type, start_time, end_time,
  total_articles, tvk_mentioned_articles, overall_sentiment_score, overall_sentiment_polarity,
  positive_count, negative_count, neutral_count,
  positive_percentage, negative_percentage, neutral_percentage,
  trending_topics, top_keywords, top_sources, top_issue,
  sentiment_change, trend_direction, emotion_scores, created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '30 days',
  'daily',
  CURRENT_DATE - INTERVAL '31 days',
  CURRENT_DATE - INTERVAL '30 days',
  221,
  182,
  0.70,
  'positive',
  105,
  49,
  67,
  47.5,
  22.2,
  30.3,
  ARRAY['TVK Foundation', 'Party Launch', 'Vision Document', 'Grassroots Movement'],
  ARRAY['TVK', 'Launch', 'Vision', 'Movement', 'Vijay'],
  ARRAY['The Hindu', 'Times of India', 'Indian Express'],
  'Infrastructure',
  0.11,
  'improving',
  '{"joy": 0.48, "trust": 0.42, "anticipation": 0.56, "anger": 0.11, "sadness": 0.06}'::jsonb,
  NOW() - INTERVAL '30 days'
);

-- Verify the data was inserted
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM tvk_sentiment_reports;
  RAISE NOTICE 'Total sentiment reports in database: %', row_count;
END $$;
