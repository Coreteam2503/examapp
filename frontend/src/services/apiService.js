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
    console.log('API Request - Token found:', token ? 'Yes' : 'No');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request - Authorization header set');
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
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Don't redirect here, let components handle it
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

  // Quiz endpoints
  quizzes: {
    generate: (data) => api.post('/quizzes/generate', data),
    list: (params) => api.get('/quizzes', { params }),
    getById: (id) => api.get(`/quizzes/${id}`),
    create: (data) => api.post('/quizzes', data),
    update: (id, data) => api.put(`/quizzes/${id}`, data),
    delete: (id) => api.delete(`/quizzes/${id}`)
  },

  // Quiz attempts endpoints
  quizAttempts: {
    submit: (data) => api.post('/quiz-attempts', data),
    getById: (id) => api.get(`/quiz-attempts/${id}`),
    getUserAttempts: (params) => api.get('/quiz-attempts', { params }),
    getStatistics: () => api.get('/quiz-attempts/statistics'),
    getDetailedResults: (id) => api.get(`/quiz-attempts/${id}/detailed`),
    getRecent: (params) => api.get('/quiz-attempts/recent', { params }),
    delete: (id) => api.delete(`/quiz-attempts/${id}`)
  },

  // User endpoints
  users: {
    getProgress: () => api.get('/users/progress')
  },

  // Analytics endpoints
  analytics: {
    getPerformance: (params) => api.get('/analytics/performance', { params })
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

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
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
