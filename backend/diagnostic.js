// Detailed diagnostic script
require('dotenv').config();
const express = require('express');

console.log('🔬 DIAGNOSTIC: Starting comprehensive backend analysis...\n');

// 1. Test environment variables
console.log('1. ENVIRONMENT VARIABLES:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('   OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? 'SET' : 'EMPTY');

// 2. Test database connection
console.log('\n2. DATABASE CONNECTION:');
try {
  const { testConnection } = require('./src/config/database');
  testConnection().then(success => {
    console.log('   Database connection:', success ? '✅ SUCCESS' : '❌ FAILED');
  }).catch(err => {
    console.log('   Database connection: ❌ ERROR -', err.message);
  });
} catch (error) {
  console.log('   Database module: ❌ ERROR -', error.message);
}

// 3. Test PromptService initialization
console.log('\n3. PROMPT SERVICE:');
try {
  const PromptService = require('./services/promptService');
  const promptService = new PromptService();
  console.log('   PromptService initialization: ✅ SUCCESS');
  console.log('   Using OpenAI:', promptService.useOpenAI);
  console.log('   MockGenerator available:', !!promptService.mockGenerator);
} catch (error) {
  console.log('   PromptService initialization: ❌ ERROR -', error.message);
  console.log('   Stack:', error.stack);
}

// 4. Test MockQuizGenerator
console.log('\n4. MOCK QUIZ GENERATOR:');
try {
  const MockQuizGenerator = require('./services/fallback/mockQuizGenerator');
  const generator = new MockQuizGenerator();
  console.log('   MockQuizGenerator initialization: ✅ SUCCESS');
  
  // Test generation
  const testResult = generator.generateQuizFromContent('function test() { return "hello"; }');
  console.log('   Test generation: ✅ SUCCESS');
  console.log('   Generated questions:', testResult.questions.length);
} catch (error) {
  console.log('   MockQuizGenerator: ❌ ERROR -', error.message);
}

// 5. Test GameFormatController
console.log('\n5. GAME FORMAT CONTROLLER:');
try {
  const gameController = require('./src/controllers/gameFormatController');
  console.log('   GameFormatController load: ✅ SUCCESS');
  console.log('   Available methods:', Object.keys(gameController));
} catch (error) {
  console.log('   GameFormatController: ❌ ERROR -', error.message);
  console.log('   Stack:', error.stack);
}

// 6. Test routes loading
console.log('\n6. ROUTES LOADING:');
try {
  const gamesRoute = require('./src/routes/games');
  console.log('   Games route: ✅ SUCCESS');
} catch (error) {
  console.log('   Games route: ❌ ERROR -', error.message);
}

// 7. Test validation middleware
console.log('\n7. VALIDATION MIDDLEWARE:');
try {
  const { validateGameFormat } = require('./src/middleware/validation');
  console.log('   Validation middleware: ✅ SUCCESS');
} catch (error) {
  console.log('   Validation middleware: ❌ ERROR -', error.message);
}

// 8. Test full game generation flow
console.log('\n8. GAME GENERATION TEST:');
async function testGameGeneration() {
  try {
    const PromptService = require('./services/promptService');
    const promptService = new PromptService();
    
    console.log('   Testing Hangman generation...');
    const hangmanPrompt = `Generate a Hangman word guessing game based on: function hello() { console.log('Hello, world!'); }`;
    
    const result = await promptService.generateContent(hangmanPrompt);
    const parsed = JSON.parse(result);
    
    console.log('   Hangman generation: ✅ SUCCESS');
    console.log('   Result title:', parsed.title);
    console.log('   Questions count:', parsed.questions?.length || 0);
    
  } catch (error) {
    console.log('   Game generation test: ❌ ERROR -', error.message);
    console.log('   Error stack:', error.stack);
  }
}

testGameGeneration();

console.log('\n🔬 DIAGNOSTIC COMPLETE - Check results above for issues\n');
