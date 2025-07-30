require('dotenv').config();
const { db } = require('./src/config/database');

async function examineQuestionsStructure() {
  try {
    console.log('🔍 Examining questions table structure...\n');
    
    // Get column information
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'questions'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Questions table columns:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get sample data to understand criteria fields
    console.log('\n🔍 Sample questions data:');
    const sampleQuestions = await db('questions')
      .select('id', 'domain', 'subject', 'source', 'difficulty_level', 'type', 'quiz_id')
      .limit(5);
    
    sampleQuestions.forEach((q, i) => {
      console.log(`   ${i + 1}. ID: ${q.id}`);
      console.log(`      Domain: ${q.domain}`);
      console.log(`      Subject: ${q.subject}`);
      console.log(`      Source: ${q.source}`);
      console.log(`      Difficulty: ${q.difficulty_level}`);
      console.log(`      Type: ${q.type}`);
      console.log(`      Quiz ID: ${q.quiz_id}`);
      console.log('');
    });
    
    // Get unique values for criteria fields
    console.log('📈 Available criteria values:');
    
    const domains = await db('questions').distinct('domain').orderBy('domain');
    console.log(`   Domains (${domains.length}): ${domains.map(d => d.domain).join(', ')}`);
    
    const subjects = await db('questions').distinct('subject').orderBy('subject');
    console.log(`   Subjects (${subjects.length}): ${subjects.map(s => s.subject).join(', ')}`);
    
    const sources = await db('questions').distinct('source').orderBy('source');
    console.log(`   Sources (${sources.length}): ${sources.map(s => s.source).join(', ')}`);
    
    const difficulties = await db('questions').distinct('difficulty_level').orderBy('difficulty_level');
    console.log(`   Difficulties: ${difficulties.map(d => d.difficulty_level).join(', ')}`);
    
    const types = await db('questions').distinct('type').orderBy('type');
    console.log(`   Question Types: ${types.map(t => t.type).join(', ')}`);
    
    // Get total questions count
    const totalCount = await db('questions').count('* as count').first();
    console.log(`\n📊 Total questions available: ${totalCount.count}`);
    
    // Check if there are questions not assigned to any quiz (question bank)
    const unassignedCount = await db('questions').whereNull('quiz_id').count('* as count').first();
    console.log(`📦 Questions in question bank (unassigned): ${unassignedCount.count}`);
    
  } catch (error) {
    console.error('❌ Examination failed:', error);
  } finally {
    await db.destroy();
  }
}

examineQuestionsStructure();
