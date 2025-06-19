exports.up = function(knex) {
  return knex.schema.hasTable('questions').then(exists => {
    if (exists) {
      return knex.schema.raw(`
        -- Create new questions table with game format support
        CREATE TABLE questions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_number INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN (
            'multiple_choice', 
            'fill_blank', 
            'fill_in_the_blank', 
            'true_false', 
            'matching',
            'hangman',
            'knowledge_tower',
            'word_ladder',
            'memory_grid'
          )),
          question_text TEXT NOT NULL,
          code_snippet TEXT,
          options TEXT,
          correct_answer TEXT,
          correct_answers_data TEXT,
          pairs TEXT,
          items TEXT,
          correct_order TEXT,
          explanation TEXT,
          difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
          concepts TEXT DEFAULT '[]',
          hint TEXT,
          formatted_text TEXT,
          word_data TEXT,
          level_number INTEGER DEFAULT 1,
          pattern_data TEXT,
          ladder_steps TEXT,
          max_attempts INTEGER DEFAULT 6,
          visual_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
        
        -- Copy existing data
        INSERT INTO questions_new SELECT 
          id, quiz_id, question_number, type, question_text, code_snippet, 
          options, correct_answer, correct_answers_data, pairs, items, 
          correct_order, explanation, difficulty, concepts, hint, formatted_text,
          word_data, level_number, pattern_data, ladder_steps, max_attempts, 
          visual_data, created_at, updated_at
        FROM questions;
        
        -- Drop old table and rename new one
        DROP TABLE questions;
        ALTER TABLE questions_new RENAME TO questions;
      `);
    }
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('questions').then(exists => {
    if (exists) {
      return knex.schema.raw(`
        -- Create old questions table without game format support
        CREATE TABLE questions_old (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_number INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN (
            'multiple_choice', 
            'fill_blank', 
            'fill_in_the_blank', 
            'true_false', 
            'matching'
          )),
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
          formatted_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
        
        -- Copy back data (excluding game format questions)
        INSERT INTO questions_old SELECT 
          id, quiz_id, question_number, type, question_text, code_snippet, 
          options, correct_answer, correct_answers_data, pairs, items, 
          correct_order, explanation, difficulty, concepts, hint, formatted_text,
          created_at, updated_at
        FROM questions
        WHERE type IN ('multiple_choice', 'fill_blank', 'fill_in_the_blank', 'true_false', 'matching');
        
        -- Drop current table and rename old one
        DROP TABLE questions;
        ALTER TABLE questions_old RENAME TO questions;
      `);
    }
  });
};
