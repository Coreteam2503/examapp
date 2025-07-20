import React, { useState, useEffect } from 'react';
import { useBatch } from '../../contexts/BatchContext';
import { useAuth } from '../../contexts/AuthContext';
import BatchService from '../../services/batchService';
import './AdminBatchManagement.css';

const AdminBatchManagement = () => {
  const { user } = useAuth();
  const {
    batches,
    loading,
    error,
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    clearError
  } = useBatch();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchUsers, setBatchUsers] = useState([]);
  const [batchQuestions, setBatchQuestions] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: 'General',
    domain: 'General',
    is_active: true
  });

  const [filters, setFilters] = useState({
    isActive: true,
    subject: '',
    domain: ''
  });

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'admin') {
      // Redirect or show error
      return;
    }
    fetchBatches();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingBatch) {
        await updateBatch(editingBatch.id, formData);
      } else {
        await createBatch(formData);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        subject: 'General',
        domain: 'General',
        is_active: true
      });
      setShowCreateForm(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  // Handle edit
  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      description: batch.description || '',
      subject: batch.subject,
      domain: batch.domain,
      is_active: batch.is_active
    });
    setShowCreateForm(true);
  };

  // Handle delete
  const handleDelete = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch? This will remove all user and question assignments.')) {
      try {
        await deleteBatch(batchId);
        if (selectedBatch?.id === batchId) {
          setSelectedBatch(null);
        }
      } catch (error) {
        console.error('Error deleting batch:', error);
      }
    }
  };

  // Handle batch selection for details
  const handleBatchSelect = async (batch) => {
    setSelectedBatch(batch);
    
    try {
      // Fetch batch details
      const [usersResult, questionsResult, statsResult] = await Promise.all([
        BatchService.getBatchUsers(batch.id),
        BatchService.getBatchQuestions(batch.id),
        BatchService.getBatchStatistics(batch.id)
      ]);
      
      setBatchUsers(usersResult.data || []);
      setBatchQuestions(questionsResult.data || []);
      setStatistics(statsResult.statistics);
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchBatches(newFilters);
  };

  // Handle user removal from batch
  const handleRemoveUser = async (userId) => {
    if (!selectedBatch) return;
    
    if (window.confirm('Remove this user from the batch?')) {
      try {
        await BatchService.removeUser(selectedBatch.id, userId);
        // Refresh batch details
        handleBatchSelect(selectedBatch);
      } catch (error) {
        console.error('Error removing user:', error);
      }
    }
  };

  // Handle question removal from batch
  const handleRemoveQuestion = async (questionId) => {
    if (!selectedBatch) return;
    
    if (window.confirm('Remove this question from the batch?')) {
      try {
        await BatchService.removeQuestion(selectedBatch.id, questionId);
        // Refresh batch details
        handleBatchSelect(selectedBatch);
      } catch (error) {
        console.error('Error removing question:', error);
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-batch-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-batch-management">
      <div className="header">
        <h1>Batch Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowCreateForm(true);
            setEditingBatch(null);
            setFormData({
              name: '',
              description: '',
              subject: 'General',
              domain: 'General',
              is_active: true
            });
          }}
        >
          Create New Batch
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={clearError}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>
            Status:
            <select name="isActive" value={filters.isActive} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            Subject:
            <input
              type="text"
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              placeholder="Filter by subject..."
            />
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            Domain:
            <input
              type="text"
              name="domain"
              value={filters.domain}
              onChange={handleFilterChange}
              placeholder="Filter by domain..."
            />
          </label>
        </div>
      </div>

      <div className="content">
        {/* Batch List */}
        <div className="batch-list">
          <h2>Batches ({batches.length})</h2>
          
          {loading ? (
            <div className="loading">Loading batches...</div>
          ) : (
            <div className="batch-grid">
              {batches.map(batch => (
                <div 
                  key={batch.id} 
                  className={`batch-card ${selectedBatch?.id === batch.id ? 'selected' : ''}`}
                  onClick={() => handleBatchSelect(batch)}
                >
                  <div className="batch-header">
                    <h3>{batch.name}</h3>
                    <div className="batch-actions">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(batch);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(batch.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="batch-info">
                    <p><strong>Subject:</strong> {batch.subject}</p>
                    <p><strong>Domain:</strong> {batch.domain}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${batch.is_active ? 'active' : 'inactive'}`}>
                        {batch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    {batch.description && (
                      <p><strong>Description:</strong> {batch.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Batch Details */}
        {selectedBatch && (
          <div className="batch-details">
            <h2>Batch Details: {selectedBatch.name}</h2>
            
            {statistics && (
              <div className="statistics">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{statistics.users.total}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{statistics.users.active}</div>
                    <div className="stat-label">Active Users</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{statistics.questions.total}</div>
                    <div className="stat-label">Questions</div>
                  </div>
                </div>
              </div>
            )}

            <div className="details-tabs">
              <div className="tab-content">
                <div className="users-section">
                  <h3>Users ({batchUsers.length})</h3>
                  <div className="users-list">
                    {batchUsers.map(user => (
                      <div key={user.id} className="user-item">
                        <div className="user-info">
                          <span className="user-email">{user.email}</span>
                          <span className="user-role">{user.role}</span>
                          <span className={`enrollment-status ${user.enrollment_active ? 'active' : 'inactive'}`}>
                            {user.enrollment_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="questions-section">
                  <h3>Questions ({batchQuestions.length})</h3>
                  <div className="questions-list">
                    {batchQuestions.slice(0, 10).map(question => (
                      <div key={question.id} className="question-item">
                        <div className="question-info">
                          <span className="question-text">
                            {question.question_text.substring(0, 100)}...
                          </span>
                          <span className="question-type">{question.type}</span>
                          <span className="question-difficulty">{question.difficulty_level}</span>
                        </div>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveQuestion(question.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {batchQuestions.length > 10 && (
                      <p>...and {batchQuestions.length - 10} more questions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingBatch(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="batch-form">
              <div className="form-group">
                <label htmlFor="name">Batch Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="domain">Domain</label>
                  <input
                    type="text"
                    id="domain"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Active Batch
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingBatch ? 'Update Batch' : 'Create Batch')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBatch(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBatchManagement;
