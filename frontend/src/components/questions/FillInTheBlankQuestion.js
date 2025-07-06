import React, { useState, useEffect, useMemo } from 'react';
import './FillInTheBlankQuestion.css';

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

const FillInTheBlankQuestion = ({ question, onAnswer, disabled = false, showCorrect = false }) => {
  const [answers, setAnswers] = useState({});
  const [isAnswered, setIsAnswered] = useState(false);

  // Memoize the parsed question to avoid re-parsing on every render
  const { parts, blanks } = useMemo(() => {
    // Try different possible text fields (normalized format uses 'text' but fallback to 'question')
    const questionText = question.text || question.question_text || question.formatted_text || question.question || '';
    return parseQuestionText(questionText);
  }, [question.text, question.formatted_text, question.question_text, question.question]);

  // Initialize answers only when question ID changes
  useEffect(() => {
    const initialAnswers = {};
    blanks.forEach(blankNum => {
      initialAnswers[blankNum] = '';
    });
    setAnswers(initialAnswers);
    setIsAnswered(false);
  }, [question.id, blanks.join(',')]); // Use blanks.join(',') as dependency

  const handleInputChange = (blankNumber, value) => {
    const newAnswers = {
      ...answers,
      [blankNumber]: value
    };
    setAnswers(newAnswers);

    // Don't auto-submit on every keystroke - wait for explicit submission
    // Only update if all blanks are filled to prevent premature submission
    const allFilled = blanks.every(blankNum => newAnswers[blankNum] && newAnswers[blankNum].trim() !== '');
    
    if (allFilled && !isAnswered) {
      setIsAnswered(true);
    }
  };

  const handleSubmit = () => {
    // Only submit when user explicitly submits
    onAnswer(answers);
  };

  const handleKeyPress = (e, blankNumber) => {
    if (e.key === 'Enter') {
      // Check if all blanks are filled before submitting
      const allFilled = blanks.every(blankNum => answers[blankNum] && answers[blankNum].trim() !== '');
      if (allFilled) {
        handleSubmit();
      }
    }
  };

  const getInputClassName = (blankNumber) => {
    let className = 'fill-blank-input';
    
    if (showCorrect) {
      const userAnswer = answers[blankNumber]?.trim().toLowerCase();
      // Use blanks from normalized question format
      const correctAnswers = question.blanks?.[blankNumber] || question.correctAnswers?.[blankNumber] || [];
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
    // Use blanks from normalized question format
    const correctAnswers = question.blanks?.[blankNumber] || question.correctAnswers?.[blankNumber] || [];
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

  // Debug info for development
  if (process.env.NODE_ENV === 'development' && (!parts || parts.length === 0)) {
    return (
      <div className="fill-blank-question">
        <div className="debug-info" style={{padding: '20px', background: '#f0f0f0', border: '1px solid #ccc'}}>
          <h4>🐛 Fill Blank Debug Info</h4>
          <p><strong>Question:</strong> {JSON.stringify(question)}</p>
          <p><strong>Parts:</strong> {JSON.stringify(parts)}</p>
          <p><strong>Blanks:</strong> {JSON.stringify(blanks)}</p>
          <p><strong>Text used:</strong> {question.text || question.question_text || question.formatted_text || question.question}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fill-blank-question">
      <div className="fill-blank-text">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <span key={`text-${index}`} className="fill-text-part">
                {part.content}
              </span>
            );
          } else if (part.type === 'blank') {
            return (
              <span key={`blank-${index}`} className="fill-blank-input-container">
                <input
                  type="text"
                  className="fill-blank-input"
                  value={answers[part.number] || ''}
                  onChange={(e) => handleInputChange(part.number, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, part.number)}
                  disabled={disabled}
                  placeholder={`Blank ${part.number}`}
                  autoComplete="off"
                />
                {getBlankFeedback(part.number)}
              </span>
            );
          } else {
            return null;
          }
        })}
      </div>

      {/* Submit button for fill-in-blank */}
      <div className="fill-blank-submit">
        <button 
          onClick={handleSubmit}
          disabled={disabled || blanks.some(blankNum => !answers[blankNum] || answers[blankNum].trim() === '')}
          className="fill-blank-submit-btn"
        >
          Submit Answer
        </button>
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
