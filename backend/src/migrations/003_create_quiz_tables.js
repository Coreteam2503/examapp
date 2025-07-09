exports.up = function(knex) {
  return knex.schema
    .createTable('quizzes', table => {
      table.increments('id').primary();
      table.integer('upload_id').notNullable();
      table.integer('created_by').notNullable();
      table.string('title').notNullable();
      table.text('description');
      table.enum('difficulty', ['easy', 'medium', 'hard']).defaultTo('medium');
      table.integer('time_limit').defaultTo(30); // minutes
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Foreign keys
      table.foreign('upload_id').references('id').inTable('uploads').onDelete('CASCADE');
      table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
      
      // Indexes
      table.index('upload_id');
      table.index('created_by');
      table.index('difficulty');
      table.index('is_active');
    })
    .createTable('questions', table => {
      table.increments('id').primary();
      table.integer('quiz_id').notNullable();
      table.integer('question_number');
      table.enum('type', [
        'multiple_choice', 
        'fill_blank', 
        'true_false', 
        'matching',
        'hangman',
        'knowledge_tower',
        'word_ladder',
        'memory_grid'
      ], { enumName: 'questions_type' }).defaultTo('multiple_choice');
      table.text('question_text').notNullable();
      table.text('code_snippet');
      table.json('options'); // For multiple choice, matching pairs, etc.
      table.text('correct_answer').notNullable();
      table.text('explanation');
      table.string('difficulty');
      table.json('concepts').defaultTo('[]');
      table.integer('points').defaultTo(1);
      table.integer('order_index').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Foreign key
      table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
      
      // Indexes
      table.index('quiz_id');
      table.index('type');
      table.index('order_index');
    })
    .createTable('quiz_attempts', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.integer('quiz_id').notNullable();
      table.timestamp('started_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.integer('score').defaultTo(0);
      table.integer('total_questions').defaultTo(0);
      table.integer('correct_answers').defaultTo(0);
      table.decimal('percentage', 5, 2).defaultTo(0);
      table.enum('status', ['in_progress', 'completed', 'abandoned']).defaultTo('in_progress');
      table.integer('time_taken'); // seconds
      
      // Foreign keys
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('quiz_id').references('id').inTable('quizzes').onDelete('CASCADE');
      
      // Indexes
      table.index('user_id');
      table.index('quiz_id');
      table.index('status');
      table.index('completed_at');
    })
    .createTable('question_answers', table => {
      table.increments('id').primary();
      table.integer('attempt_id').notNullable();
      table.integer('question_id').notNullable();
      table.text('user_answer');
      table.boolean('is_correct').defaultTo(false);
      table.integer('points_earned').defaultTo(0);
      table.timestamp('answered_at').defaultTo(knex.fn.now());
      
      // Foreign keys
      table.foreign('attempt_id').references('id').inTable('quiz_attempts').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      
      // Indexes
      table.index('attempt_id');
      table.index('question_id');
      table.index('is_correct');
      
      // Unique constraint to prevent duplicate answers
      table.unique(['attempt_id', 'question_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('question_answers')
    .dropTable('quiz_attempts')
    .dropTable('questions')
    .dropTable('quizzes');
};
