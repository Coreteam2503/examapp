# Frontend Question Bank Components

## QuestionBankForm Component

### Component Purpose
React component for batch question input via JSON text area

### Props Interface
```typescript
interface QuestionBankFormProps {
  onSubmit: (questions: Question[]) => Promise<void>;
  onValidationError: (errors: ValidationError[]) => void;
  loading?: boolean;
}
```

### Component Features
- Large JSON text area with syntax highlighting
- Real-time JSON validation and error display
- Example templates for each question type
- Bulk validation before submission
- Progress indicator during submission
- Success/failure feedback with detailed error messages

### State Management
```typescript
interface QuestionBankFormState {
  jsonInput: string;
  validationErrors: ValidationError[];
  isValidating: boolean;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;
}
```

### Validation Logic
- Parse JSON input on change with debouncing
- Validate each question against type-specific schemas
- Display line-by-line error messages
- Prevent submission if validation errors exist
- Show question count and type distribution

### UI Elements
- CodeMirror or Monaco Editor for JSON input
- Collapsible example templates section
- Validation error panel with jump-to-line functionality
- Question type distribution preview
- Submit button with loading state

### Integration Points
- Uses questionService for API calls
- Integrates with global error handling
- Updates question bank statistics after successful submission

### File References
- Component: `/frontend/src/components/questions/QuestionBankForm.jsx`
- Service: `/frontend/src/services/questionService.js`
- Types: `/frontend/src/types/questionTypes.ts`

## QuestionBankSearch Component

### Component Purpose
Search and filter interface for question bank management

### Features
- Filter by domain, subject, source, difficulty, type
- Pagination controls for large result sets
- Question preview with expandable details
- Export selected questions functionality
- Question count statistics per filter

### File References
- Component: `/frontend/src/components/questions/QuestionBankSearch.jsx`
- Service: `/frontend/src/services/questionService.js`
