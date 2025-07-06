/**
 * Migration: Comprehensive questions table update for all question types
 * Updates the questions table schema to support all new question types
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Updating questions table for enhanced question types...');
    
    // Check if we need to add missing columns
    const tableExists = await knex.schema.hasTable('questions');
    if (!tableExists) {
      throw new Error('Questions table does not exist. Please run earlier migrations first.');
    }
    
    // Check for existing columns
    const hasCorrectAnswersData = await knex.schema.hasColumn('questions', 'correct_answers_data');
    const hasHint = await knex.schema.hasColumn('questions', 'hint');
    const hasFormattedText = await knex.schema.hasColumn('questions', 'formatted_text');
    const hasPairs = await knex.schema.hasColumn('questions', 'pairs');
    const hasItems = await knex.schema.hasColumn('questions', 'items');
    const hasCorrectOrder = await knex.schema.hasColumn('questions', 'correct_order');
    
    // Add missing columns
    if (!hasCorrectAnswersData) {
      await knex.schema.alterTable('questions', table => {
        table.text('correct_answers_data').nullable();
      });
      console.log('Added correct_answers_data column');
    }
    
    if (!hasHint) {
      await knex.schema.alterTable('questions', table => {
        table.text('hint').nullable();
      });
      console.log('Added hint column');
    }
    
    if (!hasFormattedText) {
      await knex.schema.alterTable('questions', table => {
        table.text('formatted_text').nullable();
      });
      console.log('Added formatted_text column');
    }
    
    if (!hasPairs) {
      await knex.schema.alterTable('questions', table => {
        table.text('pairs').nullable();
      });
      console.log('Added pairs column');
    }
    
    if (!hasItems) {
      await knex.schema.alterTable('questions', table => {
        table.text('items').nullable();
      });
      console.log('Added items column');
    }
    
    if (!hasCorrectOrder) {
      await knex.schema.alterTable('questions', table => {
        table.text('correct_order').nullable();
      });
      console.log('Added correct_order column');
    }
    
    console.log('✅ Questions table enhancement completed successfully');
    
  } catch (error) {
    console.error('❌ Error enhancing questions table:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Reverting questions table enhancement...');
    
    const columnsToRemove = ['pairs', 'items', 'correct_order', 'correct_answers_data', 'hint', 'formatted_text'];
    
    for (const column of columnsToRemove) {
      const hasColumn = await knex.schema.hasColumn('questions', column);
      if (hasColumn) {
        await knex.schema.alterTable('questions', table => {
          table.dropColumn(column);
        });
        console.log(`Dropped ${column} column`);
      }
    }
    
    console.log('✅ Questions table enhancement reverted');
    
  } catch (error) {
    console.error('❌ Error reverting questions table enhancement:', error);
    throw error;
  }
};
