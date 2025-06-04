import React from 'react';
import SimpleChart from './SimpleChart';
import './QuizAnalytics.css';

const QuizAnalytics = ({ data, timeRange }) => {
  if (!data) {
    return <div className="loading-placeholder">Loading quiz analytics data...</div>;
  }

  const quizStats = [
    {
      title: 'Total Quizzes',
      value: data.totalQuizzes,
      change: '+15%',
      positive: true,
      icon: '📝'
    },
    {
      title: 'Completed',
      value: data.completedQuizzes,
      change: '+22%',
      positive: true,
      icon: '✅'
    },
    {
      title: 'Average Score',
      value: `${data.averageScore}%`,
      change: '+3%',
      positive: true,
      icon: '🎯'
    },
    {
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      change: '-1%',
      positive: false,
      icon: '📊'
    }
  ];

  const difficultyLevels = [
    { level: 'Easy', count: 156, percentage: 45, color: '#22c55e' },
    { level: 'Medium', count: 132, percentage: 38, color: '#f59e0b' },
    { level: 'Hard', count: 54, percentage: 17, color: '#ef4444' }
  ];

  const topPerformingQuizzes = [
    { title: 'JavaScript Fundamentals', completions: 89, avgScore: 85.2, difficulty: 'Easy' },
    { title: 'React Components', completions: 76, avgScore: 78.9, difficulty: 'Medium' },
    { title: 'Python Data Structures', completions: 65, avgScore: 82.1, difficulty: 'Medium' },
    { title: 'CSS Grid Layout', completions: 54, avgScore: 79.5, difficulty: 'Easy' },
    { title: 'Node.js APIs', completions: 43, avgScore: 71.8, difficulty: 'Hard' }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="quiz-analytics">
      {/* Quiz Stats */}
      <div className="quiz-stats">
        {quizStats.map((stat, index) => (
          <div key={index} className="quiz-stat-card">
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
      <div className="quiz-charts">
        {/* Quiz Completions Over Time */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Quiz Completions</h3>
            <span className="chart-subtitle">Daily completions over time</span>
          </div>
          <SimpleChart
            data={data.quizCompletions}
            type="line"
            color="#8b5cf6"
            height={250}
            showGrid={true}
            showTooltip={true}
          />
        </div>

        {/* Score Distribution Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Score Distribution</h3>
            <span className="chart-subtitle">Quiz score ranges</span>
          </div>
          <div className="score-distribution">
            {data.scoreDistribution.map((score, index) => (
              <div key={index} className="score-bar">
                <div className="score-label">{score.range}%</div>
                <div className="score-bar-container">
                  <div 
                    className="score-bar-fill"
                    style={{ 
                      height: `${(score.count / Math.max(...data.scoreDistribution.map(s => s.count))) * 100}%`
                    }}
                  />
                </div>
                <div className="score-count">{score.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Difficulty Breakdown */}
      <div className="difficulty-section">
        <div className="section-header">
          <h3>Quiz Difficulty Distribution</h3>
          <span className="section-subtitle">Breakdown by difficulty level</span>
        </div>
        
        <div className="difficulty-breakdown">
          {difficultyLevels.map((level, index) => (
            <div key={index} className="difficulty-level">
              <div className="level-header">
                <span className="level-name">{level.level}</span>
                <span className="level-count">{level.count} quizzes</span>
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

      {/* Top Performing Quizzes */}
      <div className="top-quizzes-section">
        <div className="section-header">
          <h3>Top Performing Quizzes</h3>
          <span className="section-subtitle">Most popular and highest scoring</span>
        </div>
        
        <div className="top-quizzes-table">
          <div className="table-header">
            <div className="header-cell">Quiz Title</div>
            <div className="header-cell">Completions</div>
            <div className="header-cell">Avg Score</div>
            <div className="header-cell">Difficulty</div>
          </div>
          
          {topPerformingQuizzes.map((quiz, index) => (
            <div key={index} className="table-row">
              <div className="table-cell quiz-title">
                <span className="rank">#{index + 1}</span>
                <span className="title">{quiz.title}</span>
              </div>
              <div className="table-cell completions">
                <span className="completion-count">{quiz.completions}</span>
                <span className="completion-label">completions</span>
              </div>
              <div className="table-cell avg-score">
                <span className="score-value">{quiz.avgScore}%</span>
                <div className="score-bar-mini">
                  <div 
                    className="score-fill-mini"
                    style={{ width: `${quiz.avgScore}%` }}
                  />
                </div>
              </div>
              <div className="table-cell difficulty">
                <span 
                  className="difficulty-badge"
                  style={{ 
                    backgroundColor: getDifficultyColor(quiz.difficulty),
                    color: 'white'
                  }}
                >
                  {quiz.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Insights */}
      <div className="quiz-insights">
        <h3>Quiz Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🏆</div>
            <div className="insight-content">
              <div className="insight-title">Best Category</div>
              <div className="insight-value">JavaScript</div>
              <div className="insight-description">highest average scores</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">⏱️</div>
            <div className="insight-content">
              <div className="insight-title">Avg Time</div>
              <div className="insight-value">12 min</div>
              <div className="insight-description">per quiz completion</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">🔄</div>
            <div className="insight-content">
              <div className="insight-title">Retry Rate</div>
              <div className="insight-value">34%</div>
              <div className="insight-description">users retake quizzes</div>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <div className="insight-title">Improvement</div>
              <div className="insight-value">+8.2%</div>
              <div className="insight-description">score increase on retakes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalytics;