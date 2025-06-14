/**
 * Migration: Add drag and drop question support
 * Adds columns for drag & drop question types (ordering and matching)
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Adding drag and drop question support...');
    
    // Check if columns already exist
    const hasItems = await knex.schema.hasColumn('questions', 'items');
    const hasCorrectOrder = await knex.schema.hasColumn('questions', 'correct_order');
    
    if (!hasItems || !hasCorrectOrder) {
      await knex.schema.alterTable('questions', table => {
        if (!hasItems) {
          table.text('items').nullable().comment('JSON array of items for drag & drop ordering questions');
        }
        if (!hasCorrectOrder) {
          table.text('correct_order').nullable().comment('JSON array of correct order for drag & drop ordering questions');
        }
      });
      
      console.log('✅ Added drag and drop question columns');
    } else {
      console.log('ℹ️  Drag and drop question columns already exist');
    }
    
  } catch (error) {
    console.error('❌ Error adding drag and drop question support:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Removing drag and drop question support...');
    
    await knex.schema.alterTable('questions', table => {
      table.dropColumn('items');
      table.dropColumn('correct_order');
    });
    
    console.log('✅ Removed drag and drop question columns');
    
  } catch (error) {
    console.error('❌ Error removing drag and drop question support:', error);
    throw error;
  }
};
