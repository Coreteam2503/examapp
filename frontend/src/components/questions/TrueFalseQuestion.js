import React from 'react';
import './TrueFalseQuestion.css';

const TrueFalseQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  const handleOptionSelect = (answer) => {
    if (disabled) return;
    onAnswer(answer);
  };

  const getOptionClass = (option) => {
    let classes = ['tf-option'];

    if (disabled) classes.push('disabled');
    if (userAnswer === option) classes.push('selected');

    if (showCorrect) {
      if (option === question.correct_answer) {
        classes.push('correct');
      } else if (userAnswer === option && option !== question.correct_answer) {
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