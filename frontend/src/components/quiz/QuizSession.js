import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/quiz/QuizContext';
import './QuizSession.css';

const QuizSession = ({ quiz, onComplete, onExit }) => {
  const { state, actions } = useQuiz();
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentQuestion = state.quiz?.questions?.[state.currentQuestionIndex];
  const isAnswered = currentQuestion && state.answers[currentQuestion.id];

  useEffect(() => {
    if (quiz && !state.isStarted) {
      actions.startQuiz(quiz);
    }
  }, [quiz, state.isStarted, actions]);

  useEffect(() => {
    if (state.isCompleted) {
      const results = actions.getQuizResults();
      onComplete && onComplete(results);
    }
  }, [state.isCompleted, actions, onComplete]);

  const handleAnswerSelect = (answer) => {
    if (currentQuestion) {
      actions.submitAnswer(currentQuestion.id, answer);
    }
  };

  const handleNext = () => {
    if (state.currentQuestionIndex < (state.quiz?.questions?.length || 0) - 1) {
      actions.nextQuestion();
    } else {
      // Last question, complete quiz
      actions.completeQuiz();
    }
  };

  const handlePrevious = () => {
    actions.previousQuestion();
  };

  const handlePause = () => {
    actions.pauseQuiz();
    setShowPauseModal(true);
  };

  const handleResume = () => {
    actions.resumeQuiz();
    setShowPauseModal(false);
  };

  const handleExit = () => {
    if (state.progress.answeredQuestions > 0) {
      setShowExitModal(true);
    } else {
      actions.resetQuiz();
      onExit && onExit();
    }
  };

  const confirmExit = () => {
    actions.resetQuiz();
    setShowExitModal(false);
    onExit && onExit();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!state.quiz || !currentQuestion) {
    return (
      <div className="quiz-session-container">
        <div className="loading-quiz">
          <div className="spinner"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (state.isPaused && showPauseModal) {
    return (
      <div className="quiz-session-container">
        <div className="pause-modal">
          <div className="pause-content">
            <h2>Quiz Paused</h2>
            <div className="pause-stats">
              <div className="stat">
                <span className="stat-label">Time Elapsed</span>
                <span className="stat-value">{formatTime(state.timeElapsed)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Progress</span>
                <span className="stat-value">
                  {state.currentQuestionIndex + 1} / {state.quiz.questions.length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Answered</span>
                <span className="stat-value">
                  {state.progress.answeredQuestions} / {state.progress.totalQuestions}
                </span>
              </div>
            </div>
            <div className="pause-actions">
              <button onClick={handleResume} className="resume-btn">
                Resume Quiz
              </button>
              <button onClick={handleExit} className="exit-btn">
                Exit Quiz
              </button>
            </div>
            <p className="pause-note">
              Your progress has been saved automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-session-container">
      {/* Quiz Header */}
      <div className="quiz-session-header">
        <div className="quiz-info">
          <h2>{state.quiz.title}</h2>
          <span className="quiz-difficulty">{state.quiz.difficulty}</span>
        </div>
        
        <div className="quiz-controls">
          <div className="timer">
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{formatTime(state.timeElapsed)}</span>
          </div>
          
          <button onClick={handlePause} className="pause-btn">
            Pause
          </button>
          
          <button onClick={handleExit} className="exit-btn">
            Exit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${state.progress.completionPercentage}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <span>Question {state.currentQuestionIndex + 1} of {state.quiz.questions.length}</span>
          <span>{Math.round(state.progress.completionPercentage)}% Complete</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="question-section">
        <div className="question-header">
          <div className="question-number">
            Question {state.currentQuestionIndex + 1}
          </div>
          {currentQuestion.difficulty && (
            <div className="question-difficulty">
              {currentQuestion.difficulty}
            </div>
          )}
        </div>

        <div className="question-content">
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

        <div className="options-section">
          {currentQuestion.options.map((option, index) => {
            const isSelected = state.answers[currentQuestion.id]?.answer === option;
            return (
              <div
                key={index}
                className={`option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="option-marker">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="option-text">
                  {option.replace(/^[A-D]\)\s*/, '')}
                </div>
                {isSelected && (
                  <div className="option-check">✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button
          onClick={handlePrevious}
          disabled={state.currentQuestionIndex === 0}
          className="nav-btn prev-btn"
        >
          ← Previous
        </button>

        <div className="answer-status">
          {isAnswered ? (
            <span className="status-answered">✓ Answered</span>
          ) : (
            <span className="status-unanswered">Select an answer</span>
          )}
        </div>

        <button
          onClick={handleNext}
          className="nav-btn next-btn"
        >
          {state.currentQuestionIndex === (state.quiz?.questions?.length || 0) - 1 
            ? 'Complete Quiz' 
            : 'Next →'
          }
        </button>
      </div>

      {/* Question Overview */}
      <div className="question-overview">
        <h4>Question Overview</h4>
        <div className="question-grid">
          {state.quiz.questions.map((question, index) => (
            <button
              key={question.id}
              className={`question-dot ${
                index === state.currentQuestionIndex ? 'current' : ''
              } ${state.answers[question.id] ? 'answered' : ''}`}
              onClick={() => actions.navigateToQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Exit Quiz?</h3>
            <p>
              You have answered {state.progress.answeredQuestions} out of {state.progress.totalQuestions} questions.
              Your progress will be saved.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowExitModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmExit} className="confirm-exit-btn">
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSession;
