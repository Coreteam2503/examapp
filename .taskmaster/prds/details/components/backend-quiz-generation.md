# Backend Quiz Generation Components

## QuizController Enhancement

### Controller Purpose
Handle dynamic quiz generation from question bank

### Key Methods
```javascript
class QuizController {
  async generateQuiz(req, res) {
    // Validate quiz generation criteria
    // Query question bank with filters
    // Perform random selection
    // Format response in universal format
    // Generate game-specific metadata
  }
  
  async getAvailableOptions(req, res) {
    // Return available domains, subjects, sources
    // With question counts for each option
  }
  
  async checkAvailability(req, res) {
    // Check if enough questions exist for criteria
    // Return availability status and count
  }
}
```

### Quiz Generation Logic
- Build database query from criteria
- Apply random selection algorithm
- Ensure question type diversity when possible
- Generate unique quiz ID for tracking
- Format questions in exact frontend format

### File References
- Controller: `/backend/src/controllers/quizController.js` (update existing)
- Service: `/backend/src/services/quizGenerationService.js` (new)
- Routes: `/backend/src/routes/quizRoutes.js` (update existing)

## QuizGenerationService

### Service Purpose
Core business logic for dynamic quiz generation

### Key Features
```javascript
class QuizGenerationService {
  async generateQuiz(criteria) {
    // Query questions with filtering
    // Apply random selection algorithm
    // Ensure minimum question requirements
    // Format questions for frontend
    // Generate game-specific options
  }
  
  async getQuestionCounts(criteria) {
    // Return available question counts
    // Grouped by type and difficulty
  }
  
  randomSelection(questions, count) {
    // Implement fair random selection
    // Maintain question type distribution
    // Avoid duplicate selections
  }
}
```

### Selection Algorithm
- Fisher-Yates shuffle for randomization
- Balanced selection across question types when possible
- Fallback to available questions if insufficient for balance
- Preference for specified difficulty level

### Game Options Generation
```javascript
const gameOptionsMap = {
  knowledge_tower: (count) => ({
    levelsCount: count,
    maxWrongGuesses: 3
  }),
  hangman: (count) => ({
    maxWrongGuesses: 6
  }),
  ladder: (count) => ({
    maxSteps: count * 2
  })
};
```

### File References
- Service: `/backend/src/services/quizGenerationService.js`
- Utilities: `/backend/src/utils/randomSelection.js`
