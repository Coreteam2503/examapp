import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, handleApiError } from '../services/apiService';

const QuizResults = ({ attemptId: propAttemptId }) => {
  const { attemptId: paramAttemptId } = useParams();
  const attemptId = propAttemptId || paramAttemptId;
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswerReview, setShowAnswerReview] = useState(false);

  useEffect(() => {
    if (!attemptId) {
      setError('No attempt ID provided');
      setLoading(false);
      return;
    }
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.quizzes.getResults(attemptId);
      const result = response.data;

      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.message || 'Failed to load quiz results');
      }
    } catch (error) {
      console.error('Fetch results error:', error);
      const errorResponse = handleApiError(error);
      setError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return '#27ae60'; // Green
    if (percentage >= 80) return '#f39c12'; // Orange
    if (percentage >= 70) return '#e67e22'; // Dark orange
    if (percentage >= 60) return '#e74c3c'; // Red
    return '#c0392b'; // Dark red
  };

  const getPerformanceText = (percentage) => {
    if (percentage >= 90) return 'Excellent! 🏆';
    if (percentage >= 80) return 'Great job! 🌟';
    if (percentage >= 70) return 'Good work! 👍';
    if (percentage >= 60) return 'Not bad! 📚';
    return 'Keep practicing! 💪';
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="quiz-results loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-results error">
        <div className="error-content">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="quiz-results error">
        <div className="error-content">
          <h2>No results found</h2>
          <p>Unable to find results for this quiz attempt.</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round((results.score / results.total_questions) * 100);

  return (
    <div className="quiz-results">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <h1>Quiz Results</h1>
          <p className="quiz-title">{results.quiz_title}</p>
        </div>

        {/* Score Circle */}
        <div className="score-section">
          <div 
            className="score-circle"
            style={{ '--score-color': getScoreColor(scorePercentage) }}
          >
            <div className="score-inner">
              <span className="score-percentage">{scorePercentage}%</span>
              <span className="score-fraction">
                {results.score} / {results.total_questions}
              </span>
            </div>
          </div>
          <p className="performance-text">{getPerformanceText(scorePercentage)}</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-value">{results.correct_answers}</span>
              <span className="stat-label">Correct</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <span className="stat-value">{results.incorrect_answers}</span>
              <span className="stat-label">Incorrect</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <span className="stat-value">{formatTime(results.time_taken)}</span>
              <span className="stat-label">Time Taken</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <span className="stat-value">{formatDate(results.completed_at)}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        {results.concept_breakdown && Object.keys(results.concept_breakdown).length > 0 && (
          <div className="concept-breakdown">
            <h3>Performance by Topic</h3>
            <div className="concept-grid">
              {Object.entries(results.concept_breakdown).map(([concept, data]) => (
                <div key={concept} className="concept-item">
                  <span className="concept-name">{concept}</span>
                  <div className="concept-bar">
                    <div 
                      className="concept-fill"
                      style={{ 
                        width: `${(data.correct / data.total) * 100}%`,
                        backgroundColor: getScoreColor((data.correct / data.total) * 100)
                      }}
                    ></div>
                  </div>
                  <span className="concept-score">{data.correct}/{data.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={() => setShowAnswerReview(!showAnswerReview)}
            className="review-btn"
          >
            {showAnswerReview ? 'Hide' : 'Review'} Answers
          </button>
          <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
            Return to Dashboard
          </button>
          <button onClick={() => navigate('/quizzes')} className="retake-btn">
            Take Another Quiz
          </button>
        </div>

        {/* Answer Review */}
        {showAnswerReview && results.answers && (
          <div className="answer-review">
            <h3>Answer Review</h3>
            <div className="answers-list">
              {results.answers.map((answer, index) => (
                <div 
                  key={answer.question_id} 
                  className={`answer-item ${answer.is_correct ? 'correct' : 'incorrect'}`}
                >
                  <div className="question-header">
                    <span className="question-number">Question {index + 1}</span>
                    <span className={`result-badge ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                      {answer.is_correct ? '✅ Correct' : '❌ Incorrect'}
                    </span>
                  </div>
                  
                  <div className="question-text">
                    {answer.question_text}
                  </div>
                  
                  {answer.code_snippet && (
                    <pre className="code-snippet">
                      <code>{answer.code_snippet}</code>
                    </pre>
                  )}
                  
                  <div className="answer-options">
                    {answer.options && JSON.parse(answer.options).map((option, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`option ${
                          option === answer.correct_answer ? 'correct-answer' : ''
                        } ${
                          option === answer.user_answer ? 'user-answer' : ''
                        }`}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
                        <span className="option-text">{option}</span>
                        {option === answer.correct_answer && <span className="correct-indicator">✓</span>}
                        {option === answer.user_answer && option !== answer.correct_answer && (
                          <span className="incorrect-indicator">✗</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {answer.explanation && (
                    <div className="explanation">
                      <strong>Explanation:</strong> {answer.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-results {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .quiz-results.loading,
        .quiz-results.error {
          align-items: center;
        }

        .results-container {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-top: 2rem;
        }

        .loading-spinner {
          text-align: center;
          color: white;
        }

        .spinner {
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-content {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .results-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .results-header h1 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .quiz-title {
          color: #7f8c8d;
          font-size: 1.1rem;
          margin: 0;
        }

        .score-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .score-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: conic-gradient(
            var(--score-color) 0deg,
            var(--score-color) calc(var(--percentage, 0) * 3.6deg),
            #ecf0f1 calc(var(--percentage, 0) * 3.6deg),
            #ecf0f1 360deg
          );
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-inner {
          width: 160px;
          height: 160px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-percentage {
          font-size: 3rem;
          font-weight: 700;
          color: var(--score-color);
          line-height: 1;
        }

        .score-fraction {
          font-size: 1rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }

        .performance-text {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .concept-breakdown {
          margin-bottom: 3rem;
        }

        .concept-breakdown h3 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .concept-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .concept-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .concept-name {
          min-width: 120px;
          font-size: 0.9rem;
          color: #2c3e50;
        }

        .concept-bar {
          flex: 1;
          height: 8px;
          background: #ecf0f1;
          border-radius: 4px;
          overflow: hidden;
        }

        .concept-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .concept-score {
          min-width: 40px;
          text-align: right;
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .action-buttons button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .review-btn {
          background: #3498db;
          color: white;
        }

        .review-btn:hover {
          background: #2980b9;
        }

        .dashboard-btn {
          background: #95a5a6;
          color: white;
        }

        .dashboard-btn:hover {
          background: #7f8c8d;
        }

        .retake-btn {
          background: #27ae60;
          color: white;
        }

        .retake-btn:hover {
          background: #219a52;
        }

        .back-btn {
          background: #3498db;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }

        .answer-review {
          border-top: 2px solid #ecf0f1;
          padding-top: 2rem;
        }

        .answer-review h3 {
          color: #2c3e50;
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
        }

        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .answer-item {
          border: 2px solid #ecf0f1;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fafafa;
        }

        .answer-item.correct {
          border-color: #27ae60;
          background: #f8fff8;
        }

        .answer-item.incorrect {
          border-color: #e74c3c;
          background: #fff8f8;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .question-number {
          font-weight: 600;
          color: #2c3e50;
        }

        .result-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .result-badge.correct {
          background: #d5f5d5;
          color: #27ae60;
        }

        .result-badge.incorrect {
          background: #ffd5d5;
          color: #e74c3c;
        }

        .question-text {
          margin-bottom: 1rem;
          color: #2c3e50;
          font-size: 1.1rem;
          line-height: 1.4;
        }

        .code-snippet {
          background: #2c3e50;
          color: #ecf0f1;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .answer-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: white;
          border: 1px solid #dee2e6;
        }

        .option.correct-answer {
          background: #d5f5d5;
          border-color: #27ae60;
        }

        .option.user-answer:not(.correct-answer) {
          background: #ffd5d5;
          border-color: #e74c3c;
        }

        .option-letter {
          font-weight: 600;
          min-width: 20px;
        }

        .option-text {
          flex: 1;
        }

        .correct-indicator {
          color: #27ae60;
          font-weight: 600;
        }

        .incorrect-indicator {
          color: #e74c3c;
          font-weight: 600;
        }

        .explanation {
          background: #e8f4f8;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #3498db;
          color: #2c3e50;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .quiz-results {
            padding: 1rem;
          }

          .results-container {
            padding: 1.5rem;
          }

          .results-header h1 {
            font-size: 2rem;
          }

          .score-circle {
            width: 150px;
            height: 150px;
          }

          .score-inner {
            width: 120px;
            height: 120px;
          }

          .score-percentage {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .concept-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResults;