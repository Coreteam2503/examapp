import React, { useState, useEffect } from 'react';
import './WordLadderGame.css';

const WordLadderGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userPath, setUserPath] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Extract ladder data from gameData
  const ladderData = gameData?.questions?.[0]?.ladder_steps || gameData?.ladder_steps;
  const startWord = ladderData?.startWord || 'CODE';
  const endWord = ladderData?.endWord || 'NODE';
  const solutionSteps = ladderData?.steps || [startWord, endWord];
  const hints = ladderData?.hints || ['Transform each letter one at a time'];
  const maxSteps = gameData?.game_options?.maxSteps || 8;

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, isCompleted]);

  // Initialize user path with start word
  useEffect(() => {
    if (gameStarted && userPath.length === 0) {
      setUserPath([startWord]);
      setCurrentGuess(startWord);
    }
  }, [gameStarted, startWord, userPath.length]);

  // Notify parent of answer changes
  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange({
        userPath,
        currentStep,
        attempts,
        timeElapsed,
        isCompleted
      });
    }
  }, [userPath, currentStep, attempts, timeElapsed, isCompleted, onAnswerChange]);

  const isValidWord = (word) => {
    // Simple validation - in a real app, you'd check against a dictionary
    return word.length === startWord.length && /^[A-Za-z]+$/.test(word);
  };

  const isOneLetterDifferent = (word1, word2) => {
    if (word1.length !== word2.length) return false;
    
    let differences = 0;
    for (let i = 0; i < word1.length; i++) {
      if (word1[i].toLowerCase() !== word2[i].toLowerCase()) {
        differences++;
      }
    }
    return differences === 1;
  };

  const handleWordSubmit = () => {
    if (!currentGuess || currentGuess.length !== startWord.length) {
      return;
    }

    const lastWord = userPath[userPath.length - 1];
    const normalizedGuess = currentGuess.toUpperCase();
    const normalizedLast = lastWord.toUpperCase();

    setAttempts(prev => prev + 1);

    // Check if it's a valid transformation (one letter difference)
    if (!isOneLetterDifferent(normalizedGuess, normalizedLast)) {
      alert('You can only change one letter at a time!');
      return;
    }

    // Check if word is valid
    if (!isValidWord(normalizedGuess)) {
      alert('Please enter a valid word!');
      return;
    }

    // Check if word already used
    if (userPath.some(word => word.toUpperCase() === normalizedGuess)) {
      alert('You already used this word!');
      return;
    }

    // Add word to path
    const newPath = [...userPath, normalizedGuess];
    setUserPath(newPath);
    setCurrentStep(prev => prev + 1);

    // Check if completed
    if (normalizedGuess === endWord.toUpperCase()) {
      setIsCompleted(true);
      if (onGameComplete) {
        onGameComplete({
          success: true,
          userPath: newPath,
          attempts,
          timeElapsed,
          steps: newPath.length - 1,
          score: calculateScore(newPath.length - 1, attempts, timeElapsed)
        });
      }
    } else if (newPath.length >= maxSteps) {
      // Too many steps
      setIsCompleted(true);
      if (onGameComplete) {
        onGameComplete({
          success: false,
          userPath: newPath,
          attempts,
          timeElapsed,
          steps: newPath.length - 1,
          score: 0,
          message: 'Too many steps! Try a shorter path.'
        });
      }
    }

    setCurrentGuess('');
  };

  const calculateScore = (steps, attempts, time) => {
    const optimalSteps = solutionSteps.length - 1;
    const stepEfficiency = Math.max(0, 100 - ((steps - optimalSteps) * 10));
    const attemptEfficiency = Math.max(0, 100 - ((attempts - steps) * 5));
    const timeBonus = Math.max(0, 50 - Math.floor(time / 10));
    
    return Math.round((stepEfficiency + attemptEfficiency + timeBonus) / 3);
  };

  const handleReset = () => {
    setUserPath([startWord]);
    setCurrentGuess(startWord);
    setCurrentStep(0);
    setIsCompleted(false);
    setAttempts(0);
    setShowHint(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setUserPath([startWord]);
    setCurrentGuess('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="word-ladder-container">
        <div className="game-intro">
          <h2>🪜 Word Ladder Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>Transform "<strong>{startWord}</strong>" into "<strong>{endWord}</strong>"</li>
              <li>Change only <strong>one letter</strong> at a time</li>
              <li>Each step must be a valid word</li>
              <li>Find the shortest path possible!</li>
            </ul>
          </div>
          <div className="game-goal">
            <div className="word-display start-word">{startWord}</div>
            <div className="arrow">→</div>
            <div className="word-display end-word">{endWord}</div>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start Challenge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="word-ladder-container">
      <div className="game-header">
        <div className="game-info">
          <h2>🪜 Word Ladder</h2>
          <div className="goal">
            <span className="start-word">{startWord}</span>
            <span className="arrow">→</span>
            <span className="end-word">{endWord}</span>
          </div>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Steps:</span>
            <span className="stat-value">{userPath.length - 1}/{maxSteps - 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Attempts:</span>
            <span className="stat-value">{attempts}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      <div className="ladder-path">
        <h3>Your Path:</h3>
        <div className="word-chain">
          {userPath.map((word, index) => (
            <div key={index} className="word-step">
              <div className={`word-box ${index === 0 ? 'start' : ''} ${word.toUpperCase() === endWord.toUpperCase() ? 'end' : ''}`}>
                {word}
              </div>
              {index < userPath.length - 1 && <div className="step-arrow">↓</div>}
            </div>
          ))}
          
          {!isCompleted && (
            <div className="word-step">
              <div className="word-input-container">
                <input
                  type="text"
                  value={currentGuess}
                  onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleWordSubmit()}
                  placeholder="Next word..."
                  maxLength={startWord.length}
                  className="word-input"
                />
                <button 
                  className="submit-word-btn"
                  onClick={handleWordSubmit}
                  disabled={!currentGuess || currentGuess.length !== startWord.length}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="game-controls">
        <button 
          className="hint-btn"
          onClick={() => setShowHint(!showHint)}
        >
          💡 {showHint ? 'Hide' : 'Show'} Hint
        </button>
        <button 
          className="reset-btn"
          onClick={handleReset}
        >
          🔄 Reset
        </button>
      </div>

      {showHint && (
        <div className="hint-section">
          <h4>💡 Hint:</h4>
          <p>{hints[Math.min(currentStep, hints.length - 1)]}</p>
          {solutionSteps.length > 2 && (
            <p><strong>Optimal path has {solutionSteps.length - 1} steps</strong></p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="completion-message">
          <h3>
            {userPath[userPath.length - 1].toUpperCase() === endWord.toUpperCase() 
              ? '🎉 Congratulations!' 
              : '😅 Challenge Failed'
            }
          </h3>
          <p>
            {userPath[userPath.length - 1].toUpperCase() === endWord.toUpperCase()
              ? `You completed the ladder in ${userPath.length - 1} steps with ${attempts} attempts!`
              : 'You used too many steps. Try finding a shorter path!'
            }
          </p>
          <div className="solution-hint">
            <h4>One possible solution:</h4>
            <div className="solution-path">
              {solutionSteps.map((word, index) => (
                <span key={index} className="solution-word">
                  {word}
                  {index < solutionSteps.length - 1 && ' → '}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordLadderGame;