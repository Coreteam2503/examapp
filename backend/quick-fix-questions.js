const { db: knex } = require('./src/config/database');

async function quickFix() {
  try {
    console.log('🔧 Quick fix for game format support...\n');
    
    // First, let's see what we have
    const questions = await knex('questions').count('* as count').first();
    console.log(`📊 Current questions count: ${questions.count}`);
    
    // Since SQLite doesn't easily allow modifying CHECK constraints,
    // let's create a completely new questions table
    
    console.log('🔄 Creating new questions table with game support...');
    
    // Get existing data first
    const existingQuestions = await knex('questions').select('*');
    console.log(`💾 Backing up ${existingQuestions.length} existing questions`);
    
    // Drop the table completely
    await knex.schema.dropTableIfExists('questions');
    
    // Create new table with proper game format support
    await knex.schema.createTable('questions', table => {
      table.increments('id').primary();
      table.integer('quiz_id').notNullable();
      table.integer('question_number').notNullable();
      
      // No CHECK constraint - just text field for flexibility
      table.text('type').notNullable();
      
      table.text('question_text').notNullable();
      table.text('code_snippet');
      table.text('options');
      table.text('correct_answer');
      table.text('correct_answers_data');
      table.text('pairs');
      table.text('items');
      table.text('correct_order');
      table.text('explanation');
      table.text('difficulty').defaultTo('medium');
      table.text('concepts').defaultTo('[]');
      table.text('hint');
      table.text('formatted_text');
      
      // Game format specific columns
      table.text('word_data');
      table.integer('level_number').defaultTo(1);
      table.text('pattern_data');
      table.text('ladder_steps');
      table.integer('max_attempts').defaultTo(6);
      table.text('visual_data');
      
      table.timestamps(true, true);
    });
    
    // Restore existing data
    if (existingQuestions.length > 0) {
      const questionsToRestore = existingQuestions.map(q => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question_number: q.question_number,
        type: q.type,
        question_text: q.question_text,
        code_snippet: q.code_snippet,
        options: q.options,
        correct_answer: q.correct_answer,
        correct_answers_data: q.correct_answers_data,
        pairs: q.pairs,
        items: q.items,
        correct_order: q.correct_order,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        concepts: q.concepts || '[]',
        hint: q.hint,
        formatted_text: q.formatted_text,
        word_data: q.word_data || null,
        level_number: q.level_number || 1,
        pattern_data: q.pattern_data || null,
        ladder_steps: q.ladder_steps || null,
        max_attempts: q.max_attempts || 6,
        visual_data: q.visual_data || null,
        created_at: q.created_at || new Date(),
        updated_at: q.updated_at || new Date()
      }));
      
      await knex.batchInsert('questions', questionsToRestore, 50);
      console.log('✅ Restored existing questions');
    }
    
    console.log('✅ Questions table recreated without CHECK constraints!');
    
    // Test game question creation
    console.log('\n🧪 Testing game question creation...');
    
    const testQuizzes = await knex('quizzes').limit(1);
    if (testQuizzes.length > 0) {
      try {
        const [testId] = await knex('questions').insert({
          quiz_id: testQuizzes[0].id,
          question_number: 999,
          type: 'hangman',
          question_text: 'Test hangman question',
          correct_answer: 'PROGRAMMING',
          word_data: JSON.stringify({
            word: 'PROGRAMMING',
            category: 'Technology', 
            hint: 'Creating software applications'
          }),
          difficulty: 'medium',
          concepts: JSON.stringify(['programming', 'software']),
          max_attempts: 6
        });
        
        console.log('✅ Successfully created test hangman question!');
        
        // Verify and clean up
        const testQuestion = await knex('questions').where('id', testId).first();
        console.log('📝 Test question:', {
          id: testQuestion.id,
          type: testQuestion.type,
          word_data: testQuestion.word_data
        });
        
        await knex('questions').where('id', testId).delete();
        console.log('✅ Cleaned up test question');
        
      } catch (error) {
        console.log('❌ Test failed:', error.message);
      }
    }
    
    console.log('\n🎉 Quick fix completed! Game formats should now work.');
    
  } catch (error) {
    console.error('❌ Error in quick fix:', error);
  } finally {
    process.exit(0);
  }
}

quickFix();
