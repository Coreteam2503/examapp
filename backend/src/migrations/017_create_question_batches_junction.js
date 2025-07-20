/**
 * Migration: Create question_batches junction table
 * Many-to-many relationship between questions and batches
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Creating question_batches junction table...');
    
    await knex.schema.createTable('question_batches', table => {
      // Primary key
      table.increments('id').primary();
      
      // Foreign keys to questions and batches
      table.integer('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
      table.integer('batch_id').notNullable().references('id').inTable('batches').onDelete('CASCADE');
      
      // Timestamp
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Unique constraint to prevent duplicate assignments
      table.unique(['question_id', 'batch_id'], 'unique_question_batch_assignment');
      
      // Indexes for performance
      table.index('question_id', 'idx_question_batches_question_id');
      table.index('batch_id', 'idx_question_batches_batch_id');
    });
    
    console.log('✅ Question_batches junction table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating question_batches table:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Dropping question_batches junction table...');
    
    await knex.schema.dropTableIfExists('question_batches');
    
    console.log('✅ Question_batches table dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping question_batches table:', error);
    throw error;
  }
};
