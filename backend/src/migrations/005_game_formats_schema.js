exports.up = function(knex) {
  return knex.schema
    .alterTable('quizzes', table => {
      // Add game format field to quizzes table
      table.enum('game_format', ['traditional', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid']).defaultTo('traditional');
      table.text('game_options'); // JSON string for game-specific options
    })
    .then(() => {
      // Enhance questions table for game-specific data
      return knex.schema.alterTable('questions', table => {
        // Additional fields for game formats
        table.text('word_data'); // For hangman and word ladder games - JSON string
        table.integer('level_number').defaultTo(1); // For knowledge tower levels
        table.text('pattern_data'); // For memory grid patterns - JSON string
        table.text('ladder_steps'); // For word ladder step progression - JSON string
        table.integer('max_attempts').defaultTo(6); // For hangman wrong guesses limit
        table.text('visual_data'); // For storing visual elements like hangman drawing state
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('questions', table => {
      table.dropColumn('word_data');
      table.dropColumn('level_number');
      table.dropColumn('pattern_data');
      table.dropColumn('ladder_steps');
      table.dropColumn('max_attempts');
      table.dropColumn('visual_data');
    })
    .then(() => {
      return knex.schema.alterTable('quizzes', table => {
        table.dropColumn('game_format');
        table.dropColumn('game_options');
      });
    });
};
