import React, { useState, useEffect } from 'react';
import './AdminOverview.css';

const AdminOverview = () => {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalUploads: 0,
    activeUsers: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Simulate API call for system stats
    const fetchSystemStats = async () => {
      try {
        // This will be replaced with actual API calls in future tasks
        setTimeout(() => {
          setSystemStats({
            totalUsers: 156,
            totalQuizzes: 342,
            totalUploads: 578,
            activeUsers: 23,
            loading: false
          });

          setRecentActivity([
            {
              id: 1,
              type: 'user_registration',
              message: 'New user registered: john.doe@example.com',
              timestamp: new Date(Date.now() - 10 * 60 * 1000),
              icon: '👤'
            },
            {
              id: 2,
              type: 'quiz_completed',
              message: 'Quiz completed: "JavaScript Fundamentals" by sarah.smith@example.com',
              timestamp: new Date(Date.now() - 25 * 60 * 1000),
              icon: '✅'
            },
            {
              id: 3,
              type: 'file_upload',
              message: 'File uploaded: "react-components.js" by mike.wilson@example.com',
              timestamp: new Date(Date.now() - 45 * 60 * 1000),
              icon: '📁'
            },
            {
              id: 4,
              type: 'quiz_generated',
              message: 'New quiz generated: "Python Data Structures"',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
              icon: '📝'
            },
            {
              id: 5,
              type: 'system_backup',
              message: 'Automated system backup completed successfully',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              icon: '💾'
            }
          ]);
        }, 1000);
      } catch (error) {
        console.error('Error fetching system stats:', error);
        setSystemStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSystemStats();
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const StatCard = ({ title, value, icon, trend, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">
        {systemStats.loading ? (
          <div className="loading-placeholder">...</div>
        ) : (
          value
        )}
      </div>
      {trend && (
        <div className="stat-trend">
          <span className={`trend-indicator ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
          <span className="trend-text">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-overview">
      <div className="overview-header">
        <h1>System Overview</h1>
        <p>Monitor your platform's performance and activity at a glance</p>
      </div>

      {/* Key Statistics Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={systemStats.totalUsers}
          icon="👥"
          trend={12}
          color="blue"
        />
        <StatCard
          title="Total Quizzes"
          value={systemStats.totalQuizzes}
          icon="📝"
          trend={8}
          color="green"
        />
        <StatCard
          title="File Uploads"
          value={systemStats.totalUploads}
          icon="📁"
          trend={15}
          color="purple"
        />
        <StatCard
          title="Active Users"
          value={systemStats.activeUsers}
          icon="🟢"
          trend={-3}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="overview-content">
        {/* Recent Activity Feed */}
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-feed">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="content-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <button className="action-card primary">
              <span className="action-icon">👤</span>
              <span className="action-title">Add New User</span>
              <span className="action-desc">Create user account</span>
            </button>
            <button className="action-card secondary">
              <span className="action-icon">📊</span>
              <span className="action-title">Generate Report</span>
              <span className="action-desc">System analytics</span>
            </button>
            <button className="action-card tertiary">
              <span className="action-icon">🔧</span>
              <span className="action-title">System Settings</span>
              <span className="action-desc">Configure platform</span>
            </button>
            <button className="action-card quaternary">
              <span className="action-icon">💾</span>
              <span className="action-title">Backup Data</span>
              <span className="action-desc">Export system data</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="system-health">
        <div className="section-header">
          <h2>System Health</h2>
          <span className="health-status healthy">All Systems Operational</span>
        </div>
        <div className="health-metrics">
          <div className="metric">
            <span className="metric-label">Server Uptime</span>
            <span className="metric-value">99.8%</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '99.8%' }}></div>
            </div>
          </div>
          <div className="metric">
            <span className="metric-label">Database Performance</span>
            <span className="metric-value">95.2%</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '95.2%' }}></div>
            </div>
          </div>
          <div className="metric">
            <span className="metric-label">API Response Time</span>
            <span className="metric-value">&lt; 200ms</span>
            <div className="metric-bar">
              <div className="metric-fill good" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;