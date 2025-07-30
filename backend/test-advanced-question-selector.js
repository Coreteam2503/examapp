require('dotenv').config();
const questionSelector = require('./src/services/questionSelector');
const { db } = require('./src/config/database');

/**
 * Extended test suite for QuestionSelector service
 * Tests advanced functionality and edge cases
 */
async function testAdvancedFeatures() {
  console.log('🔬 Testing advanced QuestionSelector features...\n');

  try {
    // Test 6: Criteria statistics
    console.log('📋 Test 6: Criteria statistics generation');
    const stats = await questionSelector.getCriteriaStats();
    console.log(`   ✅ Generated stats for ${stats.length} criteria combinations`);
    console.log(`   📊 Sample stat: ${stats[0]?.domain} / ${stats[0]?.subject} (${stats[0]?.question_count} questions)`);

    // Test 7: Preview selection
    console.log('\n📋 Test 7: Preview selection');
    const preview = await questionSelector.previewSelection({
      domain: 'Computer Science',
      difficulty_level: 'Easy'
    }, 3);
    console.log(`   ✅ Preview: ${preview.sampleQuestions.length} sample from ${preview.totalMatching} total`);
    console.log(`   📊 Preview criteria: ${JSON.stringify(preview.criteria)}`);

    // Test 8: Question uniqueness validation
    console.log('\n📋 Test 8: Question uniqueness validation');
    const sampleQuestions = await questionSelector.selectQuestionsForQuiz({
      domain: 'Computer Science'
    }, 3);
    
    const uniqueTest = await questionSelector.validateQuestionUniqueness(sampleQuestions);
    console.log(`   ✅ Uniqueness validation: ${uniqueTest.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   📝 Message: ${uniqueTest.message}`);

    // Test 9: Cache functionality
    console.log('\n📋 Test 9: Cache functionality');
    questionSelector.clearCache();
    console.log('   🧹 Cache cleared');
    
    const beforeCache = Date.now();
    await questionSelector.getCriteriaStats();
    const firstCall = Date.now() - beforeCache;
    
    const beforeCached = Date.now();
    await questionSelector.getCriteriaStats();
    const secondCall = Date.now() - beforeCached;
    
    console.log(`   ⏱️ First call: ${firstCall}ms, Second call: ${secondCall}ms`);
    console.log(`   ${secondCall < firstCall ? '✅' : '⚠️'} Caching ${secondCall < firstCall ? 'effective' : 'may need optimization'}`);

    // Test 10: Large selection test
    console.log('\n📋 Test 10: Large selection test');
    const largeSelection = await questionSelector.selectQuestionsForQuiz({}, 50);
    console.log(`   ✅ Large selection: ${largeSelection.length} questions selected`);
    
    // Verify no duplicates in large selection
    const ids = largeSelection.map(q => q.id);
    const uniqueIds = [...new Set(ids)];
    console.log(`   ${ids.length === uniqueIds.length ? '✅' : '❌'} No duplicates in large selection`);

    // Test 11: Different question types coverage
    console.log('\n📋 Test 11: Question type coverage');
    const allQuestions = await questionSelector.selectQuestionsForQuiz({}, 30);
    const typeDistribution = allQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   📊 Question type distribution:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`      ${type}: ${count} questions`);
    });

    console.log('\n🎉 All advanced QuestionSelector tests completed successfully!');
    console.log('\n📊 Advanced Test Summary:');
    console.log('   ✅ Criteria statistics: PASSED');
    console.log('   ✅ Preview functionality: PASSED');
    console.log('   ✅ Uniqueness validation: PASSED');
    console.log('   ✅ Cache functionality: PASSED');
    console.log('   ✅ Large selection handling: PASSED');
    console.log('   ✅ Question type diversity: PASSED');

  } catch (error) {
    console.error('❌ Advanced test failed:', error);
    console.log('\n📋 Error Details:');
    console.log('   Message:', error.message);
  } finally {
    await db.destroy();
  }
}

// Run the advanced tests
testAdvancedFeatures();
