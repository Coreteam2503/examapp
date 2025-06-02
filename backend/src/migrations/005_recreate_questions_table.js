exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('questions')
    .then(() => {
      return knex.schema.createTable('questions', table => {
        table.increments('id').primary();
        table.integer('quiz_id').notNullable();
        table.integer('question_number').notNullable();
        table.enum('type', ['multiple_choice', 'fill_blank', 'true_false', 'matching']).defaultTo('multiple_choice');
        table.text('question_text').notNullable();
        table.text('code_snippet');
        table.text('options'); // JSON string
        table.text('correct_answer').notNullable();
        table.text('explanation');
        table.text('difficulty');
        table.text('concepts'); // JSON string
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        // Foreign key
        table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
        
        // Indexes
        table.index('quiz_id');
        table.index('question_number');
      });
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('questions');
};