import React, { useState, useEffect } from 'react';
import './MemoryGridGame.css';

const MemoryGridGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'memorize', 'recall', 'complete'
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showPattern, setShowPattern] = useState(true);
  const [userSequence, setUserSequence] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [memoryTimer, setMemoryTimer] = useState(0);
  const [selectedCells, setSelectedCells] = useState(new Set());

  // Extract game data
  const patterns = gameData?.questions?.map(q => q.pattern_data) || gameData?.patterns || [
    {
      grid: [
        ["🔧", "💻", "🔧", "📝"],
        ["📝", "🔧", "💻", "🔧"],
        ["💻", "📝", "🔧", "💻"],
        ["🔧", "💻", "📝", "🔧"]
      ],
      sequence: [0, 5, 10, 15],
      symbols: ["🔧", "💻", "📝"]
    }
  ];

  const gridSize = gameData?.metadata?.gridSize || 4;
  const memoryTime = gameData?.metadata?.memoryTime || 5;
  const currentPattern = patterns[currentLevel] || patterns[0];

  // Timer effects
  useEffect(() => {
    let interval;
    if (gameState !== 'intro' && gameState !== 'complete') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Memory timer for showing pattern
  useEffect(() => {
    let interval;
    if (gameState === 'memorize' && showPattern) {
      setMemoryTimer(memoryTime);
      interval = setInterval(() => {
        setMemoryTimer(prev => {
          if (prev <= 1) {
            setShowPattern(false);
            setGameState('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, showPattern, memoryTime]);

  // Notify parent of answer changes
  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange({
        currentLevel,
        userSequence,
        score,
        lives,
        timeElapsed,
        gameState
      });
    }
  }, [currentLevel, userSequence, score, lives, timeElapsed, gameState, onAnswerChange]);

  const startGame = () => {
    setGameState('memorize');
    setShowPattern(true);
    setUserSequence([]);
    setSelectedCells(new Set());
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
  };

  const handleCellClick = (index) => {
    if (gameState !== 'recall' || selectedCells.has(index)) return;

    const newSequence = [...userSequence, index];
    const newSelected = new Set([...selectedCells, index]);
    
    setUserSequence(newSequence);
    setSelectedCells(newSelected);

    // Check if sequence matches expected pattern so far
    const expectedSequence = currentPattern.sequence;
    const isCorrectSoFar = newSequence.every((val, idx) => val === expectedSequence[idx]);

    if (!isCorrectSoFar) {
      // Wrong sequence
      handleWrongAnswer();
      return;
    }

    // Check if pattern is complete
    if (newSequence.length === expectedSequence.length) {
      handleLevelComplete();
    }
  };

  const handleLevelComplete = () => {
    const levelScore = calculateLevelScore();
    setScore(prev => prev + levelScore);

    if (currentLevel < patterns.length - 1) {
      // Next level
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        setGameState('memorize');
        setShowPattern(true);
        setUserSequence([]);
        setSelectedCells(new Set());
      }, 1000);
    } else {
      // Game complete
      setGameState('complete');
      if (onGameComplete) {
        onGameComplete({
          success: true,
          score: score + levelScore,
          levels: patterns.length,
          timeElapsed,
          accuracy: calculateAccuracy()
        });
      }
    }
  };

  const handleWrongAnswer = () => {
    setLives(prev => prev - 1);
    
    if (lives <= 1) {
      // Game over
      setGameState('complete');
      if (onGameComplete) {
        onGameComplete({
          success: false,
          score,
          levels: currentLevel + 1,
          timeElapsed,
          accuracy: calculateAccuracy()
        });
      }
    } else {
      // Reset current level
      setTimeout(() => {
        setGameState('memorize');
        setShowPattern(true);
        setUserSequence([]);
        setSelectedCells(new Set());
      }, 1000);
    }
  };

  const calculateLevelScore = () => {
    const baseScore = 100;
    const timeBonus = Math.max(0, 50 - Math.floor(timeElapsed / 5));
    const levelMultiplier = currentLevel + 1;
    return Math.round((baseScore + timeBonus) * levelMultiplier);
  };

  const calculateAccuracy = () => {
    const totalAttempts = userSequence.length + (lives < 3 ? (3 - lives) * currentPattern.sequence.length : 0);
    const correctAttempts = userSequence.filter((val, idx) => val === currentPattern.sequence[idx]).length;
    return totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
  };

  const resetGame = () => {
    setGameState('intro');
    setCurrentLevel(0);
    setShowPattern(true);
    setUserSequence([]);
    setSelectedCells(new Set());
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGrid = () => {
    const grid = currentPattern.grid;
    const flatGrid = grid.flat();
    
    return (
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {flatGrid.map((symbol, index) => {
          const isInSequence = currentPattern.sequence.includes(index);
          const isSelected = selectedCells.has(index);
          const shouldHighlight = showPattern && isInSequence;
          
          return (
            <div
              key={index}
              className={`grid-cell ${shouldHighlight ? 'highlight' : ''} ${isSelected ? 'selected' : ''} ${gameState === 'recall' ? 'clickable' : ''}`}
              onClick={() => handleCellClick(index)}
            >
              {showPattern || isSelected ? symbol : '❓'}
            </div>
          );
        })}
      </div>
    );
  };

  if (gameState === 'intro') {
    return (
      <div className="memory-grid-container">
        <div className="game-intro">
          <h2>🧠 Memory Grid Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Study the pattern of highlighted symbols for {memoryTime} seconds</li>
              <li>When the timer ends, click the cells in the <strong>correct sequence</strong></li>
              <li>Remember both the <strong>symbols</strong> and their <strong>order</strong></li>
              <li>You have <strong>3 lives</strong> - make them count!</li>
              <li>Complete all levels to win</li>
            </ul>
          </div>
          <div className="game-preview">
            <p>Grid Size: <strong>{gridSize} × {gridSize}</strong></p>
            <p>Memory Time: <strong>{memoryTime} seconds</strong></p>
            <p>Levels: <strong>{patterns.length}</strong></p>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start Memory Challenge
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'complete') {
    const success = lives > 0;
    return (
      <div className="memory-grid-container">
        <div className="completion-screen">
          <h2>{success ? '🎉 Congratulations!' : '💔 Game Over'}</h2>
          <div className="final-stats">
            <div className="stat-card">
              <div className="stat-value">{score}</div>
              <div className="stat-label">Final Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{currentLevel + (success ? 1 : 0)}</div>
              <div className="stat-label">Levels Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatTime(timeElapsed)}</div>
              <div className="stat-label">Time Elapsed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{calculateAccuracy()}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>
          <div className="completion-actions">
            <button className="play-again-btn" onClick={resetGame}>
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-grid-container">
      <div className="game-header">
        <div className="game-info">
          <h2>🧠 Memory Grid</h2>
          <div className="level-info">
            Level {currentLevel + 1} of {patterns.length}
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
              {'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      <div className="game-content">
        {gameState === 'memorize' && (
          <div className="memorize-phase">
            <div className="phase-header">
              <h3>📚 Memorize the Pattern</h3>
              <div className="countdown-timer">
                <div className="timer-circle">
                  <span className="timer-text">{memoryTimer}</span>
                </div>
                <p>Study the highlighted sequence!</p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'recall' && (
          <div className="recall-phase">
            <div className="phase-header">
              <h3>🎯 Recall the Sequence</h3>
              <div className="sequence-progress">
                <p>Click the cells in order: {userSequence.length}/{currentPattern.sequence.length}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(userSequence.length / currentPattern.sequence.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid-container">
          {renderGrid()}
        </div>

        <div className="sequence-display">
          <h4>Your Sequence:</h4>
          <div className="sequence-cells">
            {userSequence.map((index, pos) => {
              const symbol = currentPattern.grid.flat()[index];
              const isCorrect = index === currentPattern.sequence[pos];
              return (
                <div key={pos} className={`sequence-cell ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {symbol}
                </div>
              );
            })}
            {userSequence.length < currentPattern.sequence.length && (
              <div className="sequence-cell next">?</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGridGame;