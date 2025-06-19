const { db: knex } = require('./src/config/database');

async function fixQuestionTypes() {
  try {
    console.log('🔧 Fixing question types constraint...\n');
    
    // Check current questions table schema
    const questionsSchema = await knex.raw("PRAGMA table_info(questions)");
    console.log('📊 Current questions table schema:');
    questionsSchema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
    // Get current data
    const existingQuestions = await knex('questions').select('*');
    console.log(`\n💾 Found ${existingQuestions.length} existing questions to preserve`);
    
    // Drop the existing table and recreate with proper constraints
    console.log('\n🔄 Recreating questions table with game format support...');
    
    await knex.schema.dropTableIfExists('questions_backup');
    
    // Create backup
    await knex.schema.createTable('questions_backup', table => {
      table.increments('id').primary();
      table.integer('quiz_id').notNullable();
      table.integer('question_number').notNullable();
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
      table.text('word_data');
      table.integer('level_number').defaultTo(1);
      table.text('pattern_data');
      table.text('ladder_steps');
      table.integer('max_attempts').defaultTo(6);
      table.text('visual_data');
      table.timestamps(true, true);
    });
    
    // Copy existing data to backup
    if (existingQuestions.length > 0) {
      await knex('questions_backup').insert(existingQuestions);
      console.log('✅ Backed up existing questions');
    }
    
    // Drop and recreate questions table with updated constraints
    await knex.schema.dropTable('questions');
    
    await knex.schema.createTable('questions', table => {
      table.increments('id').primary();
      table.integer('quiz_id').notNullable();
      table.integer('question_number').notNullable();
      
      // Updated type constraint to include game formats
      table.enu('type', [
        'multiple_choice', 
        'fill_blank', 
        'fill_in_the_blank', 
        'true_false', 
        'matching',
        'hangman',
        'knowledge_tower', 
        'word_ladder',
        'memory_grid'
      ]).notNullable();
      
      table.text('question_text').notNullable();
      table.text('code_snippet');
      table.text('options');
      table.text('correct_answer');
      table.text('correct_answers_data');
      table.text('pairs');
      table.text('items');
      table.text('correct_order');
      table.text('explanation');
      table.enu('difficulty', ['easy', 'medium', 'hard']).defaultTo('medium');
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
      
      // Foreign key
      table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
    });
    
    // Restore data from backup
    if (existingQuestions.length > 0) {
      const questionsToRestore = existingQuestions.map(q => ({
        ...q,
        created_at: q.created_at || new Date(),
        updated_at: q.updated_at || new Date()
      }));
      
      await knex('questions').insert(questionsToRestore);
      console.log('✅ Restored existing questions');
    }
    
    // Clean up backup
    await knex.schema.dropTable('questions_backup');
    
    console.log('✅ Questions table recreated with game format support!');
    
    // Test the new constraint
    console.log('\n🧪 Testing new question types...');
    
    // Try to create a test game question
    const testQuizzes = await knex('quizzes').limit(1);
    if (testQuizzes.length > 0) {
      const testQuizId = testQuizzes[0].id;
      
      try {
        const [testQuestionId] = await knex('questions').insert({
          quiz_id: testQuizId,
          question_number: 999,
          type: 'hangman',
          question_text: 'Test hangman question',
          correct_answer: 'TEST',
          word_data: JSON.stringify({ word: 'TEST', hint: 'Test word' }),
          difficulty: 'medium',
          concepts: JSON.stringify(['test']),
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log('✅ Successfully created test hangman question');
        
        // Clean up test question
        await knex('questions').where('id', testQuestionId).delete();
        console.log('✅ Cleaned up test question');
        
      } catch (error) {
        console.log('❌ Test question creation failed:', error.message);
      }
    }
    
    console.log('\n🎉 Database schema fix completed!');
    console.log('✅ Game formats should now work properly');
    
  } catch (error) {
    console.error('❌ Error fixing question types:', error);
  } finally {
    process.exit(0);
  }
}

fixQuestionTypes();
