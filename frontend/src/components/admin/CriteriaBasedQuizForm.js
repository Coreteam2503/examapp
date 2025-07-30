import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import './CriteriaBasedQuizForm.css';

const CriteriaBasedQuizForm = ({ onSave, onCancel, className = '' }) => {
  const [criteria, setCriteria] = useState({
    domain: '',
    subject: '',
    source: '',
    difficulty_level: '',
    num_questions: 10,
    time_limit: 30,
    game_format: 'traditional'
  });

  const [criteriaOptions, setCriteriaOptions] = useState({
    domains: [],
    subjects: [],
    sources: [],
    difficulties: ['Easy', 'Medium', 'Hard']
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validation, setValidation] = useState({ 
    isValid: true, 
    errors: [], 
    warnings: [],
    matchingQuestions: 0 
  });

  // Load available criteria options
  useEffect(() => {
    loadCriteriaOptions();
  }, []);

  const loadCriteriaOptions = async () => {
    try {
      const response = await fetch('/api/quizzes/generation-options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCriteriaOptions({
          domains: data.domains || [],
          subjects: data.subjects || [],
          sources: data.sources || [],
          difficulties: data.difficulties?.map(d => d.difficulty_level) || ['Easy', 'Medium', 'Hard']
        });
      }
    } catch (error) {
      console.error('Error loading criteria options:', error);
    }
  };

  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset preview when criteria changes
    setPreview(null);
    setShowPreview(false);
  };

  const previewQuestions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/quizzes/preview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...criteria,
          limit: 5 // Preview 5 questions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.data);
        setShowPreview(true);
        
        // Update validation
        setValidation({
          isValid: data.data.total_matching >= criteria.num_questions,
          errors: data.data.total_matching < criteria.num_questions ? 
            [`Only ${data.data.total_matching} questions available, but ${criteria.num_questions} requested`] : [],
          warnings: data.data.total_matching < criteria.num_questions * 2 ? 
            ['Limited question pool - consider broadening criteria for better randomization'] : [],
          matchingQuestions: data.data.total_matching
        });
      } else {
        const errorData = await response.json();
        setValidation({
          isValid: false,
          errors: [errorData.message || 'Failed to preview questions'],
          warnings: [],
          matchingQuestions: 0
        });
      }
    } catch (error) {
      console.error('Error previewing questions:', error);
      setValidation({
        isValid: false,
        errors: ['Failed to connect to server'],
        warnings: [],
        matchingQuestions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/quizzes/generate-dynamic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...criteria,
          use_criteria: true // Use criteria-based generation
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.data);
      } else {
        const errorData = await response.json();
        setValidation({
          isValid: false,
          errors: [errorData.message || 'Failed to create quiz'],
          warnings: [],
          matchingQuestions: 0
        });
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setValidation({
        isValid: false,
        errors: ['Failed to connect to server'],
        warnings: [],
        matchingQuestions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getCriteriaSummary = () => {
    const parts = [];
    if (criteria.domain) parts.push(`Domain: ${criteria.domain}`);
    if (criteria.subject) parts.push(`Subject: ${criteria.subject}`);
    if (criteria.source) parts.push(`Source: ${criteria.source}`);
    if (criteria.difficulty_level) parts.push(`Difficulty: ${criteria.difficulty_level}`);
    return parts.length > 0 ? parts.join(', ') : 'Any available questions';
  };

  return (
    <div className={`criteria-quiz-form ${className}`}>
      <div className="form-header">
        <h3>Create Criteria-Based Quiz</h3>
        <p>Define criteria to dynamically select questions for your quiz</p>
      </div>

      <div className="form-content">
        {/* Basic Configuration */}
        <div className="form-section">
          <h4>Quiz Configuration</h4>
          
          <div className="form-group">
            <label htmlFor="num_questions">Number of Questions</label>
            <input
              id="num_questions"
              type="number"
              min="1"
              max="50"
              value={criteria.num_questions}
              onChange={(e) => handleCriteriaChange('num_questions', parseInt(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="time_limit">Time Limit (minutes)</label>
            <input
              id="time_limit"
              type="number"
              min="1"
              max="180"
              value={criteria.time_limit}
              onChange={(e) => handleCriteriaChange('time_limit', parseInt(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game_format">Quiz Format</label>
            <select
              id="game_format"
              value={criteria.game_format}
              onChange={(e) => handleCriteriaChange('game_format', e.target.value)}
              className="form-control"
            >
              <option value="traditional">Traditional Quiz</option>
              <option value="hangman">Hangman Game</option>
              <option value="knowledge_tower">Knowledge Tower</option>
              <option value="word_ladder">Word Ladder</option>
              <option value="memory_grid">Memory Grid</option>
            </select>
          </div>
        </div>

        {/* Question Selection Criteria */}
        <div className="form-section">
          <h4>Question Selection Criteria</h4>
          <p className="section-description">
            Select criteria to filter questions from the question bank. Leave empty to include all options.
          </p>

          <div className="form-group">
            <label htmlFor="domain">Domain</label>
            <select
              id="domain"
              value={criteria.domain}
              onChange={(e) => handleCriteriaChange('domain', e.target.value)}
              className="form-control"
            >
              <option value="">Any Domain</option>
              {criteriaOptions.domains.map(domain => (
                <option key={domain.domain} value={domain.domain}>
                  {domain.domain} ({domain.count} questions)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={criteria.subject}
              onChange={(e) => handleCriteriaChange('subject', e.target.value)}
              className="form-control"
            >
              <option value="">Any Subject</option>
              {criteriaOptions.subjects.map(subject => (
                <option key={subject.subject} value={subject.subject}>
                  {subject.subject} ({subject.count} questions)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="source">Source</label>
            <select
              id="source"
              value={criteria.source}
              onChange={(e) => handleCriteriaChange('source', e.target.value)}
              className="form-control"
            >
              <option value="">Any Source</option>
              {criteriaOptions.sources.map(source => (
                <option key={source.source} value={source.source}>
                  {source.source} ({source.count} questions)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty_level">Difficulty</label>
            <select
              id="difficulty_level"
              value={criteria.difficulty_level}
              onChange={(e) => handleCriteriaChange('difficulty_level', e.target.value)}
              className="form-control"
            >
              <option value="">Any Difficulty</option>
              {criteriaOptions.difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Criteria Summary */}
        <div className="criteria-summary">
          <h4>Selection Summary</h4>
          <p>{getCriteriaSummary()}</p>
          {validation.matchingQuestions > 0 && (
            <p className="matching-count">
              {validation.matchingQuestions} questions match these criteria
            </p>
          )}
        </div>

        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <div className="validation-errors">
            {validation.errors.map((error, index) => (
              <div key={index} className="error-message">
                <ExclamationTriangleIcon className="icon" />
                {error}
              </div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="validation-warnings">
            {validation.warnings.map((warning, index) => (
              <div key={index} className="warning-message">
                <InformationCircleIcon className="icon" />
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Preview Section */}
        {showPreview && preview && (
          <div className="preview-section">
            <h4>Question Preview</h4>
            <p>Sample of {preview.sample_questions.length} questions from {preview.total_matching} total:</p>
            
            <div className="preview-questions">
              {preview.sample_questions.map((question, index) => (
                <div key={question.id} className="preview-question">
                  <div className="question-header">
                    <span className="question-type">{question.type.replace('_', ' ')}</span>
                    <span className="question-difficulty">{question.difficulty_level}</span>
                  </div>
                  <div className="question-text">
                    {question.question_text}
                  </div>
                  <div className="question-meta">
                    {question.domain} • {question.subject}
                  </div>
                </div>
              ))}
            </div>
            
            {preview.has_more && (
              <p className="preview-note">
                And {preview.total_matching - preview.sample_questions.length} more questions...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button
          type="button"
          onClick={previewQuestions}
          disabled={loading}
          className="btn btn-secondary"
        >
          <EyeIcon className="icon" />
          {loading ? 'Loading...' : 'Preview Questions'}
        </button>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !validation.isValid}
          className="btn btn-primary"
        >
          <CheckCircleIcon className="icon" />
          {loading ? 'Creating...' : 'Create Quiz'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CriteriaBasedQuizForm;
