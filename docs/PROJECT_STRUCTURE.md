# ExamApp Project Structure Documentation - Updated

## Project Overview

ExamApp is a comprehensive AI-powered educational platform that enables students to upload code files and automatically generate interactive quizzes. The system uses Large Language Models (LLMs) to analyze uploaded content and create various types of questions including multiple-choice, fill-in-the-blank, true/false, and matching questions.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Knex.js ORM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **AI Integration**: OpenAI API (GPT models)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Routing**: React Router DOM v7.6.1
- **Styling**: Tailwind CSS v4.1.8
- **UI Components**: Headless UI, Heroicons
- **HTTP Client**: Axios
- **Testing**: Jest, React Testing Library

### Development Tools
- **Task Management**: TaskMaster AI (61.67% complete - 37/60 tasks done)
- **Version Control**: Git
- **Package Management**: npm
- **Development Server**: Create React App
- **Backend Development**: Nodemon
- **Debugging**: Roo AI specialized debugger

## Directory Structure

```
examApp/
├── .roo/                          # Roo AI debugger configuration
│   └── (configuration files)
├── .cursor/                       # Cursor IDE settings
├── backend/                       # Node.js backend application
│   ├── src/
│   │   ├── config/               # Database and app configuration
│   │   ├── controllers/          # API route handlers
│   │   ├── middleware/           # Custom middleware (auth, validation)
│   │   ├── migrations/           # Database migration files
│   │   ├── models/              # Data models and database schemas
│   │   ├── routes/              # API route definitions
│   │   ├── scripts/             # Utility scripts
│   │   ├── services/            # Business logic services
│   │   ├── utils/               # Helper functions
│   │   └── server.js            # Main server entry point
│   ├── data/                    # Database files
│   ├── uploads/                 # Uploaded files storage
│   ├── backups/                 # Database backups
│   ├── services/                # Additional backend services
│   ├── init-db.js              # Database initialization script
│   ├── knexfile.js             # Knex database configuration
│   ├── restart_trigger.js       # Server restart trigger utility
│   └── package.json             # Backend dependencies
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── dashboard/       # Student dashboard components
│   │   │   └── quiz/            # Quiz-related components
│   │   ├── contexts/            # React contexts (auth, etc.)
│   │   ├── services/            # API service functions
│   │   ├── utils/               # Frontend utility functions
│   │   ├── App.tsx              # Main App component
│   │   ├── App.js               # JavaScript version of App component
│   │   └── index.tsx            # Application entry point
│   ├── public/                  # Static assets
│   ├── build/                   # Production build output
│   ├── debug-localstorage.js    # LocalStorage debugging utility
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Frontend dependencies
├── deployment_scripts/          # Production deployment utilities
│   ├── ps/                      # PowerShell scripts for Windows
│   │   ├── deps_manager.ps1     # Dependency management
│   │   ├── health_checker.ps1   # Health monitoring
│   │   ├── port_manager.ps1     # Port management
│   │   ├── process_manager.ps1  # Process management
│   │   ├── restart.ps1          # Service restart
│   │   ├── restart.bat          # Batch restart script
│   │   ├── service_starter.ps1  # Service startup
│   │   ├── service_starter.bat  # Batch service starter
│   │   ├── status.ps1           # Status checking
│   │   ├── status.sh            # Unix status script
│   │   └── stop.ps1             # Service stop
│   ├── sh/                      # Shell scripts for Unix/Linux
│   │   ├── deps_manager.sh      # Dependency management
│   │   ├── health_checker.sh    # Health monitoring
│   │   ├── port_manager.sh      # Port management
│   │   ├── process_manager.sh   # Process management
│   │   ├── restart.sh           # Service restart
│   │   ├── service_starter.sh   # Service startup
│   │   └── stop.sh              # Service stop
│   ├── README.md                # Deployment documentation
│   └── README_Windows.md        # Windows-specific deployment docs
├── scripts/                     # General utility scripts
├── tasks/                       # TaskMaster AI task files
├── logs/                        # Application logs
├── gitcommandsforreference/     # Git command reference files
├── .taskmasterconfig           # TaskMaster AI configuration
├── .roomodes                   # Roo debugger modes configuration
├── .windsurfrules              # Windsurf IDE rules
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── PROJECT_STRUCTURE.md        # This documentation file
└── deploy.sh                   # Main deployment script
```

## Database Schema

### Core Tables
1. **users** - User authentication and profile data
2. **uploads** - File upload tracking and metadata
3. **quizzes** - Quiz definitions and settings
4. **questions** - Individual quiz questions with multiple types
5. **quiz_attempts** - User quiz session tracking
6. **answers** - User responses to quiz questions

### Migration Files
- `001_create_users_table.js` - Basic user management
- `002_create_uploads_table.js` - File upload tracking
- `003_create_quiz_tables.js` - Core quiz functionality
- `004_fix_quiz_schema.js` - Schema improvements
- `005_enhance_questions_table.js` - Enhanced question types

## Key Features Implemented

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
- AI-powered quiz generation from uploaded code
- Interactive quiz interface with Duolingo-inspired UI
- Real-time scoring and results
- Mobile-responsive design

### Admin Dashboard
- Student management interface
- Analytics and performance tracking
- Report generation and export capabilities
- Usage statistics and trends

### Student Dashboard
- Personal progress tracking
- Quiz history and results
- Performance metrics
- Recent activity overview

## Development Tools Integration

### TaskMaster AI
- Project task management and tracking
- 60 total tasks identified across project lifecycle
- 37 completed tasks (61.67% completion rate)
- Automated progress tracking and dependency management

### Deployment Scripts
- **Windows Support**: PowerShell scripts in `deployment_scripts/ps/`
- **Unix/Linux Support**: Shell scripts in `deployment_scripts/sh/`
- **Features**: Process management, health monitoring, port management
- **Utilities**: Dependency management, service restart capabilities

## Current Development Status

### Completed (37/60 tasks - 61.67%)
- ✅ Project setup and environment configuration
- ✅ Database setup with SQLite and Knex.js
- ✅ Complete authentication system
- ✅ File upload functionality with security
- ✅ LLM integration for quiz generation
- ✅ All quiz question types implementation
- ✅ Student and admin dashboards
- ✅ Analytics and reporting system
- ✅ Mobile-responsive design
- ✅ Security middleware and rate limiting
- ✅ Deployment script infrastructure

### In Progress/Pending (23/60 tasks)
- 🔄 Input validation and sanitization (in progress)
- ⏳ Advanced role management
- ⏳ Gamification features (points, badges, leaderboards)
- ⏳ Multi-language file processing
- ⏳ Performance optimizations
- ⏳ Error handling improvements
- ⏳ Production monitoring setup
- ⏳ Analytics API completion

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### File Management
- `POST /api/upload` - Upload files
- `GET /api/uploads` - List user uploads

### Quiz System
- `POST /api/quiz/generate` - Generate quiz from upload
- `GET /api/quiz/:id` - Get quiz details
- `POST /api/quiz/:id/attempt` - Submit quiz attempt
- `GET /api/quiz/results/:id` - Get quiz results

### Admin
- `GET /api/admin/students` - Get all students
- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/reports` - Generate reports

## Security Features

### Implemented
- Helmet.js for security headers
- CORS protection
- Rate limiting
- JWT token validation
- File upload validation and scanning
- Input sanitization (in progress)

### Backend Security Middleware
- Authentication middleware
- Role-based authorization
- File type validation
- Request rate limiting

## Environment Configuration

### Required Environment Variables
- `ANTHROPIC_API_KEY` - For Claude AI integration
- `OPENAI_API_KEY` - For GPT model access (optional)
- `PERPLEXITY_API_KEY` - For research capabilities (optional)
- Database configuration (SQLite by default)

### Development Setup
1. Install Node.js dependencies in both frontend and backend
2. Configure environment variables (.env files)
3. Run database migrations with `init-db.js`
4. Start backend server on port 8000
5. Start frontend development server on port 3000

## Deployment Architecture

### Development
- Frontend: `npm start` (port 3000)
- Backend: `npm run dev` (port 8000)
- Database: SQLite local file

### Production Deployment
- **Windows**: Use PowerShell scripts in `deployment_scripts/ps/`
- **Unix/Linux**: Use shell scripts in `deployment_scripts/sh/`
- **Main deployment**: Execute `deploy.sh` script
- **Health monitoring**: Automated health checks and restart triggers

### Production Considerations
- Database migration to PostgreSQL/MySQL recommended
- Environment-specific configurations
- Load balancing and scaling considerations
- Monitoring and logging setup

## Development Scripts

### Backend
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm test` - Run tests

### Frontend
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests

### Utility Scripts
- **Cross-platform deployment scripts**
- **Automated restart and health checking**
- **Port and process management utilities**
- **Dependency management automation**

## Project Management

### TaskMaster AI Integration
- 60 total tasks identified across project lifecycle
- 37 completed tasks (61.67% completion rate)
- Automated task generation from project requirements
- Progress tracking and dependency management
- AI-powered task analysis and recommendations

### Development Workflow
1. Use TaskMaster AI for task planning and tracking
2. Deploy using appropriate platform scripts
3. Monitor health using automated checking tools

## Notes on Missing Files
The current deployment infrastructure uses the organized scripts in `deployment_scripts/` instead.

