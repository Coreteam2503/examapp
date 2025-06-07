import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService, handleApiError } from '../services/apiService';

// Auth state reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        token: action.payload.token
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
};

// Create contexts
const AuthContext = createContext();
const AuthDispatchContext = createContext();

// Custom hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthDispatch = () => {
  const context = useContext(AuthDispatchContext);
  if (!context) {
    throw new Error('useAuthDispatch must be used within an AuthProvider');
  }
  return context;
};

// Token management utilities
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

const saveTokenToStorage = (token, user) => {
  console.log('Saving token to storage:', token ? 'Token present' : 'Token missing');
  console.log('Saving user to storage:', user ? 'User present' : 'User missing');
  
  if (token && token !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  
  if (user && user !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  
  console.log('After saving - token in storage:', localStorage.getItem(TOKEN_KEY) ? 'Present' : 'Missing');
};

const getTokenFromStorage = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    // Check if user exists and is not the string "undefined"
    if (user && user !== 'undefined' && user !== 'null') {
      return JSON.parse(user);
    }
    return null;
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    // Clear invalid data
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const removeTokenFromStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Auth service functions
const authServiceFunctions = {
  login: async (email, password) => {
    const response = await apiService.auth.login({ email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiService.auth.register(userData);
    return response.data;
  },

  validateToken: async () => {
    const response = await apiService.auth.validateToken();
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiService.auth.refreshToken();
    return response.data;
  }
};

// Auth action creators
export const authActions = {
  login: (dispatch) => async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const data = await authServiceFunctions.login(email, password);
      console.log('Login response data:', data);
      console.log('Token from response:', data.data?.token);
      console.log('User from response:', data.data?.user);
      
      saveTokenToStorage(data.data.token, data.data.user);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.data.user,
          token: data.data.token
        }
      });
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  },

  register: (dispatch) => async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const data = await authServiceFunctions.register(userData);
      console.log('Register response data:', data);
      
      // Handle both data.data and direct data structures
      const user = data.data?.user || data.user;
      const token = data.data?.token || data.token;
      
      saveTokenToStorage(token, user);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: user,
          token: token
        }
      });
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  },

  logout: (dispatch) => () => {
    removeTokenFromStorage();
    dispatch({ type: 'LOGOUT' });
  },

  clearError: (dispatch) => () => {
    dispatch({ type: 'CLEAR_ERROR' });
  },

  refreshToken: (dispatch) => async (token) => {
    try {
      const data = await authServiceFunctions.refreshToken();
      saveTokenToStorage(data.token, data.user);
      
      dispatch({
        type: 'TOKEN_REFRESH',
        payload: {
          token: data.token
        }
      });
      
      return { success: true };
    } catch (error) {
      // If refresh fails, logout user
      dispatch({ type: 'LOGOUT' });
      removeTokenFromStorage();
      return { success: false };
    }
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getTokenFromStorage();
      const user = getUserFromStorage();

      // Both token and user must exist for authentication
      if (token && user && token !== 'undefined' && user !== 'undefined') {
        try {
          console.log('Initializing auth with stored token and user');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              token
            }
          });
          
          // Validate token in background - if it fails, it will be caught by API interceptors
          authServiceFunctions.validateToken().catch((error) => {
            console.log('Token validation failed (background check):', error.message);
            // Let the API interceptors handle 401 responses instead of forcing logout here
          });
          
        } catch (error) {
          console.log('Auth initialization error:', error.message);
          // Clear invalid data and logout
          removeTokenFromStorage();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('No valid token or user found, logging out');
        // Clear any invalid data
        removeTokenFromStorage();
        dispatch({ type: 'LOGOUT' });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeAuth();
  }, []);

  // Auto token refresh - DISABLED to prevent premature logouts
  // TODO: Re-enable after fixing token refresh endpoint validation
  /*
  useEffect(() => {
    if (!state.token || !state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const result = await authActions.refreshToken(dispatch)(state.token);
      if (!result.success) {
        // Refresh failed, user will be logged out by the action
        clearInterval(refreshInterval);
      }
    }, 23 * 60 * 60 * 1000); // Refresh every 23 hours (before 24h expiry)

    return () => clearInterval(refreshInterval);
  }, [state.token, state.isAuthenticated]);
  */

  return (
    <AuthContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
};

export default AuthProvider;
