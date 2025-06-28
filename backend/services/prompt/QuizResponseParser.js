/**
 * Quiz Response Parser - Handles parsing and validation of LLM responses
 */
class QuizResponseParser {

  /**
   * Parse the LLM response and validate the structure
   */
  parseQuizResponse(rawResponse) {
    console.log('🔍 [QuizResponseParser] Starting to parse quiz response...');
    console.log('📄 [QuizResponseParser] Raw response length:', rawResponse.length, 'characters');

    try {
      // Clean the response (remove any markdown formatting)
      console.log('🧹 [QuizResponseParser] Cleaning response (removing markdown)...');
      const cleanedResponse = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('📄 [QuizResponseParser] Cleaned response length:', cleanedResponse.length, 'characters');
      console.log('📋 [QuizResponseParser] Cleaned response preview:', cleanedResponse.substring(0, 200) + '...');

      console.log('🔍 [QuizResponseParser] Parsing JSON...');
      const parsed = JSON.parse(cleanedResponse);
      console.log('✅ [QuizResponseParser] JSON parsed successfully');

      // Validate the structure
      console.log('🔍 [QuizResponseParser] Validating response structure...');
      this.validateQuizStructure(parsed);

      console.log('✅ [QuizResponseParser] All questions validated successfully');
      console.log('📊 [QuizResponseParser] Final parsed result:', {
        questionsCount: parsed.questions.length,
        questionTypes: parsed.questions.map(q => q.type),
        hasMetadata: !!parsed.metadata
      });

      return parsed;
    } catch (error) {
      console.error('❌ [QuizResponseParser] Error parsing quiz response:', error);
      console.error('🔍 [QuizResponseParser] Error details:', {
        message: error.message,
        type: error.constructor.name
      });
      console.error('📄 [QuizResponseParser] Raw response that failed to parse:', rawResponse);
      throw new Error('Failed to parse quiz response: ' + error.message);
    }
  }

  /**
   * Validate the quiz structure
   */
  validateQuizStructure(parsed) {
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      const error = 'Invalid response structure: missing questions array';
      console.error('❌ [QuizResponseParser] Validation error:', error);
      throw new Error(error);
    }

    console.log('📊 [QuizResponseParser] Questions array found with', parsed.questions.length, 'questions');

    // Validate each question
    parsed.questions.forEach((question, index) => {
      console.log(`🔍 [QuizResponseParser] Validating question ${index + 1}:`, {
        id: question.id,
        type: question.type,
        hasQuestion: !!question.question,
        hasExplanation: !!question.explanation
      });

      this.validateQuestion(question, index);
    });
  }

  /**
   * Validate individual question
   */
  validateQuestion(question, index) {
    const required = ['id', 'type', 'question', 'explanation'];
    required.forEach(field => {
      if (!question[field]) {
        const error = `Question ${index + 1} missing required field: ${field}`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
    });

    // Validate multiple choice structure
    if (question.type === 'multiple_choice' || question.type === 'multiple-choice') {
      console.log(`🔍 [QuizResponseParser] Validating multiple choice question ${index + 1}`);
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        const error = `Question ${index + 1} must have at least 2 options`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
      if (!question.correct_answer) {
        const error = `Question ${index + 1} missing correct_answer`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
    }

    // Validate fill-in-the-blank structure
    if (question.type === 'fill_in_the_blank' || question.type === 'fill-in-the-blank') {
      console.log(`🔍 [QuizResponseParser] Validating fill-in-the-blank question ${index + 1}`);
      if (!question.correctAnswers || typeof question.correctAnswers !== 'object') {
        const error = `Question ${index + 1} missing correctAnswers object`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
      // Ensure text field exists for fill-in-the-blank
      if (!question.text) {
        console.log(`🔧 [QuizResponseParser] Adding text field to question ${index + 1}`);
        question.text = question.question;
      }
    }

    // Validate true/false structure
    if (question.type === 'true_false' || question.type === 'true-false') {
      console.log(`🔍 [QuizResponseParser] Validating true/false question ${index + 1}`);
      if (question.correct_answer === undefined || question.correct_answer === null) {
        const error = `Question ${index + 1} missing correct_answer for true/false`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
    }

    // Validate drag & drop matching structure
    if (question.type === 'drag_drop_match') {
      console.log(`🔍 [QuizResponseParser] Validating drag & drop matching question ${index + 1}`);
      if (!question.pairs || !Array.isArray(question.pairs) || question.pairs.length === 0) {
        const error = `Question ${index + 1} missing pairs array for drag_drop_match`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
      question.pairs.forEach((pair, pairIndex) => {
        if (!pair.left || !pair.right) {
          const error = `Question ${index + 1}, pair ${pairIndex + 1} missing left or right property`;
          console.error('❌ [QuizResponseParser] Validation error:', error);
          throw new Error(error);
        }
      });
    }

    // Validate drag & drop ordering structure
    if (question.type === 'drag_drop_order') {
      console.log(`🔍 [QuizResponseParser] Validating drag & drop ordering question ${index + 1}`);
      if (!question.items || !Array.isArray(question.items) || question.items.length === 0) {
        const error = `Question ${index + 1} missing items array for drag_drop_order`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
      if (!question.correctOrder || !Array.isArray(question.correctOrder)) {
        const error = `Question ${index + 1} missing correctOrder array for drag_drop_order`;
        console.error('❌ [QuizResponseParser] Validation error:', error);
        throw new Error(error);
      }
    }
  }
}

module.exports = QuizResponseParser;