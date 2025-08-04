import React, { useState, useEffect, useMemo } from 'react';
import { QuestionWrapper } from '../questions';
import { withMockData } from '../../data/mockDataHelper';
import './WordLadderGame.css';

const WordLadderGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  // Use real gameData from backend when available, fallback to test data
  const effectiveGameData = useMemo(() => {
    return withMockData(gameData, 'ladder');
  }, [gameData]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allQuestionsCompleted, setAllQuestionsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showScoreScreen, setShowScoreScreen] = useState(false);
  const [ladderSteps, setLadderSteps] = useState(0);
  const [avatarCharacter, setAvatarCharacter] = useState(Math.random() > 0.5 ? '👦' : '👧');
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const totalQuestions = effectiveGameData?.questions?.length || 0;
  const currentQuestion = effectiveGameData?.questions?.[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && !allQuestionsCompleted && !showScoreScreen) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, allQuestionsCompleted, showScoreScreen]);

  // Handle answer from question component
  const handleAnswer = (answer, metadata) => {
    if (allQuestionsCompleted || gameCompleted || showResult) {
      console.log('🚫 Game already completed or showing result, ignoring answer');
      return;
    }

    console.log('🪜 Ladder answer received:', { 
      answer, 
      metadata, 
      questionType: currentQuestion.type,
      questionId: currentQuestion.id 
    });

    // Determine if answer is correct
    const isCorrect = checkAnswer(answer, currentQuestion);
    
    console.log('🪜 Answer validation result:', { isCorrect, answer, expected: currentQuestion.correct_answer });

    const result = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion,
      userAnswer: answer,
      isCorrect,
      timestamp: new Date().toISOString(),
      timeSpent: timeElapsed
    };

    const newAnsweredQuestions = [...answeredQuestions, result];
    setAnsweredQuestions(newAnsweredQuestions);

    if (isCorrect) {
      console.log('✅ Correct answer - climb one step!');
      setLadderSteps(prev => prev + 1);
    } else {
      console.log('❌ Wrong answer - no ladder progress');
      // For ladder game, wrong answers don't make you slide down, just no progress
    }

    // Notify parent of answer change
    if (onAnswerChange) {
      onAnswerChange({
        currentQuestion: currentQuestionIndex,
        result: result,
        allResults: newAnsweredQuestions
      });
    }

    // Show result modal
    setShowResult(true);
  };

  const continueToNext = () => {
    setShowResult(false);
    
    // Check if this was the last question
    if (currentQuestionIndex >= totalQuestions - 1) {
      // All questions completed
      completeGame(answeredQuestions);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const retryCurrentQuestion = () => {
    setShowResult(false);
    // Remove the current question's answer
    setAnsweredQuestions(prev => prev.slice(0, -1));
    // Reset ladder steps if the answer was wrong
    const lastAnswer = answeredQuestions[answeredQuestions.length - 1];
    if (lastAnswer && lastAnswer.isCorrect) {
      setLadderSteps(prev => prev - 1);
    }
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

  const completeGame = (finalResults) => {
    // Prevent multiple completions
    if (gameCompleted) {
      console.log('🚫 Game already completed, ignoring duplicate completion call');
      return;
    }
    
    setGameCompleted(true);
    setAllQuestionsCompleted(true);
    
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const totalAnswered = finalResults.length;
    const finalScore = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    const reachedTop = ladderSteps === totalQuestions;

    console.log('🪜 Ladder game completed:', {
      correctAnswers,
      totalAnswered,
      totalQuestions,
      finalScore,
      ladderSteps,
      reachedTop
    });

    // Show congratulations if reached the top
    if (reachedTop) {
      setTimeout(() => {
        setShowCongratulations(true);
      }, 1000);
    } else {
      // Go directly to score screen
      setTimeout(() => {
        setShowScoreScreen(true);
        
        if (onGameComplete) {
          onGameComplete({
            results: finalResults,
            totalQuestions: totalQuestions,
            totalAnswered: totalAnswered,
            correctAnswers: correctAnswers,
            timeElapsed: timeElapsed,
            completed: true,
            score: finalScore,
            status: reachedTop ? 'completed' : 'partial',
            ladderSteps: ladderSteps,
            reachedTop: reachedTop
          });
        }
      }, 2000);
    }
  };

  // Show score screen after congratulations
  useEffect(() => {
    if (showCongratulations) {
      setTimeout(() => {
        setShowCongratulations(false);
        setShowScoreScreen(true);
        
        const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
        const finalScore = answeredQuestions.length > 0 ? Math.round((correctAnswers / answeredQuestions.length) * 100) : 0;
        
        if (onGameComplete) {
          onGameComplete({
            results: answeredQuestions,
            totalQuestions: totalQuestions,
            totalAnswered: answeredQuestions.length,
            correctAnswers: correctAnswers,
            timeElapsed: timeElapsed,
            completed: true,
            score: finalScore,
            status: 'completed',
            ladderSteps: ladderSteps,
            reachedTop: true
          });
        }
      }, 3000);
    }
  }, [showCongratulations]);

  const handleExitGame = () => {
    console.log('🪜 Word Ladder Exit Game button clicked - showing confirmation modal');
    setShowExitConfirmation(true);
  };

  const confirmExitGame = () => {
    console.log('🪜 Word Ladder confirmExitGame called');
    
    const finalResults = [...answeredQuestions];
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const finalScore = finalResults.length > 0 ? Math.round((correctAnswers / finalResults.length) * 100) : 0;

    console.log('🪜 Word Ladder exit data:', {
      finalResults,
      correctAnswers,
      finalScore,
      status: 'exited',
      onGameComplete: !!onGameComplete
    });

    // Close the exit confirmation modal first
    setShowExitConfirmation(false);
    console.log('🪜 Word Ladder modal closed');

    if (onGameComplete) {
      console.log('🪜 Word Ladder calling onGameComplete with exited status');
      onGameComplete({
        results: finalResults,
        totalQuestions: totalQuestions,
        totalAnswered: finalResults.length,
        correctAnswers: correctAnswers,
        timeElapsed: timeElapsed,
        completed: false,
        score: finalScore,
        status: 'exited',
        gameFormat: 'word_ladder', // ADD this so QuizManager knows it's a word ladder game
        ladderSteps: ladderSteps,
        reachedTop: false
      });
      console.log('🪜 Word Ladder onGameComplete called successfully');
    } else {
      console.error('🪜 Word Ladder: onGameComplete is not available!');
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setAnsweredQuestions([]);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
    setAllQuestionsCompleted(false);
    setShowCongratulations(false);
    setShowScoreScreen(false);
    setLadderSteps(0);
    setGameCompleted(false);
    setShowResult(false);
  };

  const resetGame = () => {
    setAnsweredQuestions([]);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
    setAllQuestionsCompleted(false);
    setShowCongratulations(false);
    setShowScoreScreen(false);
    setLadderSteps(0);
    setAvatarCharacter(Math.random() > 0.5 ? '👦' : '👧');
    setGameCompleted(false);
    setGameStarted(false);
    setShowResult(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render compact ladder visual
  const renderLadder = () => {
    return (
      <div className="compact-ladder">
        <div className="ladder-container">
          {/* Compact ladder steps */}
          {Array.from({ length: totalQuestions }, (_, index) => {
            const stepNumber = totalQuestions - index;
            const isClimbed = ladderSteps >= stepNumber;
            const hasCharacter = ladderSteps === stepNumber;
            
            return (
              <div key={stepNumber} className={`ladder-step ${isClimbed ? 'climbed' : ''} ${hasCharacter ? 'current' : ''}`}>
                <span className="step-num">{stepNumber}</span>
                {hasCharacter && <span className="character">👤</span>}
              </div>
            );
          })}
          
          {/* Base level */}
          <div className="ladder-base">
            {ladderSteps === 0 && <span className="character">👤</span>}
            <span className="base-label">Start</span>
          </div>
        </div>
        
        {/* Compact stats below ladder */}
        <div className="ladder-stats-compact">
          <span className="compact-stat">Q{currentQuestionIndex + 1}/{totalQuestions}</span>
          <span className="compact-stat">🪜{ladderSteps}</span>
          <span className="compact-stat">{formatTime(timeElapsed)}</span>
        </div>
      </div>
    );
  };

  // Error state
  if (!effectiveGameData || !effectiveGameData.questions || effectiveGameData.questions.length === 0) {
    return (
      <div className="word-ladder-container">
        <div className="error-message">
          <h3>Game data not available</h3>
          <p>Unable to load ladder game data.</p>
          <div className="debug-info">
            <small>Game Data: {effectiveGameData ? 'Available' : 'Missing'}</small><br/>
            <small>Questions: {effectiveGameData?.questions?.length || 0}</small><br/>
            <small>Current Question: {currentQuestion ? 'Available' : 'Missing'}</small>
          </div>
        </div>
      </div>
    );
  }

  // Game start screen
  if (!gameStarted) {
    return (
      <div className="word-ladder-container">
        <div className="game-intro">
          <div className="game-icon">🪜</div>
          <h2>Programming Ladder Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>• Answer programming questions one by one</li>
              <li>• Correct answers help you climb the ladder</li>
              <li>• Wrong answers keep you at the same level</li>
              <li>• Reach the top to win!</li>
            </ul>
          </div>
          <div className="game-stats-preview">
            <div className="stat-preview">
              <span className="stat-number">{totalQuestions}</span>
              <span className="stat-text">Coding Challenges</span>
            </div>
            <div className="trophy-icon">👨‍💻</div>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start Coding Challenge 🚀
          </button>
        </div>
      </div>
    );
  }

  // Congratulations screen
  if (showCongratulations) {
    return (
      <div className="word-ladder-container">
        <div className="congratulations-popup">
          <div className="congrats-content">
            <div className="congrats-icon">🎉</div>
            <h1>Congratulations!</h1>
            <p>You have successfully climbed the entire ladder! 🪜</p>
            <div className="congrats-stats">
              <p>Steps climbed: {ladderSteps}/{totalQuestions}</p>
              <p>Time: {formatTime(timeElapsed)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Score screen
  if (showScoreScreen) {
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const finalScore = answeredQuestions.length > 0 ? Math.round((correctAnswers / answeredQuestions.length) * 100) : 0;
    
    return (
      <div className="word-ladder-container">
        <div className="score-screen">
          <div className="score-header">
            <div className="game-icon">🪜</div>
            <h2>Word Ladder Results</h2>
          </div>
          
          <div className="score-stats">
            <div className="stat-item">
              <div className="stat-value">{finalScore}%</div>
              <div className="stat-label">Final Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{correctAnswers}/{totalQuestions}</div>
              <div className="stat-label">Correct Answers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTime(timeElapsed)}</div>
              <div className="stat-label">Time Taken</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{ladderSteps}/{totalQuestions}</div>
              <div className="stat-label">Ladder Steps</div>
            </div>
          </div>

          <div className="ladder-details">
            <div className="ladder-details-header">
              <div className="ladder-icon">🪜</div>
              <span>Ladder Progress</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ladder Status:</span>
              <span className="detail-value">
                {ladderSteps === totalQuestions ? 'Reached the top!' : `Climbed ${ladderSteps} of ${totalQuestions} steps`}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Performance:</span>
              <span className="detail-value performance-icon">
                {finalScore >= 80 ? '🌟 Excellent work!' : finalScore >= 60 ? '👍 Good effort!' : '💪 Keep practicing!'}
              </span>
            </div>
          </div>

          <div className="score-actions">
            <button className="retake-quiz-btn" onClick={resetGame}>
              Try Again
            </button>
            <button className="refresh-scores-btn" onClick={() => window.location.reload()}>
              🔄 Refresh & Return
            </button>
            <button className="done-btn" onClick={() => window.location.href = '/dashboard'}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="word-ladder-container">
      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="modal-overlay">
          <div className="exit-confirmation-modal">
            <h3>Exit Game?</h3>
            <p>Are you sure you want to exit? Your progress will be saved.</p>
            <div className="current-progress">
              <h4>Current Progress:</h4>
              <ul>
                <li>Steps climbed: {ladderSteps}/{totalQuestions}</li>
                <li>Questions answered: {answeredQuestions.length}</li>
                <li>Time elapsed: {formatTime(timeElapsed)}</li>
              </ul>
            </div>
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
          <h2>🪜 Programming Ladder</h2>
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
        {/* Ladder Visual */}
        {renderLadder()}

        {/* Question Section */}
        <div className="question-section">
          {/* Universal Question Component */}
          {currentQuestion && (
            <QuestionWrapper
              question={currentQuestion}
              onAnswer={handleAnswer}
              gameMode="ladder"
              disabled={showResult || allQuestionsCompleted}
              showResult={showResult}
              isCorrect={answeredQuestions[answeredQuestions.length - 1]?.isCorrect}
              userAnswer={answeredQuestions[answeredQuestions.length - 1]?.userAnswer}
              onRetry={retryCurrentQuestion}
              onContinue={continueToNext}
              className="ladder-question"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WordLadderGame;