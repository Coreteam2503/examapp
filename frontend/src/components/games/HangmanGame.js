import React, { useState, useEffect } from 'react';
import './HangmanGame.css';

const HangmanGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [showHint, setShowHint] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Parse word data properly - fix for word not displaying
  const currentWord = gameData?.questions?.[currentWordIndex];
  let word = '';
  let hint = '';
  let category = '';
  
  if (currentWord) {
    // Handle different data structures
    if (currentWord.word_data) {
      // If word_data exists as object
      if (typeof currentWord.word_data === 'string') {
        try {
          const parsedData = JSON.parse(currentWord.word_data);
          word = parsedData.word || '';
          hint = parsedData.hint || '';
          category = parsedData.category || '';
        } catch (e) {
          console.warn('Failed to parse word_data:', currentWord.word_data);
        }
      } else if (typeof currentWord.word_data === 'object') {
        word = currentWord.word_data.word || '';
        hint = currentWord.word_data.hint || '';
        category = currentWord.word_data.category || '';
      }
    } else {
      // Fallback to direct properties
      word = currentWord.correct_answer || currentWord.word || '';
      hint = currentWord.hint || 'No hint available';
      category = currentWord.category || 'General';
    }
  }
  
  console.log('Hangman game data:', { currentWord, word, hint, category });
  const maxWrongGuesses = currentWord?.max_attempts || 6;
  
  const totalWords = gameData?.questions?.length || 0;
  const isLastWord = currentWordIndex >= totalWords - 1;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStatus === 'playing') {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Check win/lose conditions
  useEffect(() => {
    if (!word) return;

    const isWordComplete = word.split('').every(letter => 
      guessedLetters.has(letter.toUpperCase()) || !/[A-Z]/.test(letter)
    );

    if (isWordComplete && gameStatus === 'playing') {
      setGameStatus('won');
      // Record result for this word
      const result = {
        wordIndex: currentWordIndex,
        word: word,
        status: 'won',
        wrongGuesses: wrongGuesses,
        timeSpent: timeElapsed,
        guessedLetters: Array.from(guessedLetters)
      };
      
      const updatedResults = [...gameResults, result];
      setGameResults(updatedResults);
      
      // Check if this was the last word and auto-complete if so
      if (currentWordIndex >= totalWords - 1) {
        // This was the last word - auto-submit results
        setTimeout(() => {
          const correctWords = updatedResults.filter(r => r.status === 'won').length;
          const finalScore = updatedResults.length > 0 ? Math.round((correctWords / updatedResults.length) * 100) : 0;
          
          console.log('Hangman game auto-completed after final word:', {
            updatedResults,
            correctWords,
            finalScore,
            totalWords
          });
          
          if (onGameComplete) {
            onGameComplete({
              results: updatedResults,
              totalWords: totalWords,
              timeElapsed: timeElapsed,
              completed: true,
              score: finalScore,
              correctWords: correctWords,
              totalWordsCompleted: updatedResults.length
            });
          }
        }, 2000); // Give user 2 seconds to see the completion screen
      }
      
      if (onAnswerChange) {
        onAnswerChange({
          currentWord: currentWordIndex,
          result: result,
          allResults: updatedResults
        });
      }
    } else if (wrongGuesses >= maxWrongGuesses && gameStatus === 'playing') {
      setGameStatus('lost');
      // Record result for this word
      const result = {
        wordIndex: currentWordIndex,
        word: word,
        status: 'lost',
        wrongGuesses: wrongGuesses,
        timeSpent: timeElapsed,
        guessedLetters: Array.from(guessedLetters)
      };
      const updatedResults = [...gameResults, result];
      setGameResults(updatedResults);
      
      if (onAnswerChange) {
        onAnswerChange({
          currentWord: currentWordIndex,
          result: result,
          allResults: updatedResults
        });
      }
    }
  }, [guessedLetters, wrongGuesses, word, gameStatus, currentWordIndex, timeElapsed, maxWrongGuesses, gameResults, onAnswerChange, totalWords, onGameComplete]);

  const handleLetterGuess = (letter) => {
    if (guessedLetters.has(letter) || gameStatus !== 'playing') {
      console.log('Letter already guessed or game not playing:', letter, gameStatus);
      return;
    }

    console.log('Guessing letter:', letter);
    const newGuessedLetters = new Set(guessedLetters);
    newGuessedLetters.add(letter);
    setGuessedLetters(newGuessedLetters);

    if (!word.toUpperCase().includes(letter)) {
      console.log('Wrong guess, incrementing wrong guesses');
      setWrongGuesses(prev => {
        const newWrongGuesses = prev + 1;
        console.log('New wrong guesses count:', newWrongGuesses, 'Max:', maxWrongGuesses);
        return newWrongGuesses;
      });
    } else {
      console.log('Correct guess!');
    }
  };

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

  const confirmExitGame = () => {
    // Calculate final results from current progress
    const finalResults = [...gameResults];
    
    // Add current word result if game is in progress
    if (gameStatus === 'playing' && currentWordIndex < totalWords) {
      const currentResult = {
        wordIndex: currentWordIndex,
        word: word,
        status: 'incomplete',
        wrongGuesses: wrongGuesses,
        timeSpent: timeElapsed,
        guessedLetters: Array.from(guessedLetters)
      };
      finalResults.push(currentResult);
    }
    
    const totalWordsAttempted = finalResults.length;
    const correctWords = finalResults.filter(result => result.status === 'won').length;
    const finalScore = totalWordsAttempted > 0 ? Math.round((correctWords / totalWordsAttempted) * 100) : 0;
    
    console.log('Hangman game exited early:', {
      finalResults,
      totalWordsAttempted,
      correctWords,
      finalScore,
      timeElapsed
    });
    
    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalWords: totalWords,
        timeElapsed: timeElapsed,
        completed: false, // Mark as incomplete/exited
        score: finalScore,
        correctWords: correctWords,
        totalWordsCompleted: totalWordsAttempted,
        exitedEarly: true
      });
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const nextWord = () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setGuessedLetters(new Set());
      setWrongGuesses(0);
      setGameStatus('playing');
      setShowHint(false);
      setTimeElapsed(0);
    }
    // Note: Final completion is now handled automatically in useEffect
  };

  const restartCurrentWord = () => {
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameStatus('playing');
    setShowHint(false);
    setTimeElapsed(0);
  };

  const renderWord = () => {
    if (!word) {
      return (
        <div className="word-display-error">
          <span className="error-text">No word to display</span>
        </div>
      );
    }
    
    console.log('Rendering word:', word);
    
    return word.split('').map((letter, index) => {
      if (!/[A-Z]/i.test(letter)) {
        return <span key={index} className="letter space">{letter}</span>;
      }
      
      const isGuessed = guessedLetters.has(letter.toUpperCase());
      return (
        <span key={index} className={`letter ${isGuessed ? 'revealed' : 'hidden'}`}>
          {isGuessed ? letter.toUpperCase() : '_'}
        </span>
      );
    });
  };

  const renderHangman = () => {
    const parts = [
      '   +---+',
      '   |   |',
      wrongGuesses > 0 ? '   O   |' : '       |',
      wrongGuesses > 2 ? (wrongGuesses > 1 ? '  /|\\  |' : '  /|   |') : (wrongGuesses > 1 ? '   |   |' : '       |'),
      wrongGuesses > 4 ? (wrongGuesses > 3 ? '  / \\  |' : '  /    |') : (wrongGuesses > 3 ? '   |   |' : '       |'),
      '       |',
      '========='
    ];

    return (
      <div className="hangman-display">
        {parts.map((part, index) => (
          <div key={index} className="hangman-line">{part}</div>
        ))}
      </div>
    );
  };

  const renderKeyboard = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    return (
      <div className="keyboard">
        {alphabet.map(letter => {
          const isGuessed = guessedLetters.has(letter);
          const isCorrect = isGuessed && word.toUpperCase().includes(letter);
          const isWrong = isGuessed && !word.toUpperCase().includes(letter);
          
          return (
            <button
              key={letter}
              className={`key ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''} ${isGuessed ? 'guessed' : ''}`}
              onClick={() => handleLetterGuess(letter)}
              disabled={isGuessed || gameStatus !== 'playing'}
            >
              {letter}
            </button>
          );
        })}
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameData || !currentWord) {
    return (
      <div className="hangman-game">
        <div className="error-message">
          <h3>Game data not available</h3>
          <p>Unable to load hangman game data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hangman-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>🎯 Hangman Game</h2>
          <div className="game-stats">
            <span className="word-progress">Word {currentWordIndex + 1} of {totalWords}</span>
            <span className="time">Time: {formatTime(timeElapsed)}</span>
            <span className="wrong-guesses">Wrong: {wrongGuesses}/{maxWrongGuesses}</span>
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
        
        <div className="category">
          <span className="category-label">Category:</span>
          <span className="category-value">{category}</span>
        </div>
      </div>

      {/* Game Content */}
      <div className="game-content">
        {/* Hangman Visual */}
        <div className="hangman-section">
          {renderHangman()}
          <div className="lives-display">
            <span>Lives remaining: {maxWrongGuesses - wrongGuesses}</span>
            <div className="lives-hearts">
              {Array.from({ length: maxWrongGuesses }, (_, i) => (
                <span key={i} className={`heart ${i < wrongGuesses ? 'lost' : 'remaining'}`}>
                  {i < wrongGuesses ? '💔' : '❤️'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Word Display */}
        <div className="word-section">
          {/* Debug info */}
          <div className="debug-info" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
            Debug: Word="{word}", Category="{category}", HasHint={!!hint}
          </div>
          
          <div className="word-display">
            {renderWord()}
          </div>
          
          {/* Hint Section */}
          <div className="hint-section">
            {!showHint && hint ? (
              <button 
                className="hint-button"
                onClick={() => {
                  console.log('Showing hint:', hint);
                  setShowHint(true);
                }}
                disabled={gameStatus !== 'playing'}
              >
                💡 Show Hint
              </button>
            ) : showHint && hint ? (
              <div className="hint-display">
                <span className="hint-label">💡 Hint:</span>
                <span className="hint-text">{hint}</span>
              </div>
            ) : (
              <div className="no-hint">
                <span className="no-hint-text">No hint available for this word</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard */}
      <div className="keyboard-section">
        {renderKeyboard()}
      </div>

      {/* Game Status Messages and Game Over Overlay */}
      {gameStatus !== 'playing' && (
        <div className={`game-status-overlay ${gameStatus}`}>
          <div className="status-content">
            <div className="status-icon">
              {gameStatus === 'won' ? '🎉' : '😵'}
            </div>
            <h3>
              {gameStatus === 'won' ? '🎉 Congratulations!' : '😵 Game Over!'}
            </h3>
            <p className="status-message">
              {gameStatus === 'won' 
                ? `You guessed "${word}" correctly!` 
                : `You ran out of lives! The word was "${word}"`
              }
            </p>
            
            <div className="status-actions">
              {gameStatus === 'won' && !isLastWord && (
                <button className="next-word-btn" onClick={nextWord}>
                  Next Word ➡️
                </button>
              )}
              
              {gameStatus === 'won' && isLastWord && (
                <div className="hangman-final-score">
                  <h4>🏆 Game Completed!</h4>
                  <div className="hangman-final-stats">
                    <div className="hangman-stat-item">
                      <span className="hangman-stat-value">{Math.round((gameResults.filter(r => r.status === 'won').length / gameResults.length) * 100)}%</span>
                      <span className="hangman-stat-label">Final Score</span>
                    </div>
                    <div className="hangman-stat-item">
                      <span className="hangman-stat-value">{gameResults.filter(r => r.status === 'won').length}/{gameResults.length}</span>
                      <span className="hangman-stat-label">Words Guessed</span>
                    </div>
                    <div className="hangman-stat-item">
                      <span className="hangman-stat-value">{formatTime(timeElapsed)}</span>
                      <span className="hangman-stat-label">Total Time</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '15px' }}>
                    🔄 Submitting results automatically in 2 seconds...
                  </p>
                  <button className="complete-game-btn" onClick={() => {
                    const finalResults = [...gameResults];
                    const correctWords = finalResults.filter(result => result.status === 'won').length;
                    const finalScore = finalResults.length > 0 ? Math.round((correctWords / finalResults.length) * 100) : 0;
                    
                    console.log('Manual game completion triggered');
                    
                    onGameComplete && onGameComplete({
                      results: finalResults,
                      totalWords: totalWords,
                      timeElapsed: timeElapsed,
                      completed: true,
                      score: finalScore,
                      correctWords: correctWords,
                      totalWordsCompleted: finalResults.length
                    });
                  }}>
                    Complete Now ✅
                  </button>
                </div>
              )}
              
              <button className="restart-word-btn" onClick={restartCurrentWord}>
                🔄 Try Again
              </button>
              
              {gameStatus === 'lost' && !isLastWord && (
                <button className="skip-word-btn" onClick={nextWord}>
                  Skip to Next Word ⏭️
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="exit-confirmation-overlay">
          <div className="exit-confirmation-dialog">
            <div className="exit-confirmation-content">
              <h3>🚪 Exit Quiz?</h3>
              <p>Are you sure you want to exit the Hangman game?</p>
              <div className="exit-current-progress">
                <p><strong>Current Progress:</strong></p>
                <ul>
                  <li>Words completed: {gameResults.filter(r => r.status === 'won').length}/{currentWordIndex + 1}</li>
                  <li>Time elapsed: {formatTime(timeElapsed)}</li>
                  <li>Current word: {word ? `"${word}"` : 'N/A'}</li>
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

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentWordIndex + 1) / totalWords) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          Progress: {currentWordIndex + 1}/{totalWords} words
        </span>
      </div>

      {/* Guessed Letters Display */}
      <div className="guessed-letters">
        <h4>Guessed Letters:</h4>
        <div className="letters-grid">
          {Array.from(guessedLetters).map(letter => {
            const isCorrect = word.toUpperCase().includes(letter);
            return (
              <span key={letter} className={`guessed-letter ${isCorrect ? 'correct' : 'wrong'}`}>
                {letter}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HangmanGame;
