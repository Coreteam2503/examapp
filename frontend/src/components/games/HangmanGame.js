import React, { useState, useEffect } from 'react';
import './HangmanGame.css';

const HangmanGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordGuessedLetters, setCurrentWordGuessedLetters] = useState(new Set()); // Fresh per word
  const [totalWrongGuesses, setTotalWrongGuesses] = useState(0); // Total wrong guesses across ALL words
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [showHint, setShowHint] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [currentWordStatus, setCurrentWordStatus] = useState('playing'); // Status for current word only

  // Parse word data properly - fix for word not displaying
  const currentWord = gameData?.questions?.[currentWordIndex];
  let word = '';
  let hint = '';
  let category = '';
  
  if (currentWord) {
    // Handle different data structures
    if (currentWord.word_data) {
      let word_data;
      
      // If word_data exists as string, parse it
      if (typeof currentWord.word_data === 'string') {
        try {
          word_data = JSON.parse(currentWord.word_data);
          console.log('✅ Parsed word_data from string:', word_data);
        } catch (e) {
          console.warn('❌ Failed to parse word_data string:', currentWord.word_data);
          word_data = null;
        }
      } else if (typeof currentWord.word_data === 'object') {
        word_data = currentWord.word_data;
        console.log('✅ Using word_data object:', word_data);
      }
      
      if (word_data) {
        word = word_data.word || '';
        hint = word_data.hint || '';
        category = word_data.category || '';
      }
    } else {
      // Fallback to direct properties
      word = currentWord.correct_answer || currentWord.word || '';
      hint = currentWord.hint || 'No hint available';
      category = currentWord.category || 'General';
    }
  }
  
  console.log('🎯 Hangman game data:', { currentWord, word, hint, category });
  const maxTotalWrongGuesses = 6; // Total wrong guesses allowed for entire quiz
  
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

  // Check win/lose conditions for current word and overall game
  useEffect(() => {
    if (!word || gameStatus !== 'playing') return;

    // Check if current word is complete using ONLY current word guessed letters
    const isWordComplete = word.split('').every(letter => 
      currentWordGuessedLetters.has(letter.toUpperCase()) || !/[A-Z]/.test(letter)
    );

    // Check if hangman is complete (game over condition)
    if (totalWrongGuesses >= maxTotalWrongGuesses && gameStatus === 'playing') {
      // Game over - too many wrong guesses total across ALL words
      setGameStatus('lost');
      setCurrentWordStatus('lost');
      
      // Record result for current word if not already recorded
      if (!gameResults.find(r => r.wordIndex === currentWordIndex)) {
        const result = {
          wordIndex: currentWordIndex,
          word: word,
          status: 'lost', // Lost due to hangman completion
          wrongGuesses: totalWrongGuesses,
          timeSpent: timeElapsed,
          guessedLetters: Array.from(currentWordGuessedLetters)
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
      return; // Exit early - game is over
    }

    // Check if current word is complete (but game continues)
    if (isWordComplete && currentWordStatus === 'playing') {
      setCurrentWordStatus('won');
      // Record result for this word
      const result = {
        wordIndex: currentWordIndex,
        word: word,
        status: 'won',
        wrongGuesses: totalWrongGuesses, // Keep track of total wrong guesses so far
        timeSpent: timeElapsed,
        guessedLetters: Array.from(currentWordGuessedLetters)
      };
      
      const updatedResults = [...gameResults, result];
      setGameResults(updatedResults);
      
      // Check if this was the last word and auto-complete if so
      if (currentWordIndex >= totalWords - 1) {
        // This was the last word - auto-submit results
        setTimeout(() => {
          const correctWords = updatedResults.filter(r => r.status === 'won').length;
          const finalScore = updatedResults.length > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
          
          console.log('Hangman game auto-completed after final word:', {
            updatedResults,
            correctWords,
            finalScore,
            totalWords,
            totalWrongGuesses,
            completed: true
          });
          
          if (onGameComplete) {
            onGameComplete({
              results: updatedResults,
              totalWords: totalWords,
              timeElapsed: timeElapsed,
              completed: true,
              score: finalScore,
              correctAnswers: correctWords, // Backend expects this field name
              correctWords: correctWords, // Keep this for compatibility
              totalWordsCompleted: updatedResults.length,
              totalWrongGuesses: totalWrongGuesses,
              hangmanComplete: totalWrongGuesses < maxTotalWrongGuesses
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
    }
  }, [currentWordGuessedLetters, totalWrongGuesses, word, gameStatus, currentWordIndex, timeElapsed, gameResults, onAnswerChange, totalWords, onGameComplete, maxTotalWrongGuesses, currentWordStatus]);

  const handleLetterGuess = (letter) => {
    if (currentWordGuessedLetters.has(letter) || gameStatus !== 'playing' || currentWordStatus !== 'playing') {
      console.log('Letter already guessed for this word or game not playing:', letter, gameStatus, currentWordStatus);
      return;
    }

    console.log('Guessing letter:', letter);
    
    // Add to current word guessed letters only
    const newCurrentWordGuessedLetters = new Set(currentWordGuessedLetters);
    newCurrentWordGuessedLetters.add(letter);
    setCurrentWordGuessedLetters(newCurrentWordGuessedLetters);

    if (!word.toUpperCase().includes(letter)) {
      console.log('Wrong guess, incrementing total wrong guesses');
      setTotalWrongGuesses(prev => {
        const newTotalWrongGuesses = prev + 1;
        console.log('New total wrong guesses count:', newTotalWrongGuesses, 'Max:', maxTotalWrongGuesses);
        return newTotalWrongGuesses;
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
    
    // Add current word result if game is in progress and not already recorded
    if (gameStatus === 'playing' && currentWordIndex < totalWords && !gameResults.find(r => r.wordIndex === currentWordIndex)) {
      const currentResult = {
        wordIndex: currentWordIndex,
        word: word,
        status: 'incomplete',
        wrongGuesses: totalWrongGuesses,
        timeSpent: timeElapsed,
        guessedLetters: Array.from(currentWordGuessedLetters)
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
      timeElapsed,
      totalWrongGuesses
    });
    
    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalWords: totalWords,
        timeElapsed: timeElapsed,
        completed: false, // Mark as incomplete/exited
        score: finalScore,
        correctAnswers: correctWords, // Backend expects this field name
        correctWords: correctWords, // Keep this for compatibility
        totalWordsCompleted: totalWordsAttempted,
        exitedEarly: true,
        totalWrongGuesses: totalWrongGuesses,
        hangmanComplete: totalWrongGuesses < maxTotalWrongGuesses
      });
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const nextWord = () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
      // Reset ONLY the current word guessed letters (fresh keyboard for each word)
      setCurrentWordGuessedLetters(new Set());
      // Keep allGuessedLetters for continuous hangman experience
      setCurrentWordStatus('playing');
      setShowHint(false);
      // Don't reset time or wrong guesses - these continue through the whole game
    }
    // Note: Final completion is now handled automatically in useEffect
  };

  const restartCurrentWord = () => {
    // Only reset word-specific state, keep overall game state
    setCurrentWordStatus('playing');
    setShowHint(false);
    // Don't reset guessed letters, time, or wrong guesses for continuous hangman
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
      
      const isGuessed = currentWordGuessedLetters.has(letter.toUpperCase());
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
      totalWrongGuesses > 0 ? '   O   |' : '       |',
      totalWrongGuesses > 2 ? (totalWrongGuesses > 1 ? '  /|\\  |' : '  /|   |') : (totalWrongGuesses > 1 ? '   |   |' : '       |'),
      totalWrongGuesses > 4 ? (totalWrongGuesses > 3 ? '  / \\  |' : '  /    |') : (totalWrongGuesses > 3 ? '   |   |' : '       |'),
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
          const isGuessed = currentWordGuessedLetters.has(letter); // Use current word letters for keyboard state
          const isCorrect = isGuessed && word.toUpperCase().includes(letter);
          const isWrong = isGuessed && !word.toUpperCase().includes(letter);
          
          return (
            <button
              key={letter}
              className={`key ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''} ${isGuessed ? 'guessed' : ''}`}
              onClick={() => handleLetterGuess(letter)}
              disabled={isGuessed || gameStatus !== 'playing' || currentWordStatus !== 'playing'}
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
            <span className="wrong-guesses">Wrong: {totalWrongGuesses}/{maxTotalWrongGuesses}</span>
            <span className="words-completed">Completed: {gameResults.filter(r => r.status === 'won').length}/{totalWords}</span>
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
            <span>Lives remaining: {maxTotalWrongGuesses - totalWrongGuesses}</span>
            <div className="lives-hearts">
              {Array.from({ length: maxTotalWrongGuesses }, (_, i) => (
                <span key={i} className={`heart ${i < totalWrongGuesses ? 'lost' : 'remaining'}`}>
                  {i < totalWrongGuesses ? '💔' : '❤️'}
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
                disabled={gameStatus !== 'playing' || currentWordStatus !== 'playing'}
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
      {(currentWordStatus !== 'playing' || gameStatus !== 'playing') && (
        <div className={`game-status-overlay ${currentWordStatus === 'won' ? 'won' : 'lost'}`}>
          <div className="status-content">
            <div className="status-icon">
              {gameStatus === 'lost' ? '☠️' : currentWordStatus === 'won' ? '🎉' : '😵'}
            </div>
            <h3>
              {gameStatus === 'lost' ? '☠️ Game Over!' : 
               currentWordStatus === 'won' && isLastWord ? '🏆 Quiz Complete!' :
               currentWordStatus === 'won' ? '🎉 Word Complete!' : '😵 Word Failed!'}
            </h3>
            <p className="status-message">
              {gameStatus === 'lost' ? 
                `The hangman is complete! You used all ${maxTotalWrongGuesses} wrong guesses.` :
               currentWordStatus === 'won' ? 
                `You guessed "${word}" correctly!` : 
                `You couldn't guess "${word}" before the hangman was completed.`
              }
            </p>
            
            {gameStatus === 'lost' && (
              <div className="game-over-stats">
                <h4>📊 Final Results</h4>
                <div className="final-stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{gameResults.filter(r => r.status === 'won').length}</span>
                    <span className="stat-label">Words Guessed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{totalWords}</span>
                    <span className="stat-label">Total Words</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{Math.round((gameResults.filter(r => r.status === 'won').length / Math.max(gameResults.length, 1)) * 100)}%</span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatTime(timeElapsed)}</span>
                    <span className="stat-label">Total Time</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '15px' }}>
                  🔄 Submitting results automatically in 2 seconds...
                </p>
                <button className="complete-game-btn" onClick={() => {
                  const finalResults = [...gameResults];
                  if (!gameResults.find(r => r.wordIndex === currentWordIndex)) {
                    finalResults.push({
                      wordIndex: currentWordIndex,
                      word: word,
                      status: 'lost',
                      wrongGuesses: totalWrongGuesses,
                      timeSpent: timeElapsed,
                      guessedLetters: Array.from(currentWordGuessedLetters)
                    });
                  }
                  const correctWords = finalResults.filter(result => result.status === 'won').length;
                  const finalScore = finalResults.length > 0 ? Math.round((correctWords / finalResults.length) * 100) : 0;
                  
                  console.log('Manual game over completion triggered');
                  
                  onGameComplete && onGameComplete({
                    results: finalResults,
                    totalWords: totalWords,
                    timeElapsed: timeElapsed,
                    completed: false, // Lost due to hangman
                    score: finalScore,
                    correctAnswers: correctWords, // Backend expects this field name
                    correctWords: correctWords, // Keep this for compatibility
                    totalWordsCompleted: finalResults.length,
                    totalWrongGuesses: totalWrongGuesses,
                    hangmanComplete: false
                  });
                }}>
                  Complete Now ✅
                </button>
              </div>
            )}
            
            <div className="status-actions">
              {currentWordStatus === 'won' && !isLastWord && gameStatus === 'playing' && (
                <button className="next-word-btn" onClick={nextWord}>
                  Next Word ➡️
                </button>
              )}
              
              {currentWordStatus === 'won' && isLastWord && (
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
                      correctAnswers: correctWords, // Backend expects this field name
                      correctWords: correctWords, // Keep this for compatibility
                      totalWordsCompleted: finalResults.length,
                      totalWrongGuesses: totalWrongGuesses,
                      hangmanComplete: totalWrongGuesses < maxTotalWrongGuesses
                    });
                  }}>
                    Complete Now ✅
                  </button>
                </div>
              )}
              
              {currentWordStatus !== 'won' && gameStatus === 'playing' && (
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
                  <li>Words completed: {gameResults.filter(r => r.status === 'won').length}/{currentWordIndex + (currentWordStatus === 'won' ? 1 : 0)}</li>
                  <li>Time elapsed: {formatTime(timeElapsed)}</li>
                  <li>Wrong guesses: {totalWrongGuesses}/{maxTotalWrongGuesses}</li>
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
        <h4>Guessed Letters (Current Word):</h4>
        <div className="letters-grid">
          {Array.from(currentWordGuessedLetters).map(letter => {
            const appearsInCurrentWord = word.toUpperCase().includes(letter);
            return (
              <span key={letter} className={`guessed-letter ${appearsInCurrentWord ? 'correct' : 'wrong'}`}>
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