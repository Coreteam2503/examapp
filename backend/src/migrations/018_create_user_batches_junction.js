/**
 * Migration: Create user_batches junction table  
 * Many-to-many relationship between users and batches
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Creating user_batches junction table...');
    
    await knex.schema.createTable('user_batches', table => {
      // Primary key
      table.increments('id').primary();
      
      // Foreign keys to users and batches
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('batch_id').notNullable().references('id').inTable('batches').onDelete('CASCADE');
      
      // Enrollment information
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.boolean('is_active').defaultTo(true);
      
      // Unique constraint to prevent duplicate enrollments
      table.unique(['user_id', 'batch_id'], 'unique_user_batch_enrollment');
      
      // Indexes for performance
      table.index('user_id', 'idx_user_batches_user_id');
      table.index('batch_id', 'idx_user_batches_batch_id');
      table.index('is_active', 'idx_user_batches_is_active');
    });
    
    console.log('✅ User_batches junction table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating user_batches table:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Dropping user_batches junction table...');
    
    await knex.schema.dropTableIfExists('user_batches');
    
    console.log('✅ User_batches table dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping user_batches table:', error);
    throw error;
  }
};
