import React, { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { questionService } from '../services/questionService';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import './QuestionBankForm.css';

const QuestionBankForm = ({ onQuestionCreated }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [questionPreview, setQuestionPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showExamples, setShowExamples] = useState(false);

  // Debounced validation
  const validateJson = useCallback(
    debounce((jsonString) => {
      setIsValidating(true);
      setParseErrors([]);
      setValidationErrors([]);
      setQuestionPreview(null);

      if (!jsonString.trim()) {
        setIsValidating(false);
        return;
      }

      try {
        const parsed = JSON.parse(jsonString);
        
        // Check if it's an array of questions
        if (!Array.isArray(parsed)) {
          setParseErrors([{
            line: 1,
            message: 'Input must be an array of questions'
          }]);
          setIsValidating(false);
          return;
        }

        // Basic validation of question structure
        const errors = [];
        const preview = {
          totalQuestions: parsed.length,
          byType: {},
          byDifficulty: {}
        };

        parsed.forEach((question, index) => {
          const lineNum = index + 1;
          
          // Required fields validation
          if (!question.question_text) {
            errors.push({
              line: lineNum,
              field: 'question_text',
              message: `Question ${index + 1}: question_text is required`
            });
          }
          
          if (!question.type) {
            errors.push({
              line: lineNum,
              field: 'type',
              message: `Question ${index + 1}: type is required`
            });
          } else {
            preview.byType[question.type] = (preview.byType[question.type] || 0) + 1;
          }
          
          if (!question.question_number) {
            errors.push({
              line: lineNum,
              field: 'question_number',
              message: `Question ${index + 1}: question_number is required`
            });
          }

          // Count by difficulty
          const difficulty = question.difficulty_level || question.difficulty || 'Medium';
          preview.byDifficulty[difficulty] = (preview.byDifficulty[difficulty] || 0) + 1;
        });

        setValidationErrors(errors);
        setQuestionPreview(preview);
        
      } catch (error) {
        setParseErrors([{
          line: getJsonErrorLine(error.message, jsonString),
          message: `JSON Parse Error: ${error.message}`
        }]);
      }
      
      setIsValidating(false);
    }, 500),
    []
  );

  // Effect to trigger validation when input changes
  useEffect(() => {
    validateJson(jsonInput);
  }, [jsonInput, validateJson]);

  const handleSubmit = async () => {
    if (validationErrors.length > 0 || parseErrors.length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitResult(null);

      const questions = JSON.parse(jsonInput);
      const result = await questionService.bulkCreate(questions);

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.data.message,
          count: result.data.data.count
        });
        setJsonInput(''); // Clear the form on success
        
        // Notify parent component about successful creation
        if (onQuestionCreated) {
          onQuestionCreated();
        }
      } else {
        setSubmitResult({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Failed to create questions',
        errors: [error.message]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const jumpToLine = (lineNumber) => {
    // This would need CodeMirror instance ref for full implementation
    console.log(`Jump to line ${lineNumber}`);
  };

  const insertExample = (exampleType) => {
    const example = getExampleTemplate(exampleType);
    setJsonInput(JSON.stringify(example, null, 2));
    setShowExamples(false);
  };

  const hasErrors = validationErrors.length > 0 || parseErrors.length > 0;
  const canSubmit = jsonInput.trim() && !hasErrors && !isValidating && !isSubmitting;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Question Bank Creation
        </h2>
        <p className="text-gray-600 mb-6">
          Create multiple questions at once using JSON format. Use the examples below 
          to understand the required structure.
        </p>

        {/* Example Templates Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            {showExamples ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
            <span>Example Templates</span>
          </button>
          
          {showExamples && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exampleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => insertExample(type.id)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 
                           hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{type.name}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* JSON Editor */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Questions JSON
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <CodeMirror
              value={jsonInput}
              onChange={(value) => setJsonInput(value)}
              extensions={[json()]}
              theme={oneDark}
              height="400px"
              placeholder="Enter your questions as a JSON array..."
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: false,
                allowMultipleSelections: false
              }}
            />
          </div>
        </div>

        {/* Validation Status */}
        {isValidating && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800">Validating JSON...</span>
            </div>
          </div>
        )}

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">JSON Parse Errors</h4>
            <div className="space-y-1">
              {parseErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-red-700 text-sm">
                    Line {error.line}: {error.message}
                  </span>
                  <button
                    onClick={() => jumpToLine(error.line)}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Jump to line
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">
              Validation Errors ({validationErrors.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-yellow-700 text-sm">
                    Question {error.line}: {error.message}
                  </span>
                  <button
                    onClick={() => jumpToLine(error.line)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm underline"
                  >
                    Jump
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Preview */}
        {questionPreview && !hasErrors && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">
              Preview ({questionPreview.totalQuestions} questions)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-1">By Type:</h5>
                <div className="space-y-1">
                  {Object.entries(questionPreview.byType).map(([type, count]) => (
                    <div key={type} className="text-sm text-green-600">
                      {type}: {count}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-1">By Difficulty:</h5>
                <div className="space-y-1">
                  {Object.entries(questionPreview.byDifficulty).map(([difficulty, count]) => (
                    <div key={difficulty} className="text-sm text-green-600">
                      {difficulty}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Result */}
        {submitResult && (
          <div className={`mb-4 p-4 rounded-lg border ${
            submitResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`font-medium ${
              submitResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {submitResult.success ? '✅ Success!' : '❌ Error'}
            </div>
            <div className={`text-sm mt-1 ${
              submitResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {submitResult.message}
            </div>
            {submitResult.errors && (
              <div className="mt-2 text-sm text-red-700">
                {submitResult.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canSubmit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Questions...
              </div>
            ) : (
              'Create Questions'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper function to extract line number from JSON error
function getJsonErrorLine(errorMessage, jsonString) {
  const match = errorMessage.match(/at position (\d+)/);
  if (match) {
    const position = parseInt(match[1]);
    const lines = jsonString.substring(0, position).split('\n');
    return lines.length;
  }
  return 1;
}

// Example question types for templates
const exampleTypes = [
  {
    id: 'multiple_choice',
    name: 'Multiple Choice',
    description: 'Questions with multiple options'
  },
  {
    id: 'true_false',
    name: 'True/False',
    description: 'Binary choice questions'
  },
  {
    id: 'fill_blank',
    name: 'Fill in the Blank',
    description: 'Questions with missing words'
  },
  {
    id: 'matching',
    name: 'Matching',
    description: 'Match pairs of related items'
  },
  {
    id: 'mixed',
    name: 'Mixed Example',
    description: 'Sample of different question types'
  }
];

// Function to get example templates
function getExampleTemplate(type) {
  const baseQuestion = {
    domain: "Computer Science",
    subject: "Programming",
    source: "Custom",
    difficulty_level: "Medium",
    difficulty: "medium",
    weightage: 1,
    explanation: "This is an example question for demonstration purposes.",
    hint: "Read the question carefully and choose the best answer."
  };

  const templates = {
    multiple_choice: [
      {
        ...baseQuestion,
        question_number: 1,
        type: "multiple_choice",
        question_text: "What is the correct way to declare a variable in JavaScript?",
        options: "A) var name = 'John'\nB) variable name = 'John'\nC) v name = 'John'\nD) declare name = 'John'",
        correct_answer: "A"
      }
    ],
    true_false: [
      {
        ...baseQuestion,
        question_number: 1,
        type: "true_false",
        question_text: "JavaScript is a statically typed programming language.",
        correct_answer: "false"
      }
    ],
    fill_blank: [
      {
        ...baseQuestion,
        question_number: 1,
        type: "fill_blank",
        question_text: "The _____ method is used to add an element to the end of an array in JavaScript.",
        correct_answer: "push"
      }
    ],
    matching: [
      {
        ...baseQuestion,
        question_number: 1,
        type: "matching",
        question_text: "Match the JavaScript methods with their descriptions:",
        pairs: "push|Adds element to end of array\npop|Removes last element from array\nshift|Removes first element from array\nunshift|Adds element to beginning of array"
      }
    ],
    mixed: [
      {
        ...baseQuestion,
        question_number: 1,
        type: "multiple_choice",
        question_text: "Which of the following is NOT a JavaScript data type?",
        options: "A) String\nB) Boolean\nC) Float\nD) Object",
        correct_answer: "C"
      },
      {
        ...baseQuestion,
        question_number: 2,
        type: "true_false",
        question_text: "JavaScript supports automatic memory management.",
        correct_answer: "true"
      },
      {
        ...baseQuestion,
        question_number: 3,
        type: "fill_blank",
        question_text: "The _____ operator is used to check both value and type equality in JavaScript.",
        correct_answer: "==="
      }
    ]
  };

  return templates[type] || [];
}

export default QuestionBankForm;
