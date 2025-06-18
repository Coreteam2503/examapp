// Test script to verify game generation works without crashing
const PromptService = require('./services/promptService');

async function testGameGeneration() {
  console.log('🔬 Testing game generation fallback...');
  
  try {
    const promptService = new PromptService();
    console.log('✅ PromptService initialized successfully');
    
    // Test hangman game generation
    console.log('🎮 Testing Hangman generation...');
    const hangmanPrompt = `
    Generate a Hangman word guessing game based on the following content.
    
    Content: function hello() { console.log('Hello, world!'); }
    
    Requirements:
    - Extract 5-10 important words or phrases from the content
    - Words should be relevant to the main concepts
    - Difficulty: medium
    - Provide hints for each word
    - Words should be 4-15 characters long
    
    Return a JSON object with this structure:
    {
      "title": "Hangman Game Title",
      "metadata": {
        "maxWrongGuesses": 6,
        "totalWords": 5
      },
      "questions": [
        {
          "word_data": {
            "word": "EXAMPLE",
            "category": "Programming Concept",
            "hint": "A sample or instance used for illustration"
          },
          "correct_answer": "EXAMPLE",
          "max_attempts": 6,
          "difficulty": "medium",
          "concepts": ["programming", "examples"]
        }
      ]
    }
    `;
    
    const result = await promptService.generateContent(hangmanPrompt);
    console.log('✅ Hangman generation result:', JSON.parse(result));
    
    console.log('🎉 All tests passed! Game generation is working.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testGameGeneration().then(success => {
  if (success) {
    console.log('\n✅ Server should be able to handle game generation now.');
  } else {
    console.log('\n❌ There are still issues that need to be fixed.');
  }
  process.exit(success ? 0 : 1);
});
