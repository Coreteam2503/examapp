// Check question types in SQLite database
const { db } = require('./src/config/database');

async function checkQuestionTypes() {
  console.log('🔍 CHECKING QUESTION TYPES IN SQLITE...\n');
  
  try {
    const typeStats = await db('questions')
      .select('type')
      .count('* as count')
      .groupBy('type');
    
    console.log('Question types found:');
    typeStats.forEach(row => {
      console.log(`  ${row.type}: ${row.count} questions`);
    });
    
    // Show samples of each type
    console.log('\nSample questions by type:');
    for (const typeRow of typeStats) {
      const sample = await db('questions')
        .select('id', 'question_text', 'type')
        .where('type', typeRow.type)
        .first();
      
      console.log(`\n${typeRow.type}:`);
      console.log(`  ID: ${sample.id}`);
      console.log(`  Question: ${sample.question_text?.substring(0, 80)}...`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkQuestionTypes();
