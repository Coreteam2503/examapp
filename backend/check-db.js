// Database schema check
const { db } = require('./src/config/database');

async function checkDatabaseSchema() {
  console.log('🗄️ CHECKING DATABASE SCHEMA...\n');
  
  try {
    // Check if quizzes table exists and has game_format column
    console.log('1. QUIZZES TABLE:');
    const quizzesInfo = await db.raw("PRAGMA table_info(quizzes)");
    console.log('   Columns:', quizzesInfo.map(col => col.name).join(', '));
    
    const hasGameFormat = quizzesInfo.some(col => col.name === 'game_format');
    console.log('   Has game_format column:', hasGameFormat ? '✅ YES' : '❌ NO');
    
    // Check if questions table exists and has game-specific columns
    console.log('\n2. QUESTIONS TABLE:');
    const questionsInfo = await db.raw("PRAGMA table_info(questions)");
    console.log('   Columns:', questionsInfo.map(col => col.name).join(', '));
    
    const gameColumns = ['word_data', 'level_number', 'pattern_data', 'ladder_steps', 'max_attempts', 'visual_data'];
    gameColumns.forEach(col => {
      const hasColumn = questionsInfo.some(dbCol => dbCol.name === col);
      console.log(`   Has ${col}:`, hasColumn ? '✅ YES' : '❌ NO');
    });
    
    // Check uploads table
    console.log('\n3. UPLOADS TABLE:');
    const uploadsInfo = await db.raw("PRAGMA table_info(uploads)");
    console.log('   Columns:', uploadsInfo.map(col => col.name).join(', '));
    
    // Test insert into quizzes table
    console.log('\n4. TEST DATABASE OPERATIONS:');
    try {
      await db.raw('BEGIN TRANSACTION');
      
      const [testQuizId] = await db('quizzes').insert({
        title: 'TEST QUIZ',
        difficulty: 'medium',
        total_questions: 1,
        game_format: 'hangman',
        game_options: '{}',
        metadata: '{}',
        created_at: new Date()
      });
      
      console.log('   Test quiz insert: ✅ SUCCESS (ID:', testQuizId + ')');
      
      // Test insert into questions table
      await db('questions').insert({
        quiz_id: testQuizId,
        question_number: 1,
        type: 'hangman',
        question_text: 'TEST',
        correct_answer: 'TEST',
        word_data: '{"word":"TEST","hint":"test"}',
        max_attempts: 6,
        concepts: '["test"]',
        created_at: new Date()
      });
      
      console.log('   Test question insert: ✅ SUCCESS');
      
      await db.raw('ROLLBACK'); // Don't save test data
      console.log('   Test data rolled back: ✅ SUCCESS');
      
    } catch (dbError) {
      await db.raw('ROLLBACK');
      console.log('   Database operation test: ❌ FAILED');
      console.log('   Error:', dbError.message);
    }
    
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  } finally {
    await db.destroy();
  }
}

checkDatabaseSchema();
