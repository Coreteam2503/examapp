// Test migration for just questions table with detailed debugging
const knex = require('knex');
require('dotenv').config({ path: './.env' });

const sqliteConfig = {
  client: 'sqlite3',
  connection: { filename: './data/quiz_app.db' },
  useNullAsDefault: true
};

const pgConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
};

const sqliteKnex = knex(sqliteConfig);
const pgKnex = knex(pgConfig);

async function testQuestionsMigration() {
  try {
    console.log('🧪 Testing questions migration with detailed debugging...\n');
    
    // Get first 3 questions from SQLite
    const questions = await sqliteKnex('questions').select('*').limit(3);
    console.log(`Found ${questions.length} questions to test\n`);
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`--- Processing Question ${i + 1} (ID: ${question.id}) ---`);
      console.log('Type:', question.type);
      
      const processedQuestion = { ...question };
      
      // Convert timestamps
      const timestampColumns = ['created_at', 'updated_at'];
      for (const col of timestampColumns) {
        if (processedQuestion[col] && typeof processedQuestion[col] === 'number') {
          processedQuestion[col] = new Date(processedQuestion[col]).toISOString();
        }
      }
      
      // Process JSON columns with detailed logging - only actual JSON columns!
      const jsonColumns = ['options', 'concepts']; // Only these are JSON type in PostgreSQL
      
      for (const col of jsonColumns) {
        if (processedQuestion[col] && typeof processedQuestion[col] === 'string') {
          console.log(`\nProcessing ${col}:`);
          console.log('  Original value:', JSON.stringify(processedQuestion[col]));
          
          if (col === 'options') {
            try {
              // First try to parse as JSON
              processedQuestion[col] = JSON.parse(processedQuestion[col]);
              console.log('  ✅ Parsed as JSON successfully');
            } catch (e) {
              console.log('  ❌ JSON parse failed:', e.message);
              
              // Check if it's multiple choice format
              if (processedQuestion[col].includes('\n') && /^[A-Z]\)/.test(processedQuestion[col])) {
                console.log('  🔄 Detected multiple choice format, converting...');
                const optionsArray = processedQuestion[col]
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0)
                  .map(line => line.replace(/^[A-Z]\)\s*/, ''));
                
                processedQuestion[col] = optionsArray;
                console.log('  ✅ Converted to:', JSON.stringify(processedQuestion[col]));
              } else if (processedQuestion[col].includes(',')) {
                console.log('  🔄 Treating as comma-separated...');
                const array = processedQuestion[col].split(',').map(item => item.trim());
                processedQuestion[col] = array;
                console.log('  ✅ Converted to:', JSON.stringify(processedQuestion[col]));
              } else {
                console.log('  🔄 Wrapping as single item array...');
                processedQuestion[col] = [processedQuestion[col]];
                console.log('  ✅ Converted to:', JSON.stringify(processedQuestion[col]));
              }
            }
          } else {
            // Handle 'concepts' column
            try {
              const escapedValue = processedQuestion[col].replace(/\n/g, '\\n');
              processedQuestion[col] = JSON.parse(escapedValue);
              console.log('  ✅ Parsed as JSON successfully');
            } catch (e) {
              console.log('  ❌ JSON parse failed:', e.message);
              console.log('  ⚠️  Setting to empty array for concepts');
              processedQuestion[col] = [];
            }
          }
        }
      }
      
      // Try to insert this single question
      try {
        console.log('\n🔄 Attempting to insert into PostgreSQL...');
        await pgKnex('questions').insert(processedQuestion);
        console.log('✅ SUCCESS - Question inserted successfully!\n');
      } catch (insertError) {
        console.log('❌ FAILED - Insert error:', insertError.message);
        console.log('Processed question data:', JSON.stringify(processedQuestion, null, 2));
        break; // Stop on first error to debug
      }
    }
    
  } catch (error) {
    console.log('❌ Overall error:', error.message);
  } finally {
    await sqliteKnex.destroy();
    await pgKnex.destroy();
  }
}

testQuestionsMigration();
