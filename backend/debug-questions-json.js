// Debug JSON columns in questions table
const { db } = require('./src/config/database');

async function debugQuestions() {
  console.log('🔍 DEBUGGING QUESTIONS JSON DATA...\n');
  
  try {
    const questions = await db('questions').select('*').limit(3);
    
    console.log('Sample questions from SQLite:');
    questions.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} (ID: ${q.id}) ---`);
      console.log('Type:', q.type);
      console.log('Question Text:', q.question_text?.substring(0, 100));
      
      // Check each JSON column
      const jsonColumns = ['options', 'concepts', 'correct_answers_data', 'pairs', 'items', 'correct_order', 'pattern_data', 'ladder_steps', 'visual_data'];
      
      jsonColumns.forEach(col => {
        if (q[col]) {
          console.log(`\n${col}:`);
          console.log('  Raw value:', q[col]);
          console.log('  Type:', typeof q[col]);
          console.log('  Length:', q[col]?.length || 'N/A');
          
          if (typeof q[col] === 'string') {
            console.log('  Contains newlines:', q[col].includes('\n'));
            console.log('  Starts with [:', q[col].startsWith('['));
            console.log('  Starts with {:', q[col].startsWith('{'));
            
            // Try to parse
            try {
              const parsed = JSON.parse(q[col]);
              console.log('  JSON parse: ✅ SUCCESS');
              console.log('  Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
            } catch (e) {
              console.log('  JSON parse: ❌ FAILED -', e.message);
              
              // Try escaping newlines
              try {
                const escaped = q[col].replace(/\n/g, '\\n');
                const parsed = JSON.parse(escaped);
                console.log('  After escaping newlines: ✅ SUCCESS');
              } catch (e2) {
                console.log('  After escaping newlines: ❌ STILL FAILED -', e2.message);
              }
            }
          }
        }
      });
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await db.destroy();
  }
}

debugQuestions();
