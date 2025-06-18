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

  const currentWord = gameData?.questions?.[currentWordIndex];
  const word = currentWord?.word_data?.word || '';
  const hint = currentWord?.word_data?.hint || '';
  const category = currentWord?.word_data?.category || '';
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
      setGameResults(prev => [...prev, result]);
      
      if (onAnswerChange) {
        onAnswerChange({
          currentWord: currentWordIndex,
          result: result,
          allResults: [...gameResults, result]
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
      setGameResults(prev => [...prev, result]);
      
      if (onAnswerChange) {
        onAnswerChange({
          currentWord: currentWordIndex,
          result: result,
          allResults: [...gameResults, result]
        });
      }
    }
  }, [guessedLetters, wrongGuesses, word, gameStatus, currentWordIndex, timeElapsed, maxWrongGuesses, gameResults, onAnswerChange]);

  const handleLetterGuess = (letter) => {
    if (guessedLetters.has(letter) || gameStatus !== 'playing') return;

    const newGuessedLetters = new Set(guessedLetters);
    newGuessedLetters.add(letter);
    setGuessedLetters(newGuessedLetters);

    if (!word.toUpperCase().includes(letter)) {
      setWrongGuesses(prev => prev + 1);
    }
  };

  const nextWord = () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setGuessedLetters(new Set());
      setWrongGuesses(0);
      setGameStatus('playing');
      setShowHint(false);
      setTimeElapsed(0);
    } else {
      // Game complete
      if (onGameComplete) {
        onGameComplete({
          results: gameResults,
          totalWords: totalWords,
          timeElapsed: timeElapsed,
          completed: true
        });
      }
    }
  };

  const restartCurrentWord = () => {
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameStatus('playing');
    setShowHint(false);
    setTimeElapsed(0);
  };

  const renderWord = () => {
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
        <pre>{parts.join('\\n')}</pre>
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
          <div className="word-display">
            {renderWord()}
          </div>
          
          {/* Hint Section */}
          <div className="hint-section">
            {!showHint ? (
              <button 
                className="hint-button"
                onClick={() => setShowHint(true)}
                disabled={gameStatus !== 'playing'}
              >
                💡 Show Hint
              </button>
            ) : (
              <div className="hint-display">
                <span className="hint-label">💡 Hint:</span>
                <span className="hint-text">{hint}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard */}
      <div className="keyboard-section">
        {renderKeyboard()}
      </div>

      {/* Game Status Messages */}
      {gameStatus !== 'playing' && (
        <div className={`game-status ${gameStatus}`}>
          <div className="status-content">
            <h3>
              {gameStatus === 'won' ? '🎉 Congratulations!' : '😞 Game Over'}
            </h3>
            <p>
              {gameStatus === 'won' 
                ? `You guessed "${word}" correctly!` 
                : `The word was "${word}"`
              }
            </p>
            
            <div className="status-actions">
              {!isLastWord ? (
                <button className="next-word-btn" onClick={nextWord}>
                  Next Word ➡️
                </button>
              ) : (
                <button className="complete-game-btn" onClick={() => onGameComplete && onGameComplete({
                  results: gameResults,
                  totalWords: totalWords,
                  timeElapsed: timeElapsed,
                  completed: true
                })}>
                  Complete Game ✅
                </button>
              )}
              
              <button className="restart-word-btn" onClick={restartCurrentWord}>
                🔄 Try Again
              </button>
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
