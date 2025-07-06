# Quiz API Migration - Business PRD

## Executive Summary

Migrate from file-upload + LLM-generated quiz system to a **Question Bank + Dynamic Quiz Generation** system. Users will input questions via JSON to build a question bank, then generate quizzes on-the-fly based on filtering criteria (domain, subject, source, game format).

## Problem Statement

The current quiz system requires users to upload files (.ipynb, .pdf) which are processed by LLM to generate quiz questions. This approach has several limitations:
- Dependency on LLM services for quiz generation
- Complex file processing pipeline
- Users have limited control over generated content
- File upload constraints and processing delays
- Inconsistent question quality from LLM generation
- No reusability of questions across different quiz contexts

## Business Objectives

### Primary Goals
- Enable direct question bank creation through JSON batch input
- Generate quizzes dynamically based on user-selected criteria
- Eliminate dependency on file uploads and LLM processing
- Standardize question formats across all game types
- Enable question reusability across multiple quiz sessions
- Simplify both question creation and quiz generation workflows

### Success Metrics
- Users can bulk-add questions to question bank via JSON input
- Dynamic quiz generation based on domain/subject/source filters
- All 5 universal question types supported (mcq, true_false, fill_blank, matching, ordering)
- All 3 game formats supported (knowledge_tower, hangman, ladder)
- Zero dependency on file uploads for new question creation
- Questions can be reused across multiple quiz attempts

## User Stories

### Question Bank Creator
- As a question creator, I want to input multiple questions via JSON batch so I can efficiently build a question bank
- As a question creator, I want to specify domain, subject, and source metadata for each question
- As a question creator, I want to create all 5 question types (MCQ, True/False, Fill Blanks, Matching, Ordering) in one batch
- As a question creator, I want immediate feedback if my JSON format is invalid

### Quiz Taker (Student)  
- As a student, I want to generate a quiz by selecting domain, subject, source, and game format
- As a student, I want to specify number of questions and difficulty level
- As a student, I want to receive an error message if not enough questions are available for my criteria
- As a student, I want consistent question presentation across all game formats

### System Administrator
- As an admin, I want to manage the question bank and view question statistics
- As an admin, I want to ensure backward compatibility with existing quiz functionality

## Functional Requirements

### Question Bank Management

#### Batch Question Creation (POST API)
- Accept JSON array with multiple questions and metadata
- Validate JSON schema against universal question format
- Support all 5 question types with exact format requirements
- Store questions with metadata: domain, subject, source, question_type, hint, weightage, difficulty_level
- Return success/failure status with validation results

#### Question Bank Search (GET API)
- Search and filter questions by domain, subject, source, difficulty_level
- Support pagination for large question sets
- Return questions in universal format

### Dynamic Quiz Generation

#### Quiz Generation (POST API)
- Accept quiz criteria: domain, subject, source, game_format, difficulty_level, num_questions
- Query question bank with random selection from matching criteria
- Generate quiz response in exact frontend format
- Return error if insufficient questions available
- Include game-specific metadata and options

### Question Format Support
All questions must include base metadata:
- Domain, Subject, Source, Question_Type, Hint, Weightage, Difficulty_Level

Question type-specific formats:
- MCQ: question, options array, correct_answer, explanation
- True/False: question, correct_answer boolean, explanation  
- Fill Blank: question, text template, blanks object, explanation
- Matching: question, pairs array with left/right objects, explanation
- Ordering: question, items array, correct_sequence array, explanation

## Technical Requirements

### Database Design
- Use existing enhanced questions table schema with additional metadata fields
- Add fields: domain, subject, source, hint, weightage, difficulty_level
- Maintain support for all 5 universal question types
- No quiz storage - questions only
- Index fields for efficient filtering (domain, subject, source, difficulty_level)

### API Endpoints
- POST /api/questions/bulk - Batch create questions in question bank
- GET /api/questions/search - Search/filter questions by metadata
- POST /api/quizzes/generate - Generate quiz dynamically from criteria
- JSON schema validation with detailed error messages
- Proper HTTP status codes and error handling

### Data Validation
- Strict JSON schema validation for question input
- Required field validation for each question type
- Metadata validation (domain, subject, source as required fields)
- Game format validation (knowledge_tower, hangman, ladder only)
- Question type validation (mcq, true_false, fill_blank, matching, ordering only)

## Non-Functional Requirements

### Performance
- Batch question creation should complete within 5 seconds for 100 questions
- Quiz generation should complete within 2 seconds
- Question search should complete within 1 second
- Support concurrent quiz generation by multiple users

### Reliability
- Validate all input data before database storage
- Atomic operations for batch question creation
- Rollback capability if any question in batch fails validation
- Graceful handling when insufficient questions available for quiz criteria

### Maintainability
- Clean separation between question bank management and quiz generation
- Consistent error message formats
- Comprehensive input validation
- Efficient database queries with proper indexing

## User Flows

### Question Bank Creation Flow
1. User prepares JSON array with multiple questions + metadata
2. User submits to POST /api/questions/bulk endpoint
3. System validates JSON schema and question formats
4. System stores valid questions, returns validation results
5. User receives confirmation with success/failure details

### Quiz Generation Flow
1. User selects quiz criteria (domain, subject, source, game_format, difficulty, num_questions)
2. User submits to POST /api/quizzes/generate endpoint
3. System queries question bank with filtering criteria
4. System randomly selects questions from matching results
5. System generates quiz response in universal format
6. User receives quiz or "insufficient questions" error

## Out of Scope

### Phase 1 Exclusions
- Migration of existing file-upload generated quizzes
- Question editing after creation
- File upload functionality removal (kept for backward compatibility)
- LLM service integration removal
- Question bank analytics and reporting
- User permissions for question bank access

### Future Considerations
- Question editing capabilities
- Question bank analytics and usage statistics
- User permissions and question ownership
- Question templates and reusable components
- Advanced filtering and search capabilities
- Question quality scoring and feedback

## Dependencies

### Frontend Dependencies
- JSON input form component for batch question creation
- Quiz criteria selection form (domain, subject, source, game format, difficulty, num_questions)
- Error handling and validation message display
- Question bank search and management interface

### Backend Dependencies
- Database schema updates for additional metadata fields
- JSON schema validation library integration
- Efficient database indexing for question filtering
- Random question selection algorithms
- New API endpoint implementations

### External Dependencies
- No external service dependencies (major benefit vs current LLM approach)

## Risk Assessment

### Technical Risks
- Database performance with large question banks (Mitigated: Proper indexing strategy)
- Random selection fairness across question types (Mitigated: Balanced selection algorithms)
- JSON validation complexity for batch operations (Mitigated: Clear schema definition)

### Business Risks
- User adoption of JSON batch input format (Mitigated: Provide examples and templates)
- Question quality without LLM assistance (Mitigated: Clear format guidelines)
- Insufficient questions for specific criteria (Mitigated: Clear error messaging)

## Acceptance Criteria

### Must Have
- Users can batch-create questions via JSON input
- Dynamic quiz generation based on domain/subject/source criteria
- All 5 question types work correctly in all 3 game formats
- Random question selection from matching criteria
- Clear error when insufficient questions available
- Database stores normalized question data with metadata

### Should Have
- JSON syntax highlighting and validation in UI
- Example templates for each question type
- Question bank search and filter capabilities
- Performance monitoring for new endpoints
- Question count statistics per domain/subject/source

### Could Have
- Question bank analytics dashboard
- Question usage tracking
- Bulk question export capabilities
- Advanced search with multiple criteria

## Timeline

### Phase 1 (MVP)
- Week 1: Database schema updates and question bank API endpoints
- Week 2: Dynamic quiz generation logic and validation implementation  
- Week 3: Frontend integration for question input and quiz generation
- Week 4: Testing, performance optimization, and documentation

## File References

### Current System Analysis
- Frontend mock data: `/frontend/src/data/mockQuestions.js`
- Frontend helper: `/frontend/src/data/mockDataHelper.js`
- Current API: `/backend/src/controllers/quizController.js`
- Database models: `/backend/src/models/Question.js`, `/backend/src/models/Quiz.js`
- Migration files: `/backend/src/migrations/`

### Implementation Targets
- Question controller: `/backend/src/controllers/questionController.js` (new)
- Quiz controller: `/backend/src/controllers/quizController.js` (update existing)
- Database schema: `/backend/src/migrations/` (new migration file)
- Frontend question form: `/frontend/src/components/questions/` (new component)
- Frontend quiz generator: `/frontend/src/components/quiz/` (new component)
- API service: `/frontend/src/services/questionService.js` (new)
- API service: `/frontend/src/services/quizService.js` (update existing)

## Sample Data Structures

### Question Input JSON Format
```json
[
  {
    "domain": "Coding",
    "subject": "Python", 
    "source": "ABC.py",
    "question_type": "Match the following",
    "type": "matching",
    "question": "Match Python data types with examples:",
    "pairs": [
      { "left": "String", "right": "\"Hello\"" },
      { "left": "Integer", "right": "42" }
    ],
    "explanation": "Basic Python data types",
    "hint": "Think about data representation",
    "weightage": 1,
    "difficulty_level": "Easy"
  }
]
```

### Quiz Generation Request
```json
{
  "domain": "Coding",
  "subject": "Python",
  "source": "ABC.py", 
  "game_format": "knowledge_tower",
  "difficulty_level": "Easy",
  "num_questions": 5
}
```

### Quiz Generation Response
```json
{
  "id": "generated_quiz_123",
  "title": "Python Quiz - ABC.py",
  "game_format": "knowledge_tower",
  "total_questions": 5,
  "criteria": {
    "domain": "Coding",
    "subject": "Python",
    "source": "ABC.py",
    "difficulty_level": "Easy"
  },
  "questions": [
    // Array of 5 questions in universal format
  ],
  "metadata": {
    "totalQuestions": 5,
    "gameOptions": {
      "levelsCount": 5,
      "maxWrongGuesses": 3
    }
  }
}
```
