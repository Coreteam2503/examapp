import React from 'react';
import SimpleChart from './SimpleChart';
import './PerformanceCharts.css';

const PerformanceCharts = ({ data, timeRange }) => {
  if (!data) {
    return <div className="loading-placeholder">Loading performance data...</div>;
  }

  const performanceMetrics = [
    {
      title: 'Server Uptime',
      value: data.serverUptime,
      unit: '%',
      trend: '+0.2',
      status: 'excellent',
      icon: '🟢'
    },
    {
      title: 'Average Response Time',
      value: data.responseTime,
      unit: 'ms',
      trend: '-12',
      status: 'good',
      icon: '⚡'
    },
    {
      title: 'Error Rate',
      value: data.errorRate,
      unit: '%',
      trend: '-0.1',
      status: 'excellent',
      icon: '🛡️'
    },
    {
      title: 'Storage Used',
      value: data.storageUsed,
      unit: '%',
      trend: '+2.3',
      status: 'warning',
      icon: '💾'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendColor = (trend) => {
    const value = parseFloat(trend);
    return value > 0 ? '#ef4444' : '#22c55e';
  };

  return (
    <div className="performance-charts">
      {/* Performance Metrics Grid */}
      <div className="performance-metrics">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">{metric.icon}</span>
              <span className="metric-title">{metric.title}</span>
            </div>
            <div className="metric-value">
              <span className="value-number">{metric.value}</span>
              <span className="value-unit">{metric.unit}</span>
            </div>
            <div className="metric-footer">
              <div 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(metric.status) }}
              />
              <span className="status-text">{metric.status}</span>
              <span 
                className="trend-value"
                style={{ color: getTrendColor(metric.trend) }}
              >
                {metric.trend}{metric.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bandwidth Usage Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Bandwidth Usage Over Time</h3>
          <div className="chart-legend">
            <span className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>Bandwidth (MB/s)</span>
            </span>
          </div>
        </div>
        <div className="chart-content">
          <SimpleChart
            data={data.bandwidthUsage}
            type="line"
            color="#3b82f6"
            height={300}
            showGrid={true}
            showTooltip={true}
          />
        </div>
      </div>

      {/* Performance Timeline */}
      <div className="performance-timeline">
        <h3>Recent Performance Events</h3>
        <div className="timeline-events">
          <div className="timeline-event">
            <div className="event-time">2 hours ago</div>
            <div className="event-icon success">✅</div>
            <div className="event-content">
              <div className="event-title">System Backup Completed</div>
              <div className="event-description">Automated backup completed successfully</div>
            </div>
          </div>
          <div className="timeline-event">
            <div className="event-time">6 hours ago</div>
            <div className="event-icon info">ℹ️</div>
            <div className="event-content">
              <div className="event-title">Database Optimization</div>
              <div className="event-description">Scheduled database maintenance improved response times</div>
            </div>
          </div>
          <div className="timeline-event">
            <div className="event-time">1 day ago</div>
            <div className="event-icon warning">⚠️</div>
            <div className="event-content">
              <div className="event-title">High Memory Usage</div>
              <div className="event-description">Memory usage peaked at 89%, resolved automatically</div>
            </div>
          </div>
          <div className="timeline-event">
            <div className="event-time">2 days ago</div>
            <div className="event-icon success">🚀</div>
            <div className="event-content">
              <div className="event-title">System Update Deployed</div>
              <div className="event-description">Version 2.1.0 deployed with performance improvements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;