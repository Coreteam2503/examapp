# Question Bank API Specifications

## POST /api/questions/bulk

**Purpose**: Batch create questions in question bank
**Authentication**: JWT required
**Content-Type**: application/json

### Request Schema
```
{
  questions: [
    {
      domain: string (required),
      subject: string (required), 
      source: string (required),
      question_type: string (required),
      type: enum ["mcq", "true_false", "fill_blank", "matching", "ordering"] (required),
      question: string (required),
      explanation: string (required),
      hint: string (optional),
      weightage: number (default: 1),
      difficulty_level: enum ["Easy", "Medium", "Hard"] (required),
      
      // Type-specific fields
      options: array (required for mcq),
      correct_answer: string|boolean (required),
      text: string (required for fill_blank),
      blanks: object (required for fill_blank),
      pairs: array (required for matching),
      items: array (required for ordering),
      correct_sequence: array (required for ordering)
    }
  ]
}
```

### Response Schema
```
{
  success: boolean,
  created: number,
  failed: number,
  errors: [
    {
      questionIndex: number,
      field: string,
      message: string
    }
  ]
}
```

### Error Codes
- 400: Invalid JSON schema
- 401: Authentication required
- 422: Validation errors
- 500: Database error

## GET /api/questions/search

**Purpose**: Search and filter questions by metadata
**Authentication**: JWT required

### Query Parameters
- domain: string (optional)
- subject: string (optional)
- source: string (optional)
- difficulty_level: string (optional)
- type: string (optional)
- page: number (default: 1)
- limit: number (default: 20, max: 100)

### Response Schema
```
{
  questions: [
    {
      id: number,
      domain: string,
      subject: string,
      source: string,
      type: string,
      question: string,
      // Type-specific fields based on question type
      difficulty_level: string,
      created_at: timestamp
    }
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### Business Logic
- Return questions in universal frontend format
- Support multiple filter combinations
- Efficient database queries with proper indexing
- Pagination for large result sets

### File References
- Implementation: `/backend/src/controllers/questionController.js`
- Model: `/backend/src/models/Question.js`
- Routes: `/backend/src/routes/questionRoutes.js`
