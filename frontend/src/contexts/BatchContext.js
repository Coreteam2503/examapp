import React, { createContext, useContext, useReducer, useEffect } from 'react';
import BatchService from '../services/batchService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  batches: [],
  userBatches: [],
  currentBatch: null,
  loading: false,
  error: null,
  filters: {
    isActive: true,
    subject: '',
    domain: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  }
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BATCHES: 'SET_BATCHES',
  SET_USER_BATCHES: 'SET_USER_BATCHES',
  SET_CURRENT_BATCH: 'SET_CURRENT_BATCH',
  ADD_BATCH: 'ADD_BATCH',
  UPDATE_BATCH: 'UPDATE_BATCH',
  REMOVE_BATCH: 'REMOVE_BATCH',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function batchReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_BATCHES:
      return { ...state, batches: action.payload, loading: false, error: null };
    
    case ActionTypes.SET_USER_BATCHES:
      return { ...state, userBatches: action.payload, loading: false, error: null };
    
    case ActionTypes.SET_CURRENT_BATCH:
      return { ...state, currentBatch: action.payload, loading: false, error: null };
    
    case ActionTypes.ADD_BATCH:
      return { 
        ...state, 
        batches: [action.payload, ...state.batches],
        loading: false,
        error: null
      };
    
    case ActionTypes.UPDATE_BATCH:
      return {
        ...state,
        batches: state.batches.map(batch => 
          batch.id === action.payload.id ? action.payload : batch
        ),
        currentBatch: state.currentBatch?.id === action.payload.id ? action.payload : state.currentBatch,
        loading: false,
        error: null
      };
    
    case ActionTypes.REMOVE_BATCH:
      return {
        ...state,
        batches: state.batches.filter(batch => batch.id !== action.payload),
        currentBatch: state.currentBatch?.id === action.payload ? null : state.currentBatch,
        loading: false,
        error: null
      };
    
    case ActionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    default:
      return state;
  }
}

// Create context
const BatchContext = createContext();

// Provider component
export function BatchProvider({ children }) {
  const [state, dispatch] = useReducer(batchReducer, initialState);
  const { user } = useAuth();

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const setFilters = (newFilters) => {
    dispatch({ type: ActionTypes.SET_FILTERS, payload: newFilters });
  };

  // Fetch all batches
  const fetchBatches = async (customFilters = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const filters = { ...state.filters, ...customFilters };
      const result = await BatchService.getBatches(filters);
      
      dispatch({ type: ActionTypes.SET_BATCHES, payload: result.data || [] });
    } catch (error) {
      setError(error.message);
    }
  };

  // Fetch user's batches
  const fetchUserBatches = async (userId = null) => {
    try {
      setLoading(true);
      clearError();
      
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        throw new Error('User ID is required');
      }
      
      const result = await BatchService.getUserBatches(targetUserId);
      dispatch({ type: ActionTypes.SET_USER_BATCHES, payload: result.data || [] });
    } catch (error) {
      setError(error.message);
    }
  };

  // Fetch specific batch
  const fetchBatch = async (batchId) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await BatchService.getBatch(batchId);
      dispatch({ type: ActionTypes.SET_CURRENT_BATCH, payload: result.data });
    } catch (error) {
      setError(error.message);
    }
  };

  // Create batch
  const createBatch = async (batchData) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await BatchService.createBatch(batchData);
      dispatch({ type: ActionTypes.ADD_BATCH, payload: result.data });
      
      return result.data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update batch
  const updateBatch = async (batchId, batchData) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await BatchService.updateBatch(batchId, batchData);
      dispatch({ type: ActionTypes.UPDATE_BATCH, payload: result.data });
      
      return result.data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Delete batch
  const deleteBatch = async (batchId) => {
    try {
      setLoading(true);
      clearError();
      
      await BatchService.deleteBatch(batchId);
      dispatch({ type: ActionTypes.REMOVE_BATCH, payload: batchId });
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Assign user to batch
  const assignUserToBatch = async (batchId, userId) => {
    try {
      setLoading(true);
      clearError();
      
      await BatchService.assignUser(batchId, userId);
      
      // Refresh batches to get updated user counts
      await fetchBatches();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Remove user from batch
  const removeUserFromBatch = async (batchId, userId) => {
    try {
      setLoading(true);
      clearError();
      
      await BatchService.removeUser(batchId, userId);
      
      // Refresh batches to get updated user counts
      await fetchBatches();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update user batch assignments
  const updateUserBatches = async (userId, batchIds, action = 'assign') => {
    try {
      setLoading(true);
      clearError();
      
      const result = await BatchService.updateUserBatches(userId, batchIds, action);
      
      // Refresh user batches if updating current user
      if (userId === user?.id) {
        await fetchUserBatches();
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Get batch statistics
  const getBatchStatistics = async (batchId) => {
    try {
      setLoading(true);
      clearError();
      
      const result = await BatchService.getBatchStatistics(batchId);
      return result.data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Auto-fetch user batches when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserBatches();
    }
  }, [user?.id]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    fetchBatches,
    fetchUserBatches,
    fetchBatch,
    createBatch,
    updateBatch,
    deleteBatch,
    assignUserToBatch,
    removeUserFromBatch,
    updateUserBatches,
    getBatchStatistics,
    setFilters,
    clearError
  };

  return (
    <BatchContext.Provider value={value}>
      {children}
    </BatchContext.Provider>
  );
}

// Custom hook
export function useBatch() {
  const context = useContext(BatchContext);
  if (!context) {
    throw new Error('useBatch must be used within a BatchProvider');
  }
  return context;
}

export default BatchContext;
