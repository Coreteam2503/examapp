/**
 * Migration: Fix PostgreSQL sequences after SQLite migration
 * This script resets all PostgreSQL sequences to match the actual max IDs in the tables
 * Run this after migrating data from SQLite to PostgreSQL
 */

exports.up = async function(knex) {
  console.log('🔧 Fixing PostgreSQL sequences after migration...');
  
  // Get all tables with auto-increment columns (sequences)
  const sequences = await knex.raw(`
    SELECT 
      t.table_name,
      c.column_name,
      s.sequence_name
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    JOIN information_schema.sequences s ON s.sequence_name = t.table_name || '_' || c.column_name || '_seq'
    WHERE t.table_schema = 'public' 
    AND c.column_default LIKE 'nextval%'
  `);
  
  for (const seq of sequences.rows) {
    const { table_name, column_name, sequence_name } = seq;
    
    // Get max ID from table
    const maxResult = await knex.raw(`SELECT COALESCE(MAX(${column_name}), 0) as max_id FROM ${table_name}`);
    const maxId = maxResult.rows[0].max_id;
    
    // Set sequence to max_id + 1
    const newSeqValue = maxId + 1;
    await knex.raw(`SELECT setval('${sequence_name}', ${newSeqValue})`);
    
    console.log(`✅ Fixed ${table_name}.${column_name}: sequence reset to ${newSeqValue} (max existing ID: ${maxId})`);
  }
  
  console.log('🎉 All PostgreSQL sequences have been fixed!');
};

exports.down = function(knex) {
  // Cannot automatically undo sequence fixes
  console.log('⚠️  Cannot automatically undo sequence fixes. Manual intervention required if needed.');
  return Promise.resolve();
};