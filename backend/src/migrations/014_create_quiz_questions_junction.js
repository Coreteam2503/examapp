/**
 * Create quiz_questions junction table and migrate to proper quiz-question relationship
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('quiz_questions', function(table) {
      table.increments('id').primary();
      table.integer('quiz_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.integer('question_number').notNullable();
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
      
      // Foreign key constraints
      table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      
      // Ensure unique question per quiz and unique order within quiz
      table.unique(['quiz_id', 'question_id']);
      table.unique(['quiz_id', 'question_number']);
    })
    .then(() => {
      // Clean up: Delete all questions that were assigned to quizzes (duplicates)
      return knex('questions').whereNotNull('quiz_id').del();
    })
    .then(() => {
      // Reset all questions to be unassigned (question bank)
      return knex('questions').update({ 
        quiz_id: null,
        question_number: 0,
        updated_at: knex.fn.now()
      });
    })
    .then(() => {
      // Clean up: Delete all existing quiz attempts and answers
      return knex('answers').del();
    })
    .then(() => {
      return knex('attempts').del();
    })
    .then(() => {
      // Clean up: Delete all existing quizzes
      return knex('quizzes').del();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('quiz_questions');
};
