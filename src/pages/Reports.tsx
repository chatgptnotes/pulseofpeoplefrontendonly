import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useSentimentData, useTrendData, useCompetitorData } from '../hooks/useSentimentData';
import { generatePDFReport, generateExcelReport, generateCSVReport, saveReportMetadata } from '../services/reportGenerator';
import { TIME_RANGES, EXPORT_FORMATS } from '../utils/constants';
import { supabase } from '../lib/supabase';

interface ReportFilters {
  timeRange: string;
  issues: string[];
  regions: string[];
  format: 'pdf' | 'excel' | 'csv';
}

interface SentimentPreviewData {
  overallSentiment: number;
  polarity: string;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalArticles: number;
  trendingTopics: string[];
  topIssue: string | null;
  sentimentChange: number | null;
  trendDirection: string | null;
  reportDate: string;
}

export default function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({
    timeRange: '30d',
    issues: [],
    regions: [],
    format: 'pdf'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState('sentiment');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [activeView, setActiveView] = useState<'generate' | 'all-sentiment'>('generate');
  const [allSentimentReports, setAllSentimentReports] = useState<any[]>([]);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);
  const [sentimentFilters, setSentimentFilters] = useState({
    timeRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [previewData, setPreviewData] = useState<SentimentPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { data: sentimentData } = useSentimentData();
  const { data: trendData } = useTrendData(filters.timeRange);
  const { data: competitorData } = useCompetitorData();

  // Fetch recent reports on mount
  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Fetch all sentiment reports when view changes
  useEffect(() => {
    if (activeView === 'all-sentiment') {
      fetchAllSentimentReports();
    }
  }, [activeView, sentimentFilters]);

  // Fetch preview data when filters change or report type changes
  useEffect(() => {
    if (activeView === 'generate' && activeReport === 'sentiment') {
      fetchPreviewData();
    }
  }, [filters.timeRange, activeReport, activeView]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchRecentReports = async () => {
    try {
      setIsLoadingReports(true);
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*, created_by_user:users(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent reports:', error);
      } else {
        setRecentReports(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchAllSentimentReports = async () => {
    try {
      setIsLoadingSentiment(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      if (sentimentFilters.timeRange !== 'all') {
        switch (sentimentFilters.timeRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }
      } else {
        startDate.setFullYear(2020, 0, 1);
      }

      let query = supabase
        .from('tvk_sentiment_reports')
        .select('*');

      if (sentimentFilters.timeRange !== 'all') {
        query = query
          .gte('report_date', startDate.toISOString().split('T')[0])
          .lte('report_date', endDate.toISOString().split('T')[0]);
      }

      // Apply sorting
      const sortColumn = sentimentFilters.sortBy === 'date' ? 'report_date' :
                        sentimentFilters.sortBy === 'sentiment' ? 'overall_sentiment_score' :
                        'report_date';

      query = query.order(sortColumn, { ascending: sentimentFilters.sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching sentiment reports:', error);
        setError('Failed to load sentiment reports');
      } else {
        setAllSentimentReports(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch sentiment reports:', err);
      setError('Failed to load sentiment reports');
    } finally {
      setIsLoadingSentiment(false);
    }
  };

  const fetchPreviewData = async () => {
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);

      // Calculate date range based on filters
      const endDate = new Date();
      const startDate = new Date();

      switch (filters.timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Query tvk_sentiment_reports with filters
      let query = supabase
        .from('tvk_sentiment_reports')
        .select('*')
        .gte('report_date', startDate.toISOString().split('T')[0])
        .lte('report_date', endDate.toISOString().split('T')[0])
        .order('report_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching preview data:', error);
        setPreviewError('Failed to load preview data');
        return;
      }

      if (!data || data.length === 0) {
        setPreviewError('No sentiment data available for the selected period');
        setPreviewData(null);
        return;
      }

      // Use the most recent report for preview
      const latestReport = data[0];

      // Transform to preview format
      const preview: SentimentPreviewData = {
        overallSentiment: latestReport.overall_sentiment_score || 0,
        polarity: latestReport.overall_sentiment_polarity || 'neutral',
        positivePercentage: latestReport.positive_percentage || 0,
        negativePercentage: latestReport.negative_percentage || 0,
        neutralPercentage: latestReport.neutral_percentage || 0,
        positiveCount: latestReport.positive_count || 0,
        negativeCount: latestReport.negative_count || 0,
        neutralCount: latestReport.neutral_count || 0,
        totalArticles: latestReport.total_articles || 0,
        trendingTopics: latestReport.trending_topics || [],
        topIssue: latestReport.top_issue || null,
        sentimentChange: latestReport.sentiment_change || null,
        trendDirection: latestReport.trend_direction || null,
        reportDate: latestReport.report_date
      };

      setPreviewData(preview);
    } catch (err) {
      console.error('Failed to fetch preview data:', err);
      setPreviewError('Failed to load preview data');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const reportTypes = [
    {
      id: 'sentiment',
      title: 'Sentiment Analysis Report',
      description: 'Comprehensive analysis of public sentiment across all issues',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'trends',
      title: 'Trend Analysis Report', 
      description: 'Historical trends and patterns in sentiment over time',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'competitor',
      title: 'Competitive Analysis Report',
      description: 'Comparison with competitors across key issues',
      icon: PieChart,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'regional',
      title: 'Regional Analysis Report',
      description: 'Geographic breakdown of sentiment by region',
      icon: FileText,
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const reportFilters = {
        ...filters,
        reportType: activeReport
      };

      let blob: Blob | null = null;
      let fileExtension = '';

      // Generate report based on format
      if (filters.format === 'csv') {
        await generateCSVReport(reportFilters);
        // CSV is downloaded directly by the utility
        setSuccess('CSV report generated and downloaded successfully!');
      } else if (filters.format === 'pdf') {
        blob = await generatePDFReport(reportFilters);
        fileExtension = 'pdf';
      } else if (filters.format === 'excel') {
        blob = await generateExcelReport(reportFilters);
        fileExtension = 'xlsx';
      }

      // Download the file if it's PDF or Excel
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess(`${filters.format.toUpperCase()} report generated and downloaded successfully!`);

        // Save report metadata
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user?.id)
          .single();

        await saveReportMetadata(reportFilters, blob.size, userData?.id);

        // Refresh recent reports
        fetchRecentReports();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateFilter = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getReportTitle = (reportType: string): string => {
    switch (reportType) {
      case 'sentiment':
        return 'Sentiment Analysis Report';
      case 'trends':
        return 'Trend Analysis Report';
      case 'competitor':
        return 'Competitive Analysis Report';
      case 'regional':
        return 'Regional Analysis Report';
      default:
        return 'Report';
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${kb.toFixed(0)} KB`;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setActiveView('generate')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'generate'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Generate Reports
        </button>
        <button
          onClick={() => setActiveView('all-sentiment')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'all-sentiment'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          All Sentiment Reports
        </button>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 text-green-500 hover:bg-green-100"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 text-red-500 hover:bg-red-100"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Generate Reports View */}
      {activeView === 'generate' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate detailed reports and export data</p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map(report => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                    activeReport === report.id
                      ? report.color + ' border-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <report.icon className={`w-6 h-6 mr-3 mt-1 ${
                      activeReport === report.id ? '' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Report Preview</h4>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                {activeReport === 'sentiment' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">Sentiment Analysis Summary</h5>
                      {previewData && (
                        <span className="text-xs text-gray-500">
                          Data as of {new Date(previewData.reportDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {isLoadingPreview ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-gray-600 mt-2">Loading sentiment data...</p>
                      </div>
                    ) : previewError ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-600">{previewError}</p>
                      </div>
                    ) : previewData ? (
                      <>
                        {/* Overall Sentiment Score */}
                        <div className="bg-white p-4 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Overall Sentiment</span>
                            <div className="flex items-center gap-2">
                              {previewData.trendDirection && (
                                <span className={`text-xs ${
                                  previewData.trendDirection === 'improving' ? 'text-green-600' :
                                  previewData.trendDirection === 'declining' ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {previewData.trendDirection === 'improving' ? '↑' :
                                   previewData.trendDirection === 'declining' ? '↓' : '→'}
                                </span>
                              )}
                              <span className={`text-2xl font-bold ${
                                previewData.overallSentiment >= 0.6 ? 'text-green-600' :
                                previewData.overallSentiment >= 0.4 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {(previewData.overallSentiment * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              previewData.polarity === 'positive' ? 'bg-green-100 text-green-800' :
                              previewData.polarity === 'negative' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {previewData.polarity.charAt(0).toUpperCase() + previewData.polarity.slice(1)}
                            </span>
                            {previewData.sentimentChange !== null && (
                              <span className="text-xs text-gray-500">
                                {previewData.sentimentChange > 0 ? '+' : ''}{(previewData.sentimentChange * 100).toFixed(1)}% change
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Sentiment Distribution */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-green-50 p-4 rounded border border-green-200">
                            <div className="text-2xl font-bold text-green-600 text-center">
                              {previewData.positivePercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 text-center mt-1">Positive</div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {previewData.positiveCount} articles
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <div className="text-2xl font-bold text-gray-600 text-center">
                              {previewData.neutralPercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 text-center mt-1">Neutral</div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {previewData.neutralCount} articles
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded border border-red-200">
                            <div className="text-2xl font-bold text-red-600 text-center">
                              {previewData.negativePercentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 text-center mt-1">Negative</div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {previewData.negativeCount} articles
                            </div>
                          </div>
                        </div>

                        {/* Additional Metrics */}
                        <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                          <span className="text-gray-600">
                            Total Articles Analyzed
                          </span>
                          <span className="font-semibold text-gray-900">
                            {previewData.totalArticles}
                          </span>
                        </div>

                        {previewData.topIssue && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              Top Issue
                            </span>
                            <span className="font-semibold text-blue-600">
                              {previewData.topIssue}
                            </span>
                          </div>
                        )}

                        {/* Trending Topics */}
                        {previewData.trendingTopics && previewData.trendingTopics.length > 0 && (
                          <div className="border-t border-gray-200 pt-3">
                            <div className="text-sm text-gray-600 mb-2">Trending Topics</div>
                            <div className="flex flex-wrap gap-2">
                              {previewData.trendingTopics.slice(0, 6).map((topic, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No sentiment data available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeReport === 'trends' && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900">Trend Analysis Summary</h5>
                    <div className="text-sm text-gray-600">
                      Analysis of sentiment trends over {TIME_RANGES[filters.timeRange as keyof typeof TIME_RANGES]?.label.toLowerCase() || 'selected period'}
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600">↑ Improving: Health, Education</span>
                      <span className="text-red-600">↓ Declining: Jobs</span>
                      <span className="text-gray-600">→ Stable: Infrastructure</span>
                    </div>
                  </div>
                )}

                {activeReport === 'competitor' && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900">Competitive Analysis Summary</h5>
                    <div className="text-sm text-gray-600">
                      Head-to-head comparison across key political issues
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Leading Issues:</span>
                        <div className="text-green-600">Jobs, Health, Infrastructure</div>
                      </div>
                      <div>
                        <span className="font-medium">Areas for Improvement:</span>
                        <div className="text-orange-600">Education, Law & Order</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeReport === 'regional' && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900">Regional Analysis Summary</h5>
                    <div className="text-sm text-gray-600">
                      Geographic breakdown of sentiment across regions
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>Ward 1: <span className="text-green-600">72%</span></div>
                      <div>Ward 2: <span className="text-yellow-600">58%</span></div>
                      <div>Ward 3: <span className="text-green-600">81%</span></div>
                      <div>Ward 4: <span className="text-orange-600">65%</span></div>
                      <div>Ward 5: <span className="text-red-600">42%</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => updateFilter('timeRange', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TIME_RANGES).map(([key, range]) => (
                    <option key={key} value={key}>{range.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="space-y-2">
                  {EXPORT_FORMATS.map(format => (
                    <label key={format} className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={filters.format === format}
                        onChange={(e) => updateFilter('format', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issues
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {['Jobs', 'Infrastructure', 'Health', 'Education', 'Law & Order'].map(issue => (
                    <label key={issue} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.issues.includes(issue)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('issues', [...filters.issues, issue]);
                          } else {
                            updateFilter('issues', filters.issues.filter(i => i !== issue));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regions
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'].map(region => (
                    <label key={region} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.regions.includes(region)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFilter('regions', [...filters.regions, region]);
                          } else {
                            updateFilter('regions', filters.regions.filter(r => r !== region));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Reports</h4>
            <div className="space-y-3">
              {isLoadingReports ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
              ) : recentReports.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No reports generated yet
                </div>
              ) : (
                recentReports.map((report) => {
                  const reportTitle = getReportTitle(report.report_type);
                  const createdAt = new Date(report.created_at);
                  const fileSize = formatFileSize(report.file_size);

                  return (
                    <div key={report.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {reportTitle}
                          <span className="ml-2 text-xs font-normal text-gray-500 uppercase">
                            {report.format}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()} • {fileSize}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {report.status === 'completed' && (
                          <span className="text-green-600">✓</span>
                        )}
                        {report.status === 'failed' && (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* All Sentiment Reports View */}
      {activeView === 'all-sentiment' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Sentiment Reports</h1>
              <p className="text-gray-600">Historical sentiment analysis data from TVK monitoring</p>
            </div>
            <button
              onClick={fetchAllSentimentReports}
              disabled={isLoadingSentiment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoadingSentiment ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={sentimentFilters.timeRange}
                  onChange={(e) => setSentimentFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 3 months</option>
                  <option value="1y">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sentimentFilters.sortBy}
                  onChange={(e) => setSentimentFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="sentiment">Sentiment Score</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sentimentFilters.sortOrder}
                  onChange={(e) => setSentimentFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <div className="ml-auto flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>{allSentimentReports.length}</strong> reports found
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Reports Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoadingSentiment ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading sentiment reports...</p>
              </div>
            ) : allSentimentReports.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sentiment reports found for the selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sentiment Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Polarity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Positive
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Negative
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Neutral
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Articles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Top Issue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allSentimentReports.map((report, index) => (
                      <tr key={report.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.report_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            report.overall_sentiment_score >= 0.6 ? 'text-green-600' :
                            report.overall_sentiment_score >= 0.4 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {(report.overall_sentiment_score * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.overall_sentiment_polarity === 'positive' ? 'bg-green-100 text-green-800' :
                            report.overall_sentiment_polarity === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.overall_sentiment_polarity || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.positive_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.negative_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.neutral_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.total_articles || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {report.top_issue || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {allSentimentReports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Average Sentiment</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(allSentimentReports.reduce((sum, r) => sum + (r.overall_sentiment_score || 0), 0) / allSentimentReports.length * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Positive</div>
                <div className="text-2xl font-bold text-green-600">
                  {allSentimentReports.reduce((sum, r) => sum + (r.positive_count || 0), 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Negative</div>
                <div className="text-2xl font-bold text-red-600">
                  {allSentimentReports.reduce((sum, r) => sum + (r.negative_count || 0), 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-1">Total Articles</div>
                <div className="text-2xl font-bold text-blue-600">
                  {allSentimentReports.reduce((sum, r) => sum + (r.total_articles || 0), 0)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}