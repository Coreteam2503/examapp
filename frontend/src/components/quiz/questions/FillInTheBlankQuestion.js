import React, { useState, useEffect } from 'react';
import './FillInTheBlankQuestion.css';

const FillInTheBlankQuestion = ({ question, onAnswer, disabled = false, showCorrect = false }) => {
  const [answers, setAnswers] = useState({});
  const [isAnswered, setIsAnswered] = useState(false);

  // Parse the question text to find blanks (marked with ___BLANK_N___)
  const parseQuestionText = (text) => {
    const parts = [];
    const blankRegex = /___BLANK_(\d+)___/g;
    let lastIndex = 0;
    let match;
    const blanks = [];

    while ((match = blankRegex.exec(text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the blank
      const blankNumber = parseInt(match[1]);
      parts.push({
        type: 'blank',
        number: blankNumber
      });
      blanks.push(blankNumber);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return { parts, blanks };
  };

  const { parts, blanks } = parseQuestionText(question.text || question.question);

  useEffect(() => {
    // Initialize answers object
    const initialAnswers = {};
    blanks.forEach(blankNum => {
      initialAnswers[blankNum] = '';
    });
    setAnswers(initialAnswers);
  }, [question]);

  const handleInputChange = (blankNumber, value) => {
    const newAnswers = {
      ...answers,
      [blankNumber]: value
    };
    setAnswers(newAnswers);

    // Check if all blanks are filled
    const allFilled = blanks.every(blankNum => newAnswers[blankNum].trim() !== '');
    
    if (allFilled && !isAnswered) {
      setIsAnswered(true);
      onAnswer(newAnswers);
    }
  };

  const getInputClassName = (blankNumber) => {
    let className = 'blank-input';
    
    if (showCorrect) {
      const userAnswer = answers[blankNumber]?.trim().toLowerCase();
      const correctAnswers = question.correctAnswers[blankNumber] || [];
      const isCorrect = correctAnswers.some(correct => 
        correct.toLowerCase() === userAnswer
      );
      
      className += isCorrect ? ' correct' : ' incorrect';
    } else if (disabled) {
      className += ' disabled';
    }
    
    return className;
  };

  const getBlankFeedback = (blankNumber) => {
    if (!showCorrect) return null;
    
    const userAnswer = answers[blankNumber]?.trim().toLowerCase();
    const correctAnswers = question.correctAnswers[blankNumber] || [];
    const isCorrect = correctAnswers.some(correct => 
      correct.toLowerCase() === userAnswer
    );
    
    if (!isCorrect) {
      return (
        <div className="blank-feedback">
          <span className="feedback-icon">✗</span>
          <span className="correct-answer">
            Correct: {correctAnswers.join(' or ')}
          </span>
        </div>
      );
    }
    
    return (
      <div className="blank-feedback">
        <span className="feedback-icon">✓</span>
      </div>
    );
  };

  return (
    <div className="fill-blank-question">
      <div className="question-text">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <span key={index} className="text-part">
                {part.content}
              </span>
            );
          } else {
            return (
              <span key={index} className="blank-container">
                <input
                  type="text"
                  className={getInputClassName(part.number)}
                  value={answers[part.number] || ''}
                  onChange={(e) => handleInputChange(part.number, e.target.value)}
                  disabled={disabled}
                  placeholder={`Blank ${part.number}`}
                  autoComplete="off"
                />
                {getBlankFeedback(part.number)}
              </span>
            );
          }
        })}
      </div>

      {question.hint && (
        <div className="question-hint">
          <span className="hint-icon">💡</span>
          <span className="hint-text">{question.hint}</span>
        </div>
      )}

      {showCorrect && (
        <div className="explanation">
          <h4>Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default FillInTheBlankQuestion;
