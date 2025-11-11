export interface SentimentData {
  issue: string;
  sentiment: number;
  polarity: 'positive' | 'negative' | 'neutral';
  intensity: number;
  emotion?: 'anger' | 'trust' | 'fear' | 'hope' | 'pride' | 'joy' | 'sadness' | 'surprise' | 'disgust';
  confidence: number;
  language: 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'te' | 'gu' | 'kn' | 'ml' | 'or' | 'pa';
  source: 'social_media' | 'survey' | 'field_report' | 'news' | 'direct_feedback';
  timestamp: Date;
  location?: {
    state: string;
    district?: string;
    ward?: string;
    coordinates?: [number, number];
  };
  demographic?: {
    age_group?: '18-25' | '26-35' | '36-45' | '46-55' | '55+';
    gender?: 'male' | 'female' | 'other';
    education?: 'primary' | 'secondary' | 'graduate' | 'postgraduate';
    income?: 'low' | 'middle' | 'high';
  };
}

export interface TrendData {
  date: string;
  jobs: number;
  infrastructure: number;
  health: number;
  education: number;
  lawOrder: number;
}

export interface CompetitorData {
  issue: string;
  candidateA: number;
  candidateB: number;
}

export interface HeatmapData {
  ward: string;
  issue: string;
  sentiment: number;
}

export interface InfluencerData {
  id: string;
  name: string;
  type: 'positive' | 'neutral' | 'critical';
  engagement: number;
  reach: number;
  platform: string;
}

export interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'sentiment_spike' | 'volume_surge' | 'crisis_detected' | 'trend_change' | 'competitor_activity';
  timestamp: Date;
  ward?: string;
  issue?: string;
  metrics: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    threshold: number;
  };
  recommendations?: string[];
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  assignee?: string;
  resolution_notes?: string;
}

export interface MediaSource {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'whatsapp' | 'news' | 'blog';
  url?: string;
  author: string;
  followers?: number;
  engagement: number;
  verified?: boolean;
}

export interface SocialPost {
  id: string;
  content: string;
  language: string;
  sentiment: SentimentData;
  source: MediaSource;
  timestamp: Date;
  engagement_metrics: {
    likes: number;
    shares: number;
    comments: number;
    reach?: number;
  };
  hashtags: string[];
  mentions: string[];
  location?: {
    coordinates: [number, number];
    place_name: string;
  };
}

export interface TrendingTopic {
  keyword: string;
  volume: number;
  growth_rate: number;
  sentiment_score: number;
  related_posts: string[];
  last_updated: Date;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_date: Date;
  target_demographics?: {
    age_groups: string[];
    locations: string[];
    sample_size: number;
  };
  results_summary?: {
    response_rate: number;
    confidence_level: number;
    margin_of_error: number;
  };
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'rating' | 'text' | 'yes_no';
  options?: string[];
  required: boolean;
  sentiment_analysis?: boolean;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_id: string;
  answers: { [question_id: string]: any };
  submitted_date: Date;
  location?: string;
  demographic_info?: {
    age_group: string;
    gender: string;
    education: string;
  };
}

export interface Recommendation {
  id: string;
  type: 'event' | 'messaging' | 'resource_allocation' | 'outreach' | 'crisis_response';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence_score: number;
  rationale: string;
  suggested_actions: string[];
  estimated_impact: 'low' | 'medium' | 'high';
  timeline: string;
  resources_required?: string[];
  target_audience?: string[];
  location?: string;
  generated_date: Date;
  status: 'pending' | 'reviewed' | 'approved' | 'implemented' | 'rejected';
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'coordinator' | 'surveyor' | 'social_monitor' | 'truth_team' | 'data_collector';
  assigned_area: {
    state: string;
    district?: string;
    ward?: string;
  };
  performance_metrics: {
    reports_submitted: number;
    accuracy_score: number;
    last_active: Date;
    total_hours: number;
  };
  skills: string[];
  status: 'active' | 'inactive' | 'suspended';
  joined_date: Date;
}

export interface FieldReport {
  id: string;
  volunteer_id: string;
  timestamp: Date;
  location: {
    coordinates: [number, number];
    address: string;
    ward: string;
  };
  report_type: 'daily_summary' | 'event_feedback' | 'issue_report' | 'competitor_activity';
  content: {
    positive_reactions: string[];
    negative_reactions: string[];
    key_issues: string[];
    crowd_size?: number;
    media_attachments?: string[];
    quotes?: string[];
  };
  verification_status: 'pending' | 'verified' | 'disputed';
  verified_by?: string;
  sentiment_analysis?: SentimentData;
}