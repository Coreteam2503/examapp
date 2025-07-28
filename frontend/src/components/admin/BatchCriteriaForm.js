import React, { useState, useEffect } from 'react';
import { useBatchCriteria, formatOptionsForSelect, validateCriteriaForm, getCriteriaSummary } from '../../hooks/useBatchCriteria';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './BatchCriteriaForm.css';

const BatchCriteriaForm = ({ 
  batch = null, 
  initialCriteria = null,
  onSave, 
  onCancel,
  showTitle = true,
  className = ''
}) => {
  const {
    criteriaOptions,
    loading: optionsLoading,
    error: optionsError,
    validateCriteria,
    previewQuestions,
    updateBatchCriteria,
    clearError
  } = useBatchCriteria();

  const [criteria, setCriteria] = useState({
    sources: [],
    difficulty_levels: [],
    domains: [],
    subjects: [],
    min_questions: 3
  });

  const [validation, setValidation] = useState({ 
    isValid: true, 
    errors: [], 
    warnings: [],
    matchingQuestions: 0 
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Initialize form with existing batch criteria or initial criteria
  useEffect(() => {
    if (initialCriteria) {
      setCriteria(initialCriteria);
    } else if (batch && batch.quiz_criteria) {
      try {
        const existingCriteria = typeof batch.quiz_criteria === 'string' 
          ? JSON.parse(batch.quiz_criteria) 
          : batch.quiz_criteria;
        setCriteria(prev => ({ ...prev, ...existingCriteria }));
      } catch (error) {
        console.error('Error parsing existing criteria:', error);
      }
    }
  }, [batch, initialCriteria]);

  // Real-time validation with debouncing
  useEffect(() => {
    if (!criteriaOptions) return;
    
    const debounceValidation = setTimeout(async () => {
      if (criteria.sources.length > 0 || criteria.difficulty_levels.length > 0) {
        try {
          clearError();
          const validationResult = await validateCriteria(criteria);
          setValidation(validationResult);
        } catch (error) {
          console.error('Validation error:', error);
          setValidation({ 
            isValid: false, 
            errors: [error.message], 
            warnings: [],
            matchingQuestions: 0 
          });
        }
      } else {
        setValidation({ 
          isValid: true, 
          errors: [], 
          warnings: [],
          matchingQuestions: 0 
        });
      }
    }, 500);

    return () => clearTimeout(debounceValidation);
  }, [criteria, criteriaOptions, validateCriteria, clearError]);

  const handleArrayChange = (field, selectedValues) => {
    setCriteria(prev => ({
      ...prev,
      [field]: selectedValues
    }));
    
    // Clear form errors for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectChange = (field, event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    handleArrayChange(field, selectedOptions);
  };

  const handleCheckboxChange = (field, value, checked) => {
    const currentValues = criteria[field] || [];
    if (checked) {
      handleArrayChange(field, [...currentValues, value]);
    } else {
      handleArrayChange(field, currentValues.filter(v => v !== value));
    }
  };

  const handlePreviewQuestions = async () => {
    try {
      setLoading(true);
      const previewData = await previewQuestions(criteria, 10);
      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate form first
    const formValidation = validateCriteriaForm(criteria);
    if (!formValidation.isValid) {
      setFormErrors(formValidation.errors);
      return;
    }

    // Check backend validation
    if (!validation.isValid) {
      alert('Please fix the criteria validation errors before saving');
      return;
    }

    try {
      setLoading(true);
      
      if (batch) {
        // Update existing batch
        await updateBatchCriteria(batch.id, criteria);
      }
      
      if (onSave) {
        onSave(criteria);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save criteria: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className={`batch-criteria-form loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading criteria options...</span>
        </div>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className={`batch-criteria-form error ${className}`}>
        <div className="error-state">
          <ExclamationTriangleIcon className="error-icon" />
          <h3>Error Loading Criteria Options</h3>
          <p>{optionsError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!criteriaOptions) return null;

  return (
    <div className={`batch-criteria-form ${className}`}>
      {showTitle && (
        <div className="form-header">
          <h3>Quiz Assignment Criteria</h3>
          <p>Set criteria to automatically assign quizzes to this batch based on question properties</p>
        </div>
      )}
      
      {/* Validation Summary */}
      {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.matchingQuestions > 0) && (
        <div className="validation-summary">
          {validation.errors.length > 0 && (
            <div className="validation-errors">
              <ExclamationTriangleIcon className="validation-icon error" />
              <div>
                <strong>Errors:</strong>
                <ul>
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <ExclamationTriangleIcon className="validation-icon warning" />
              <div>
                <strong>Warnings:</strong>
                <ul>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {validation.matchingQuestions > 0 && validation.errors.length === 0 && (
            <div className="validation-success">
              <CheckCircleIcon className="validation-icon success" />
              <div>
                <strong>✅ {validation.matchingQuestions} questions match your criteria</strong>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-content">
        {/* Sources Selection */}
        <div className="form-group">
          <label className="form-label required">
            Sources
            <span className="field-info">
              ({criteriaOptions.sources.length} available)
            </span>
          </label>
          <select
            multiple
            value={criteria.sources}
            onChange={(e) => handleSelectChange('sources', e)}
            className={`form-select ${formErrors.sources ? 'error' : ''}`}
            size={Math.min(6, criteriaOptions.sources.length)}
          >
            {criteriaOptions.sources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label} ({source.count} questions - {source.percentage}%)
              </option>
            ))}
          </select>
          {formErrors.sources && (
            <span className="field-error">{formErrors.sources}</span>
          )}
          <div className="field-help">
            Hold Ctrl/Cmd to select multiple sources
          </div>
        </div>

        {/* Difficulty Levels */}
        <div className="form-group">
          <label className="form-label required">Difficulty Levels</label>
          <div className="checkbox-group">
            {criteriaOptions.difficulty_levels.map((difficulty) => (
              <label key={difficulty.value} className="checkbox-label">
                <input
                  type="checkbox"
                  value={difficulty.value}
                  checked={criteria.difficulty_levels.includes(difficulty.value)}
                  onChange={(e) => handleCheckboxChange('difficulty_levels', difficulty.value, e.target.checked)}
                />
                <span className="checkbox-text">
                  {difficulty.label} 
                  <span className="option-stats">
                    ({difficulty.count} questions - {difficulty.percentage}%)
                  </span>
                </span>
              </label>
            ))}
          </div>
          {formErrors.difficulty_levels && (
            <span className="field-error">{formErrors.difficulty_levels}</span>
          )}
        </div>

        {/* Domains Selection */}
        <div className="form-group">
          <label className="form-label">
            Domains (Optional)
            <span className="field-info">
              ({criteriaOptions.domains.length} available)
            </span>
          </label>
          <select
            multiple
            value={criteria.domains}
            onChange={(e) => handleSelectChange('domains', e)}
            className="form-select"
            size={Math.min(4, criteriaOptions.domains.length)}
          >
            {criteriaOptions.domains.map((domain) => (
              <option key={domain.value} value={domain.value}>
                {domain.label} ({domain.count} questions)
              </option>
            ))}
          </select>
          <div className="field-help">
            Leave empty to include all domains
          </div>
        </div>

        {/* Subjects Selection */}
        <div className="form-group">
          <label className="form-label">
            Subjects (Optional)
            <span className="field-info">
              ({criteriaOptions.subjects.length} available)
            </span>
          </label>
          <select
            multiple
            value={criteria.subjects}
            onChange={(e) => handleSelectChange('subjects', e)}
            className="form-select"
            size={Math.min(5, criteriaOptions.subjects.length)}
          >
            {criteriaOptions.subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label} ({subject.count} questions)
              </option>
            ))}
          </select>
          <div className="field-help">
            Leave empty to include all subjects
          </div>
        </div>

        {/* Minimum Questions */}
        <div className="form-group">
          <label className="form-label">
            Minimum Questions
            <InformationCircleIcon 
              className="info-icon" 
              title="Minimum number of questions a quiz must have to be assigned to this batch"
            />
          </label>
          <select
            value={criteria.min_questions}
            onChange={(e) => setCriteria(prev => ({ ...prev, min_questions: parseInt(e.target.value) }))}
            className="form-select single"
          >
            {criteriaOptions.min_questions_options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formErrors.min_questions && (
            <span className="field-error">{formErrors.min_questions}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button 
          type="button"
          onClick={handlePreviewQuestions}
          className="preview-btn"
          disabled={loading || validation.matchingQuestions === 0}
        >
          <EyeIcon className="btn-icon" />
          Preview Questions ({validation.matchingQuestions})
        </button>
        
        <div className="main-actions">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button 
            type="button"
            onClick={handleSave} 
            className="save-btn"
            disabled={loading || !validation.isValid || validation.matchingQuestions === 0}
          >
            {loading ? 'Saving...' : 'Save Criteria'}
          </button>
        </div>
      </div>

      {/* Question Preview Modal */}
      {showPreview && preview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Question Preview</h3>
              <button 
                onClick={() => setShowPreview(false)} 
                className="close-btn"
                title="Close Preview"
              >
                <XMarkIcon className="close-icon" />
              </button>
            </div>
            
            <div className="preview-content">
              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-label">Total Matching:</span>
                  <span className="stat-value">{preview.total_matching}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Showing:</span>
                  <span className="stat-value">{preview.preview_count}</span>
                </div>
              </div>
              
              <div className="questions-list">
                {preview.questions.map((question, index) => (
                  <div key={question.id} className="question-preview-item">
                    <div className="question-header">
                      <span className="question-number">#{index + 1}</span>
                      <div className="question-meta">
                        <span className="question-source">{question.source}</span>
                        <span className="question-difficulty">{question.difficulty_level}</span>
                        <span className="question-type">{question.type}</span>
                      </div>
                    </div>
                    <div className="question-text">
                      {question.question_preview}
                    </div>
                    <div className="question-details">
                      <span><strong>Domain:</strong> {question.domain}</span>
                      <span><strong>Subject:</strong> {question.subject}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {preview.total_matching > preview.preview_count && (
                <div className="preview-footer">
                  <p>And {preview.total_matching - preview.preview_count} more questions...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchCriteriaForm;