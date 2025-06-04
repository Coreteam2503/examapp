import React, { useState, useEffect } from 'react';
import PerformanceCharts from './analytics/PerformanceCharts';
import UserEngagementMetrics from './analytics/UserEngagementMetrics';
import QuizAnalytics from './analytics/QuizAnalytics';
import SystemUsageChart from './analytics/SystemUsageChart';
import ExportReports from './analytics/ExportReports';
import AnalyticsFilters from './analytics/AnalyticsFilters';
import './SystemAnalytics.css';

const SystemAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    loading: true,
    userMetrics: null,
    quizMetrics: null,
    systemMetrics: null,
    timeRange: '30d'
  });

  const [filters, setFilters] = useState({
    timeRange: '30d',
    userType: 'all',
    quizType: 'all',
    dateFrom: null,
    dateTo: null
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    setAnalyticsData(prev => ({ ...prev, loading: true }));
    
    try {
      // Simulate API call - this will be replaced with actual API calls
      setTimeout(() => {
        const mockData = generateMockAnalyticsData(filters.timeRange);
        setAnalyticsData({
          loading: false,
          userMetrics: mockData.userMetrics,
          quizMetrics: mockData.quizMetrics,
          systemMetrics: mockData.systemMetrics,
          timeRange: filters.timeRange
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  const generateMockAnalyticsData = (timeRange) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return {
      userMetrics: {
        totalUsers: 156,
        activeUsers: 89,
        newUsers: 23,
        retentionRate: 74.5,
        dailyActiveUsers: generateTimeSeriesData(days, 20, 45),
        userGrowth: generateTimeSeriesData(days, 0, 5)
      },
      quizMetrics: {
        totalQuizzes: 342,
        completedQuizzes: 1247,
        averageScore: 78.3,
        completionRate: 82.6,
        quizCompletions: generateTimeSeriesData(days, 15, 35),
        scoreDistribution: [
          { range: '0-20', count: 45 },
          { range: '21-40', count: 123 },
          { range: '41-60', count: 234 },
          { range: '61-80', count: 456 },
          { range: '81-100', count: 389 }
        ]
      },
      systemMetrics: {
        serverUptime: 99.8,
        responseTime: 142,
        errorRate: 0.3,
        storageUsed: 67.4,
        bandwidthUsage: generateTimeSeriesData(days, 100, 500)
      }
    };
  };

  const generateTimeSeriesData = (days, min, max) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * (max - min + 1)) + min
      });
    }
    return data;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = (format, data) => {
    console.log(`Exporting ${data} as ${format}`);
    // Export functionality will be implemented
  };

  return (
    <div className="system-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>System Analytics</h1>
          <p>Comprehensive performance analytics and insights</p>
        </div>
        <ExportReports onExport={handleExport} />
      </div>

      <AnalyticsFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={analyticsData.loading}
      />

      {analyticsData.loading ? (
        <div className="analytics-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <div className="analytics-content">
          {/* Performance Overview */}
          <div className="analytics-section">
            <h2>Performance Overview</h2>
            <PerformanceCharts 
              data={analyticsData.systemMetrics}
              timeRange={filters.timeRange}
            />
          </div>

          {/* User Engagement */}
          <div className="analytics-section">
            <h2>User Engagement</h2>
            <UserEngagementMetrics 
              data={analyticsData.userMetrics}
              timeRange={filters.timeRange}
            />
          </div>

          {/* Quiz Analytics */}
          <div className="analytics-section">
            <h2>Quiz Performance</h2>
            <QuizAnalytics 
              data={analyticsData.quizMetrics}
              timeRange={filters.timeRange}
            />
          </div>

          {/* System Usage */}
          <div className="analytics-section">
            <h2>System Usage</h2>
            <SystemUsageChart 
              data={analyticsData.systemMetrics}
              timeRange={filters.timeRange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAnalytics;