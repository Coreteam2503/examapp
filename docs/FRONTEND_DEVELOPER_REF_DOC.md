# Frontend Developer Reference Document
## ExamApp - React/TypeScript Frontend Standards

---

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [File & Folder Organization](#file--folder-organization)
3. [Naming Conventions](#naming-conventions)
4. [Component Patterns](#component-patterns)
5. [React Hooks Patterns](#react-hooks-patterns)
6. [State Management](#state-management)
7. [Service Layer Patterns](#service-layer-patterns)
8. [Styling Architecture](#styling-architecture)
9. [TypeScript Patterns](#typescript-patterns)
10. [Performance Patterns](#performance-patterns)
11. [Quick Reference](#quick-reference)

---

## Core Architecture

### Project Structure Rules
```
frontend/src/
├── components/      # Reusable UI components
│   ├── auth/       # Authentication-related components
│   ├── dashboard/  # Dashboard-specific components
│   ├── quiz/       # Quiz-related components
│   └── admin/      # Admin-specific components
├── contexts/       # React Context providers
├── services/       # API integration layer
├── utils/          # Helper functions & utilities
├── App.tsx         # Main application component
└── index.tsx       # Application entry point
```

### Component Architecture Flow
**App → Router → Pages → Layout → Components → UI Elements**

### Separation of Concerns (SOC)
- **Components**: Maximum 200-300 lines per file
- **Single Responsibility**: One purpose per component
- **Composition over Inheritance**: Build complex UIs with simple components
- **Pure Functions**: Prefer functional components with hooks

---

## File & Folder Organization

### When to Create Component Folders
- **Simple Components**: Single file (`ComponentName.js`)
- **Complex Components**: Folder with index file when component has:
  - Multiple CSS files
  - Sub-components
  - Custom hooks
  - Test files

### Component Folder Structure
```
ComponentName/
├── index.js                 # Main component export
├── ComponentName.js         # Component implementation
├── ComponentName.css        # Component-specific styles
├── ComponentName.test.js    # Component tests
├── hooks/                   # Component-specific hooks
│   └── useComponentName.js
└── components/              # Sub-components
    └── SubComponent.js
```

### File Naming Convention
- **Components**: `PascalCase.js` (e.g., `LoginForm.js`, `QuizDisplay.js`)
- **Utilities**: `camelCase.js` (e.g., `apiService.js`, `authHelpers.js`)
- **Hooks**: `use + PascalCase.js` (e.g., `useAuth.js`, `useQuiz.js`)
- **Contexts**: `PascalCase + Context.js` (e.g., `AuthContext.js`)
- **CSS Files**: Match component name (e.g., `LoginForm.css`)

### Import/Export Standards
```javascript
// Default export for main component
export default ComponentName;

// Named exports for utilities/services
export { function1, function2 };

// Import organization (top to bottom)
import React from 'react';                    // React imports
import { useState, useEffect } from 'react';  // React hooks
import { useNavigate } from 'react-router-dom'; // Third-party libraries
import { useAuth } from '../contexts/AuthContext'; // Internal contexts
import { apiService } from '../services/apiService'; // Internal services
import './ComponentName.css';                  // Styles last
```

---

## Naming Conventions

### Variables & Functions
- **State Variables**: `camelCase` descriptive (e.g., `isLoading`, `userData`, `quizResults`)
- **Event Handlers**: `handle + Action` (e.g., `handleSubmit`, `handleClick`, `handleAnswerSelect`)
- **Boolean Variables**: `is/has/can/should + Condition` (e.g., `isAuthenticated`, `hasPermission`)
- **Arrays**: Plural nouns (e.g., `questions`, `users`, `quizzes`)

### Component Props
- **Boolean Props**: Start with `is/has/can/should` (e.g., `isDisabled`, `hasError`)
- **Event Props**: Start with `on` (e.g., `onClick`, `onSubmit`, `onQuizComplete`)
- **Data Props**: Descriptive nouns (e.g., `user`, `quiz`, `questions`)

### CSS Classes
- **Components**: `kebab-case` (e.g., `.quiz-display`, `.login-form`)
- **States**: `kebab-case` with modifier (e.g., `.button-disabled`, `.form-loading`)
- **BEM Methodology**: Use for complex components (e.g., `.quiz-display__header--active`)

---

## Component Patterns

### Functional Component Structure
```javascript
const ComponentName = ({ prop1, prop2, onAction }) => {
  // 1. State declarations
  const [localState, setLocalState] = useState(initialValue);
  
  // 2. Context usage
  const { contextValue } = useContext(SomeContext);
  
  // 3. Custom hooks
  const { customData, customAction } = useCustomHook();
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 5. Event handlers
  const handleAction = (data) => {
    // Handler logic
    onAction?.(data);
  };
  
  // 6. Computed values
  const computedValue = useMemo(() => {
    return expensiveComputation(localState);
  }, [localState]);
  
  // 7. Early returns for loading/error states
  if (!requiredData) {
    return <LoadingSpinner />;
  }
  
  // 8. Main render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};
```

### Component Size Guidelines
- **Small Components**: 50-100 lines (UI elements, buttons, inputs)
- **Medium Components**: 100-200 lines (forms, cards, modals)
- **Large Components**: 200-300 lines (pages, complex layouts)
- **Split When**: Component exceeds 300 lines or has multiple responsibilities

### Props Interface Design
```javascript
// Simple prop types
const Button = ({ children, onClick, disabled = false, variant = 'primary' }) => {
  // Component implementation
};

// Complex prop types with TypeScript
interface QuizDisplayProps {
  quiz: Quiz;
  onQuizComplete: (results: QuizResults) => void;
  onAnswerChange?: (answers: AnswerMap) => void;
  isDisabled?: boolean;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ 
  quiz, 
  onQuizComplete, 
  onAnswerChange, 
  isDisabled = false 
}) => {
  // Component implementation
};
```

---

## React Hooks Patterns

### useState Patterns
```javascript
// Simple state
const [isLoading, setIsLoading] = useState(false);

// Object state (prefer multiple useState for unrelated data)
const [formData, setFormData] = useState({
  email: '',
  password: ''
});

// Update object state
const handleInputChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

// Array state
const [items, setItems] = useState([]);
const addItem = (newItem) => {
  setItems(prev => [...prev, newItem]);
};
```

### useEffect Patterns
```javascript
// Component mount effect
useEffect(() => {
  // Mount logic
  return () => {
    // Cleanup logic
  };
}, []);

// Dependency-based effect
useEffect(() => {
  if (userId) {
    fetchUserData(userId);
  }
}, [userId]);

// Cleanup patterns
useEffect(() => {
  const timer = setInterval(() => {
    setTime(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### Custom Hooks Patterns
```javascript
// Data fetching hook
const useApi = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Form management hook
const useForm = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    // Validation logic based on validationRules
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { values, errors, handleChange, validate };
};
```

---

## State Management

### Context Patterns
```javascript
// Context creation
const StateContext = createContext();
const DispatchContext = createContext();

// Custom hooks for context access
export const useContextState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useContextState must be used within a Provider');
  }
  return context;
};

export const useContextDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useContextDispatch must be used within a Provider');
  }
  return context;
};

// Provider component
export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};
```

### Reducer Patterns
```javascript
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};
```

### When to Use Different State Management
- **Local State**: Component-specific data, form inputs, UI state
- **Context**: Global app state, authentication, theme
- **Service Layer**: API data, cached responses, external state

### Action Creator Patterns
```javascript
// Follow AuthContext pattern for action creators
export const actions = {
  actionName: (dispatch) => async (param1, param2) => {
    try {
      dispatch({ type: 'ACTION_START' });
      
      const result = await serviceCall(param1, param2);
      
      dispatch({
        type: 'ACTION_SUCCESS',
        payload: result
      });
      
      return { success: true, data: result };
    } catch (error) {
      dispatch({
        type: 'ACTION_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  }
};
```

---

## Service Layer Patterns

### API Service Organization
```javascript
// Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Handle logout logic
    }
    return Promise.reject(error);
  }
);

// Service organization by domain
export const apiService = {
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
  },
  
  quizzes: {
    generate: (data) => api.post('/quizzes/generate', data),
    getById: (id) => api.get(`/quizzes/${id}`),
    list: (params) => api.get('/quizzes', { params }),
  },
  
  uploads: {
    single: (formData) => api.post('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params) => api.get('/uploads', { params }),
  }
};
```

### Error Handling Patterns
```javascript
// Centralized error handling
export const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0
    };
  } else {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};

// Usage in components
const handleSubmit = async () => {
  try {
    setIsLoading(true);
    setErrors({});
    
    const response = await apiService.auth.login(credentials);
    
    if (response.data.success) {
      // Handle success
      navigate('/dashboard');
    }
  } catch (error) {
    const errorInfo = handleApiError(error);
    setErrors({ general: errorInfo.message });
  } finally {
    setIsLoading(false);
  }
};
```

---

## Styling Architecture

### Tailwind CSS Patterns
```javascript
// Responsive design (mobile-first)
<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>

// State-based styling with template literals
<button 
  className={`
    px-4 py-2 rounded-md font-medium transition-colors
    ${isLoading 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-blue-600 hover:bg-blue-700'
    }
    ${isDisabled ? 'opacity-50 pointer-events-none' : ''}
    ${variant === 'outline' 
      ? 'border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50' 
      : 'text-white'
    }
  `}
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Component variants utility
const getButtonVariant = (variant) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return variants[variant] || variants.primary;
};
```

### CSS Module Integration
```javascript
// When to use CSS files vs Tailwind
// CSS Files: Complex animations, component-specific layouts, theme overrides
// Tailwind: Spacing, colors, typography, responsive design, utilities

// CSS file structure for complex components
.quiz-display {
  /* Complex grid layout */
  display: grid;
  grid-template-areas: 
    "header header"
    "content sidebar"
    "footer footer";
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  
  /* Custom animations */
  animation: slideIn 0.3s ease-in-out;
}

.quiz-display__header {
  grid-area: header;
}

.quiz-display__content {
  grid-area: content;
}

.quiz-display__sidebar {
  grid-area: sidebar;
}

/* Custom animations that are complex for Tailwind */
@keyframes slideIn {
  from { 
    transform: translateX(-100%);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-pulse {
  animation: pulse 2s infinite;
}
```

### Responsive Design Patterns
```javascript
// Mobile-first breakpoints
const responsiveClasses = {
  container: "w-full max-w-md mx-auto md:max-w-lg lg:max-w-xl xl:max-w-2xl",
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
  text: "text-sm md:text-base lg:text-lg",
  spacing: "p-4 md:p-6 lg:p-8",
  button: "w-full md:w-auto px-4 py-2 md:px-6 md:py-3"
};

// Component responsiveness following QuizDisplay pattern
const QuizCard = ({ quiz, onClick }) => (
  <div className="
    bg-white rounded-lg shadow-md overflow-hidden
    p-4 md:p-6
    w-full
    mb-4 md:mb-0
    cursor-pointer hover:shadow-lg transition-shadow
    border border-gray-200 hover:border-gray-300
  " onClick={onClick}>
    <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
      {quiz.title}
    </h3>
    <p className="text-sm md:text-base text-gray-600 mb-4">
      {quiz.description}
    </p>
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
      <span className="text-xs md:text-sm text-gray-500">
        {quiz.questionCount} questions
      </span>
      <span className="text-xs md:text-sm font-medium text-blue-600">
        Difficulty: {quiz.difficulty}
      </span>
    </div>
  </div>
);
```

---

## TypeScript Patterns

### Interface Design
```typescript
// Base interfaces
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Component prop interfaces
interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Data model interfaces
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'student';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  createdAt: string;
  userId: number;
}

interface Question {
  id: number;
  type: 'multiple_choice' | 'fill_in_the_blank' | 'true_false' | 'matching';
  questionText: string;
  options?: string[];
  correctAnswer: string | boolean | Record<string, string>;
  codeSnippet?: string;
}
```

### Generic Patterns
```typescript
// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Generic form hook
interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e: React.FormEvent) => void;
  reset: () => void;
  isValid: boolean;
}

const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>
): UseFormReturn<T> => {
  // Implementation
};

// Generic API hook
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useApi = <T>(url: string): UseApiReturn<T> => {
  // Implementation
};
```

### Type Guards and Utilities
```typescript
// Type guards
const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'number' && typeof obj.email === 'string';
};

const isQuizAttempt = (obj: any): obj is QuizAttempt => {
  return obj && typeof obj.quizId === 'number' && typeof obj.userId === 'number';
};

// Utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type UserInput = Optional<User, 'id' | 'createdAt' | 'updatedAt'>;

// Event handler types
type FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => void;
type ClickEventHandler = (e: React.MouseEvent<HTMLButtonElement>) => void;
type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
```

---

## Performance Patterns

### Memoization Patterns
```javascript
// useMemo for expensive computations
const expensiveValue = useMemo(() => {
  return questions.filter(q => q.difficulty === selectedDifficulty)
    .sort((a, b) => a.order - b.order);
}, [questions, selectedDifficulty]);

// useCallback for event handlers passed to children
const handleQuestionAnswer = useCallback((questionId, answer) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));
}, []);

// React.memo for pure components
const QuestionCard = React.memo(({ question, onAnswer, isSelected }) => {
  return (
    <div className={`question-card ${isSelected ? 'selected' : ''}`}>
      {/* Component content */}
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';
```

### Lazy Loading Patterns
```javascript
// Component lazy loading
const QuizManager = React.lazy(() => import('./components/quiz/QuizManager'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));

// Usage with Suspense
<Suspense fallback={<div className="loading-spinner">Loading...</div>}>
  <QuizManager />
</Suspense>

// Conditional imports
const loadHeavyFeature = async () => {
  if (userRole === 'admin') {
    const { AdminTools } = await import('./components/admin/AdminTools');
    return AdminTools;
  }
  return null;
};
```

### List Optimization
```javascript
// Virtual scrolling for large lists (when needed)
const VirtualQuestionList = ({ questions, onQuestionClick }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  const visibleQuestions = useMemo(() => {
    return questions.slice(visibleRange.start, visibleRange.end);
  }, [questions, visibleRange]);

  return (
    <div className="question-list">
      {visibleQuestions.map(question => (
        <QuestionCard 
          key={question.id} 
          question={question} 
          onClick={onQuestionClick}
        />
      ))}
    </div>
  );
};

// Key prop optimization
{questions.map(question => (
  <QuestionComponent 
    key={`question-${question.id}-${question.lastModified}`}
    question={question}
  />
))}
```

---

## Quick Reference

### Component Creation Checklist
- [ ] Component follows naming convention (PascalCase)
- [ ] Props interface defined (TypeScript)
- [ ] Default props provided where appropriate
- [ ] Error boundaries considered for complex components
- [ ] Loading and error states handled
- [ ] Accessibility attributes included
- [ ] Mobile responsiveness implemented
- [ ] Performance optimization applied (memo, callback, etc.)

### Form Component Checklist
- [ ] Validation implemented (client-side)
- [ ] Error display for each field
- [ ] Loading state during submission
- [ ] Success/error feedback
- [ ] Accessibility labels and ARIA
- [ ] Keyboard navigation support
- [ ] Mobile-friendly input types

### API Integration Checklist
- [ ] Error handling implemented
- [ ] Loading states managed
- [ ] Success feedback provided
- [ ] Network error handling
- [ ] Authentication token handling
- [ ] Request/response logging (dev mode)

### State Management Checklist
- [ ] State scope appropriate (local vs context vs service)
- [ ] State updates are immutable
- [ ] Side effects handled in useEffect
- [ ] Cleanup functions implemented
- [ ] Dependencies array correct

### Styling Checklist
- [ ] Mobile-first responsive design
- [ ] Consistent spacing (Tailwind scale)
- [ ] Accessibility contrast ratios
- [ ] Hover and focus states
- [ ] Loading and disabled states
- [ ] Dark mode considerations (if applicable)

---

## Anti-Patterns to Avoid

### ❌ Don't Do
- Mixing JavaScript and TypeScript inconsistently
- Direct DOM manipulation (use refs sparingly)
- Inline event handlers in JSX for complex logic
- Deep component nesting (more than 4-5 levels)
- Mutating state directly
- Using array indexes as keys for dynamic lists
- Ignoring useEffect dependencies
- Creating contexts for every piece of state
- Using any type excessively in TypeScript
- Hardcoding API URLs or configuration

### ✅ Do Instead
- Choose TypeScript or JavaScript consistently per file
- Use React patterns for state and DOM updates
- Extract event handlers to component methods
- Break down complex components into smaller ones
- Use immutable updates with spread operators
- Use stable, unique identifiers as keys
- Include all dependencies in useEffect arrays
- Use context judiciously for truly global state
- Define proper interfaces and types
- Use environment variables for configuration

### Common Performance Anti-Patterns
- Creating objects/functions in render
- Not memoizing expensive computations
- Unnecessary re-renders due to reference changes
- Not using React.memo for pure components
- Excessive context re-renders
- Large bundle sizes without code splitting

---

## Form Validation Patterns

### Client-Side Validation
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email';
  return '';
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

// Form validation hook
const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const rule = validationRules[name];
    return rule ? rule(value) : '';
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange: (field, value) => {
      setValues(prev => ({ ...prev, [field]: value }));
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    },
    handleBlur: (field) => {
      setTouched(prev => ({ ...prev, [field]: true }));
      const error = validateField(field, values[field]);
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    validateAll,
    resetForm: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  };
};
```

---

*This document should be updated as patterns evolve and new standards are established.*