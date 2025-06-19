// Minimal server test - isolate the game generation issue
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8001; // Use different port to avoid conflicts

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Minimal game generation test route
app.post('/test-game-generation', async (req, res) => {
  console.log('🎮 Test game generation request received');
  
  try {
    // Test 1: Load PromptService
    console.log('Loading PromptService...');
    const PromptService = require('./services/promptService');
    const promptService = new PromptService();
    console.log('✅ PromptService loaded');
    
    // Test 2: Generate content
    console.log('Testing content generation...');
    const testPrompt = `Generate a Hangman word guessing game based on: function hello() { return "world"; }`;
    const result = await promptService.generateContent(testPrompt);
    console.log('✅ Content generated');
    
    // Test 3: Parse result
    console.log('Parsing result...');
    const parsed = JSON.parse(result);
    console.log('✅ Result parsed');
    
    res.json({
      success: true,
      message: 'Game generation test successful',
      data: parsed,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Start minimal server
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/test`);
  console.log(`Game test URL: http://localhost:${PORT}/test-game-generation`);
  console.log('Use POST request to test game generation');
});

// Test the generation immediately
setTimeout(async () => {
  console.log('\n🔄 Running automatic test...');
  try {
    const response = await fetch(`http://localhost:${PORT}/test-game-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    console.log('Auto-test result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!result.success) {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('Auto-test failed:', error.message);
  }
}, 2000);
