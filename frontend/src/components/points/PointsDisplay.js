import React, { useState, useEffect } from 'react';
import './PointsDisplay.css';

const PointsDisplay = ({ compact = false }) => {
  const [userStats, setUserStats] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserStats();
    if (!compact) {
      fetchPointsHistory();
    }
  }, [compact]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/points/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.data);
      } else {
        setError('Failed to load points data');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/points/history?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPointsHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonIcon = (reason) => {
    const icons = {
      quiz_completion: '🎯',
      correct_answers: '✅',
      perfect_score: '⭐',
      first_quiz: '🎉',
      streak_bonus: '🔥',
      level_up: '📈',
      achievement: '🏆'
    };
    return icons[reason] || '💫';
  };

  const getReasonColor = (reason) => {
    const colors = {
      quiz_completion: '#3b82f6',
      correct_answers: '#10b981',
      perfect_score: '#f59e0b',
      first_quiz: '#8b5cf6',
      streak_bonus: '#ef4444',
      level_up: '#6366f1',
      achievement: '#f97316'
    };
    return colors[reason] || '#6b7280';
  };

  if (loading) {
    return (
      <div className={`points-display ${compact ? 'compact' : ''}`}>
        <div className="loading">Loading points...</div>
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div className={`points-display ${compact ? 'compact' : ''}`}>
        <div className="error">{error || 'No points data available'}</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="points-display compact">
        <div className="compact-stats">
          <div className="stat-item">
            <span className="stat-icon">💎</span>
            <span className="stat-value">{userStats.total_points}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">#{userStats.rank}</span>
            <span className="stat-label">Rank</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{userStats.level}</span>
            <span className="stat-label">Level</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="points-display">
      <div className="points-header">
        <h3>Your Progress</h3>
        <div className="total-points">
          <span className="points-icon">💎</span>
          <span className="points-value">{userStats.total_points}</span>
          <span className="points-label">Total Points</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">#{userStats.rank}</div>
            <div className="stat-label">Global Rank</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">Level {userStats.level}</div>
            <div className="stat-label">Current Level</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.current_streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{userStats.total_quizzes_completed}</div>
            <div className="stat-label">Quizzes</div>
          </div>
        </div>
      </div>

      {userStats.level_progress && (
        <div className="level-progress">
          <div className="progress-header">
            <span>Level {userStats.level}</span>
            {userStats.points_for_next_level ? (
              <span>{userStats.points_for_next_level} points to next level</span>
            ) : (
              <span>Max Level Reached!</span>
            )}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${userStats.level_progress.progress_percentage}%` 
              }}
            ></div>
          </div>
          <div className="progress-percentage">
            {userStats.level_progress.progress_percentage}% complete
          </div>
        </div>
      )}

      {pointsHistory.length > 0 && (
        <div className="recent-activity">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {pointsHistory.map((entry, index) => (
              <div key={index} className="activity-item">
                <div 
                  className="activity-icon"
                  style={{ color: getReasonColor(entry.reason) }}
                >
                  {getReasonIcon(entry.reason)}
                </div>
                <div className="activity-content">
                  <div className="activity-description">{entry.description}</div>
                  <div className="activity-time">{formatDate(entry.earned_at)}</div>
                </div>
                <div 
                  className="activity-points"
                  style={{ color: getReasonColor(entry.reason) }}
                >
                  +{entry.points_earned}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;
