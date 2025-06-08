/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create roles table
    .createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('display_name').notNullable();
      table.text('description');
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_system').defaultTo(false); // System roles cannot be deleted
      table.timestamps(true, true);
    })
    
    // Create permissions table
    .createTable('permissions', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('display_name').notNullable();
      table.text('description');
      table.string('category').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Create role_permissions junction table
    .createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().notNullable();
      table.integer('permission_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
      table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
      
      // Ensure unique combinations
      table.unique(['role_id', 'permission_id']);
    })
    
    // Add role_id to users table (if not already exists)
    .alterTable('users', function(table) {
      // Check if column exists first, if not add it
      table.integer('role_id').unsigned().nullable();
      table.foreign('role_id').references('id').inTable('roles').onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('users', function(table) {
      table.dropForeign('role_id');
      table.dropColumn('role_id');
    })
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('permissions')
    .dropTableIfExists('roles');
};
