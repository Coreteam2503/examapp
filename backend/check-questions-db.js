// Check current questions database content
const { db } = require('./src/config/database');

async function checkQuestionsDatabase() {
  console.log('🗄️ CHECKING QUESTIONS DATABASE CONTENT...\n');
  
  try {
    // Count total questions
    const questionCount = await db('questions').count('* as count').first();
    console.log('📊 TOTAL QUESTIONS:', questionCount.count);
    
    if (questionCount.count > 0) {
      console.log('\n📝 QUESTIONS BREAKDOWN:');
      
      // Group by type
      const byType = await db('questions')
        .select('type')
        .count('* as count')
        .groupBy('type');
      
      console.log('   By Type:');
      byType.forEach(row => {
        console.log(`     ${row.type}: ${row.count} questions`);
      });
      
      // Group by domain if available
      const domainQuery = await db('questions')
        .select('domain')
        .count('* as count')
        .groupBy('domain')
        .whereNotNull('domain');
      
      if (domainQuery.length > 0) {
        console.log('\n   By Domain:');
        domainQuery.forEach(row => {
          console.log(`     ${row.domain || 'Unknown'}: ${row.count} questions`);
        });
      }
      
      // Group by subject if available
      const subjectQuery = await db('questions')
        .select('subject')
        .count('* as count')
        .groupBy('subject')
        .whereNotNull('subject');
      
      if (subjectQuery.length > 0) {
        console.log('\n   By Subject:');
        subjectQuery.forEach(row => {
          console.log(`     ${row.subject || 'Unknown'}: ${row.count} questions`);
        });
      }
      
      // Show first few questions as samples
      console.log('\n📋 SAMPLE QUESTIONS (first 5):');
      const samples = await db('questions')
        .select('id', 'type', 'question_text', 'domain', 'subject', 'difficulty_level')
        .limit(5);
      
      samples.forEach((q, i) => {
        console.log(`\n   ${i + 1}. [ID: ${q.id}] [Type: ${q.type}]`);
        console.log(`      Domain: ${q.domain || 'N/A'}`);
        console.log(`      Subject: ${q.subject || 'N/A'}`);
        console.log(`      Difficulty: ${q.difficulty_level || 'N/A'}`);
        console.log(`      Question: ${q.question_text?.substring(0, 100)}${q.question_text?.length > 100 ? '...' : ''}`);
      });
      
      // Check quizzes table
      console.log('\n\n🎯 CHECKING QUIZZES TABLE:');
      const quizCount = await db('quizzes').count('* as count').first();
      console.log('   Total Quizzes:', quizCount.count);
      
      if (quizCount.count > 0) {
        const quizzes = await db('quizzes')
          .select('id', 'title', 'total_questions', 'game_format', 'created_at')
          .limit(5);
        
        console.log('\n   Recent Quizzes:');
        quizzes.forEach(quiz => {
          console.log(`     ${quiz.title} (${quiz.total_questions} questions) - ${quiz.game_format || 'traditional'}`);
        });
      }
      
    } else {
      console.log('\n✨ Database is clean - no questions found');
    }
    
  } catch (error) {
    console.log('❌ Error checking database:', error.message);
    console.log('Full error:', error);
  } finally {
    await db.destroy();
  }
}

checkQuestionsDatabase();
