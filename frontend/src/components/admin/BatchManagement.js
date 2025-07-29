import React, { useState, useEffect } from 'react';
import { useBatch } from '../../contexts/BatchContext';
import { useBatchCriteria } from '../../hooks/useBatchCriteria';
import BatchCard from './BatchCard';
import BatchFormModal from './BatchFormModal';
import BatchCriteriaModal from './BatchCriteriaModal';
import { 
  PlusIcon, 
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
    deleteBatch
  } = useBatch();

  const { criteriaOptions } = useBatchCriteria();

  // Component state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  
  // Form state
  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    subject: '',
    domain: '',
    is_active: true
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setBatchForm({ 
      name: '', 
      description: '', 
      subject: '', 
      domain: '', 
      is_active: true 
    });
    setSelectedBatch(null);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await createBatch(batchForm);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating batch:', error);
    }
  };

  const handleEditBatch = async (e) => {
    e.preventDefault();
    try {
      await updateBatch(selectedBatch.id, batchForm);
      setShowEditModal(false);
      resetForm();
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

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
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

  const openCriteriaModal = (batch) => {
    setSelectedBatch(batch);
    setShowCriteriaModal(true);
  };

  const handleCriteriaSave = (criteria) => {
    // Refresh batches to show updated criteria
    fetchBatches();
  };

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
        <p>Create and manage learning batches and set quiz criteria</p>
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
            onClick={openCreateModal}
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
              onClick={openCreateModal}
              className="create-first-btn"
            >
              Create First Batch
            </button>
          </div>
        ) : (
          filteredBatches.map(batch => (
            <BatchCard
              key={batch.id}
              batch={batch}
              criteriaOptions={criteriaOptions}
              onEdit={openEditModal}
              onSetCriteria={openCriteriaModal}
              onDelete={handleDeleteBatch}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <BatchFormModal
        isOpen={showCreateModal}
        mode="create"
        batchForm={batchForm}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBatch}
        onChange={setBatchForm}
      />

      <BatchFormModal
        isOpen={showEditModal}
        mode="edit"
        batch={selectedBatch}
        batchForm={batchForm}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditBatch}
        onChange={setBatchForm}
      />

      <BatchCriteriaModal
        isOpen={showCriteriaModal}
        batch={selectedBatch}
        onClose={() => setShowCriteriaModal(false)}
        onSave={handleCriteriaSave}
      />
    </div>
  );
};

export default BatchManagement;