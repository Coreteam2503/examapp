# ExamApp Project Structure Documentation - Updated & Accurate

## Project Overview

ExamApp is a comprehensive AI-powered educational platform that enables students to upload code files and automatically generate interactive quizzes. The system uses Large Language Models (LLMs) to analyze uploaded content and create various types of questions including multiple-choice, fill-in-the-blank, true/false, and matching questions.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: **PostgreSQL** with Knex.js ORM *(Changed from SQLite)*
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **AI Integration**: Anthropic Claude AI *(Primary)*, OpenAI API (optional)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Routing**: React Router DOM v7.6.1
- **Styling**: Tailwind CSS v4.1.8
- **UI Components**: Headless UI v2.2.4, Heroicons v2.2.0
- **HTTP Client**: Axios
- **Code Editor**: CodeMirror with JSON and One Dark theme
- **Testing**: Jest, React Testing Library

## Directory Structure

```
examApp/
├── .roo/                          # Roo AI debugger configuration
├── .taskmaster/                   # TaskMaster AI configuration and tasks
├── backend/                       # Node.js backend application
│   ├── src/
│   │   ├── config/               # Database and app configuration (PostgreSQL)
│   │   ├── controllers/          # API route handlers
│   │   │   ├── BatchController.js      # Batch management with criteria
│   │   │   ├── quizController.js       # Quiz generation and management
│   │   │   ├── questionController.js   # Question bank management
│   │   │   └── userController.js       # User management
│   │   ├── middleware/           # Custom middleware (auth, validation)
│   │   ├── migrations/           # Database migration files (21+ migrations)
│   │   ├── models/              # Data models and database schemas
│   │   │   ├── Batch.js              # Batch management with quiz criteria
│   │   │   ├── Quiz.js               # Quiz operations
│   │   │   ├── Question.js           # Question bank operations
│   │   │   └── User.js               # User operations
│   │   ├── routes/              # API route definitions
│   │   │   ├── batches.js            # Batch and criteria management routes
│   │   │   ├── quizzes.js            # Quiz routes
│   │   │   └── users.js              # User routes
│   │   ├── services/            # Business logic services
│   │   │   └── quizGenerationService.js # Dynamic quiz generation
│   │   ├── utils/               # Helper functions
│   │   └── server.js            # Main server entry point
│   ├── data/                    # Database files (if using SQLite locally)
│   ├── uploads/                 # Uploaded files storage
│   ├── services/                # Additional backend services
│   ├── init-db.js              # Database initialization script
│   ├── knexfile.js             # Knex database configuration (PostgreSQL)
│   ├── .env                    # Environment variables (PostgreSQL config)
│   └── package.json            # Backend dependencies
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   │   ├── BatchManagement.js      # Main batch management
│   │   │   │   ├── BatchCard.js            # Individual batch display
│   │   │   │   ├── BatchCriteriaForm.js    # Criteria selection form
│   │   │   │   ├── BatchFormModal.js       # Create/edit batch modal
│   │   │   │   └── BatchCriteriaModal.js   # Criteria editing modal
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── common/          # Shared components
│   │   │   ├── dashboard/       # Student dashboard components
│   │   │   │   ├── StudentDashboard.jsx    # Main student dashboard
│   │   │   │   ├── StudentBatchDisplay.js  # Batch info display
│   │   │   │   ├── QuickActions.js         # Dashboard quick actions
│   │   │   │   └── RecentQuizzes.js        # Recent quiz history
│   │   │   ├── student/         # Student-specific components
│   │   │   │   └── StudentBatchSelection.js # Batch selection interface
│   │   │   ├── games/           # Game-based quiz components
│   │   │   ├── quiz/            # Quiz-related components
│   │   │   └── (other component directories)
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.js         # Authentication context
│   │   │   └── BatchContext.js        # Batch management context
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useBatchCriteria.js    # Batch criteria management hook
│   │   ├── services/            # API service functions
│   │   │   ├── apiService.js          # Base API service
│   │   │   └── batchService.js        # Batch-specific API calls
│   │   ├── utils/               # Frontend utility functions
│   │   ├── App.js              # Main App component (JavaScript)
│   │   ├── App.tsx             # Main App component (TypeScript)
│   │   └── index.tsx           # Application entry point
│   ├── public/                  # Static assets
│   ├── build/                   # Production build output
│   ├── .env                    # Frontend environment variables
│   ├── .env.production         # Production environment variables
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json            # Frontend dependencies
├── deployment_scripts/          # Production deployment utilities
│   ├── ps/                      # PowerShell scripts for Windows
│   └── sh/                      # Shell scripts for Unix/Linux
├── scripts/                     # General utility scripts
├── docs/                        # Project documentation
│   └── PROJECT_STRUCTURE.md    # This documentation file
├── tests/                       # Test files
├── e2e-tests/                   # End-to-end tests
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── .roomodes                   # Roo debugger modes configuration
└── deploy.sh                   # Main deployment script
```

## Database Schema & Key Features

### Database Configuration
- **Primary Database**: PostgreSQL (configured in backend/.env)
- **Connection Details**: Remote PostgreSQL server at 13.234.76.120:5432
- **Database Name**: mydb
- **ORM**: Knex.js with 21+ migration files

### Core Tables
1. **users** - User authentication and profile data
2. **uploads** - File upload tracking and metadata
3. **quizzes** - Quiz definitions and settings
4. **questions** - Individual quiz questions with multiple types
5. **quiz_attempts** - User quiz session tracking
6. **answers** - User responses to quiz questions
7. **batches** - Learning batch management *(New)*
8. **user_batches** - User-batch relationships *(New)*
9. **quiz_batches** - Quiz-batch relationships *(New)*
10. **question_batches** - Question-batch relationships *(New)*

### New Batch Management System
- **Batch Criteria**: JSON-based quiz assignment criteria
- **Auto-Assignment**: Quizzes automatically assigned to matching batches
- **Criteria Validation**: Real-time validation of batch criteria
- **Question Preview**: Preview questions matching criteria before saving

## Key Features Implemented

### Batch Management System *(New Major Feature)*
- **Dynamic Criteria Selection**: Dropdowns populated from actual database data
- **Real-time Validation**: Immediate feedback on criteria validity
- **Question Preview**: See matching questions before saving criteria
- **Auto-Assignment**: Quizzes automatically assigned to matching batches
- **Admin Interface**: Complete batch management with criteria setting
- **Student Interface**: Clean batch information display (no quiz actions)

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control (Student/Admin)
- Protected routes and middleware

### File Management
- Secure file upload with validation
- Drag-and-drop interface
- File type restrictions and security scanning
- Upload progress tracking

### Quiz System
- **Question Types Supported:**
  - Multiple Choice
  - Fill-in-the-Blank
  - True/False
  - Matching Pairs
  - Drag & Drop Ordering
- AI-powered quiz generation from uploaded code
- Dynamic quiz generation from question bank
- Interactive quiz interface
- Real-time scoring and results
- Mobile-responsive design

## API Endpoints

### Batch Management *(New)*
- `GET /api/batches/criteria-options` - Get dropdown options for criteria
- `POST /api/batches/validate-criteria` - Validate batch criteria
- `POST /api/batches/preview-questions` - Preview questions matching criteria  
- `PUT /api/batches/:id/criteria` - Update batch criteria
- `GET /api/batches/:id/quizzes` - Get quizzes available to batch

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### File Management
- `POST /api/upload` - Upload files
- `GET /api/uploads` - List user uploads

### Quiz System
- `POST /api/quizzes/generate` - Generate quiz from upload
- `POST /api/quizzes/generate-dynamic` - Generate quiz from question bank
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/assign-batches` - Assign quiz to batches (admin)
- `DELETE /api/quizzes/:id/remove-batch/:batchId` - Remove quiz from batch

### User Management
- `GET /api/users/:userId/batches` - Get user's batches (fixed visibility bug)

## Environment Configuration

### Backend (.env)
```
DB_HOST=13.234.76.120
DB_PORT=5432
DB_NAME=mydb
DB_USER=myuser
DB_PASSWORD=123123
ANTHROPIC_API_KEY=your_claude_api_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```

## Recent Changes & Bug Fixes

### Fixed Issues
1. **Batch Visibility Bug**: Users can now see newly assigned batches correctly
2. **Quiz Controller Exports**: Fixed missing method exports for batch assignment
3. **Quiz-Question Associations**: Fixed quiz creation to properly link questions

### UI Cleanup
1. **Student UI**: Removed "Take Quiz" and "View Progress" buttons from batch displays
2. **Admin UI**: Removed "Users" button from batch management cards
3. **Simplified Interface**: Cleaner, more focused user experience

### Code Quality Improvements
1. **Separation of Concerns**: Broke down large components into smaller, focused ones
2. **Component Architecture**: Better organized component hierarchy
3. **Error Handling**: Improved error handling and user feedback

## Development Status

### Recently Completed
- ✅ **Batch Criteria System**: Complete implementation with dynamic dropdowns
- ✅ **UI Cleanup**: Removed unnecessary buttons and simplified interface
- ✅ **Bug Fixes**: Fixed batch visibility and quiz assignment issues
- ✅ **Component Refactoring**: Improved code organization with SOC principles
- ✅ **Real-time Validation**: Added criteria validation with immediate feedback

### Current State
- **Database**: PostgreSQL with 21+ migration files
- **Frontend**: React 19.1.0 with TypeScript support
- **Backend**: Express.js with comprehensive API
- **Testing**: Multiple test files and verification scripts

## Development Scripts

### Backend
- `npm start` - Production server (port 8000)
- `npm run dev` - Development with nodemon
- `npm run migrate` - Run database migrations

### Frontend  
- `npm start` - Development server (port 3000)
- `npm run build` - Production build
- `npm test` - Run tests

## Notes

### Missing/Deprecated Elements
- `.taskmasterconfig` - Not found in current structure
- TaskMaster AI progress tracking - Not actively maintained
- SQLite references - Project now uses PostgreSQL

### Current Focus
- Batch management and criteria system is fully implemented
- UI has been cleaned up and simplified
- Bug fixes have been applied and verified
- Component architecture follows SOC principles

---

**Last Updated**: January 2025  
**Database**: PostgreSQL (Remote)  
**Status**: Active Development with Recent Major Feature Completion