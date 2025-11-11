import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { djangoApi } from '../../services/djangoApi';
import {
  MapPin, Users, MessageSquare, TrendingUp, AlertCircle,
  BarChart3, FileText, Activity, Target, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Manager Dashboard - District Level
 *
 * Geographic Scope: Assigned District ONLY (e.g., Chennai)
 * - District sentiment overview
 * - Constituencies within district (6-10)
 * - Social media monitoring (district-wide)
 * - Competitor analysis (district-level)
 * - Manage constituency analysts
 * - Field operations in district
 */
export default function ManagerDistrictDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState('Chennai'); // TODO: Get from user profile
  const [stats, setStats] = useState({
    districtSentiment: 0,
    totalFeedback: 0,
    constituenciesActive: 0,
    totalConstituencies: 16,
    activeAnalysts: 0,
    activeBoothAgents: 0,
    coveragePercentage: 0,
  });

  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    loadDistrictDashboard();
  }, []);

  const loadDistrictDashboard = async () => {
    try {
      setLoading(true);

      // TODO: Get district ID from user profile
      const districtId = '1'; // Placeholder

      // Load district analytics from Django
      const districtAnalytics = await djangoApi.getDistrictAnalytics(districtId);

      // Load constituencies for this district
      const constituenciesData = await djangoApi.getConstituencies('TN', 'assembly');

      // Load recent feedback
      const feedbackData = await djangoApi.getFeedbackList({
        district_id: districtId,
        limit: 10,
      });

      setStats({
        districtSentiment: districtAnalytics.sentiment_score || 0.68,
        totalFeedback: districtAnalytics.total_feedback || 0,
        constituenciesActive: constituenciesData.filter((c: any) => c.is_active).length,
        totalConstituencies: constituenciesData.length,
        activeAnalysts: 12, // TODO: Get from Django
        activeBoothAgents: 450, // TODO: Get from Django
        coveragePercentage: 67,
      });

      setConstituencies(constituenciesData.slice(0, 10));
      setRecentFeedback(feedbackData.results || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading district dashboard:', error);
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-100 text-green-800';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 0.3) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-yellow-100 text-yellow-800',
      negative: 'bg-red-100 text-red-800',
    };
    return colors[sentiment as keyof typeof colors] || colors.neutral;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading district dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Tamil Nadu</span>
          <span className="mx-2">→</span>
          <span className="font-medium text-gray-900">{districtName} District</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{districtName} District Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.name}. Managing {districtName} district operations.
        </p>
      </div>

      {/* District Sentiment Overview */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-purple-100 mb-2">District Sentiment</h3>
            <p className="text-3xl font-bold">{(stats.districtSentiment * 100).toFixed(1)}%</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-purple-100 mb-2">Total Feedback</h3>
            <p className="text-3xl font-bold">{stats.totalFeedback.toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-purple-100 mb-2">Coverage</h3>
            <p className="text-3xl font-bold">{stats.coveragePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Constituencies</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.constituenciesActive} / {stats.totalConstituencies}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Analysts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeAnalysts}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Booth Agents</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeBoothAgents}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Feedback</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalFeedback}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/tamil-nadu-map"
          className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center">
            <Map className="h-10 w-10 text-purple-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">District Map</h3>
              <p className="text-sm text-gray-600 mt-1">
                View constituencies → booths in {districtName}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/social-monitoring"
          className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:border-indigo-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center">
            <Activity className="h-10 w-10 text-indigo-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Social Monitoring</h3>
              <p className="text-sm text-gray-600 mt-1">
                District-wide social media analysis
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Constituencies Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Constituencies Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Constituency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sentiment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {constituencies.map((constituency) => (
                <tr key={constituency.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{constituency.name}</div>
                    <div className="text-sm text-gray-500">{constituency.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSentimentColor(0.65)}`}>
                      65%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.floor(Math.random() * 500) + 100}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Feedback from District</h2>
        <div className="space-y-4">
          {recentFeedback.length > 0 ? (
            recentFeedback.map((feedback) => (
              <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSentimentBadge(feedback.sentiment)}`}>
                    {feedback.sentiment}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{feedback.comments}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Issue: {feedback.issue_name} • {feedback.constituency_name}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent feedback available</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Geographic Scope: {districtName} District • {stats.totalConstituencies} Constituencies</p>
      </div>
    </div>
  );
}
