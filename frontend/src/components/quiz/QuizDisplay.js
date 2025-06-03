import React, { useState, useEffect } from 'react';
import './QuizDisplay.css';
import './MobileResponsive.css';
import './MobileQuestionTypes.css';
import './MobileTouchInteractions.css';
import './QuizThemeOverride.css';
import FillInTheBlankQuestion from './questions/FillInTheBlankQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import MatchingQuestion from './questions/MatchingQuestion';

const QuizDisplay = ({ quiz, onQuizComplete, onAnswerChange }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.questions?.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Timer effect
  useEffect(() => {
    let interval;
    if (isStarted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted]);

  // Notify parent component of answer changes
  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange(answers);
    }
  }, [answers, onAnswerChange]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer: answer,
        timeSpent: timeElapsed // You could track per-question time here
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      handleQuizComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizComplete = () => {
    if (onQuizComplete) {
      onQuizComplete({
        answers,
        timeElapsed,
        totalQuestions,
        answeredQuestions: Object.keys(answers).length
      });
    }
  };

  const startQuiz = () => {
    setIsStarted(true);
  };

  const isAnswered = currentQuestion && answers[currentQuestion.id] && (
    (currentQuestion.type === 'fill-in-the-blank' || currentQuestion.type === 'fill_in_the_blank') 
      ? Object.values(answers[currentQuestion.id].answer || {}).some(answer => answer?.trim()) 
      : (currentQuestion.type === 'true-false' || currentQuestion.type === 'true_false')
      ? answers[currentQuestion.id].answer !== undefined && answers[currentQuestion.id].answer !== null
      : currentQuestion.type === 'matching'
      ? Object.keys(answers[currentQuestion.id].answer || {}).length > 0
      : answers[currentQuestion.id].answer !== undefined && answers[currentQuestion.id].answer !== null
  );
  const canProceed = isAnswered || currentQuestionIndex === totalQuestions - 1;

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="quiz-display-container">
        <div className="quiz-empty">
          <h3>No Quiz Available</h3>
          <p>This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="quiz-display-container">
        <div className="quiz-intro">
          <div className="quiz-intro-header">
            <h2>{quiz.title}</h2>
            <div className="quiz-meta">
              <span className="quiz-difficulty">
                Difficulty: <strong>{quiz.difficulty}</strong>
              </span>
              <span className="quiz-questions">
                Questions: <strong>{totalQuestions}</strong>
              </span>
            </div>
          </div>
          
          <div className="quiz-intro-content">
            <h3>Instructions</h3>
            <ul>
              <li>Answer all questions to the best of your ability</li>
              <li>You can navigate between questions using Next/Previous buttons</li>
              <li>Your progress will be saved as you go</li>
              <li>Click "Complete Quiz" when you're done with all questions</li>
            </ul>
          </div>

          <button 
            className="start-quiz-btn"
            onClick={startQuiz}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-display-container">
      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>
        
        <div className="quiz-timer">
          <span>Time: {formatTime(timeElapsed)}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="quiz-content">
        <div className="question-container">
          {/* Only show question header for non-fill-in-the-blank questions */}
          {!(currentQuestion.type === 'fill_in_the_blank' || currentQuestion.type === 'fill-in-the-blank') && (
            <div className="question-header">
              <h3 className="question-text">
                {currentQuestion.question_text}
              </h3>
              
              {currentQuestion.code_snippet && (
                <div className="code-snippet">
                  <pre><code>{currentQuestion.code_snippet}</code></pre>
                </div>
              )}
            </div>
          )}
          
          {/* Show code snippet separately for fill-in-the-blank if it exists */}
          {(currentQuestion.type === 'fill_in_the_blank' || currentQuestion.type === 'fill-in-the-blank') && currentQuestion.code_snippet && (
            <div className="question-header">
              <div className="code-snippet">
                <pre><code>{currentQuestion.code_snippet}</code></pre>
              </div>
            </div>
          )}

          <div className="options-container">
            {currentQuestion.type === 'fill_in_the_blank' || currentQuestion.type === 'fill-in-the-blank' ? (
              <FillInTheBlankQuestion
                question={{
                  ...currentQuestion,
                  text: currentQuestion.formatted_text || currentQuestion.question_text,
                  correctAnswers: currentQuestion.correct_answers_data ? 
                    (typeof currentQuestion.correct_answers_data === 'string' ? 
                      JSON.parse(currentQuestion.correct_answers_data) : 
                      currentQuestion.correct_answers_data) : {}
                }}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
              />
            ) : currentQuestion.type === 'true_false' || currentQuestion.type === 'true-false' ? (
              <TrueFalseQuestion
                question={{
                  ...currentQuestion,
                  correct_answer: currentQuestion.correct_answer === 'True' || currentQuestion.correct_answer === 'true' || currentQuestion.correct_answer === true
                }}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
                userAnswer={answers[currentQuestion.id]?.answer}
              />
            ) : currentQuestion.type === 'matching' ? (
              <MatchingQuestion
                question={currentQuestion}
                onAnswer={(answer) => handleAnswerSelect(answer)}
                disabled={false}
                showCorrect={false}
                userAnswer={answers[currentQuestion.id]?.answer}
              />
            ) : (
              // Multiple choice questions
              currentQuestion.options?.map((option, index) => (
                <div
                  key={index}
                  className={`option ${answers[currentQuestion.id]?.answer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <div className="option-marker">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="option-text">
                    {option.replace(/^[A-D]\)\s*/, '')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button
          className="nav-btn prev-btn"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>

        <div className="answer-status">
          {isAnswered ? (
            <span className="answered">✓ Answered</span>
          ) : (
            <span className="unanswered">Select an answer</span>
          )}
        </div>

        <button
          className="nav-btn next-btn"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Complete Quiz' : 'Next'}
        </button>
      </div>

      {/* Question Overview */}
      <div className="question-overview">
        <h4>Question Overview</h4>
        <div className="question-dots">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              className={`question-dot ${
                index === currentQuestionIndex ? 'current' : ''
              } ${answers[quiz.questions[index].id]?.answer ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;
