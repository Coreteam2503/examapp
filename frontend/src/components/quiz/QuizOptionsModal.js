import React, { useState } from 'react';
import './QuizOptionsModal.css';

const QuizOptionsModal = ({ isOpen, onClose, onGenerateQuiz, filename }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState({
    multiple_choice: true,
    true_false: true,
    fill_in_the_blank: true,
    drag_drop_match: false,
    drag_drop_order: false
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    
    const selectedTypes = Object.keys(questionTypes).filter(type => questionTypes[type]);
    
    try {
      await onGenerateQuiz({
        numQuestions,
        difficulty,
        questionTypes: selectedTypes
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const selectedTypesCount = Object.values(questionTypes).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quiz-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Quiz for "{filename}"</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Number of Questions */}
          <div className="option-group">
            <label htmlFor="numQuestions">Number of Questions:</label>
            <div className="number-input-container">
              <button 
                type="button" 
                onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                className="number-btn"
              >
                -
              </button>
              <input
                id="numQuestions"
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="number-input"
              />
              <button 
                type="button" 
                onClick={() => setNumQuestions(Math.min(50, numQuestions + 1))}
                className="number-btn"
              >
                +
              </button>
            </div>
            <small>Choose between 1-50 questions</small>
          </div>

          {/* Difficulty Selection */}
          <div className="option-group">
            <label>Difficulty Level:</label>
            <div className="difficulty-options">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={`difficulty-btn ${difficulty === level ? 'selected' : ''}`}
                  onClick={() => setDifficulty(level)}
                >
                  <span className="difficulty-icon">
                    {level === 'easy' && '🟢'}
                    {level === 'medium' && '🟡'}
                    {level === 'hard' && '🔴'}
                  </span>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div className="option-group">
            <label>Question Types:</label>
            <div className="question-types">
              <div className="question-type-item">
                <input
                  type="checkbox"
                  id="multiple_choice"
                  checked={questionTypes.multiple_choice}
                  onChange={() => handleQuestionTypeChange('multiple_choice')}
                />
                <label htmlFor="multiple_choice">
                  <span className="type-icon">📝</span>
                  Multiple Choice Questions
                  <small>Choose the correct answer from options</small>
                </label>
              </div>

              <div className="question-type-item">
                <input
                  type="checkbox"
                  id="true_false"
                  checked={questionTypes.true_false}
                  onChange={() => handleQuestionTypeChange('true_false')}
                />
                <label htmlFor="true_false">
                  <span className="type-icon">✅</span>
                  True / False
                  <small>Determine if statements are true or false</small>
                </label>
              </div>

              <div className="question-type-item">
                <input
                  type="checkbox"
                  id="fill_in_the_blank"
                  checked={questionTypes.fill_in_the_blank}
                  onChange={() => handleQuestionTypeChange('fill_in_the_blank')}
                />
                <label htmlFor="fill_in_the_blank">
                  <span className="type-icon">📝</span>
                  Fill in the Blanks
                  <small>Complete sentences with missing words</small>
                </label>
              </div>

              <div className="question-type-item">
                <input
                  type="checkbox"
                  id="drag_drop_match"
                  checked={questionTypes.drag_drop_match}
                  onChange={() => handleQuestionTypeChange('drag_drop_match')}
                />
                <label htmlFor="drag_drop_match">
                  <span className="type-icon">🔗</span>
                  Drag & Drop: Match the Following
                  <small>Match related items by dragging</small>
                </label>
              </div>

              <div className="question-type-item">
                <input
                  type="checkbox"
                  id="drag_drop_order"
                  checked={questionTypes.drag_drop_order}
                  onChange={() => handleQuestionTypeChange('drag_drop_order')}
                />
                <label htmlFor="drag_drop_order">
                  <span className="type-icon">📊</span>
                  Drag & Drop: Place in Order
                  <small>Arrange items in correct sequence</small>
                </label>
              </div>
            </div>
            {selectedTypesCount === 0 && (
              <small className="error-text">Please select at least one question type</small>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="quiz-summary">
            <strong>Quiz Preview:</strong> {numQuestions} {difficulty} questions
            {selectedTypesCount > 0 && (
              <span> with {selectedTypesCount} question type{selectedTypesCount > 1 ? 's' : ''}</span>
            )}
          </div>
          
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose} disabled={isGenerating}>
              Cancel
            </button>
            <button 
              className="generate-btn" 
              onClick={handleGenerateQuiz}
              disabled={selectedTypesCount === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating Quiz...
                </>
              ) : (
                '🎯 Generate Quiz'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizOptionsModal;