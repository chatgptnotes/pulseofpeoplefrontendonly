-- ============================================================================
-- DUMMY SOCIAL MEDIA POSTS - Multi-Platform
-- Insert sample posts for Facebook, Instagram, Twitter for testing
-- ============================================================================

-- Insert 30 realistic social media posts with engagement metrics
INSERT INTO social_media_posts (
    platform,
    post_content,
    post_url,
    post_id,
    posted_at,
    reach,
    impressions,
    engagement_count,
    likes,
    shares,
    comments_count,
    sentiment_score,
    is_published,
    is_promoted,
    hashtags,
    mentions
) VALUES

-- Facebook Posts (15 posts)
-- Post 1: High engagement political post
('facebook',
'Breaking: Tamil Nadu Budget 2026 allocates ₹15,000 crores for education sector modernization. This historic investment will benefit over 45 lakh students across the state. #TamilNaduBudget2026 #Education #Development',
'https://facebook.com/TamilNaduStateNews/posts/123456',
'FB_123456',
NOW() - INTERVAL '2 hours',
125000, 150000, 16590,
12500, 3200, 890,
0.85, true, false,
'["TamilNaduBudget2026", "Education", "Development"]'::jsonb,
'[]'::jsonb),

-- Post 2: Youth engagement
('facebook',
'New Youth Employment Program launched! 50,000 job opportunities in technology sector. Apply now at careers.tn.gov.in #TNYouth #Employment #Technology',
'https://facebook.com/YouthTamilNaduNow/posts/234567',
'FB_234567',
NOW() - INTERVAL '5 hours',
180000, 220000, 25680,
19500, 4800, 1380,
0.92, true, true,
'["TNYouth", "Employment", "Technology", "Jobs"]'::jsonb,
'[]'::jsonb),

-- Post 3: Infrastructure update
('facebook',
'Chennai Metro Phase 3 construction begins! New routes will connect 15 major localities. Expected completion: 2027. #ChennaiMetro #Infrastructure #SmartCity',
'https://facebook.com/ChennaiMetroUpdate/posts/345678',
'FB_345678',
NOW() - INTERVAL '8 hours',
95000, 115000, 12450,
9800, 1850, 800,
0.78, true, false,
'["ChennaiMetro", "Infrastructure", "SmartCity", "Development"]'::jsonb,
'[]'::jsonb),

-- Post 4: Healthcare initiative
('facebook',
'Free health camps organized in 100 villages this week. Medical teams will provide checkups, medicines, and health education. #HealthForAll #TamilNadu #Healthcare',
'https://facebook.com/TNHealthDept/posts/456789',
'FB_456789',
NOW() - INTERVAL '12 hours',
67000, 82000, 8920,
7200, 1100, 620,
0.88, true, false,
'["HealthForAll", "TamilNadu", "Healthcare", "FreeHealthCamp"]'::jsonb,
'[]'::jsonb),

-- Post 5: Agriculture support
('facebook',
'₹5000 crore farm loan waiver approved! Over 10 lakh farmers to benefit. Registration starts next week. #FarmersFirst #Agriculture #TamilNadu',
'https://facebook.com/TNAgriDept/posts/567890',
'FB_567890',
NOW() - INTERVAL '1 day',
142000, 175000, 18450,
15200, 2800, 450,
0.72, true, true,
'["FarmersFirst", "Agriculture", "TamilNadu", "LoanWaiver"]'::jsonb,
'[]'::jsonb),

-- Post 6: Women empowerment
('facebook',
'Women Entrepreneurs Summit 2026: 5000+ women-led startups showcased. Chief Minister inaugurates event. #WomenPower #Entrepreneurship #TamilNadu',
'https://facebook.com/TNWomenDevelopment/posts/678901',
'FB_678901',
NOW() - INTERVAL '1 day 3 hours',
56000, 68000, 7340,
6100, 980, 260,
0.91, true, false,
'["WomenPower", "Entrepreneurship", "TamilNadu", "Startups"]'::jsonb,
'[]'::jsonb),

-- Post 7: Environmental initiative
('facebook',
'Plant 1 Crore Trees campaign: Target achieved! Thank you Tamil Nadu for making it green. Next target: 2 crore by 2027. #GreenTN #Environment #TreePlantation',
'https://facebook.com/TNForestDept/posts/789012',
'FB_789012',
NOW() - INTERVAL '1 day 8 hours',
89000, 105000, 11230,
9500, 1450, 280,
0.94, true, false,
'["GreenTN", "Environment", "TreePlantation", "ClimateAction"]'::jsonb,
'[]'::jsonb),

-- Post 8: Sports achievement
('facebook',
'Tamil Nadu athletes win 45 medals at National Games! Proud moment for the state. Complete list: tn.gov.in/sports #TamilNaduSports #NationalGames #Champions',
'https://facebook.com/TNSportsAuthority/posts/890123',
'FB_890123',
NOW() - INTERVAL '2 days',
112000, 138000, 15680,
13200, 2100, 380,
0.96, true, false,
'["TamilNaduSports", "NationalGames", "Champions", "ProudMoment"]'::jsonb,
'[]'::jsonb),

-- Post 9: Tech initiative
('facebook',
'Tamil Nadu becomes India''s top state for AI startups! 250+ AI companies operating in Chennai alone. #AIHub #TamilNadu #Technology #Innovation',
'https://facebook.com/TNTechPark/posts/901234',
'FB_901234',
NOW() - INTERVAL '2 days 5 hours',
78000, 94000, 10120,
8600, 1280, 240,
0.87, true, true,
'["AIHub", "TamilNadu", "Technology", "Innovation", "Startups"]'::jsonb,
'[]'::jsonb),

-- Post 10: Tourism promotion
('facebook',
'Explore Tamil Nadu: New tourism packages launched! Visit 10 UNESCO heritage sites with special discounts. Book now: tntourism.com #TamilNaduTourism #Heritage #Travel',
'https://facebook.com/TNTourism/posts/012345',
'FB_012345',
NOW() - INTERVAL '3 days',
65000, 78000, 8540,
7200, 1180, 160,
0.89, true, true,
'["TamilNaduTourism", "Heritage", "Travel", "UNESCO"]'::jsonb,
'[]'::jsonb),

-- Post 11: Negative sentiment - Opposition
('facebook',
'Concerned about rising power tariffs. Families struggling with increasing electricity bills. Government must reconsider. #PowerTariff #TamilNadu',
'https://facebook.com/TNOpposition/posts/112233',
'FB_112233',
NOW() - INTERVAL '3 days 8 hours',
142000, 180000, 24300,
18500, 5200, 600,
0.25, true, false,
'["PowerTariff", "TamilNadu", "ElectricityBills"]'::jsonb,
'[]'::jsonb),

-- Post 12: Public transport
('facebook',
'New electric buses launched in 15 cities! Tamil Nadu leads in green public transport. Fare: ₹5 for 10km. #ElectricBus #GreenTransport #TamilNadu',
'https://facebook.com/TNTransport/posts/223344',
'FB_223344',
NOW() - INTERVAL '4 days',
58000, 71000, 7650,
6500, 950, 200,
0.86, true, false,
'["ElectricBus", "GreenTransport", "TamilNadu", "PublicTransport"]'::jsonb,
'[]'::jsonb),

-- Post 13: Education tech
('facebook',
'Free tablets distributed to 5 lakh government school students. Digital education initiative reaches milestone. #DigitalEducation #TamilNadu #Technology',
'https://facebook.com/TNEducation/posts/334455',
'FB_334455',
NOW() - INTERVAL '4 days 12 hours',
102000, 125000, 13890,
11500, 2100, 290,
0.93, true, false,
'["DigitalEducation", "TamilNadu", "Technology", "Students"]'::jsonb,
'[]'::jsonb),

-- Post 14: Water management
('facebook',
'Rain water harvesting mandatory in all new buildings. Tamil Nadu sets example for water conservation. #WaterConservation #TamilNadu #Sustainability',
'https://facebook.com/TNWaterBoard/posts/445566',
'FB_445566',
NOW() - INTERVAL '5 days',
45000, 55000, 5920,
5100, 680, 140,
0.82, true, false,
'["WaterConservation", "TamilNadu", "Sustainability", "RainwaterHarvesting"]'::jsonb,
'[]'::jsonb),

-- Post 15: Cultural event
('facebook',
'Pongal Festival 2026: State-wide celebrations! Traditional games, cultural programs, and prizes worth ₹10 crore. #Pongal2026 #TamilNadu #Culture',
'https://facebook.com/TNCultural/posts/556677',
'FB_556677',
NOW() - INTERVAL '6 days',
198000, 245000, 28920,
24500, 3800, 620,
0.97, true, true,
'["Pongal2026", "TamilNadu", "Culture", "Festival"]'::jsonb,
'[]'::jsonb),

-- Instagram Posts (10 posts)
-- Post 16: Visual politics
('instagram',
'💪 Youth voices matter! Join the movement for change. Register to vote and make your voice heard. #YouthPower #TamilNadu #Vote2026',
'https://instagram.com/p/ABC123',
'IG_ABC123',
NOW() - INTERVAL '3 hours',
85000, 95000, 8950,
8200, 580, 170,
0.89, true, false,
'["YouthPower", "TamilNadu", "Vote2026", "Democracy"]'::jsonb,
'[]'::jsonb),

-- Post 17: Infrastructure visual
('instagram',
'🚇 New Chennai Metro stations opening soon! Swipe to see the amazing architecture. #ChennaiMetro #Infrastructure #ModernTN',
'https://instagram.com/p/DEF456',
'IG_DEF456',
NOW() - INTERVAL '7 hours',
62000, 72000, 6840,
6200, 480, 160,
0.91, true, false,
'["ChennaiMetro", "Infrastructure", "ModernTN"]'::jsonb,
'[]'::jsonb),

-- Post 18: Cultural heritage
('instagram',
'🛕 Explore the magnificent temples of Tamil Nadu. Tag someone you want to visit with! #TamilNaduTemples #Heritage #Culture',
'https://instagram.com/p/GHI789',
'IG_GHI789',
NOW() - INTERVAL '12 hours',
118000, 135000, 14560,
13200, 980, 380,
0.95, true, true,
'["TamilNaduTemples", "Heritage", "Culture", "Travel"]'::jsonb,
'[]'::jsonb),

-- Post 19: Food culture
('instagram',
'🍛 Authentic Tamil cuisine! Which is your favorite dish? Comment below! #TamilFood #SouthIndianCuisine #Foodie',
'https://instagram.com/p/JKL012',
'IG_JKL012',
NOW() - INTERVAL '1 day 2 hours',
92000, 105000, 11240,
10200, 720, 320,
0.93, true, false,
'["TamilFood", "SouthIndianCuisine", "Foodie", "IndianFood"]'::jsonb,
'[]'::jsonb),

-- Post 20: Environmental
('instagram',
'🌿 Marina Beach cleanup drive! 5000 volunteers collected 20 tons of waste. Be the change. #CleanTN #Environment #BeachCleanup',
'https://instagram.com/p/MNO345',
'IG_MNO345',
NOW() - INTERVAL '1 day 8 hours',
74000, 86000, 8920,
8100, 620, 200,
0.92, true, false,
'["CleanTN", "Environment", "BeachCleanup", "MarinaBeach"]'::jsonb,
'[]'::jsonb),

-- Post 21: Fashion
('instagram',
'👗 Traditional meets modern! Tamil fashion week highlights. #TamilFashion #TraditionalWear #FashionWeek',
'https://instagram.com/p/PQR678',
'IG_PQR678',
NOW() - INTERVAL '2 days',
58000, 67000, 7180,
6600, 420, 160,
0.88, true, false,
'["TamilFashion", "TraditionalWear", "FashionWeek"]'::jsonb,
'[]'::jsonb),

-- Post 22: Sports
('instagram',
'🏏 Local cricket league finals this weekend! Who''s your favorite team? #TNcricket #Sports #LocalHeroes',
'https://instagram.com/p/STU901',
'IG_STU901',
NOW() - INTERVAL '2 days 12 hours',
45000, 52000, 5460,
5000, 340, 120,
0.86, true, false,
'["TNcricket", "Sports", "LocalHeroes", "Cricket"]'::jsonb,
'[]'::jsonb),

-- Post 23: Education
('instagram',
'📚 Free online courses for all Tamil Nadu students! 100+ subjects available. Link in bio. #OnlineLearning #Education #SkillDevelopment',
'https://instagram.com/p/VWX234',
'IG_VWX234',
NOW() - INTERVAL '3 days',
67000, 78000, 8120,
7400, 580, 140,
0.90, true, false,
'["OnlineLearning", "Education", "SkillDevelopment", "FreeCourses"]'::jsonb,
'[]'::jsonb),

-- Post 24: Startup ecosystem
('instagram',
'🚀 Meet Tamil Nadu''s youngest entrepreneur! Started at 19, now running ₹50 crore company. Full story on our page. #Startups #Entrepreneur #Inspiration',
'https://instagram.com/p/YZA567',
'IG_YZA567',
NOW() - INTERVAL '3 days 8 hours',
95000, 110000, 11850,
10800, 850, 200,
0.94, true, true,
'["Startups", "Entrepreneur", "Inspiration", "Success"]'::jsonb,
'[]'::jsonb),

-- Post 25: Art and craft
('instagram',
'🎨 Traditional Tanjore paintings exhibition! Celebrating 500 years of art heritage. #TamilArt #TanjorePainting #Heritage',
'https://instagram.com/p/BCD890',
'IG_BCD890',
NOW() - INTERVAL '4 days',
51000, 59000, 6240,
5700, 410, 130,
0.87, true, false,
'["TamilArt", "TanjorePainting", "Heritage", "IndianArt"]'::jsonb,
'[]'::jsonb),

-- Twitter/X Posts (5 posts)
-- Post 26: Breaking news
('twitter',
'BREAKING: Tamil Nadu GDP growth rate hits 12.5% - highest in India! Manufacturing sector leads the surge. #TamilNadu #Economy #GDPGrowth',
'https://twitter.com/TNEconomy/status/123456789',
'TW_123456789',
NOW() - INTERVAL '1 hour',
256000, 310000, 35640,
28500, 6200, 940,
0.83, true, false,
'["TamilNadu", "Economy", "GDPGrowth", "India"]'::jsonb,
'[]'::jsonb),

-- Post 27: Policy announcement
('twitter',
'New Industrial Policy 2026 announced!
✅ Single-window clearance
✅ Tax incentives for 5 years
✅ 1 lakh new jobs expected
#TamilNaduIndustry #Policy #Jobs',
'https://twitter.com/TNIndustries/status/234567890',
'TW_234567890',
NOW() - INTERVAL '6 hours',
142000, 175000, 18920,
15200, 3100, 620,
0.88, true, true,
'["TamilNaduIndustry", "Policy", "Jobs", "Investment"]'::jsonb,
'[]'::jsonb),

-- Post 28: Critical issue
('twitter',
'Water scarcity in rural areas needs immediate attention. Government must act fast on alternative water sources. #WaterCrisis #TamilNadu',
'https://twitter.com/RuralVoices/status/345678901',
'TW_345678901',
NOW() - INTERVAL '10 hours',
178000, 225000, 29840,
22100, 7200, 540,
0.35, true, false,
'["WaterCrisis", "TamilNadu", "RuralIssues"]'::jsonb,
'[]'::jsonb),

-- Post 29: Achievement
('twitter',
'🎓 Tamil Nadu literacy rate reaches 85%! Highest among southern states. Education reforms showing results. #Education #TamilNadu #LiteracyRate',
'https://twitter.com/TNEducation/status/456789012',
'TW_456789012',
NOW() - INTERVAL '1 day 4 hours',
98000, 118000, 12680,
10500, 1850, 330,
0.91, true, false,
'["Education", "TamilNadu", "LiteracyRate", "Achievement"]'::jsonb,
'[]'::jsonb),

-- Post 30: Community engagement
('twitter',
'Join our town hall meeting tomorrow at 6 PM! Discuss local issues with elected representatives. Registration: tn.gov.in/townhall #CommunityFirst #TamilNadu #Democracy',
'https://twitter.com/TNGovt/status/567890123',
'TW_567890123',
NOW() - INTERVAL '2 days',
64000, 76000, 8240,
7100, 980, 160,
0.86, true, false,
'["CommunityFirst", "TamilNadu", "Democracy", "TownHall"]'::jsonb,
'[]'::jsonb);

-- Success message
SELECT 'Successfully inserted 30 social media posts (15 Facebook, 10 Instagram, 5 Twitter)' AS status;
