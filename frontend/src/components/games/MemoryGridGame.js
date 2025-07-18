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

  // Generate programming content dynamically based on gameData
  const generateProgrammingContent = (numQuestions = 5) => {
    const baseContent = [
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
          { content: 'Returns: "42"' },
          { content: 'Outputs: Hello World' },
          { content: 'Returns: 5' },
          { content: 'Assigns value 5' },
          { content: 'Result: HiHiHi' },
          { content: 'Returns: False' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'len([1, 2, 3])' },
          { content: 'type("hello")' },
          { content: 'range(3)' },
          { content: 'int("5")' },
          { content: 'list((1, 2))' },
          { content: 'abs(-10)' }
        ],
        rightColumn: [
          { content: 'Returns: 3' },
          { content: 'Returns: <class \'str\'>' },
          { content: 'Returns: range(0, 3)' },
          { content: 'Returns: 5' },
          { content: 'Returns: [1, 2]' },
          { content: 'Returns: 10' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'def add(a, b):' },
          { content: 'class Car:' },
          { content: 'import math' },
          { content: 'for i in range(2):' },
          { content: 'if x > 0:' },
          { content: 'try:' }
        ],
        rightColumn: [
          { content: 'Function definition' },
          { content: 'Class definition' },
          { content: 'Module import' },
          { content: 'Loop structure' },
          { content: 'Conditional statement' },
          { content: 'Exception handling' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'SyntaxError' },
          { content: 'IndexError' },
          { content: 'TypeError' },
          { content: 'ValueError' },
          { content: 'KeyError' },
          { content: 'AttributeError' }
        ],
        rightColumn: [
          { content: 'Invalid syntax' },
          { content: 'Index out of range' },
          { content: 'Wrong data type' },
          { content: 'Invalid value' },
          { content: 'Key not found' },
          { content: 'Attribute missing' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'HTML' },
          { content: 'CSS' },
          { content: 'JavaScript' },
          { content: 'Python' },
          { content: 'SQL' },
          { content: 'JSON' }
        ],
        rightColumn: [
          { content: 'Markup language' },
          { content: 'Styling language' },
          { content: 'Scripting language' },
          { content: 'Programming language' },
          { content: 'Query language' },
          { content: 'Data format' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'GET' },
          { content: 'POST' },
          { content: 'PUT' },
          { content: 'DELETE' },
          { content: 'PATCH' },
          { content: 'HEAD' }
        ],
        rightColumn: [
          { content: 'Retrieve data' },
          { content: 'Create new data' },
          { content: 'Update entire resource' },
          { content: 'Remove resource' },
          { content: 'Partial update' },
          { content: 'Get headers only' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'O(1)' },
          { content: 'O(log n)' },
          { content: 'O(n)' },
          { content: 'O(n log n)' },
          { content: 'O(n²)' },
          { content: 'O(2^n)' }
        ],
        rightColumn: [
          { content: 'Constant time' },
          { content: 'Logarithmic time' },
          { content: 'Linear time' },
          { content: 'Linearithmic time' },
          { content: 'Quadratic time' },
          { content: 'Exponential time' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'Array' },
          { content: 'LinkedList' },
          { content: 'Stack' },
          { content: 'Queue' },
          { content: 'HashMap' },
          { content: 'Tree' }
        ],
        rightColumn: [
          { content: 'Indexed collection' },
          { content: 'Node-based structure' },
          { content: 'LIFO structure' },
          { content: 'FIFO structure' },
          { content: 'Key-value pairs' },
          { content: 'Hierarchical structure' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'git add' },
          { content: 'git commit' },
          { content: 'git push' },
          { content: 'git pull' },
          { content: 'git branch' },
          { content: 'git merge' }
        ],
        rightColumn: [
          { content: 'Stage changes' },
          { content: 'Save changes' },
          { content: 'Upload changes' },
          { content: 'Download changes' },
          { content: 'Create branch' },
          { content: 'Combine branches' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      },
      {
        type: 'programming',
        leftColumn: [
          { content: 'React' },
          { content: 'Vue' },
          { content: 'Angular' },
          { content: 'Express' },
          { content: 'Django' },
          { content: 'Flask' }
        ],
        rightColumn: [
          { content: 'JavaScript library' },
          { content: 'Progressive framework' },
          { content: 'Full framework' },
          { content: 'Node.js framework' },
          { content: 'Python framework' },
          { content: 'Micro framework' }
        ],
        pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]
      }
    ];

    // Generate content for the requested number of questions
    const result = [];
    for (let i = 0; i < numQuestions; i++) {
      const basePattern = baseContent[i % baseContent.length];
      result.push({
        ...basePattern,
        id: i // Add unique ID for each pattern
      });
    }
    
    return result;
  };

  // Convert pattern_data to the format expected by the component
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

    // Create memory pairs from symbols
    const leftColumn = symbols.map((symbol, index) => ({
      content: symbol,
      symbol: symbol,
      position: index
    }));

    const rightColumn = symbols.map((symbol, index) => ({
      content: `${symbol} Pattern`,
      description: `Match with ${symbol}`,
      position: index
    }));

    // Create matching pairs - each symbol matches with itself
    const pairs = symbols.map((symbol, index) => [index, index]);

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
    
    console.log('✅ Converted pattern_data to game format:', converted);
    return converted;
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
      const symbols = ['🎯', '💡', '🔧', '💻', '📝', '🌟'];
      gameContent = [{
        type: 'memory_grid',
        leftColumn: symbols.slice(0, 3).map((symbol, index) => ({
          content: symbol,
          symbol: symbol,
          position: index
        })),
        rightColumn: symbols.slice(0, 3).map((symbol, index) => ({
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
      // Check if there are more levels
      if (currentLevel + 1 < gameContent.length) {
        // Move to next level
        setCurrentLevel(prev => prev + 1);
        setMatchedPairs(new Set());
        setFirstSelection(null);
        setSecondSelection(null);
        setShowFeedback(false);
        setLives(3); // Reset lives for new level
      } else {
        // All levels completed
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
            <p>Total Levels: <strong>{gameContent.length}</strong></p>
            <p>Lives: <strong>3</strong></p>
            <p>Challenge: <strong>Memory Grid Game</strong></p>
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