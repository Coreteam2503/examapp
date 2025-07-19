# Batch-Based Question Management System - Project Requirements Document

## Project Overview

Transform the current examapp question management system from a simple role-based system to a comprehensive batch-based system where admins can create batches, assign questions by topic/domain to batches, and students register for specific batches to see only relevant questions.

## Current State Analysis

### Database Structure
- **Users**: 1 admin (ID: 1, balu.in.u@gmail.com), 6 students
- **Questions**: 16 questions (Computer Science/AI domain) - NO creator tracking
- **Quizzes**: 11 quizzes - ALL created by admin user
- **Tables**: users, questions, quizzes, quiz_questions (junction table)

### Critical Issues
1. **Missing `created_by` in questions table** - Cannot track who created questions
2. **No batch concept** - All students see all questions
3. **No question-batch association** - Cannot assign questions to specific groups
4. **No user-batch assignment** - Students cannot be grouped

## Business Requirements

### BR1: Batch Management
- Admins can create/edit/delete batches
- Each batch has: name, description, subject/domain focus, active status
- Admins can assign multiple domains/subjects to a batch

### BR2: Question-Batch Association
- Questions are created by admins and assigned to specific batches
- One question can belong to multiple batches
- Questions without batch assignment are "global" (visible to all)

### BR3: User-Batch Assignment
- Students register/are assigned to specific batches
- Students can belong to multiple batches
- Students see only questions from their assigned batches + global questions
- Admins see all questions they created across all batches

### BR4: Exam/Quiz Generation
- When creating quizzes, system filters questions based on:
  - Student: Questions from their batches + global questions
  - Admin: All questions they created across all batches
- Quiz generation respects batch boundaries

### BR5: Migration/Data Integrity
- All existing questions assigned to admin user (ID: 1)
- All existing students assigned to default batch "General Batch"
- Maintain all existing quiz functionality

## Technical Requirements

### TR1: Database Schema Changes
```sql
-- Add created_by to questions table
ALTER TABLE questions ADD COLUMN created_by INTEGER REFERENCES users(id);

-- Create batches table
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(255),
  domain VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create question_batches junction table
CREATE TABLE question_batches (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_id, batch_id)
);

-- Create user_batches junction table
CREATE TABLE user_batches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  UNIQUE(user_id, batch_id)
);
```

### TR2: Backend API Updates
- **Batch Management APIs**: CRUD operations for batches
- **Question APIs**: Filter by user's batches + created_by tracking
- **User Management**: Batch assignment for students
- **Quiz Generation**: Batch-aware question filtering

### TR3: Frontend Updates
- **Admin Dashboard**: Batch creation/management interface
- **Question Management**: Batch assignment during question creation
- **Student Registration**: Batch selection during signup
- **Quiz Interface**: Batch-filtered question display

## Implementation Plan

### Phase 1: Database Foundation (Priority: HIGH)
1. Create migration for `created_by` in questions table
2. Create batches table migration
3. Create junction tables (question_batches, user_batches)
4. Data migration script:
   - Assign all existing questions to admin user (ID: 1)
   - Create default batch "General Batch"
   - Assign all students to default batch

### Phase 2: Backend Core (Priority: HIGH)
1. Update Question model with created_by and batch filtering
2. Create Batch model with CRUD operations
3. Update QuizGenerationService for batch-aware filtering
4. Create batch management API endpoints
5. Update question creation/search APIs

### Phase 3: Frontend Core (Priority: MEDIUM)
1. Create batch management components for admins
2. Update question creation form with batch assignment
3. Update student registration with batch selection
4. Update quiz generation to respect batch filtering

### Phase 4: Testing & Validation (Priority: MEDIUM)
1. Unit tests for batch filtering logic
2. Integration tests for quiz generation
3. User acceptance testing with different role scenarios
4. Performance testing with multiple batches

## Success Criteria

### Functional Success
- [ ] Admin can create batches and assign questions to them
- [ ] Students see only questions from their assigned batches
- [ ] Quiz generation respects batch boundaries
- [ ] All existing functionality preserved after migration

### Technical Success
- [ ] Zero data loss during migration
- [ ] All tests pass after implementation
- [ ] Performance maintained with batch filtering
- [ ] Clean separation of concerns in codebase

## Risk Assessment

### High Risk
- **Data Migration**: Risk of losing existing questions/quizzes
- **Performance**: Batch filtering might slow down question queries

### Medium Risk
- **User Experience**: Complex batch management might confuse users
- **Testing**: Need comprehensive testing of role-based access

### Mitigation
- Database backup before migration
- Staged rollout with fallback plan
- Performance monitoring and optimization
- Clear user documentation and training
