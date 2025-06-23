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
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [firstSelection, setFirstSelection] = useState(null);
  const [wrongMatches, setWrongMatches] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Extract game data with better error handling - moved before useEffects
  const patterns = gameData?.questions?.map(q => {
    try {
      return typeof q.pattern_data === 'string' ? JSON.parse(q.pattern_data) : q.pattern_data;
    } catch (e) {
      console.warn('Failed to parse pattern_data:', q.pattern_data);
      return null;
    }
  }).filter(Boolean) || gameData?.patterns || [
    {
      grid: [
        ["A", "B", "A", "C"],
        ["C", "A", "B", "A"],
        ["B", "C", "A", "B"],
        ["A", "B", "C", "A"]
      ],
      sequence: [0, 5, 10, 15],
      symbols: ["A", "B", "C"]
    }
  ];

  const gridSize = gameData?.metadata?.gridSize || 4;
  const memoryTime = gameData?.metadata?.memoryTime || 5;
  
  // Detect game mode based on pattern data structure
  const gameMode = currentLevel < patterns.length && patterns[currentLevel]?.type === 'programming' ? 'programming' : 'memory';
  
  // Ensure we have a valid current pattern with fallback
  const currentPattern = patterns[currentLevel] || patterns[0] || {
    grid: [
      ["A", "B", "A", "C"],
      ["C", "A", "B", "A"],
      ["B", "C", "A", "B"],
      ["A", "B", "C", "A"]
    ],
    sequence: [0, 5, 10, 15],
    symbols: ["A", "B", "C"]
  };

  // Timer effects - ALL useEffects must come after state declarations
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

  // Validation after ALL hooks are declared
  if (!gameData) {
    console.error('MemoryGridGame: gameData is required');
    return (
      <div className="memory-grid-container">
        <div className="error-message">
          Game data not available. Please try generating the game again.
        </div>
      </div>
    );
  }

  const startGame = () => {
    if (gameMode === 'programming') {
      setGameState('recall'); // Programming mode starts directly in recall
      setShowPattern(false);
    } else {
      setGameState('memorize');
      setShowPattern(true);
    }
    setUserSequence([]);
    setSelectedCells(new Set());
    setMatchedPairs(new Set());
    setFirstSelection(null);
    setWrongMatches(0);
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
  };

  const handleCellClick = (index) => {
    if (gameState !== 'recall') return;
    
    if (gameMode === 'programming') {
      handleProgrammingCellClick(index);
    } else {
      handleMemoryCellClick(index);
    }
  };
  
  const handleMemoryCellClick = (index) => {
    if (selectedCells.has(index)) return;

    const newSequence = [...userSequence, index];
    const newSelected = new Set([...selectedCells, index]);
    
    setUserSequence(newSequence);
    setSelectedCells(newSelected);

    // Check if sequence matches expected pattern so far
    const expectedSequence = currentPattern?.sequence || [];
    const isCorrectSoFar = newSequence.every((val, idx) => {
      return idx < expectedSequence.length && val === expectedSequence[idx];
    });

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
  
  const handleProgrammingCellClick = (index) => {
    if (matchedPairs.has(index)) return; // Already matched
    
    if (firstSelection === null) {
      // First card selection
      setFirstSelection(index);
    } else if (firstSelection === index) {
      // Clicked same card, deselect
      setFirstSelection(null);
    } else {
      // Second card selection, check for match
      const pairs = currentPattern?.pairs || [];
      const isMatch = pairs.some(pair => 
        (pair[0] === firstSelection && pair[1] === index) ||
        (pair[1] === firstSelection && pair[0] === index)
      );
      
      if (isMatch) {
        // Correct match
        const newMatched = new Set([...matchedPairs, firstSelection, index]);
        setMatchedPairs(newMatched);
        setFirstSelection(null);
        
        // Check if all pairs are matched
        const flatGrid = currentPattern.grid?.flat() || [];
        if (newMatched.size === flatGrid.length) {
          handleLevelComplete();
        }
      } else {
        // Wrong match
        const newWrongMatches = wrongMatches + 1;
        setWrongMatches(newWrongMatches);
        setFirstSelection(null);
        
        // Show wrong match feedback briefly
        setTimeout(() => {
          // Reset visual feedback
        }, 500);
        
        if (newWrongMatches >= 3) {
          // Game over after 3 wrong matches
          alert('Game Over! You made 3 wrong matches.');
          setGameState('complete');
          if (onGameComplete) {
            onGameComplete({
              success: false,
              score,
              levels: currentLevel + 1,
              timeElapsed,
              wrongMatches: newWrongMatches,
              accuracy: calculateAccuracy()
            });
          }
        }
      }
    }
  };

  const handleLevelComplete = () => {
    const levelScore = calculateLevelScore();
    setScore(prev => prev + levelScore);

    if (currentLevel < patterns.length - 1) {
      // Next level
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        const nextGameMode = patterns[currentLevel + 1]?.type === 'programming' ? 'programming' : 'memory';
        
        if (nextGameMode === 'programming') {
          setGameState('recall');
          setShowPattern(false);
        } else {
          setGameState('memorize');
          setShowPattern(true);
        }
        
        setUserSequence([]);
        setSelectedCells(new Set());
        setMatchedPairs(new Set());
        setFirstSelection(null);
        setWrongMatches(0);
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
    const sequenceLength = currentPattern?.sequence?.length || 1;
    const totalAttempts = userSequence.length + (lives < 3 ? (3 - lives) * sequenceLength : 0);
    const correctAttempts = userSequence.filter((val, idx) => {
      const expectedSequence = currentPattern?.sequence || [];
      return idx < expectedSequence.length && val === expectedSequence[idx];
    }).length;
    return totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
  };

  const resetGame = () => {
    setGameState('intro');
    setCurrentLevel(0);
    setShowPattern(true);
    setUserSequence([]);
    setSelectedCells(new Set());
    setMatchedPairs(new Set());
    setFirstSelection(null);
    setWrongMatches(0);
    setScore(0);
    setLives(3);
    setTimeElapsed(0);
  };
  
  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };
  
  const confirmExitGame = () => {
    // Calculate final results from current progress
    const finalScore = score;
    setGameState('complete');
    setShowExitConfirmation(false);
    
    if (onGameComplete) {
      onGameComplete({
        success: false,
        score: finalScore,
        levels: currentLevel + 1,
        timeElapsed,
        completed: false,
        exitedEarly: true,
        accuracy: calculateAccuracy()
      });
    }
  };
  
  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGrid = () => {
    const grid = currentPattern?.grid;
    
    // Ensure grid exists and is properly formatted
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.error('Invalid grid data:', grid);
      return (
        <div className="memory-grid error">
          <div className="error-message">Invalid grid data</div>
        </div>
      );
    }
    
    // Safely flatten the grid
    let flatGrid;
    try {
      flatGrid = grid.flat();
    } catch (error) {
      console.error('Error flattening grid:', error);
      return (
        <div className="memory-grid error">
          <div className="error-message">Error processing grid</div>
        </div>
      );
    }
    
    if (!flatGrid || flatGrid.length === 0) {
      console.error('Empty flat grid');
      return (
        <div className="memory-grid error">
          <div className="error-message">Empty grid</div>
        </div>
      );
    }
    
    if (gameMode === 'programming') {
      return renderProgrammingGrid(flatGrid);
    } else {
      return renderMemoryGrid(flatGrid);
    }
  };
  
  const renderMemoryGrid = (flatGrid) => {
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
              {showPattern || isSelected ? symbol : '?'}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderProgrammingGrid = (flatGrid) => {
    return (
      <div className="programming-grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(flatGrid.length))}, 1fr)` }}>
        {flatGrid.map((item, index) => {
          const isMatched = matchedPairs.has(index);
          const isSelected = firstSelection === index;
          const isClickable = !isMatched && gameState === 'recall';
          
          return (
            <div
              key={index}
              className={`programming-card ${
                isMatched ? 'matched' : ''
              } ${
                isSelected ? 'selected' : ''
              } ${
                isClickable ? 'clickable' : ''
              }`}
              onClick={() => isClickable && handleCellClick(index)}
            >
              <div className="card-content">
                {typeof item === 'object' ? (
                  <>
                    <div className="card-type">{item.type}</div>
                    <div className="card-text">{item.content}</div>
                  </>
                ) : (
                  <div className="card-text">{item}</div>
                )}
              </div>
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
          <h2>Brain {gameMode === 'programming' ? 'Programming' : 'Memory'} Grid Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            {gameMode === 'programming' ? (
              <ul>
                <li>Match programming <strong>code snippets</strong> with their <strong>outputs</strong> or <strong>descriptions</strong></li>
                <li>Click two cards to see if they form a correct pair</li>
                <li>You have <strong>3 lives</strong> - wrong matches cost a life</li>
                <li>After <strong>3 wrong matches</strong>, the game ends</li>
                <li>Match all pairs to complete the level</li>
              </ul>
            ) : (
              <ul>
                <li>Study the pattern of highlighted symbols for {memoryTime} seconds</li>
                <li>When the timer ends, click the cells in the <strong>correct sequence</strong></li>
                <li>Remember both the <strong>symbols</strong> and their <strong>order</strong></li>
                <li>You have <strong>3 lives</strong> - make them count!</li>
                <li>Complete all levels to win</li>
              </ul>
            )}
          </div>
          <div className="game-preview">
            <p>Grid Size: <strong>{gameMode === 'programming' ? 'Variable' : `${gridSize} × ${gridSize}`}</strong></p>
            {gameMode !== 'programming' && <p>Memory Time: <strong>{memoryTime} seconds</strong></p>}
            <p>Levels: <strong>{patterns.length}</strong></p>
            <p>Mode: <strong>{gameMode === 'programming' ? 'Programming Matching' : 'Memory Sequence'}</strong></p>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start {gameMode === 'programming' ? 'Programming' : 'Memory'} Challenge
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'complete') {
    const success = lives > 0;
    const exitedEarly = userSequence.length === 0 && currentLevel === 0;
    return (
      <div className="memory-grid-container">
        <div className="score-screen">
          <div className="score-header">
            <div className="game-icon">
              <span className="icon-circle">🧠</span>
            </div>
            <h2 className="game-title">Memory Grid Results</h2>
          </div>
          
          <div className="score-stats">
            <div className="primary-stat">
              <div className="stat-value">{calculateAccuracy()}%</div>
              <div className="stat-label">Final Score</div>
            </div>
            
            <div className="secondary-stats">
              <div className="stat-item">
                <div className="stat-value">{userSequence.length}/{patterns[currentLevel]?.sequence?.length || 0}</div>
                <div className="stat-label">Patterns Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatTime(timeElapsed)}</div>
                <div className="stat-label">Time Taken</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{wrongMatches || Math.max(0, 3 - lives)}/{gameMode === 'programming' ? '3' : '6'}</div>
                <div className="stat-label">Wrong Guesses</div>
              </div>
            </div>
            
            <div className="status-indicator">
              <div className={`status-badge ${success && !exitedEarly ? 'completed' : 'survived'}`}>
                {success && !exitedEarly ? '✓' : '✓'}
              </div>
              <div className="status-text">
                {success && !exitedEarly ? 'Completed' : 'Survived'}
              </div>
              <div className="status-subtitle">
                {success && !exitedEarly ? 'Memory Grid Status' : 'Memory Grid Status'}
              </div>
            </div>
          </div>
          
          <div className="game-details">
            <div className="details-header">
              <span className="details-icon">🎮</span>
              <span className="details-title">Game Details</span>
            </div>
            
            <div className="details-content">
              <div className="detail-row">
                <span className="detail-label">Game Status:</span>
                <span className="detail-value">{exitedEarly ? 'Exited early' : success ? 'Completed' : 'Game over'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Note:</span>
                <span className="detail-value">
                  {exitedEarly 
                    ? 'You exited the game early, but your progress was saved!' 
                    : success 
                    ? 'Great job completing the memory challenge!' 
                    : 'Keep practicing to improve your memory skills!'}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Performance:</span>
                <span className="detail-value performance-note">
                  💪 {calculateAccuracy() > 80 ? 'Excellent memory!' : calculateAccuracy() > 60 ? 'Good progress!' : 'Keep practicing!'}
                </span>
              </div>
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
          <h2>Brain {gameMode === 'programming' ? 'Programming' : 'Memory'} Grid</h2>
          <div className="level-info">
            Level {currentLevel + 1} of {patterns.length}
          </div>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Score:</span>
            <span className="stat-value">{score}</span>
          </div>
          {gameMode === 'programming' ? (
            <div className="stat">
              <span className="stat-label">Wrong Matches:</span>
              <span className="stat-value">{wrongMatches}/3</span>
            </div>
          ) : (
            <div className="stat">
              <span className="stat-label">Lives:</span>
              <span className="stat-value">
                {'♥'.repeat(lives)}{'♡'.repeat(3 - lives)}
              </span>
            </div>
          )}
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

      <div className="game-content">
        {gameState === 'memorize' && gameMode !== 'programming' && (
          <div className="memorize-phase">
            <div className="phase-header">
              <h3>Memorize the Pattern</h3>
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
              {gameMode === 'programming' ? (
                <>
                  <h3>Match Programming Pairs</h3>
                  <div className="programming-progress">
                    <p>Match code with output/description: {matchedPairs.size/2}/{(currentPattern.grid?.flat().length || 0)/2} pairs</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${((matchedPairs.size/2) / ((currentPattern.grid?.flat().length || 0)/2)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3>Recall the Sequence</h3>
                  <div className="sequence-progress">
                    <p>Click the cells in order: {userSequence.length}/{currentPattern.sequence.length}</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(userSequence.length / currentPattern.sequence.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid-container">
          {renderGrid()}
        </div>

        {gameMode !== 'programming' && (
          <div className="sequence-display">
            <h4>Your Sequence:</h4>
            <div className="sequence-cells">
              {userSequence.map((index, pos) => {
                const grid = currentPattern?.grid;
                let symbol = '?';
                
                if (grid && Array.isArray(grid)) {
                  try {
                    const flatGrid = grid.flat();
                    symbol = flatGrid[index] || '?';
                  } catch (error) {
                    console.error('Error accessing grid symbol:', error);
                    symbol = '?';
                  }
                }
                
                const isCorrect = currentPattern?.sequence && index === currentPattern.sequence[pos];
                return (
                  <div key={pos} className={`sequence-cell ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {symbol}
                  </div>
                );
              })}
              {userSequence.length < (currentPattern?.sequence?.length || 0) && (
                <div className="sequence-cell next">?</div>
              )}
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
};

export default MemoryGridGame;