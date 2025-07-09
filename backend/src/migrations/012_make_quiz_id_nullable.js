/**
 * Migration: Make quiz_id nullable for question bank support
 * Allows questions to exist independently in the question bank without being tied to a specific quiz
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Making quiz_id nullable for question bank support...');
    
    await knex.schema.alterTable('questions', table => {
      table.integer('quiz_id').nullable().alter();
    });
    
    console.log('✅ quiz_id is now nullable - question bank ready!');
    
  } catch (error) {
    console.error('❌ Error making quiz_id nullable:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Reverting quiz_id nullable change...');
    
    // First, delete any questions that have a NULL quiz_id, as they won't be valid after this migration
    await knex('questions').whereNull('quiz_id').del();

    await knex.schema.alterTable('questions', table => {
      table.integer('quiz_id').notNullable().alter();
    });
    
    console.log('✅ Reverted quiz_id to NOT NULL');
    
  } catch (error) {
    console.error('❌ Error reverting quiz_id nullable change:', error);
    throw error;
  }
};
