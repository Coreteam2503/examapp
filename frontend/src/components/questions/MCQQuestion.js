import React from 'react';
import './MCQQuestion.css';

const MCQQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  const handleOptionSelect = (option) => {
    if (disabled) return;
    onAnswer(option);
  };

  const getOptionClass = (option) => {
    let classes = ['mcq-option'];

    if (disabled) classes.push('disabled');
    if (userAnswer === option) classes.push('selected');

    if (showCorrect) {
      // Extract letter from option for comparison
      const optionLetter = extractOptionLetter(option);
      const correctLetter = extractOptionLetter(question.correct_answer);
      
      if (optionLetter === correctLetter) {
        classes.push('correct');
      } else if (userAnswer === option) {
        classes.push('incorrect');
      }
    }

    return classes.join(' ');
  };

  // Helper function to extract option letter (A, B, C, D)
  const extractOptionLetter = (option) => {
    if (!option || typeof option !== 'string') return option;
    
    // Match patterns like "A)", "B)", "C)", "D)" at the start
    const match = option.match(/^([A-D])\)/);
    if (match) {
      return match[1];
    }
    
    // If no pattern found, check if it's already just a letter
    if (/^[A-D]$/.test(option.trim())) {
      return option.trim();
    }
    
    return option;
  };

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

      {showCorrect && question.explanation && (
        <div className="mcq-explanation">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
