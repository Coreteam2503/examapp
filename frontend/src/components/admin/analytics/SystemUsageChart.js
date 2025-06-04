import React from 'react';
import SimpleChart from './SimpleChart';
import './SystemUsageChart.css';

const SystemUsageChart = ({ data, timeRange }) => {
  if (!data) {
    return <div className="loading-placeholder">Loading system usage data...</div>;
  }

  const usageMetrics = [
    {
      title: 'CPU Usage',
      value: '45%',
      status: 'good',
      trend: '-2%',
      icon: '🖥️'
    },
    {
      title: 'Memory Usage',
      value: '67%',
      status: 'warning',
      trend: '+5%',
      icon: '🧠'
    },
    {
      title: 'Disk Usage',
      value: data.storageUsed + '%',
      status: 'warning',
      trend: '+2%',
      icon: '💾'
    },
    {
      title: 'Network I/O',
      value: '23 MB/s',
      status: 'good',
      trend: '+12%',
      icon: '🌐'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="system-usage-chart">
      {/* System Metrics */}
      <div className="system-metrics">
        {usageMetrics.map((metric, index) => (
          <div key={index} className="system-metric-card">
            <div className="metric-icon">{metric.icon}</div>
            <div className="metric-content">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-title">{metric.title}</div>
              <div className="metric-footer">
                <div 
                  className="status-dot"
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                />
                <span className="trend-value">{metric.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Usage Chart */}
      <div className="usage-chart-container">
        <div className="chart-header">
          <h3>System Resource Usage</h3>
          <span className="chart-subtitle">Resource utilization over time</span>
        </div>
        
        <div className="usage-chart">
          <SimpleChart
            data={data.bandwidthUsage}
            type="line"
            color="#ef4444"
            height={300}
            showGrid={true}
            showTooltip={true}
          />
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="resource-allocation">
        <h3>Resource Allocation</h3>
        <div className="allocation-grid">
          <div className="allocation-item">
            <div className="allocation-header">
              <span className="allocation-title">Database</span>
              <span className="allocation-value">32%</span>
            </div>
            <div className="allocation-bar">
              <div className="allocation-fill" style={{ width: '32%', backgroundColor: '#3b82f6' }} />
            </div>
          </div>
          
          <div className="allocation-item">
            <div className="allocation-header">
              <span className="allocation-title">Web Server</span>
              <span className="allocation-value">28%</span>
            </div>
            <div className="allocation-bar">
              <div className="allocation-fill" style={{ width: '28%', backgroundColor: '#22c55e' }} />
            </div>
          </div>
          
          <div className="allocation-item">
            <div className="allocation-header">
              <span className="allocation-title">File Storage</span>
              <span className="allocation-value">25%</span>
            </div>
            <div className="allocation-bar">
              <div className="allocation-fill" style={{ width: '25%', backgroundColor: '#f59e0b' }} />
            </div>
          </div>
          
          <div className="allocation-item">
            <div className="allocation-header">
              <span className="allocation-title">Other Services</span>
              <span className="allocation-value">15%</span>
            </div>
            <div className="allocation-bar">
              <div className="allocation-fill" style={{ width: '15%', backgroundColor: '#8b5cf6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="health-indicators">
        <h3>System Health Status</h3>
        <div className="health-grid">
          <div className="health-item good">
            <div className="health-icon">✅</div>
            <div className="health-content">
              <div className="health-title">Database</div>
              <div className="health-status">Healthy</div>
              <div className="health-detail">Response time: 45ms</div>
            </div>
          </div>
          
          <div className="health-item good">
            <div className="health-icon">✅</div>
            <div className="health-content">
              <div className="health-title">API Server</div>
              <div className="health-status">Healthy</div>
              <div className="health-detail">Uptime: 99.8%</div>
            </div>
          </div>
          
          <div className="health-item warning">
            <div className="health-icon">⚠️</div>
            <div className="health-content">
              <div className="health-title">Storage</div>
              <div className="health-status">Warning</div>
              <div className="health-detail">67% used</div>
            </div>
          </div>
          
          <div className="health-item good">
            <div className="health-icon">✅</div>
            <div className="health-content">
              <div className="health-title">Cache</div>
              <div className="health-status">Healthy</div>
              <div className="health-detail">Hit ratio: 94%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemUsageChart;