import React, { useState, useEffect } from 'react';
import './ProgressTracker.css';

const ProgressTracker = () => {
  const [progressData, setProgressData] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    streakDays: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/users/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      } else {
        // Fallback with mock data for development
        setProgressData({
          totalQuizzes: 15,
          completedQuizzes: 12,
          averageScore: 85,
          streakDays: 7,
          totalPoints: 1250
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Fallback with mock data
      setProgressData({
        totalQuizzes: 15,
        completedQuizzes: 12,
        averageScore: 85,
        streakDays: 7,
        totalPoints: 1250
      });
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = progressData.totalQuizzes > 0 
    ? Math.round((progressData.completedQuizzes / progressData.totalQuizzes) * 100)
    : 0;

  if (loading) {
    return (
      <div className="progress-tracker loading">
        <h3>Your Progress</h3>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      <h3>Your Progress</h3>
      
      <div className="progress-stats">
        <div className="stat-card completion">
          <div className="stat-header">
            <span className="stat-icon">✓</span>
            <span className="stat-title">Quiz Completion</span>
          </div>
          <div className="stat-value">{completionPercentage}%</div>
          <div className="stat-detail">
            {progressData.completedQuizzes} of {progressData.totalQuizzes} quizzes
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="stat-card score">
          <div className="stat-header">
            <span className="stat-icon">★</span>
            <span className="stat-title">Average Score</span>
          </div>
          <div className="stat-value">{progressData.averageScore}%</div>
          <div className="stat-detail">Across all quizzes</div>
        </div>

        <div className="stat-card streak">
          <div className="stat-header">
            <span className="stat-icon">♦</span>
            <span className="stat-title">Learning Streak</span>
          </div>
          <div className="stat-value">{progressData.streakDays}</div>
          <div className="stat-detail">days in a row</div>
        </div>

        <div className="stat-card points">
          <div className="stat-header">
            <span className="stat-icon">⬥</span>
            <span className="stat-title">Total Points</span>
          </div>
          <div className="stat-value">{progressData.totalPoints}</div>
          <div className="stat-detail">points earned</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
