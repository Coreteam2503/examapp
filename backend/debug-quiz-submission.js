/**
 * Debug quiz submission with proper authentication
 */

async function debugQuizSubmission() {
  console.log('🔍 Debugging Quiz Submission with Auth...\n');
  
  try {
    // First, let's get a valid auth token by simulating a login
    // Since we don't have the login credentials, let's check the backend logs directly
    
    // Check if there are any existing quiz attempts
    const { db } = require('./src/config/database');
    
    console.log('📊 Current database state:');
    
    // Check quizzes
    const quizzes = await db('quizzes').select('id', 'title', 'user_id', 'total_questions');
    console.log('Quizzes:', quizzes);
    
    // Check questions for first quiz
    if (quizzes.length > 0) {
      const questions = await db('questions').where('quiz_id', quizzes[0].id).select('id', 'type', 'question_text');
      console.log(`Questions for quiz ${quizzes[0].id}:`, questions);
    }
    
    // Check existing quiz attempts
    const attempts = await db('quiz_attempts').select('*');
    console.log('Existing quiz attempts:', attempts);
    
    // Check users table for valid user_id
    const users = await db('users').select('id', 'username', 'email').limit(3);
    console.log('Users:', users);
    
    await db.destroy();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugQuizSubmission()
  .then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });
