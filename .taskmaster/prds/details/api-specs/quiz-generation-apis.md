# Quiz Generation API Specifications

## POST /api/quizzes/generate

**Purpose**: Generate quiz dynamically from criteria
**Authentication**: JWT required
**Content-Type**: application/json

### Request Schema
```
{
  domain: string (required),
  subject: string (required),
  source: string (required),
  game_format: enum ["knowledge_tower", "hangman", "ladder"] (required),
  difficulty_level: enum ["Easy", "Medium", "Hard"] (required),
  num_questions: number (required, min: 1, max: 50)
}
```

### Response Schema
```
{
  id: string (generated),
  title: string (auto-generated from criteria),
  game_format: string,
  total_questions: number,
  criteria: {
    domain: string,
    subject: string,
    source: string,
    difficulty_level: string
  },
  questions: [
    {
      id: string,
      type: string,
      question: string,
      // Type-specific fields in exact frontend format
      explanation: string,
      category: string,
      difficulty: string
    }
  ],
  metadata: {
    totalQuestions: number,
    gameOptions: {
      // Game-specific options based on game_format
    }
  }
}
```

### Error Codes
- 400: Invalid request parameters
- 401: Authentication required
- 404: Insufficient questions available
- 422: Invalid game format or criteria
- 500: Database error

### Business Logic
- Query questions table with filtering criteria
- Random selection from matching questions
- Generate game-specific metadata and options
- Return questions in exact universal frontend format
- Handle insufficient questions scenario gracefully

### Game Options Generation
- knowledge_tower: { levelsCount: num_questions, maxWrongGuesses: 3 }
- hangman: { maxWrongGuesses: 6 }
- ladder: { maxSteps: num_questions * 2 }

### File References
- Implementation: `/backend/src/controllers/quizController.js`
- Model: `/backend/src/models/Question.js`
- Service: `/backend/src/services/quizGenerationService.js`
- Routes: `/backend/src/routes/quizRoutes.js`
