import React, { useState } from 'react';
import { QuestionWrapper } from '../questions';
import { getAllQuestionTypesMock, getMockGameData } from '../../data/mockDataHelper';
import './QuestionTester.css';

/**
 * Development Component for Testing Universal Question System
 * Shows all question types working with QuestionWrapper
 */
const QuestionTester = () => {
  const [currentTestSet, setCurrentTestSet] = useState('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  // Get test data based on current test set
  const getTestData = () => {
    switch (currentTestSet) {
      case 'mcq':
        return getMockGameData(['mcq'], 3);
      case 'true_false':
        return getMockGameData(['true_false'], 3);
      case 'matching':
        return getMockGameData(['matching'], 3);
      case 'fill_blank':
        return getMockGameData(['fill_blank'], 3);
      case 'ordering':
        return getMockGameData(['ordering'], 3);
      case 'all':
      default:
        return getAllQuestionTypesMock(1);
    }
  };

  const testData = getTestData();
  const currentQuestion = testData.questions[currentQuestionIndex];
  const totalQuestions = testData.questions.length;

  const handleAnswer = (answer, metadata) => {
    console.log('🧪 Test Answer:', { answer, metadata, question: currentQuestion });
    
    const answerRecord = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion,
      userAnswer: answer,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    setAnswers(prev => [...prev, answerRecord]);
    
    // Move to next question after brief delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        alert('Test complete! Check console for results.');
        console.log('🧪 All Test Results:', answers);
      }
    }, 1000);
  };

  const resetTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  const changeTestSet = (newTestSet) => {
    setCurrentTestSet(newTestSet);
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  if (!currentQuestion) {
    return (
      <div className="question-tester">
        <h2>🧪 Question Type Tester</h2>
        <p>No questions available for testing.</p>
      </div>
    );
  }

  return (
    <div className="question-tester">
      <div className="tester-header">
        <h2>🧪 Universal Question System Tester</h2>
        <p>Test all question types with QuestionWrapper component</p>
        
        <div className="test-controls">
          <div className="test-set-selector">
            <label>Test Set:</label>
            <select value={currentTestSet} onChange={(e) => changeTestSet(e.target.value)}>
              <option value="all">All Question Types</option>
              <option value="mcq">Multiple Choice Only</option>
              <option value="true_false">True/False Only</option>
              <option value="matching">Matching Only</option>
              <option value="fill_blank">Fill Blank Only</option>
              <option value="ordering">Ordering Only</option>
            </select>
          </div>
          
          <button onClick={resetTest} className="reset-btn">
            🔄 Reset Test
          </button>
        </div>
        
        <div className="test-progress">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>Type: <strong>{currentQuestion.type}</strong></span>
          <span>Answered: {answers.length}</span>
        </div>
      </div>

      <div className="test-content">
        <div className="question-info">
          <h3>Testing: {currentQuestion.type.toUpperCase()} Question</h3>
          <div className="question-meta">
            <span>ID: {currentQuestion.id}</span>
            <span>Category: {currentQuestion.category}</span>
            <span>Difficulty: {currentQuestion.difficulty}</span>
          </div>
        </div>

        <div className="question-wrapper-test">
          <QuestionWrapper
            question={currentQuestion}
            onAnswer={handleAnswer}
            gameMode="test"
            className="test-question"
          />
        </div>

        {currentQuestion.explanation && (
          <div className="question-explanation">
            <strong>Expected Answer:</strong> {JSON.stringify(currentQuestion.correct_answer)}<br/>
            <strong>Explanation:</strong> {currentQuestion.explanation}
          </div>
        )}
      </div>

      <div className="test-results">
        <h4>Recent Answers:</h4>
        <div className="answers-list">
          {answers.slice(-3).map((answer, index) => (
            <div key={index} className="answer-item">
              <span className="answer-type">{answer.question.type}</span>
              <span className="answer-value">{JSON.stringify(answer.userAnswer)}</span>
              <span className="answer-time">{new Date(answer.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionTester;
