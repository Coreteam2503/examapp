import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { getCriteriaSummary } from '../../hooks/useBatchCriteria';
import './BatchCard.css';

const BatchCard = ({ 
  batch, 
  onEdit, 
  onSetCriteria, 
  onDelete,
  criteriaOptions 
}) => {
  const hasCriteria = batch.quiz_criteria && 
    (typeof batch.quiz_criteria === 'string' ? 
      batch.quiz_criteria !== '{}' : 
      Object.keys(batch.quiz_criteria).length > 0);

  const criteriaSummary = hasCriteria ? 
    getCriteriaSummary(
      typeof batch.quiz_criteria === 'string' ? 
        JSON.parse(batch.quiz_criteria) : 
        batch.quiz_criteria, 
      criteriaOptions
    ) : 'No criteria set';

  return (
    <div className={`batch-card ${hasCriteria ? 'has-criteria' : ''}`}>
      <div className="batch-card-header">
        <div className="batch-info">
          <h3>{batch.name}</h3>
          <div className="batch-meta">
            {batch.subject && <span className="batch-subject">{batch.subject}</span>}
            {batch.domain && <span className="batch-domain">{batch.domain}</span>}
          </div>
          {batch.description && (
            <p className="batch-description">{batch.description}</p>
          )}
          
          {/* Criteria Status */}
          <div className={`criteria-indicator ${hasCriteria ? 'active' : 'none'}`}>
            ⚙️ {criteriaSummary}
          </div>
        </div>
        <div className="batch-status">
          <span className={`status-badge ${batch.is_active ? 'active' : 'inactive'}`}>
            {batch.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="batch-stats">
        <div className="stat-item">
          <UserGroupIcon className="stat-icon" />
          <span className="stat-value">{batch.user_count || 0}</span>
          <span className="stat-label">Students</span>
        </div>
      </div>

      <div className="batch-actions">
        <button 
          className="action-btn edit"
          onClick={() => onEdit(batch)}
          title="Edit Batch"
        >
          <PencilIcon className="action-icon" />
          Edit
        </button>
        <button 
          className="action-btn criteria"
          onClick={() => onSetCriteria(batch)}
          title="Set Quiz Criteria"
        >
          <Cog6ToothIcon className="action-icon" />
          Criteria
        </button>
        <button 
          className="action-btn delete"
          onClick={() => onDelete(batch.id)}
          title="Delete Batch"
        >
          <TrashIcon className="action-icon" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BatchCard;