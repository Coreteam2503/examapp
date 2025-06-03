import React, { useState, useEffect } from 'react';
import { useMobileGestures, useMobileDetection, useHapticFeedback, useViewportHeight } from './hooks/useMobileGestures';
import './QuizDisplay.css';
import './MobileResponsive.css';
import './MobileQuestionTypes.css';
import './MobileTouchInteractions.css';
import FillInTheBlankQuestion from './questions/FillInTheBlankQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import MatchingQuestion from './questions/MatchingQuestion';

const MobileQuizDisplay = ({ quiz, onQuizComplete, onAnswerChange }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const { isMobile, isTouch, orientation } = useMobileDetection();
  const { triggerHaptic } = useHapticFeedback();
  const vh = useViewportHeight();

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.questions?.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Mobile swipe navigation
  const handleSwipeLeft = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      triggerHaptic('light');
    }
  };

  const handleSwipeRight = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      triggerHaptic('light');
    }
  };

  const { onTouchStart, onTouchMove, onTouchEnd, elementRef } = useMobileGestures(
    handleSwipeLeft, 
    handleSwipeRight,
    { 
      threshold: 50,
      velocity: 0.3,
      enableSwipe: isMobile && isTouch 
    }
  );

  // Hide swipe hint after first interaction
  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => setShowSwipeHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isStarted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted]);

  // Notify parent component of answer changes
  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange(answers);
    }
  }, [answers, onAnswerChange]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer: answer,
        timeSpent: timeElapsed
      }
    }));
    
    // Haptic feedback for selection
    triggerHaptic('medium');
    
    // Hide swipe hint after first answer
    if (showSwipeHint) {
      setShowSwipeHint(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      triggerHaptic('light');
    } else {
      // Quiz completed
      handleQuizComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      triggerHaptic('light');
    }
  };

  const handleQuizComplete = () => {
    triggerHaptic('success');
    if (onQuizComplete) {
      onQuizComplete({
        answers,
        timeElapsed,
        totalQuestions,
        answeredQuestions: Object.keys(answers).length
      });
    }
  };

  const startQuiz = () => {
    setIsStarted(true);
    triggerHaptic('medium');
  };

  const isAnswered = currentQuestion && answers[currentQuestion.id] && (
    currentQuestion.type === 'fill-in-the-blank' 
      ? Object.values(answers[currentQuestion.id].answer || {}).some(answer => answer?.trim()) 
      : currentQuestion.type === 'matching'
      ? Object.keys(answers[currentQuestion.id].answer || {}).length > 0
      : answers[currentQuestion.id].answer !== undefined && answers[currentQuestion.id].answer !== null
  );
  const canProceed = isAnswered || currentQuestionIndex === totalQuestions - 1;

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="quiz-display-container mobile-optimized">
        <div className="quiz-empty">
          <h3>No Quiz Available</h3>
          <p>This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="quiz-display-container mobile-optimized">
        <div className="quiz-intro">
          <div className="quiz-intro-header">
            <h2>{quiz.title}</h2>
            <div className="quiz-meta">
              <span className="quiz-difficulty">
                Difficulty: <strong>{quiz.difficulty}</strong>
              </span>
              <span className="quiz-questions">
                Questions: <strong>{totalQuestions}</strong>
              </span>
              {isMobile && (
                <span className="mobile-optimized-badge">
                  📱 Mobile Optimized
                </span>
              )}
            </div>
          </div>
          
          <div className="quiz-intro-content">
            <h3>Instructions</h3>
            <ul>
              <li>Answer all questions to the best of your ability</li>
              <li>You can navigate between questions using Next/Previous buttons</li>
              {isMobile && isTouch && (
                <li>On mobile: Swipe left/right to navigate between questions</li>
              )}
              <li>Your progress will be saved as you go</li>
              <li>Click "Complete Quiz" when you're done with all questions</li>
            </ul>
          </div>

          <button 
            className="start-quiz-btn touch-button"
            onClick={startQuiz}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`quiz-display-container mobile-optimized ${orientation}`}
      ref={elementRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile Swipe Hint */}
      {showSwipeHint && isMobile && isTouch && (
        <div className="swipe-hint">
          <div className="swipe-hint-content">
            <span className="swipe-icon">👈</span>
            <span className="swipe-text">Swipe to navigate</span>
            <span className="swipe-icon">👉</span>
          </div>
        </div>
      )}

      {/* Quiz Header */}
      <div className="quiz-header mobile-sticky-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>
        
        <div className="quiz-timer">
          <span className="timer-icon">⏱️</span>
          <span>Time: {formatTime(timeElapsed)}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="quiz-content">
        <div className="question-container">
          <div className="question-header">
            <div className="question-number">
              Question {currentQuestionIndex + 1}
            </div>
            <h3 className="question-text">
              {currentQuestion.question_text}
            </h3>
            
            {currentQuestion.code_snippet && (
              <div className="code-snippet">
                <div className="code-header">
                  <span>Code:</span>
                </div>
                <pre><code>{currentQuestion.code_snippet}</code></pre>
              </div>
            )}
          </div>

          <div className="options-container">
            {currentQuestion.type === 'fill-in-the-blank' ? (
              <FillInTheBlankQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
              />
            ) : currentQuestion.type === 'true-false' ? (
              <TrueFalseQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
                userAnswer={answers[currentQuestion.id]?.answer}
              />
            ) : currentQuestion.type === 'matching' ? (
              <MatchingQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
                userAnswer={answers[currentQuestion.id]?.answer}
              />
            ) : (
              // Multiple choice questions
              currentQuestion.options?.map((option, index) => (
                <div
                  key={index}
                  className={`option touch-button haptic-medium ${answers[currentQuestion.id]?.answer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <div className="option-marker">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="option-text">
                    {option.replace(/^[A-D]\)\s*/, '')}
                  </div>
                  {answers[currentQuestion.id]?.answer === option && (
                    <div className="option-check">✓</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-navigation mobile-sticky-footer">
        <div className="nav-buttons">
          <button
            className="nav-btn prev-btn touch-button haptic-light"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            {isMobile ? '←' : 'Previous'}
          </button>

          <button
            className="nav-btn next-btn touch-button haptic-light"
            onClick={handleNext}
            disabled={!canProceed}
          >
            {currentQuestionIndex === totalQuestions - 1 ? 
              (isMobile ? '✓ Done' : 'Complete Quiz') : 
              (isMobile ? '→' : 'Next')
            }
          </button>
        </div>

        <div className="answer-status">
          {isAnswered ? (
            <span className="answered">✓ Answered</span>
          ) : (
            <span className="unanswered">Select an answer</span>
          )}
        </div>
      </div>

      {/* Question Overview - Compact for mobile */}
      <div className="question-overview">
        <h4>Progress Overview</h4>
        <div className="question-dots">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              className={`question-dot touch-button haptic-light ${
                index === currentQuestionIndex ? 'current' : ''
              } ${answers[quiz.questions[index].id]?.answer ? 'answered' : ''}`}
              onClick={() => {
                setCurrentQuestionIndex(index);
                triggerHaptic('light');
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile FAB for quick actions */}
      {isMobile && (
        <div className="mobile-fab-container">
          {currentQuestionIndex > 0 && (
            <button 
              className="mobile-fab prev-fab"
              onClick={handlePrevious}
              style={{ bottom: '80px', right: '20px' }}
            >
              ←
            </button>
          )}
          {currentQuestionIndex < totalQuestions - 1 && canProceed && (
            <button 
              className="mobile-fab next-fab"
              onClick={handleNext}
              style={{ bottom: '20px', right: '20px' }}
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileQuizDisplay;