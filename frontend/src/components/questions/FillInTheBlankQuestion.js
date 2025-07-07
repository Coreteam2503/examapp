import React, { useState, useEffect, useMemo } from 'react';
import './FillInTheBlankQuestion.css';

// Parse the question text to find blanks (marked with ___BLANK_N___ or generic _____)
const parseQuestionText = (text) => {
  const parts = [];
  let blanks = [];
  
  // First try the numbered format ___BLANK_N___
  const numberedBlankRegex = /___BLANK_(\d+)___/g;
  let lastIndex = 0;
  let match;
  let blankCount = 0;

  // Check if we have numbered blanks
  const numberedMatches = text.match(numberedBlankRegex);
  
  if (numberedMatches && numberedMatches.length > 0) {
    // Use numbered blank format
    while ((match = numberedBlankRegex.exec(text)) !== null) {
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
  } else {
    // Use generic blank format _____ or ______
    const genericBlankRegex = /_{3,}/g;
    blankCount = 1;
    
    while ((match = genericBlankRegex.exec(text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the blank with auto-incrementing number
      parts.push({
        type: 'blank',
        number: blankCount
      });
      blanks.push(blankCount);
      blankCount++;

      lastIndex = match.index + match[0].length;
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  console.log('🔍 DEBUG - parseQuestionText result:', { parts, blanks, originalText: text });
  return { parts, blanks };
};

const FillInTheBlankQuestion = ({ question, onAnswer, disabled = false, showCorrect = false }) => {
  const [answers, setAnswers] = useState({});
  const [isAnswered, setIsAnswered] = useState(false);

  // Debug logging for question data
  console.log('🔍 DEBUG - FillInTheBlankQuestion rendered with:', {
    question,
    questionId: question?.id,
    questionText: question?.text,
    questionQuestion: question?.question,
    questionFormattedText: question?.formatted_text,
    questionQuestionText: question?.question_text,
    questionBlanks: question?.blanks
  });

  // Memoize the parsed question to avoid re-parsing on every render
  const { parts, blanks } = useMemo(() => {
    // Try different possible text fields (normalized format uses 'text' but fallback to 'question')
    const questionText = question.text || question.question_text || question.formatted_text || question.question || '';
    console.log('🔍 DEBUG - Parsing question text:', questionText);
    const result = parseQuestionText(questionText);
    console.log('🔍 DEBUG - Parsed result:', result);
    return result;
  }, [question.text, question.formatted_text, question.question_text, question.question]);

  // Initialize answers only when question ID changes
  useEffect(() => {
    const initialAnswers = {};
    blanks.forEach(blankNum => {
      initialAnswers[blankNum] = '';
    });
    console.log('🔍 DEBUG - Initializing answers for question', question.id, ':', initialAnswers);
    setAnswers(initialAnswers);
    setIsAnswered(false);
  }, [question.id, blanks.join(',')]); // Use blanks.join(',') as dependency

  const handleInputChange = (blankNumber, value) => {
    console.log(`🔍 DEBUG - Input change for blank ${blankNumber}:`, value);
    const newAnswers = {
      ...answers,
      [blankNumber]: value
    };
    setAnswers(newAnswers);
    console.log('🔍 DEBUG - Updated answers:', newAnswers);

    // Don't auto-submit on every keystroke - wait for explicit submission
    // Only update if all blanks are filled to prevent premature submission
    const allFilled = blanks.every(blankNum => newAnswers[blankNum] && newAnswers[blankNum].trim() !== '');
    
    if (allFilled && !isAnswered) {
      setIsAnswered(true);
    }
  };

  const handleSubmit = () => {
    // Only submit when user explicitly submits
    console.log('🔍 DEBUG - Submitting fill-in-blank answers:', answers);
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
                  style={{
                    minWidth: '100px',
                    padding: '4px 8px',
                    border: '2px solid #007bff',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    display: 'inline-block'
                  }}
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
