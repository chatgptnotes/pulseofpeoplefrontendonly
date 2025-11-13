/**
 * Social Media Service
 * Handles all social media posts database operations
 */

import { supabase } from '../../lib/supabase';

export interface SocialMediaPost {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'youtube';
  post_content: string;
  post_url?: string;
  post_id?: string;
  posted_at: string;
  scheduled_at?: string;
  reach: number;
  impressions: number;
  engagement_count: number;
  likes: number;
  shares: number;
  comments_count: number;
  sentiment_score: number;
  campaign_id?: string;
  posted_by?: string;
  is_published: boolean;
  is_promoted: boolean;
  hashtags: string[];
  mentions: string[];
  created_at: string;
  updated_at: string;
}

export interface PostFilters {
  platform?: string[];
  startDate?: string;
  endDate?: string;
  minEngagement?: number;
  sentimentRange?: { min: number; max: number };
  isPublished?: boolean;
  isPromoted?: boolean;
}

export interface PostStats {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  byPlatform: {
    [platform: string]: {
      count: number;
      reach: number;
      engagement: number;
    };
  };
  bySentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface HashtagStats {
  hashtag: string;
  count: number;
  totalReach: number;
  totalEngagement: number;
  avgSentiment: number;
}

class SocialMediaService {
  /**
   * Fetch all social media posts with optional filters
   */
  async fetchPosts(filters?: PostFilters, limit: number = 50): Promise<SocialMediaPost[]> {
    try {
      let query = supabase
        .from('social_media_posts')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters?.platform && filters.platform.length > 0) {
        query = query.in('platform', filters.platform);
      }

      if (filters?.startDate) {
        query = query.gte('posted_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('posted_at', filters.endDate);
      }

      if (filters?.minEngagement) {
        query = query.gte('engagement_count', filters.minEngagement);
      }

      if (filters?.sentimentRange) {
        query = query
          .gte('sentiment_score', filters.sentimentRange.min)
          .lte('sentiment_score', filters.sentimentRange.max);
      }

      if (filters?.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }

      if (filters?.isPromoted !== undefined) {
        query = query.eq('is_promoted', filters.isPromoted);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching social media posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      return [];
    }
  }

  /**
   * Fetch posts by specific platform
   */
  async fetchPostsByPlatform(platform: string, limit: number = 50): Promise<SocialMediaPost[]> {
    return this.fetchPosts({ platform: [platform] }, limit);
  }

  /**
   * Search posts by content or hashtags
   */
  async searchPosts(searchTerm: string): Promise<SocialMediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .or(`post_content.ilike.%${searchTerm}%,hashtags.cs.["${searchTerm}"]`)
        .order('posted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchPosts:', error);
      return [];
    }
  }

  /**
   * Get aggregate statistics for posts
   */
  async fetchPostStats(filters?: PostFilters): Promise<PostStats> {
    try {
      const posts = await this.fetchPosts(filters, 1000); // Fetch more for accurate stats

      const stats: PostStats = {
        totalPosts: posts.length,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        byPlatform: {},
        bySentiment: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
      };

      posts.forEach((post) => {
        // Total metrics
        stats.totalReach += post.reach || 0;
        stats.totalEngagement += post.engagement_count || 0;

        // Platform breakdown
        if (!stats.byPlatform[post.platform]) {
          stats.byPlatform[post.platform] = {
            count: 0,
            reach: 0,
            engagement: 0,
          };
        }
        stats.byPlatform[post.platform].count += 1;
        stats.byPlatform[post.platform].reach += post.reach || 0;
        stats.byPlatform[post.platform].engagement += post.engagement_count || 0;

        // Sentiment breakdown
        if (post.sentiment_score >= 0.7) {
          stats.bySentiment.positive += 1;
        } else if (post.sentiment_score >= 0.4) {
          stats.bySentiment.neutral += 1;
        } else {
          stats.bySentiment.negative += 1;
        }
      });

      // Calculate average engagement rate
      if (stats.totalReach > 0) {
        stats.avgEngagementRate = (stats.totalEngagement / stats.totalReach) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching post stats:', error);
      return {
        totalPosts: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        byPlatform: {},
        bySentiment: { positive: 0, neutral: 0, negative: 0 },
      };
    }
  }

  /**
   * Get trending hashtags with statistics
   */
  async fetchTrendingHashtags(limit: number = 10): Promise<HashtagStats[]> {
    try {
      const posts = await this.fetchPosts(undefined, 500);

      const hashtagMap: { [key: string]: HashtagStats } = {};

      posts.forEach((post) => {
        const hashtags = post.hashtags || [];
        hashtags.forEach((tag) => {
          if (!hashtagMap[tag]) {
            hashtagMap[tag] = {
              hashtag: tag,
              count: 0,
              totalReach: 0,
              totalEngagement: 0,
              avgSentiment: 0,
            };
          }
          hashtagMap[tag].count += 1;
          hashtagMap[tag].totalReach += post.reach || 0;
          hashtagMap[tag].totalEngagement += post.engagement_count || 0;
          hashtagMap[tag].avgSentiment += post.sentiment_score || 0;
        });
      });

      // Calculate average sentiment and sort by count
      const trendingHashtags = Object.values(hashtagMap)
        .map((tag) => ({
          ...tag,
          avgSentiment: tag.count > 0 ? tag.avgSentiment / tag.count : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return trendingHashtags;
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return [];
    }
  }

  /**
   * Get posts by hashtag
   */
  async fetchPostsByHashtag(hashtag: string): Promise<SocialMediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .contains('hashtags', [hashtag])
        .order('posted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts by hashtag:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchPostsByHashtag:', error);
      return [];
    }
  }

  /**
   * Get recent posts (last 24 hours)
   */
  async fetchRecentPosts(hours: number = 24): Promise<SocialMediaPost[]> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      return this.fetchPosts(
        {
          startDate: startDate.toISOString(),
        },
        100
      );
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      return [];
    }
  }

  /**
   * Calculate engagement rate for a post
   */
  calculateEngagementRate(post: SocialMediaPost): number {
    if (post.reach === 0) return 0;
    return (post.engagement_count / post.reach) * 100;
  }

  /**
   * Calculate influence score (engagement + reach weighted)
   */
  calculateInfluenceScore(post: SocialMediaPost): number {
    const engagementWeight = 0.7;
    const reachWeight = 0.3;

    const maxEngagement = 50000; // Normalize to max expected
    const maxReach = 500000;

    const normalizedEngagement = Math.min(post.engagement_count / maxEngagement, 1);
    const normalizedReach = Math.min(post.reach / maxReach, 1);

    return Math.round(
      (normalizedEngagement * engagementWeight + normalizedReach * reachWeight) * 100
    );
  }

  /**
   * Calculate viral score (shares + reach weighted)
   */
  calculateViralScore(post: SocialMediaPost): number {
    const sharesWeight = 0.6;
    const reachWeight = 0.4;

    const maxShares = 10000;
    const maxReach = 500000;

    const normalizedShares = Math.min(post.shares / maxShares, 1);
    const normalizedReach = Math.min(post.reach / maxReach, 1);

    return Math.round((normalizedShares * sharesWeight + normalizedReach * reachWeight) * 100);
  }

  /**
   * Get sentiment label from score
   */
  getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
    if (score >= 0.7) return 'positive';
    if (score >= 0.4) return 'neutral';
    return 'negative';
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();

// Export class for testing
export { SocialMediaService };
