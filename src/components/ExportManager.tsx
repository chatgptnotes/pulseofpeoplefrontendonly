import React, { useState, useRef } from 'react';
import { Download, FileText, Table } from 'lucide-react';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeTables: boolean;
  includeMetrics: boolean;
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'all';
  sections: {
    summary: boolean;
    sentiment_analysis: boolean;
    trending_topics: boolean;
    geographic_data: boolean;
    alerts: boolean;
    social_media: boolean;
    recommendations: boolean;
  };
  customization: {
    title?: string;
    subtitle?: string;
    color_scheme?: 'blue' | 'green' | 'purple' | 'orange';
  };
}

interface ExportManagerProps {
  className?: string;
  onExportComplete?: (result: { success: boolean; message: string }) => void;
}

export default function ExportManager({ className = '', onExportComplete }: ExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeTables: true,
    includeMetrics: true,
    dateRange: 'week',
    sections: {
      summary: true,
      sentiment_analysis: true,
      trending_topics: true,
      geographic_data: true,
      alerts: true,
      social_media: true,
      recommendations: true
    },
    customization: {
      title: 'Animal-I Sentiment Analysis Report',
      subtitle: 'Political Intelligence Dashboard',
      color_scheme: 'blue'
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Animal-I_Report_${timestamp}.${options.format}`;
      
      if (onExportComplete) {
        onExportComplete({ success: true, message: `Report exported successfully as ${filename}` });
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (onExportComplete) {
        onExportComplete({ success: false, message: 'Export failed. Please try again.' });
      }
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </>
        )}
      </button>

      {/* Export Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                <button
                  onClick={() => setShowOptions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'pdf', label: 'PDF Report', icon: FileText },
                    { value: 'excel', label: 'Excel Workbook', icon: Table },
                    { value: 'csv', label: 'CSV Data', icon: Table },
                    { value: 'json', label: 'JSON Data', icon: FileText }
                  ].map(format => (
                    <button
                      key={format.value}
                      onClick={() => setOptions(prev => ({ ...prev, format: format.value as any }))}
                      className={`p-3 border rounded-lg flex items-center space-x-2 ${
                        options.format === format.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <format.icon className="w-4 h-4" />
                      <span className="text-sm">{format.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={options.dateRange}
                  onChange={(e) => setOptions(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowOptions(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

