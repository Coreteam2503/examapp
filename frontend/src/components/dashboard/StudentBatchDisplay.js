import React, { useState, useEffect } from 'react';
import { useBatch } from '../../contexts/BatchContext';
import { useAuth } from '../../contexts/AuthContext';
import './StudentBatchDisplay.css';

const StudentBatchDisplay = () => {
  const { user } = useAuth();
  const { userBatches, loading, error, fetchUserBatches } = useBatch();
  const [expandedBatch, setExpandedBatch] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserBatches();
    }
  }, [user?.id]);

  const toggleBatchExpansion = (batchId) => {
    setExpandedBatch(expandedBatch === batchId ? null : batchId);
  };

  if (loading) {
    return (
      <div className="student-batch-display">
        <h3>My Batches</h3>
        <div className="loading">Loading your batches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-batch-display">
        <h3>My Batches</h3>
        <div className="error">Error loading batches: {error}</div>
      </div>
    );
  }

  return (
    <div className="student-batch-display">
      <div className="batch-header">
        <h3>My Batches</h3>
        <span className="batch-count">{userBatches.length} enrolled</span>
      </div>

      {userBatches.length === 0 ? (
        <div className="no-batches">
          <div className="no-batches-icon">📚</div>
          <p>No batches assigned yet</p>
          <span className="no-batches-hint">Contact your instructor to get enrolled</span>
        </div>
      ) : (
        <div className="batch-list">
          {userBatches.map(batch => (
            <div 
              key={batch.id} 
              className={`batch-item ${expandedBatch === batch.id ? 'expanded' : ''}`}
            >
              <div 
                className="batch-summary"
                onClick={() => toggleBatchExpansion(batch.id)}
              >
                <div className="batch-main-info">
                  <h4>{batch.name}</h4>
                  <div className="batch-meta">
                    <span className="batch-subject">{batch.subject}</span>
                    <span className="batch-domain">{batch.domain}</span>
                  </div>
                </div>
                <div className="batch-status">
                  <span className={`status-indicator ${batch.enrollment_active ? 'active' : 'inactive'}`}>
                    {batch.enrollment_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="expand-button">
                    {expandedBatch === batch.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {expandedBatch === batch.id && (
                <div className="batch-details">
                  <div className="batch-info-grid">
                    <div className="info-item">
                      <span className="info-label">Enrolled</span>
                      <span className="info-value">
                        {new Date(batch.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Status</span>
                      <span className="info-value">
                        {batch.enrollment_active ? 'Active Enrollment' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {batch.description && (
                    <div className="batch-description">
                      <span className="description-label">Description:</span>
                      <p>{batch.description}</p>
                    </div>
                  )}

                  <div className="batch-actions">
                    <button className="action-btn primary">
                      📝 Take Quiz
                    </button>
                    <button className="action-btn secondary">
                      📊 View Progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBatchDisplay;
