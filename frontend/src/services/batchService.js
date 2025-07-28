import api from './apiService';

class BatchService {
  // Get all batches
  static async getBatches(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive);
      }
      if (filters.createdBy) {
        params.append('createdBy', filters.createdBy);
      }
      if (filters.subject) {
        params.append('subject', filters.subject);
      }
      if (filters.domain) {
        params.append('domain', filters.domain);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/batches?${queryString}` : '/batches';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching batches:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batches');
    }
  }

  // Get specific batch by ID
  static async getBatch(batchId) {
    try {
      const response = await api.get(`/batches/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batch');
    }
  }

  // Create new batch
  static async createBatch(batchData) {
    try {
      const response = await api.post('/batches', batchData);
      return response.data;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to create batch');
    }
  }

  // Update batch
  static async updateBatch(batchId, batchData) {
    try {
      const response = await api.put(`/batches/${batchId}`, batchData);
      return response.data;
    } catch (error) {
      console.error('Error updating batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to update batch');
    }
  }

  // Delete batch
  static async deleteBatch(batchId) {
    try {
      const response = await api.delete(`/batches/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete batch');
    }
  }

  // Get users in batch
  static async getBatchUsers(batchId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/batches/${batchId}/users?${queryString}` : `/batches/${batchId}/users`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batch users');
    }
  }

  // Get questions in batch
  static async getBatchQuestions(batchId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.difficulty_level) {
        params.append('difficulty_level', filters.difficulty_level);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/batches/${batchId}/questions?${queryString}` : `/batches/${batchId}/questions`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch questions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batch questions');
    }
  }

  // Assign user to batch
  static async assignUser(batchId, userId) {
    try {
      const response = await api.post(`/batches/${batchId}/users`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error assigning user to batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign user to batch');
    }
  }

  // Remove user from batch
  static async removeUser(batchId, userId) {
    try {
      const response = await api.delete(`/batches/${batchId}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing user from batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove user from batch');
    }
  }

  // Get batch statistics
  static async getBatchStatistics(batchId) {
    try {
      const response = await api.get(`/batches/${batchId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batch statistics');
    }
  }

  // User batch management
  static async getUserBatches(userId) {
    try {
      const response = await api.get(`/users/${userId}/batches`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user batches:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user batches');
    }
  }

  // Update user batch assignments (admin only)
  static async updateUserBatches(userId, batchIds, action = 'assign') {
    try {
      const response = await api.put(`/users/${userId}/batches`, { batchIds, action });
      return response.data;
    } catch (error) {
      console.error('Error updating user batches:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user batches');
    }
  }

  // Register user with batch
  static async registerWithBatch(userData) {
    try {
      const response = await api.post('/users/register-with-batch', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering with batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to register with batch');
    }
  }

  // Get user's available batches for quiz generation
  static async getUserBatchesForQuiz() {
    try {
      const response = await api.get('/quizzes/user-batches');
      return response.data;
    } catch (error) {
      console.error('Error fetching user batches for quiz:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user batches for quiz');
    }
  }

  // ===== BATCH CRITERIA FUNCTIONALITY =====

  // Get criteria options for dropdowns
  static async getCriteriaOptions() {
    try {
      const response = await api.get('/batches/criteria-options');
      return response.data;
    } catch (error) {
      console.error('Error fetching criteria options:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch criteria options');
    }
  }

  // Validate batch criteria
  static async validateCriteria(criteria) {
    try {
      const response = await api.post('/batches/validate-criteria', { criteria });
      return response.data;
    } catch (error) {
      console.error('Error validating criteria:', error);
      throw new Error(error.response?.data?.message || 'Failed to validate criteria');
    }
  }

  // Preview questions matching criteria
  static async previewQuestions(criteria, limit = 10) {
    try {
      const response = await api.post('/batches/preview-questions', { criteria, limit });
      return response.data;
    } catch (error) {
      console.error('Error previewing questions:', error);
      throw new Error(error.response?.data?.message || 'Failed to preview questions');
    }
  }

  // Update batch criteria
  static async updateBatchCriteria(batchId, criteria) {
    try {
      const response = await api.put(`/batches/${batchId}/criteria`, { criteria });
      return response.data;
    } catch (error) {
      console.error('Error updating batch criteria:', error);
      throw new Error(error.response?.data?.message || 'Failed to update batch criteria');
    }
  }

  // Get quizzes available to batch
  static async getBatchQuizzes(batchId) {
    try {
      const response = await api.get(`/batches/${batchId}/quizzes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch quizzes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch batch quizzes');
    }
  }
}

export default BatchService;
