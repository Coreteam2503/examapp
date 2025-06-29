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
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Convert pattern_data to the format expected by the matching component
  const convertPatternDataToGameFormat = (question) => {
    console.log('🔄 Converting pattern_data:', question);
    
    if (!question?.pattern_data) {
      console.warn('❌ No pattern_data found in question:', question);
      return null;
    }

    let pattern_data;
    
    // Handle pattern_data as string or object
    if (typeof question.pattern_data === 'string') {
      try {
        pattern_data = JSON.parse(question.pattern_data);
      } catch (e) {
        console.error('❌ Failed to parse pattern_data string:', question.pattern_data);
        return null;
      }
    } else {
      pattern_data = question.pattern_data;
    }

    const { grid, symbols, sequence } = pattern_data;

    if (!symbols || !Array.isArray(symbols)) {
      console.warn('❌ Invalid symbols in pattern_data:', pattern_data);
      return null;
    }

    // Create meaningful matching pairs from the symbols
    // Based on the pattern data, create logical matching relationships
    
    const createMatchingContent = (symbols, sequence, grid) => {
      // Create meaningful input/output or concept-description matching pairs
      const symbolDescriptions = {
        // Tools & Technology
        '🔧': 'Tool',
        '💻': 'Technology', 
        '📝': 'Note',
        
        // Colors
        '🔵': 'Blue',
        '🟡': 'Yellow',
        '🟢': 'Green', 
        '🔴': 'Red',
        
        // Education & Science
        '📚': 'Books',
        '🖥️': 'Computer',
        '🔬': 'Science',
        '🔭': 'Astronomy',
        
        // Transportation
        '🚗': 'Car',
        '🚲': 'Bicycle',
        '🚂': 'Train',
        '🚀': 'Rocket',
        
        // Fruits
        '🍎': 'Apple',
        '🍌': 'Banana',
        '🍇': 'Grapes',
        '🍊': 'Orange'
      };

      const leftColumn = [];
      const rightColumn = [];
      const pairs = [];

      symbols.forEach((symbol, index) => {
        const description = symbolDescriptions[symbol] || `Item ${index + 1}`;
        
        leftColumn.push({
          content: symbol,
          symbol: symbol,
          position: index
        });

        rightColumn.push({
          content: description,
          description: `Match with ${symbol}`,
          position: index
        });

        pairs.push([index, index]);
      });

      return { leftColumn, rightColumn, pairs };
    };

    const { leftColumn, rightColumn, pairs } = createMatchingContent(symbols, sequence, grid);

    // Create matching pairs - each symbol matches with its description
    // const pairs = symbols.map((symbol, index) => [index, index]);

    const converted = {
      type: 'memory_grid',
      grid: grid || [],
      symbols: symbols,
      sequence: sequence || [],
      gridSize: Math.max(2, Math.sqrt(symbols.length)),
      leftColumn: leftColumn,
      rightColumn: rightColumn,
      pairs: pairs
    };
    
    console.log('✅ Converted pattern_data to matching format:', converted);
    return converted;
  };

  // Generate programming content as fallback
  const generateProgrammingContent = (numQuestions = 5) => {
    const baseContent = [
      {
        type: 'programming',
        leftColumn: [
          { content: 'str(42)' },
          { content: 'print("Hello World")' },
          { content: 'max([1, 5, 3])' }
        ],
        rightColumn: [
          { content: 'Returns: "42"' },
          { content: 'Outputs: Hello World' },
          { content: 'Returns: 5' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'len([1, 2, 3])' },
          { content: 'type("hello")' },
          { content: 'range(3)' }
        ],
        rightColumn: [
          { content: 'Returns: 3' },
          { content: 'Returns: <class \'str\'>' },
          { content: 'Returns: range(0, 3)' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'def add(a, b):' },
          { content: 'class Car:' },
          { content: 'import math' }
        ],
        rightColumn: [
          { content: 'Function definition' },
          { content: 'Class definition' },
          { content: 'Module import' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'SyntaxError' },
          { content: 'IndexError' },
          { content: 'TypeError' }
        ],
        rightColumn: [
          { content: 'Invalid syntax' },
          { content: 'Index out of range' },
          { content: 'Wrong data type' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'HTML' },
          { content: 'CSS' },
          { content: 'JavaScript' }
        ],
        rightColumn: [
          { content: 'Markup language' },
          { content: 'Styling language' },
          { content: 'Scripting language' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2]]
      }
    ];

    return baseContent.slice(0, numQuestions).map((content, index) => ({
      ...content,
      id: index
    }));
  };

  // Get the number of questions from gameData
  const numQuestions = gameData?.questions?.length || gameData?.metadata?.totalQuestions || gameData?.game_options?.numQuestions || 5;
  
  // Use actual game data instead of hardcoded content
  const useActualGameData = gameData?.questions && gameData.questions.length > 0;
  
  let gameContent;
  if (useActualGameData) {
    console.log('🎮 Using actual game data for Memory Grid');
    console.log('📊 First question pattern_data:', gameData.questions[0]?.pattern_data);
    
    // Convert each question's pattern_data to the expected format
    gameContent = gameData.questions.map(question => convertPatternDataToGameFormat(question)).filter(Boolean);
    console.log('🔄 Converted game content:', gameContent);
    
    // If no valid conversions, use a simple symbol matching game based on first question
    if (gameContent.length === 0 && gameData.questions.length > 0) {
      console.log('⚠️ No pattern_data found, creating simple symbol game');
      const symbols = ['🎯', '💡', '🔧'];
      gameContent = [{
        type: 'memory_grid',
        leftColumn: symbols.map((symbol, index) => ({
          content: symbol,
          symbol: symbol,
          position: index
        })),
        rightColumn: symbols.map((symbol, index) => ({
          content: `Match ${symbol}`,
          description: `Find the matching ${symbol}`,
          position: index
        })),
        pairs: [[0, 0], [1, 1], [2, 2]]
      }];
    }
  } else {
    console.log('🔧 Using fallback programming content');
    gameContent = generateProgrammingContent(numQuestions);
  }
  
  const currentPattern = gameContent[currentLevel] || gameContent[0];

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
      if (currentLevel + 1 < gameContent.length) {
        setCurrentLevel(prev => prev + 1);
        setMatchedPairs(new Set());
        setFirstSelection(null);
        setSecondSelection(null);
        setShowFeedback(false);
        setLives(3); // Reset lives for new level
      } else {
        setGameState('complete');
        if (onGameComplete) {
          onGameComplete({
            success: true,
            score,
            levels: gameContent.length,
            timeElapsed,
            accuracy: calculateAccuracy()
          });
        }
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

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

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
          <h2>Memory Grid Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Match symbols from the left column with their descriptions in the right column</li>
              <li>Click one card from the left column and one from the right column</li>
              <li>You have 3 lives - wrong matches cost a life</li>
              <li>Match all pairs to complete each level</li>
            </ul>
          </div>
          <div className="game-preview">
            <p>Total Levels: <strong>{gameContent.length}</strong></p>
            <p>Lives: <strong>3</strong></p>
            <p>Challenge: <strong>Memory Grid Matching</strong></p>
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
    const levelsCompleted = success ? gameContent.length : currentLevel + 1;
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
              <div className="stat-value">{levelsCompleted}/{gameContent.length}</div>
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

  // Exit Confirmation Modal
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
          <h2>Memory Grid Matching</h2>
          <div className="level-info">
            Level {currentLevel + 1} of {gameContent.length}
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
            <span className="header-text">Symbols</span>
          </div>
          <div className="column-header right-header">
            <span className="header-icon">&#x1F4CB;</span>
            <span className="header-text">Descriptions</span>
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