/**
 * Migration: Add created_by field to questions table
 * Enables tracking question ownership for batch-based filtering
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Adding created_by field to questions table...');
    
    await knex.schema.alterTable('questions', table => {
      // Add created_by field with foreign key to users table
      table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
      
      // Add index for performance
      table.index('created_by', 'idx_questions_created_by');
    });
    
    console.log('✅ created_by field added to questions table');
    
    // Update all existing questions to be owned by admin (user ID = 1)
    console.log('🔄 Assigning existing questions to admin user...');
    const updateCount = await knex('questions').update({ created_by: 1 });
    console.log(`✅ Updated ${updateCount} questions with created_by = 1 (admin)`);
    
    // Now make the field NOT NULL since all questions have a value
    console.log('🔄 Making created_by field required...');
    await knex.schema.alterTable('questions', table => {
      table.integer('created_by').notNullable().alter();
    });
    
    console.log('✅ created_by field is now required for all questions');
    
  } catch (error) {
    console.error('❌ Error adding created_by field:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Removing created_by field from questions table...');
    
    await knex.schema.alterTable('questions', table => {
      // Drop the index first
      table.dropIndex('created_by', 'idx_questions_created_by');
      
      // Drop the created_by column
      table.dropColumn('created_by');
    });
    
    console.log('✅ created_by field removed from questions table');
    
  } catch (error) {
    console.error('❌ Error removing created_by field:', error);
    throw error;
  }
};
