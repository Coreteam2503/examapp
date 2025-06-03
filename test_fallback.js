// Test the fallback quiz generator
const MockQuizGenerator = require('./backend/services/fallback/mockQuizGenerator');

const generator = new MockQuizGenerator();

// Test with sample JavaScript code
const testCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);

console.log('Fibonacci of 5:', fibonacci(5));
console.log('Doubled numbers:', doubled);
`;

console.log('🧪 Testing fallback quiz generator...\n');

try {
  const result = generator.generateQuizFromContent(testCode, {
    difficulty: 'medium',
    numQuestions: 3,
    questionTypes: ['multiple_choice', 'fill_in_the_blank'],
    language: 'javascript'
  });
  
  console.log('✅ Quiz generated successfully!');
  console.log('📊 Metadata:', JSON.stringify(result.metadata, null, 2));
  console.log('\n📝 Generated Questions:');
  
  result.questions.forEach((question, index) => {
    console.log(`\n${index + 1}. ${question.question}`);
    if (question.code_snippet) {
      console.log(`   Code: ${question.code_snippet}`);
    }
    if (question.options) {
      question.options.forEach(option => console.log(`   ${option}`));
      console.log(`   ✅ Correct: ${question.correct_answer}`);
    }
    if (question.correctAnswers) {
      console.log(`   ✅ Fill-in answers:`, question.correctAnswers);
    }
    console.log(`   💡 ${question.explanation}`);
  });
  
  console.log('\n🎉 Fallback generator is working perfectly!');
  console.log('💡 This is what your users will see when you restart the backend.');
  
} catch (error) {
  console.error('❌ Error testing fallback generator:', error);
}
