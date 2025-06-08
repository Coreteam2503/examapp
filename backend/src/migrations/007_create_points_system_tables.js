/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create user_points table to track points history
    .createTable('user_points', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('quiz_attempt_id').unsigned().nullable();
      table.integer('points_earned').notNullable();
      table.string('reason').notNullable(); // 'quiz_completion', 'bonus', 'streak', etc.
      table.text('description');
      table.timestamp('earned_at').defaultTo(knex.fn.now());
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('quiz_attempt_id').references('id').inTable('quiz_attempts').onDelete('SET NULL');
      
      table.index(['user_id', 'earned_at']);
    })
    
    // Create user_stats table for aggregated user statistics
    .createTable('user_stats', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().unique();
      table.integer('total_points').defaultTo(0);
      table.integer('total_quizzes_completed').defaultTo(0);
      table.integer('correct_answers').defaultTo(0);
      table.integer('total_answers').defaultTo(0);
      table.decimal('average_score', 5, 2).defaultTo(0);
      table.integer('current_streak').defaultTo(0);
      table.integer('longest_streak').defaultTo(0);
      table.date('last_quiz_date').nullable();
      table.integer('level').defaultTo(1);
      table.integer('points_for_next_level').defaultTo(100);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    })
    
    // Create achievements table
    .createTable('achievements', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('display_name').notNullable();
      table.text('description');
      table.string('icon').nullable();
      table.string('category').notNullable(); // 'quiz', 'streak', 'points', 'accuracy'
      table.integer('points_reward').defaultTo(0);
      table.json('requirements'); // JSON object with achievement requirements
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create user_achievements junction table
    .createTable('user_achievements', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('achievement_id').unsigned().notNullable();
      table.timestamp('earned_at').defaultTo(knex.fn.now());
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('achievement_id').references('id').inTable('achievements').onDelete('CASCADE');
      
      table.unique(['user_id', 'achievement_id']);
      table.index(['user_id', 'earned_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_achievements')
    .dropTableIfExists('achievements')
    .dropTableIfExists('user_stats')
    .dropTableIfExists('user_points');
};
