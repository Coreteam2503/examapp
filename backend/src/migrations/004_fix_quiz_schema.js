exports.up = function(knex) {
  return knex.schema
    .alterTable('quizzes', table => {
      table.integer('user_id').notNullable().defaultTo(1);
      table.integer('total_questions').defaultTo(0);
      table.text('metadata');
    })
    .then(() => {
      // Copy created_by to user_id
      return knex.raw('UPDATE quizzes SET user_id = created_by');
    })
    .then(() => {
      // Create proper tables if they don't exist with correct names
      return knex.schema.hasTable('questions').then(exists => {
        if (!exists) {
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
        }
      });
    })
    .then(() => {
      return knex.schema.hasTable('attempts').then(exists => {
        if (!exists) {
          return knex.schema.createTable('attempts', table => {
            table.increments('id').primary();
            table.integer('user_id').notNullable();
            table.integer('quiz_id').notNullable();
            table.timestamp('started_at').defaultTo(knex.fn.now());
            table.timestamp('completed_at');
            table.integer('time_elapsed').defaultTo(0); // seconds
            table.integer('total_questions').defaultTo(0);
            table.integer('questions_answered').defaultTo(0);
            table.integer('correct_answers').defaultTo(0);
            table.decimal('score_percentage', 5, 2).defaultTo(0);
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            // Foreign keys
            table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
            
            // Indexes
            table.index('user_id');
            table.index('quiz_id');
          });
        }
      });
    })
    .then(() => {
      return knex.schema.hasTable('answers').then(exists => {
        if (!exists) {
          return knex.schema.createTable('answers', table => {
            table.increments('id').primary();
            table.integer('attempt_id').notNullable();
            table.integer('question_id').notNullable();
            table.text('user_answer');
            table.boolean('is_correct').defaultTo(false);
            table.integer('time_spent').defaultTo(0); // seconds
            table.timestamp('created_at').defaultTo(knex.fn.now());
            
            // Foreign keys
            table.foreign('attempt_id').references('id').inTable('attempts').onDelete('CASCADE');
            table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
            
            // Indexes
            table.index('attempt_id');
            table.index('question_id');
          });
        }
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('quizzes', table => {
      table.dropColumn('user_id');
      table.dropColumn('total_questions');
      table.dropColumn('metadata');
    });
};