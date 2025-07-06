/**
 * Question Data Normalizer
 * Converts game-specific question formats to standardized question objects
 * that can be used universally across all games and question components.
 */

/**
 * Normalize a question object to standard format
 * @param {Object} rawQuestion - Raw question data from any game
 * @returns {Object} - Standardized question object
 */
export const normalizeQuestion = (rawQuestion) => {
  if (!rawQuestion) {
    console.warn('Received null/undefined question');
    return createEmptyQuestion();
  }

  // If already normalized, return as is
  if (rawQuestion._normalized) {
    return rawQuestion;
  }

  const normalized = {
    id: rawQuestion.id || generateQuestionId(),
    type: detectQuestionType(rawQuestion),
    question: extractQuestionText(rawQuestion),
    correct_answer: extractCorrectAnswer(rawQuestion),
    explanation: rawQuestion.explanation || '',
    difficulty: rawQuestion.difficulty || 'medium',
    category: rawQuestion.category || 'general',
    points: rawQuestion.points || 1,
    timeLimit: rawQuestion.timeLimit || null,
    _normalized: true, // Mark as normalized
  };

  // Add type-specific data
  switch (normalized.type) {
    case 'mcq':
      normalized.options = extractMCQOptions(rawQuestion);
      break;
    case 'matching':
      normalized.pairs = extractMatchingPairs(rawQuestion);
      break;
    case 'true_false':
      normalized.options = ['True', 'False'];
      break;
    case 'fill_blank':
      normalized.blanks = extractFillBlanks(rawQuestion);
      // For fill-in-blank, prefer the 'text' field which should contain ___BLANK_N___ markers
      normalized.text = rawQuestion.text || rawQuestion.question_text || rawQuestion.formatted_text || rawQuestion.question;
      break;
    case 'ordering':
      normalized.items = extractOrderingItems(rawQuestion);
      break;
  }

  return normalized;
};

/**
 * Detect question type from raw data
 * @param {Object} question - Raw question object
 * @returns {string} - Detected question type
 */
const detectQuestionType = (question) => {
  // Explicit type
  if (question.type) {
    return normalizeQuestionType(question.type);
  }

  // Detect based on data structure
  if (question.options && Array.isArray(question.options)) {
    return 'mcq';
  }
  
  if (question.pairs && Array.isArray(question.pairs)) {
    return 'matching';
  }
  
  if (question.items && Array.isArray(question.items)) {
    return 'ordering';
  }
  
  if (question.word_data || question.word) {
    // Convert word-based questions to fill_blank
    return 'fill_blank';
  }
  
  if (question.pattern_data) {
    // Convert pattern data to matching
    return 'matching';
  }
  
  if (question.ladder_steps) {
    // Convert ladder steps to appropriate type
    return detectLadderStepType(question.ladder_steps);
  }

  // Check answer type for true/false
  const answer = question.correct_answer || question.answer;
  if (typeof answer === 'boolean' || 
      (typeof answer === 'string' && 
       ['true', 'false', 'yes', 'no'].includes(answer.toLowerCase()))) {
    return 'true_false';
  }

  // Default to MCQ
  return 'mcq';
};

/**
 * Normalize question type strings
 * @param {string} type - Raw type string
 * @returns {string} - Normalized type
 */
const normalizeQuestionType = (type) => {
  const typeMap = {
    'multiple_choice': 'mcq',
    'multiple-choice': 'mcq',
    'multichoice': 'mcq',
    'mc': 'mcq',
    'true_false': 'true_false',
    'true-false': 'true_false',
    'truefalse': 'true_false',
    'tf': 'true_false',
    'fill_in_the_blank': 'fill_blank',
    'fill-in-the-blank': 'fill_blank',
    'fill_blank': 'fill_blank',
    'fillblank': 'fill_blank',
    'matching': 'matching',
    'match': 'matching',
    'ordering': 'ordering',
    'order': 'ordering',
    'sequence': 'ordering',
  };

  return typeMap[type.toLowerCase()] || type.toLowerCase();
};

/**
 * Extract question text from various possible fields
 * @param {Object} question - Raw question object
 * @returns {string} - Question text
 */
const extractQuestionText = (question) => {
  return question.question ||
         question.text ||
         question.question_text ||
         question.prompt ||
         question.title ||
         'Question text not available';
};

/**
 * Extract correct answer from various formats
 * @param {Object} question - Raw question object
 * @returns {any} - Correct answer
 */
const extractCorrectAnswer = (question) => {
  if (question.correct_answer !== undefined) {
    return question.correct_answer;
  }
  
  if (question.answer !== undefined) {
    return question.answer;
  }

  // For word-based questions
  if (question.word_data) {
    const wordData = parseJSONField(question.word_data);
    return wordData.word || wordData.answer;
  }

  if (question.word) {
    return question.word;
  }

  return null;
};

/**
 * Extract MCQ options from question data
 * @param {Object} question - Raw question object
 * @returns {Array} - Array of option strings
 */
const extractMCQOptions = (question) => {
  if (question.options && Array.isArray(question.options)) {
    return question.options;
  }

  // Try to extract from ladder_steps for code analysis
  if (question.ladder_steps) {
    const ladderData = parseJSONField(question.ladder_steps);
    if (ladderData.options && Array.isArray(ladderData.options)) {
      return ladderData.options;
    }
  }

  // Generate default options for true/false
  const answer = extractCorrectAnswer(question);
  if (typeof answer === 'boolean' || 
      (typeof answer === 'string' && 
       ['true', 'false'].includes(answer.toLowerCase()))) {
    return ['True', 'False'];
  }

  return [];
};

/**
 * Extract matching pairs from question data
 * @param {Object} question - Raw question object
 * @returns {Array} - Array of {left, right} pair objects
 */
const extractMatchingPairs = (question) => {
  if (question.pairs && Array.isArray(question.pairs)) {
    return question.pairs;
  }

  // Convert pattern_data to matching pairs
  if (question.pattern_data) {
    const patternData = parseJSONField(question.pattern_data);
    return convertPatternToMatching(patternData);
  }

  return [];
};

/**
 * Extract ordering items from question data
 * @param {Object} question - Raw question object
 * @returns {Array} - Array of items to order
 */
const extractOrderingItems = (question) => {
  if (question.items && Array.isArray(question.items)) {
    return question.items;
  }

  if (question.sequence && Array.isArray(question.sequence)) {
    return question.sequence;
  }

  return [];
};

/**
 * Extract fill-in-the-blank data
 * @param {Object} question - Raw question object
 * @returns {Object} - Blanks data
 */
const extractFillBlanks = (question) => {
  if (question.blanks) {
    return question.blanks;
  }

  // For word-based questions, create a single blank
  const answer = extractCorrectAnswer(question);
  if (answer) {
    return {
      1: [answer] // Single blank with the word as answer
    };
  }

  return {};
};

/**
 * Parse JSON field that might be string or object
 * @param {string|Object} field - Field to parse
 * @returns {Object} - Parsed object
 */
const parseJSONField = (field) => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Failed to parse JSON field:', field);
      return {};
    }
  }
  
  return field || {};
};

/**
 * Convert pattern data to matching pairs
 * @param {Object} patternData - Pattern data object
 * @returns {Array} - Array of matching pairs
 */
const convertPatternToMatching = (patternData) => {
  const { symbols, sequence } = patternData;
  
  if (!symbols || !Array.isArray(symbols)) {
    return [];
  }

  // Create pairs from symbols (simple implementation)
  const pairs = [];
  for (let i = 0; i < symbols.length - 1; i += 2) {
    if (symbols[i + 1]) {
      pairs.push({
        left: symbols[i],
        right: symbols[i + 1]
      });
    }
  }

  return pairs;
};

/**
 * Detect question type from ladder steps
 * @param {string|Object} ladderSteps - Ladder steps data
 * @returns {string} - Detected question type
 */
const detectLadderStepType = (ladderSteps) => {
  const data = parseJSONField(ladderSteps);
  
  if (data.type === 'code_analysis' || data.options) {
    return 'mcq';
  }
  
  return 'mcq'; // Default for ladder steps
};

/**
 * Create empty question template
 * @returns {Object} - Empty normalized question
 */
const createEmptyQuestion = () => ({
  id: generateQuestionId(),
  type: 'mcq',
  question: 'Question not available',
  correct_answer: null,
  explanation: '',
  difficulty: 'medium',
  category: 'general',
  points: 1,
  timeLimit: null,
  options: [],
  _normalized: true,
});

/**
 * Generate unique question ID
 * @returns {string} - Generated ID
 */
const generateQuestionId = () => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Batch normalize multiple questions
 * @param {Array} questions - Array of raw questions
 * @returns {Array} - Array of normalized questions
 */
export const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    console.warn('normalizeQuestions: Expected array, got', typeof questions);
    return [];
  }

  return questions.map(normalizeQuestion);
};

/**
 * Validate normalized question
 * @param {Object} question - Normalized question
 * @returns {boolean} - Whether question is valid
 */
export const validateNormalizedQuestion = (question) => {
  if (!question || typeof question !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'type', 'question'];
  const hasRequiredFields = requiredFields.every(field => 
    question[field] !== undefined && question[field] !== null
  );

  if (!hasRequiredFields) {
    console.warn('Question missing required fields:', question);
    return false;
  }

  return true;
};
