# Quiz Criteria-Based System Redesign - PRD

## Project Overview
Transform the ExamApp from fixed quiz-question assignments to dynamic criteria-based question selection, eliminating the need for quiz-batch relationships and enabling real-time question generation based on user's batch criteria.

## Business Goals
- Eliminate quiz auto-assignment complexity by making both batches and quizzes criteria-based
- Enable dynamic question selection for fresher quiz experiences  
- Simplify system architecture by removing redundant relationship tables
- Maintain existing user attempt tracking and scoring functionality

## Current System Problems
- Empty quiz_batches table (0 records) causing students to see no available quizzes
- Complex auto-assignment logic that's not working properly
- Redundant criteria storage (batches have criteria, quizzes should also be criteria-based)
- Fixed quiz questions become stale over time

## Proposed Solution Architecture

### Core Concept
Replace fixed quiz-question associations with dynamic criteria-based selection:
- **Batches** = Question access criteria (existing)
- **Quizzes** = Question selection criteria (new)
- **Attempts** = User session with dynamically selected questions
- **Answers** = User responses to specific questions (unchanged)

### Database Changes
**Remove Tables:**
- quiz_questions (junction table)
- quiz_batches (junction table)

**Modify Tables:**
- quizzes: Add criteria JSON field, remove fixed question references
- Keep: quiz_attempts, answers (core tracking unchanged)

### User Flow
1. Student views available "quiz templates" (criteria-based)
2. Student starts attempt → system generates questions matching criteria
3. Student answers questions → responses stored normally
4. Scoring and tracking work exactly as before

## Technical Implementation

### Phase 1: Backend Criteria System
- Add criteria field to quizzes table
- Implement dynamic question selection algorithm
- Update quiz generation endpoints to store criteria instead of questions
- Create quiz attempt initialization with question selection

### Phase 2: Quiz Taking Logic
- Modify quiz start endpoint to generate questions dynamically
- Update question serving logic for attempts
- Ensure attempt/answer tracking compatibility
- Add question uniqueness per attempt

### Phase 3: Frontend Updates
- Update quiz creation UI to use criteria selection
- Modify quiz taking interface for dynamic questions
- Update student dashboard to show criteria-based quizzes
- Remove batch-quiz assignment interfaces

### Phase 4: Database Migration
- Create migration to add criteria to existing quizzes
- Remove obsolete junction tables
- Clean up unused quiz-question associations
- Verify data integrity

### Phase 5: Testing & Validation
- Test dynamic question generation
- Verify attempt/answer tracking works
- Validate scoring and reporting functionality
- Performance test with large question banks

## Success Criteria
- Students see available quizzes in their batches (criteria-matched)
- Quiz attempts generate unique question sets each time
- All existing functionality (scoring, reporting, attempts) works unchanged
- No more empty quiz_batches table issues
- Simplified admin interface without complex assignment management

## Technical Constraints
- Maintain PostgreSQL database with existing user data
- Keep existing authentication and user management
- Preserve all attempt and answer history
- Ensure backward compatibility during transition

## Risk Mitigation
- Gradual migration with fallback to existing system
- Extensive testing of dynamic question selection
- Performance monitoring for question generation queries
- Data backup before structural changes

## Timeline Estimate
Medium complexity - approximately 5-6 focused development tasks covering backend logic, frontend updates, database migration, and testing validation.
