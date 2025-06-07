/**
 * Answer Normalization Utilities
 * Fixes the quiz answer validation issues by standardizing answer formats
 * between frontend submission and backend validation.
 */

/**
 * Extract the letter identifier from a multiple choice option
 * @param {string} option - Full option text like "B) Only the children"
 * @returns {string} - Just the letter like "B"
 */
export const extractOptionLetter = (option) => {
  if (!option || typeof option !== 'string') return option;
  
  // Match patterns like "A)", "B)", "C)", "D)" at the start
  const match = option.match(/^([A-D])\)/);
  if (match) {
    return match[1];
  }
  
  // If no pattern found, check if it's already just a letter
  if (/^[A-D]$/.test(option.trim())) {
    return option.trim();
  }
  
  // Return original if we can't extract
  return option;
};

/**
 * Normalize true/false answers to match backend format
 * @param {boolean|string|number} answer - User's true/false answer
 * @returns {string} - Normalized string format ("True" or "False")
 */
export const normalizeTrueFalseAnswer = (answer) => {
  if (typeof answer === 'boolean') {
    return answer ? 'True' : 'False';
  }
  
  if (typeof answer === 'string') {
    const lower = answer.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return 'True';
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return 'False';
    }
    return answer; // Return original if we can't normalize
  }
  
  if (typeof answer === 'number') {
    return answer === 1 || answer > 0 ? 'True' : 'False';
  }
  
  return answer;
};

/**
 * Normalize fill-in-the-blank answers for more lenient matching
 * @param {Object} userAnswers - Object with blank number as key and answer as value
 * @param {Object} correctAnswers - Object with correct answers for each blank
 * @returns {Object} - Normalized user answers
 */
export const normalizeFillBlankAnswers = (userAnswers, correctAnswers = {}) => {
  if (!userAnswers || typeof userAnswers !== 'object') {
    return userAnswers;
  }
  
  const normalized = {};
  
  Object.keys(userAnswers).forEach(blankKey => {
    const userAnswer = userAnswers[blankKey];
    const correctAnswersList = correctAnswers[blankKey] || [];
    
    // If no correct answers defined (null case), any answer should be acceptable
    if (!correctAnswersList || correctAnswersList.length === 0) {
      normalized[blankKey] = userAnswer; // Accept any answer
      return;
    }
    
    if (typeof userAnswer === 'string') {
      const trimmedAnswer = userAnswer.trim();
      
      // Find the best matching correct answer
      const bestMatch = findBestMatch(trimmedAnswer, correctAnswersList);
      
      if (bestMatch) {
        // Use the best matching correct answer format
        normalized[blankKey] = bestMatch;
      } else {
        // Keep original trimmed answer if no good match found
        normalized[blankKey] = trimmedAnswer;
      }
    } else {
      normalized[blankKey] = userAnswer;
    }
  });
  
  return normalized;
};

/**
 * Find the best matching answer from a list of correct answers
 * @param {string} userAnswer - User's input
 * @param {Array} correctAnswers - Array of acceptable answers
 * @returns {string|null} - Best matching answer or null if no good match
 */
const findBestMatch = (userAnswer, correctAnswers) => {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return null;
  }
  
  const normalizedUser = userAnswer.toLowerCase().trim();
  
  // Exact match (case insensitive)
  for (const correct of correctAnswers) {
    if (correct && normalizedUser === correct.toLowerCase().trim()) {
      return correct;
    }
  }
  
  // Partial match - user answer contains correct answer
  for (const correct of correctAnswers) {
    if (correct && normalizedUser.includes(correct.toLowerCase().trim())) {
      return correct;
    }
  }
  
  // Partial match - correct answer contains user answer (more lenient)
  for (const correct of correctAnswers) {
    if (correct && correct.toLowerCase().trim().includes(normalizedUser)) {
      return correct;
    }
  }
  
  // Similarity match for single words (basic edit distance)
  if (normalizedUser.split(' ').length === 1) {
    for (const correct of correctAnswers) {
      if (correct && correct.toLowerCase().trim().split(' ').length === 1) {
        const similarity = calculateSimilarity(normalizedUser, correct.toLowerCase().trim());
        if (similarity > 0.7) { // 70% similarity threshold
          return correct;
        }
      }
    }
  }
  
  return null;
};

/**
 * Calculate similarity between two strings (basic Levenshtein distance based)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (str1, str2) => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Main answer normalization function that handles all question types
 * @param {any} answer - User's answer
 * @param {string} questionType - Type of question (multiple_choice, true_false, etc.)
 * @param {Object} questionData - Additional question data for context
 * @returns {any} - Normalized answer
 */
export const normalizeAnswer = (answer, questionType, questionData = {}) => {
  if (answer === null || answer === undefined) {
    return answer;
  }
  
  switch (questionType) {
    case 'multiple_choice':
      return extractOptionLetter(answer);
      
    case 'true_false':
    case 'true-false':
      return normalizeTrueFalseAnswer(answer);
      
    case 'fill_in_the_blank':
    case 'fill-in-the-blank':
    case 'fill_blank':
      return normalizeFillBlankAnswers(answer, questionData.correctAnswers);
      
    default:
      return answer;
  }
};

/**
 * Normalize all answers in a quiz submission
 * @param {Object} answers - Object with questionId as key and answer data as value
 * @param {Array} questions - Array of question objects with type and other data
 * @returns {Object} - Normalized answers object
 */
export const normalizeQuizAnswers = (answers, questions = []) => {
  if (!answers || typeof answers !== 'object') {
    return answers;
  }
  
  // Create a lookup map for question data
  const questionMap = {};
  questions.forEach(q => {
    questionMap[q.id] = q;
  });
  
  const normalizedAnswers = {};
  
  Object.keys(answers).forEach(questionId => {
    const answerData = answers[questionId];
    const question = questionMap[questionId];
    
    if (!question) {
      // If we don't have question data, keep original answer
      normalizedAnswers[questionId] = answerData;
      return;
    }
    
    if (answerData && typeof answerData === 'object' && answerData.answer !== undefined) {
      // Answer is wrapped in an object with additional data
      normalizedAnswers[questionId] = {
        ...answerData,
        answer: normalizeAnswer(answerData.answer, question.type, question)
      };
    } else {
      // Answer is the raw value
      normalizedAnswers[questionId] = {
        answer: normalizeAnswer(answerData, question.type, question),
        timeSpent: 0 // Default time spent
      };
    }
  });
  
  return normalizedAnswers;
};
