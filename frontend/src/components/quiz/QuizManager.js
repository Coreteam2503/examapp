import React, { useState, useEffect } from 'react';
import QuizDisplay from './QuizDisplay';
import { apiService, handleApiError } from '../../services/apiService';
import quizService from '../../services/quizService';
import './QuizManager.css';

const QuizManager = ({ onQuizCompleted }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'taking', 'results'
  const [quizResults, setQuizResults] = useState(null);
  const [quizScores, setQuizScores] = useState({}); // Store scores for each quiz

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiService.quizzes.list({ page: 1, limit: 10 });
      const quizList = response.data.quizzes || [];
      setQuizzes(quizList);
      
      // Load scores for each quiz
      await loadQuizScores(quizList);
      
      setError(null);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      const errorResponse = handleApiError(err);
      setError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizScores = async (quizList) => {
    try {
      console.log('📊 Loading quiz scores for', quizList.length, 'quizzes...');
      const scores = {};
      
      // Get user's attempts for all quizzes
      const attemptsResponse = await apiService.quizAttempts.list({ limit: 100 });
      const attempts = attemptsResponse.data.attempts || [];
      
      console.log('📊 Found', attempts.length, 'total attempts');
      
      // Group attempts by quiz_id and find best score for each quiz
      quizList.forEach(quiz => {
        const quizAttempts = attempts.filter(attempt => attempt.quiz_id === quiz.id);
        console.log(`📊 Quiz ${quiz.id} (${quiz.title}): ${quizAttempts.length} attempts`);
        
        if (quizAttempts.length > 0) {
          // Find best score
          const bestAttempt = quizAttempts.reduce((best, current) => {
            return (current.score_percentage || 0) > (best.score_percentage || 0) ? current : best;
          });
          
          const bestScore = Math.round(bestAttempt.score_percentage || 0);
          console.log(`🏆 Quiz ${quiz.id} best score: ${bestScore}% (from attempt ${bestAttempt.id})`);
          
          // HANGMAN DEBUG: Extra logging for game format quizzes
          if (quiz.game_format === 'hangman') {
            console.log(`🎯 HANGMAN QUIZ ${quiz.id} SCORE LOADING:`, {
              quizTitle: quiz.title,
              totalAttempts: quizAttempts.length,
              bestScore: bestScore,
              bestAttemptId: bestAttempt.id,
              allScores: quizAttempts.map(a => ({ id: a.id, score: a.score_percentage, completedAt: a.completed_at }))
            });
          }
          
          scores[quiz.id] = {
            bestScore: bestScore,
            attempts: quizAttempts.length,
            lastAttempt: bestAttempt.completed_at
          };
        } else {
          console.log(`⚪ Quiz ${quiz.id} has no attempts yet`);
        }
      });
      
      setQuizScores(scores);
      console.log('✅ Quiz scores loaded:', scores);
    } catch (err) {
      console.error('❌ Error loading quiz scores:', err);
      // Don't fail the whole component if scores can't be loaded
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
      
      console.log('Quiz completion results received:', results);
      
      // Handle game format results (like Hangman) differently
      if (results.isGameFormat && results.gameResults) {
        console.log('Processing game format results:', results.gameResults);
        
        // For game formats, use the score directly from game results
        const gameScore = results.gameResults.score || 0;
        const correctAnswers = results.gameResults.correctAnswers || results.gameResults.correctWords || 0;
        const totalQuestions = results.gameResults.totalLevels || results.gameResults.totalWords || results.totalQuestions || 1;
        
        console.log('🎯 HANGMAN SCORE SUBMISSION:', {
          quizId: selectedQuiz.id,
          gameScore,
          correctAnswers,
          totalQuestions,
          gameFormat: results.gameFormat
        });
        
        // Submit quiz attempt to backend with game-specific data
        const response = await quizService.submitQuizAttempt(
          selectedQuiz.id,
          results.answers,
          results.timeElapsed,
          selectedQuiz,
          {
            gameFormat: results.gameFormat,
            gameResults: results.gameResults,
            score: gameScore,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions
          }
        );
        
        console.log('Game quiz attempt submitted successfully:', response);
        
        // FIX #2: Immediately update quiz score in local state for instant feedback
        const quizId = selectedQuiz.id;
        setQuizScores(prevScores => {
          const currentBest = prevScores[quizId]?.bestScore || 0;
          const newBestScore = Math.max(currentBest, gameScore);
          const newScores = {
            ...prevScores,
            [quizId]: {
              bestScore: newBestScore,
              attempts: (prevScores[quizId]?.attempts || 0) + 1,
              lastAttempt: new Date().toISOString()
            }
          };
          console.log(`🎯 SCORE UPDATE DEBUG:`, {
            quizId,
            gameScore,
            currentBest,
            newBestScore,
            previousScores: prevScores,
            newScores,
            updateSuccess: newScores[quizId].bestScore === newBestScore
          });
          return newScores;
        });
        
        // Store results with proper game score
        const backendResults = response.attempt || {};
        setQuizResults({
          ...results,
          attemptId: backendResults.id,
          score: gameScore, // Use game score directly
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions,
          gameFormat: results.gameFormat,
          gameResults: results.gameResults,
          isGameFormat: true
        });
      } else {
        // Traditional quiz format
        console.log('Submitting traditional quiz attempt:', {
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
        
        console.log('Traditional quiz attempt submitted successfully:', response);
        
        // Store results with backend response data
        const backendResults = response.attempt || {};
        setQuizResults({
          ...results,
          attemptId: backendResults.id,
          score: backendResults.score_percentage || 0,
          correctAnswers: backendResults.correct_answers || 0,
          totalQuestions: backendResults.total_questions || results.totalQuestions
        });
      }
      
      setCurrentView('results');
      setError(null);
      
      // Notify parent component that quiz was completed
      if (onQuizCompleted) {
        onQuizCompleted();
      }
      
      // FIX #1: Add longer delay before refreshing to ensure backend has processed the submission
      console.log('⏳ Waiting for backend to process submission before refreshing scores...');
      setTimeout(async () => {
        console.log('🔄 Refreshing quiz scores after completion...');
        await loadQuizzes();
        console.log('✅ Quiz scores refreshed');
      }, 3000); // Wait 3 seconds for backend processing (increased from 1.5s)
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      setError(`Failed to submit quiz: ${err.message}`);
      
      // Still show results even if submission failed
      // For game formats, ensure we preserve the game score
      if (results.isGameFormat && results.gameResults) {
        setQuizResults({
          ...results,
          score: results.gameResults.score || 0,
          correctAnswers: results.gameResults.correctAnswers || results.gameResults.correctWords || 0,
          totalQuestions: results.gameResults.totalLevels || results.gameResults.totalWords || results.totalQuestions || 1
        });
      } else {
        setQuizResults(results);
      }
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
              <h3>
                {quizResults.isGameFormat && quizResults.gameFormat === 'hangman' ? '🎯 Hangman Results' : 
                 quizResults.isGameFormat && quizResults.gameFormat === 'knowledge_tower' ? '🏗️ Knowledge Tower Results' :
                 'Your Performance'}
              </h3>
              <div className="result-stats">
                {quizResults.score !== undefined && (
                  <div className="stat score-stat">
                    <span className="stat-value score-value">
                      {Math.round(quizResults.score)}%
                    </span>
                    <span className="stat-label">Final Score</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-value">
                    {quizResults.correctAnswers || 0}/{quizResults.totalQuestions}
                  </span>
                  <span className="stat-label">
                    {quizResults.isGameFormat && quizResults.gameFormat === 'hangman' ? 'Words Guessed' :
                     quizResults.isGameFormat && quizResults.gameFormat === 'knowledge_tower' ? 'Levels Completed' :
                     'Correct Answers'}
                  </span>
                </div>
                {!quizResults.isGameFormat && (
                  <div className="stat">
                    <span className="stat-value">
                      {quizResults.answeredQuestions}/{quizResults.totalQuestions}
                    </span>
                    <span className="stat-label">Questions Answered</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-value">
                    {Math.floor(quizResults.timeElapsed / 60)}:{(quizResults.timeElapsed % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="stat-label">Time Taken</span>
                </div>
                {quizResults.isGameFormat && quizResults.gameFormat === 'hangman' && quizResults.gameResults && (
                  <div className="stat">
                    <span className="stat-value">
                      {quizResults.gameResults.totalWrongGuesses || 0}/6
                    </span>
                    <span className="stat-label">Wrong Guesses</span>
                  </div>
                )}
                {quizResults.isGameFormat && quizResults.gameFormat === 'hangman' && quizResults.gameResults && (
                  <div className="stat">
                    <span className="stat-value">
                      {quizResults.gameResults.hangmanComplete ? '✅ Survived' : '☠️ Completed'}
                    </span>
                    <span className="stat-label">Hangman Status</span>
                  </div>
                )}
                {quizResults.isGameFormat && quizResults.gameFormat === 'knowledge_tower' && quizResults.gameResults && (
                  <div className="stat">
                    <span className="stat-value">
                      {quizResults.gameResults.finalLevel || quizResults.totalQuestions}/{quizResults.totalQuestions}
                    </span>
                    <span className="stat-label">Highest Level</span>
                  </div>
                )}
                {quizResults.isGameFormat && quizResults.gameFormat === 'knowledge_tower' && quizResults.gameResults && (
                  <div className="stat">
                    <span className="stat-value">
                      {quizResults.gameResults.completed ? '✅ Completed' : '🏗️ In Progress'}
                    </span>
                    <span className="stat-label">Tower Status</span>
                  </div>
                )}
              </div>
              
              {quizResults.isGameFormat && quizResults.gameFormat === 'hangman' && quizResults.gameResults && (
                <div className="game-specific-results">
                  <h4>🎮 Game Details</h4>
                  <div className="game-details">
                    <p><strong>Game Status:</strong> {quizResults.gameResults.completed ? 'Completed all words' : 'Exited early'}</p>
                    {quizResults.gameResults.exitedEarly && (
                      <p><strong>Note:</strong> You exited the game early, but your progress was saved!</p>
                    )}
                    <p><strong>Performance:</strong> 
                      {quizResults.score >= 90 ? ' 🏆 Excellent!' :
                       quizResults.score >= 70 ? ' 🌟 Great job!' :
                       quizResults.score >= 50 ? ' 👍 Good work!' :
                       ' 💪 Keep practicing!'}
                    </p>
                  </div>
                </div>
              )}
              
              {quizResults.isGameFormat && quizResults.gameFormat === 'knowledge_tower' && quizResults.gameResults && (
                <div className="game-specific-results">
                  <h4>🏗️ Tower Details</h4>
                  <div className="game-details">
                    <p><strong>Tower Status:</strong> {quizResults.gameResults.completed ? 'Successfully climbed to the top!' : 'Challenge in progress'}</p>
                    <p><strong>Highest Level:</strong> Level {quizResults.gameResults.finalLevel || quizResults.correctAnswers} of {quizResults.totalQuestions}</p>
                    {quizResults.gameResults.exitedEarly && (
                      <p><strong>Note:</strong> You exited the tower challenge early, but your progress was saved!</p>
                    )}
                    <p><strong>Performance:</strong> 
                      {quizResults.score >= 90 ? ' 🏆 Master Climber!' :
                       quizResults.score >= 70 ? ' 🌟 Skilled Climber!' :
                       quizResults.score >= 50 ? ' 👍 Good Climber!' :
                       ' 💪 Keep climbing!'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="results-actions">
            <button onClick={() => setCurrentView('taking')} className="retake-btn">
              Retake Quiz
            </button>
            <button 
              onClick={async () => {
                console.log('🔄 Force refreshing scores...');
                setLoading(true);
                await loadQuizzes();
                setLoading(false);
                goBackToList();
              }} 
              className="refresh-scores-btn"
              title="Force refresh scores and return to quiz list"
            >
              🔄 Refresh Scores & Return
            </button>
            <button 
              onClick={goBackToList} 
              className="done-btn"
            >
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
        <div className="header-actions">
          <p>Select a quiz to start practicing</p>
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              loadQuizzes();
            }} 
            className="refresh-btn"
            title="Refresh scores"
          >
            🔄 Refresh
          </button>
        </div>
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
                  <div>
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
                  {quizScores[quiz.id] ? (
                    <div className="quiz-score-info">
                      <span className="best-score">
                        🏆 Best: {quizScores[quiz.id].bestScore}%
                      </span>
                      <span className="attempts-count">
                        📊 {quizScores[quiz.id].attempts} attempt{quizScores[quiz.id].attempts !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="quiz-score-info">
                      <span className="no-attempts">
                        🎯 No attempts yet
                      </span>
                    </div>
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
