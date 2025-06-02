import React, { useState } from 'react';
import './QuizTypeSelector.css';

const QuizTypeSelector = ({ onGenerateQuiz, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice']);
  const [includeHints, setIncludeHints] = useState(false);
  const [files, setFiles] = useState([]);

  // Mock files for demo - in real app, fetch from API
  React.useEffect(() => {
    // This would be an API call to get user's uploaded files
    setFiles([
      { id: 1, filename: 'react-components.js', fileType: 'javascript' },
      { id: 2, filename: 'python-basics.py', fileType: 'python' },
      { id: 3, filename: 'algorithms.md', fileType: 'markdown' }
    ]);
  }, []);

  const handleQuestionTypeChange = (type, checked) => {
    if (checked) {
      setQuestionTypes(prev => [...prev, type]);
    } else {
      setQuestionTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleGenerateQuiz = () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    const options = {
      uploadId: selectedFile,
      difficulty,
      numQuestions,
      questionTypes,
      includeHints
    };

    onGenerateQuiz(options);
  };

  return (
    <div className="quiz-type-selector">
      <h3>Generate Enhanced Quiz</h3>
      <p>Create quizzes with multiple question types including fill-in-the-blank!</p>

      <div className="form-group">
        <label htmlFor="file-select">Select File:</label>
        <select 
          id="file-select"
          value={selectedFile} 
          onChange={(e) => setSelectedFile(e.target.value)}
          className="form-control"
        >
          <option value="">Choose a file...</option>
          {files.map(file => (
            <option key={file.id} value={file.id}>
              {file.filename} ({file.fileType})
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="difficulty">Difficulty:</label>
          <select 
            id="difficulty"
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="form-control"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="num-questions">Number of Questions:</label>
          <input 
            id="num-questions"
            type="number" 
            min="3" 
            max="20" 
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            className="form-control"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Question Types:</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={questionTypes.includes('multiple_choice')}
              onChange={(e) => handleQuestionTypeChange('multiple_choice', e.target.checked)}
            />
            <span className="checkbox-text">
              Multiple Choice
              <small>Traditional A/B/C/D questions</small>
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={questionTypes.includes('fill_in_the_blank')}
              onChange={(e) => handleQuestionTypeChange('fill_in_the_blank', e.target.checked)}
            />
            <span className="checkbox-text">
              Fill in the Blank
              <small>Complete sentences with missing words</small>
            </span>
          </label>

          <label className="checkbox-label disabled">
            <input
              type="checkbox"
              disabled
              checked={false}
            />
            <span className="checkbox-text">
              True/False
              <small>Coming soon...</small>
            </span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeHints}
            onChange={(e) => setIncludeHints(e.target.checked)}
          />
          <span className="checkbox-text">
            Include Hints
            <small>Add helpful hints for students</small>
          </span>
        </label>
      </div>

      <button 
        className="generate-btn"
        onClick={handleGenerateQuiz}
        disabled={isLoading || questionTypes.length === 0}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            Generating Quiz...
          </>
        ) : (
          <>
            Generate Enhanced Quiz
          </>
        )}
      </button>

      {questionTypes.length === 0 && (
        <p className="error-message">Please select at least one question type.</p>
      )}
    </div>
  );
};

export default QuizTypeSelector;
