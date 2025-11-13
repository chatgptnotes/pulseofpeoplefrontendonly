# Voter Persona ML Module - Architecture Document

## Version 1.0 | 2025-11-13 | Pulse of People

## Overview

AI-powered voter persona analysis system using machine learning for psychographic segmentation, behavioral pattern analysis, and emotional cue detection.

## Core Capabilities

### 1. Multi-Source Data Aggregation
- Social media behavioral data
- Survey responses with personality labels
- Voting history and turnout patterns
- Demographic information
- Engagement metrics

### 2. ML Clustering & Classification
- K-Means clustering for voter segmentation
- Hierarchical clustering for nested segments
- Random Forest for feature importance
- Support for 8-12 distinct persona segments

### 3. Psychographic Profiling
- Big Five personality traits (OCEAN model)
  - Openness
  - Conscientiousness
  - Extraversion
  - Agreeableness
  - Neuroticism
- Values and beliefs mapping
- Communication preferences
- Persuasion susceptibility scoring

### 4. Behavioral Cue Detection
- Emotion detection (anger, fear, hope, disgust, joy)
- Linguistic pattern analysis
- Engagement timing patterns
- Social media behavioral signals

### 5. Real-Time Dashboard
- Interactive persona library
- Segment comparison matrix
- Geo-mapping with persona distribution
- Trend analysis and migration tracking
- Drill-down capabilities

## System Architecture

### Frontend (React + TypeScript + Vite)

```
src/
├── pages/
│   └── VoterPersonas/
│       ├── PersonaDashboard.tsx          # Main dashboard
│       ├── PersonaLibrary.tsx            # 8-12 persona cards
│       ├── PersonaComparison.tsx         # Side-by-side comparison
│       ├── PersonaGeoMap.tsx             # Geographic distribution
│       └── PersonaMigrationTracker.tsx   # Trend analysis
├── components/
│   └── personas/
│       ├── PersonaCard.tsx               # Individual persona display
│       ├── PersonalityRadar.tsx          # Big Five visualization
│       ├── EmotionDetector.tsx           # Emotion analysis UI
│       ├── PersuasionScoreGauge.tsx      # Score visualization
│       ├── BehavioralTimeline.tsx        # Activity patterns
│       └── AudienceExportDialog.tsx      # Export to ads platforms
├── services/
│   ├── personaService.ts                 # API calls
│   ├── mlClusteringService.ts            # ML operations
│   └── behavioralCueService.ts           # Cue detection
└── types/
    └── persona.ts                        # TypeScript definitions
```

### Backend (Supabase + PostgreSQL)

```sql
-- Voter personas table
CREATE TABLE voter_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  segment_key VARCHAR(50) UNIQUE,
  color VARCHAR(7), -- Hex color for visualization
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Psychographic profiles
CREATE TABLE psychographic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES voter_personas(id),
  openness FLOAT CHECK (openness BETWEEN 0 AND 1),
  conscientiousness FLOAT CHECK (conscientiousness BETWEEN 0 AND 1),
  extraversion FLOAT CHECK (extraversion BETWEEN 0 AND 1),
  agreeableness FLOAT CHECK (agreeableness BETWEEN 0 AND 1),
  neuroticism FLOAT CHECK (neuroticism BETWEEN 0 AND 1),
  values JSONB, -- Array of key values
  communication_preferences JSONB,
  persuasion_score FLOAT CHECK (persuasion_score BETWEEN 0 AND 100)
);

-- Voter persona assignments
CREATE TABLE voter_persona_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES voters(id),
  persona_id UUID REFERENCES voter_personas(id),
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  assigned_at TIMESTAMP DEFAULT NOW(),
  ml_model_version VARCHAR(20)
);

-- Behavioral cues
CREATE TABLE behavioral_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES voters(id),
  cue_type VARCHAR(50), -- emotion, linguistic, timing
  cue_value VARCHAR(100), -- anger, fear, hope, etc.
  intensity FLOAT CHECK (intensity BETWEEN 0 AND 1),
  source VARCHAR(100), -- social_media, survey, interaction
  detected_at TIMESTAMP DEFAULT NOW(),
  language VARCHAR(10) DEFAULT 'ta' -- Tamil support
);

-- Persona metrics (aggregated)
CREATE TABLE persona_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES voter_personas(id),
  metric_date DATE,
  total_voters INT,
  avg_turnout_propensity FLOAT,
  avg_donation_likelihood FLOAT,
  avg_volunteer_potential FLOAT,
  engagement_rate FLOAT,
  top_emotions JSONB,
  top_issues JSONB
);
```

### ML Pipeline (Python Edge Functions)

```python
# Supabase Edge Function: ml-clustering
# File: supabase/functions/ml-clustering/index.py

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from scipy.cluster.hierarchy import dendrogram, linkage

def cluster_voters(voter_data, n_clusters=10):
    """
    K-Means clustering for voter segmentation
    """
    features = extract_features(voter_data)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(features)
    return clusters, kmeans

def personality_analysis(survey_data):
    """
    Big Five personality trait analysis
    """
    # IPIP-NEO or similar questionnaire scoring
    traits = {
        'openness': calculate_openness(survey_data),
        'conscientiousness': calculate_conscientiousness(survey_data),
        'extraversion': calculate_extraversion(survey_data),
        'agreeableness': calculate_agreeableness(survey_data),
        'neuroticism': calculate_neuroticism(survey_data)
    }
    return traits
```

### Behavioral Cue Detection

```python
# Supabase Edge Function: behavioral-cues
# File: supabase/functions/behavioral-cues/index.py

from transformers import pipeline

# Emotion detection (multilingual - Tamil support)
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base"
)

def detect_emotions(text, language='ta'):
    """
    Detect emotions from text (Tamil/English)
    """
    # Tamil translation if needed
    if language == 'ta':
        text = translate_tamil_to_english(text)

    emotions = emotion_classifier(text)
    return emotions

def detect_linguistic_patterns(text):
    """
    Analyze linguistic patterns
    """
    patterns = {
        'urgency_words': count_urgency_indicators(text),
        'sentiment_polarity': get_sentiment(text),
        'formality_level': analyze_formality(text),
        'question_ratio': count_questions(text)
    }
    return patterns
```

## API Endpoints

### Persona Management
```typescript
GET    /api/personas                    // List all personas
GET    /api/personas/:id                // Get persona details
POST   /api/personas                    // Create new persona
PUT    /api/personas/:id                // Update persona
DELETE /api/personas/:id                // Delete persona

GET    /api/personas/:id/voters         // Voters in persona
GET    /api/personas/:id/metrics        // Persona metrics
GET    /api/personas/comparison         // Compare personas
```

### ML Operations
```typescript
POST   /api/ml/cluster                  // Run clustering algorithm
POST   /api/ml/classify                 // Classify single voter
POST   /api/ml/retrain                  // Retrain models
GET    /api/ml/model-metrics            // Model performance
```

### Behavioral Analysis
```typescript
POST   /api/behavioral/detect-emotion   // Detect emotions
POST   /api/behavioral/analyze-text     // Linguistic analysis
GET    /api/behavioral/cues/:voter_id   // Get voter cues
GET    /api/behavioral/trends           // Emotion trends
```

### Persuasion & Scoring
```typescript
GET    /api/scoring/persuasion/:voter_id  // Persuasion score
GET    /api/scoring/turnout/:voter_id     // Turnout propensity
GET    /api/scoring/donation/:voter_id    // Donation likelihood
GET    /api/scoring/volunteer/:voter_id   // Volunteer potential
```

### Export & Targeting
```typescript
POST   /api/export/facebook-audience    // Export to Facebook Ads
POST   /api/export/google-audience      // Export to Google Ads
GET    /api/export/personas/:id          // Export persona data
```

## Dashboard Features

### 1. Persona Library View
- Grid of 8-12 persona cards
- Each card shows:
  - Persona name & icon
  - Key characteristics
  - Voter count
  - Personality radar chart
  - Top emotions
  - Communication preferences

### 2. Comparison Matrix
- Side-by-side persona comparison
- Personality trait differences
- Behavioral pattern contrasts
- Messaging recommendations

### 3. Geographic Distribution
- Interactive map showing persona density
- Filter by region/constituency/booth
- Heat map overlay
- Drill-down to individual voters

### 4. Migration Tracking
- Persona movement over time
- Trigger identification
- Trend analysis
- Predictive modeling

### 5. Persuasion Dashboard
- Swing voter identification
- Persuasion score ranking
- Recommended outreach strategies
- A/B testing suggestions

## ML Model Details

### Clustering Algorithm
- **Primary**: K-Means (8-12 clusters)
- **Secondary**: Hierarchical clustering (dendrogram view)
- **Features**: 50+ behavioral & demographic attributes
- **Update Frequency**: Weekly or on-demand

### Classification Model
- **Algorithm**: Random Forest Classifier
- **Purpose**: Assign new voters to personas
- **Accuracy Target**: >85%
- **Features**: Same as clustering + temporal data

### Personality Model
- **Framework**: Big Five (OCEAN)
- **Input**: Survey responses (IPIP-NEO short form)
- **Output**: 5 trait scores (0-1 normalized)
- **Validation**: Expert Tamil psychologist review

### Emotion Detection
- **Model**: Multilingual transformer (Tamil support)
- **Emotions**: Anger, Fear, Hope, Disgust, Joy, Surprise, Sadness
- **Sources**: Social media, surveys, interactions
- **Real-time**: WebSocket updates

## Data Privacy & Compliance

### DPDP Act Compliance
- Explicit consent for behavioral tracking
- Data minimization principles
- Right to erasure implementation
- Anonymization for ML training
- Audit logging for all access

### Security Measures
- Row-level security (RLS) in Supabase
- Encrypted storage for sensitive data
- API rate limiting
- Role-based access control (RBAC)
- No biometric/genetic data collection

## Integration Points

### Existing Modules
- **Voter Database**: Source of voter records
- **Social Media Monitoring**: Behavioral data input
- **Survey System**: Personality questionnaire data
- **Analytics Engine**: Metrics aggregation
- **Sidebar Navigation**: New category "Data Intelligence > Personas"

### External Services
- **Facebook Ads API**: Audience export
- **Google Ads API**: Audience export
- **Hugging Face**: ML model inference
- **OpenAI**: Tamil language processing

## Performance Targets

- **ML Clustering**: <5 minutes for 100K voters
- **Real-time Classification**: <500ms per voter
- **Dashboard Load**: <2 seconds
- **Emotion Detection**: <1 second per text
- **Map Rendering**: <3 seconds with 10K points

## Deployment Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema creation
- [ ] Basic API endpoints
- [ ] Persona library UI
- [ ] Simple clustering (K-Means)

### Phase 2: ML Pipeline (Week 3-4)
- [ ] Advanced clustering algorithms
- [ ] Personality trait analysis
- [ ] Emotion detection integration
- [ ] Model training infrastructure

### Phase 3: Dashboard & Visualization (Week 5-6)
- [ ] Interactive persona cards
- [ ] Comparison matrix
- [ ] Geographic mapping
- [ ] Trend analysis

### Phase 4: Advanced Features (Week 7-8)
- [ ] Persuasion scoring
- [ ] Migration tracking
- [ ] Audience export
- [ ] Recommendation engine

### Phase 5: Testing & Optimization (Week 9-10)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation completion

## Success Metrics

- **Persona Accuracy**: >80% validated by domain experts
- **User Adoption**: 75% of campaigns using personas
- **Targeting Improvement**: 25%+ increase in engagement
- **Model Performance**: F1 score >0.85
- **System Uptime**: 99.5%

## Next Steps

1. Create database migrations
2. Set up ML edge functions
3. Build persona dashboard page
4. Integrate with existing data sources
5. Deploy to staging environment

---

**Version**: 1.0
**Last Updated**: 2025-11-13
**Repository**: pulseofpeoplefrontendonly
