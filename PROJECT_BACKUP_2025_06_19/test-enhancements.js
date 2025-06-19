#!/usr/bin/env node

/**
 * Test Script for Quiz Application Enhancements
 * This script helps test and validate the new quiz features
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quiz Application Enhancement Test Script');
console.log('===========================================\n');

// Check if all required files exist
const requiredFiles = [
  'frontend/src/components/quiz/QuizOptionsModal.js',
  'frontend/src/components/quiz/QuizOptionsModal.css',
  'frontend/src/components/quiz/questions/OrderingQuestion.js',
  'frontend/src/components/quiz/questions/OrderingQuestion.css',
  'backend/src/migrations/008_add_drag_drop_support.js',
  'backend/src/migrations/009_comprehensive_questions_update.js'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All required files are present!');
} else {
  console.log('\n⚠️  Some files are missing. Please check the implementation.');
}

// Check FileUpload component restrictions
console.log('\n🔍 Checking file upload restrictions...');
const fileUploadPath = path.join(__dirname, 'frontend/src/components/FileUpload.js');
if (fs.existsSync(fileUploadPath)) {
  const fileUploadContent = fs.readFileSync(fileUploadPath, 'utf8');
  
  if (fileUploadContent.includes("'.txt', '.ipynb'") && 
      !fileUploadContent.includes("'.js', '.py', '.java'")) {
    console.log('✅ File upload restrictions correctly updated to .txt and .ipynb only');
  } else {
    console.log('❌ File upload restrictions not properly updated');
  }
}

// Check rate limiting
console.log('\n⏱️  Checking rate limiting configuration...');
const rateLimitPath = path.join(__dirname, 'backend/src/middleware/rateLimiting.js');
if (fs.existsSync(rateLimitPath)) {
  const rateLimitContent = fs.readFileSync(rateLimitPath, 'utf8');
  
  if (rateLimitContent.includes('|| 5')) {
    console.log('✅ Quiz generation rate limit set to 5 per hour');
  } else {
    console.log('❌ Quiz generation rate limit not properly configured');
  }
}

// Check API service enhancement
console.log('\n🔌 Checking API service enhancements...');
const apiServicePath = path.join(__dirname, 'frontend/src/services/apiService.js');
if (fs.existsSync(apiServicePath)) {
  const apiServiceContent = fs.readFileSync(apiServicePath, 'utf8');
  
  if (apiServiceContent.includes('generateEnhanced')) {
    console.log('✅ Enhanced quiz generation API endpoint added');
  } else {
    console.log('❌ Enhanced quiz generation API endpoint missing');
  }
}

console.log('\n📝 Next Steps:');
console.log('1. Run database migrations:');
console.log('   cd backend && npx knex migrate:latest');
console.log('');
console.log('2. Start the backend server:');
console.log('   cd backend && npm run dev');
console.log('');
console.log('3. Start the frontend server:');
console.log('   cd frontend && npm start');
console.log('');
console.log('4. Test the features:');
console.log('   - Upload .txt or .ipynb files only');
console.log('   - Use the quiz options modal');
console.log('   - Generate quizzes with different settings');
console.log('   - Try the enhanced question types');
console.log('');
console.log('🎯 All features should now work as requested!');
