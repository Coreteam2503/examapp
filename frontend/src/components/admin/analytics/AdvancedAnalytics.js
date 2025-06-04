import React, { useState, useEffect } from 'react';
import SimpleChart from './SimpleChart';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [timeRange, setTimeRange] = useState('30d');
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [timeRange]);

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setAnalyticsData(generateComprehensiveAnalyticsData());
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      setLoading(false);
    }
  };

  const generateComprehensiveAnalyticsData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return {
      userAnalytics: {
        totalUsers: 1247,
        activeUsers: 856,
        newRegistrations: generateTimeSeriesData(days, 5, 25),
        demographics: {
          ageGroups: [
            { range: '18-24', count: 312, percentage: 25 },
            { range: '25-34', count: 498, percentage: 40 },
            { range: '35-44', count: 286, percentage: 23 },
            { range: '45+', count: 151, percentage: 12 }
          ],
          experience: [
            { level: 'Beginner', count: 374, percentage: 30 },
            { level: 'Intermediate', count: 561, percentage: 45 },
            { level: 'Advanced', count: 312, percentage: 25 }
          ]
        }
      },
      quizAnalytics: {
        categoryPerformance: [
          { category: 'JavaScript', avgScore: 82.1, quizzes: 89, popularity: 95 },
          { category: 'React', avgScore: 79.3, quizzes: 67, popularity: 88 },
          { category: 'Python', avgScore: 81.7, quizzes: 54, popularity: 82 },
          { category: 'CSS', avgScore: 84.2, quizzes: 43, popularity: 76 },
          { category: 'Node.js', avgScore: 74.9, quizzes: 38, popularity: 71 }
        ]
      },
      learningAnalytics: {
        learningPaths: [
          { path: 'Web Development', enrolled: 456, completed: 234, avgTime: 45 },
          { path: 'Data Science', enrolled: 298, completed: 145, avgTime: 67 },
          { path: 'Mobile Development', enrolled: 189, completed: 98, avgTime: 52 }
        ],
        improvementMetrics: {
          scoreImprovement: generateTimeSeriesData(days, 2, 8)
        }
      },
      systemAnalytics: {
        performance: {
          responseTime: generateTimeSeriesData(days, 80, 200),
          errorRate: generateTimeSeriesData(days, 0.1, 2.5)
        },
        usage: {
          dailyActiveUsers: generateTimeSeriesData(days, 200, 400)
        }
      },
      predictions: {
        userGrowth: generatePredictiveData(30),
        courseCompletions: generatePredictiveData(30)
      },
      insights: {
        topInsights: [
          {
            type: 'performance',
            title: 'JavaScript Quizzes Show Highest Engagement',
            description: 'Users spend 35% more time on JavaScript-related content',
            impact: 'high',
            recommendation: 'Expand JavaScript curriculum'
          },
          {
            type: 'retention',
            title: 'Weekend Study Sessions Have Higher Completion Rates',
            description: '23% higher completion rate on weekends vs weekdays',
            impact: 'medium',
            recommendation: 'Send weekend study reminders'
          },
          {
            type: 'difficulty',
            title: 'Medium Difficulty Quizzes Need Optimization',
            description: 'Drop-off rate increases by 45% at medium difficulty',
            impact: 'high',
            recommendation: 'Implement progressive difficulty scaling'
          }
        ],
        riskFactors: [
          { factor: 'User Churn Risk', value: 12.3, trend: 'decreasing' },
          { factor: 'System Overload Risk', value: 8.7, trend: 'stable' },
          { factor: 'Content Engagement Risk', value: 15.2, trend: 'increasing' }
        ]
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

  const generatePredictiveData = (days) => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.floor(Math.random() * 100) + 50,
        confidence: Math.floor(Math.random() * 20) + 80
      });
    }
    return data;
  };

  const renderMetricCard = (title, value, change, icon, color = '#3b82f6') => (
    <div className="metric-card" style={{ borderColor: color }}>
      <div className="metric-icon" style={{ backgroundColor: color + '20' }}>
        {icon}
      </div>
      <div className="metric-content">
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
        </div>
      </div>
    </div>
  );

  const renderInsightCard = (insight) => (
    <div key={insight.title} className={`insight-card ${insight.impact}`}>
      <div className="insight-header">
        <div className="insight-type">{insight.type}</div>
        <div className={`insight-impact ${insight.impact}`}>
          {insight.impact} impact
        </div>
      </div>
      <div className="insight-title">{insight.title}</div>
      <div className="insight-description">{insight.description}</div>
      <div className="insight-recommendation">
        <strong>Recommendation:</strong> {insight.recommendation}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="advanced-analytics-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Advanced Analytics Dashboard</h1>
          <p>Comprehensive insights and predictive analytics</p>
        </div>
        
        <div className="header-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button 
            className={`compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
          >
            Compare Mode
          </button>
        </div>
      </div>

      <div className="analytics-nav">
        {['performance', 'users', 'learning', 'predictions', 'insights'].map(tab => (
          <button
            key={tab}
            className={`nav-tab ${selectedMetric === tab ? 'active' : ''}`}
            onClick={() => setSelectedMetric(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="analytics-content">
        {selectedMetric === 'performance' && (
          <div className="performance-analytics">
            <div className="metrics-grid">
              {renderMetricCard('Response Time', '145ms', -8, '⚡', '#10b981')}
              {renderMetricCard('Error Rate', '0.3%', -15, '🛡️', '#ef4444')}
              {renderMetricCard('Uptime', '99.8%', 2, '🟢', '#22c55e')}
              {renderMetricCard('Active Users', '856', 12, '👥', '#8b5cf6')}
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>System Response Time</h3>
                <SimpleChart
                  data={analyticsData.systemAnalytics.performance.responseTime}
                  type="line"
                  color="#10b981"
                  height={300}
                  showGrid={true}
                  showTooltip={true}
                />
              </div>

              <div className="chart-container">
                <h3>Daily Active Users</h3>
                <SimpleChart
                  data={analyticsData.systemAnalytics.usage.dailyActiveUsers}
                  type="line"
                  color="#8b5cf6"
                  height={300}
                  showGrid={true}
                  showTooltip={true}
                />
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'users' && (
          <div className="user-analytics">
            <div className="metrics-grid">
              {renderMetricCard('Total Users', '1,247', 18, '👤', '#3b82f6')}
              {renderMetricCard('Active Users', '856', 12, '🟢', '#10b981')}
              {renderMetricCard('Retention (30d)', '45%', 5, '🔄', '#f59e0b')}
              {renderMetricCard('New Signups', '23', 8, '✨', '#8b5cf6')}
            </div>

            <div className="user-demographics">
              <div className="demo-section">
                <h3>Age Distribution</h3>
                <div className="demo-bars">
                  {analyticsData.userAnalytics.demographics.ageGroups.map((group, index) => (
                    <div key={index} className="demo-bar">
                      <div className="demo-label">{group.range}</div>
                      <div className="demo-bar-container">
                        <div 
                          className="demo-bar-fill"
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <div className="demo-percentage">{group.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="demo-section">
                <h3>Experience Level</h3>
                <div className="demo-bars">
                  {analyticsData.userAnalytics.demographics.experience.map((exp, index) => (
                    <div key={index} className="demo-bar">
                      <div className="demo-label">{exp.level}</div>
                      <div className="demo-bar-container">
                        <div 
                          className="demo-bar-fill"
                          style={{ width: `${exp.percentage}%` }}
                        />
                      </div>
                      <div className="demo-percentage">{exp.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'learning' && (
          <div className="learning-analytics">
            <div className="learning-paths">
              <h3>Learning Path Performance</h3>
              <div className="paths-grid">
                {analyticsData.learningAnalytics.learningPaths.map((path, index) => (
                  <div key={index} className="path-card">
                    <div className="path-title">{path.path}</div>
                    <div className="path-stats">
                      <div className="stat">
                        <span className="stat-label">Enrolled</span>
                        <span className="stat-value">{path.enrolled}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value">{path.completed}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Avg Time</span>
                        <span className="stat-value">{path.avgTime}h</span>
                      </div>
                    </div>
                    <div className="completion-rate">
                      <div className="rate-bar">
                        <div 
                          className="rate-fill"
                          style={{ width: `${(path.completed / path.enrolled) * 100}%` }}
                        />
                      </div>
                      <span>{Math.round((path.completed / path.enrolled) * 100)}% completion</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'predictions' && (
          <div className="prediction-analytics">
            <div className="predictions-header">
              <h3>Predictive Analytics</h3>
              <p>AI-powered insights for the next 30 days</p>
            </div>

            <div className="predictions-grid">
              <div className="prediction-card">
                <h4>User Growth Prediction</h4>
                <div className="prediction-chart">
                  <SimpleChart
                    data={analyticsData.predictions.userGrowth}
                    type="line"
                    color="#3b82f6"
                    height={200}
                    showGrid={true}
                  />
                </div>
                <div className="prediction-summary">
                  <span className="prediction-label">Expected Growth:</span>
                  <span className="prediction-value">+23%</span>
                </div>
              </div>

              <div className="prediction-card">
                <h4>Course Completions</h4>
                <div className="prediction-chart">
                  <SimpleChart
                    data={analyticsData.predictions.courseCompletions}
                    type="line"
                    color="#10b981"
                    height={200}
                    showGrid={true}
                  />
                </div>
                <div className="prediction-summary">
                  <span className="prediction-label">Expected Increase:</span>
                  <span className="prediction-value">+18%</span>
                </div>
              </div>
            </div>

            <div className="risk-assessment">
              <h4>Risk Assessment</h4>
              <div className="risk-factors">
                {analyticsData.insights.riskFactors.map((risk, index) => (
                  <div key={index} className="risk-factor">
                    <div className="risk-header">
                      <span className="risk-name">{risk.factor}</span>
                      <span className={`risk-trend ${risk.trend}`}>{risk.trend}</span>
                    </div>
                    <div className="risk-meter">
                      <div 
                        className="risk-fill"
                        style={{ 
                          width: `${risk.value}%`,
                          backgroundColor: risk.value > 15 ? '#ef4444' : risk.value > 10 ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                    <div className="risk-value">{risk.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'insights' && (
          <div className="insights-analytics">
            <div className="insights-header">
              <h3>AI-Powered Insights</h3>
              <p>Actionable recommendations based on data analysis</p>
            </div>

            <div className="insights-grid">
              {analyticsData.insights.topInsights.map(insight => renderInsightCard(insight))}
            </div>

            <div className="performance-matrix">
              <h4>Category Performance Matrix</h4>
              <div className="matrix-grid">
                {analyticsData.quizAnalytics.categoryPerformance.map((category, index) => (
                  <div key={index} className="matrix-cell">
                    <div className="cell-header">
                      <span className="category-name">{category.category}</span>
                      <span className="category-score">{category.avgScore}%</span>
                    </div>
                    <div className="cell-metrics">
                      <div className="metric">
                        <span className="metric-label">Quizzes</span>
                        <span className="metric-value">{category.quizzes}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Popularity</span>
                        <div className="popularity-bar">
                          <div 
                            className="popularity-fill"
                            style={{ width: `${category.popularity}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="real-time-alerts">
        <div className="alerts-header">
          <h4>Real-time Alerts</h4>
          <div className="alert-status active">System Monitoring Active</div>
        </div>
        <div className="alerts-list">
          <div className="alert-item info">
            <div className="alert-icon">ℹ️</div>
            <div className="alert-content">
              <div className="alert-title">High Engagement Detected</div>
              <div className="alert-time">2 minutes ago</div>
            </div>
          </div>
          <div className="alert-item warning">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <div className="alert-title">Server Load Approaching Threshold</div>
              <div className="alert-time">15 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;