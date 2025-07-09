// Test JSON serialization for PostgreSQL
const knex = require('knex');
require('dotenv').config({ path: './.env' });

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

const pgKnex = knex(pgConfig);

async function testJsonSerialization() {
  try {
    console.log('🧪 Testing JSON serialization...\n');
    
    // Test with manually JSON.stringify
    console.log('Test: Manual JSON.stringify...');
    const manualJsonQuestion = {
      question_text: "Test question",
      correct_answer: "Test answer",
      domain: "Test Domain",
      subject: "Test Subject",
      source: "Test Source",
      difficulty_level: "Medium",
      options: JSON.stringify(["option1", "option2", "option3", "option4"]),
      concepts: JSON.stringify(["concept1", "concept2"])
    };
    
    try {
      const [insertedId] = await pgKnex('questions').insert(manualJsonQuestion).returning('id');
      console.log('✅ SUCCESS - Manual JSON.stringify worked! ID:', insertedId.id);
      
      // Read it back to verify
      const retrieved = await pgKnex('questions').where('id', insertedId.id).first();
      console.log('Retrieved options:', retrieved.options);
      console.log('Retrieved concepts:', retrieved.concepts);
      
      await pgKnex('questions').where('id', insertedId.id).del(); // Clean up
    } catch (e) {
      console.log('❌ FAILED - Manual JSON.stringify failed:', e.message);
    }
    
  } catch (error) {
    console.log('❌ Overall error:', error.message);
  } finally {
    await pgKnex.destroy();
  }
}

testJsonSerialization();
