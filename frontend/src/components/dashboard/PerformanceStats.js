import React, { useState, useEffect } from 'react';
import './PerformanceStats.css';

const PerformanceStats = () => {
  const [stats, setStats] = useState({
    weeklyActivity: [],
    subjectBreakdown: [],
    difficultyStats: [],
    learningTrends: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    fetchPerformanceStats();
  }, [selectedTimeframe]);

  const fetchPerformanceStats = async () => {
    try {
      const response = await fetch(`/api/analytics/performance?timeframe=${selectedTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback with mock data for development
        setStats({
          weeklyActivity: [
            { day: 'Mon', quizzes: 3, avgScore: 85 },
            { day: 'Tue', quizzes: 2, avgScore: 92 },
            { day: 'Wed', quizzes: 4, avgScore: 78 },
            { day: 'Thu', quizzes: 1, avgScore: 88 },
            { day: 'Fri', quizzes: 5, avgScore: 94 },
            { day: 'Sat', quizzes: 2, avgScore: 82 },
            { day: 'Sun', quizzes: 3, avgScore: 90 }
          ],
          subjectBreakdown: [
            { name: 'JavaScript', averageScore: 88, quizCount: 12, improvement: 5 },
            { name: 'React', averageScore: 92, quizCount: 8, improvement: 8 },
            { name: 'Node.js', averageScore: 76, quizCount: 6, improvement: -2 },
            { name: 'CSS', averageScore: 85, quizCount: 4, improvement: 3 }
          ],
          difficultyStats: [
            { level: 'Easy', percentage: 45, averageScore: 94 },
            { level: 'Medium', percentage: 40, averageScore: 82 },
            { level: 'Hard', percentage: 15, averageScore: 68 }
          ],
          learningTrends: {
            totalTimeSpent: 320,
            averageSessionTime: 18,
            bestPerformanceDay: 'Friday',
            mostImprovedSubject: 'React'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      setStats({
        weeklyActivity: [
          { day: 'Mon', quizzes: 3, avgScore: 85 },
          { day: 'Tue', quizzes: 2, avgScore: 92 },
          { day: 'Wed', quizzes: 4, avgScore: 78 },
          { day: 'Thu', quizzes: 1, avgScore: 88 },
          { day: 'Fri', quizzes: 5, avgScore: 94 },
          { day: 'Sat', quizzes: 2, avgScore: 82 },
          { day: 'Sun', quizzes: 3, avgScore: 90 }
        ],
        subjectBreakdown: [
          { name: 'JavaScript', averageScore: 88, quizCount: 12, improvement: 5 },
          { name: 'React', averageScore: 92, quizCount: 8, improvement: 8 }
        ],
        difficultyStats: [
          { level: 'Easy', percentage: 45, averageScore: 94 },
          { level: 'Medium', percentage: 40, averageScore: 82 },
          { level: 'Hard', percentage: 15, averageScore: 68 }
        ],
        learningTrends: {
          totalTimeSpent: 320,
          averageSessionTime: 18,
          bestPerformanceDay: 'Friday',
          mostImprovedSubject: 'React'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuizzes = () => {
    return Math.max(...stats.weeklyActivity.map(d => d.quizzes)) || 1;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 80) return '#f39c12';
    if (score >= 70) return '#e67e22';
    return '#e74c3c';
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 0) return '#2ecc71';
    if (improvement < 0) return '#e74c3c';
    return '#95a5a6';
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 0) return '↗';
    if (improvement < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <div className="performance-stats loading">
        <h3>Performance Analytics</h3>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="performance-stats">
      <div className="stats-header">
        <h3>Performance Analytics</h3>
        <div className="timeframe-selector">
          <button 
            className={selectedTimeframe === 'week' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </button>
          <button 
            className={selectedTimeframe === 'month' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </button>
          <button 
            className={selectedTimeframe === 'year' ? 'active' : ''}
            onClick={() => setSelectedTimeframe('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="stats-grid">
        {/* Weekly Activity Chart */}
        <div className="stat-chart weekly-activity">
          <h4>Weekly Activity</h4>
          <div className="activity-bars">
            {stats.weeklyActivity.map((day, index) => (
              <div key={index} className="activity-day">
                <div className="activity-info">
                  <div 
                    className="activity-bar"
                    style={{ 
                      height: `${(day.quizzes / getMaxQuizzes()) * 100}%`,
                      backgroundColor: getScoreColor(day.avgScore)
                    }}
                    title={`${day.quizzes} quizzes, ${day.avgScore}% avg score`}
                  ></div>
                  <div className="quiz-count">{day.quizzes}</div>
                </div>
                <span className="day-label">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>Height = Quiz Count | Color = Avg Score</span>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="stat-chart subject-breakdown">
          <h4>Subject Performance</h4>
          <div className="subject-list">
            {stats.subjectBreakdown.map((subject, index) => (
              <div key={index} className="subject-item">
                <div className="subject-header">
                  <div className="subject-info">
                    <span className="subject-name">{subject.name}</span>
                    <span className="quiz-count">({subject.quizCount} quizzes)</span>
                  </div>
                  <div className="subject-metrics">
                    <span className="subject-score" style={{ color: getScoreColor(subject.averageScore) }}>
                      {subject.averageScore}%
                    </span>
                    <span 
                      className="improvement"
                      style={{ color: getImprovementColor(subject.improvement) }}
                      title={`${subject.improvement > 0 ? '+' : ''}${subject.improvement}% improvement`}
                    >
                      {getImprovementIcon(subject.improvement)}
                      {Math.abs(subject.improvement)}%
                    </span>
                  </div>
                </div>
                <div className="subject-progress">
                  <div 
                    className="subject-fill"
                    style={{ 
                      width: `${subject.averageScore}%`,
                      backgroundColor: getScoreColor(subject.averageScore)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Insights */}
        <div className="stat-chart learning-insights">
          <h4>Learning Insights</h4>
          <div className="insights-grid">
            <div className="insight-item">
              <div className="insight-icon">⏱</div>
              <div className="insight-content">
                <div className="insight-value">{Math.floor(stats.learningTrends.totalTimeSpent / 60)}h {stats.learningTrends.totalTimeSpent % 60}m</div>
                <div className="insight-label">Total Study Time</div>
              </div>
            </div>
            
            <div className="insight-item">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <div className="insight-value">{stats.learningTrends.averageSessionTime} min</div>
                <div className="insight-label">Avg Session</div>
              </div>
            </div>
            
            <div className="insight-item">
              <div className="insight-icon">★</div>
              <div className="insight-content">
                <div className="insight-value">{stats.learningTrends.bestPerformanceDay}</div>
                <div className="insight-label">Best Day</div>
              </div>
            </div>
            
            <div className="insight-item">
              <div className="insight-icon">↗</div>
              <div className="insight-content">
                <div className="insight-value">{stats.learningTrends.mostImprovedSubject}</div>
                <div className="insight-label">Most Improved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceStats;
