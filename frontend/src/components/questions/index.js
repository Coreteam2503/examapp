/**
 * Questions Components Index
 * Central export point for all question-related components
 */

// Main wrapper component
export { default as QuestionWrapper } from './QuestionWrapper';

// Individual question type components
export { default as MCQQuestion } from './MCQQuestion';
export { default as MatchingQuestion } from './MatchingQuestion';
export { default as TrueFalseQuestion } from './TrueFalseQuestion';
export { default as FillInTheBlankQuestion } from './FillInTheBlankQuestion';
export { default as OrderingQuestion } from './OrderingQuestion';

// Re-export utilities for convenience
export { 
  normalizeQuestion, 
  normalizeQuestions, 
  validateNormalizedQuestion 
} from '../../utils/questionNormalizer';

export { 
  normalizeAnswer, 
  normalizeQuizAnswers,
  extractOptionLetter,
  normalizeTrueFalseAnswer,
  normalizeFillBlankAnswers
} from '../../utils/answerNormalization';
