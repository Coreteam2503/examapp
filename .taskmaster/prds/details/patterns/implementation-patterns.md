# Implementation Patterns

## RESTful API Patterns

### Endpoint Naming Conventions
- POST /api/questions/bulk - Batch operations
- GET /api/questions/search - Search with query parameters
- POST /api/quizzes/generate - Dynamic generation
- GET /api/questions/options - Available metadata options

### Request/Response Patterns
- Consistent error response structure
- Standardized pagination format
- Uniform authentication handling
- Structured validation error messages

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: [
      {
        field: "questions[0].domain",
        message: "Domain is required"
      }
    ]
  }
}
```

## Database Patterns

### Repository Pattern Implementation
- Abstract database operations in model classes
- Consistent query building patterns
- Transaction handling for batch operations
- Efficient indexing for search operations

### Query Optimization Patterns
- Use composite indexes for multi-field filtering
- Implement query result caching for repeated searches
- Batch operations for bulk inserts
- Pagination with limit/offset patterns

## Frontend Patterns

### Component Architecture
- Container/Presentational component separation
- Custom hooks for API integration
- Shared validation logic between components
- Consistent error handling patterns

### State Management Patterns
- Local component state for form data
- Context for shared application state
- Custom hooks for API state management
- Debounced validation for real-time feedback

### Validation Patterns
- Schema-based validation using Yup or Joi
- Consistent error message formatting
- Real-time validation with debouncing
- Server-side validation mirroring client-side

## File References
- API patterns: `/backend/src/utils/apiPatterns.js`
- Database patterns: `/backend/src/utils/dbPatterns.js`
- Frontend hooks: `/frontend/src/hooks/`
- Validation utilities: `/frontend/src/utils/validation.js`
