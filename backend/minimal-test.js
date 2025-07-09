// Minimal test - insert one question with only required fields
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

async function minimalTest() {
  try {
    console.log('🧪 Minimal PostgreSQL insert test...\n');
    
    // Test 1: Insert with minimal required fields only
    console.log('Test 1: Minimal required fields...');
    const minimalQuestion = {
      question_text: 'Test question',
      correct_answer: 'Test answer',
      domain: 'Test Domain',
      subject: 'Test Subject', 
      source: 'Test Source',
      difficulty_level: 'Medium'
    };
    
    try {
      const [insertedId] = await pgKnex('questions').insert(minimalQuestion).returning('id');
      console.log('✅ SUCCESS - Minimal insert worked! ID:', insertedId.id);
      await pgKnex('questions').where('id', insertedId.id).del(); // Clean up
    } catch (e) {
      console.log('❌ FAILED - Minimal insert failed:', e.message);
      return;
    }
    
    // Test 2: Add empty arrays for JSON fields
    console.log('\nTest 2: With empty JSON arrays...');
    const withJsonQuestion = {
      ...minimalQuestion,
      options: [],
      concepts: []
    };
    
    try {
      const [insertedId] = await pgKnex('questions').insert(withJsonQuestion).returning('id');
      console.log('✅ SUCCESS - JSON arrays insert worked! ID:', insertedId.id);
      await pgKnex('questions').where('id', insertedId.id).del(); // Clean up
    } catch (e) {
      console.log('❌ FAILED - JSON arrays insert failed:', e.message);
      return;
    }
    
    // Test 3: Add multiple choice options 
    console.log('\nTest 3: With actual options array...');
    const withOptionsQuestion = {
      ...minimalQuestion,
      options: ["option1", "option2", "option3", "option4"],
      concepts: ["concept1", "concept2"]
    };
    
    try {
      const [insertedId] = await pgKnex('questions').insert(withOptionsQuestion).returning('id');
      console.log('✅ SUCCESS - Options array insert worked! ID:', insertedId.id);
      await pgKnex('questions').where('id', insertedId.id).del(); // Clean up
    } catch (e) {
      console.log('❌ FAILED - Options array insert failed:', e.message);
      console.log('Data being inserted:', JSON.stringify(withOptionsQuestion, null, 2));
      return;
    }
    
    // Test 4: Try with the exact processed data from our question
    console.log('\nTest 4: With real question data...');
    const realQuestion = {
      question_text: "Which module in LangChain is primarily responsible for loading and splitting documents?",
      correct_answer: "C",
      domain: "Computer Science",
      subject: "Artificial Intelligence",
      source: "Educosys_RAG.ipynb",
      difficulty_level: "Medium",
      type: "multiple_choice",
      options: ["langchain.vectorstores", "langchain.embeddings", "langchain.document_loaders", "langchain.llms"],
      concepts: [],
      explanation: "langchain.document_loaders is used for loading documents and preparing them for processing.",
      hint: "It's the module that handles input data before embeddings."
    };
    
    try {
      const [insertedId] = await pgKnex('questions').insert(realQuestion).returning('id');
      console.log('✅ SUCCESS - Real question insert worked! ID:', insertedId.id);
      await pgKnex('questions').where('id', insertedId.id).del(); // Clean up
    } catch (e) {
      console.log('❌ FAILED - Real question insert failed:', e.message);
      console.log('Data being inserted:', JSON.stringify(realQuestion, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Overall error:', error.message);
  } finally {
    await pgKnex.destroy();
  }
}

minimalTest();
