/**
 * Migration: Add quiz_criteria to batches table
 * Enables criteria-based quiz assignment to batches
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Adding quiz_criteria column to batches table...');
    
    await knex.schema.alterTable('batches', table => {
      // Add JSON column for quiz selection criteria
      table.json('quiz_criteria').nullable();
    });
    
    console.log('✅ quiz_criteria column added successfully');
    
  } catch (error) {
    console.error('❌ Error adding quiz_criteria column:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Removing quiz_criteria column from batches table...');
    
    await knex.schema.alterTable('batches', table => {
      table.dropColumn('quiz_criteria');
    });
    
    console.log('✅ quiz_criteria column removed successfully');
    
  } catch (error) {
    console.error('❌ Error removing quiz_criteria column:', error);
    throw error;
  }
};
