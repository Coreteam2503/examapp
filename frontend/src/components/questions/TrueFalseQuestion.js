import React, { useState } from 'react';
import './TrueFalseQuestion.css';

const TrueFalseQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(userAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (answer) => {
    if (disabled || isSubmitting) return;
    // Convert boolean to string format expected by backend
    const normalizedAnswer = answer ? 'True' : 'False';
    setSelectedAnswer(normalizedAnswer);
    console.log('🎯 True/False option selected:', normalizedAnswer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || disabled || isSubmitting) {
      console.log('🚫 True/False submit blocked:', { selectedAnswer, disabled, isSubmitting });
      return;
    }
    
    setIsSubmitting(true);
    console.log('🎯 True/False submitting:', { selectedAnswer, questionId: question.id });
    
    setTimeout(() => {
      onAnswer(selectedAnswer);
      console.log('✅ True/False submitted successfully');
    }, 100);
  };

  const getOptionClass = (option) => {
    let classes = ['tf-option'];

    if (disabled) classes.push('disabled');
    
    // Compare with normalized string format
    const normalizedUserAnswer = selectedAnswer;
    const normalizedOption = option ? 'True' : 'False';
    
    if (normalizedUserAnswer === normalizedOption) classes.push('selected');

    if (showCorrect) {
      // Normalize correct answer for comparison
      const normalizedCorrect = question.correct_answer === true ? 'True' : 
                               question.correct_answer === false ? 'False' : 
                               question.correct_answer;
                               
      if (normalizedOption === normalizedCorrect) {
        classes.push('correct');
      } else if (normalizedUserAnswer === normalizedOption && normalizedOption !== normalizedCorrect) {
        classes.push('incorrect');
      }
    }

    return classes.join(' ');
  };

  return (
    <div className="true-false-question">
      <div className="tf-options">
        <button
          className={getOptionClass(true)}
          onClick={() => handleOptionSelect(true)}
          disabled={disabled}
        >
          <span className="tf-icon">✓</span>
          <span className="tf-label">True</span>
        </button>

        <button
          className={getOptionClass(false)}
          onClick={() => handleOptionSelect(false)}
          disabled={disabled}
        >
          <span className="tf-icon">✗</span>
          <span className="tf-label">False</span>
        </button>
      </div>

      {/* Submit button for True/False questions */}
      <div className="tf-submit">
        <button 
          onClick={handleSubmit}
          disabled={disabled || !selectedAnswer || isSubmitting}
          className="tf-submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>

      {showCorrect && question.explanation && (
        <div className="tf-explanation">
          <h5>Explanation:</h5>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default TrueFalseQuestion;