import React, { useState, useEffect } from 'react';
import './KnowledgeTowerGame.css';

const KnowledgeTowerGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [towerHeight, setTowerHeight] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const questions = gameData?.questions || [];
  const totalLevels = gameData?.metadata?.totalLevels || 5;
  
  // Get questions for current level
  const currentLevelQuestions = questions.filter(q => q.level_number === currentLevel);
  const currentLevelQuestion = currentLevelQuestions[0]; // Assuming one question per level for simplicity

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update tower height based on progress
  useEffect(() => {
    const progress = (currentLevel - 1) / totalLevels;
    setTowerHeight(progress * 100);
  }, [currentLevel, totalLevels]);

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

  const confirmExitGame = () => {
    // Calculate final results from current progress
    const finalResults = [...gameResults];
    
    // Add current level result if in progress
    if (!showResult && currentLevel <= totalLevels) {
      const currentResult = {
        level: currentLevel,
        question: currentLevelQuestion?.question || '',
        selectedAnswer: selectedAnswer || 'No answer',
        correctAnswer: currentLevelQuestion?.correct_answer || '',
        isCorrect: false, // Mark as incomplete
        timeSpent: timeElapsed,
        levelTheme: currentLevelQuestion?.level_theme || 'General',
        incomplete: true
      };
      if (selectedAnswer) {
        finalResults.push(currentResult);
      }
    }
    
    const totalLevelsAttempted = finalResults.length;
    const correctAnswers = finalResults.filter(result => result.isCorrect).length;
    const finalScore = totalLevelsAttempted > 0 ? Math.round((correctAnswers / totalLevelsAttempted) * 100) : 0;
    
    // For debugging: console.log('Knowledge Tower game exited early:', { finalResults, totalLevelsAttempted, correctAnswers, finalScore, timeElapsed });
    
    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalLevels,
        timeElapsed,
        finalLevel: currentLevel,
        completed: false, // Mark as incomplete/exited
        score: finalScore,
        correctAnswers,
        totalQuestions: totalLevelsAttempted,
        exitedEarly: true
      });
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !currentLevelQuestion) return;

    const isCorrect = selectedAnswer === currentLevelQuestion.correct_answer;
    const result = {
      level: currentLevel,
      question: currentLevelQuestion.question,
      selectedAnswer,
      correctAnswer: currentLevelQuestion.correct_answer,
      isCorrect,
      timeSpent: timeElapsed,
      levelTheme: currentLevelQuestion.level_theme || 'General'
    };

    setGameResults(prev => [...prev, result]);
    setAnsweredQuestions(prev => ({
      ...prev,
      [currentLevel]: result
    }));

    if (onAnswerChange) {
      onAnswerChange({
        currentLevel,
        result,
        allResults: [...gameResults, result]
      });
    }

    setShowResult(true);
  };

  const nextLevel = () => {
    if (currentLevel < totalLevels) {
      setCurrentLevel(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      // Game complete - show final score
      const finalResults = gameResults;
      const correctAnswers = finalResults.filter(r => r.isCorrect).length;
      const totalQuestions = finalResults.length;
      const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      
      // For debugging: console.log('Game completed:', { finalResults, correctAnswers, totalQuestions, finalScore });
      
      if (onGameComplete) {
        onGameComplete({
          results: finalResults,
          totalLevels,
          timeElapsed,
          finalLevel: currentLevel,
          completed: true,
          score: finalScore,
          correctAnswers,
          totalQuestions
        });
      }
    }
  };

  const restartLevel = () => {
    setSelectedAnswer('');
    setShowResult(false);
    // Remove the answer for this level
    setAnsweredQuestions(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentLevel];
      return newAnswers;
    });
    // Remove from results
    setGameResults(prev => prev.filter(result => result.level !== currentLevel));
  };

  const renderTower = () => {
    const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);
    
    return (
      <div className="tower-container">
        <div className="tower">
          {levels.reverse().map(level => {
            const isCompleted = answeredQuestions[level]?.isCorrect;
            const isFailed = answeredQuestions[level] && !answeredQuestions[level].isCorrect;
            const isCurrent = level === currentLevel;
            const isLocked = level > currentLevel;
            
            return (
              <div 
                key={level}
                className={`tower-level ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => {
                  if (level <= currentLevel && !showResult) {
                    setCurrentLevel(level);
                    setSelectedAnswer('');
                    setShowResult(false);
                  }
                }}
              >
                <div className="level-number">{level}</div>
                <div className="level-status">
                  {isCompleted && '✅'}
                  {isFailed && '❌'}
                  {isCurrent && '👤'}
                  {isLocked && '🔒'}
                </div>
                <div className="level-theme">
                  {questions.find(q => q.level_number === level)?.level_theme || `Level ${level}`}
                </div>
              </div>
            );
          })}
          
          {/* Tower base */}
          <div className="tower-base">
            <div className="base-text">Knowledge Tower</div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="tower-progress">
          <div 
            className="progress-fill"
            style={{ height: `${towerHeight}%` }}
          />
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    if (!currentLevelQuestion) {
      return (
        <div className="question-section">
          <div className="error-message">
            <h3>No question available for Level {currentLevel}</h3>
            <p>This level might not have been generated yet.</p>
            <button onClick={() => setCurrentLevel(1)} className="back-to-start-btn">
              Go to Level 1
            </button>
          </div>
        </div>
      );
    }

    // Parse question text and options if they're stored as JSON strings
    let questionText = currentLevelQuestion.question_text || currentLevelQuestion.question || '';
    let options = currentLevelQuestion.options;
    
    // Handle case where options might be stored as JSON string
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        // For debugging: console.warn('Failed to parse options:', options);
        options = [];
      }
    }

    // For debugging: console.log('Rendering question:', { level: currentLevel, questionText, options, rawQuestion: currentLevelQuestion });

    return (
      <div className="question-section">
        <div className="question-header">
          <h3>Level {currentLevel}: {currentLevelQuestion.level_theme || 'General Knowledge'}</h3>
          <div className="question-difficulty">
            Difficulty: <span className={`difficulty-${currentLevelQuestion.difficulty}`}>
              {currentLevelQuestion.difficulty || 'medium'}
            </span>
          </div>
        </div>
        
        <div className="question-content">
          <h4 className="question-text">{questionText}</h4>
          
          {options && Array.isArray(options) && options.length > 0 ? (
            <div className="options-container">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-input-container">
              <input
                type="text"
                className="answer-input"
                value={selectedAnswer}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
                disabled={showResult}
                autoFocus
              />
            </div>
          )}
        </div>
        
        {!showResult && (
          <div className="question-actions">
            <button 
              className="submit-btn"
              onClick={submitAnswer}
              disabled={!selectedAnswer || selectedAnswer.trim() === ''}
            >
              Submit Answer 🚀
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    if (!showResult || !answeredQuestions[currentLevel]) return null;

    const result = answeredQuestions[currentLevel];
    const isCorrect = result.isCorrect;
    const isLastLevel = currentLevel >= totalLevels;

    return (
      <div className={`result-modal ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="result-content">
          <div className="result-icon">
            {isCorrect ? '🎉' : '😞'}
          </div>
          
          <h3>
            {isCorrect ? 'Excellent!' : 'Not quite right'}
          </h3>
          
          <div className="result-details">
            <p><strong>Your answer:</strong> {result.selectedAnswer}</p>
            <p><strong>Correct answer:</strong> {result.correctAnswer}</p>
            {isCorrect && <p className="success-message">You can climb to the next level!</p>}
            {!isCorrect && <p className="failure-message">Study the material and try again!</p>}
          </div>
          
          {/* Show final score if this is the last level AND answered correctly */}
          {isLastLevel && isCorrect && (
            <div className="final-score-display">
              <h4>🏆 Tower Challenge Complete!</h4>
              <div className="final-stats">
                <div className="stat-item">
                  <span className="stat-value">{Math.round((Object.values(answeredQuestions).filter(r => r.isCorrect).length / totalLevels) * 100)}%</span>
                  <span className="stat-label">Final Score</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{Object.values(answeredQuestions).filter(r => r.isCorrect).length}/{totalLevels}</span>
                  <span className="stat-label">Correct Answers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{formatTime(timeElapsed)}</span>
                  <span className="stat-label">Time Taken</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="result-actions">
            {/* ALWAYS show Try Again button for ANY incorrect answer - this should work for all levels including the last one */}
            {!isCorrect && (
              <button className="retry-btn" onClick={restartLevel}>
                Try Again 🔄
              </button>
            )}
            
            {/* Show next level button only for correct answers on non-final levels */}
            {isCorrect && currentLevel < totalLevels && (
              <button className="next-level-btn" onClick={nextLevel}>
                Climb to Level {currentLevel + 1} 🧗‍♂️
              </button>
            )}
            
            {/* Show completion button only when the last level is answered correctly */}
            {isLastLevel && isCorrect && (
              <button className="complete-game-btn" onClick={() => {
                const finalResults = gameResults;
                const correctAnswers = finalResults.filter(r => r.isCorrect).length;
                const finalScore = Math.round((correctAnswers / totalLevels) * 100);
                
                // For debugging: console.log('Knowledge Tower completed:', { finalResults, correctAnswers, totalLevels, finalScore });
                
                onGameComplete && onGameComplete({
                  results: finalResults,
                  totalLevels,
                  timeElapsed,
                  finalLevel: currentLevel,
                  completed: true,
                  score: finalScore,
                  correctAnswers,
                  totalQuestions: totalLevels
                });
              }}>
                Complete Tower! 🏆
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const correctAnswers = Object.values(answeredQuestions).filter(result => result.isCorrect).length;
    return Math.round((correctAnswers / totalLevels) * 100);
  };

  if (!gameData || !questions.length) {
    return (
      <div className="knowledge-tower-game">
        <div className="error-message">
          <h3>Game data not available</h3>
          <p>Unable to load Knowledge Tower game data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-tower-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>🏗️ Knowledge Tower</h2>
          <div className="game-stats">
            <span className="current-level">Level {currentLevel} of {totalLevels}</span>
            <span className="time">Time: {formatTime(timeElapsed)}</span>
            <span className="score">Score: {calculateScore()}%</span>
          </div>
        </div>
        
        <div className="game-actions">
          <button 
            className="exit-game-btn"
            onClick={handleExitGame}
            title="Exit Game"
          >
            🚪 Exit Quiz
          </button>
        </div>
        
        <div className="game-description">
          <p>Climb the Knowledge Tower by answering questions correctly. Each level builds on the previous one!</p>
        </div>
      </div>

      {/* Game Content */}
      <div className="game-content">
        {/* Tower Visualization */}
        <div className="tower-section">
          {renderTower()}
        </div>

        {/* Question Section */}
        <div className="question-area">
          {renderQuestion()}
        </div>
      </div>

      {/* Result Modal */}
      {renderResult()}

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="exit-confirmation-overlay">
          <div className="exit-confirmation-dialog">
            <div className="exit-confirmation-content">
              <h3>🚪 Exit Tower Challenge?</h3>
              <p>Are you sure you want to exit the Knowledge Tower game?</p>
              <div className="exit-current-progress">
                <p><strong>Current Progress:</strong></p>
                <ul>
                  <li>Current Level: {currentLevel}/{totalLevels}</li>
                  <li>Levels completed: {Object.values(answeredQuestions).filter(r => r.isCorrect).length}</li>
                  <li>Time elapsed: {formatTime(timeElapsed)}</li>
                  <li>Current score: {calculateScore()}%</li>
                </ul>
                <p className="exit-warning">
                  ⚠️ Your progress will be saved, but the quiz will be marked as incomplete.
                </p>
              </div>
              <div className="exit-confirmation-actions">
                <button 
                  className="exit-cancel-btn"
                  onClick={cancelExitGame}
                >
                  ❌ Cancel
                </button>
                <button 
                  className="exit-confirm-btn"
                  onClick={confirmExitGame}
                >
                  🚪 Exit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="progress-summary">
        <h4>Tower Progress</h4>
        <div className="levels-summary">
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map(level => {
            const result = answeredQuestions[level];
            return (
              <div key={level} className={`level-summary ${result ? (result.isCorrect ? 'completed' : 'failed') : 'pending'}`}>
                <span className="level-num">L{level}</span>
                <span className="level-status">
                  {result ? (result.isCorrect ? '✅' : '❌') : '⏳'}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="summary-stats">
          <span>Completed: {Object.values(answeredQuestions).filter(r => r.isCorrect).length}/{totalLevels}</span>
          <span>Success Rate: {calculateScore()}%</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTowerGame;
