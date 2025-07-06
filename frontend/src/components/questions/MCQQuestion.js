import React, { useState } from 'react';
import { extractOptionLetter } from '../../utils/answerNormalization';
import './MCQQuestion.css';

const MCQQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  const [selectedOption, setSelectedOption] = useState(userAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (option) => {
    if (disabled || isSubmitting) return;
    setSelectedOption(option);
    console.log('🎯 MCQ option selected:', option);
  };

  const handleSubmit = () => {
    if (!selectedOption || disabled || isSubmitting) {
      console.log('🚫 MCQ submit blocked:', { selectedOption, disabled, isSubmitting });
      return;
    }
    
    setIsSubmitting(true);
    console.log('🎯 MCQ submitting:', { selectedOption, questionId: question.id });
    
    setTimeout(() => {
      onAnswer(selectedOption);
      console.log('✅ MCQ submitted successfully');
    }, 100);
  };

  const getOptionClass = (option) => {
    let classes = ['mcq-option'];

    if (disabled) classes.push('disabled');
    if (selectedOption === option) classes.push('selected');

    if (showCorrect) {
      // Extract letter from option for comparison
      const optionLetter = extractOptionLetter(option);
      const correctLetter = extractOptionLetter(question.correct_answer);
      
      if (optionLetter === correctLetter) {
        classes.push('correct');
      } else if (selectedOption === option) {
        classes.push('incorrect');
      }
    }

    return classes.join(' ');
  };

  // Helper function to extract option letter (A, B, C, D) - now imported from utils
  // const extractOptionLetter = ... // Removed duplicate - using imported version

  // Ensure we have options to display
  const options = question.options || [];
  
  if (options.length === 0) {
    return (
      <div className="mcq-question">
        <div className="mcq-error">
          No options available for this question.
        </div>
      </div>
    );
  }

  return (
    <div className="mcq-question">
      <div className="mcq-options">
        {options.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(option)}
            onClick={() => handleOptionSelect(option)}
            disabled={disabled}
          >
            <span className="mcq-option-text">{option}</span>
          </button>
        ))}
      </div>

      {/* Submit button for MCQ questions */}
      <div className="mcq-submit">
        <button 
          onClick={handleSubmit}
          disabled={disabled || !selectedOption || isSubmitting}
          className="mcq-submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>

      {showCorrect && question.explanation && (
        <div className="mcq-explanation">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
