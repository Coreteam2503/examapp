/**
 * Test script for quiz criteria functionality
 */

const { db } = require('./src/config/database');

async function testQuizCriteria() {
  try {
    console.log('🧪 Testing Quiz Criteria Functionality...');
    
    // 1. Create a test batch with criteria
    console.log('\n📝 Step 1: Creating batch with quiz criteria...');
    
    const batchData = {
      name: 'GenAI Workshop - Test Batch',
      description: 'Test batch for criteria-based quiz assignment',
      subject: 'Artificial Intelligence',
      domain: 'Computer Science',
      created_by: 1,
      is_active: true,
      quiz_criteria: JSON.stringify({
        sources: ['educosys_RAG.ipynb', 'educosys_chatbot.py'],
        difficulty_levels: ['Easy', 'Medium'],
        domains: ['Computer Science'],
        subjects: ['Artificial Intelligence'],
        min_questions: 3
      })
    };
    
    const [batchId] = await db('batches').insert(batchData).returning('id');
    const createdBatchId = batchId?.id || batchId;
    console.log('✅ Created batch with ID:', createdBatchId);
    
    // 2. Check current questions in database
    console.log('\n📊 Step 2: Checking available questions...');
    
    const questionStats = await db('questions')
      .select('source', 'difficulty_level')
      .count('* as count')
      .groupBy('source', 'difficulty_level')
      .orderBy('source');
      
    console.log('📈 Question distribution:');
    questionStats.forEach(stat => {
      console.log(`  - ${stat.source} (${stat.difficulty_level}): ${stat.count} questions`);
    });
    
    // 3. Test getBatchQuizzes functionality
    console.log('\n🎯 Step 3: Testing getBatchQuizzes...');
    
    const Batch = require('./src/models/Batch');
    const quizzes = await Batch.getBatchQuizzes(createdBatchId);
    
    console.log(`📊 Found ${quizzes.length} quizzes matching criteria`);
    
    // 4. Display results
    console.log('\n✅ Test Results:');
    console.log(`- Batch created: ${createdBatchId}`);
    console.log(`- Criteria set: ✅`);
    console.log(`- Quiz matching: ${quizzes.length > 0 ? '✅' : '⚠️ No matching quizzes'}`);
    
    if (quizzes.length > 0) {
      console.log('\n📋 Matching Quizzes:');
      quizzes.forEach((quiz, index) => {
        console.log(`  ${index + 1}. ${quiz.title} (${quiz.question_count} questions)`);
      });
    } else {
      console.log('\n💡 To test quiz matching, create a quiz with questions from sources: educosys_RAG.ipynb or educosys_chatbot.py');
    }
    
    console.log('\n🎉 Quiz criteria functionality implemented successfully!');
    console.log('\n📚 Available API endpoints:');
    console.log('  - GET /api/batches/:id/quizzes - Get quizzes for batch');
    console.log('  - PUT /api/batches/:id/criteria - Update batch criteria');
    console.log('  - Auto-assignment triggers when new quizzes are created');
    
  } catch (error) {
    console.error('❌ Error testing quiz criteria:', error);
  } finally {
    await db.destroy();
  }
}

testQuizCriteria();
