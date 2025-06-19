const { db: knex } = require('./src/config/database');

async function debugGames() {
  try {
    console.log('🔍 Checking database for games...');
    
    // Check all quizzes
    const allQuizzes = await knex('quizzes')
      .select('id', 'title', 'game_format', 'total_questions', 'created_at', 'user_id')
      .orderBy('created_at', 'desc');
      
    console.log('\n📊 All Quizzes:');
    allQuizzes.forEach(quiz => {
      console.log(`  ID: ${quiz.id}, Format: ${quiz.game_format || 'NULL'}, Title: ${quiz.title}, Questions: ${quiz.total_questions}, User: ${quiz.user_id}`);
    });
    
    // Check specifically for game formats
    const gameQuizzes = await knex('quizzes')
      .whereNotNull('game_format')
      .whereNot('game_format', 'traditional');
      
    console.log('\n🎮 Game Format Quizzes:');
    if (gameQuizzes.length === 0) {
      console.log('  No game format quizzes found');
    } else {
      gameQuizzes.forEach(quiz => {
        console.log(`  ID: ${quiz.id}, Format: ${quiz.game_format}, Title: ${quiz.title}`);
      });
    }
    
    // Check questions for game data
    const gameQuestions = await knex('questions')
      .whereNotNull('word_data')
      .orWhereNotNull('pattern_data')
      .orWhereNotNull('ladder_steps');
      
    console.log('\n🎯 Game Questions:');
    if (gameQuestions.length === 0) {
      console.log('  No game-specific questions found');
    } else {
      gameQuestions.forEach(q => {
        console.log(`  Quiz ID: ${q.quiz_id}, Type: ${q.type}, Has word_data: ${!!q.word_data}, Has pattern_data: ${!!q.pattern_data}`);
      });
    }
    
    // Check recent database activity
    const recentQuizzes = await knex('quizzes')
      .where('created_at', '>', knex.raw("datetime('now', '-1 hour')"))
      .orderBy('created_at', 'desc');
      
    console.log('\n⏰ Recent Quizzes (last hour):');
    if (recentQuizzes.length === 0) {
      console.log('  No quizzes created in the last hour');
    } else {
      recentQuizzes.forEach(quiz => {
        console.log(`  ID: ${quiz.id}, Format: ${quiz.game_format || 'NULL'}, Title: ${quiz.title}, Created: ${quiz.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    process.exit(0);
  }
}

debugGames();
