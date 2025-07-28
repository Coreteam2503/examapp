import React from 'react';
import BatchCriteriaForm from './BatchCriteriaForm';
import { XMarkIcon } from '@heroicons/react/24/outline';
import './BatchCriteriaModal.css';

const BatchCriteriaModal = ({ 
  batch, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  if (!isOpen || !batch) return null;

  const handleSave = (criteria) => {
    console.log('Criteria saved for batch:', batch.id, criteria);
    onSave(criteria);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content criteria-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h2>Set Quiz Criteria</h2>
            <p className="batch-name">{batch.name}</p>
          </div>
          <button onClick={onClose} className="close-btn" title="Close">
            <XMarkIcon className="close-icon" />
          </button>
        </div>
        
        <div className="modal-body">
          <BatchCriteriaForm 
            batch={batch}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default BatchCriteriaModal;