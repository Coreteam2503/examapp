/**
 * Migration: Create batches table
 * Core table for batch-based question management system
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Creating batches table...');
    
    await knex.schema.createTable('batches', table => {
      // Primary key
      table.increments('id').primary();
      
      // Basic batch information
      table.string('name', 255).notNullable();
      table.text('description');
      table.string('subject', 255).notNullable().defaultTo('General');
      table.string('domain', 255).notNullable().defaultTo('General');
      
      // Batch status
      table.boolean('is_active').defaultTo(true);
      
      // Ownership and tracking
      table.integer('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index('created_by', 'idx_batches_created_by');
      table.index('is_active', 'idx_batches_is_active');
      table.index(['subject', 'domain'], 'idx_batches_subject_domain');
      table.index('name', 'idx_batches_name');
    });
    
    console.log('✅ Batches table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating batches table:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Dropping batches table...');
    
    await knex.schema.dropTableIfExists('batches');
    
    console.log('✅ Batches table dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping batches table:', error);
    throw error;
  }
};
