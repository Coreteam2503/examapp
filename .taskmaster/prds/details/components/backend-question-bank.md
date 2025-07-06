# Backend Question Bank Components

## QuestionController

### Controller Purpose
Handle HTTP requests for question bank management

### Key Methods
```javascript
class QuestionController {
  async bulkCreate(req, res) {
    // Validate JWT authentication
    // Parse and validate JSON questions array
    // Use transaction for atomic batch creation
    // Return detailed success/failure results
  }
  
  async search(req, res) {
    // Parse query parameters with defaults
    // Build database query with filters
    // Apply pagination
    // Return questions in universal format
  }
  
  async getStats(req, res) {
    // Return question count statistics
    // Group by domain, subject, source, difficulty
  }
}
```

### Middleware Integration
- JWT authentication middleware
- Request validation middleware
- Error handling middleware
- Rate limiting for bulk operations

### Error Handling
- Structured error responses
- Validation error details with field mapping
- Database constraint error handling
- Bulk operation partial failure handling

### File References
- Controller: `/backend/src/controllers/questionController.js`
- Routes: `/backend/src/routes/questionRoutes.js`
- Middleware: `/backend/src/middleware/questionValidation.js`

## QuestionValidationService

### Service Purpose
Comprehensive validation for question input data

### Key Features
- JSON schema validation using AJV
- Type-specific validation rules
- Batch validation with detailed error reporting
- Data sanitization and normalization

### Validation Rules
- Required field validation for each question type
- Format validation for options, pairs, items arrays
- Cross-field validation (e.g., correct_answer must be in options)
- Domain/subject/source format validation

### File References
- Service: `/backend/src/services/questionValidationService.js`
- Schemas: `/backend/src/schemas/questionSchemas.js`

## Question Model Enhancement

### Model Purpose
Database operations for enhanced questions table

### Key Methods
```javascript
class Question {
  static async bulkCreate(questionsData) {
    // Batch insert with transaction
    // Handle duplicate detection
    // Return created question IDs
  }
  
  static async searchWithFilters(criteria, pagination) {
    // Build dynamic query with filters
    // Apply efficient indexes
    // Return paginated results
  }
  
  static async getStatistics(userId) {
    // Return question count by metadata
    // Domain/subject/source distributions
  }
}
```

### File References
- Model: `/backend/src/models/Question.js`
- Migration: `/backend/src/migrations/011_enhance_questions_for_question_bank.js`
