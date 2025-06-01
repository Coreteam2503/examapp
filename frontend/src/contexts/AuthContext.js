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
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  console.log('After saving - token in storage:', localStorage.getItem(TOKEN_KEY) ? 'Present' : 'Missing');
};

const getTokenFromStorage = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const getUserFromStorage = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
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

  register: async (email, password, confirmPassword) => {
    const response = await apiService.auth.register({ email, password, confirmPassword });
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

  register: (dispatch) => async (email, password, confirmPassword) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const data = await authServiceFunctions.register(email, password, confirmPassword);
      
      saveTokenToStorage(data.token, data.user);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          token: data.token
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

      if (token && user) {
        try {
          // Validate the stored token
          await authServiceFunctions.validateToken();
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              token
            }
          });
        } catch (error) {
          // Token is invalid, remove from storage
          removeTokenFromStorage();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeAuth();
  }, []);

  // Auto token refresh
  useEffect(() => {
    if (!state.token || !state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const result = await authActions.refreshToken(dispatch)(state.token);
      if (!result.success) {
        // Refresh failed, user will be logged out by the action
        clearInterval(refreshInterval);
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [state.token, state.isAuthenticated]);

  return (
    <AuthContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
};

export default AuthProvider;
