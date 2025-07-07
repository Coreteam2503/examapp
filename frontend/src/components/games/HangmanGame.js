import React, { useState, useEffect, useMemo } from 'react';
import { QuestionWrapper } from '../questions';
import { withMockData } from '../../data/mockDataHelper';
import './HangmanGame.css';

const HangmanGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  // Use real gameData from backend when available, fallback to test data
  const effectiveGameData = useMemo(() => {
    return withMockData(gameData, 'hangman');
  }, [gameData]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false); // NEW: Prevent multiple completions
  const [showResult, setShowResult] = useState(false);

  const maxWrongAnswers = 6; // Traditional hangman has 6 wrong guesses before death
  const totalQuestions = effectiveGameData?.questions?.length || 0;
  const currentQuestion = effectiveGameData?.questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStatus === 'playing') {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Handle answer from question component
  const handleAnswer = (answer, metadata) => {
    if (gameStatus !== 'playing' || gameCompleted || showResult) {
      console.log('🚫 Game not active or showing result, ignoring answer:', { gameStatus, gameCompleted, showResult });
      return;
    }

    console.log('🎯 Hangman answer received:', { 
      answer, 
      metadata, 
      questionType: currentQuestion.type,
      questionId: currentQuestion.id 
    });

    // Determine if answer is correct
    const isCorrect = checkAnswer(answer, currentQuestion);
    
    console.log('🎯 Answer validation result:', { isCorrect, answer, expected: currentQuestion.correct_answer });

    const result = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion,
      userAnswer: answer,
      isCorrect,
      timestamp: new Date().toISOString(),
      timeSpent: timeElapsed
    };

    const newResults = [...gameResults, result];
    setGameResults(newResults);

    if (isCorrect) {
      console.log('✅ Correct answer - hangman is safe!');
    } else {
      console.log('❌ Wrong answer - hangman step closer to gallows');
    }

    // Notify parent of answer change
    if (onAnswerChange) {
      onAnswerChange({
        currentQuestion: currentQuestionIndex,
        result: result,
        allResults: newResults
      });
    }

    // Show result modal
    setShowResult(true);
  };

  const continueToNext = () => {
    setShowResult(false);
    
    const lastResult = gameResults[gameResults.length - 1];
    if (lastResult.isCorrect) {
      handleCorrectAnswer(lastResult, gameResults);
    } else {
      handleWrongAnswer(lastResult, gameResults);
    }
  };

  const retryCurrentQuestion = () => {
    setShowResult(false);
    // Remove the current question's answer
    setGameResults(prev => prev.slice(0, -1));
  };

  const checkAnswer = (userAnswer, question) => {
    if (!question) return false;

    console.log('🔍 Checking answer:', { userAnswer, question, type: question.type });

    switch (question.type) {
      case 'mcq':
        return checkMCQAnswer(userAnswer, question);
      case 'true_false':
        return checkTrueFalseAnswer(userAnswer, question);
      case 'fill_blank':
        return checkFillBlankAnswer(userAnswer, question);
      case 'matching':
        return checkMatchingAnswer(userAnswer, question);
      case 'ordering':
        return checkOrderingAnswer(userAnswer, question);
      default:
        console.warn('Unknown question type:', question.type);
        return false;
    }
  };

  const checkMCQAnswer = (userAnswer, question) => {
    if (!question.correct_answer || !question.options) return false;
    
    // Extract letter from both user answer and correct answer
    const extractLetter = (answer) => {
      if (typeof answer === 'string') {
        const match = answer.match(/^([A-D])/i);
        if (match) return match[1].toUpperCase();
        // If it's a full option text, find which letter it corresponds to
        for (let i = 0; i < question.options.length; i++) {
          if (question.options[i] === answer) {
            return String.fromCharCode(65 + i); // A, B, C, D
          }
        }
      }
      return answer;
    };

    const userLetter = extractLetter(userAnswer);
    const correctLetter = extractLetter(question.correct_answer);
    
    console.log('🔍 MCQ comparison:', { userLetter, correctLetter });
    return userLetter === correctLetter;
  };

  const checkTrueFalseAnswer = (userAnswer, question) => {
    const normalizeBoolean = (answer) => {
      if (typeof answer === 'boolean') return answer;
      if (typeof answer === 'string') {
        const lower = answer.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      return Boolean(answer);
    };

    const userBool = normalizeBoolean(userAnswer);
    const correctBool = normalizeBoolean(question.correct_answer);
    
    console.log('🔍 True/False comparison:', { userBool, correctBool });
    return userBool === correctBool;
  };

  const checkFillBlankAnswer = (userAnswer, question) => {
    if (!question.blanks || !userAnswer || typeof userAnswer !== 'object') return false;
    
    // Check each blank
    for (const blankNum in question.blanks) {
      const userBlankAnswer = userAnswer[blankNum]?.trim().toLowerCase();
      const correctAnswers = question.blanks[blankNum];
      
      if (!correctAnswers || !Array.isArray(correctAnswers)) continue;
      
      const isBlankCorrect = correctAnswers.some(correct => 
        correct.toLowerCase().trim() === userBlankAnswer
      );
      
      if (!isBlankCorrect) {
        console.log('🔍 Fill blank failed at blank', blankNum, { userBlankAnswer, correctAnswers });
        return false;
      }
    }
    
    console.log('🔍 Fill blank all correct:', userAnswer);
    return true;
  };

  const checkMatchingAnswer = (userAnswer, question) => {
    if (!question.pairs || !userAnswer || typeof userAnswer !== 'object') return false;
    
    // Check if all pairs are correctly matched
    for (const pair of question.pairs) {
      if (userAnswer[pair.left] !== pair.right) {
        console.log('🔍 Matching failed:', { expected: pair, actual: userAnswer[pair.left] });
        return false;
      }
    }
    
    console.log('🔍 Matching all correct:', userAnswer);
    return true;
  };

  const checkOrderingAnswer = (userAnswer, question) => {
    if (!question.correct_sequence || !Array.isArray(userAnswer)) return false;
    
    if (userAnswer.length !== question.correct_sequence.length) return false;
    
    const isCorrect = userAnswer.every((item, index) => 
      item === question.correct_sequence[index]
    );
    
    console.log('🔍 Ordering comparison:', { userAnswer, correct: question.correct_sequence, isCorrect });
    return isCorrect;
  };

  const handleCorrectAnswer = (result, newResults) => {
    // Move to next question
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 1500); // Brief pause to show success
    } else {
      // All questions completed successfully
      setTimeout(() => {
        completeGame(newResults, 'won');
      }, 2000);
    }
  };

  const handleWrongAnswer = (result, newResults) => {
    const newWrongCount = wrongAnswers + 1;
    setWrongAnswers(newWrongCount);

    if (newWrongCount >= maxWrongAnswers) {
      // Hangman is dead - game over
      setTimeout(() => {
        setGameStatus('lost');
        completeGame(newResults, 'lost');
      }, 2000);
    } else {
      // Continue with next question after brief pause
      if (currentQuestionIndex < totalQuestions - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 1500);
      } else {
        // No more questions but hangman survived
        setTimeout(() => {
          completeGame(newResults, 'survived');
        }, 2000);
      }
    }
  };

  const completeGame = (finalResults, status) => {
    // Prevent multiple completions
    if (gameCompleted) {
      console.log('🚫 Game already completed, ignoring duplicate completion call');
      return;
    }
    
    setGameCompleted(true);
    setGameStatus(status);
    
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const totalAnswered = finalResults.length;
    const finalScore = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

    console.log('🎯 Hangman game completed:', {
      status,
      correctAnswers,
      totalAnswered,
      totalQuestions,
      finalScore,
      wrongAnswers,
      survivalStatus: wrongAnswers < maxWrongAnswers ? 'survived' : 'hanged'
    });

    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalQuestions: totalQuestions,
        totalAnswered: totalAnswered,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        timeElapsed: timeElapsed,
        completed: true,
        score: finalScore,
        status: status,
        hangmanSurvived: wrongAnswers < maxWrongAnswers
      });
    }
  };

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

  const confirmExitGame = () => {
    const finalResults = [...gameResults];
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const finalScore = finalResults.length > 0 ? Math.round((correctAnswers / finalResults.length) * 100) : 0;

    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalQuestions: totalQuestions,
        totalAnswered: finalResults.length,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        timeElapsed: timeElapsed,
        completed: false,
        score: finalScore,
        status: 'exited',
        hangmanSurvived: wrongAnswers < maxWrongAnswers
      });
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  // Render hangman visual based on wrong answers
  const renderHangman = () => {
    const hangmanStages = [
      // Stage 0: Empty gallows
      ['   +---+', '   |   |', '       |', '       |', '       |', '       |', '========='],
      // Stage 1: Head
      ['   +---+', '   |   |', '   O   |', '       |', '       |', '       |', '========='],
      // Stage 2: Body
      ['   +---+', '   |   |', '   O   |', '   |   |', '       |', '       |', '========='],
      // Stage 3: Left arm
      ['   +---+', '   |   |', '   O   |', '  /|   |', '       |', '       |', '========='],
      // Stage 4: Right arm
      ['   +---+', '   |   |', '   O   |', '  /|\\  |', '       |', '       |', '========='],
      // Stage 5: Left leg
      ['   +---+', '   |   |', '   O   |', '  /|\\  |', '  /    |', '       |', '========='],
      // Stage 6: Right leg (dead)
      ['   +---+', '   |   |', '   O   |', '  /|\\  |', '  / \\  |', '       |', '=========']
    ];

    const currentStage = Math.min(wrongAnswers, hangmanStages.length - 1);
    const parts = hangmanStages[currentStage];

    return (
      <div className="hangman-display">
        {parts.map((part, index) => (
          <div key={index} className="hangman-line">{part}</div>
        ))}
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (!effectiveGameData || !currentQuestion) {
    return (
      <div className="hangman-game">
        <div className="error-message">
          <h3>Game data not available</h3>
          <p>Unable to load hangman game data.</p>
          <div className="debug-info">
            <small>Game Data: {effectiveGameData ? 'Available' : 'Missing'}</small><br/>
            <small>Questions: {effectiveGameData?.questions?.length || 0}</small><br/>
            <small>Current Question: {currentQuestion ? 'Available' : 'Missing'}</small>
          </div>
        </div>
      </div>
    );
  }

  // Game over screens
  if (gameStatus === 'lost') {
    return (
      <div className="hangman-game">
        <div className="game-over">
          <div className="hangman-section">
            {renderHangman()}
          </div>
          <h2>💀 Game Over!</h2>
          <p>The hangman has been hanged!</p>
          <div className="final-stats">
            <p>Questions answered: {gameResults.length} / {totalQuestions}</p>
            <p>Correct answers: {gameResults.filter(r => r.isCorrect).length}</p>
            <p>Time played: {formatTime(timeElapsed)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'won' || gameStatus === 'survived') {
    return (
      <div className="hangman-game">
        <div className="game-won">
          <div className="hangman-section">
            {renderHangman()}
          </div>
          <h2>🎉 Congratulations!</h2>
          <p>{gameStatus === 'won' ? 'All questions answered correctly!' : 'You saved the hangman!'}</p>
          <div className="final-stats">
            <p>Questions answered: {gameResults.length} / {totalQuestions}</p>
            <p>Correct answers: {gameResults.filter(r => r.isCorrect).length}</p>
            <p>Wrong answers: {wrongAnswers}</p>
            <p>Time: {formatTime(timeElapsed)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hangman-game">
      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="modal-overlay">
          <div className="exit-confirmation-modal">
            <h3>Exit Game?</h3>
            <p>Are you sure you want to exit? Your progress will be saved.</p>
            <div className="modal-actions">
              <button onClick={confirmExitGame} className="confirm-btn">
                Yes, Exit
              </button>
              <button onClick={cancelExitGame} className="cancel-btn">
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>🎯 Hangman Game</h2>
          <div className="game-stats">
            <span className="question-progress">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span className="time">Time: {formatTime(timeElapsed)}</span>
            <span className="wrong-answers">Wrong: {wrongAnswers}/{maxWrongAnswers}</span>
            <span className="correct-answers">Correct: {gameResults.filter(r => r.isCorrect).length}</span>
          </div>
        </div>
        
        <div className="game-actions">
          <button 
            className="exit-game-btn"
            onClick={handleExitGame}
            title="Exit Game"
          >
            🚪 Exit Game
          </button>
        </div>
      </div>

      {/* Game Content */}
      <div className="game-content">
        {/* Hangman Visual */}
        <div className="hangman-section">
          {renderHangman()}
          <div className="lives-display">
            <span>Lives remaining: {maxWrongAnswers - wrongAnswers}</span>
            <div className="lives-hearts">
              {Array.from({ length: maxWrongAnswers }, (_, i) => (
                <span key={i} className={`heart ${i < wrongAnswers ? 'lost' : 'remaining'}`}>
                  {i < wrongAnswers ? '💔' : '❤️'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Question Section */}
        <div className="question-section">
          <div className="question-header">
            <h3>Answer correctly to save the hangman!</h3>
            <p className="question-instruction">
              ✅ Correct answer = Hangman stays safe, next question<br/>
              ❌ Wrong answer = Hangman moves closer to gallows
            </p>
          </div>
          
          {/* Universal Question Component */}
          <QuestionWrapper
            question={currentQuestion}
            onAnswer={handleAnswer}
            gameMode="hangman"
            disabled={gameStatus !== 'playing' || showResult}
            showResult={showResult}
            isCorrect={gameResults[gameResults.length - 1]?.isCorrect}
            userAnswer={gameResults[gameResults.length - 1]?.userAnswer}
            onRetry={retryCurrentQuestion}
            onContinue={continueToNext}
            className="hangman-question"
          />
        </div>
      </div>
    </div>
  );
};

export default HangmanGame;
