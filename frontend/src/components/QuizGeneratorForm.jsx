import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCriteriaSelector from './QuizCriteriaSelector';
import { quizGenerationService } from '../services/quizGenerationService';
import { 
  PlayIcon, 
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './QuizGeneratorForm.css';

const QuizGeneratorForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [criteria, setCriteria] = useState({
    domain: '',
    subject: '',
    source: '',
    difficulty_level: 'Medium',
    game_format: 'traditional',
    num_questions: 10
  });

  // Options state
  const [options, setOptions] = useState({
    domains: [],
    subjects: [],
    sources: [],
    types: [],
    gameFormats: []
  });

  // UI state
  const [loading, setLoading] = useState({
    options: true,
    questionCount: false,
    generating: false
  });
  
  const [errors, setErrors] = useState({});
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [generationResult, setGenerationResult] = useState(null);

  // Game format definitions
  const gameFormats = [
    {
      id: 'traditional',
      name: 'Traditional Quiz',
      description: 'Standard question and answer format',
      icon: '📝'
    },
    {
      id: 'hangman',
      name: 'Hangman',
      description: 'Guess the word letter by letter',
      icon: '🎯'
    },
    {
      id: 'knowledge_tower',
      name: 'Knowledge Tower',
      description: 'Build a tower by answering correctly',
      icon: '🏗️'
    },
    {
      id: 'word_ladder',
      name: 'Word Ladder',
      description: 'Climb the ladder with correct answers',
      icon: '🪜'
    },
    {
      id: 'memory_grid',
      name: 'Memory Grid',
      description: 'Memory-based question challenge',
      icon: '🧩'
    }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: 'Easy', label: 'Easy', description: 'Basic questions' },
    { value: 'Medium', label: 'Medium', description: 'Moderate difficulty' },
    { value: 'Hard', label: 'Hard', description: 'Challenging questions' }
  ];

  // Load initial options
  useEffect(() => {
    loadGenerationOptions();
  }, []);

  // Check available questions when criteria changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailableQuestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [criteria.domain, criteria.subject, criteria.source, criteria.difficulty_level]);

  // Load available options from API
  const loadGenerationOptions = async () => {
    try {
      setLoading(prev => ({ ...prev, options: true }));
      
      const result = await quizGenerationService.getGenerationOptions();
      
      if (result.success) {
        const data = result.data.data;
        setOptions({
          domains: data.domains.map(d => ({ 
            value: d.domain, 
            label: d.domain, 
            count: d.count 
          })),
          subjects: data.subjects.map(s => ({ 
            value: s.subject, 
            label: s.subject, 
            count: s.count 
          })),
          sources: data.sources.map(s => ({ 
            value: s.source, 
            label: s.source, 
            count: s.count 
          })),
          types: data.types.map(t => ({ 
            value: t.type, 
            label: t.type.replace('_', ' '), 
            count: t.count 
          })),
          gameFormats: gameFormats
        });
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error loading generation options:', error);
      setErrors({ general: 'Failed to load generation options' });
    } finally {
      setLoading(prev => ({ ...prev, options: false }));
    }
  };

  // Check how many questions are available for current criteria
  const checkAvailableQuestions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, questionCount: true }));
      
      const filters = {};
      if (criteria.domain) filters.domain = criteria.domain;
      if (criteria.subject) filters.subject = criteria.subject;
      if (criteria.source) filters.source = criteria.source;
      if (criteria.difficulty_level) filters.difficulty_level = criteria.difficulty_level;
      
      const result = await quizGenerationService.getAvailableQuestionCount(filters);
      
      if (result.success) {
        setAvailableQuestions(result.count);
      }
    } catch (error) {
      console.error('Error checking available questions:', error);
    } finally {
      setLoading(prev => ({ ...prev, questionCount: false }));
    }
  }, [criteria.domain, criteria.subject, criteria.source, criteria.difficulty_level]);

  // Handle form field changes
  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (criteria.num_questions < 1) {
      newErrors.num_questions = 'Number of questions must be at least 1';
    }
    
    if (criteria.num_questions > 50) {
      newErrors.num_questions = 'Number of questions cannot exceed 50';
    }
    
    if (criteria.num_questions > availableQuestions) {
      newErrors.num_questions = `Only ${availableQuestions} questions available for current criteria`;
    }
    
    if (availableQuestions === 0) {
      newErrors.general = 'No questions available for the selected criteria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle quiz generation
  const handleGenerateQuiz = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setGenerationResult(null);
      
      const result = await quizGenerationService.generateDynamicQuiz(criteria);
      
      if (result.success) {
        const quiz = result.data.data;
        setGenerationResult({
          success: true,
          quiz: quiz.quiz,
          questionsUsed: quiz.questionsUsed
        });
        
        // Navigate to appropriate game component after a short delay
        setTimeout(() => {
          navigateToGame(quiz.quiz);
        }, 2000);
        
      } else {
        setGenerationResult({
          success: false,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setGenerationResult({
        success: false,
        message: 'Failed to generate quiz'
      });
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  // Navigate to appropriate game component
  const navigateToGame = (quiz) => {
    const gameFormat = quiz.game_format || 'traditional';
    
    switch (gameFormat) {
      case 'hangman':
        navigate(`/games/hangman/${quiz.id}`);
        break;
      case 'knowledge_tower':
        navigate(`/games/knowledge-tower/${quiz.id}`);
        break;
      case 'word_ladder':
        navigate(`/games/word-ladder/${quiz.id}`);
        break;
      case 'memory_grid':
        navigate(`/games/memory-grid/${quiz.id}`);
        break;
      default:
        navigate(`/quiz/${quiz.id}`);
    }
  };

  const isFormValid = availableQuestions > 0 && criteria.num_questions <= availableQuestions;

  return (
    <div className="quiz-generator-form">
      {/* Header */}
      <div className="header-section">
        <h2>Generate Quiz</h2>
        <p>Create a custom quiz by selecting your preferences below</p>
      </div>

      {/* Main form */}
      <div className="form-card">
        <div className="form-grid">
          
          {/* Criteria Selection */}
          <div className="form-section">
            <h3 className="section-title">
              <AdjustmentsHorizontalIcon />
              Quiz Criteria
            </h3>
            
            {/* Domain Selector */}
            <QuizCriteriaSelector
              label="Domain"
              options={options.domains}
              value={criteria.domain}
              onChange={(value) => handleCriteriaChange('domain', value)}
              placeholder="Select domain..."
              loading={loading.options}
              showCount={true}
              error={errors.domain}
            />
            
            {/* Subject Selector */}
            <QuizCriteriaSelector
              label="Subject"
              options={options.subjects}
              value={criteria.subject}
              onChange={(value) => handleCriteriaChange('subject', value)}
              placeholder="Select subject..."
              loading={loading.options}
              showCount={true}
              error={errors.subject}
            />
            
            {/* Source Selector */}
            <QuizCriteriaSelector
              label="Source"
              options={options.sources}
              value={criteria.source}
              onChange={(value) => handleCriteriaChange('source', value)}
              placeholder="Select source..."
              loading={loading.options}
              showCount={true}
              error={errors.source}
            />
            
            {/* Difficulty Level */}
            <QuizCriteriaSelector
              label="Difficulty Level"
              options={difficultyLevels}
              value={criteria.difficulty_level}
              onChange={(value) => handleCriteriaChange('difficulty_level', value)}
              placeholder="Select difficulty"
              searchable={false}
              clearable={false}
              error={errors.difficulty_level}
            />
          </div>

          {/* Game Format & Settings */}
          <div className="form-section">
            <h3 className="section-title">
              <PlayIcon />
              Game Format
            </h3>
            
            {/* Game Format Selection */}
            <div className="game-format-grid">
              {gameFormats.map((format) => (
                <label
                  key={format.id}
                  className={`game-format-option ${
                    criteria.game_format === format.id ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="game_format"
                    value={format.id}
                    checked={criteria.game_format === format.id}
                    onChange={(e) => handleCriteriaChange('game_format', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span className="game-format-icon">{format.icon}</span>
                  <div className="game-format-content">
                    <div className="game-format-name">{format.name}</div>
                    <div className="game-format-description">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Number of Questions */}
            <div className="number-input-group">
              <label className="number-input-label">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={criteria.num_questions}
                onChange={(e) => handleCriteriaChange('num_questions', parseInt(e.target.value) || 1)}
                className={`number-input ${errors.num_questions ? 'input-error' : ''}`}
              />
              {errors.num_questions && (
                <p className="error-message">{errors.num_questions}</p>
              )}
            </div>
          </div>
        </div>

        {/* Question Availability */}
        <div className="availability-section">
          <div className="availability-header">
            <div className="availability-label">
              <InformationCircleIcon />
              <span>Available Questions</span>
            </div>
            <div className="availability-count">
              {loading.questionCount ? (
                <div className="availability-spinner"></div>
              ) : (
                <span className={`count-text ${
                  availableQuestions >= criteria.num_questions ? 'count-sufficient' : 'count-insufficient'
                }`}>
                  {availableQuestions} questions
                </span>
              )}
            </div>
          </div>
          
          {availableQuestions < criteria.num_questions && (
            <div className="warning-message">
              <ExclamationTriangleIcon />
              <p className="warning-text">
                Not enough questions available. Please adjust your criteria or reduce the number of questions.
              </p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.general && (
          <div className="error-container">
            <div className="error-header">
              <ExclamationTriangleIcon />
              <span className="error-title">Error</span>
            </div>
            <p className="error-content">{errors.general}</p>
          </div>
        )}

        {/* Generation Result */}
        {generationResult && (
          <div className={`success-container ${
            generationResult.success ? 'success' : 'error'
          }`}>
            <div className={`result-title ${
              generationResult.success ? 'success' : 'error'
            }`}>
              {generationResult.success ? '✅ Quiz Generated Successfully!' : '❌ Generation Failed'}
            </div>
            <div className={`result-content ${
              generationResult.success ? 'success' : 'error'
            }`}>
              {generationResult.success 
                ? `Generated quiz with ${generationResult.questionsUsed} questions. Redirecting to game...`
                : generationResult.message
              }
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="button-container">
          <button
            onClick={handleGenerateQuiz}
            disabled={!isFormValid || loading.generating}
            className={`generate-button ${
              isFormValid && !loading.generating ? 'enabled' : 'disabled'
            }`}
          >
            {loading.generating ? (
              <>
                <div className="button-spinner"></div>
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <PlayIcon />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGeneratorForm;