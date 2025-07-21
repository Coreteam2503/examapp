import React, { useState, useEffect } from 'react';
import { useBatch } from '../../contexts/BatchContext';
import BatchSelector from '../common/BatchSelector';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import './BatchManagement.css';

const BatchManagement = () => {
  const { 
    batches, 
    loading, 
    error, 
    fetchBatches, 
    createBatch, 
    updateBatch, 
    deleteBatch,
    assignUserToBatch,
    removeUserFromBatch,
    bulkAssignQuestions,
    getBatchStatistics
  } = useBatch();

  // Component state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserAssignModal, setShowUserAssignModal] = useState(false);
  
  // Form state
  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    subject: '',
    domain: '',
    is_active: true
  });

  // Stats and users data
  const [batchStats, setBatchStats] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data.students);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await createBatch(batchForm);
      setShowCreateModal(false);
      setBatchForm({ name: '', description: '', subject: '', domain: '', is_active: true });
    } catch (error) {
      console.error('Error creating batch:', error);
    }
  };

  const handleEditBatch = async (e) => {
    e.preventDefault();
    try {
      await updateBatch(selectedBatch.id, batchForm);
      setShowEditModal(false);
      setSelectedBatch(null);
      setBatchForm({ name: '', description: '', subject: '', domain: '', is_active: true });
    } catch (error) {
      console.error('Error updating batch:', error);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      try {
        await deleteBatch(batchId);
      } catch (error) {
        console.error('Error deleting batch:', error);
      }
    }
  };

  const openEditModal = (batch) => {
    setSelectedBatch(batch);
    setBatchForm({
      name: batch.name,
      description: batch.description || '',
      subject: batch.subject || '',
      domain: batch.domain || '',
      is_active: batch.is_active
    });
    setShowEditModal(true);
  };

  const loadBatchStats = async (batchId) => {
    try {
      const stats = await getBatchStatistics(batchId);
      setBatchStats(prev => ({ ...prev, [batchId]: stats }));
    } catch (error) {
      console.error('Error loading batch stats:', error);
    }
  };

  const renderBatchCard = (batch) => (
    <div key={batch.id} className="batch-card">
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
          onClick={() => openEditModal(batch)}
          title="Edit Batch"
        >
          <PencilIcon className="action-icon" />
          Edit
        </button>
        <button 
          className="action-btn assign"
          onClick={() => {
            setSelectedBatch(batch);
            setShowUserAssignModal(true);
          }}
          title="Assign Users"
        >
          <UserGroupIcon className="action-icon" />
          Users
        </button>
        <button 
          className="action-btn delete"
          onClick={() => handleDeleteBatch(batch.id)}
          title="Delete Batch"
        >
          <TrashIcon className="action-icon" />
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="batch-management loading">
        <div className="loading-spinner">Loading batch management...</div>
      </div>
    );
  }

  return (
    <div className="batch-management">
      <div className="section-header">
        <h1>Batch Management</h1>
        <p>Create and manage learning batches, assign students and questions</p>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input-wrapper">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search batches by name, subject, or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="create-btn"
          >
            <PlusIcon className="btn-icon" />
            Create Batch
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      )}

      {/* Batches Grid */}
      <div className="batches-grid">
        {filteredBatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No batches found</h3>
            <p>
              {searchTerm 
                ? 'No batches match your search criteria' 
                : 'Create your first batch to get started'
              }
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="create-first-btn"
            >
              Create First Batch
            </button>
          </div>
        ) : (
          filteredBatches.map(renderBatchCard)
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Batch</h2>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">✕</button>
            </div>
            <form onSubmit={handleCreateBatch} className="batch-form">
              <div className="form-group">
                <label>Batch Name *</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                  required
                  placeholder="e.g., JavaScript Fundamentals Batch 1"
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={batchForm.subject}
                  onChange={(e) => setBatchForm({...batchForm, subject: e.target.value})}
                  placeholder="e.g., JavaScript, Python, Mathematics"
                />
              </div>
              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  value={batchForm.domain}
                  onChange={(e) => setBatchForm({...batchForm, domain: e.target.value})}
                  placeholder="e.g., Programming, Science, Engineering"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  placeholder="Brief description of this batch..."
                  rows="3"
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={batchForm.is_active}
                    onChange={(e) => setBatchForm({...batchForm, is_active: e.target.checked})}
                  />
                  <span>Active (students can access this batch)</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Batch</h2>
              <button onClick={() => setShowEditModal(false)} className="close-btn">✕</button>
            </div>
            <form onSubmit={handleEditBatch} className="batch-form">
              <div className="form-group">
                <label>Batch Name *</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({...batchForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={batchForm.subject}
                  onChange={(e) => setBatchForm({...batchForm, subject: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  value={batchForm.domain}
                  onChange={(e) => setBatchForm({...batchForm, domain: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({...batchForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={batchForm.is_active}
                    onChange={(e) => setBatchForm({...batchForm, is_active: e.target.checked})}
                  />
                  <span>Active (students can access this batch)</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional modals for user and question assignment would go here */}
    </div>
  );
};

export default BatchManagement;