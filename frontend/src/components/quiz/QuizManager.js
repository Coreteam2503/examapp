import React, { useState, useEffect } from 'react';
import QuizDisplay from './QuizDisplay';
import { apiService, handleApiError } from '../../services/apiService';
import quizService from '../../services/quizService';
import './QuizManager.css';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'taking', 'results'
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiService.quizzes.list({ page: 1, limit: 10 });
      setQuizzes(response.data.quizzes || []);
      setError(null);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = async (quiz) => {
    try {
      setLoading(true);
      // Get full quiz data with questions
      const response = await apiService.quizzes.getById(quiz.id);
      console.log('Quiz detail response:', response.data);
      setSelectedQuiz(response.data);
      setCurrentView('taking');
      setError(null);
    } catch (err) {
      console.error('Error loading quiz:', err);
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (results) => {
    try {
      setLoading(true);
      
      // Submit quiz attempt to backend with normalization
      console.log('Submitting quiz attempt:', {
        quizId: selectedQuiz.id,
        answers: results.answers,
        timeElapsed: results.timeElapsed
      });
      
      const response = await quizService.submitQuizAttempt(
        selectedQuiz.id,
        results.answers,
        results.timeElapsed,
        selectedQuiz // Pass quiz data for answer normalization
      );
      
      console.log('Quiz attempt submitted successfully:', response);
      
      // Store results with backend response data
      const backendResults = response.attempt || {};
      setQuizResults({
        ...results,
        attemptId: backendResults.id,
        score: backendResults.score_percentage || 0,
        correctAnswers: backendResults.correct_answers || 0,
        totalQuestions: backendResults.total_questions || results.totalQuestions
      });
      
      setCurrentView('results');
      setError(null);
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      setError(`Failed to submit quiz: ${err.message}`);
      
      // Still show results even if submission failed
      setQuizResults(results);
      setCurrentView('results');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    try {
      await apiService.quizzes.delete(quizId);
      await loadQuizzes(); // Refresh the list
    } catch (err) {
      console.error('Error deleting quiz:', err);
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    }
  };

  const goBackToList = () => {
    setCurrentView('list');
    setSelectedQuiz(null);
    setQuizResults(null);
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

  if (loading && currentView === 'list') {
    return (
      <div className="quiz-manager-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-manager-container">
        <div className="error-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadQuizzes} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz Results View
  if (currentView === 'results') {
    return (
      <div className="quiz-manager-container">
        <div className="quiz-results">
          <div className="results-header">
            <h2>Quiz Completed!</h2>
            <button onClick={goBackToList} className="back-btn">
              Back to Quizzes
            </button>
          </div>
          
          <div className="results-summary">
            <div className="result-card">
              <h3>Your Performance</h3>
              <div className="result-stats">
                {quizResults.score !== undefined && (
                  <div className="stat score-stat">
                    <span className="stat-value score-value">
                      {quizResults.score}%
                    </span>
                    <span className="stat-label">Score</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-value">
                    {quizResults.correctAnswers || 0}/{quizResults.totalQuestions}
                  </span>
                  <span className="stat-label">Correct Answers</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {quizResults.answeredQuestions}/{quizResults.totalQuestions}
                  </span>
                  <span className="stat-label">Questions Answered</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {Math.floor(quizResults.timeElapsed / 60)}:{(quizResults.timeElapsed % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="stat-label">Time Taken</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="results-actions">
            <button onClick={() => setCurrentView('taking')} className="retake-btn">
              Retake Quiz
            </button>
            <button onClick={goBackToList} className="done-btn">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  if (currentView === 'taking' && selectedQuiz) {
    return (
      <div className="quiz-manager-container">
        <div className="quiz-taking-header">
          <button onClick={goBackToList} className="back-btn">
            ← Back to Quizzes
          </button>
        </div>
        <QuizDisplay
          quiz={selectedQuiz}
          onQuizComplete={handleQuizComplete}
          onAnswerChange={(answers) => {
            // Could save progress here
            console.log('Answers updated:', answers);
          }}
        />
      </div>
    );
  }

  // Quiz List View
  return (
    <div className="quiz-manager-container">
      <div className="quiz-list-header">
        <h1>Your Quizzes</h1>
        <p>Select a quiz to start practicing</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No quizzes yet</h3>
          <p>Upload some files and generate quizzes to get started!</p>
          <button 
            onClick={() => window.location.href = '/uploads'} 
            className="upload-btn"
          >
            Upload Files
          </button>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`quiz-card ${quiz.is_game ? 'game-format' : ''}`}
              onClick={() => handleQuizSelect(quiz)}
            >
              <div className="quiz-card-header">
                <h3>{quiz.title}</h3>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                  title="Delete quiz"
                >
                  ×
                </button>
              </div>
              
              <div className="quiz-card-content">
                <div className="quiz-info">
                <span className="quiz-questions">
                {quiz.total_questions} questions
                </span>
                <span className="quiz-difficulty">
                {quiz.difficulty}
                </span>
                  {quiz.game_format && quiz.game_format !== 'traditional' && (
                  <span className="quiz-game-format">
                    🎮 {quiz.game_format.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
                
                <div className="quiz-meta">
                  <span className="quiz-file">
                    📁 {quiz.filename}
                  </span>
                  <span className="quiz-date">
                    {formatDate(quiz.created_at)}
                  </span>
                </div>
              </div>
              
              <div className="quiz-card-footer">
                <button className="start-quiz-btn">
                  {quiz.is_game ? 'Play Game →' : 'Start Quiz →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
