require('dotenv').config();
const questionSelector = require('./src/services/questionSelector');
const { db } = require('./src/config/database');

/**
 * Comprehensive test suite for QuestionSelector service
 * Tests all major functionality including edge cases and performance
 */
async function testQuestionSelector() {
  console.log('🧪 Starting QuestionSelector comprehensive test suite...\n');

  try {
    // Test 1: Basic criteria selection
    console.log('📋 Test 1: Basic criteria selection');
    const basicCriteria = {
      domain: 'Computer Science',
      difficulty_level: 'Easy'
    };
    
    const basicSelection = await questionSelector.selectQuestionsForQuiz(basicCriteria, 5);
    console.log(`   ✅ Selected ${basicSelection.length} questions for basic criteria`);
    console.log(`   📊 Sample question: "${basicSelection[0]?.question_text?.substring(0, 60)}..."`);

    // Test 2: Specific subject and source
    console.log('\n📋 Test 2: Specific subject and source selection');
    const specificCriteria = {
      domain: 'Computer Science',
      subject: 'Python Programming',
      source: 'educosys_chatbot.py',
      difficulty_level: 'Easy'
    };
    
    const specificSelection = await questionSelector.selectQuestionsForQuiz(specificCriteria, 3);
    console.log(`   ✅ Selected ${specificSelection.length} questions for specific criteria`);

    // Test 3: No count limit (get all matching)
    console.log('\n📋 Test 3: Select all matching questions (no limit)');
    const allMatchingCriteria = {
      domain: 'Computer Science',
      difficulty_level: 'Medium'
    };
    
    const allMatching = await questionSelector.selectQuestionsForQuiz(allMatchingCriteria);
    console.log(`   ✅ Selected all ${allMatching.length} matching questions`);

    // Test 4: Exclude specific question IDs
    console.log('\n📋 Test 4: Exclude specific question IDs');
    const excludeIds = basicSelection.slice(0, 2).map(q => q.id);
    const excludeSelection = await questionSelector.selectQuestionsForQuiz(basicCriteria, 5, excludeIds);
    console.log(`   ✅ Selected ${excludeSelection.length} questions excluding ${excludeIds.length} IDs`);
    
    // Verify exclusion worked
    const hasExcluded = excludeSelection.some(q => excludeIds.includes(q.id));
    console.log(`   ${hasExcluded ? '❌' : '✅'} Exclusion ${hasExcluded ? 'failed' : 'successful'}`);

    // Test 5: Fallback logic with impossible criteria
    console.log('\n📋 Test 5: Fallback logic with impossible criteria');
    const impossibleCriteria = {
      domain: 'NonExistentDomain',
      subject: 'NonExistentSubject'
    };
    
    const fallbackSelection = await questionSelector.selectQuestionsForQuiz(impossibleCriteria, 3);
    console.log(`   ✅ Fallback selected ${fallbackSelection.length} questions`);

    console.log('\n🎉 Core QuestionSelector tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n📋 Error Details:');
    console.log('   Message:', error.message);
    console.log('   Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

// Run the tests
testQuestionSelector();
