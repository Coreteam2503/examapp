require('dotenv').config();
const { db } = require('./src/config/database');

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration changes...\n');
    
    // Check if new columns exist in quizzes table
    console.log('📊 Checking quizzes table structure:');
    const quizzesColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'quizzes' AND column_name IN ('criteria', 'question_count')
      ORDER BY column_name
    `);
    
    quizzesColumns.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if new column exists in quiz_attempts table
    console.log('\n📊 Checking quiz_attempts table structure:');
    const attemptsColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' AND column_name = 'selected_questions'
    `);
    
    attemptsColumns.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if backup table exists
    console.log('\n📋 Checking backup table:');
    const backupExists = await db.schema.hasTable('quiz_questions_backup');
    console.log(`   ${backupExists ? '✅' : '❌'} quiz_questions_backup table exists: ${backupExists}`);
    
    if (backupExists) {
      const backupCount = await db('quiz_questions_backup').count('* as count').first();
      console.log(`   📊 Backup records: ${backupCount.count}`);
    }
    
    // Check if indexes were created
    console.log('\n🔍 Checking indexes:');
    const indexes = await db.raw(`
      SELECT indexname, tablename, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('quizzes', 'quiz_attempts') 
        AND indexname LIKE '%criteria%' OR indexname LIKE '%selected_questions%' OR indexname LIKE '%question_count%'
    `);
    
    indexes.rows.forEach(idx => {
      console.log(`   ✅ ${idx.indexname} on ${idx.tablename}`);
    });
    
    // Check migration metadata
    console.log('\n📝 Checking migration metadata:');
    const hasMetadata = await db.schema.hasTable('migration_metadata');
    if (hasMetadata) {
      const metadata = await db('migration_metadata')
        .where('migration_name', '022_quiz_criteria_system')
        .first();
      if (metadata) {
        console.log(`   ✅ Migration metadata found for phase: ${metadata.phase}`);
        console.log(`   📊 Metadata: ${JSON.stringify(metadata.metadata, null, 6)}`);
      }
    }
    
    console.log('\n✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await db.destroy();
  }
}

verifyMigration();
