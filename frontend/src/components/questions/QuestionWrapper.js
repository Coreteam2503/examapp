import React, { useMemo } from 'react';
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
 * Handles common functionality like validation, normalization, and error handling
 */
const QuestionWrapper = ({ 
  question: rawQuestion, 
  onAnswer, 
  gameMode = 'standard',
  renderAs = 'standard',
  disabled = false, 
  showCorrect = false, 
  userAnswer = null,
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

  // Handle answer callback with validation
  const handleAnswer = (answer) => {
    if (disabled || !onAnswer) return;
    
    // Add metadata to answer
    const answerData = {
      answer,
      questionId: normalizedQuestion.id,
      questionType: normalizedQuestion.type,
      timestamp: new Date().toISOString(),
      gameMode,
      renderAs
    };
    
    onAnswer(answer, answerData);
  };

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
      {normalizedQuestion.type !== 'fill_blank' && (
        <div className="question-text">
          <h3>{normalizedQuestion.question}</h3>
        </div>
      )}
      
      {/* Question component */}
      <div className="question-content">
        <QuestionComponent {...commonProps} />
      </div>
      
      {/* Question metadata for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="question-debug">
          <small>Type: {normalizedQuestion.type} | ID: {normalizedQuestion.id}</small>
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

export default QuestionWrapper;
