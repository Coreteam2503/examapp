import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import BatchSelector from '../common/BatchSelector';
import QuizGeneratorForm from './QuizGeneratorForm';
import './QuizManagement.css';

const QuizManagement = () => {
  // State management
  const [quizzes, setQuizzes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [assigningBatches, setAssigningBatches] = useState([]);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showQuizPreview, setShowQuizPreview] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchQuizzes();
    fetchBatches();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quizzes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setQuizzes(data.quizzes || []);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setBatches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const assignQuizToBatches = async (quizId, batchIds) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/assign-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ batchIds })
      });

      if (response.ok) {
        // Refresh quiz data
        fetchQuizzes();
        setShowBatchAssignModal(false);
        setSelectedQuiz(null);
        setAssigningBatches([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to assign quiz to batches');
      }
    } catch (error) {
      console.error('Error assigning quiz to batches:', error);
      setError('Failed to assign quiz to batches');
    }
  };

  const removeQuizFromBatch = async (quizId, batchId) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/remove-batch/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        fetchQuizzes();
      } else {
        setError('Failed to remove quiz from batch');
      }
    } catch (error) {
      console.error('Error removing quiz from batch:', error);
      setError('Failed to remove quiz from batch');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          fetchQuizzes();
        } else {
          setError('Failed to delete quiz');
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        setError('Failed to delete quiz');
      }
    }
  };

  const handleAssignBatches = () => {
    if (selectedQuiz && assigningBatches.length > 0) {
      const batchIds = assigningBatches.map(batch => batch.value || batch.id);
      assignQuizToBatches(selectedQuiz.id, batchIds);
    }
  };

  const openBatchAssignModal = (quiz) => {
    setSelectedQuiz(quiz);
    setAssigningBatches([]);
    setShowBatchAssignModal(true);
  };

  // NEW: Handler functions for criteria-based quiz management
  const handleCreateQuiz = (quizData) => {
    console.log('Quiz created successfully:', quizData);
    setShowCreateQuizModal(false);
    fetchQuizzes(); // Refresh the quiz list
  };

  const handleCancelCreateQuiz = () => {
    setShowCreateQuizModal(false);
  };

  const handlePreviewQuiz = async (quiz) => {
    try {
      // For criteria-based quizzes, fetch preview questions
      if (quiz.is_criteria_based || (quiz.criteria && Object.keys(quiz.criteria).length > 0)) {
        const response = await fetch('/api/quizzes/preview-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            ...quiz.criteria,
            limit: 5
          })
        });

        if (response.ok) {
          const data = await response.json();
          setPreviewQuiz({
            ...quiz,
            preview: data.data
          });
        } else {
          setPreviewQuiz({ ...quiz, preview: null });
        }
      } else {
        // For traditional quizzes, just show the quiz info
        setPreviewQuiz({ ...quiz, preview: null });
      }
      
      setShowQuizPreview(true);
    } catch (error) {
      console.error('Error loading quiz preview:', error);
      setPreviewQuiz({ ...quiz, preview: null });
      setShowQuizPreview(true);
    }
  };

  const getCriteriaSummary = (criteria) => {
    if (!criteria || Object.keys(criteria).length === 0) {
      return 'Any available questions';
    }
    const parts = [];
    if (criteria.domain) parts.push(`Domain: ${criteria.domain}`);
    if (criteria.subject) parts.push(`Subject: ${criteria.subject}`);
    if (criteria.source) parts.push(`Source: ${criteria.source}`);
    if (criteria.difficulty_level) parts.push(`Difficulty: ${criteria.difficulty_level}`);
    return parts.length > 0 ? parts.join(', ') : 'Dynamic selection';
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.game_format?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameFormatDisplay = (format) => {
    const formatMap = {
      'traditional': '📝 Traditional',
      'hangman': '🎯 Hangman',
      'knowledge_tower': '🏗️ Knowledge Tower',
      'word_ladder': '🪜 Word Ladder',
      'memory_grid': '🧩 Memory Grid'
    };
    return formatMap[format] || '📝 Traditional';
  };

  if (loading) {
    return (
      <div className="quiz-management loading">
        <div className="loading-spinner">Loading quiz management...</div>
      </div>
    );
  }

  return (
    <div className="quiz-management">
      <div className="section-header">
        <h1>Quiz Management</h1>
        <p>Manage quizzes and assign them to learning batches</p>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="controls-header">
          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="create-quiz-btn"
          >
            <PlusIcon className="icon" />
            Generate Quiz
          </button>
        </div>
        
        <div className="search-controls">
          <div className="search-input-wrapper">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search quizzes by title, file, or game format..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="stats-summary">
            <span className="stat-item">
              <AcademicCapIcon className="stat-icon" />
              {quizzes.length} Total Quizzes
            </span>
            <span className="stat-item">
              <UserGroupIcon className="stat-icon" />
              {batches.length} Available Batches
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Quizzes Grid */}
      <div className="quizzes-grid">
        {filteredQuizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No quizzes found</h3>
            <p>
              {searchTerm 
                ? 'No quizzes match your search criteria' 
                : 'No quizzes have been created yet'
              }
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <div className="quiz-info">
                  <h3>{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span className="quiz-format">{getGameFormatDisplay(quiz.game_format)}</span>
                    <span className="quiz-difficulty">{quiz.difficulty || 'Medium'}</span>
                  </div>
                  {quiz.filename && (
                    <p className="quiz-source">Source: {quiz.filename}</p>
                  )}
                </div>
                <div className="quiz-status">
                  <span className="creation-date">
                    <ClockIcon className="date-icon" />
                    {formatDate(quiz.created_at)}
                  </span>
                </div>
              </div>

              <div className="quiz-stats">
                <div className="stat-item">
                  <AcademicCapIcon className="stat-icon" />
                  <span className="stat-value">{quiz.total_questions || 0}</span>
                  <span className="stat-label">Questions</span>
                </div>
                <div className="stat-item">
                  <UserGroupIcon className="stat-icon" />
                  <span className="stat-value">{quiz.assigned_batches?.length || 0}</span>
                  <span className="stat-label">Batches</span>
                </div>
                <div className="stat-item">
                  <ChartBarIcon className="stat-icon" />
                  <span className="stat-value">{quiz.attempts_count || 0}</span>
                  <span className="stat-label">Attempts</span>
                </div>
              </div>

              {/* Assigned Batches */}
              {quiz.assigned_batches && quiz.assigned_batches.length > 0 && (
                <div className="assigned-batches">
                  <span className="batches-label">Assigned to:</span>
                  <div className="batches-list">
                    {quiz.assigned_batches.map((batch) => (
                      <span key={batch.id} className="batch-tag">
                        {batch.name}
                        <button
                          onClick={() => removeQuizFromBatch(quiz.id, batch.id)}
                          className="remove-batch-btn"
                          title="Remove from batch"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="quiz-actions">
                <button
                  onClick={() => handlePreviewQuiz(quiz)}
                  className="action-btn preview-btn"
                  title="Preview quiz content"
                >
                  <EyeIcon className="action-icon" />
                  {(quiz.is_criteria_based || (quiz.criteria && Object.keys(quiz.criteria).length > 0)) ? 'Preview Questions' : 'View Details'}
                </button>
                
                <button 
                  className="action-btn assign"
                  onClick={() => openBatchAssignModal(quiz)}
                  title="Assign to Batches"
                >
                  <UserGroupIcon className="action-icon" />
                  Assign to Batches
                </button>
                
                <button 
                  className="action-btn delete"
                  onClick={() => deleteQuiz(quiz.id)}
                  title="Delete Quiz"
                >
                  <TrashIcon className="action-icon" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Batch Assignment Modal */}
      {showBatchAssignModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowBatchAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Quiz to Batches</h2>
              <button onClick={() => setShowBatchAssignModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="quiz-info-summary">
                <h3>{selectedQuiz.title}</h3>
                <p>{getGameFormatDisplay(selectedQuiz.game_format)} • {selectedQuiz.total_questions} questions</p>
              </div>

              <div className="batch-selector-section">
                <label>Select Batches:</label>
                <BatchSelector
                  batches={batches.map(batch => ({
                    value: batch.id,
                    label: batch.name,
                    description: `${batch.subject || 'No subject'} - ${batch.domain || 'No domain'}`
                  }))}
                  selectedBatches={assigningBatches}
                  onChange={setAssigningBatches}
                  mode="multi"
                  placeholder="Select batches to assign this quiz..."
                  searchable={true}
                  clearable={true}
                  className="quiz-batch-selector"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowBatchAssignModal(false)} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssignBatches}
                  disabled={assigningBatches.length === 0}
                  className="submit-btn"
                >
                  Assign to {assigningBatches.length} Batch{assigningBatches.length !== 1 ? 'es' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Creation Modal */}
      {showCreateQuizModal && (
        <div className="modal-overlay" onClick={() => setShowCreateQuizModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generate New Quiz</h2>
              <button onClick={() => setShowCreateQuizModal(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-body">
              <QuizGeneratorForm
                onSave={handleCreateQuiz}
                onCancel={handleCancelCreateQuiz}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quiz Preview Modal */}
      {showQuizPreview && previewQuiz && (
        <div className="modal-overlay" onClick={() => setShowQuizPreview(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quiz Preview: {previewQuiz.title}</h2>
              <button onClick={() => setShowQuizPreview(false)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="quiz-preview-content">
                {/* Quiz Basic Info */}
                <div className="quiz-preview-info">
                  <div className="preview-section">
                    <h3>Quiz Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Type:</span>
                        <span className="value">
                          {previewQuiz.is_criteria_based || (previewQuiz.criteria && Object.keys(previewQuiz.criteria).length > 0) 
                            ? '🎯 Criteria-Based' 
                            : '📝 Traditional'
                          }
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Game Format:</span>
                        <span className="value">{getGameFormatDisplay(previewQuiz.game_format)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Difficulty:</span>
                        <span className="value">{previewQuiz.difficulty || 'Medium'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Questions:</span>
                        <span className="value">
                          {previewQuiz.question_count || previewQuiz.total_questions || 0}
                          {(previewQuiz.is_criteria_based || (previewQuiz.criteria && Object.keys(previewQuiz.criteria).length > 0)) 
                            ? ' (Dynamic)' 
                            : ' (Fixed)'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Information for Criteria-Based Quizzes */}
                  {(previewQuiz.is_criteria_based || (previewQuiz.criteria && Object.keys(previewQuiz.criteria).length > 0)) && (
                    <div className="preview-section">
                      <h3>Selection Criteria</h3>
                      <div className="criteria-display">
                        <p>{getCriteriaSummary(previewQuiz.criteria)}</p>
                        {previewQuiz.preview && (
                          <p className="available-questions">
                            {previewQuiz.preview.total_matching} questions match these criteria
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Preview for Criteria-Based Quizzes */}
                {previewQuiz.preview && previewQuiz.preview.sample_questions && (
                  <div className="preview-section">
                    <h3>Sample Questions ({previewQuiz.preview.sample_questions.length} of {previewQuiz.preview.total_matching})</h3>
                    <div className="sample-questions">
                      {previewQuiz.preview.sample_questions.map((question, index) => (
                        <div key={question.id} className="sample-question">
                          <div className="question-header">
                            <span className="question-number">#{index + 1}</span>
                            <span className="question-type">{question.type.replace('_', ' ')}</span>
                            <span className="question-difficulty">{question.difficulty_level}</span>
                          </div>
                          <div className="question-text">{question.question_text}</div>
                          <div className="question-meta">
                            <span>{question.domain}</span>
                            {question.subject && <span> • {question.subject}</span>}
                            {question.source && <span> • {question.source}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {previewQuiz.preview.has_more && (
                      <p className="preview-note">
                        And {previewQuiz.preview.total_matching - previewQuiz.preview.sample_questions.length} more questions available...
                      </p>
                    )}
                  </div>
                )}

                {/* Traditional Quiz Info */}
                {!(previewQuiz.is_criteria_based || (previewQuiz.criteria && Object.keys(previewQuiz.criteria).length > 0)) && (
                  <div className="preview-section">
                    <h3>Traditional Quiz</h3>
                    <p>This quiz has a fixed set of {previewQuiz.total_questions || 0} questions.</p>
                    {previewQuiz.filename && (
                      <p>Source file: <strong>{previewQuiz.filename}</strong></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;