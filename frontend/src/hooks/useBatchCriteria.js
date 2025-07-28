import { useState, useEffect, useCallback } from 'react';
import BatchService from '../services/batchService';

/**
 * Custom hook for managing batch criteria functionality
 */
export const useBatchCriteria = () => {
  const [criteriaOptions, setCriteriaOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load criteria options on mount
  useEffect(() => {
    loadCriteriaOptions();
  }, []);

  const loadCriteriaOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await BatchService.getCriteriaOptions();
      if (response.success) {
        setCriteriaOptions(response.data);
      } else {
        throw new Error(response.message || 'Failed to load criteria options');
      }
    } catch (err) {
      console.error('Error loading criteria options:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCriteria = useCallback(async (criteria) => {
    try {
      setError(null);
      const response = await BatchService.validateCriteria(criteria);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to validate criteria');
      }
    } catch (err) {
      console.error('Error validating criteria:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const previewQuestions = useCallback(async (criteria, limit = 10) => {
    try {
      setError(null);
      const response = await BatchService.previewQuestions(criteria, limit);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to preview questions');
      }
    } catch (err) {
      console.error('Error previewing questions:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateBatchCriteria = useCallback(async (batchId, criteria) => {
    try {
      setError(null);
      const response = await BatchService.updateBatchCriteria(batchId, criteria);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update batch criteria');
      }
    } catch (err) {
      console.error('Error updating batch criteria:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const getBatchQuizzes = useCallback(async (batchId) => {
    try {
      setError(null);
      const response = await BatchService.getBatchQuizzes(batchId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get batch quizzes');
      }
    } catch (err) {
      console.error('Error getting batch quizzes:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    criteriaOptions,
    loading,
    error,
    loadCriteriaOptions,
    validateCriteria,
    previewQuestions,
    updateBatchCriteria,
    getBatchQuizzes,
    clearError: () => setError(null)
  };
};

/**
 * Utility functions for criteria management
 */

// Format options for select components
export const formatOptionsForSelect = (options, showCounts = true) => {
  if (!options || !Array.isArray(options)) return [];
  
  return options.map(option => ({
    value: option.value,
    label: showCounts 
      ? `${option.label} (${option.count})`
      : option.label,
    count: option.count,
    percentage: option.percentage,
    originalLabel: option.label
  }));
};

// Validate criteria form
export const validateCriteriaForm = (criteria) => {
  const errors = {};
  
  if (!criteria.sources || criteria.sources.length === 0) {
    errors.sources = 'At least one source must be selected';
  }
  
  if (!criteria.difficulty_levels || criteria.difficulty_levels.length === 0) {
    errors.difficulty_levels = 'At least one difficulty level must be selected';
  }
  
  if (criteria.min_questions && criteria.min_questions < 1) {
    errors.min_questions = 'Minimum questions must be at least 1';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Get criteria summary text
export const getCriteriaSummary = (criteria, criteriaOptions) => {
  if (!criteria || !criteriaOptions) return 'No criteria set';
  
  const parts = [];
  
  if (criteria.sources && criteria.sources.length > 0) {
    parts.push(`${criteria.sources.length} source${criteria.sources.length !== 1 ? 's' : ''}`);
  }
  
  if (criteria.difficulty_levels && criteria.difficulty_levels.length > 0) {
    parts.push(`${criteria.difficulty_levels.length} difficulty level${criteria.difficulty_levels.length !== 1 ? 's' : ''}`);
  }
  
  if (criteria.domains && criteria.domains.length > 0) {
    parts.push(`${criteria.domains.length} domain${criteria.domains.length !== 1 ? 's' : ''}`);
  }
  
  if (criteria.subjects && criteria.subjects.length > 0) {
    parts.push(`${criteria.subjects.length} subject${criteria.subjects.length !== 1 ? 's' : ''}`);
  }
  
  if (criteria.min_questions) {
    parts.push(`min ${criteria.min_questions} questions`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No criteria set';
};

export default useBatchCriteria;