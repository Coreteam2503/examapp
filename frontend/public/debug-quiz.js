/**
 * Debug helper for testing quiz generation
 * Call this from browser console or add it to a test route
 */

// Test function to debug quiz generation
async function testQuizGeneration() {
  try {
    console.log('🧪 Testing quiz generation...');
    
    // Get auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found. Please login first.');
      return;
    }
    
    // Test file upload first
    console.log('📁 Getting uploaded files...');
    const uploadsResponse = await fetch('/api/uploads', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const uploadsData = await uploadsResponse.json();
    console.log('📁 Uploads response:', uploadsData);
    
    if (!uploadsData.success || !uploadsData.data || !uploadsData.data.uploads.length) {
      console.error('❌ No uploaded files found. Please upload a file first.');
      return;
    }
    
    const firstFile = uploadsData.data.uploads[0];
    console.log('📄 Using file:', firstFile);
    
    // Test quiz generation
    console.log('🎯 Testing traditional quiz generation...');
    const quizResponse = await fetch('/api/quizzes/generate-enhanced', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: firstFile.id,
        difficulty: 'medium',
        numQuestions: 3,
        questionTypes: ['multiple_choice'],
        includeHints: false
      })
    });
    
    const quizData = await quizResponse.json();
    console.log('🎯 Quiz generation response:', quizData);
    
    if (quizData.error) {
      console.error('❌ Quiz generation failed:', quizData.error);
      console.error('Details:', quizData.details);
    } else {
      console.log('✅ Quiz generation successful!');
      console.log('Quiz ID:', quizData.quiz?.id);
      console.log('Questions:', quizData.quiz?.total_questions);
    }
    
    // Test game generation if available
    console.log('🎮 Testing game generation...');
    const gameResponse = await fetch('/api/games/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: firstFile.id,
        gameFormat: 'hangman',
        difficulty: 'medium',
        gameOptions: {
          maxWrongGuesses: 6
        }
      })
    });
    
    const gameData = await gameResponse.json();
    console.log('🎮 Game generation response:', gameData);
    
    if (gameData.error) {
      console.error('❌ Game generation failed:', gameData.error);
      console.error('Details:', gameData.details);
    } else {
      console.log('✅ Game generation successful!');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test auth status
async function testAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('❌ No auth token found');
    return false;
  }
  
  try {
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('🔐 Auth status:', data);
    return data.valid || response.ok;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

// Run the test
console.log('📝 Quiz Generation Debug Test');
console.log('Copy and paste this into your browser console:');
console.log('testQuizGeneration()');

// Export for testing
if (typeof window !== 'undefined') {
  window.testQuizGeneration = testQuizGeneration;
  window.testAuth = testAuth;
}