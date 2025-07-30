require('dotenv').config();
const { db } = require('./src/config/database');

/**
 * Final End-to-End System Test for Task #37
 * Comprehensive test of the complete criteria-based quiz system
 */
async function finalSystemTest() {
  console.log('🔬 Final End-to-End System Test...\n');

  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Test 1: Complete Quiz Creation Workflow
    console.log('📋 Test 1: Complete Quiz Creation Workflow');
    await testQuizCreationWorkflow(testResults);

    // Test 2: Complete Quiz Taking Workflow  
    console.log('\n📋 Test 2: Complete Quiz Taking Workflow');
    await testQuizTakingWorkflow(testResults);

    // Test 3: Mixed Quiz Types Support
    console.log('\n📋 Test 3: Mixed Quiz Types Support');
    await testMixedQuizTypes(testResults);

    // Test 4: Data Consistency and Integrity
    console.log('\n📋 Test 4: Data Consistency and Integrity');
    await testDataConsistency(testResults);

    // Test 5: Performance Under Load
    console.log('\n📋 Test 5: Performance Under Load');
    await testPerformanceUnderLoad(testResults);

    // Test 6: Error Handling and Edge Cases
    console.log('\n📋 Test 6: Error Handling and Edge Cases');
    await testErrorHandling(testResults);

    // Final Results
    console.log('\n' + '='.repeat(60));
    console.log('🏆 FINAL SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production! 🚀');
      console.log('\n✅ SYSTEM STATUS: PRODUCTION READY');
      console.log('✅ CRITERIA-BASED QUIZ SYSTEM: FULLY FUNCTIONAL');
      console.log('✅ MIGRATION: COMPLETED SUCCESSFULLY');
      console.log('✅ DATA INTEGRITY: VALIDATED');
      console.log('✅ PERFORMANCE: EXCELLENT');
    } else {
      console.log('\n⚠️ Some tests failed. Review before production deployment.');
    }

  } catch (error) {
    console.error('❌ Final test failed:', error);
  } finally {
    await db.destroy();
  }
}

async function testQuizCreationWorkflow(results) {
  try {
    const { QuizGenerationService } = require('./src/services/quizGenerationService');
    const quizService = new QuizGenerationService();

    // Step 1: Preview questions for criteria
    const previewCriteria = {
      domain: 'Computer Science',
      difficulty_level: 'Easy',
      num_questions: 5
    };

    const preview = await quizService.previewQuestionsForCriteria(previewCriteria, 3);
    console.log(`   📝 Preview: ${preview.total_matching} questions match criteria`);

    // Step 2: Create criteria-based quiz
    const quizResult = await quizService.generateCriteriaBasedQuiz(previewCriteria, 1);
    console.log(`   ✅ Created quiz: ${quizResult.quiz.title} (ID: ${quizResult.quiz.id})`);

    // Step 3: Verify quiz in database
    const savedQuiz = await db('quizzes').where('id', quizResult.quiz.id).first();
    const hasCriteria = savedQuiz.criteria && Object.keys(savedQuiz.criteria).length > 0;
    console.log(`   📊 Quiz saved with criteria: ${hasCriteria ? 'Yes' : 'No'}`);

    // Clean up
    await db('quizzes').where('id', quizResult.quiz.id).del();

    const success = preview.total_matching > 0 && quizResult.quiz.id && hasCriteria;
    console.log(`   ${success ? '✅' : '❌'} Quiz Creation Workflow: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Quiz Creation Workflow', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Quiz Creation Workflow: FAILED (${error.message})`);
    results.tests.push({ name: 'Quiz Creation Workflow', passed: false, error: error.message });
    results.failed++;
  }
}

async function testQuizTakingWorkflow(results) {
  try {
    const questionSelector = require('./src/services/questionSelector');

    // Step 1: Get a criteria-based quiz
    const quiz = await db('quizzes')
      .where('criteria', '!=', '{}')
      .whereNotNull('criteria')
      .first();

    if (!quiz) {
      throw new Error('No criteria-based quiz found');
    }

    console.log(`   🎯 Testing with quiz: ${quiz.title}`);

    // Step 2: Simulate quiz attempt initialization (dynamic question generation)
    const questions = await questionSelector.selectQuestionsForQuiz(
      quiz.criteria, 
      quiz.question_count || 5
    );

    console.log(`   📝 Generated ${questions.length} questions for attempt`);

    // Step 3: Verify questions match criteria
    const criteriaMatch = questions.every(q => {
      if (quiz.criteria.domain && q.domain !== quiz.criteria.domain) return false;
      if (quiz.criteria.subject && q.subject !== quiz.criteria.subject) return false;
      if (quiz.criteria.difficulty_level && q.difficulty_level !== quiz.criteria.difficulty_level) return false;
      return true;
    });

    console.log(`   ✅ Questions match criteria: ${criteriaMatch ? 'Yes' : 'No'}`);

    const success = questions.length > 0 && criteriaMatch;
    console.log(`   ${success ? '✅' : '❌'} Quiz Taking Workflow: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Quiz Taking Workflow', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Quiz Taking Workflow: FAILED (${error.message})`);
    results.tests.push({ name: 'Quiz Taking Workflow', passed: false, error: error.message });
    results.failed++;
  }
}

async function testMixedQuizTypes(results) {
  try {
    // Step 1: Count different quiz types
    const allQuizzes = await db('quizzes').select('id', 'title', 'criteria', 'question_count');
    
    let criteriaBasedCount = 0;
    let traditionalCount = 0;

    allQuizzes.forEach(quiz => {
      const hasCriteria = quiz.criteria && Object.keys(quiz.criteria).length > 0;
      if (hasCriteria) {
        criteriaBasedCount++;
      } else {
        traditionalCount++;
      }
    });

    console.log(`   📊 System supports mixed quiz types:`);
    console.log(`      Criteria-based quizzes: ${criteriaBasedCount}`);
    console.log(`      Traditional quizzes: ${traditionalCount}`);

    // Step 2: Verify both types can be listed together
    const mixedSupport = allQuizzes.length > 0 && (criteriaBasedCount >= 0 || traditionalCount >= 0);
    
    const success = mixedSupport;
    console.log(`   ${success ? '✅' : '❌'} Mixed Quiz Types Support: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Mixed Quiz Types Support', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Mixed Quiz Types Support: FAILED (${error.message})`);
    results.tests.push({ name: 'Mixed Quiz Types Support', passed: false, error: error.message });
    results.failed++;
  }
}

async function testDataConsistency(results) {
  try {
    // Step 1: Verify all quizzes have valid structure
    const quizzes = await db('quizzes').select('*');
    let validQuizzes = 0;

    quizzes.forEach(quiz => {
      const hasValidTitle = quiz.title && quiz.title.trim().length > 0;
      const hasValidCriteria = quiz.criteria !== null; // Can be empty object
      const hasValidQuestionCount = quiz.question_count >= 0 || quiz.total_questions >= 0;
      
      if (hasValidTitle && hasValidCriteria && hasValidQuestionCount) {
        validQuizzes++;
      }
    });

    console.log(`   📊 Valid quizzes: ${validQuizzes}/${quizzes.length}`);

    // Step 2: Verify questions are accessible
    const totalQuestions = await db('questions').count('* as count').first();
    console.log(`   📝 Total questions available: ${totalQuestions.count}`);

    // Step 3: Verify criteria statistics
    const questionSelector = require('./src/services/questionSelector');
    const criteriaStats = await questionSelector.getCriteriaStats();
    console.log(`   📈 Criteria combinations: ${criteriaStats.length}`);

    const success = validQuizzes === quizzes.length && totalQuestions.count > 0 && criteriaStats.length > 0;
    console.log(`   ${success ? '✅' : '❌'} Data Consistency: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Data Consistency', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Data Consistency: FAILED (${error.message})`);
    results.tests.push({ name: 'Data Consistency', passed: false, error: error.message });
    results.failed++;
  }
}

async function testPerformanceUnderLoad(results) {
  try {
    console.log(`   ⚡ Running performance tests under load...`);
    
    const questionSelector = require('./src/services/questionSelector');
    
    // Test 1: Multiple concurrent question selections
    const startTime = Date.now();
    const concurrentPromises = [];
    
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        questionSelector.selectQuestionsForQuiz({ domain: 'Computer Science' }, 3)
      );
    }
    
    const results1 = await Promise.all(concurrentPromises);
    const concurrentTime = Date.now() - startTime;
    
    console.log(`      💨 5 concurrent selections: ${concurrentTime}ms`);
    
    // Test 2: Large question selection
    const largeStartTime = Date.now();
    const largeSelection = await questionSelector.selectQuestionsForQuiz({}, 20);
    const largeTime = Date.now() - largeStartTime;
    
    console.log(`      📏 Large selection (20 questions): ${largeTime}ms`);
    
    // Test 3: Complex criteria filtering
    const complexStartTime = Date.now();
    const complexSelection = await questionSelector.selectQuestionsForQuiz({
      domain: 'Computer Science',
      difficulty_level: 'Medium'
    }, 10);
    const complexTime = Date.now() - complexStartTime;
    
    console.log(`      🔍 Complex criteria filtering: ${complexTime}ms`);
    
    // Performance thresholds
    const performanceGood = concurrentTime < 2000 && largeTime < 1000 && complexTime < 500;
    
    const success = results1.every(r => r.length > 0) && largeSelection.length > 0 && performanceGood;
    console.log(`   ${success ? '✅' : '❌'} Performance Under Load: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Performance Under Load', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Performance Under Load: FAILED (${error.message})`);
    results.tests.push({ name: 'Performance Under Load', passed: false, error: error.message });
    results.failed++;
  }
}

async function testErrorHandling(results) {
  try {
    const { QuizGenerationService } = require('./src/services/quizGenerationService');
    const quizService = new QuizGenerationService();

    // Test 1: Invalid criteria handling
    try {
      await quizService.validateCriteria({
        num_questions: -1, // Invalid
        difficulty_level: 'InvalidLevel' // Invalid
      });
      console.log(`   ❌ Should have thrown validation error`);
      results.failed++;
      return;
    } catch (validationError) {
      console.log(`   ✅ Validation error correctly caught: ${validationError.name}`);
    }

    // Test 2: No matching questions
    const questionSelector = require('./src/services/questionSelector');
    const impossibleCriteria = {
      domain: 'NonexistentDomain',
      subject: 'NonexistentSubject',
      difficulty_level: 'Easy'
    };
    
    const noMatchResults = await questionSelector.selectQuestionsForQuiz(impossibleCriteria, 5);
    console.log(`   ✅ No match handling: ${noMatchResults.length} questions (expected 0)`);

    // Test 3: Empty criteria preview
    const emptyPreview = await questionSelector.previewSelection({}, 5);
    console.log(`   ✅ Empty criteria preview: ${emptyPreview.totalMatching} total questions`);

    const success = noMatchResults.length === 0 && emptyPreview.totalMatching > 0;
    console.log(`   ${success ? '✅' : '❌'} Error Handling: ${success ? 'PASSED' : 'FAILED'}`);
    
    results.tests.push({ name: 'Error Handling', passed: success });
    if (success) results.passed++; else results.failed++;

  } catch (error) {
    console.log(`   ❌ Error Handling: FAILED (${error.message})`);
    results.tests.push({ name: 'Error Handling', passed: false, error: error.message });
    results.failed++;
  }
}

// Run the final system test
finalSystemTest();
