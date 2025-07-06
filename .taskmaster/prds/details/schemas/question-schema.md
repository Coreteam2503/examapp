# Question Schema Validation

## JSON Schema for Question Input

### Base Question Schema
```javascript
const baseQuestionSchema = {
  type: "object",
  required: ["domain", "subject", "source", "question_type", "type", "question", "explanation", "difficulty_level"],
  properties: {
    domain: { type: "string", minLength: 1, maxLength: 255 },
    subject: { type: "string", minLength: 1, maxLength: 255 },
    source: { type: "string", minLength: 1, maxLength: 255 },
    question_type: { type: "string", minLength: 1 },
    type: { enum: ["mcq", "true_false", "fill_blank", "matching", "ordering"] },
    question: { type: "string", minLength: 1 },
    explanation: { type: "string", minLength: 1 },
    hint: { type: "string" },
    weightage: { type: "integer", minimum: 1, default: 1 },
    difficulty_level: { enum: ["Easy", "Medium", "Hard"] }
  }
};
```

### MCQ Question Schema
```javascript
const mcqSchema = {
  ...baseQuestionSchema,
  required: [...baseQuestionSchema.required, "options", "correct_answer"],
  properties: {
    ...baseQuestionSchema.properties,
    options: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string", minLength: 1 }
    },
    correct_answer: { type: "string", minLength: 1 }
  }
};
```

### True/False Question Schema
```javascript
const trueFalseSchema = {
  ...baseQuestionSchema,
  required: [...baseQuestionSchema.required, "correct_answer"],
  properties: {
    ...baseQuestionSchema.properties,
    correct_answer: { type: "boolean" }
  }
};
```

### Fill Blank Question Schema
```javascript
const fillBlankSchema = {
  ...baseQuestionSchema,
  required: [...baseQuestionSchema.required, "text", "blanks"],
  properties: {
    ...baseQuestionSchema.properties,
    text: { type: "string", minLength: 1 },
    blanks: {
      type: "object",
      patternProperties: {
        "^[0-9]+$": {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 }
        }
      }
    }
  }
};
```

### Validation Implementation
- Use AJV library for JSON schema validation
- Custom validation functions for type-specific requirements
- Batch validation with detailed error reporting
- Pre-validation sanitization and normalization

### File References
- Validation service: `/backend/src/services/questionValidationService.js`
- Schema definitions: `/backend/src/schemas/questionSchemas.js`
