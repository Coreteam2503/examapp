import React, { useMemo, useCallback } from 'react';
import { normalizeQuestion, validateNormalizedQuestion } from '../../utils/questionNormalizer';
import MCQQuestion from './MCQQuestion';
import MatchingQuestion from './MatchingQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import FillInTheBlankQuestion from './FillInTheBlankQuestion';
import OrderingQuestion from './OrderingQuestion';
import './QuestionWrapper.css';

/**
 * Universal Question Wrapper Component
 * Routes to appropriate question component based on question type
 * Handles common functionality like validation, normalization, error handling, and result display
 */
const QuestionWrapper = ({ 
  question: rawQuestion, 
  onAnswer, 
  gameMode = 'standard',
  renderAs = 'standard',
  disabled = false, 
  showCorrect = false, 
  userAnswer = null,
  showResult = false,  // NEW: Show result modal
  isCorrect = null,    // NEW: Whether the answer was correct
  onRetry = null,      // NEW: Retry callback
  onContinue = null,   // NEW: Continue callback
  className = '',
  ...otherProps 
}) => {
  // Normalize question data
  const normalizedQuestion = useMemo(() => {
    const normalized = normalizeQuestion(rawQuestion);
    
    if (!validateNormalizedQuestion(normalized)) {
      console.error('Invalid question data:', rawQuestion);
      return null;
    }
    
    return normalized;
  }, [rawQuestion]);

  // Handle answer callback with validation - memoized to prevent re-renders
  const handleAnswer = useCallback((answer) => {
    if (disabled || !onAnswer) return;
    
    // Add metadata to answer
    const answerData = {
      answer,
      questionId: normalizedQuestion?.id,
      questionType: normalizedQuestion?.type,
      timestamp: new Date().toISOString(),
      gameMode,
      renderAs
    };
    
    onAnswer(answer, answerData);
  }, [disabled, onAnswer, normalizedQuestion?.id, normalizedQuestion?.type, gameMode, renderAs]);

  // Error state
  if (!normalizedQuestion) {
    return (
      <div className={`question-wrapper question-error ${className}`}>
        <div className="error-message">
          <h4>Question Error</h4>
          <p>Unable to load question. Please try again.</p>
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(rawQuestion, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  }

  // Get appropriate question component
  const QuestionComponent = getQuestionComponent(normalizedQuestion.type);
  
  if (!QuestionComponent) {
    return (
      <div className={`question-wrapper question-error ${className}`}>
        <div className="error-message">
          <h4>Unsupported Question Type</h4>
          <p>Question type "{normalizedQuestion.type}" is not supported.</p>
        </div>
      </div>
    );
  }

  // Common props for all question components
  const commonProps = {
    question: normalizedQuestion,
    onAnswer: handleAnswer,
    disabled,
    showCorrect,
    userAnswer,
    gameMode,
    renderAs,
    ...otherProps
  };

  return (
    <div className={`question-wrapper question-type-${normalizedQuestion.type} ${className}`}>
      {/* Question text - shown unless it's fill-in-the-blank (which handles its own text) */}
      {normalizedQuestion.type !== 'fill_blank' && !showResult && (
        <div className="question-text">
          <h3>{normalizedQuestion.question}</h3>
          {/* DEBUG: Show question data in development */}
          {process.env.NODE_ENV === 'development' && !normalizedQuestion.question && (
            <div style={{background: '#fee2e2', padding: '10px', border: '1px solid #ef4444', borderRadius: '4px', marginTop: '10px'}}>
              <strong>🐛 Missing Question Text!</strong>
              <details>
                <summary>Debug Data</summary>
                <pre>{JSON.stringify(normalizedQuestion, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      {/* Question component - hidden when showing result */}
      {!showResult && (
        <div className="question-content">
          <QuestionComponent {...commonProps} />
        </div>
      )}

      {/* Universal Result Modal */}
      {showResult && (
        <div className={`universal-result-modal ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="result-content">
            <div className="result-icon">
              {isCorrect ? '🎉' : '😞'}
            </div>
            
            <h3>
              {isCorrect ? 'Excellent!' : 'Not quite right'}
            </h3>
            
            <div className="result-details">
              <div className="answer-display">
                <strong>Your answer:</strong> 
                <span className="user-answer">{formatAnswerForDisplay(userAnswer)}</span>
              </div>
              <div className="answer-display">
                <strong>Correct answer:</strong>
                <span className="correct-answer">{formatAnswerForDisplay(normalizedQuestion.correct_answer)}</span>
              </div>
              {isCorrect && <p className="success-message">Great job! Keep it up! 🎯</p>}
              {!isCorrect && <p className="failure-message">Study the material and try again! 📚</p>}
            </div>

            {normalizedQuestion.explanation && (
              <div className="result-explanation">
                <strong>Explanation:</strong>
                <p>{normalizedQuestion.explanation}</p>
              </div>
            )}
            
            <div className="result-actions">
              {!isCorrect && onRetry && (
                <button className="retry-btn" onClick={onRetry}>
                  Try Again 🔄
                </button>
              )}
              
              {onContinue && (
                <button className={`continue-btn ${isCorrect ? 'success' : 'neutral'}`} onClick={onContinue}>
                  {isCorrect ? 'Continue 🚀' : 'Next Question ➡️'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Question metadata for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="question-debug">
          <small>Type: {normalizedQuestion.type} | ID: {normalizedQuestion.id} | Question: "{normalizedQuestion.question}"</small>
        </div>
      )}
    </div>
  );
};

/**
 * Get the appropriate question component for a given type
 * @param {string} questionType - The normalized question type
 * @returns {React.Component|null} - The appropriate component or null
 */
const getQuestionComponent = (questionType) => {
  const componentMap = {
    mcq: MCQQuestion,
    matching: MatchingQuestion,
    true_false: TrueFalseQuestion,
    fill_blank: FillInTheBlankQuestion,
    ordering: OrderingQuestion,
  };

  return componentMap[questionType] || null;
};

/**
 * Format answer for display in result modal
 * @param {any} answer - The answer to format
 * @returns {string} - Formatted answer string
 */
const formatAnswerForDisplay = (answer) => {
  if (answer === null || answer === undefined) {
    return 'No answer provided';
  }
  
  if (typeof answer === 'object') {
    return JSON.stringify(answer);
  }
  
  if (typeof answer === 'boolean') {
    return answer ? 'True' : 'False';
  }
  
  return answer.toString();
};

export default QuestionWrapper;
