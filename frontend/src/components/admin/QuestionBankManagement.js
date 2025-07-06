import React, { useState, useEffect } from 'react';
import QuestionBankForm from '../QuestionBankForm';
import { questionService } from '../../services/questionService';

const QuestionBankManagement = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await questionService.getStatistics();
      
      if (result.success) {
        setStatistics(result.data.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load question bank statistics');
      console.error('Statistics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionCreated = () => {
    // Refresh statistics when new questions are created
    loadStatistics();
  };

  return (
    <div className="question-bank-management">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Question Bank Management
        </h1>
        <p className="text-gray-600">
          Create, manage, and organize your question bank for quizzes and assessments.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Question Bank Statistics
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">Error Loading Statistics</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
            <button 
              onClick={loadStatistics}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Try Again
            </button>
          </div>
        ) : statistics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Questions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.total}
                  </div>
                  <div className="text-gray-600">Total Questions</div>
                </div>
              </div>
            </div>

            {/* By Domain */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-3">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-semibold text-gray-900">Domains</div>
                  <div className="text-gray-600">{statistics.byDomain.length} different</div>
                </div>
              </div>
              <div className="space-y-1">
                {statistics.byDomain.slice(0, 3).map((domain, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate">
                      {domain.domain || 'Unknown'}
                    </span>
                    <span className="text-gray-500 ml-2">{domain.count}</span>
                  </div>
                ))}
                {statistics.byDomain.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{statistics.byDomain.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-3">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-2xl">🔧</span>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-semibold text-gray-900">Types</div>
                  <div className="text-gray-600">{statistics.byType.length} different</div>
                </div>
              </div>
              <div className="space-y-1">
                {statistics.byType.slice(0, 3).map((type, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate">
                      {type.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500 ml-2">{type.count}</span>
                  </div>
                ))}
                {statistics.byType.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{statistics.byType.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* By Difficulty */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-3">
                <div className="p-3 rounded-full bg-orange-100">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-semibold text-gray-900">Difficulty</div>
                  <div className="text-gray-600">Distribution</div>
                </div>
              </div>
              <div className="space-y-1">
                {statistics.byDifficulty.map((difficulty, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {difficulty.difficulty_level || 'Unknown'}
                    </span>
                    <span className="text-gray-500">{difficulty.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Question Bank Form */}
      <QuestionBankForm onQuestionCreated={handleQuestionCreated} />
    </div>
  );
};

export default QuestionBankManagement;
