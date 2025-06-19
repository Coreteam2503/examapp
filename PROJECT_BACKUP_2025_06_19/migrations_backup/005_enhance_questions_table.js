exports.up = function(knex) {
  return knex.schema.alterTable('questions', table => {
    // Add new columns for enhanced question support
    table.text('correct_answers_data').nullable(); // JSON data for fill-in-blank answers
    table.text('hint').nullable(); // Hint for students
    table.text('formatted_text').nullable(); // Formatted text with blanks
  }).then(() => {
    // Update enum to include fill_in_the_blank
    return knex.schema.raw(`
      CREATE TABLE questions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        type TEXT CHECK (type IN ('multiple_choice', 'fill_blank', 'fill_in_the_blank', 'true_false', 'matching')) DEFAULT 'multiple_choice',
        question_text TEXT NOT NULL,
        code_snippet TEXT,
        options TEXT,
        correct_answer TEXT,
        correct_answers_data TEXT,
        explanation TEXT,
        difficulty TEXT,
        concepts TEXT,
        hint TEXT,
        formatted_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);
  }).then(() => {
    // Copy data to new table
    return knex.raw(`
      INSERT INTO questions_new (
        id, quiz_id, question_number, type, question_text, code_snippet, 
        options, correct_answer, explanation, difficulty, concepts, created_at
      )
      SELECT 
        id, quiz_id, question_number, type, question_text, code_snippet, 
        options, correct_answer, explanation, difficulty, concepts, created_at
      FROM questions
    `);
  }).then(() => {
    // Drop old table and rename new one
    return knex.schema.dropTable('questions');
  }).then(() => {
    return knex.schema.raw('ALTER TABLE questions_new RENAME TO questions');
  }).then(() => {
    // Recreate indexes
    return knex.schema.raw('CREATE INDEX questions_quiz_id_index ON questions (quiz_id)');
  }).then(() => {
    return knex.schema.raw('CREATE INDEX questions_question_number_index ON questions (question_number)');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('questions', table => {
    table.dropColumn('correct_answers_data');
    table.dropColumn('hint');
    table.dropColumn('formatted_text');
  });
};
