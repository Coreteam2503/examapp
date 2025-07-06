# Database Schema Specifications

## Enhanced Questions Table

### Migration Requirements
Add new fields to existing questions table:
- domain VARCHAR(255) NOT NULL
- subject VARCHAR(255) NOT NULL  
- source VARCHAR(255) NOT NULL
- hint TEXT
- weightage INTEGER DEFAULT 1
- difficulty_level ENUM('Easy', 'Medium', 'Hard') NOT NULL

### Complete Schema
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER, -- Keep for backward compatibility, nullable for question bank
  question_number INTEGER,
  type TEXT CHECK (type IN ('mcq', 'true_false', 'fill_blank', 'matching', 'ordering')),
  question_text TEXT NOT NULL,
  
  -- Universal question fields
  options TEXT, -- JSON string for MCQ options
  correct_answer TEXT,
  explanation TEXT,
  
  -- Type-specific fields
  formatted_text TEXT, -- For fill_blank templates
  correct_answers_data TEXT, -- JSON for fill_blank blanks
  pairs TEXT, -- JSON for matching pairs
  items TEXT, -- JSON for ordering items
  correct_order TEXT, -- JSON for correct sequence
  
  -- New metadata fields
  domain VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  hint TEXT,
  weightage INTEGER DEFAULT 1,
  difficulty_level ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_questions_domain ON questions(domain);
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_source ON questions(source);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_composite ON questions(domain, subject, source, difficulty_level);
```

### Migration Strategy
- Add new fields as nullable initially
- Update existing questions with default metadata
- Make required fields NOT NULL after data migration
- Create performance indexes

### Field Validation Rules
- domain, subject, source: Required, 1-255 characters
- difficulty_level: Must be 'Easy', 'Medium', or 'Hard'
- type: Must be one of 5 universal question types
- weightage: Positive integer, default 1
- hint: Optional text field

### File References
- Migration file: `/backend/src/migrations/011_enhance_questions_for_question_bank.js`
- Model update: `/backend/src/models/Question.js`
