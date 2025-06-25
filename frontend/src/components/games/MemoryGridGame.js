import React, { useState, useEffect } from 'react';
import './MemoryGridGame.css';

const MemoryGridGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [gameState, setGameState] = useState('intro');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [firstSelection, setFirstSelection] = useState(null);
  const [secondSelection, setSecondSelection] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showGameOverAlert, setShowGameOverAlert] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false); // NEW: Custom modal state

  const programmingContent = [
    {
      type: 'programming',
      leftColumn: [
        { content: 'str(42)' },
        { content: 'print("Hello World")' },
        { content: 'max([1, 5, 3])' },
        { content: 'x = 5' },
        { content: '"Hi" * 3' },
        { content: 'bool(0)' }
      ],
      rightColumn: [
        { content: 'Returns: False' },
        { content: 'Outputs: 5' },
        { content: 'Returns: 5' },
        { content: 'Outputs: Hello World' },
        { content: 'Result: HiHiHi' },
        { content: 'Returns: 42' }
      ],
      pairs: [[0, 5], [1, 3], [2, 2], [3, 1], [4, 4], [5, 0]]
    }
  ];

  const currentPattern = programmingContent[currentLevel] || programmingContent[0];

  useEffect(() => {
    let interval;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange({
        currentLevel,
        score,
        lives,
        timeElapsed,
        gameState,
        matchedPairs: matchedPairs.size
      });
    }
  }, [currentLevel, score, lives, timeElapsed, gameState, matchedPairs, onAnswerChange]);

  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
    setMatchedPairs(new Set());
    setFirstSelection(null);
    setSecondSelection(null);
    setShowFeedback(false);
    setShowGameOverAlert(false);
    setShowExitConfirmation(false);
  };

  const handleCardClick = (column, index) => {
    if (gameState !== 'playing' || showFeedback) return;
    
    const cardId = `${column}-${index}`;
    
    if (matchedPairs.has(cardId)) return;
    
    if (firstSelection === null) {
      setFirstSelection(cardId);
    } else if (firstSelection === cardId) {
      setFirstSelection(null);
    } else {
      setSecondSelection(cardId);
      setShowFeedback(true);
      
      setTimeout(() => {
        checkMatch(firstSelection, cardId);
      }, 600);
    }
  };

  const checkMatch = (first, second) => {
    const [firstCol, firstIdx] = first.split('-');
    const [secondCol, secondIdx] = second.split('-');
    
    if (firstCol === secondCol) {
      handleWrongMatch();
      return;
    }
    
    const leftIdx = firstCol === 'left' ? parseInt(firstIdx) : parseInt(secondIdx);
    const rightIdx = firstCol === 'right' ? parseInt(firstIdx) : parseInt(secondIdx);
    
    const isValidPair = currentPattern.pairs.some(pair => 
      pair[0] === leftIdx && pair[1] === rightIdx
    );
    
    if (isValidPair) {
      const newMatched = new Set([...matchedPairs, first, second]);
      setMatchedPairs(newMatched);
      setScore(prev => prev + 100);
      
      const totalCards = currentPattern.leftColumn.length + currentPattern.rightColumn.length;
      
      if (newMatched.size === totalCards) {
        handleLevelComplete();
      } else {
        resetSelections();
      }
    } else {
      handleWrongMatch();
    }
  };

  const handleWrongMatch = () => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      setTimeout(() => {
        setShowGameOverAlert(true);
      }, 1000);
    } else {
      setTimeout(() => {
        resetSelections();
      }, 1000);
    }
  };

  const handleLevelComplete = () => {
    setTimeout(() => {
      setGameState('complete');
      if (onGameComplete) {
        onGameComplete({
          success: true,
          score,
          levels: programmingContent.length,
          timeElapsed,
          accuracy: calculateAccuracy()
        });
      }
    }, 1500);
  };

  const resetSelections = () => {
    setFirstSelection(null);
    setSecondSelection(null);
    setShowFeedback(false);
  };

  const calculateAccuracy = () => {
    const wrongMatches = 3 - lives;
    const correctMatches = matchedPairs.size / 2;
    const totalAttempts = correctMatches + wrongMatches;
    
    return totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 100;
  };

  const resetGame = () => {
    setGameState('intro');
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
    setMatchedPairs(new Set());
    setFirstSelection(null);
    setSecondSelection(null);
    setShowFeedback(false);
    setShowGameOverAlert(false);
    setShowExitConfirmation(false);
  };

  const handleGameOverRetake = () => {
    setShowGameOverAlert(false);
    startGame();
  };

  const handleGameOverExit = () => {
    setShowGameOverAlert(false);
    setGameState('complete');
    if (onGameComplete) {
      onGameComplete({
        success: false,
        score,
        levels: currentLevel + 1,
        timeElapsed,
        accuracy: calculateAccuracy(),
        reason: 'No lives remaining'
      });
    }
  };

  // FIXED: Replace alert() with custom modal
  const handleExitGame = () => {
    setShowExitConfirmation(true); // Show custom modal instead of alert
  };

  // NEW: Handle modal actions
  const confirmExitQuiz = () => {
    setShowExitConfirmation(false);
    setGameState('complete');
    if (onGameComplete) {
      onGameComplete({
        success: false,
        score,
        levels: currentLevel + 1,
        timeElapsed,
        completed: false,
        exitedEarly: true,
        accuracy: calculateAccuracy()
      });
    }
  };

  const cancelExitQuiz = () => {
    setShowExitConfirmation(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (item, column, index) => {
    if (!item) return null;
    
    const cardId = `${column}-${index}`;
    const isSelected = firstSelection === cardId || secondSelection === cardId;
    const isMatched = matchedPairs.has(cardId);
    const isClickable = !isMatched && gameState === 'playing' && !showFeedback;

    return (
      <div
        key={cardId}
        className={`memory-card ${
          isMatched ? 'matched' : ''
        } ${
          isSelected ? 'selected' : ''
        } ${
          isClickable ? 'clickable' : ''
        }`}
        onClick={() => isClickable && handleCardClick(column, index)}
      >
        <div className="card-text">{item.content}</div>
      </div>
    );
  };

  const renderLives = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      if (i < lives) {
        hearts.push(<span key={i} style={{color: '#e74c3c'}}>&hearts;</span>);
      } else {
        hearts.push(<span key={i} style={{color: '#bdc3c7'}}>&hearts;</span>);
      }
    }
    return hearts;
  };

  if (gameState === 'intro') {
    return (
      <div className="memory-grid-container">
        <div className="game-intro">
          <h2>Programming Memory Grid Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Match programming code snippets with their outputs or corrected versions</li>
              <li>Click one card from the left column and one from the right column</li>
              <li>You have 3 lives - wrong matches cost a life</li>
              <li>After 3 wrong matches, the game ends</li>
              <li>Match all pairs to complete each level</li>
            </ul>
          </div>
          <div className="game-preview">
            <p>Total Levels: <strong>{programmingContent.length}</strong></p>
            <p>Lives: <strong>3</strong></p>
            <p>Challenge: <strong>Programming Code Matching</strong></p>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start Programming Challenge
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'complete') {
    const success = lives > 0;
    const levelsCompleted = success ? programmingContent.length : currentLevel + 1;
    const finalScore = calculateAccuracy();
    
    return (
      <div className="memory-grid-container">
        <div className="score-screen">
          <div className="score-header">
            <div className="game-icon">🧠</div>
            <h2>Memory Grid Results</h2>
          </div>
          
          <div className="score-stats">
            <div className="stat-item">
              <div className="stat-value">{finalScore}%</div>
              <div className="stat-label">Final Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{matchedPairs.size / 2}/{currentPattern.pairs.length}</div>
              <div className="stat-label">Pairs Matched</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTime(timeElapsed)}</div>
              <div className="stat-label">Time Taken</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{levelsCompleted}/{programmingContent.length}</div>
              <div className="stat-label">Levels Done</div>
            </div>
          </div>

          <div className="grid-details">
            <div className="grid-details-header">
              <div className="grid-icon">🧠</div>
              <span>Grid Details</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Grid Status:</span>
              <span className="detail-value">{success ? 'Completed successfully!' : 'Challenge in progress'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Best Pairs:</span>
              <span className="detail-value">{matchedPairs.size / 2} of {currentPattern.pairs.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Note:</span>
              <span className="detail-value">{success ? 'Congratulations! You matched all programming pairs!' : 'You exited the memory grid challenge early, but your progress was saved!'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Performance:</span>
              <span className="detail-value performance-icon">👍 {finalScore >= 80 ? 'Excellent work!' : finalScore >= 60 ? 'Good effort!' : 'Keep practicing!'}</span>
            </div>
          </div>

          <div className="score-actions">
            <button className="retake-quiz-btn" onClick={resetGame}>
              Retake Quiz
            </button>
            <button 
              className="done-btn" 
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Alert Component
  const GameOverAlert = () => {
    if (!showGameOverAlert) return null;

    return (
      <div className="game-over-overlay">
        <div className="game-over-dialog">
          <div className="game-over-header">
            <div className="game-over-icon">&#x274C;</div>
            <h3>Game Over</h3>
          </div>
          <div className="game-over-content">
            <p>You've used all 3 lives! Would you like to try again or exit to the score screen?</p>
            <div className="game-over-stats">
              <div className="stat-row">
                <span className="stat-label">Score:</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Time:</span>
                <span className="stat-value">{formatTime(timeElapsed)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Matches:</span>
                <span className="stat-value">{matchedPairs.size / 2}</span>
              </div>
            </div>
          </div>
          <div className="game-over-actions">
            <button className="retake-game-btn" onClick={handleGameOverRetake}>
              &#x1F501; Retake Quiz
            </button>
            <button className="exit-to-score-btn" onClick={handleGameOverExit}>
              &#x1F6AA; Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Custom Exit Confirmation Modal (replacing alert)
  const ExitConfirmationModal = () => {
    if (!showExitConfirmation) return null;

    return (
      <div className="exit-confirmation-overlay">
        <div className="exit-confirmation-dialog">
          <div className="exit-confirmation-content">
            <h3>🚨 Exit Memory Grid Challenge?</h3>
            <p>Are you sure you want to exit the quiz?</p>
            
            <div className="current-progress">
              <h4>Current Progress:</h4>
              <ul>
                <li>Pairs matched: {matchedPairs.size / 2}/{currentPattern.pairs.length}</li>
                <li>Lives remaining: {lives}/3</li>
                <li>Time elapsed: {formatTime(timeElapsed)}</li>
                <li>Current score: {score}</li>
              </ul>
              
              <div className="progress-warning">
                ⚠️ Your progress will be saved, but the quiz will be marked as incomplete.
              </div>
            </div>
            
            <div className="exit-confirmation-actions">
              <button className="exit-cancel-btn" onClick={cancelExitQuiz}>
                ❌ Continue Playing
              </button>
              <button className="exit-confirm-btn" onClick={confirmExitQuiz}>
                📊 Exit Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="memory-grid-container">
      <GameOverAlert />
      <ExitConfirmationModal />
      <div className="game-header">
        <div className="game-info">
          <h2>Programming Memory Grid</h2>
          <div className="level-info">
            Level {currentLevel + 1} of {programmingContent.length}
          </div>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Score:</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Lives:</span>
            <span className="stat-value">
              {renderLives()}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="game-actions">
          <button 
            className="exit-game-btn"
            onClick={handleExitGame}
            title="Exit Game"
          >
            Exit Quiz
          </button>
        </div>
      </div>

      <div className="main-game-area">
        <div className="column-headers">
          <div className="column-header left-header">
            <span className="header-icon">&#x1F4BB;</span>
            <span className="header-text">Code Snippets</span>
          </div>
          <div className="column-header right-header">
            <span className="header-icon">&#x1F4CB;</span>
            <span className="header-text">Outputs / Solutions</span>
          </div>
        </div>

        <div className="game-grid">
          <div className="left-column">
            <div className="cards-container">
              {currentPattern.leftColumn.map((item, index) => 
                renderCard(item, 'left', index)
              )}
            </div>
          </div>

          <div className="vertical-divider"></div>

          <div className="right-column">
            <div className="cards-container">
              {currentPattern.rightColumn.map((item, index) => 
                renderCard(item, 'right', index)
              )}
            </div>
          </div>
        </div>

        <div className="tip-container">
          <div className="tip-box">
            &#x1F4A1; <strong>Tip:</strong> Match items from the left column with their corresponding answers in the right column!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGridGame;