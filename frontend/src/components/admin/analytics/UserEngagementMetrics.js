import React from 'react';
import SimpleChart from './SimpleChart';
import './UserEngagementMetrics.css';

const UserEngagementMetrics = ({ data, timeRange }) => {
  if (!data) {
    return <div className="loading-placeholder">Loading user engagement data...</div>;
  }

  const engagementStats = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      change: '+12%',
      positive: true,
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: data.activeUsers,
      change: '+8%',
      positive: true,
      icon: '🟢'
    },
    {
      title: 'New Users',
      value: data.newUsers,
      change: '+23%',
      positive: true,
      icon: '✨'
    },
    {
      title: 'Retention Rate',
      value: `${data.retentionRate}%`,
      change: '-2%',
      positive: false,
      icon: '🔄'
    }
  ];

  const userActivityLevels = [
    { level: 'Very Active', count: 23, percentage: 26, color: '#22c55e' },
    { level: 'Active', count: 45, percentage: 51, color: '#3b82f6' },
    { level: 'Moderate', count: 15, percentage: 17, color: '#f59e0b' },
    { level: 'Low', count: 6, percentage: 6, color: '#ef4444' }
  ];

  return (
    <div className="user-engagement-metrics">
      {/* Engagement Stats */}
      <div className="engagement-stats">
        {engagementStats.map((stat, index) => (
          <div key={index} className="engagement-stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
              <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="engagement-charts">
        {/* Daily Active Users Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Daily Active Users</h3>
            <span className="chart-subtitle">Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days</span>
          </div>
          <SimpleChart
            data={data.dailyActiveUsers}
            type="line"
            color="#3b82f6"
            height={250}
            showGrid={true}
            showTooltip={true}
          />
        </div>

        {/* User Growth Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>User Growth</h3>
            <span className="chart-subtitle">New registrations per day</span>
          </div>
          <SimpleChart
            data={data.userGrowth}
            type="bar"
            color="#22c55e"
            height={250}
            showGrid={true}
            showTooltip={true}
          />
        </div>
      </div>

      {/* User Activity Levels */}
      <div className="user-activity-section">
        <div className="section-header">
          <h3>User Activity Levels</h3>
          <span className="section-subtitle">Distribution of user engagement</span>
        </div>
        
        <div className="activity-breakdown">
          {userActivityLevels.map((level, index) => (
            <div key={index} className="activity-level">
              <div className="level-header">
                <span className="level-name">{level.level}</span>
                <span className="level-count">{level.count} users</span>
              </div>
              <div className="level-bar">
                <div 
                  className="level-fill"
                  style={{ 
                    width: `${level.percentage}%`,
                    backgroundColor: level.color
                  }}
                />
              </div>
              <div className="level-percentage">{level.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Behavior Insights */}
      <div className="user-insights">
        <h3>User Behavior Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📱</div>
            <div className="insight-content">
              <div className="insight-title">Mobile Usage</div>
              <div className="insight-value">68%</div>
              <div className="insight-description">of users access via mobile</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">⏰</div>
            <div className="insight-content">
              <div className="insight-title">Peak Hours</div>
              <div className="insight-value">2-6 PM</div>
              <div className="insight-description">highest activity period</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <div className="insight-title">Avg. Session</div>
              <div className="insight-value">24 min</div>
              <div className="insight-description">average session duration</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <div className="insight-title">Bounce Rate</div>
              <div className="insight-value">15%</div>
              <div className="insight-description">users leave immediately</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEngagementMetrics;