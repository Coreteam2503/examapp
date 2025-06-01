exports.up = function(knex) {
  return knex.schema.createTable('uploads', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('filename').notNullable();
    table.string('original_name').notNullable();
    table.string('file_path').notNullable();
    table.text('content'); // Extracted text content from file
    table.integer('file_size').notNullable();
    table.string('file_type').notNullable();
    table.string('mime_type').notNullable();
    table.enum('status', ['processing', 'completed', 'failed']).defaultTo('processing');
    table.timestamp('upload_date').defaultTo(knex.fn.now());
    table.timestamp('processed_date');
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('file_type');
    table.index('upload_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('uploads');
};
