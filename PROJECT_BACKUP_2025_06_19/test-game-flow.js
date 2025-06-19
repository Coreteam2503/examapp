const { db: knex } = require('./src/config/database');

async function testGameFlow() {
  try {
    console.log('🧪 Testing game generation flow...\n');
    
    // 1. Check if there are any existing quizzes
    const totalQuizzes = await knex('quizzes').count('id as count').first();
    console.log(`📊 Total quizzes in database: ${totalQuizzes.count}`);
    
    // 2. Check for game format quizzes specifically
    const gameQuizzes = await knex('quizzes')
      .whereNotNull('game_format')
      .whereNot('game_format', 'traditional');
      
    console.log(`🎮 Game format quizzes: ${gameQuizzes.length}`);
    
    if (gameQuizzes.length > 0) {
      console.log('\nGame quizzes found:');
      gameQuizzes.forEach(quiz => {
        console.log(`  - ID: ${quiz.id}, Format: ${quiz.game_format}, Title: ${quiz.title}`);
      });
    }
    
    // 3. Check recent activity (last 24 hours)
    const recentQuizzes = await knex('quizzes')
      .where('created_at', '>', knex.raw("datetime('now', '-24 hours')"))
      .orderBy('created_at', 'desc');
      
    console.log(`\n⏰ Recent quizzes (last 24h): ${recentQuizzes.length}`);
    if (recentQuizzes.length > 0) {
      recentQuizzes.forEach(quiz => {
        console.log(`  - ${quiz.created_at}: ${quiz.title} (${quiz.game_format || 'traditional'})`);
      });
    }
    
    // 4. Test the API endpoint availability
    console.log('\n🔌 Testing API endpoints:');
    
    // Check if games route exists by trying to access the controller
    try {
      const gameController = require('./src/controllers/gameFormatController');
      console.log('  ✅ Game controller loaded successfully');
    } catch (err) {
      console.log('  ❌ Game controller error:', err.message);
    }
    
    // 5. Check uploads table for test data
    const uploads = await knex('uploads').select('id', 'filename', 'user_id').limit(5);
    console.log(`\n📁 Available uploads for testing: ${uploads.length}`);
    uploads.forEach(upload => {
      console.log(`  - ID: ${upload.id}, File: ${upload.filename}, User: ${upload.user_id}`);
    });
    
    // 6. Simulate a game generation test (without actually calling LLM)
    if (uploads.length > 0) {
      console.log('\n🎯 Simulating game generation...');
      
      const testUpload = uploads[0];
      console.log(`Using upload: ${testUpload.filename} (ID: ${testUpload.id})`);
      
      // Insert a test game quiz
      const [testQuizId] = await knex('quizzes').insert({
        upload_id: testUpload.id,
        user_id: testUpload.user_id,
        created_by: testUpload.user_id,
        title: `TEST HANGMAN - ${testUpload.filename}`,
        difficulty: 'medium',
        total_questions: 1,
        game_format: 'hangman',
        game_options: JSON.stringify({ maxWrongGuesses: 6 }),
        created_at: new Date(),
        metadata: JSON.stringify({ test: true, generated_by: 'test_script' })
      });
      
      // Insert a test question
      await knex('questions').insert({
        quiz_id: testQuizId,
        question_number: 1,
        type: 'hangman',
        question_text: 'Guess the word',
        correct_answer: 'PROGRAMMING',
        word_data: JSON.stringify({
          word: 'PROGRAMMING',
          category: 'Technology',
          hint: 'Creating software applications'
        }),
        max_attempts: 6,
        difficulty: 'medium',
        concepts: JSON.stringify(['programming', 'software']),
        created_at: new Date()
      });
      
      console.log(`✅ Created test game quiz with ID: ${testQuizId}`);
      
      // Verify it was created
      const testQuiz = await knex('quizzes').where('id', testQuizId).first();
      console.log(`📝 Test quiz details:`, {
        id: testQuiz.id,
        title: testQuiz.title,
        game_format: testQuiz.game_format,
        total_questions: testQuiz.total_questions
      });
      
      // Check if it would appear in the API response
      const userQuizzes = await knex('quizzes')
        .select(['quizzes.*', 'uploads.filename', 'uploads.file_type'])
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
        .where('quizzes.user_id', testUpload.user_id)
        .orderBy('quizzes.created_at', 'desc')
        .limit(5);
        
      console.log(`\n📋 User's quizzes (as API would return):`, userQuizzes.map(q => ({
        id: q.id,
        title: q.title,
        game_format: q.game_format || 'traditional',
        is_game: q.game_format && q.game_format !== 'traditional'
      })));
    }
    
    console.log('\n🎉 Game flow test completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Try generating a game through the frontend');
    console.log('2. Check if it appears in the quiz list');
    console.log('3. Check browser console for any errors');
    console.log('4. Check backend logs for game generation');
    
  } catch (error) {
    console.error('❌ Error testing game flow:', error);
  } finally {
    process.exit(0);
  }
}

testGameFlow();
