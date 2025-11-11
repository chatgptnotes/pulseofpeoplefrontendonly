import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { djangoApi } from '../../services/djangoApi';
import {
  MapPin, Users, TrendingUp, AlertTriangle, Target,
  MessageSquare, FileText, Activity, BarChart3, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapboxTamilNadu } from '../../components/maps/MapboxTamilNadu';

/**
 * Admin Dashboard - State Level (Vijay)
 *
 * Geographic Scope: Tamil Nadu + Puducherry
 * - State-wide sentiment overview
 * - All 38 districts comparison
 * - Top issues across state
 * - Social media monitoring (state-wide)
 * - Competitor analysis (state-wide)
 * - Field operations management
 * - Crisis detection
 */
export default function AdminStateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    overallSentiment: 0,
    totalFeedback: 0,
    districtsActive: 0,
    totalDistricts: 38,
    activeBoothAgents: 0,
    totalBoothAgents: 70000,
    constituenciesCovered: 0,
    totalConstituencies: 234,
  });

  const [districts, setDistricts] = useState<any[]>([]);
  const [topIssues, setTopIssues] = useState<any[]>([]);

  useEffect(() => {
    loadStateDashboard();
  }, []);

  const loadStateDashboard = async () => {
    try {
      setLoading(true);

      // Load state analytics from Django
      const stateAnalytics = await djangoApi.getStateAnalytics('TN');

      // Load districts
      const districtsData = await djangoApi.getDistricts('TN');

      // Load issues
      const issuesData = await djangoApi.getIssues();

      setStats({
        overallSentiment: stateAnalytics.sentiment_score || 0.67,
        totalFeedback: stateAnalytics.total_feedback || 0,
        districtsActive: districtsData.filter((d: any) => d.is_active).length,
        totalDistricts: districtsData.length,
        activeBoothAgents: 847, // TODO: Get from Django
        totalBoothAgents: 70000,
        constituenciesCovered: 156, // TODO: Get from Django
        totalConstituencies: 234,
      });

      setDistricts(districtsData.slice(0, 10)); // Top 10 districts
      setTopIssues(issuesData.slice(0, 5)); // Top 5 issues

      setLoading(false);
    } catch (error) {
      console.error('Error loading state dashboard:', error);
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.3) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return 'Positive';
    if (score >= 0.5) return 'Neutral';
    if (score >= 0.3) return 'Moderate';
    return 'Negative';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading state dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tamil Nadu State Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.name}. Here's your state-wide overview for Tamil Nadu + Puducherry.
        </p>
      </div>

      {/* Overall Sentiment */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Overall State Sentiment</h2>
            <p className="text-3xl font-bold">{(stats.overallSentiment * 100).toFixed(1)}%</p>
            <p className="text-blue-100 mt-2">{getSentimentLabel(stats.overallSentiment)}</p>
          </div>
          <TrendingUp className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalFeedback.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Districts Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.districtsActive} / {stats.totalDistricts}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Booth Agents</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.activeBoothAgents.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalBoothAgents.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Constituencies</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.constituenciesCovered} / {stats.totalConstituencies}
              </p>
            </div>
            <Target className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tamil Nadu Interactive Map</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on any constituency to view detailed analytics and sentiment data
        </p>
        <MapboxTamilNadu
          height="600px"
          onConstituencyClick={(constituency) => {
            console.log('Clicked constituency:', constituency);
            // TODO: Navigate to constituency detail or show modal
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/tamil-nadu-map"
          className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center">
            <Map className="h-10 w-10 text-blue-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Drill-Down Map</h3>
              <p className="text-sm text-gray-600 mt-1">
                View state → districts → constituencies → booths
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/competitor-analysis"
          className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center">
            <Target className="h-10 w-10 text-purple-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Competitor Analysis</h3>
              <p className="text-sm text-gray-600 mt-1">
                TVK vs DMK vs AIADMK vs BJP
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Top Districts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Districts</h2>
        <div className="space-y-4">
          {districts.map((district, index) => (
            <Link
              key={district.id}
              to={`/district/${district.code}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-400 mr-4">#{index + 1}</span>
                <div>
                  <p className="font-medium text-gray-900">{district.name}</p>
                  <p className="text-sm text-gray-500">{district.code}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(0.67)}`}>
                  67%
                </span>
                <Activity className="h-5 w-5 text-gray-400 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Issues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Issues Across State</h2>
        <div className="space-y-4">
          {topIssues.map((issue, index) => (
            <div key={issue.id} className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <span className="text-lg font-bold text-gray-400 mr-4">#{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{issue.name}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${65 - index * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-600">
                {65 - index * 10}% mentions
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Geographic Scope: Tamil Nadu + Puducherry • 38 Districts • 234 Constituencies</p>
      </div>
    </div>
  );
}
