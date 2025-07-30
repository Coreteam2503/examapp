# ExamApp Criteria-Based Quiz System - Comprehensive Testing Guide

## 🎯 TESTING OVERVIEW

This guide provides a complete testing framework for the ExamApp Criteria-Based Quiz System. Use this document to systematically verify all functionality across user roles, features, and edge cases.

---

## 🔑 TEST ENVIRONMENT SETUP

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- PostgreSQL database accessible
- Test data seeded

### Test User Accounts
| Role | Email | Password | User ID | Notes |
|------|-------|----------|---------|-------|
| Admin | `balu.in.u@gmail.com` | `123123` | 1 | Full system access |
| Student | `blue@gmail.com` | `123123` | 2 | Primary test student |
| Student | `stu1@gmail.com` | `123123` | 3 | Secondary test student |
| Student | `jay@gmail.com` | `123123` | 5 | Additional test student |
| Student | `mini@gmail.com` | `123123` | 9 | Additional test student |
| Student | `bo@gmail.com` | `123123` | 13 | Additional test student |
| Student | `popo@gmail.com` | `123123` | 15 | Additional test student |

### Expected System Data
- **Questions**: 143 total
- **Domains**: Computer Science, Information Security, Medical Sciences
- **Subjects**: AI Programming, Artificial Intelligence, Chunking Strategies, etc.
- **Quizzes**: 11 criteria-based quizzes
- **Batches**: General Batch + additional batches
- **Difficulty Levels**: Easy, Medium, Hard

---

## 📋 TEST SUITE STRUCTURE

### Test Categories
1. **Authentication & Authorization** (A-series)
2. **Admin Quiz Management** (B-series)
3. **Student Quiz Discovery** (C-series)  
4. **Quiz Creation & Configuration** (D-series)
5. **Quiz Taking & Scoring** (E-series)
6. **Batch Management** (F-series)
7. **System Integration** (G-series)
8. **Error Handling & Edge Cases** (H-series)

---

## 🔐 A-SERIES: AUTHENTICATION & AUTHORIZATION TESTS

### A1: Admin Login Flow
**Objective**: Verify admin authentication and dashboard access

**Steps**:
1. Navigate to `http://localhost:3000`
2. Enter email: `balu.in.u@gmail.com`
3. Enter password: `123123`
4. Click "Sign in"

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to admin interface
- ✅ User role displayed as "admin"
- ✅ Admin navigation menu visible
- ✅ System overview dashboard loads

**Failure Indicators**:
- ❌ "Invalid email or password" error
- ❌ Stuck on login page
- ❌ 500 server error
- ❌ Student interface instead of admin

### A2: Student Login Flow  
**Objective**: Verify student authentication and dashboard access

**Steps**:
1. Clear browser session (localStorage.clear())
2. Navigate to `http://localhost:3000`
3. Enter email: `blue@gmail.com`
4. Enter password: `123123`
5. Click "Sign in"

**Expected Results**:
- ✅ Login successful
- ✅ Student dashboard loads
- ✅ User role displayed as "student"
- ✅ Quiz list or dashboard visible
- ✅ No admin features accessible

### A3: Role-Based Access Control
**Objective**: Verify proper role restrictions

**Test Cases**:
- **A3.1**: Student cannot access admin endpoints
- **A3.2**: Unauthenticated users redirected to login
- **A3.3**: Admin can access all features
- **A3.4**: Session persistence works correctly

---

## 🛠️ B-SERIES: ADMIN QUIZ MANAGEMENT TESTS

### B1: Admin Interface Access
**Objective**: Verify admin can access quiz management features

**Prerequisites**: Logged in as admin

**Steps**:
1. Look for "Quiz Management" in admin sidebar
2. Click "Quiz Management"
3. Check for quiz creation interface

**Expected Results**:
- ✅ Quiz Management section accessible
- ✅ Quiz creation interface loads
- ✅ No "maintenance mode" message
- ✅ Create quiz options visible

**Known Issues**:
- ⚠️ May show "temporarily disabled for maintenance" 
- ⚠️ Interface may not load due to backend API issues

### B2: Quiz Creation - Criteria-Based
**Objective**: Create new criteria-based quiz through admin interface

**Prerequisites**: Quiz management interface accessible

**Steps**:
1. Click "Create Criteria-Based Quiz" or equivalent
2. Fill form fields:
   - Number of Questions: 5
   - Time Limit: 30 minutes
   - Domain: Computer Science
   - Subject: Python Programming  
   - Difficulty: Easy
3. Click "Preview Questions"
4. Verify sample questions shown
5. Click "Create Quiz"

**Expected Results**:
- ✅ Form loads with dropdown options
- ✅ Preview shows ~5+ sample questions matching criteria
- ✅ All preview questions show "Computer Science" and "Easy"
- ✅ Quiz created successfully
- ✅ New quiz appears in quiz list with blue "🎯 Criteria-Based" badge
- ✅ Quiz shows criteria summary

### B3: Quiz Preview & Management
**Objective**: Verify quiz preview and management features

**Steps**:
1. From quiz list, click "Preview Questions" on criteria-based quiz
2. Verify modal shows criteria details and sample questions
3. Click "Assign Batches"
4. Select batches and assign
5. Verify quiz shows assigned batch names

**Expected Results**:
- ✅ Preview modal opens with criteria and questions
- ✅ Batch assignment modal functions
- ✅ Quiz shows assigned batches
- ✅ Success messages appear

---

## 👥 C-SERIES: STUDENT QUIZ DISCOVERY TESTS

### C1: Student Dashboard Quiz Display
**Objective**: Verify students can see available quizzes

**Prerequisites**: Logged in as student (`blue@gmail.com`)

**Steps**:
1. Navigate to student dashboard
2. Look for quiz sections
3. Check quiz list or recent quizzes

**Expected Results**:
- ✅ Quiz list displays available quizzes
- ✅ Mix of quiz types visible (criteria-based and traditional)
- ✅ Criteria-based quizzes show blue "🎯 Criteria-Based" badges
- ✅ Quiz metadata displayed (difficulty, subject, domain)
- ✅ Question counts show (Dynamic) vs (Fixed)

**Data Expectations**:
- Should see 8-12 total quizzes
- Mix of both quiz types
- Criteria details like "Domain: Computer Science, Difficulty: Easy"

### C2: Quiz Information Display
**Objective**: Verify quiz information is properly displayed

**Check Points**:
- ✅ Quiz titles descriptive and clear
- ✅ Criteria-based quizzes show criteria summary
- ✅ Traditional quizzes show source files
- ✅ Difficulty levels displayed correctly
- ✅ Time limits shown
- ✅ Question counts accurate

### C3: Batch-Based Quiz Access
**Objective**: Verify students see quizzes assigned to their batches

**Steps**:
1. Check student's enrolled batches
2. Verify quiz list matches batch assignments
3. Test batch filtering if available

**Expected Results**:
- ✅ Only quizzes assigned to student's batches are visible
- ✅ Batch information displayed correctly
- ✅ Filtering works if implemented

---

## 🎯 D-SERIES: QUIZ CREATION & CONFIGURATION TESTS

### D1: Quiz Generation Options API
**Objective**: Verify backend provides dropdown options for quiz creation

**API Test**:
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/quizzes/generation-options
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "domains": ["Computer Science", "Information Security", "Medical Sciences"],
    "subjects": ["AI Programming", "Artificial Intelligence", ...],
    "sources": [...],
    "difficulties": ["Easy", "Medium", "Hard"],
    "types": ["multiple_choice", "true_false", ...]
  }
}
```

### D2: Quiz Creation API
**Objective**: Test quiz creation through API

**API Test**:
```bash
curl -X POST -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "Computer Science",
    "subject": "Python Programming", 
    "difficulty_level": "Easy",
    "num_questions": 5,
    "time_limit": 30
  }' \
  http://localhost:8000/api/quizzes/generate-dynamic
```

**Expected Response**:
- ✅ 200 status code
- ✅ Quiz created with criteria stored
- ✅ Question preview included
- ✅ Quiz marked as criteria-based

### D3: Question Selection Validation
**Objective**: Verify quiz creation only proceeds with available questions

**Test Cases**:
- **D3.1**: Valid criteria with sufficient questions
- **D3.2**: Criteria with insufficient questions (should warn)
- **D3.3**: Criteria with no matching questions (should error)
- **D3.4**: Broad criteria (should show many options)
- **D3.5**: Very specific criteria (should show few options)

---

## 🎮 E-SERIES: QUIZ TAKING & SCORING TESTS

### E1: Criteria-Based Quiz Taking
**Objective**: Verify students can take criteria-based quizzes and get different questions

**Prerequisites**: Student logged in, criteria-based quiz available

**Steps**:
1. Click on quiz with "🎯 Criteria-Based" badge
2. Note the questions that appear
3. Complete the quiz and submit
4. Record score
5. **Immediately take the SAME quiz again**
6. Note the questions in second attempt
7. Complete second attempt

**Expected Results**:
- ✅ Quiz starts with questions matching criteria
- ✅ Questions in attempt 1 and attempt 2 are different
- ✅ All questions match quiz criteria (same subject/difficulty)
- ✅ Both attempts scored correctly
- ✅ Both scores recorded in history

### E2: Traditional Quiz Consistency
**Objective**: Verify traditional quizzes show same questions every time

**Prerequisites**: Traditional quiz available (without criteria badge)

**Steps**:
1. Take traditional quiz and note exact questions
2. Complete quiz
3. Take same quiz again immediately
4. Verify questions are identical

**Expected Results**:
- ✅ Questions exactly same both times
- ✅ Same order maintained
- ✅ Quiz shows source file instead of criteria
- ✅ Scoring works normally

### E3: Quiz Attempt History
**Objective**: Verify quiz attempt tracking

**Steps**:
1. Take multiple quizzes (both types)
2. Check quiz history/dashboard
3. Verify attempt records

**Expected Results**:
- ✅ All attempts recorded
- ✅ Scores and dates accurate
- ✅ Quiz types clearly distinguished
- ✅ Multiple attempts on same quiz tracked

---

## 📚 F-SERIES: BATCH MANAGEMENT TESTS

### F1: Batch Creation & Configuration
**Objective**: Test batch management functionality

**Prerequisites**: Admin logged in

**Steps**:
1. Navigate to Batch Management
2. Create new batch
3. Set batch criteria if available
4. Assign users to batch

**Expected Results**:
- ✅ Batch creation interface works
- ✅ Criteria setting functional
- ✅ User assignment works
- ✅ Batch appears in listings

### F2: Quiz-Batch Assignment
**Objective**: Verify quizzes can be assigned to batches

**Steps**:
1. Create or select quiz
2. Assign to specific batches
3. Verify assignment reflected
4. Test student access

**Expected Results**:
- ✅ Assignment interface functional
- ✅ Students in batch can access quiz
- ✅ Students not in batch cannot access
- ✅ Assignment changes reflected immediately

### F3: Batch-Based Access Control
**Objective**: Verify batch-based quiz visibility

**Test Cases**:
- Student in multiple batches sees all assigned quizzes
- Student removed from batch loses quiz access
- Quiz assigned to new batch becomes visible to batch members

---

## 🔄 G-SERIES: SYSTEM INTEGRATION TESTS

### G1: End-to-End Quiz Workflow
**Objective**: Test complete quiz lifecycle

**Workflow**:
1. Admin creates criteria-based quiz
2. Admin assigns quiz to batch
3. Student discovers quiz in dashboard
4. Student takes quiz multiple times
5. Admin views quiz statistics
6. Admin modifies quiz or batch assignments

**Checkpoints**:
- ✅ Each step completes successfully
- ✅ Data persists correctly
- ✅ Real-time updates work
- ✅ No data loss between steps

### G2: Multi-User Concurrent Testing
**Objective**: Test system under concurrent usage

**Setup**:
- Multiple admin users creating quizzes
- Multiple students taking quizzes simultaneously
- Batch assignments changing during quiz taking

**Monitor**:
- Database integrity
- Session management
- Performance impact
- Data consistency

### G3: Cross-Device Compatibility
**Objective**: Verify functionality across devices

**Test Platforms**:
- Desktop browsers (Chrome, Firefox, Safari)
- Tablet devices
- Mobile phones
- Different screen resolutions

**Focus Areas**:
- Responsive design
- Touch interactions
- Form usability
- Navigation efficiency

---

## ⚠️ H-SERIES: ERROR HANDLING & EDGE CASES

### H1: Network & API Error Handling
**Objective**: Test system resilience to failures

**Test Scenarios**:
- **H1.1**: Backend server offline
- **H1.2**: Database connection lost
- **H1.3**: Invalid API responses
- **H1.4**: Slow network conditions
- **H1.5**: Partial data loading failures

**Expected Behaviors**:
- ✅ Graceful error messages
- ✅ No application crashes
- ✅ Retry mechanisms where appropriate
- ✅ Fallback content when possible

### H2: Data Validation & Edge Cases
**Objective**: Test input validation and boundary conditions

**Test Cases**:
- **H2.1**: Quiz with 0 questions requested
- **H2.2**: Quiz with 1000+ questions requested
- **H2.3**: Invalid criteria combinations
- **H2.4**: Special characters in quiz titles
- **H2.5**: Very long quiz descriptions
- **H2.6**: Concurrent quiz submissions

### H3: User Session Edge Cases
**Objective**: Test session management edge cases

**Scenarios**:
- **H3.1**: Session timeout during quiz taking
- **H3.2**: Multiple tabs with same user
- **H3.3**: Browser refresh during operations
- **H3.4**: Logout/login during quiz creation
- **H3.5**: Invalid authentication tokens

---

## 📊 TESTING CHECKLIST & REPORTING

### Quick Smoke Test (15 minutes)
- [ ] Admin login works
- [ ] Student login works  
- [ ] Quiz list displays
- [ ] Basic navigation functional
- [ ] No critical errors in console

### Full Functional Test (2-3 hours)
- [ ] All A-series tests (Authentication)
- [ ] All B-series tests (Admin Quiz Management)
- [ ] All C-series tests (Student Quiz Discovery)
- [ ] Core D-series tests (Quiz Creation)
- [ ] Core E-series tests (Quiz Taking)

### Comprehensive Test Suite (6-8 hours)
- [ ] All test series A through H
- [ ] Performance testing
- [ ] Cross-device testing
- [ ] Stress testing
- [ ] Security testing

### Test Report Template

```markdown
# ExamApp Test Execution Report

**Date**: [Date]
**Tester**: [Name] 
**Environment**: [Development/Staging/Production]

## Executive Summary
- **Overall Status**: [Pass/Fail/Partial]
- **Critical Issues**: [Count]
- **Test Coverage**: [Percentage]

## Test Results Summary
| Test Series | Total Tests | Passed | Failed | Skipped |
|-------------|-------------|--------|--------|---------|
| A-Auth      | X          | X      | X      | X       |
| B-Admin     | X          | X      | X      | X       |
| C-Student   | X          | X      | X      | X       |
| [etc.]      |            |        |        |         |

## Critical Issues Found
1. [Issue description with severity]
2. [Issue description with severity]

## Recommendations
- [Priority 1 fixes]
- [Priority 2 improvements]

## Detailed Test Results
[Link to detailed logs or paste key results]
```

---

## 🚀 TESTING BEST PRACTICES

### Before Testing
1. **Environment Check**: Verify all services running
2. **Data Reset**: Ensure test data is in known state
3. **Browser State**: Clear cache/cookies between test runs
4. **Network**: Stable internet connection
5. **Tools**: Browser dev tools open for debugging

### During Testing
1. **Document Everything**: Screenshots of failures
2. **Console Monitoring**: Watch for JavaScript errors
3. **Network Tab**: Monitor API calls and responses
4. **Step-by-Step**: Don't skip steps or rush
5. **Multiple Attempts**: Retry failed tests to confirm

### After Testing
1. **Bug Reports**: Create detailed issue reports
2. **Evidence Collection**: Save screenshots, logs, API responses
3. **Regression Notes**: Mark which previously working features broke
4. **Performance Notes**: Document any slowness or issues
5. **Recommendations**: Suggest immediate vs long-term fixes

---

## 🔧 TROUBLESHOOTING COMMON ISSUES

### "Quiz management temporarily disabled"
- **Cause**: Frontend component disabled in code
- **Quick Fix**: Enable QuizManagement component in AdminDashboard.js
- **Test Impact**: Blocks admin quiz creation tests

### "No quizzes available" for students
- **Cause**: Quizzes not assigned to student's batches
- **Quick Fix**: Assign existing quizzes to General Batch via API
- **Test Impact**: Blocks student quiz discovery and taking tests

### API errors (500/404)
- **Cause**: Backend method missing or database issues
- **Investigation**: Check browser console and network tab
- **Test Impact**: May block specific feature testing

### Authentication failures
- **Cause**: Incorrect credentials or database user issues
- **Verification**: Check database user table for correct accounts
- **Test Impact**: Blocks all user-specific testing

---

## 📈 SUCCESS CRITERIA

### Minimum Viable Test (MVP)
- ✅ Basic authentication works for admin and student
- ✅ Students can see quiz lists
- ✅ Basic navigation functions
- ✅ No critical system crashes

### Full Feature Test
- ✅ Complete quiz creation workflow
- ✅ Students can take and submit quizzes
- ✅ Quiz history and scoring works
- ✅ Batch management functional
- ✅ Both quiz types (criteria-based and traditional) work

### Production Ready Test
- ✅ All test series pass (A through H)
- ✅ Performance acceptable under load
- ✅ Cross-device compatibility confirmed
- ✅ Error handling graceful
- ✅ Security validation complete

Use this guide systematically to ensure comprehensive coverage of the ExamApp Criteria-Based Quiz System functionality.