/**
 * COMPLETE DATABASE RESET SCRIPT
 * Removes all questions and quizzes for a clean start
 */

const knex = require('knex');
const config = require('./knexfile');

const db = knex(config.development);

async function resetDatabase() {
  console.log('🧹 COMPLETE DATABASE RESET');
  console.log('==========================\n');
  
  try {
    // Step 1: Delete all questions
    console.log('Step 1: Removing all questions...');
    const deletedQuestions = await db('questions').del();
    console.log(`✅ Deleted ${deletedQuestions} questions`);
    
    // Step 2: Delete all quizzes
    console.log('\nStep 2: Removing all quizzes...');
    const deletedQuizzes = await db('quizzes').del();
    console.log(`✅ Deleted ${deletedQuizzes} quizzes`);
    
    // Step 3: Delete all quiz attempts (if any)
    console.log('\nStep 3: Removing quiz attempts...');
    const deletedAttempts = await db('quiz_attempts').del();
    console.log(`✅ Deleted ${deletedAttempts} quiz attempts`);
    
    // Step 4: Reset auto-increment counters
    console.log('\nStep 4: Resetting auto-increment counters...');
    await db.raw("DELETE FROM sqlite_sequence WHERE name IN ('questions', 'quizzes', 'quiz_attempts')");
    console.log('✅ Auto-increment counters reset');
    
    // Step 5: Verify clean state
    console.log('\nStep 5: Verifying clean state...');
    const [questionCount, quizCount, attemptCount] = await Promise.all([
      db('questions').count('* as count').first(),
      db('quizzes').count('* as count').first(),
      db('quiz_attempts').count('* as count').first()
    ]);
    
    console.log(`Questions remaining: ${questionCount.count}`);
    console.log(`Quizzes remaining: ${quizCount.count}`);
    console.log(`Quiz attempts remaining: ${attemptCount.count}`);
    
    if (questionCount.count === 0 && quizCount.count === 0 && attemptCount.count === 0) {
      console.log('\n✅ Database successfully reset to clean state!');
    } else {
      console.log('\n⚠️  Some data may still remain');
    }
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n🏁 Database reset completed');
      console.log('\n🎯 Ready for fresh data:');
      console.log('  1. Add your questions through the admin interface');
      console.log('  2. Generate quizzes with proper question types');
      console.log('  3. Test the universal question system');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
