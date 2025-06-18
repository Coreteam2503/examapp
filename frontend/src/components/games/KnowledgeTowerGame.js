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
      // Game complete
      if (onGameComplete) {
        onGameComplete({
          results: gameResults,
          totalLevels,
          timeElapsed,
          finalLevel: currentLevel,
          completed: true
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
          </div>
        </div>
      );
    }

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
          <h4 className="question-text">{currentLevelQuestion.question}</h4>
          
          {currentLevelQuestion.options && (
            <div className="options-container">
              {currentLevelQuestion.options.map((option, index) => (
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
          )}
        </div>
        
        {!showResult && (
          <div className="question-actions">
            <button 
              className="submit-btn"
              onClick={submitAnswer}
              disabled={!selectedAnswer}
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
          
          <div className="result-actions">
            {isCorrect && currentLevel < totalLevels && (
              <button className="next-level-btn" onClick={nextLevel}>
                Climb to Level {currentLevel + 1} 🧗‍♂️
              </button>
            )}
            
            {isCorrect && currentLevel >= totalLevels && (
              <button className="complete-game-btn" onClick={() => onGameComplete && onGameComplete({
                results: gameResults,
                totalLevels,
                timeElapsed,
                finalLevel: currentLevel,
                completed: true
              })}>
                Complete Tower! 🏆
              </button>
            )}
            
            {!isCorrect && (
              <button className="retry-btn" onClick={restartLevel}>
                Try Again 🔄
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
