exports.up = function(knex) {
  return knex.schema.createTable('quiz_batches', function(table) {
    table.increments('id').primary();
    table.integer('quiz_id').unsigned().notNullable()
      .references('id').inTable('quizzes').onDelete('CASCADE');
    table.integer('batch_id').unsigned().notNullable()
      .references('id').inTable('batches').onDelete('CASCADE');
    table.integer('assigned_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint to prevent duplicate assignments
    table.unique(['quiz_id', 'batch_id']);
    
    // Indexes for performance
    table.index('quiz_id');
    table.index('batch_id');
    table.index('assigned_by');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('quiz_batches');
};
