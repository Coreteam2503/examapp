# Student UI Theming Guide

## Overview
The student interface uses a **distributed CSS architecture** with component-specific styles rather than a centralized theme file. The styling is built with **standard CSS** (no Tailwind config found in project root).

## 🎨 Core Theme Structure

### 1. Global Styles
- **`/src/index.css`** - Base application styles, fonts, CSS variables
- **`/src/App.css`** - Top-level app component styles

### 2. Authentication & Entry
- **`/src/components/LoginForm.css`** - Login page styling
- **`/src/components/RegisterForm.css`** - Registration page styling

### 3. Student Dashboard Core
- **`/src/components/Dashboard.css`** - Main dashboard container
- **`/src/components/dashboard/StudentDashboard.css`** - Student-specific dashboard layout
- **`/src/components/dashboard/PerformanceStats.css`** - Statistics widgets
- **`/src/components/dashboard/ProgressTracker.css`** - Progress visualization
- **`/src/components/dashboard/QuickActions.css`** - Action buttons panel
- **`/src/components/dashboard/RecentQuizzes.css`** - Recent quiz cards
- **`/src/components/dashboard/StudentBatchDisplay.css`** - Batch information display

### 4. Quiz Interface (Primary Student Experience)
- **`/src/components/quiz/QuizManager.css`** - Quiz selection and management
- **`/src/components/quiz/QuizDisplay.css`** - Quiz presentation layout
- **`/src/components/quiz/QuizSession.css`** - Active quiz session container
- **`/src/components/quiz/QuizSessionHeader.css`** - Session header (timer, progress)
- **`/src/components/quiz/QuizSessionProgress.css`** - Progress indicators
- **`/src/components/quiz/QuizSessionQuestion.css`** - Question display area
- **`/src/components/quiz/QuizSessionNavigation.css`** - Next/Previous buttons
- **`/src/components/quiz/QuizSessionModals.css`** - Confirmation dialogs
- **`/src/components/quiz/QuizOptionsModal.css`** - Quiz settings modal
- **`/src/components/quiz/QuizTypeSelector.css`** - Quiz type selection
- **`/src/components/quiz/QuizThemeOverride.css`** - **Theme customizations**

### 5. Question Types (Core Learning Interface)
- **`/src/components/questions/QuestionWrapper.css`** - Universal question container
- **`/src/components/questions/MCQQuestion.css`** - Multiple choice questions
- **`/src/components/questions/TrueFalseQuestion.css`** - True/false questions
- **`/src/components/questions/FillInTheBlankQuestion.css`** - Fill-in-the-blank questions
- **`/src/components/questions/MatchingQuestion.css`** - Matching pairs questions
- **`/src/components/questions/OrderingQuestion.css`** - Drag-and-drop ordering

### 6. Game Formats (Gamified Learning)
- **`/src/components/games/HangmanGame.css`** - Hangman game interface
- **`/src/components/games/KnowledgeTowerGame.css`** - Knowledge tower game
- **`/src/components/games/MemoryGridGame.css`** - Memory grid game
- **`/src/components/games/WordLadderGame.css`** - Word ladder game

### 7. Mobile Responsiveness
- **`/src/components/quiz/MobileResponsive.css`** - Mobile layout adjustments
- **`/src/components/quiz/MobileEnhancements.css`** - Mobile-specific features
- **`/src/components/quiz/MobileQuestionTypes.css`** - Mobile question layouts
- **`/src/components/quiz/MobileTouchInteractions.css`** - Touch gesture handling

### 8. Student-Specific Components
- **`/src/components/student/StudentBatchSelection.css`** - Batch selection interface
- **`/src/components/points/PointsDisplay.css`** - Points/scoring display
- **`/src/components/common/BatchSelector.css`** - Batch selection dropdown

## 🎯 Key Theming Files for Students

### Primary Theme Customization
```
/src/components/quiz/QuizThemeOverride.css     // Main theme overrides
/src/index.css                                 // Global CSS variables
/src/App.css                                   // App-level styles
```

### Core Student Experience
```
/src/components/quiz/QuizSession.css           // Active quiz styling
/src/components/quiz/QuizSessionQuestion.css   // Question presentation
/src/components/questions/QuestionWrapper.css  // Universal question styles
/src/components/dashboard/StudentDashboard.css // Dashboard layout
```

### Mobile Experience
```
/src/components/quiz/MobileResponsive.css      // Mobile layouts
/src/components/quiz/MobileTouchInteractions.css // Touch handling
```

## 🚫 Non-Student Files (Exclude from Student Theming)
```
/src/components/admin/*                        // Admin interface
/src/components/QuestionBankForm.css          // Admin question management
/src/components/dev/*                         // Development tools
```

## 📱 Responsive Breakpoints
The mobile CSS files suggest responsive design with specific breakpoints for:
- Desktop quiz interface
- Tablet quiz layouts  
- Mobile touch interactions
- Small screen optimizations

## 🎨 Theme Architecture Notes
1. **Component-scoped styles** - Each component has its own CSS file
2. **No centralized theme config** - Styles are distributed across components
3. **CSS Custom Properties** - Likely defined in `index.css` for theming
4. **Mobile-first approach** - Dedicated mobile styling files
5. **Game-specific themes** - Each game format has custom styling

## 📝 Customization Workflow
To modify student theming:
1. Start with `/src/index.css` for global variables
2. Modify `/src/components/quiz/QuizThemeOverride.css` for quiz-specific themes
3. Update component-specific CSS files for detailed customizations
4. Test mobile responsiveness with mobile CSS files
5. Verify game formats maintain consistent theming

## 🔍 Quick Reference: Student Interface Components
- **Entry**: LoginForm.css, RegisterForm.css
- **Dashboard**: StudentDashboard.css, PerformanceStats.css, RecentQuizzes.css
- **Quiz Core**: QuizSession.css, QuizSessionQuestion.css, QuizThemeOverride.css
- **Questions**: QuestionWrapper.css + individual question type CSS files
- **Games**: HangmanGame.css, KnowledgeTowerGame.css, etc.
- **Mobile**: MobileResponsive.css, MobileTouchInteractions.css
- **Points**: PointsDisplay.css