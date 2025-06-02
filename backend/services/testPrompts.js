// Test script for prompt service
require('dotenv').config();
const PromptService = require('./promptService');

async function testPromptEffectiveness() {
  const promptService = new PromptService();
  
  const testCases = [
    {
      name: 'JavaScript Functions',
      content: `
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const right = arr.filter(x => x > pivot);
  const middle = arr.filter(x => x === pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

const binarySearch = (arr, target) => {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
};
      `,
      difficulty: 'medium'
    },
    {
      name: 'React Component',
      content: `
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
};

export default UserProfile;
      `,
      difficulty: 'medium'
    }
  ];

  console.log('🧪 Testing Prompt Effectiveness\n');

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log('='.repeat(40));
    
    try {
      const result = await promptService.generateQuizFromContent(
        testCase.content, 
        { 
          difficulty: testCase.difficulty, 
          numQuestions: 3 
        }
      );

      console.log(`✅ Generated ${result.questions.length} questions`);
      console.log(`📊 Metadata:`, result.metadata);
      
      // Display sample question
      if (result.questions.length > 0) {
        const sampleQ = result.questions[0];
        console.log(`\n📝 Sample Question:`);
        console.log(`Q: ${sampleQ.question}`);
        console.log(`Options: ${sampleQ.options.join(', ')}`);
        console.log(`Correct: ${sampleQ.correct_answer}`);
        console.log(`Concepts: ${sampleQ.concepts?.join(', ') || 'N/A'}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed for ${testCase.name}:`, error.message);
    }
    
    console.log('\n');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPromptEffectiveness()
    .then(() => console.log('🎉 All tests completed'))
    .catch(error => console.error('💥 Test failed:', error));
}

module.exports = { testPromptEffectiveness };
