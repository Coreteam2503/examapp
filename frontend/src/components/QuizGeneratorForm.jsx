import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCriteriaSelector from './QuizCriteriaSelector';
import { quizGenerationService } from '../services/quizGenerationService';
import { 
  PlayIcon, 
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './QuizGeneratorForm.css';

const QuizGeneratorForm = () => {
  const navigate = useNavigate();
  
  // Form state
  const [criteria, setCriteria] = useState({
    domain: '',
    subject: '',
    source: '',
    difficulty_level: 'Medium',
    game_format: 'traditional',
    num_questions: 10
  });

  // Options state
  const [options, setOptions] = useState({
    domains: [],
    subjects: [],
    sources: [],
    types: [],
    gameFormats: []
  });

  // UI state
  const [loading, setLoading] = useState({
    options: true,
    questionCount: false,
    generating: false
  });
  
  const [errors, setErrors] = useState({});
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [generationResult, setGenerationResult] = useState(null);

  // Game format definitions
  const gameFormats = [
    {
      id: 'traditional',
      name: 'Traditional Quiz',
      description: 'Standard question and answer format',
      icon: '📝'
    },
    {
      id: 'hangman',
      name: 'Hangman',
      description: 'Guess the word letter by letter',
      icon: '🎯'
    },
    {
      id: 'knowledge_tower',
      name: 'Knowledge Tower',
      description: 'Build a tower by answering correctly',
      icon: '🏗️'
    },
    {
      id: 'word_ladder',
      name: 'Word Ladder',
      description: 'Climb the ladder with correct answers',
      icon: '🪜'
    },
    {
      id: 'memory_grid',
      name: 'Memory Grid',
      description: 'Memory-based question challenge',
      icon: '🧩'
    }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: 'Easy', label: 'Easy', description: 'Basic questions' },
    { value: 'Medium', label: 'Medium', description: 'Moderate difficulty' },
    { value: 'Hard', label: 'Hard', description: 'Challenging questions' }
  ];

  // Load initial options
  useEffect(() => {
    loadGenerationOptions();
  }, []);

  // Check available questions when criteria changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailableQuestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [criteria.domain, criteria.subject, criteria.source, criteria.difficulty_level]);

  // Load available options from API
  const loadGenerationOptions = async () => {
    try {
      setLoading(prev => ({ ...prev, options: true }));
      
      const result = await quizGenerationService.getGenerationOptions();
      
      if (result.success) {
        const data = result.data.data;
        setOptions({
          domains: data.domains.map(d => ({ 
            value: d.domain, 
            label: d.domain, 
            count: d.count 
          })),
          subjects: data.subjects.map(s => ({ 
            value: s.subject, 
            label: s.subject, 
            count: s.count 
          })),
          sources: data.sources.map(s => ({ 
            value: s.source, 
            label: s.source, 
            count: s.count 
          })),
          types: data.types.map(t => ({ 
            value: t.type, 
            label: t.type.replace('_', ' '), 
            count: t.count 
          })),
          gameFormats: gameFormats
        });
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error loading generation options:', error);
      setErrors({ general: 'Failed to load generation options' });
    } finally {
      setLoading(prev => ({ ...prev, options: false }));
    }
  };

  // Check how many questions are available for current criteria
  const checkAvailableQuestions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, questionCount: true }));
      
      const filters = {};
      if (criteria.domain) filters.domain = criteria.domain;
      if (criteria.subject) filters.subject = criteria.subject;
      if (criteria.source) filters.source = criteria.source;
      if (criteria.difficulty_level) filters.difficulty_level = criteria.difficulty_level;
      
      const result = await quizGenerationService.getAvailableQuestionCount(filters);
      
      if (result.success) {
        setAvailableQuestions(result.count);
      }
    } catch (error) {
      console.error('Error checking available questions:', error);
    } finally {
      setLoading(prev => ({ ...prev, questionCount: false }));
    }
  }, [criteria.domain, criteria.subject, criteria.source, criteria.difficulty_level]);

  // Handle form field changes
  const handleCriteriaChange = (field, value) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (criteria.num_questions < 1) {
      newErrors.num_questions = 'Number of questions must be at least 1';
    }
    
    if (criteria.num_questions > 50) {
      newErrors.num_questions = 'Number of questions cannot exceed 50';
    }
    
    if (criteria.num_questions > availableQuestions) {
      newErrors.num_questions = `Only ${availableQuestions} questions available for current criteria`;
    }
    
    if (availableQuestions === 0) {
      newErrors.general = 'No questions available for the selected criteria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle quiz generation
  const handleGenerateQuiz = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(prev => ({ ...prev, generating: true }));
      setGenerationResult(null);
      
      const result = await quizGenerationService.generateDynamicQuiz(criteria);
      
      if (result.success) {
        const quiz = result.data.data;
        setGenerationResult({
          success: true,
          quiz: quiz.quiz,
          questionsUsed: quiz.questionsUsed
        });
        
        // Navigate to appropriate game component after a short delay
        setTimeout(() => {
          navigateToGame(quiz.quiz);
        }, 2000);
        
      } else {
        setGenerationResult({
          success: false,
          message: result.message,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setGenerationResult({
        success: false,
        message: 'Failed to generate quiz'
      });
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  // Navigate to appropriate game component
  const navigateToGame = (quiz) => {
    const gameFormat = quiz.game_format || 'traditional';
    
    switch (gameFormat) {
      case 'hangman':
        navigate(`/games/hangman/${quiz.id}`);
        break;
      case 'knowledge_tower':
        navigate(`/games/knowledge-tower/${quiz.id}`);
        break;
      case 'word_ladder':
        navigate(`/games/word-ladder/${quiz.id}`);
        break;
      case 'memory_grid':
        navigate(`/games/memory-grid/${quiz.id}`);
        break;
      default:
        navigate(`/quiz/${quiz.id}`);
    }
  };

  const isFormValid = availableQuestions > 0 && criteria.num_questions <= availableQuestions;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Quiz
        </h2>
        <p className="text-gray-600">
          Create a custom quiz by selecting your preferences below
        </p>
      </div>

      {/* Main form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Criteria Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
              Quiz Criteria
            </h3>
            
            {/* Domain Selector */}
            <QuizCriteriaSelector
              label="Domain"
              options={options.domains}
              value={criteria.domain}
              onChange={(value) => handleCriteriaChange('domain', value)}
              placeholder="All domains"
              loading={loading.options}
              showCount={true}
              error={errors.domain}
            />
            
            {/* Subject Selector */}
            <QuizCriteriaSelector
              label="Subject"
              options={options.subjects.filter(s => 
                !criteria.domain || s.label.includes(criteria.domain)
              )}
              value={criteria.subject}
              onChange={(value) => handleCriteriaChange('subject', value)}
              placeholder="All subjects"
              loading={loading.options}
              showCount={true}
              error={errors.subject}
            />
            
            {/* Source Selector */}
            <QuizCriteriaSelector
              label="Source"
              options={options.sources}
              value={criteria.source}
              onChange={(value) => handleCriteriaChange('source', value)}
              placeholder="All sources"
              loading={loading.options}
              showCount={true}
              error={errors.source}
            />
            
            {/* Difficulty Level */}
            <QuizCriteriaSelector
              label="Difficulty Level"
              options={difficultyLevels}
              value={criteria.difficulty_level}
              onChange={(value) => handleCriteriaChange('difficulty_level', value)}
              placeholder="Select difficulty"
              searchable={false}
              clearable={false}
              error={errors.difficulty_level}
            />
          </div>

          {/* Game Format & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlayIcon className="w-5 h-5 mr-2" />
              Game Format
            </h3>
            
            {/* Game Format Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Choose Game Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                {gameFormats.map((format) => (
                  <label
                    key={format.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                               ${criteria.game_format === format.id 
                                 ? 'border-blue-500 bg-blue-50' 
                                 : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <input
                      type="radio"
                      name="game_format"
                      value={format.id}
                      checked={criteria.game_format === format.id}
                      onChange={(e) => handleCriteriaChange('game_format', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{format.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{format.name}</div>
                      <div className="text-sm text-gray-600">{format.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={criteria.num_questions}
                onChange={(e) => handleCriteriaChange('num_questions', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.num_questions && (
                <p className="mt-1 text-sm text-red-600">{errors.num_questions}</p>
              )}
            </div>
          </div>
        </div>

        {/* Question Availability */}
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Available Questions
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {loading.questionCount ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <span className={`text-sm font-semibold ${
                  availableQuestions >= criteria.num_questions ? 'text-green-600' : 'text-red-600'
                }`}>
                  {availableQuestions} questions
                </span>
              )}
            </div>
          </div>
          
          {availableQuestions < criteria.num_questions && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Not enough questions available. Please adjust your criteria or reduce the number of questions.
              </p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.general && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="mt-1 text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        {/* Generation Result */}
        {generationResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            generationResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`font-medium ${
              generationResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {generationResult.success ? '✅ Quiz Generated Successfully!' : '❌ Generation Failed'}
            </div>
            <div className={`text-sm mt-1 ${
              generationResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {generationResult.success 
                ? `Generated quiz with ${generationResult.questionsUsed} questions. Redirecting to game...`
                : generationResult.message
              }
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGenerateQuiz}
            disabled={!isFormValid || loading.generating}
            className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isFormValid && !loading.generating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading.generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGeneratorForm;
