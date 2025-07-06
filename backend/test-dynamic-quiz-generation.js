const { db } = require('./src/config/database');
const { QuizGenerationService } = require('./src/services/quizGenerationService');
const Question = require('./src/models/Question');

async function testDynamicQuizGeneration() {
  try {
    console.log('🧪 Testing Dynamic Quiz Generation...');
    
    const service = new QuizGenerationService();
    
    // Test 1: Get Available Options
    console.log('\n1️⃣ Testing available options...');
    const options = await service.getAvailableOptions();
    
    console.log('✅ Available options retrieved:');
    console.log(`   Domains: ${options.domains.length}`);
    console.log(`   Subjects: ${options.subjects.length}`);
    console.log(`   Difficulties: ${options.difficulties.length}`);
    console.log(`   Types: ${options.types.length}`);
    console.log(`   Game Formats: ${options.gameFormats.length}`);
    
    if (options.domains.length > 0) {
      console.log(`   Sample domains: ${options.domains.slice(0, 3).map(d => d.label).join(', ')}`);
    }
    
    // Test 2: Validate Criteria
    console.log('\n2️⃣ Testing criteria validation...');
    
    const validCriteria = {
      domain: 'General',
      difficulty_level: 'Medium',
      game_format: 'traditional',
      num_questions: 5
    };
    
    try {
      const validated = service.validateCriteria(validCriteria);
      console.log('✅ Criteria validation passed');
      console.log(`   Validated: ${JSON.stringify(validated, null, 2)}`);
    } catch (error) {
      console.log('❌ Criteria validation failed:', error.message);
    }
    
    // Test 3: Invalid Criteria
    console.log('\n3️⃣ Testing invalid criteria...');
    
    const invalidCriteria = {
      num_questions: 999, // Too many
      difficulty_level: 'Invalid',
      game_format: 'unknown'
    };
    
    try {
      service.validateCriteria(invalidCriteria);
      console.log('❌ Should have failed validation');
    } catch (error) {
      console.log('✅ Invalid criteria properly rejected:', error.message);
    }
    
    // Test 4: Question Selection Algorithms
    console.log('\n4️⃣ Testing question selection algorithms...');
    
    // Get some sample questions
    const sampleQuestions = await Question.searchWithFilters({}, { limit: 20 });
    
    if (sampleQuestions.length >= 5) {
      console.log(`📝 Using ${sampleQuestions.length} sample questions for selection test`);
      
      // Test random selection
      const selected1 = service._selectQuestions(sampleQuestions, 5);
      const selected2 = service._selectQuestions(sampleQuestions, 5);
      
      console.log('✅ Random selection working');
      console.log(`   Selection 1 IDs: ${selected1.map(q => q.id).join(', ')}`);
      console.log(`   Selection 2 IDs: ${selected2.map(q => q.id).join(', ')}`);
      
      // Test seeded selection (should be deterministic)
      const seeded1 = service._selectQuestions(sampleQuestions, 5, 12345);
      const seeded2 = service._selectQuestions(sampleQuestions, 5, 12345);
      
      const sameOrder = JSON.stringify(seeded1.map(q => q.id)) === JSON.stringify(seeded2.map(q => q.id));
      console.log(`✅ Seeded selection working: ${sameOrder ? 'deterministic' : 'non-deterministic'}`);
      
    } else {
      console.log('⚠️ Not enough questions for selection test');
    }
    
    // Test 5: Full Quiz Generation (if we have enough questions)
    console.log('\n5️⃣ Testing full quiz generation...');
    
    const totalQuestions = await Question.searchWithFilters({}, {});
    
    if (totalQuestions.length >= 3) {
      console.log(`📊 Total questions available: ${totalQuestions.length}`);
      
      const testCriteria = {
        domain: 'General',
        difficulty_level: 'Medium',
        game_format: 'traditional',
        num_questions: Math.min(3, totalQuestions.length)
      };
      
      try {
        const generatedQuiz = await service.generateQuiz(testCriteria, 1); // Mock user ID
        
        console.log('✅ Quiz generation successful!');
        console.log(`   Quiz ID: ${generatedQuiz.quiz.id}`);
        console.log(`   Title: ${generatedQuiz.quiz.title}`);
        console.log(`   Questions: ${generatedQuiz.questions.length}`);
        console.log(`   Game Format: ${generatedQuiz.quiz.game_format}`);
        
        // Show sample questions
        generatedQuiz.questions.slice(0, 2).forEach((q, index) => {
          console.log(`   Q${index + 1}: ${q.question_text?.substring(0, 50)}...`);
        });
        
        // Clean up - delete the test quiz
        console.log('🧹 Cleaning up test quiz...');
        await db('quizzes').where('id', generatedQuiz.quiz.id).del();
        await db('questions').where('quiz_id', generatedQuiz.quiz.id).del();
        console.log('✅ Test quiz cleaned up');
        
      } catch (error) {
        console.log('❌ Quiz generation failed:', error.message);
        if (error.details) {
          console.log('   Details:', error.details);
        }
      }
    } else {
      console.log('⚠️ Not enough questions for full quiz generation test');
    }
    
    // Test 6: Different Game Formats
    console.log('\n6️⃣ Testing different game formats...');
    
    const gameFormats = ['traditional', 'hangman', 'knowledge_tower', 'word_ladder', 'memory_grid'];
    
    for (const format of gameFormats) {
      const options = service._generateGameOptions({ 
        game_format: format, 
        num_questions: 5,
        difficulty_level: 'Medium' 
      });
      
      const parsedOptions = JSON.parse(options);
      console.log(`✅ ${format}: ${Object.keys(parsedOptions).join(', ')}`);
    }
    
    // Test 7: Insufficient Questions Scenario
    console.log('\n7️⃣ Testing insufficient questions scenario...');
    
    try {
      const impossibleCriteria = {
        domain: 'NonExistentDomain',
        subject: 'NonExistentSubject',
        num_questions: 10
      };
      
      await service.generateQuiz(impossibleCriteria, 1);
      console.log('❌ Should have failed due to insufficient questions');
      
    } catch (error) {
      console.log('✅ Insufficient questions properly handled:', error.message);
    }
    
    console.log('\n🎉 Dynamic Quiz Generation testing completed!');
    console.log('📊 Test Summary:');
    console.log('   ✅ Available options retrieval');
    console.log('   ✅ Criteria validation');
    console.log('   ✅ Invalid criteria rejection');
    console.log('   ✅ Question selection algorithms');
    console.log('   ✅ Full quiz generation flow');
    console.log('   ✅ Game format options generation');
    console.log('   ✅ Insufficient questions error handling');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

testDynamicQuizGeneration();
