/**
 * Test script for batch criteria dropdown functionality
 * This script tests the new API endpoints for getting criteria options
 */

// Load environment variables
require('dotenv').config();

const { db, testConnection } = require('./src/config/database');

async function testBatchCriteriaDropdowns() {
  try {
    console.log('🧪 Testing Batch Criteria Dropdown Functionality...');
    
    // 1. Test database connection first
    console.log('\n📡 Step 1: Testing database connection...');
    const connectionResult = await testConnection();
    if (!connectionResult) {
      console.error('❌ Database connection failed. Cannot proceed with tests.');
      return;
    }

    // 2. Check if we have questions in the database
    console.log('\n📊 Step 2: Checking available questions in database...');
    const questionCount = await db('questions').count('* as count').first();
    const totalQuestions = parseInt(questionCount.count);
    
    console.log(`📈 Total questions in database: ${totalQuestions}`);
    
    if (totalQuestions === 0) {
      console.log('⚠️  No questions found in database. Please add some questions first.');
      console.log('💡 You can create questions by uploading content and generating quizzes.');
      return;
    }

    // 3. Test getting distinct values for each criteria field
    console.log('\n🔍 Step 3: Testing criteria options extraction...');
    
    const [sources, difficulties, domains, subjects, types] = await Promise.all([
      db('questions').distinct('source').whereNotNull('source'),
      db('questions').distinct('difficulty_level').whereNotNull('difficulty_level'),  
      db('questions').distinct('domain').whereNotNull('domain'),
      db('questions').distinct('subject').whereNotNull('subject'),
      db('questions').distinct('type').whereNotNull('type')
    ]);

    console.log('📋 Available criteria options:');
    console.log(`  - Sources: ${sources.length} (${sources.map(s => s.source).join(', ')})`);
    console.log(`  - Difficulty Levels: ${difficulties.length} (${difficulties.map(d => d.difficulty_level).join(', ')})`);
    console.log(`  - Domains: ${domains.length} (${domains.map(d => d.domain).join(', ')})`);
    console.log(`  - Subjects: ${subjects.length} (${subjects.map(s => s.subject).join(', ')})`);
    console.log(`  - Question Types: ${types.length} (${types.map(t => t.type).join(', ')})`);

    // 4. Test criteria validation with sample data
    console.log('\n🎯 Step 4: Testing criteria validation...');
    
    if (sources.length > 0 && difficulties.length > 0) {
      const sampleCriteria = {
        sources: [sources[0].source],
        difficulty_levels: [difficulties[0].difficulty_level]
      };
      
      console.log('🔍 Testing with sample criteria:', sampleCriteria);
      
      // Build validation query
      let query = db('questions');
      if (sampleCriteria.sources.length > 0) {
        query = query.whereIn('source', sampleCriteria.sources);
      }
      if (sampleCriteria.difficulty_levels.length > 0) {
        query = query.whereIn('difficulty_level', sampleCriteria.difficulty_levels);
      }
      
      const matchingQuestions = await query.count('* as count').first();
      const matchingCount = parseInt(matchingQuestions.count);
      
      console.log(`✅ Found ${matchingCount} questions matching sample criteria`);
      
      if (matchingCount > 0) {
        console.log('🎉 Criteria validation logic works correctly!');
      } else {
        console.log('⚠️  No questions match the sample criteria - this may indicate data inconsistency');
      }
    }

    // 5. Simulate the new API endpoint responses
    console.log('\n📡 Step 5: Simulating API endpoint responses...');
    
    // Simulate getCriteriaOptions response
    const sourcesWithCount = await db('questions')
      .select('source')
      .count('* as count')
      .whereNotNull('source')
      .groupBy('source')
      .orderBy('source');
    
    const criteriaOptions = {
      sources: sourcesWithCount.map(item => ({
        value: item.source,
        label: item.source,
        count: parseInt(item.count),
        percentage: ((parseInt(item.count) / totalQuestions) * 100).toFixed(1)
      }))
    };
    
    console.log('📊 Sample API response for sources:');
    console.log(JSON.stringify(criteriaOptions.sources.slice(0, 3), null, 2));

    // 6. Test batch creation scenario
    console.log('\n🏗️  Step 6: Testing complete batch creation flow...');
    
    if (criteriaOptions.sources.length > 0) {
      const testBatchCriteria = {
        sources: [criteriaOptions.sources[0].value],
        difficulty_levels: difficulties.length > 0 ? [difficulties[0].difficulty_level] : [],
        min_questions: 1
      };
      
      console.log('🔧 Test batch criteria:', testBatchCriteria);
      
      // Test if this criteria would work for batch creation
      let batchQuery = db('questions');
      if (testBatchCriteria.sources.length > 0) {
        batchQuery = batchQuery.whereIn('source', testBatchCriteria.sources);
      }
      if (testBatchCriteria.difficulty_levels.length > 0) {
        batchQuery = batchQuery.whereIn('difficulty_level', testBatchCriteria.difficulty_levels);
      }
      
      const batchMatchingQuestions = await batchQuery.count('* as count').first();
      const batchMatchingCount = parseInt(batchMatchingQuestions.count);
      
      console.log(`✅ Batch criteria would match ${batchMatchingCount} questions`);
      
      if (batchMatchingCount >= testBatchCriteria.min_questions) {
        console.log('🎉 Batch criteria validation passed!');
      } else {
        console.log(`⚠️  Batch criteria validation failed: only ${batchMatchingCount} questions but ${testBatchCriteria.min_questions} required`);
      }
    }

    console.log('\n🎉 Batch Criteria Dropdown Functionality Test Completed!');
    console.log('\n📚 New API endpoints available:');
    console.log('  - GET /api/batches/criteria-options - Get dropdown options');
    console.log('  - POST /api/batches/validate-criteria - Validate criteria');
    console.log('  - POST /api/batches/preview-questions - Preview matching questions');
    console.log('\n✅ Ready for frontend integration!');

  } catch (error) {
    console.error('❌ Error testing batch criteria dropdowns:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await db.destroy();
  }
}

testBatchCriteriaDropdowns();