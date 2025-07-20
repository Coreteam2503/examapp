import React, { useState, useEffect } from 'react';
import { useBatch } from '../../contexts/BatchContext';
import { useAuth } from '../../contexts/AuthContext';
import './StudentBatchSelection.css';

const StudentBatchSelection = () => {
  const { user } = useAuth();
  const { userBatches, loading, error, fetchUserBatches, clearError } = useBatch();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserBatches();
    }
  }, [user?.id]);

  const handleBatchSelect = async (batch) => {
    setSelectedBatch(batch);
    
    // For now, we'll just show the basic batch info
    // In a full implementation, you might fetch additional details
    setBatchDetails({
      ...batch,
      // Add any additional details you want to show
    });
  };

  if (loading) {
    return (
      <div className="student-batch-selection">
        <div className="loading">Loading your batches...</div>
      </div>
    );
  }

  return (
    <div className="student-batch-selection">
      <div className="header">
        <h1>My Batches</h1>
        <p>View the batches you're enrolled in and their details.</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <div className="content">
        {/* Batch List */}
        <div className="batch-list">
          <h2>Your Enrolled Batches ({userBatches.length})</h2>
          
          {userBatches.length === 0 ? (
            <div className="no-batches">
              <div className="no-batches-icon">📚</div>
              <h3>No Batches Assigned</h3>
              <p>You haven't been assigned to any batches yet. Contact your administrator to get enrolled in a batch.</p>
            </div>
          ) : (
            <div className="batch-grid">
              {userBatches.map(batch => (
                <div 
                  key={batch.id} 
                  className={`batch-card ${selectedBatch?.id === batch.id ? 'selected' : ''}`}
                  onClick={() => handleBatchSelect(batch)}
                >
                  <div className="batch-header">
                    <h3>{batch.name}</h3>
                    <span className={`status ${batch.enrollment_active ? 'active' : 'inactive'}`}>
                      {batch.enrollment_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="batch-info">
                    <div className="info-item">
                      <span className="label">Subject:</span>
                      <span className="value">{batch.subject}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Domain:</span>
                      <span className="value">{batch.domain}</span>
                    </div>
                    {batch.description && (
                      <div className="info-item">
                        <span className="label">Description:</span>
                        <span className="value">{batch.description}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">Enrolled:</span>
                      <span className="value">
                        {new Date(batch.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="batch-footer">
                    <span className="select-hint">Click to view details</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Batch Details */}
        {selectedBatch && batchDetails && (
          <div className="batch-details">
            <div className="details-header">
              <h2>{batchDetails.name}</h2>
              <span className={`status-badge ${batchDetails.enrollment_active ? 'active' : 'inactive'}`}>
                {batchDetails.enrollment_active ? 'Active Enrollment' : 'Inactive Enrollment'}
              </span>
            </div>

            <div className="details-content">
              <div className="detail-section">
                <h3>Batch Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Subject</span>
                    <span className="detail-value">{batchDetails.subject}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Domain</span>
                    <span className="detail-value">{batchDetails.domain}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`status ${batchDetails.is_active ? 'active' : 'inactive'}`}>
                        {batchDetails.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Enrolled Date</span>
                    <span className="detail-value">
                      {new Date(batchDetails.enrolled_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {batchDetails.description && (
                <div className="detail-section">
                  <h3>Description</h3>
                  <p className="description-text">{batchDetails.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="btn btn-primary">
                    📝 Take Quiz from this Batch
                  </button>
                  <button className="btn btn-secondary">
                    📊 View Progress
                  </button>
                  <button className="btn btn-secondary">
                    📚 Browse Questions
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h3>Enrollment Details</h3>
                <div className="enrollment-info">
                  <div className="enrollment-item">
                    <span className="enrollment-label">Enrollment Status:</span>
                    <span className={`enrollment-value ${batchDetails.enrollment_active ? 'active' : 'inactive'}`}>
                      {batchDetails.enrollment_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                  <div className="enrollment-item">
                    <span className="enrollment-label">Enrolled Since:</span>
                    <span className="enrollment-value">
                      {(() => {
                        const enrolledDate = new Date(batchDetails.enrolled_at);
                        const now = new Date();
                        const diffTime = Math.abs(now - enrolledDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays === 1) return '1 day';
                        if (diffDays < 30) return `${diffDays} days`;
                        if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
                        return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Details */}
        {!selectedBatch && userBatches.length > 0 && (
          <div className="no-selection">
            <div className="no-selection-icon">👆</div>
            <h3>Select a Batch</h3>
            <p>Click on any batch from the list to view its details and available actions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBatchSelection;
