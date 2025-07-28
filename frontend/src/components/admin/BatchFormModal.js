import React from 'react';
import BatchCriteriaForm from './BatchCriteriaForm';
import { XMarkIcon } from '@heroicons/react/24/outline';
import './BatchFormModal.css';

const BatchFormModal = ({ 
  isOpen,
  mode, // 'create' or 'edit'
  batch,
  batchForm,
  onClose,
  onSubmit,
  onChange
}) => {
  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Batch' : 'Create New Batch';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content batch-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-btn">
            <XMarkIcon className="close-icon" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="batch-form">
          <div className="form-content">
            <div className="form-group">
              <label>Batch Name *</label>
              <input
                type="text"
                value={batchForm.name}
                onChange={(e) => onChange({...batchForm, name: e.target.value})}
                required
                placeholder="e.g., JavaScript Fundamentals Batch 1"
              />
            </div>
            
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={batchForm.subject}
                onChange={(e) => onChange({...batchForm, subject: e.target.value})}
                placeholder="e.g., JavaScript, Python, Mathematics"
              />
            </div>
            
            <div className="form-group">
              <label>Domain</label>
              <input
                type="text"
                value={batchForm.domain}
                onChange={(e) => onChange({...batchForm, domain: e.target.value})}
                placeholder="e.g., Programming, Science, Engineering"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={batchForm.description}
                onChange={(e) => onChange({...batchForm, description: e.target.value})}
                placeholder="Brief description of this batch..."
                rows="3"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={batchForm.is_active}
                  onChange={(e) => onChange({...batchForm, is_active: e.target.checked})}
                />
                <span>Active (students can access this batch)</span>
              </label>
            </div>
            
            {/* Quiz Criteria Section - Only for create mode */}
            {!isEdit && (
              <div className="form-section">
                <h4>Quiz Assignment Criteria (Optional)</h4>
                <p className="section-description">
                  Set criteria to automatically assign quizzes to this batch. You can also set this later.
                </p>
                <BatchCriteriaForm 
                  showTitle={false}
                  className="inline-criteria"
                  onSave={(criteria) => {
                    onChange(prev => ({ ...prev, quiz_criteria: criteria }));
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEdit ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchFormModal;