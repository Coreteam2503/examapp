import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../../services/apiService';
import './QuizTypeSelector.css';

const QuizTypeSelector = ({ onGenerateQuiz, isLoading, preSelectedFile }) => {
  const [selectedFile, setSelectedFile] = useState(preSelectedFile || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice']);
  const [includeHints, setIncludeHints] = useState(false);
  const [files, setFiles] = useState([]);
  const [quizFormat, setQuizFormat] = useState('traditional'); // 'traditional' or 'game'
  const [gameFormat, setGameFormat] = useState('hangman');
  const [gameOptions, setGameOptions] = useState({
    numQuestions: 5,
    maxWrongGuesses: 6,
    levelsCount: 5,
    maxSteps: 8,
    gridSize: 4,
    memoryTime: 5
  });

  // Load user's uploaded files
  useEffect(() => {
    loadFiles();
  }, []);

  // Update selected file if preSelectedFile changes
  useEffect(() => {
    if (preSelectedFile) {
      setSelectedFile(preSelectedFile);
    }
  }, [preSelectedFile]);

  const loadFiles = async () => {
    try {
      const response = await apiService.uploads.list({ page: 1, limit: 50 });
      console.log('Files response structure:', response);
      
      // Handle different response structures
      let filesData = [];
      if (response.data && response.data.success && response.data.data && response.data.data.uploads) {
        filesData = response.data.data.uploads;
      } else if (response.data && response.data.uploads) {
        filesData = response.data.uploads;
      } else if (response.data && Array.isArray(response.data)) {
        filesData = response.data;
      }
      
      console.log('Loaded files:', filesData);
      setFiles(filesData || []);
    } catch (error) {
      console.error('Error loading files:', error);
      // Fallback to demo files
      setFiles([
        { id: 1, filename: 'react-components.js', file_type: 'javascript' },
        { id: 2, filename: 'python-basics.py', file_type: 'python' },
        { id: 3, filename: 'algorithms.md', file_type: 'markdown' }
      ]);
    }
  };

  const handleQuestionTypeChange = (type, checked) => {
    if (checked) {
      setQuestionTypes(prev => [...prev, type]);
    } else {
      setQuestionTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (quizFormat === 'game') {
      // Generate game format - ensure numQuestions is properly passed
      const finalGameOptions = { ...gameOptions };
      
      // Set numQuestions based on game type to ensure proper parameter passing
      if (gameFormat === 'hangman') {
        finalGameOptions.numQuestions = gameOptions.numQuestions || 5;
      } else if (gameFormat === 'knowledge_tower') {
        finalGameOptions.numQuestions = gameOptions.levelsCount || 5;
        finalGameOptions.levelsCount = gameOptions.levelsCount || 5;
      } else if (gameFormat === 'word_ladder') {
        finalGameOptions.numQuestions = gameOptions.numQuestions || 5;
      } else if (gameFormat === 'memory_grid') {
        finalGameOptions.numQuestions = gameOptions.numQuestions || 5;
      }
      
      console.log('🎮 Generating game with options:', {
        gameFormat,
        gameOptions: finalGameOptions,
        numQuestions: finalGameOptions.numQuestions
      });
      
      const options = {
        uploadId: selectedFile,
        gameFormat,
        difficulty,
        numQuestions: finalGameOptions.numQuestions, // Explicitly pass at top level
        gameOptions: finalGameOptions
      };
      onGenerateQuiz(options, 'game');
    } else {
      // Generate traditional quiz
      const options = {
        uploadId: selectedFile,
        difficulty,
        numQuestions,
        questionTypes,
        includeHints
      };
      onGenerateQuiz(options, 'traditional');
    }
  };

  const getGameDescription = (format) => {
    const descriptions = {
      hangman: 'Classic word guessing game with visual hangman drawing',
      knowledge_tower: 'Climb the tower by answering progressively harder questions',
      word_ladder: 'Transform words one letter at a time to reach the target',
      memory_grid: 'Memorize and recall patterns in a grid-based challenge'
    };
    return descriptions[format] || '';
  };

  return (
    <div className="quiz-type-selector">
      <h3>Generate Learning Content</h3>
      <p>Create traditional quizzes or engaging game-based learning experiences!</p>

      {/* Quiz Format Selection */}
      <div className="format-selection">
        <h4>Choose Format:</h4>
        <div className="format-options">
          <label className={`format-option ${quizFormat === 'traditional' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="quizFormat"
              value="traditional"
              checked={quizFormat === 'traditional'}
              onChange={(e) => setQuizFormat(e.target.value)}
            />
            <div className="format-card">
              <div className="format-icon">📝</div>
              <div className="format-title">Traditional Quiz</div>
              <div className="format-desc">Multiple choice, fill-in-blank, true/false questions</div>
            </div>
          </label>
          
          <label className={`format-option ${quizFormat === 'game' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="quizFormat"
              value="game"
              checked={quizFormat === 'game'}
              onChange={(e) => setQuizFormat(e.target.value)}
            />
            <div className="format-card">
              <div className="format-icon">🎮</div>
              <div className="format-title">Game Format</div>
              <div className="format-desc">Interactive games: Hangman, Tower, Word Ladder, Memory Grid</div>
            </div>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="file-select">Select File:</label>
        <select 
          id="file-select"
          value={selectedFile} 
          onChange={(e) => setSelectedFile(e.target.value)}
          className="form-control"
          disabled={!!preSelectedFile}
        >
          <option value="">Choose a file...</option>
          {files.map(file => (
            <option key={file.id} value={file.id}>
              {file.filename} ({file.file_type || file.fileType})
            </option>
          ))}
        </select>
        {preSelectedFile && (
          <small style={{ color: '#666', fontStyle: 'italic' }}>File pre-selected from File Manager</small>
        )}
      </div>

      {/* Game Format Selection */}
      {quizFormat === 'game' && (
        <div className="game-format-section">
          <h4>Choose Game Type:</h4>
          <div className="game-options">
            <label className={`game-option ${gameFormat === 'hangman' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gameFormat"
                value="hangman"
                checked={gameFormat === 'hangman'}
                onChange={(e) => setGameFormat(e.target.value)}
              />
              <div className="game-card">
                <div className="game-icon">🎯</div>
                <div className="game-title">Hangman</div>
                <div className="game-desc">{getGameDescription('hangman')}</div>
              </div>
            </label>
            
            <label className={`game-option ${gameFormat === 'knowledge_tower' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gameFormat"
                value="knowledge_tower"
                checked={gameFormat === 'knowledge_tower'}
                onChange={(e) => setGameFormat(e.target.value)}
              />
              <div className="game-card">
                <div className="game-icon">🏗️</div>
                <div className="game-title">Knowledge Tower</div>
                <div className="game-desc">{getGameDescription('knowledge_tower')}</div>
              </div>
            </label>
            
            <label className={`game-option ${gameFormat === 'word_ladder' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gameFormat"
                value="word_ladder"
                checked={gameFormat === 'word_ladder'}
                onChange={(e) => setGameFormat(e.target.value)}
              />
              <div className="game-card">
                <div className="game-icon">🪜</div>
                <div className="game-title">Word Ladder</div>
                <div className="game-desc">{getGameDescription('word_ladder')}</div>
              </div>
            </label>
            
            <label className={`game-option ${gameFormat === 'memory_grid' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gameFormat"
                value="memory_grid"
                checked={gameFormat === 'memory_grid'}
                onChange={(e) => setGameFormat(e.target.value)}
              />
              <div className="game-card">
                <div className="game-icon">🧠</div>
                <div className="game-title">Memory Grid</div>
                <div className="game-desc">{getGameDescription('memory_grid')}</div>
              </div>
            </label>
          </div>

          {/* Game-specific options */}
          <div className="game-options-config">
            <h5>Game Options:</h5>
            {gameFormat === 'hangman' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Words:</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={gameOptions.numQuestions || 5}
                    onChange={(e) => setGameOptions({...gameOptions, numQuestions: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
                <div className="form-group">
                  <label>Max Wrong Guesses:</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={gameOptions.maxWrongGuesses}
                    onChange={(e) => setGameOptions({...gameOptions, maxWrongGuesses: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
              </div>
            )}
            
            {gameFormat === 'knowledge_tower' && (
              <div className="form-group">
                <label>Number of Levels:</label>
                <input
                  type="number"
                  min="3"
                  max="25"
                  value={gameOptions.levelsCount}
                  onChange={(e) => setGameOptions({...gameOptions, levelsCount: parseInt(e.target.value)})}
                  className="form-control small"
                />
              </div>
            )}
            
            {gameFormat === 'word_ladder' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Ladders:</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={gameOptions.numQuestions || 5}
                    onChange={(e) => setGameOptions({...gameOptions, numQuestions: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
                <div className="form-group">
                  <label>Max Steps per Ladder:</label>
                  <input
                    type="number"
                    min="5"
                    max="15"
                    value={gameOptions.maxSteps}
                    onChange={(e) => setGameOptions({...gameOptions, maxSteps: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
              </div>
            )}
            
            {gameFormat === 'memory_grid' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Number of Patterns:</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={gameOptions.numQuestions || 5}
                    onChange={(e) => setGameOptions({...gameOptions, numQuestions: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
                <div className="form-group">
                  <label>Grid Size:</label>
                  <select
                    value={gameOptions.gridSize}
                    onChange={(e) => setGameOptions({...gameOptions, gridSize: parseInt(e.target.value)})}
                    className="form-control small"
                  >
                    <option value={3}>3×3</option>
                    <option value={4}>4×4</option>
                    <option value={5}>5×5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Memory Time (seconds):</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={gameOptions.memoryTime}
                    onChange={(e) => setGameOptions({...gameOptions, memoryTime: parseInt(e.target.value)})}
                    className="form-control small"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

        {quizFormat === 'traditional' && (
          <div className="form-group">
            <label htmlFor="num-questions">Number of Questions:</label>
            <input 
              id="num-questions"
              type="number" 
              min="3" 
              max="25" 
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="form-control"
            />
          </div>
        )}
      </div>

      {quizFormat === 'traditional' && (
        <>
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

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={questionTypes.includes('true_false')}
                  onChange={(e) => handleQuestionTypeChange('true_false', e.target.checked)}
                />
                <span className="checkbox-text">
                  True/False
                  <small>Simple true or false questions</small>
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={questionTypes.includes('matching')}
                  onChange={(e) => handleQuestionTypeChange('matching', e.target.checked)}
                />
                <span className="checkbox-text">
                  Matching
                  <small>Match items from two lists</small>
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
        </>
      )}

      <button 
        className="generate-btn"
        onClick={handleGenerateQuiz}
        disabled={isLoading || (quizFormat === 'traditional' && questionTypes.length === 0)}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            {quizFormat === 'game' ? 'Generating Game...' : 'Generating Quiz...'}
          </>
        ) : (
          <>
            {quizFormat === 'game' ? (
              <>🎮 Generate {gameFormat.replace('_', ' ').toUpperCase()} Game</>
            ) : (
              <>📝 Generate Enhanced Quiz</>
            )}
          </>
        )}
      </button>

      {quizFormat === 'traditional' && questionTypes.length === 0 && (
        <p className="error-message">Please select at least one question type.</p>
      )}
    </div>
  );
};

export default QuizTypeSelector;