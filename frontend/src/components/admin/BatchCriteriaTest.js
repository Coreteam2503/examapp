import React from 'react';
import { useBatchCriteria } from '../../hooks/useBatchCriteria';
import BatchCriteriaForm from './BatchCriteriaForm';

/**
 * Test component for batch criteria functionality
 * Can be used for testing and demonstration purposes
 */
const BatchCriteriaTest = () => {
  const { criteriaOptions, loading, error } = useBatchCriteria();

  const handleCriteriaSave = (criteria) => {
    console.log('🎯 Criteria saved:', criteria);
    alert(`Criteria saved with ${criteria.sources?.length || 0} sources and ${criteria.difficulty_levels?.length || 0} difficulty levels`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Batch Criteria Test Component</h2>
      
      {loading && <p>Loading criteria options...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {criteriaOptions && (
        <div>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
            <h3>Available Options Summary:</h3>
            <ul>
              <li><strong>Sources:</strong> {criteriaOptions.sources.length} available</li>
              <li><strong>Difficulty Levels:</strong> {criteriaOptions.difficulty_levels.length} available</li>
              <li><strong>Domains:</strong> {criteriaOptions.domains.length} available</li>
              <li><strong>Subjects:</strong> {criteriaOptions.subjects.length} available</li>
              <li><strong>Total Questions:</strong> {criteriaOptions.summary.total_questions}</li>
            </ul>
          </div>
          
          <BatchCriteriaForm
            onSave={handleCriteriaSave}
            onCancel={() => console.log('Cancelled')}
          />
        </div>
      )}
    </div>
  );
};

export default BatchCriteriaTest;