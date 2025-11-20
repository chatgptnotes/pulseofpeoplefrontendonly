import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../utils/dataProcessing';

export interface ReportFilters {
  timeRange: string;
  issues: string[];
  regions: string[];
  format: 'pdf' | 'excel' | 'csv';
  reportType: string;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  timeRange: string;
  filters: {
    issues: string[];
    regions: string[];
  };
  summary: any;
  data: any[];
  charts?: any[];
}

/**
 * Get date range based on time range filter
 */
function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
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
    case 'all':
      startDate.setFullYear(2020, 0, 1); // Start from 2020
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

/**
 * Fetch sentiment data from Supabase
 */
async function fetchSentimentData(filters: ReportFilters): Promise<any> {
  const { startDate, endDate } = getDateRange(filters.timeRange);

  // Query tvk_sentiment_reports
  let query = supabase
    .from('tvk_sentiment_reports')
    .select('*')
    .gte('report_date', startDate.toISOString().split('T')[0])
    .lte('report_date', endDate.toISOString().split('T')[0])
    .order('report_date', { ascending: false });

  const { data: sentimentReports, error } = await query;

  if (error) {
    console.error('Error fetching sentiment reports:', error);
    return null;
  }

  // Query field_reports for additional context
  let fieldQuery = supabase
    .from('field_reports')
    .select('*, field_report_issues(issue_id)')
    .gte('report_date', startDate.toISOString().split('T')[0])
    .lte('report_date', endDate.toISOString().split('T')[0]);

  // Filter by regions if specified
  if (filters.regions.length > 0) {
    fieldQuery = fieldQuery.in('ward', filters.regions);
  }

  const { data: fieldReports, error: fieldError } = await fieldQuery;

  if (fieldError) {
    console.error('Error fetching field reports:', error);
  }

  // Calculate aggregates
  const totalReports = sentimentReports?.length || 0;
  const avgSentiment = sentimentReports?.reduce((sum, r) => sum + (r.overall_sentiment_score || 0), 0) / (totalReports || 1);
  const positiveCount = sentimentReports?.filter(r => r.overall_sentiment_polarity === 'positive').length || 0;
  const negativeCount = sentimentReports?.filter(r => r.overall_sentiment_polarity === 'negative').length || 0;
  const neutralCount = sentimentReports?.filter(r => r.overall_sentiment_polarity === 'neutral').length || 0;

  return {
    reports: sentimentReports || [],
    fieldReports: fieldReports || [],
    summary: {
      totalReports,
      avgSentiment: avgSentiment.toFixed(2),
      positiveCount,
      negativeCount,
      neutralCount,
      positivePercentage: ((positiveCount / (totalReports || 1)) * 100).toFixed(1),
      negativePercentage: ((negativeCount / (totalReports || 1)) * 100).toFixed(1),
      neutralPercentage: ((neutralCount / (totalReports || 1)) * 100).toFixed(1),
    }
  };
}

/**
 * Fetch trend data from Supabase
 */
async function fetchTrendData(filters: ReportFilters): Promise<any> {
  const { startDate, endDate } = getDateRange(filters.timeRange);

  const { data, error } = await supabase
    .from('tvk_sentiment_reports')
    .select('report_date, overall_sentiment_score, overall_sentiment_polarity, positive_count, negative_count, neutral_count')
    .gte('report_date', startDate.toISOString().split('T')[0])
    .lte('report_date', endDate.toISOString().split('T')[0])
    .order('report_date', { ascending: true });

  if (error) {
    console.error('Error fetching trend data:', error);
    return null;
  }

  // Calculate trend
  const trendData = data || [];
  const trend = trendData.length > 1
    ? trendData[trendData.length - 1].overall_sentiment_score - trendData[0].overall_sentiment_score
    : 0;

  return {
    data: trendData,
    summary: {
      totalDataPoints: trendData.length,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      trendValue: (trend * 100).toFixed(2) + '%'
    }
  };
}

/**
 * Fetch competitor data from Supabase
 */
async function fetchCompetitorData(filters: ReportFilters): Promise<any> {
  const { startDate, endDate } = getDateRange(filters.timeRange);

  // Query field_reports with competitor activity
  const { data, error } = await supabase
    .from('field_reports')
    .select('*, competitor_party_id, competitor_activity_description, political_parties(name, abbreviation)')
    .not('competitor_party_id', 'is', null)
    .gte('report_date', startDate.toISOString().split('T')[0])
    .lte('report_date', endDate.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching competitor data:', error);
    return null;
  }

  // Aggregate by party
  const competitorMap = new Map();
  data?.forEach(report => {
    const partyName = (report as any).political_parties?.name || 'Unknown';
    if (!competitorMap.has(partyName)) {
      competitorMap.set(partyName, {
        name: partyName,
        activityCount: 0,
        reports: []
      });
    }
    const entry = competitorMap.get(partyName);
    entry.activityCount++;
    entry.reports.push(report);
  });

  const competitorData = Array.from(competitorMap.values());

  return {
    data: competitorData,
    summary: {
      totalCompetitorActivities: data?.length || 0,
      uniqueCompetitors: competitorData.length,
      mostActiveCompetitor: competitorData.sort((a, b) => b.activityCount - a.activityCount)[0]?.name || 'N/A'
    }
  };
}

/**
 * Fetch regional data from Supabase
 */
async function fetchRegionalData(filters: ReportFilters): Promise<any> {
  const { startDate, endDate } = getDateRange(filters.timeRange);

  let query = supabase
    .from('field_reports')
    .select('*, ward, positive_reactions, negative_reactions')
    .gte('report_date', startDate.toISOString().split('T')[0])
    .lte('report_date', endDate.toISOString().split('T')[0]);

  // Filter by regions if specified
  if (filters.regions.length > 0) {
    query = query.in('ward', filters.regions);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching regional data:', error);
    return null;
  }

  // Aggregate by ward
  const wardMap = new Map();
  data?.forEach(report => {
    const ward = report.ward || 'Unknown';
    if (!wardMap.has(ward)) {
      wardMap.set(ward, {
        ward,
        reportCount: 0,
        positiveReactions: 0,
        negativeReactions: 0,
        sentimentScore: 0
      });
    }
    const entry = wardMap.get(ward);
    entry.reportCount++;
    entry.positiveReactions += (report.positive_reactions as any[])?.length || 0;
    entry.negativeReactions += (report.negative_reactions as any[])?.length || 0;
  });

  // Calculate sentiment scores
  wardMap.forEach(entry => {
    const total = entry.positiveReactions + entry.negativeReactions;
    entry.sentimentScore = total > 0 ? (entry.positiveReactions / total * 100).toFixed(1) : 50;
  });

  const regionalData = Array.from(wardMap.values());

  return {
    data: regionalData,
    summary: {
      totalRegions: regionalData.length,
      totalReports: data?.length || 0,
      highestSentiment: regionalData.sort((a, b) => parseFloat(b.sentimentScore) - parseFloat(a.sentimentScore))[0],
      lowestSentiment: regionalData.sort((a, b) => parseFloat(a.sentimentScore) - parseFloat(b.sentimentScore))[0]
    }
  };
}

/**
 * Fetch data based on report type
 */
async function fetchReportData(filters: ReportFilters): Promise<any> {
  switch (filters.reportType) {
    case 'sentiment':
      return await fetchSentimentData(filters);
    case 'trends':
      return await fetchTrendData(filters);
    case 'competitor':
      return await fetchCompetitorData(filters);
    case 'regional':
      return await fetchRegionalData(filters);
    default:
      return null;
  }
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(filters: ReportFilters): Promise<Blob> {
  const data = await fetchReportData(filters);

  if (!data) {
    throw new Error('No data available for report generation');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Blue
  doc.text('Pulse of People', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const reportTitle = getReportTitle(filters.reportType);
  doc.text(reportTitle, pageWidth / 2, 30, { align: 'center' });

  // Report metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  doc.text(`Time Range: ${getTimeRangeLabel(filters.timeRange)}`, 14, 45);

  if (filters.issues.length > 0) {
    doc.text(`Issues: ${filters.issues.join(', ')}`, 14, 50);
  }
  if (filters.regions.length > 0) {
    doc.text(`Regions: ${filters.regions.join(', ')}`, 14, 55);
  }

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 60, pageWidth - 14, 60);

  let yPosition = 70;

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  // Report-specific summary
  if (filters.reportType === 'sentiment' && data.summary) {
    doc.text(`Total Reports: ${data.summary.totalReports}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Average Sentiment Score: ${data.summary.avgSentiment}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Positive: ${data.summary.positivePercentage}% (${data.summary.positiveCount})`, 14, yPosition);
    yPosition += 6;
    doc.text(`Neutral: ${data.summary.neutralPercentage}% (${data.summary.neutralCount})`, 14, yPosition);
    yPosition += 6;
    doc.text(`Negative: ${data.summary.negativePercentage}% (${data.summary.negativeCount})`, 14, yPosition);
    yPosition += 10;
  } else if (filters.reportType === 'trends' && data.summary) {
    doc.text(`Data Points: ${data.summary.totalDataPoints}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Period: ${data.summary.startDate} to ${data.summary.endDate}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Trend: ${data.summary.trend} (${data.summary.trendValue})`, 14, yPosition);
    yPosition += 10;
  } else if (filters.reportType === 'competitor' && data.summary) {
    doc.text(`Total Competitor Activities: ${data.summary.totalCompetitorActivities}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Unique Competitors: ${data.summary.uniqueCompetitors}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Most Active: ${data.summary.mostActiveCompetitor}`, 14, yPosition);
    yPosition += 10;
  } else if (filters.reportType === 'regional' && data.summary) {
    doc.text(`Total Regions: ${data.summary.totalRegions}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Total Reports: ${data.summary.totalReports}`, 14, yPosition);
    yPosition += 6;
    if (data.summary.highestSentiment) {
      doc.text(`Highest Sentiment: ${data.summary.highestSentiment.ward} (${data.summary.highestSentiment.sentimentScore}%)`, 14, yPosition);
      yPosition += 6;
    }
    if (data.summary.lowestSentiment) {
      doc.text(`Lowest Sentiment: ${data.summary.lowestSentiment.ward} (${data.summary.lowestSentiment.sentimentScore}%)`, 14, yPosition);
      yPosition += 6;
    }
    yPosition += 4;
  }

  // Data table
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Detailed Data', 14, yPosition);
  yPosition += 8;

  // Generate table based on report type
  let tableData: any[] = [];
  let tableHeaders: string[] = [];

  if (filters.reportType === 'sentiment') {
    tableHeaders = ['Date', 'Sentiment Score', 'Polarity', 'Positive', 'Negative', 'Neutral'];
    tableData = (data.reports || []).slice(0, 50).map((r: any) => [
      r.report_date,
      (r.overall_sentiment_score || 0).toFixed(2),
      r.overall_sentiment_polarity || 'N/A',
      r.positive_count || 0,
      r.negative_count || 0,
      r.neutral_count || 0
    ]);
  } else if (filters.reportType === 'trends') {
    tableHeaders = ['Date', 'Sentiment Score', 'Polarity', 'Positive', 'Negative'];
    tableData = (data.data || []).slice(0, 50).map((r: any) => [
      r.report_date,
      (r.overall_sentiment_score || 0).toFixed(2),
      r.overall_sentiment_polarity || 'N/A',
      r.positive_count || 0,
      r.negative_count || 0
    ]);
  } else if (filters.reportType === 'competitor') {
    tableHeaders = ['Competitor', 'Activity Count', 'Reports'];
    tableData = (data.data || []).slice(0, 50).map((c: any) => [
      c.name,
      c.activityCount,
      c.reports.length
    ]);
  } else if (filters.reportType === 'regional') {
    tableHeaders = ['Ward/Region', 'Reports', 'Sentiment Score', 'Positive', 'Negative'];
    tableData = (data.data || []).slice(0, 50).map((r: any) => [
      r.ward,
      r.reportCount,
      r.sentimentScore + '%',
      r.positiveReactions,
      r.negativeReactions
    ]);
  }

  if (tableData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No data available for the selected filters.', 14, yPosition);
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages} | Generated by Pulse of People`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Convert to blob
  return doc.output('blob');
}

/**
 * Generate Excel report
 */
export async function generateExcelReport(filters: ReportFilters): Promise<Blob> {
  const data = await fetchReportData(filters);

  if (!data) {
    throw new Error('No data available for report generation');
  }

  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: any[] = [
    ['Pulse of People - ' + getReportTitle(filters.reportType)],
    [''],
    ['Generated', new Date().toLocaleString()],
    ['Time Range', getTimeRangeLabel(filters.timeRange)],
    ['Issues', filters.issues.join(', ') || 'All'],
    ['Regions', filters.regions.join(', ') || 'All'],
    [''],
    ['Summary Statistics'],
  ];

  // Add summary based on report type
  if (filters.reportType === 'sentiment' && data.summary) {
    summaryData.push(['Total Reports', data.summary.totalReports]);
    summaryData.push(['Average Sentiment', data.summary.avgSentiment]);
    summaryData.push(['Positive Count', data.summary.positiveCount]);
    summaryData.push(['Negative Count', data.summary.negativeCount]);
    summaryData.push(['Neutral Count', data.summary.neutralCount]);
  } else if (filters.reportType === 'trends' && data.summary) {
    summaryData.push(['Data Points', data.summary.totalDataPoints]);
    summaryData.push(['Trend', data.summary.trend]);
    summaryData.push(['Trend Value', data.summary.trendValue]);
  } else if (filters.reportType === 'competitor' && data.summary) {
    summaryData.push(['Total Activities', data.summary.totalCompetitorActivities]);
    summaryData.push(['Unique Competitors', data.summary.uniqueCompetitors]);
    summaryData.push(['Most Active', data.summary.mostActiveCompetitor]);
  } else if (filters.reportType === 'regional' && data.summary) {
    summaryData.push(['Total Regions', data.summary.totalRegions]);
    summaryData.push(['Total Reports', data.summary.totalReports]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Data sheet
  let dataArray: any[] = [];

  if (filters.reportType === 'sentiment') {
    dataArray = [['Date', 'Sentiment Score', 'Polarity', 'Positive', 'Negative', 'Neutral', 'Total Articles']];
    (data.reports || []).forEach((r: any) => {
      dataArray.push([
        r.report_date,
        r.overall_sentiment_score || 0,
        r.overall_sentiment_polarity || 'N/A',
        r.positive_count || 0,
        r.negative_count || 0,
        r.neutral_count || 0,
        r.total_articles || 0
      ]);
    });
  } else if (filters.reportType === 'trends') {
    dataArray = [['Date', 'Sentiment Score', 'Polarity', 'Positive', 'Negative', 'Neutral']];
    (data.data || []).forEach((r: any) => {
      dataArray.push([
        r.report_date,
        r.overall_sentiment_score || 0,
        r.overall_sentiment_polarity || 'N/A',
        r.positive_count || 0,
        r.negative_count || 0,
        r.neutral_count || 0
      ]);
    });
  } else if (filters.reportType === 'competitor') {
    dataArray = [['Competitor', 'Activity Count', 'Number of Reports']];
    (data.data || []).forEach((c: any) => {
      dataArray.push([
        c.name,
        c.activityCount,
        c.reports.length
      ]);
    });
  } else if (filters.reportType === 'regional') {
    dataArray = [['Ward/Region', 'Report Count', 'Sentiment Score (%)', 'Positive Reactions', 'Negative Reactions']];
    (data.data || []).forEach((r: any) => {
      dataArray.push([
        r.ward,
        r.reportCount,
        r.sentimentScore,
        r.positiveReactions,
        r.negativeReactions
      ]);
    });
  }

  const dataSheet = XLSX.utils.aoa_to_sheet(dataArray);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generate CSV report (uses existing utility)
 */
export async function generateCSVReport(filters: ReportFilters): Promise<void> {
  const data = await fetchReportData(filters);

  if (!data) {
    throw new Error('No data available for report generation');
  }

  let csvData: any[] = [];

  if (filters.reportType === 'sentiment') {
    csvData = (data.reports || []).map((r: any) => ({
      date: r.report_date,
      sentimentScore: r.overall_sentiment_score,
      polarity: r.overall_sentiment_polarity,
      positive: r.positive_count,
      negative: r.negative_count,
      neutral: r.neutral_count,
      totalArticles: r.total_articles
    }));
  } else if (filters.reportType === 'trends') {
    csvData = (data.data || []).map((r: any) => ({
      date: r.report_date,
      sentimentScore: r.overall_sentiment_score,
      polarity: r.overall_sentiment_polarity,
      positive: r.positive_count,
      negative: r.negative_count
    }));
  } else if (filters.reportType === 'competitor') {
    csvData = (data.data || []).map((c: any) => ({
      competitor: c.name,
      activityCount: c.activityCount,
      reports: c.reports.length
    }));
  } else if (filters.reportType === 'regional') {
    csvData = (data.data || []).map((r: any) => ({
      ward: r.ward,
      reportCount: r.reportCount,
      sentimentScore: r.sentimentScore,
      positiveReactions: r.positiveReactions,
      negativeReactions: r.negativeReactions
    }));
  }

  const filename = `${filters.reportType}-report-${new Date().toISOString().split('T')[0]}`;
  exportToCSV(csvData, filename);
}

/**
 * Save report metadata to database
 */
export async function saveReportMetadata(
  filters: ReportFilters,
  fileSize: number,
  userId?: string
): Promise<void> {
  try {
    const { error } = await supabase.from('generated_reports').insert({
      report_type: filters.reportType,
      format: filters.format,
      filters: {
        timeRange: filters.timeRange,
        issues: filters.issues,
        regions: filters.regions
      },
      file_size: fileSize,
      created_by: userId,
      status: 'completed'
    });

    if (error) {
      console.error('Error saving report metadata:', error);
    }
  } catch (err) {
    console.error('Failed to save report metadata:', err);
  }
}

/**
 * Get report title based on type
 */
function getReportTitle(reportType: string): string {
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
}

/**
 * Get time range label
 */
function getTimeRangeLabel(timeRange: string): string {
  const labels: Record<string, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 3 months',
    '1y': 'Last year',
    'all': 'All time'
  };
  return labels[timeRange] || timeRange;
}
