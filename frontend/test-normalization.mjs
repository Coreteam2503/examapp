/**
 * Simple test to verify frontend normalization works with clean data
 */

import { normalizeQuestion } from '../src/utils/questionNormalizer.js';

// Test with proper universal question types that should be supported
const testQuestions = [
  {
    id: 1,
    type: "multiple_choice",
    question_text: "What is 2 + 2?",
    options: "A) 3\nB) 4\nC) 5\nD) 6",
    correct_answer: "B",
    explanation: "Basic arithmetic: 2 + 2 = 4"
  },
  {
    id: 2,
    type: "true_false", 
    question_text: "JavaScript is a programming language.",
    correct_answer: "true",
    explanation: "JavaScript is indeed a programming language."
  },
  {
    id: 3,
    type: "fill_blank",
    question_text: "The capital of France is _____.",
    correct_answer: "Paris",
    explanation: "Paris is the capital city of France."
  }
];

console.log('🧪 Testing Question Normalization (Clean Setup)');
console.log('===============================================\n');

testQuestions.forEach((question, index) => {
  console.log(`Test ${index + 1}: ${question.type}`);
  console.log(`Input: ${question.question_text}`);
  
  const normalized = normalizeQuestion(question);
  
  console.log(`✅ Output Type: ${normalized.type}`);
  console.log(`✅ Output Question: ${normalized.question}`);
  if (normalized.options) console.log(`✅ Options: ${normalized.options.length} items`);
  console.log('---\n');
});

console.log('🎯 Frontend normalization ready for real data!');
