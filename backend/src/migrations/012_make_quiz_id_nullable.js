/**
 * Migration: Make quiz_id nullable for question bank support
 * Allows questions to exist independently in the question bank without being tied to a specific quiz
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Making quiz_id nullable for question bank support...');
    
    // For SQLite, we need to recreate the table to change NOT NULL constraint
    const tableInfo = await knex.raw("PRAGMA table_info(questions)");
    console.log('Current questions table structure:', tableInfo);
    
    // Create new table with quiz_id as nullable
    await knex.schema.raw(`
      CREATE TABLE questions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NULL,
        question_number INTEGER NOT NULL,
        type TEXT CHECK (type IN (
          'multiple_choice', 
          'mcq',
          'fill_blank', 
          'fill_in_the_blank', 
          'true_false', 
          'matching',
          'hangman',
          'knowledge_tower',
          'word_ladder',
          'memory_grid',
          'drag_drop_match',
          'drag_drop_order'
        )) DEFAULT 'multiple_choice',
        question_text TEXT NOT NULL,
        code_snippet TEXT,
        options TEXT,
        correct_answer TEXT,
        correct_answers_data TEXT,
        pairs TEXT,
        items TEXT,
        correct_order TEXT,
        explanation TEXT,
        difficulty TEXT DEFAULT 'medium',
        concepts TEXT DEFAULT '[]',
        hint TEXT,
        hint_detailed TEXT,
        formatted_text TEXT,
        word_data TEXT,
        level_number INTEGER DEFAULT 1,
        pattern_data TEXT,
        ladder_steps TEXT,
        max_attempts INTEGER DEFAULT 6,
        visual_data TEXT,
        domain TEXT DEFAULT 'General',
        subject TEXT DEFAULT 'General',
        source TEXT DEFAULT 'Custom',
        weightage INTEGER DEFAULT 1,
        difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);
    
    // Copy existing data
    console.log('📋 Copying existing questions data...');
    await knex.raw(`
      INSERT INTO questions_new (
        id, quiz_id, question_number, type, question_text, code_snippet,
        options, correct_answer, correct_answers_data, pairs, items, correct_order,
        explanation, difficulty, concepts, hint, hint_detailed, formatted_text,
        word_data, level_number, pattern_data, ladder_steps, max_attempts, visual_data,
        domain, subject, source, weightage, difficulty_level, created_at, updated_at
      )
      SELECT 
        id, quiz_id, question_number, type, question_text, code_snippet,
        options, correct_answer, correct_answers_data, pairs, items, correct_order,
        explanation, difficulty, concepts, hint, hint_detailed, formatted_text,
        word_data, level_number, pattern_data, ladder_steps, max_attempts, visual_data,
        domain, subject, source, weightage, difficulty_level, created_at, updated_at
      FROM questions
    `);
    
    // Drop old table and rename new one
    console.log('🔄 Replacing questions table...');
    await knex.schema.dropTable('questions');
    await knex.schema.raw('ALTER TABLE questions_new RENAME TO questions');
    
    // Recreate indexes
    console.log('📝 Creating indexes...');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_quiz_id_index ON questions (quiz_id)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_question_number_index ON questions (question_number)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions (domain)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions (subject)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_questions_difficulty_level ON questions (difficulty_level)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_questions_weightage ON questions (weightage)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_questions_metadata_composite ON questions (domain, subject, source, difficulty_level)');
    
    console.log('✅ quiz_id is now nullable - question bank ready!');
    
  } catch (error) {
    console.error('❌ Error making quiz_id nullable:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Reverting quiz_id nullable change...');
    console.log('⚠️  WARNING: This will delete questions without quiz_id!');
    
    // Delete questions without quiz_id first
    const orphanCount = await knex('questions').whereNull('quiz_id').del();
    console.log(`🗑️  Deleted ${orphanCount} question bank questions`);
    
    // Recreate table with NOT NULL quiz_id
    await knex.schema.raw(`
      CREATE TABLE questions_old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        type TEXT CHECK (type IN (
          'multiple_choice', 
          'mcq',
          'fill_blank', 
          'fill_in_the_blank', 
          'true_false', 
          'matching',
          'hangman',
          'knowledge_tower',
          'word_ladder',
          'memory_grid',
          'drag_drop_match',
          'drag_drop_order'
        )) DEFAULT 'multiple_choice',
        question_text TEXT NOT NULL,
        code_snippet TEXT,
        options TEXT,
        correct_answer TEXT,
        correct_answers_data TEXT,
        pairs TEXT,
        items TEXT,
        correct_order TEXT,
        explanation TEXT,
        difficulty TEXT DEFAULT 'medium',
        concepts TEXT DEFAULT '[]',
        hint TEXT,
        hint_detailed TEXT,
        formatted_text TEXT,
        word_data TEXT,
        level_number INTEGER DEFAULT 1,
        pattern_data TEXT,
        ladder_steps TEXT,
        max_attempts INTEGER DEFAULT 6,
        visual_data TEXT,
        domain TEXT DEFAULT 'General',
        subject TEXT DEFAULT 'General',
        source TEXT DEFAULT 'Custom',
        weightage INTEGER DEFAULT 1,
        difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);
    
    // Copy back data (only questions with quiz_id)
    await knex.raw(`
      INSERT INTO questions_old (
        id, quiz_id, question_number, type, question_text, code_snippet,
        options, correct_answer, correct_answers_data, pairs, items, correct_order,
        explanation, difficulty, concepts, hint, hint_detailed, formatted_text,
        word_data, level_number, pattern_data, ladder_steps, max_attempts, visual_data,
        domain, subject, source, weightage, difficulty_level, created_at, updated_at
      )
      SELECT 
        id, quiz_id, question_number, type, question_text, code_snippet,
        options, correct_answer, correct_answers_data, pairs, items, correct_order,
        explanation, difficulty, concepts, hint, hint_detailed, formatted_text,
        word_data, level_number, pattern_data, ladder_steps, max_attempts, visual_data,
        domain, subject, source, weightage, difficulty_level, created_at, updated_at
      FROM questions
      WHERE quiz_id IS NOT NULL
    `);
    
    await knex.schema.dropTable('questions');
    await knex.schema.raw('ALTER TABLE questions_old RENAME TO questions');
    
    // Recreate indexes
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_quiz_id_index ON questions (quiz_id)');
    await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_question_number_index ON questions (question_number)');
    
    console.log('✅ Reverted quiz_id to NOT NULL');
    
  } catch (error) {
    console.error('❌ Error reverting quiz_id nullable change:', error);
    throw error;
  }
};
