import React, { useState, useEffect } from 'react';
import './RecentQuizzes.css';

const RecentQuizzes = ({ onTakeQuiz }) => {
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentQuizzes();
  }, []);

  const fetchRecentQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz-attempts/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentQuizzes(data);
      } else {
        // Fallback with mock data for development
        setRecentQuizzes([
          {
            id: 1,
            title: 'JavaScript Fundamentals',
            questionCount: 10,
            score: 85,
            completedAt: new Date().toISOString(),
            maxScore: 100,
            timeSpent: 15 // minutes
          },
          {
            id: 2,
            title: 'React Components',
            questionCount: 8,
            score: 92,
            completedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
            maxScore: 100,
            timeSpent: 12
          },
          {
            id: 3,
            title: 'Node.js APIs',
            questionCount: 12,
            score: 78,
            completedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            maxScore: 100,
            timeSpent: 20
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent quizzes:', error);
      // Fallback with mock data
      setRecentQuizzes([
        {
          id: 1,
          title: 'JavaScript Fundamentals',
          questionCount: 10,
          score: 85,
          completedAt: new Date().toISOString(),
          maxScore: 100,
          timeSpent: 15
        },
        {
          id: 2,
          title: 'React Components',
          questionCount: 8,
          score: 92,
          completedAt: new Date(Date.now() - 86400000).toISOString(),
          maxScore: 100,
          timeSpent: 12
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRetakeQuiz = (quizId) => {
    if (onTakeQuiz) {
      onTakeQuiz(quizId);
    }
  };

  if (loading) {
    return (
      <div className="recent-quizzes loading">
        <h3>Recent Quizzes</h3>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="recent-quizzes">
      <div className="section-header">
        <h3>Recent Quizzes</h3>
        <button className="view-all-btn" onClick={() => onTakeQuiz && onTakeQuiz()}>
          View All
        </button>
      </div>
      
      {recentQuizzes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h4>No quizzes yet</h4>
          <p>Upload a file and generate your first quiz!</p>
          <button className="cta-btn" onClick={() => onTakeQuiz && onTakeQuiz()}>
            Get Started
          </button>
        </div>
      ) : (
        <div className="quiz-list">
          {recentQuizzes.map(quiz => (
            <div key={quiz.id} className="quiz-item">
              <div className="quiz-info">
                <h4 className="quiz-title">{quiz.title}</h4>
                <div className="quiz-meta">
                  <span className="question-count">
                    {quiz.questionCount} questions
                  </span>
                  <span className="separator">•</span>
                  <span className="time-spent">
                    {quiz.timeSpent} min
                  </span>
                  <span className="separator">•</span>
                  <span className="completion-date">
                    {formatDate(quiz.completedAt)}
                  </span>
                </div>
              </div>
              
              <div className="quiz-score">
                <div 
                  className="score-circle"
                  style={{ borderColor: getScoreColor(quiz.score) }}
                >
                  <span 
                    className="score-value"
                    style={{ color: getScoreColor(quiz.score) }}
                  >
                    {quiz.score}%
                  </span>
                  <span 
                    className="score-grade"
                    style={{ color: getScoreColor(quiz.score) }}
                  >
                    {getScoreGrade(quiz.score)}
                  </span>
                </div>
              </div>
              
              <div className="quiz-actions">
                <button 
                  className="action-btn retake"
                  onClick={() => handleRetakeQuiz(quiz.id)}
                  title="Retake Quiz"
                >
                  ↻
                </button>
                <button 
                  className="action-btn review"
                  title="Review Answers"
                >
                  👁
                </button>
                <button 
                  className="action-btn share"
                  title="Share Results"
                >
                  ↗
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentQuizzes;
