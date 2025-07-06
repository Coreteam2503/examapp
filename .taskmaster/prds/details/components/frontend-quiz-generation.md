# Frontend Quiz Generation Components

## QuizGeneratorForm Component

### Component Purpose
Form for selecting quiz generation criteria

### Props Interface
```typescript
interface QuizGeneratorFormProps {
  onGenerate: (criteria: QuizCriteria) => Promise<void>;
  loading?: boolean;
  availableOptions?: {
    domains: string[];
    subjects: string[];
    sources: string[];
  };
}
```

### Form Fields
- Domain dropdown/autocomplete with available domains
- Subject dropdown filtered by selected domain
- Source dropdown filtered by domain + subject
- Game format selection (knowledge_tower, hangman, ladder)
- Difficulty level selection (Easy, Medium, Hard)
- Number of questions input (1-50)

### State Management
```typescript
interface QuizGeneratorState {
  criteria: QuizCriteria;
  availableSubjects: string[];
  availableSources: string[];
  isGenerating: boolean;
  generationError: string | null;
}
```

### Validation Logic
- Required field validation
- Number of questions range validation
- Check available questions count before generation
- Real-time availability feedback

### UI Features
- Progressive dropdown filtering
- Question availability indicator
- Game format descriptions with icons
- Form reset functionality
- Error handling with retry options

### Integration Points
- Uses questionService to get available options
- Uses quizService for quiz generation
- Navigates to quiz game component on success

### File References
- Component: `/frontend/src/components/quiz/QuizGeneratorForm.jsx`
- Service: `/frontend/src/services/quizService.js`
- Types: `/frontend/src/types/quizTypes.ts`

## QuizCriteriaSelector Component

### Component Purpose
Reusable component for domain/subject/source selection

### Features
- Cascading dropdown behavior
- Search/filter within options
- Clear selection functionality
- Loading states during data fetch

### File References
- Component: `/frontend/src/components/quiz/QuizCriteriaSelector.jsx`
