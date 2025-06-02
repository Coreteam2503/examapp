import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Quiz Session State Management
const QuizContext = createContext();

// Action Types
const QUIZ_ACTIONS = {
  START_QUIZ: 'START_QUIZ',
  SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  UPDATE_TIMER: 'UPDATE_TIMER',
  PAUSE_TIMER: 'PAUSE_TIMER',
  RESUME_TIMER: 'RESUME_TIMER',
  COMPLETE_QUIZ: 'COMPLETE_QUIZ',
  RESET_QUIZ: 'RESET_QUIZ',
  SAVE_PROGRESS: 'SAVE_PROGRESS',
  LOAD_PROGRESS: 'LOAD_PROGRESS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial State
const initialState = {
  quiz: null,
  currentQuestionIndex: 0,
  answers: {},
  timeElapsed: 0,
  isStarted: false,
  isCompleted: false,
  isPaused: false,
  startTime: null,
  endTime: null,
  progress: {
    answeredQuestions: 0,
    totalQuestions: 0,
    completionPercentage: 0
  },
  statistics: {
    averageTimePerQuestion: 0,
    questionsAnswered: 0,
    questionsSkipped: 0
  },
  error: null,
  loading: false
};

// Reducer
const quizReducer = (state, action) => {
  switch (action.type) {
    case QUIZ_ACTIONS.START_QUIZ:
      return {
        ...state,
        quiz: action.payload.quiz,
        isStarted: true,
        startTime: Date.now(),
        currentQuestionIndex: 0,
        answers: {},
        timeElapsed: 0,
        isCompleted: false,
        progress: {
          ...state.progress,
          totalQuestions: action.payload.quiz?.questions?.length || 0
        },
        error: null
      };

    case QUIZ_ACTIONS.SET_CURRENT_QUESTION:
      return {
        ...state,
        currentQuestionIndex: action.payload.index
      };

    case QUIZ_ACTIONS.SUBMIT_ANSWER: {
      const { questionId, answer, timeSpent } = action.payload;
      const newAnswers = {
        ...state.answers,
        [questionId]: {
          answer,
          timeSpent: timeSpent || 0,
          timestamp: Date.now()
        }
      };
      
      const answeredCount = Object.keys(newAnswers).length;
      const totalQuestions = state.quiz?.questions?.length || 0;
      
      return {
        ...state,
        answers: newAnswers,
        progress: {
          answeredQuestions: answeredCount,
          totalQuestions,
          completionPercentage: (answeredCount / totalQuestions) * 100
        },
        statistics: {
          ...state.statistics,
          questionsAnswered: answeredCount,
          averageTimePerQuestion: state.timeElapsed / answeredCount
        }
      };
    }

    case QUIZ_ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        timeElapsed: action.payload.timeElapsed
      };

    case QUIZ_ACTIONS.PAUSE_TIMER:
      return {
        ...state,
        isPaused: true
      };

    case QUIZ_ACTIONS.RESUME_TIMER:
      return {
        ...state,
        isPaused: false
      };

    case QUIZ_ACTIONS.COMPLETE_QUIZ:
      return {
        ...state,
        isCompleted: true,
        endTime: Date.now(),
        isPaused: true
      };

    case QUIZ_ACTIONS.RESET_QUIZ:
      return {
        ...initialState
      };

    case QUIZ_ACTIONS.SAVE_PROGRESS:
      // Save to localStorage
      const progressData = {
        quizId: state.quiz?.id,
        answers: state.answers,
        currentQuestionIndex: state.currentQuestionIndex,
        timeElapsed: state.timeElapsed,
        startTime: state.startTime,
        timestamp: Date.now()
      };
      localStorage.setItem(`quiz_progress_${state.quiz?.id}`, JSON.stringify(progressData));
      return state;

    case QUIZ_ACTIONS.LOAD_PROGRESS: {
      const { progressData } = action.payload;
      return {
        ...state,
        answers: progressData.answers || {},
        currentQuestionIndex: progressData.currentQuestionIndex || 0,
        timeElapsed: progressData.timeElapsed || 0,
        startTime: progressData.startTime,
        progress: {
          ...state.progress,
          answeredQuestions: Object.keys(progressData.answers || {}).length
        }
      };
    }

    case QUIZ_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        loading: false
      };

    case QUIZ_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Quiz Provider Component
export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  let timerInterval = null;

  // Timer Effect
  useEffect(() => {
    if (state.isStarted && !state.isPaused && !state.isCompleted) {
      timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - state.startTime) / 1000);
        dispatch({
          type: QUIZ_ACTIONS.UPDATE_TIMER,
          payload: { timeElapsed: elapsed }
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [state.isStarted, state.isPaused, state.isCompleted, state.startTime]);

  // Auto-save progress
  useEffect(() => {
    if (state.isStarted && !state.isCompleted) {
      const autoSaveInterval = setInterval(() => {
        dispatch({ type: QUIZ_ACTIONS.SAVE_PROGRESS });
      }, 30000); // Save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [state.isStarted, state.isCompleted]);

  // Quiz Actions
  const startQuiz = (quiz) => {
    // Check for existing progress
    const savedProgress = localStorage.getItem(`quiz_progress_${quiz.id}`);
    
    dispatch({
      type: QUIZ_ACTIONS.START_QUIZ,
      payload: { quiz }
    });

    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress);
        const timeSinceLastSave = Date.now() - progressData.timestamp;
        
        // If saved within last hour, offer to resume
        if (timeSinceLastSave < 3600000) { // 1 hour
          const shouldResume = window.confirm(
            'Would you like to resume your previous attempt?'
          );
          
          if (shouldResume) {
            dispatch({
              type: QUIZ_ACTIONS.LOAD_PROGRESS,
              payload: { progressData }
            });
          }
        } else {
          // Clear old progress
          localStorage.removeItem(`quiz_progress_${quiz.id}`);
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  };

  const submitAnswer = (questionId, answer) => {
    const currentQuestion = state.quiz?.questions?.[state.currentQuestionIndex];
    if (!currentQuestion) return;

    const timeSpent = state.timeElapsed - (state.lastQuestionTime || 0);
    
    dispatch({
      type: QUIZ_ACTIONS.SUBMIT_ANSWER,
      payload: {
        questionId,
        answer,
        timeSpent
      }
    });

    // Auto-save after each answer
    setTimeout(() => {
      dispatch({ type: QUIZ_ACTIONS.SAVE_PROGRESS });
    }, 100);
  };

  const navigateToQuestion = (index) => {
    if (index >= 0 && index < (state.quiz?.questions?.length || 0)) {
      dispatch({
        type: QUIZ_ACTIONS.SET_CURRENT_QUESTION,
        payload: { index }
      });
    }
  };

  const nextQuestion = () => {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < (state.quiz?.questions?.length || 0)) {
      navigateToQuestion(nextIndex);
    }
  };

  const previousQuestion = () => {
    const prevIndex = state.currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      navigateToQuestion(prevIndex);
    }
  };

  const pauseQuiz = () => {
    dispatch({ type: QUIZ_ACTIONS.PAUSE_TIMER });
    dispatch({ type: QUIZ_ACTIONS.SAVE_PROGRESS });
  };

  const resumeQuiz = () => {
    dispatch({ type: QUIZ_ACTIONS.RESUME_TIMER });
  };

  const completeQuiz = () => {
    dispatch({ type: QUIZ_ACTIONS.COMPLETE_QUIZ });
    dispatch({ type: QUIZ_ACTIONS.SAVE_PROGRESS });
    
    // Clear saved progress after completion
    if (state.quiz?.id) {
      localStorage.removeItem(`quiz_progress_${state.quiz.id}`);
    }
  };

  const resetQuiz = () => {
    if (state.quiz?.id) {
      localStorage.removeItem(`quiz_progress_${state.quiz.id}`);
    }
    dispatch({ type: QUIZ_ACTIONS.RESET_QUIZ });
  };

  const getQuizResults = () => {
    const { answers, quiz, timeElapsed, progress } = state;
    
    if (!quiz || !quiz.questions) {
      return null;
    }

    let correctAnswers = 0;
    const results = quiz.questions.map((question) => {
      const userAnswer = answers[question.id]?.answer;
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: question.id,
        question: question.question_text,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation,
        timeSpent: answers[question.id]?.timeSpent || 0
      };
    });

    const score = (correctAnswers / quiz.questions.length) * 100;

    return {
      results,
      summary: {
        totalQuestions: quiz.questions.length,
        answeredQuestions: progress.answeredQuestions,
        correctAnswers,
        score: Math.round(score),
        timeElapsed,
        averageTimePerQuestion: timeElapsed / quiz.questions.length
      }
    };
  };

  const contextValue = {
    state,
    actions: {
      startQuiz,
      submitAnswer,
      navigateToQuestion,
      nextQuestion,
      previousQuestion,
      pauseQuiz,
      resumeQuiz,
      completeQuiz,
      resetQuiz,
      getQuizResults
    }
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom Hook
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export { QUIZ_ACTIONS };
