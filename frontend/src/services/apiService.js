import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Response Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('401 Error details:', error.response.data);
      // Token expired or invalid - clear storage and force logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      // Dispatch logout action to update auth context
      // We need to get dispatch from somewhere accessible
      // For now, just redirect to login - the auth context will sync
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        console.log('Redirecting to login due to 401 error');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API service with all endpoints
export const apiService = {
  // Auth endpoints
  auth: {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    validateToken: () => api.get('/auth/validate'),
    refreshToken: () => api.post('/auth/refresh')
  },

  // Upload endpoints
  uploads: {
    single: (formData) => api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    multiple: (formData) => api.post('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params) => api.get('/uploads', { params }),
    getById: (id) => api.get(`/uploads/${id}`),
    delete: (id) => api.delete(`/uploads/${id}`)
  },

  // AI endpoints
  ai: {
    test: () => api.get('/ai/test'),
    status: () => api.get('/ai/status'),
    features: () => api.get('/ai/features'),
    generateQuiz: (data) => api.post('/ai/generate-quiz', data),
    explainCode: (data) => api.post('/ai/explain-code', data)
  },

  // Quiz endpoints with enhanced error handling
  quizzes: {
    generate: (data) => api.post('/quizzes/generate', data),
    generateEnhanced: (data) => api.post('/quizzes/generate-enhanced', data),
    generateDynamic: (data) => api.post('/quizzes/generate-dynamic', data),
    previewQuestions: (data) => api.post('/quizzes/preview-questions', data),
    getGenerationOptions: () => api.get('/quizzes/generation-options'),
    list: (params) => api.get('/quizzes', { params }),
    getById: (id) => api.get(`/quizzes/${id}`),
    startAttempt: (id) => api.post(`/quizzes/${id}/start-attempt`),
    create: (data) => api.post('/quizzes', data),
    update: (id, data) => api.put(`/quizzes/${id}`, data),
    delete: (id) => api.delete(`/quizzes/${id}`),
    getResults: (attemptId) => api.get(`/quiz-attempts/${attemptId}/detailed`)
  },

  // Quiz attempts endpoints
  quizAttempts: {
    getRecent: (params) => api.get('/quiz-attempts/recent', { params }),
    getById: (id) => api.get(`/quiz-attempts/${id}`),
    getByUserId: (userId, params) => api.get(`/quiz-attempts/user/${userId}`, { params }),
    create: (data) => api.post('/quiz-attempts', data),
    update: (id, data) => api.put(`/quiz-attempts/${id}`, data),
    delete: (id) => api.delete(`/quiz-attempts/${id}`),
    getDetailed: (id) => api.get(`/quiz-attempts/${id}/detailed`)
  },

  // Batch endpoints
  batches: {
    getAll: (params) => api.get('/batches', { params }),
    getById: (id) => api.get(`/batches/${id}`),
    create: (data) => api.post('/batches', data),
    update: (id, data) => api.put(`/batches/${id}`, data),
    delete: (id) => api.delete(`/batches/${id}`),
    getUsers: (id, params) => api.get(`/batches/${id}/users`, { params }),
    getQuestions: (id, params) => api.get(`/batches/${id}/questions`, { params }),
    addUser: (id, data) => api.post(`/batches/${id}/users`, data),
    removeUser: (id, userId) => api.delete(`/batches/${id}/users/${userId}`),
    addQuestion: (id, data) => api.post(`/batches/${id}/questions`, data),
    removeQuestion: (id, questionId) => api.delete(`/batches/${id}/questions/${questionId}`),
    bulkAddQuestions: (id, data) => api.post(`/batches/${id}/questions/bulk`, data),
    getStatistics: (id) => api.get(`/batches/${id}/statistics`),
    getUserBatches: (userId) => api.get(`/users/${userId}/batches`)
  },

  // Enhanced Question Bank endpoints
  questions: {
    bulkCreate: (data) => api.post('/questions/bulk', data),
    search: (params) => api.get('/questions/search', { params }),
    getStatistics: () => api.get('/questions/statistics'),
    getMetadataOptions: () => api.get('/questions/metadata-options'),
    getById: (id) => api.get(`/questions/${id}`),
    updateById: (id, data) => api.put(`/questions/${id}`, data),
    deleteById: (id) => api.delete(`/questions/${id}`),
    validateBulk: (data) => api.post('/questions/validate-bulk', data)
  },

  // Admin endpoints
  admin: {
    // Student management
    getStudents: (params) => api.get('/admin/students', { params }),
    getStudentsSummary: () => api.get('/admin/students/summary'),
    getStudentDetails: (id) => api.get(`/admin/students/${id}`),
    updateStudentStatus: (id, data) => api.put(`/admin/students/${id}/status`, data),
    deleteStudent: (id) => api.delete(`/admin/students/${id}`),
    
    // Analytics
    getDashboardAnalytics: (params) => api.get('/admin/analytics/dashboard', { params }),
    getPerformanceAnalytics: (params) => api.get('/admin/analytics/performance', { params }),
    getContentAnalytics: (params) => api.get('/admin/analytics/content', { params }),
    getUsageAnalytics: (params) => api.get('/admin/analytics/usage', { params })
  }
};

// Export axios instance for custom requests
export default api;

// Enhanced error handling function with structured error responses
export const handleApiError = (error) => {
  // Network error (no response received)
  if (error.request && !error.response) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
        details: ['Unable to connect to server', 'Check internet connection', 'Server may be unavailable']
      },
      status: 0
    };
  }
  
  // Request timeout
  if (error.code === 'ECONNABORTED') {
    return {
      success: false,
      error: {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        details: ['Server response took too long', 'Try reducing request size or check connection']
      },
      status: 0
    };
  }
  
  // Server responded with error status
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle specific status codes
    switch (status) {
      case 400:
        return {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: data?.message || 'Invalid request format',
            details: data?.errors || data?.error?.details || ['Check request parameters']
          },
          status
        };
        
      case 401:
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            details: ['Please log in to continue', 'Your session may have expired']
          },
          status
        };
        
      case 403:
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
            details: ['You do not have permission to perform this action']
          },
          status
        };
        
      case 404:
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: data?.message || 'Resource not found',
            details: data?.errors || ['The requested resource does not exist']
          },
          status
        };
        
      case 422:
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: data?.message || 'Validation failed',
            details: data?.errors || data?.error?.details || ['Please check your input']
          },
          status
        };
        
      case 429:
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Too many requests. Please try again later.',
            details: ['Rate limit exceeded', 'Wait a moment before trying again']
          },
          status
        };
        
      case 500:
        return {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error. Please try again.',
            details: ['Something went wrong on our end', 'Try again in a few moments']
          },
          status
        };
        
      case 502:
      case 503:
      case 504:
        return {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable',
            details: ['Server is temporarily down', 'Please try again later']
          },
          status
        };
        
      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: data?.message || 'An unexpected error occurred',
            details: data?.errors || ['Please try again or contact support']
          },
          status
        };
    }
  }
  
  // Fallback for any other error
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: ['Please try again or contact support']
    },
    status: 0
  };
};

// Helper function to get auth token
export const getAuthToken = () => localStorage.getItem('authToken');

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};
