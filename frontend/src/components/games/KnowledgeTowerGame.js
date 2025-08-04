import React, { useState, useEffect, useMemo } from 'react';
import { QuestionWrapper } from '../questions';
import { withMockData } from '../../data/mockDataHelper';
import './KnowledgeTowerGame.css';

const KnowledgeTowerGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  // Use real gameData from backend when available, fallback to test data
  const effectiveGameData = useMemo(() => {
    return withMockData(gameData, 'tower');
  }, [gameData]);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [towerHeight, setTowerHeight] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const questions = effectiveGameData?.questions || [];
  const totalLevels = effectiveGameData?.metadata?.totalLevels || questions.length || 5;
  const currentLevelQuestion = questions[currentLevel - 1];

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle answer from QuestionWrapper
  const handleAnswer = (answer, metadata) => {
    if (showResult || !currentLevelQuestion) {
      console.log('🚫 Tower answer blocked:', { showResult, hasQuestion: !!currentLevelQuestion });
      return;
    }

    console.log('🎯 Tower answer received:', { 
      answer, 
      metadata, 
      level: currentLevel,
      questionType: currentLevelQuestion.type,
      questionId: currentLevelQuestion.id 
    });

    // Determine if answer is correct using simplified validation
    const isCorrect = checkAnswer(answer, currentLevelQuestion);
    
    console.log('🎯 Tower answer validation:', { isCorrect, answer, expected: currentLevelQuestion.correct_answer });

    const result = {
      level: currentLevel,
      question: currentLevelQuestion,
      userAnswer: answer,
      isCorrect,
      timestamp: new Date().toISOString(),
      timeSpent: timeElapsed
    };

    const newAnsweredQuestions = { ...answeredQuestions, [currentLevel]: result };
    setAnsweredQuestions(newAnsweredQuestions);
    setGameResults(prev => [...prev, result]);
    setShowResult(true);

    // Animate tower climb if correct
    if (isCorrect) {
      setTowerHeight(prev => prev + (100 / totalLevels));
    }

    // Notify parent of answer change
    if (onAnswerChange) {
      onAnswerChange(result);
    }
  };

  // Simplified answer checking logic
  const checkAnswer = (userAnswer, question) => {
    const correctAnswer = question.correct_answer;
    
    // Handle different question types
    switch (question.type) {
      case 'mcq':
        // Extract letter from user answer if it's in format "A) Text"
        const userLetter = typeof userAnswer === 'string' && userAnswer.match(/^([A-D])\)/)?.[1];
        const answerToCheck = userLetter || userAnswer;
        return answerToCheck === correctAnswer;
        
      case 'true_false':
        // Normalize true/false answers
        const normalizedUser = userAnswer === 'True' ? true : userAnswer === 'False' ? false : userAnswer;
        const normalizedCorrect = correctAnswer === 'True' ? true : correctAnswer === 'False' ? false : correctAnswer;
        return normalizedUser === normalizedCorrect;
        
      case 'matching':
        // For matching, compare the match objects
        if (typeof userAnswer === 'object' && typeof correctAnswer === 'object') {
          return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
        return userAnswer === correctAnswer;
        
      case 'fill_blank':
        // For fill-in-blank, check if answers match (case insensitive)
        if (typeof userAnswer === 'object' && typeof correctAnswer === 'object') {
          const userKeys = Object.keys(userAnswer);
          const correctKeys = Object.keys(correctAnswer);
          
          if (userKeys.length !== correctKeys.length) return false;
          
          return userKeys.every(key => {
            const userVal = userAnswer[key]?.toString().toLowerCase().trim();
            const correctVal = correctAnswer[key]?.toString().toLowerCase().trim();
            return userVal === correctVal;
          });
        }
        return userAnswer?.toString().toLowerCase().trim() === correctAnswer?.toString().toLowerCase().trim();
        
      case 'ordering':
        // For ordering, compare arrays
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
        return userAnswer === correctAnswer;
        
      default:
        return userAnswer === correctAnswer;
    }
  };

  const nextLevel = () => {
    if (currentLevel < totalLevels) {
      setCurrentLevel(prev => prev + 1);
      setShowResult(false);
    } else {
      completeGame();
    }
  };

  const retryLevel = () => {
    setShowResult(false);
    // Remove the current level's answer
    const newAnsweredQuestions = { ...answeredQuestions };
    delete newAnsweredQuestions[currentLevel];
    setAnsweredQuestions(newAnsweredQuestions);
  };

  const completeGame = () => {
    const finalResults = gameResults;
    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const totalQuestions = finalResults.length;
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    
    console.log('🏆 Tower game completed:', { finalResults, correctAnswers, totalQuestions, finalScore });
    
    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        score: finalScore,
        totalQuestions,
        correctAnswers,
        timeElapsed,
        gameType: 'tower'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = () => {
    if (!currentLevelQuestion) {
      return (
        <div className="question-section">
          <div className="error-message">
            <h3>No question available for Level {currentLevel}</h3>
            <p>This level might not have been generated yet.</p>
            <button onClick={() => setCurrentLevel(1)} className="back-to-start-btn">
              Go to Level 1
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="question-section">
        {/* Universal Question Component with Result Modal */}
        <QuestionWrapper
          question={currentLevelQuestion}
          onAnswer={handleAnswer}
          gameMode="tower"
          disabled={showResult}
          showResult={showResult}
          isCorrect={answeredQuestions[currentLevel]?.isCorrect}
          userAnswer={answeredQuestions[currentLevel]?.userAnswer}
          onRetry={retryLevel}
          onContinue={currentLevel < totalLevels ? nextLevel : completeGame}
          className="tower-question"
        />
      </div>
    );
  };

  const renderTower = () => (
    <div className="tower-container">
      <div className="tower">
        {[...Array(totalLevels)].map((_, index) => {
          const levelNum = totalLevels - index;
          const isCurrentLevel = levelNum === currentLevel;
          const isCompleted = answeredQuestions[levelNum]?.isCorrect;
          const isAttempted = answeredQuestions[levelNum];

          return (
            <div
              key={levelNum}
              className={`tower-level ${isCurrentLevel ? 'current' : ''} ${
                isCompleted ? 'completed' : isAttempted ? 'attempted' : ''
              }`}
            >
              <span className="level-number">{levelNum}</span>
              {isCompleted && <span className="level-check">✓</span>}
              {isAttempted && !isCompleted && <span className="level-x">✗</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="knowledge-tower-game">
      <div className="game-header">
        <h2>🏰 Knowledge Tower Challenge</h2>
        <div className="game-progress">
          Level {currentLevel} of {totalLevels}
        </div>
        <button 
          className="exit-game-btn"
          onClick={() => setShowExitConfirmation(true)}
        >
          Exit Game
        </button>
      </div>

      <div className="game-content">
        <div className="tower-section">
          {renderTower()}
          {/* Small, compact stats below tower */}
          <div className="tower-stats-compact">
            <span className="compact-stat">L{currentLevel}/{totalLevels}</span>
            <span className="compact-stat">✓{Object.values(answeredQuestions).filter(r => r.isCorrect).length}</span>
            <span className="compact-stat">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        <div className="question-area">
          {renderQuestion()}
        </div>
      </div>

      {showExitConfirmation && (
        <div className="exit-confirmation-overlay">
          <div className="exit-confirmation-modal">
            <div className="modal-content">
              <h3>Exit Game?</h3>
              <p>Are you sure you want to exit? Your progress will be lost.</p>
              <div className="modal-actions">
                <button onClick={() => setShowExitConfirmation(false)}>Cancel</button>
                <button onClick={() => {
                  // Close modal first
                  setShowExitConfirmation(false);
                  
                  // Call onGameComplete to properly exit and return to quiz list
                  if (onGameComplete) {
                    onGameComplete({
                      results: gameResults,
                      totalQuestions: totalLevels,
                      totalAnswered: gameResults.length,
                      correctAnswers: gameResults.filter(r => r.isCorrect).length,
                      timeElapsed: timeElapsed,
                      completed: false,
                      score: gameResults.length > 0 ? Math.round((gameResults.filter(r => r.isCorrect).length / gameResults.length) * 100) : 0,
                      status: 'exited',
                      levelReached: currentLevel,
                      gameType: 'tower'
                    });
                  }
                }}>Exit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeTowerGame;
