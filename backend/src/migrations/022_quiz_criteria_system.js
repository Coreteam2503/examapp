/**
 * Migration: Add criteria-based quiz system
 * Transforms quizzes from fixed question associations to dynamic criteria-based selection
 * 
 * PHASE 1: Add new schema fields while preserving existing data
 * - Adds criteria JSON field to quizzes table
 * - Adds question_count field for dynamic quiz configuration
 * - Updates time_limit field structure
 * - Creates backup table for quiz_questions data
 * - Adds performance indexes
 */

exports.up = async function(knex) {
  const transaction = await knex.transaction();
  
  try {
    console.log('🔄 Starting quiz criteria system migration...');
    
    // Step 1: Create backup of quiz_questions data before any changes
    console.log('📋 Creating backup of quiz_questions data...');
    await transaction.schema.createTable('quiz_questions_backup', table => {
      table.increments('id').primary();
      table.integer('quiz_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.integer('question_number').notNullable();
      table.datetime('created_at');
      table.datetime('updated_at');
      table.datetime('backup_created_at').defaultTo(knex.fn.now());
      
      // Add index for efficient lookups during potential restore
      table.index(['quiz_id', 'question_number']);
    });
    
    // Copy existing quiz_questions data to backup
    const existingQuizQuestions = await transaction('quiz_questions').select('*');
    if (existingQuizQuestions.length > 0) {
      await transaction('quiz_questions_backup').insert(
        existingQuizQuestions.map(record => ({
          ...record,
          backup_created_at: new Date()
        }))
      );
      console.log(`✅ Backed up ${existingQuizQuestions.length} quiz-question associations`);
    } else {
      console.log('ℹ️ No existing quiz-question associations to backup');
    }
    
    // Step 2: Add new fields to quizzes table
    console.log('🔄 Adding criteria and configuration fields to quizzes table...');
    await transaction.schema.alterTable('quizzes', table => {
      // Core criteria field for dynamic question selection - using JSONB for better performance
      table.specificType('criteria', 'jsonb').nullable().comment('JSONB criteria for dynamic question selection: {source, domain, subject, difficulty_level}');
      
      // Dynamic quiz configuration
      table.integer('question_count').nullable().comment('Number of questions to generate dynamically (null = use all matching)');
      
      // Note: time_limit already exists, keeping it as-is for backward compatibility
    });
    
    // Step 3: Add quiz_attempts.selected_questions field for dynamic question storage
    console.log('🔄 Adding selected_questions field to quiz_attempts table...');
    await transaction.schema.alterTable('quiz_attempts', table => {
      table.specificType('selected_questions', 'jsonb').nullable().comment('Array of question IDs dynamically selected for this attempt');
    });
    
    // Step 4: Add performance indexes
    console.log('🔄 Adding performance indexes...');
    
    // Index on criteria field for efficient JSON queries (PostgreSQL JSONB support)
    // Note: Removing CONCURRENTLY since it cannot run inside a transaction
    await transaction.raw(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_criteria_gin 
      ON quizzes USING GIN (criteria)
    `);
    
    // Index on question_count for query optimization
    await transaction.schema.alterTable('quizzes', table => {
      table.index('question_count', 'idx_quizzes_question_count');
    });
    
    // Index on quiz_attempts.selected_questions for efficient lookups
    await transaction.raw(`
      CREATE INDEX IF NOT EXISTS idx_quiz_attempts_selected_questions_gin 
      ON quiz_attempts USING GIN (selected_questions)
    `);
    
    // Step 5: Add metadata for migration tracking
    console.log('🔄 Adding migration metadata...');
    await transaction.schema.createTable('migration_metadata', table => {
      table.increments('id').primary();
      table.string('migration_name').notNullable();
      table.string('phase').notNullable();
      table.json('metadata').nullable();
      table.datetime('applied_at').defaultTo(knex.fn.now());
      
      table.unique(['migration_name', 'phase']);
    });
    
    await transaction('migration_metadata').insert({
      migration_name: '022_quiz_criteria_system',
      phase: 'schema_addition',
      metadata: {
        backup_table_created: 'quiz_questions_backup',
        records_backed_up: existingQuizQuestions.length,
        new_fields_added: ['criteria', 'question_count', 'selected_questions'],
        indexes_created: ['idx_quizzes_criteria_gin', 'idx_quizzes_question_count', 'idx_quiz_attempts_selected_questions_gin']
      }
    });
    
    await transaction.commit();
    console.log('✅ Quiz criteria system migration completed successfully!');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   - Backed up ${existingQuizQuestions.length} quiz-question associations`);
    console.log('   - Added criteria JSON field to quizzes table');
    console.log('   - Added question_count field for dynamic configuration');
    console.log('   - Added selected_questions field to quiz_attempts table');
    console.log('   - Created performance indexes for JSON fields');
    console.log('   - Created migration metadata tracking');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('   1. Implement QuestionSelector service (Task #33)');
    console.log('   2. Update quiz attempt initialization (Task #34)');
    console.log('   3. Test dynamic question selection');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  const transaction = await knex.transaction();
  
  try {
    console.log('🔄 Rolling back quiz criteria system migration...');
    
    // Step 1: Remove indexes first
    console.log('🔄 Removing performance indexes...');
    await transaction.raw('DROP INDEX IF EXISTS idx_quizzes_criteria_gin');
    await transaction.raw('DROP INDEX IF EXISTS idx_quiz_attempts_selected_questions_gin');
    
    await transaction.schema.alterTable('quizzes', table => {
      table.dropIndex('question_count', 'idx_quizzes_question_count');
    });
    
    // Step 2: Remove new fields from tables
    console.log('🔄 Removing new fields...');
    await transaction.schema.alterTable('quiz_attempts', table => {
      table.dropColumn('selected_questions');
    });
    
    await transaction.schema.alterTable('quizzes', table => {
      table.dropColumn('criteria');
      table.dropColumn('question_count');
    });
    
    // Step 3: Restore quiz_questions data if backup exists
    console.log('🔄 Checking for quiz_questions backup...');
    const hasBackup = await transaction.schema.hasTable('quiz_questions_backup');
    
    if (hasBackup) {
      const backupData = await transaction('quiz_questions_backup').select(
        'quiz_id', 'question_id', 'question_number', 'created_at', 'updated_at'
      );
      
      if (backupData.length > 0) {
        console.log(`🔄 Restoring ${backupData.length} quiz-question associations...`);
        await transaction('quiz_questions').insert(backupData);
        console.log('✅ Quiz-question associations restored');
      }
      
      // Drop backup table
      await transaction.schema.dropTable('quiz_questions_backup');
      console.log('🗑️ Backup table removed');
    }
    
    // Step 4: Remove migration metadata
    const hasMetadata = await transaction.schema.hasTable('migration_metadata');
    if (hasMetadata) {
      await transaction('migration_metadata')
        .where('migration_name', '022_quiz_criteria_system')
        .del();
      
      // If no other migration metadata exists, drop the table
      const remainingMetadata = await transaction('migration_metadata').count('* as count');
      if (parseInt(remainingMetadata[0].count) === 0) {
        await transaction.schema.dropTable('migration_metadata');
      }
    }
    
    await transaction.commit();
    console.log('✅ Quiz criteria system migration rolled back successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};
