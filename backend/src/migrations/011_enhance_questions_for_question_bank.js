exports.up = function(knex) {
  return knex.schema.table('questions', function(table) {
    // Add new metadata fields for question bank
    table.string('domain', 255).notNullable().defaultTo('General');
    table.string('subject', 255).notNullable().defaultTo('General');
    table.string('source', 255).notNullable().defaultTo('Custom');
    table.text('hint_detailed'); // Additional hint field, keeping existing 'hint' for backward compatibility
    table.integer('weightage').defaultTo(1);
    table.enum('difficulty_level', ['Easy', 'Medium', 'Hard']).notNullable().defaultTo('Medium');
    
    // Create indexes for efficient querying
    table.index(['domain', 'subject', 'source', 'difficulty_level'], 'idx_questions_metadata_composite');
    table.index('domain', 'idx_questions_domain');
    table.index('subject', 'idx_questions_subject');
    table.index('difficulty_level', 'idx_questions_difficulty_level');
    table.index('weightage', 'idx_questions_weightage');
  });
};

exports.down = function(knex) {
  return knex.schema.table('questions', function(table) {
    // Drop indexes first
    table.dropIndex([], 'idx_questions_metadata_composite');
    table.dropIndex('domain', 'idx_questions_domain');
    table.dropIndex('subject', 'idx_questions_subject');
    table.dropIndex('difficulty_level', 'idx_questions_difficulty_level');
    table.dropIndex('weightage', 'idx_questions_weightage');
    
    // Drop the added columns
    table.dropColumn('domain');
    table.dropColumn('subject');
    table.dropColumn('source');
    table.dropColumn('hint_detailed');
    table.dropColumn('weightage');
    table.dropColumn('difficulty_level');
  });
};
