import React, { useState, useEffect } from 'react';
import QuestionBankForm from '../QuestionBankForm';
import { questionService } from '../../services/questionService';
import './QuestionBankManagement.css';

const QuestionBankManagement = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await questionService.getStatistics();
      
      if (result.success) {
        setStatistics(result.data.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load question bank statistics');
      console.error('Statistics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionCreated = () => {
    // Refresh statistics when new questions are created
    loadStatistics();
  };

  return (
    <div className="question-bank-management">
      <div className="header-section">
        <h1>Question Bank Management</h1>
        <p className="header-description">
          Create, manage, and organize your question bank for quizzes and assessments.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="statistics-section">
        <h2 className="statistics-header">
          Question Bank Statistics
        </h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-title">Error Loading Statistics</div>
            <div className="error-message">{error}</div>
            <button 
              onClick={loadStatistics}
              className="error-retry"
            >
              Try Again
            </button>
          </div>
        ) : statistics ? (
          <div className="stats-grid">
            {/* Total Questions */}
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon total">
                  <span>📚</span>
                </div>
                <div className="stat-info">
                  <div className="stat-number">
                    {statistics.total}
                  </div>
                  <div className="stat-label">Total Questions</div>
                </div>
              </div>
            </div>

            {/* By Domain */}
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon domains">
                  <span>🎯</span>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{statistics.byDomain.length}</div>
                  <div className="stat-label">Different Domains</div>
                </div>
              </div>
              <div className="stat-details">
                <div className="stat-list">
                  {statistics.byDomain.slice(0, 3).map((domain, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-item-label">
                        {domain.domain || 'Unknown'}
                      </span>
                      <span className="stat-item-value">{domain.count}</span>
                    </div>
                  ))}
                  {statistics.byDomain.length > 3 && (
                    <div className="stat-more">
                      +{statistics.byDomain.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* By Type */}
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon types">
                  <span>🔧</span>
                </div>
                <div className="stat-info">
                  <div className="stat-number">{statistics.byType.length}</div>
                  <div className="stat-label">Different Types</div>
                </div>
              </div>
              <div className="stat-details">
                <div className="stat-list">
                  {statistics.byType.slice(0, 3).map((type, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-item-label">
                        {type.type.replace('_', ' ')}
                      </span>
                      <span className="stat-item-value">{type.count}</span>
                    </div>
                  ))}
                  {statistics.byType.length > 3 && (
                    <div className="stat-more">
                      +{statistics.byType.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* By Difficulty */}
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon difficulty">
                  <span>⚡</span>
                </div>
                <div className="stat-info">
                  <div className="stat-number">Distribution</div>
                  <div className="stat-label">Difficulty Levels</div>
                </div>
              </div>
              <div className="stat-details">
                <div className="stat-list">
                  {statistics.byDifficulty.map((difficulty, index) => (
                    <div key={index} className="stat-item">
                      <span className="stat-item-label">
                        {difficulty.difficulty_level || 'Unknown'}
                      </span>
                      <span className="stat-item-value">{difficulty.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Question Bank Form */}
      <div className="form-container">
        <QuestionBankForm onQuestionCreated={handleQuestionCreated} />
      </div>
    </div>
  );
};

export default QuestionBankManagement;
