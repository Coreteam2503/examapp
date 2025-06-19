const { db: knex } = require('./src/config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if game_format column exists in quizzes table
    const quizzesSchema = await knex.raw("PRAGMA table_info(quizzes)");
    console.log('\n📊 Quizzes table columns:');
    quizzesSchema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    const hasGameFormat = quizzesSchema.some(col => col.name === 'game_format');
    const hasGameOptions = quizzesSchema.some(col => col.name === 'game_options');
    
    console.log(`\n✅ game_format column exists: ${hasGameFormat}`);
    console.log(`✅ game_options column exists: ${hasGameOptions}`);
    
    if (!hasGameFormat || !hasGameOptions) {
      console.log('\n⚠️  Missing game format columns! Running migration...');
      
      if (!hasGameFormat) {
        await knex.schema.alterTable('quizzes', table => {
          table.enum('game_format', ['traditional', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid']).defaultTo('traditional');
        });
        console.log('✅ Added game_format column');
      }
      
      if (!hasGameOptions) {
        await knex.schema.alterTable('quizzes', table => {
          table.text('game_options');
        });
        console.log('✅ Added game_options column');
      }
    }
    
    // Check questions table too
    const questionsSchema = await knex.raw("PRAGMA table_info(questions)");
    const hasWordData = questionsSchema.some(col => col.name === 'word_data');
    const hasPatternData = questionsSchema.some(col => col.name === 'pattern_data');
    
    console.log(`\n✅ questions.word_data column exists: ${hasWordData}`);
    console.log(`✅ questions.pattern_data column exists: ${hasPatternData}`);
    
    if (!hasWordData || !hasPatternData) {
      console.log('\n⚠️  Missing game questions columns! Adding...');
      
      await knex.schema.alterTable('questions', table => {
        if (!hasWordData) table.text('word_data');
        if (!hasPatternData) table.text('pattern_data');
        if (!questionsSchema.some(col => col.name === 'ladder_steps')) table.text('ladder_steps');
        if (!questionsSchema.some(col => col.name === 'level_number')) table.integer('level_number').defaultTo(1);
        if (!questionsSchema.some(col => col.name === 'max_attempts')) table.integer('max_attempts').defaultTo(6);
        if (!questionsSchema.some(col => col.name === 'visual_data')) table.text('visual_data');
      });
      console.log('✅ Added missing questions columns');
    }
    
    console.log('\n🎉 Database schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
