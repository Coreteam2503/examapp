import React, { useState, useEffect } from 'react';
import './WordLadderGame.css';

const WordLadderGame = ({ gameData, onGameComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allQuestionsCompleted, setAllQuestionsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showScoreScreen, setShowScoreScreen] = useState(false);
  const [ladderSteps, setLadderSteps] = useState(0);
  const [avatarCharacter, setAvatarCharacter] = useState(Math.random() > 0.5 ? '👦' : '👧');

  // Generate programming-focused questions dynamically
  const generateProgrammingQuestions = () => {
    const programmingQuestions = [
      {
        id: 1,
        type: 'mcq',
        question: 'What will be the output of this Python code?\n\nfor i in range(3):\n    print(i * 2)',
        options: ['0 2 4', '0\n2\n4', '1 2 3', '2 4 6'],
        correctAnswer: '0\n2\n4',
        hint: 'The range(3) function generates numbers 0, 1, 2. Each number is multiplied by 2 and printed on a new line.'
      },
      {
        id: 2,
        type: 'fill_blank',
        question: 'Complete the JavaScript function to reverse a string:\n\nfunction reverseString(str) {\n    return str.______().reverse().join("");\n}',
        correctAnswer: 'split',
        hint: 'To reverse a string in JavaScript, you first need to convert it to an array using the split() method.'
      },
      {
        id: 3,
        type: 'true_false',
        question: 'In Python, the following code will create a shallow copy of a list:\n\nnew_list = old_list[:]',
        correctAnswer: true,
        hint: 'The slice notation [:] creates a shallow copy of the list, copying all elements to a new list object.'
      },
      {
        id: 4,
        type: 'matching',
        question: 'Match the programming concepts with their definitions:',
        pairs: [
          { left: 'Recursion', right: 'Function calling itself' },
          { left: 'Iteration', right: 'Repeating a process' },
          { left: 'Polymorphism', right: 'Same interface, different implementations' }
        ],
        hint: 'These are fundamental programming concepts: Recursion involves self-calling functions, Iteration is about loops, and Polymorphism allows different implementations of the same interface.'
      },
      {
        id: 5,
        type: 'mcq',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 'O(log n)',
        hint: 'Binary search divides the search space in half with each comparison, making it logarithmic in time complexity.'
      }
    ];

    return programmingQuestions;
  };

  const questions = generateProgrammingQuestions();

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && !allQuestionsCompleted && !showScoreScreen) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, allQuestionsCompleted, showScoreScreen]);

  // Check if all questions are completed
  useEffect(() => {
    if (answeredQuestions.length === questions.length && questions.length > 0) {
      setAllQuestionsCompleted(true);
      
      // Check if ALL questions are answered correctly
      const allCorrect = answeredQuestions.every(q => q.isCorrect);
      
      if (allCorrect) {
        // Show congratulations popup only if all answers are correct
        setTimeout(() => {
          setShowCongratulations(true);
        }, 1000);
      } else {
        // Go directly to score screen if any answer is wrong
        setTimeout(() => {
          setShowScoreScreen(true);
          
          const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
          const results = {
            success: false,
            questionsAnswered: answeredQuestions.length,
            totalQuestions: questions.length,
            correctAnswers,
            timeElapsed,
            score: calculateFinalScore(),
            ladderSteps: correctAnswers,
            status: 'Completed'
          };
          
          if (onGameComplete) {
            onGameComplete(results);
          }
        }, 1000);
      }
    }
  }, [answeredQuestions, questions.length]);

  // Show score screen after congratulations
  useEffect(() => {
    if (showCongratulations) {
      setTimeout(() => {
        setShowCongratulations(false);
        setShowScoreScreen(true);
        
        const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
        const results = {
          success: true,
          questionsAnswered: answeredQuestions.length,
          totalQuestions: questions.length,
          correctAnswers,
          timeElapsed,
          score: calculateFinalScore(),
          ladderSteps: correctAnswers,
          status: 'Completed'
        };
        
        if (onGameComplete) {
          onGameComplete(results);
        }
      }, 3000);
    }
  }, [showCongratulations]);

  const calculateFinalScore = () => {
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const accuracy = (correctAnswers / questions.length) * 100;
    const timeBonus = Math.max(0, 50 - Math.floor(timeElapsed / 10));
    return Math.round((accuracy + timeBonus) / 2);
  };

  const handleAnswer = (questionId, answer, isCorrect) => {
    const answerData = {
      questionId,
      answer,
      isCorrect,
      timestamp: Date.now()
    };

    setAnsweredQuestions(prev => [...prev, answerData]);
    
    // Climb ladder if answer is correct
    if (isCorrect) {
      setLadderSteps(prev => prev + 1);
    }

    // Move to next question after a delay, regardless of correctness
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 1500);
  };

  const startGame = () => {
    setGameStarted(true);
    setAnsweredQuestions([]);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
    setAllQuestionsCompleted(false);
    setShowCongratulations(false);
    setShowScoreScreen(false);
  };

  const handleExitQuiz = () => {
    // Show confirmation dialog
    setShowExitConfirmation(true);
  };

  const confirmExitQuiz = () => {
    // Direct navigation to score screen after confirmation
    setShowExitConfirmation(false);
    setShowScoreScreen(true);
    
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const results = {
      success: false,
      questionsAnswered: answeredQuestions.length,
      totalQuestions: questions.length,
      correctAnswers,
      timeElapsed,
      score: calculateFinalScore(),
      ladderSteps: correctAnswers,
      status: 'Challenge in progress'
    };
    
    if (onGameComplete) {
      onGameComplete(results);
    }
  };

  const cancelExitQuiz = () => {
    setShowExitConfirmation(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetGame = () => {
    setAnsweredQuestions([]);
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
    setAllQuestionsCompleted(false);
    setShowCongratulations(false);
    setShowScoreScreen(false);
    setLadderSteps(0);
    setAvatarCharacter(Math.random() > 0.5 ? '👦' : '👧'); // New avatar for new game
  };

  if (!gameStarted) {
    return (
      <div className="word-ladder-container">
        <div className="game-intro">
          <div className="game-icon">🪜</div>
          <h2>Programming Ladder Challenge</h2>
          <div className="game-rules">
            <h3>How to Play:</h3>
            <ul>
              <li>• Answer programming questions one by one</li>
              <li>• Get all questions correct to climb the ladder</li>
              <li>• Complete all challenges to reach the top!</li>
            </ul>
          </div>
          <div className="game-stats-preview">
            <div className="stat-preview">
              <span className="stat-number">{questions.length}</span>
              <span className="stat-text">Coding Challenges</span>
            </div>
            <div className="trophy-icon">👨‍💻</div>
          </div>
          <button className="start-game-btn" onClick={startGame}>
            Start Coding Challenge 🚀
          </button>
        </div>
      </div>
    );
  }

  if (showCongratulations) {
    return (
      <div className="word-ladder-container">
        <div className="congratulations-popup">
          <div className="congrats-content">
            <div className="congrats-icon">🎉</div>
            <h1>Congratulations!</h1>
            <p>You have successfully climbed the ladder! 🪜</p>
            <button className="exit-quiz-popup-btn" onClick={handleExitQuiz}>
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showScoreScreen) {
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const finalScore = calculateFinalScore();
    
    return (
      <div className="word-ladder-container">
        <div className="score-screen">
          <div className="score-header">
            <div className="game-icon">🪜</div>
            <h2>Word Ladder Results</h2>
          </div>
          
          <div className="score-stats">
            <div className="stat-item">
              <div className="stat-value">{finalScore}%</div>
              <div className="stat-label">Final Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{correctAnswers}/{questions.length}</div>
              <div className="stat-label">Words Guessed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatTime(timeElapsed)}</div>
              <div className="stat-label">Time Taken</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{ladderSteps}/{questions.length}</div>
              <div className="stat-label">Highest Step</div>
            </div>
          </div>

          <div className="ladder-details">
            <div className="ladder-details-header">
              <div className="ladder-icon">🪜</div>
              <span>Ladder Details</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ladder Status:</span>
              <span className="detail-value">{allQuestionsCompleted && correctAnswers === questions.length ? 'Completed successfully!' : 'Challenge in progress'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Best Steps:</span>
              <span className="detail-value">Step {ladderSteps} of {questions.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Note:</span>
              <span className="detail-value">{allQuestionsCompleted && correctAnswers === questions.length ? 'Congratulations! You climbed the entire ladder!' : 'You exited the word ladder challenge early, but your progress was saved!'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Performance:</span>
              <span className="detail-value performance-icon">👍 {finalScore >= 80 ? 'Excellent work!' : finalScore >= 60 ? 'Good effort!' : 'Keep practicing!'}</span>
            </div>
          </div>

          <div className="score-actions">
            <button className="retake-quiz-btn" onClick={resetGame}>
              Retake Quiz
            </button>
            <button className="refresh-scores-btn" onClick={() => window.location.reload()}>
              🔄 Refresh Scores & Return
            </button>
            <button className="done-btn" onClick={() => window.location.href = '/dashboard'}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentQuestionAnswered = answeredQuestions.some(a => a.questionId === currentQuestion?.id);

  return (
    <div className="word-ladder-container">
      {/* Header */}
      <div className="game-header">
        <div className="game-info">
          <div className="game-title">
            <div className="game-icon">🪜</div>
            <div>
              <h2>Programming Ladder</h2>
              <div className="progress-text">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>
          
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Time:</span>
              <span className="stat-value">{formatTime(timeElapsed)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Correct:</span>
              <span className="stat-value">{answeredQuestions.filter(q => q.isCorrect).length}</span>
            </div>
          </div>
          
          <div className="game-actions">
            <button className="exit-game-btn" onClick={handleExitQuiz}>
              Exit Quiz
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Game Layout with Large Ladder */}
      <div className="game-layout">
        {/* Single Large Ladder with Climbing Animation */}
        <div className="single-ladder">
          <div className="ladder-container">
            {/* Ladder steps from top to bottom */}
            {Array.from({ length: questions.length }, (_, index) => {
              const stepNumber = questions.length - index;
              const isClimbed = ladderSteps >= stepNumber;
              const hasCharacter = ladderSteps === stepNumber;
              
              return (
                <div key={stepNumber} className={`ladder-rung ${isClimbed ? 'climbed' : ''}`}>
                  <div className="step-number">{stepNumber}</div>
                  <div className="ladder-rail">═════════</div>
                  {hasCharacter && (
                    <div className="climbing-character">
                      {avatarCharacter}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Character at bottom when no steps climbed */}
            {ladderSteps === 0 && (
              <div className="character-at-bottom">
                <div className="character-avatar">
                  {avatarCharacter}
                </div>
                <div className="character-status">Ready to climb!</div>
              </div>
            )}
          </div>
          
          <div className="ladder-info">
            <div className="ladder-title">Climbing Progress</div>
            <div className="progress-text">Step {ladderSteps} of {questions.length}</div>
          </div>
        </div>

        {/* Current Question */}
        <div className="question-section">
          {currentQuestion && (
            <QuestionCard
              questionNumber={currentQuestionIndex + 1}
              question={currentQuestion}
              isAnswered={isCurrentQuestionAnswered}
              onAnswer={(answer, isCorrect) => handleAnswer(currentQuestion.id, answer, isCorrect)}
              userAnswer={answeredQuestions.find(a => a.questionId === currentQuestion.id)}
            />
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="exit-confirmation-overlay">
          <div className="exit-confirmation-dialog">
            <div className="exit-confirmation-content">
              <h3>🚨 Exit Word Ladder Challenge?</h3>
              <p>Are you sure you want to exit the Word Ladder game?</p>
              
              <div className="current-progress">
                <h4>Current Progress:</h4>
                <ul>
                  <li>Steps taken: {ladderSteps}/{questions.length}</li>
                  <li>Questions answered: {answeredQuestions.length}</li>
                  <li>Time elapsed: {formatTime(timeElapsed)}</li>
                  <li>Current word: {currentQuestion ? 'CODE' : 'N/A'}</li>
                </ul>
                
                <div className="progress-warning">
                  ⚠️ Your progress will be saved, but the quiz will be marked as incomplete.
                </div>
              </div>
              
              <div className="exit-confirmation-actions">
                <button className="exit-cancel-btn" onClick={cancelExitQuiz}>
                  ❌ Cancel
                </button>
                <button className="exit-confirm-btn" onClick={confirmExitQuiz}>
                  📊 Exit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ questionNumber, question, isAnswered, onAnswer, userAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = (answer) => {
    if (isAnswered) return;

    let isCorrect = false;
    
    switch (question.type) {
      case 'mcq':
        isCorrect = answer === question.correctAnswer;
        break;
      case 'true_false':
        isCorrect = answer === question.correctAnswer;
        break;
      case 'fill_blank':
        isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
        break;
      case 'matching':
        isCorrect = JSON.stringify(answer) === JSON.stringify(question.pairs);
        break;
    }
    
    setShowFeedback(true);
    onAnswer(answer, isCorrect);
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="mcq-options">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(option)}
                disabled={isAnswered}
                className={`option-btn ${
                  isAnswered
                    ? option === question.correctAnswer
                      ? 'correct'
                      : option === userAnswer?.answer && !userAnswer?.isCorrect
                      ? 'incorrect'
                      : 'neutral'
                    : ''
                }`}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                <pre className="option-text">{option}</pre>
              </button>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="true-false-options">
            {[true, false].map((value) => (
              <button
                key={value.toString()}
                onClick={() => handleSubmit(value)}
                disabled={isAnswered}
                className={`tf-btn ${
                  isAnswered
                    ? value === question.correctAnswer
                      ? 'correct'
                      : value === userAnswer?.answer && !userAnswer?.isCorrect
                      ? 'incorrect'
                      : 'neutral'
                    : ''
                }`}
              >
                {value ? '✓ True' : '✗ False'}
              </button>
            ))}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="fill-blank-section">
            <input
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer..."
              className="fill-blank-input"
            />
            {!isAnswered && (
              <button
                onClick={() => selectedAnswer.trim() && handleSubmit(selectedAnswer)}
                disabled={!selectedAnswer.trim()}
                className="submit-btn"
              >
                Submit Answer
              </button>
            )}
            {isAnswered && (
              <div className={`answer-feedback ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
                Your answer: <strong>{userAnswer?.answer}</strong>
                {!userAnswer?.isCorrect && (
                  <div className="correct-answer">Correct answer: <strong>{question.correctAnswer}</strong></div>
                )}
              </div>
            )}
          </div>
        );

      case 'matching':
        return <MatchingQuestion question={question} onAnswer={handleSubmit} isAnswered={isAnswered} />;

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="question-card current">
      <div className="question-content">
        <div className="question-number current">
          {questionNumber}
        </div>
        
        <div className="question-body">
          <h3 className="question-text">
            <pre className="question-pre">{question.question}</pre>
          </h3>
          
          {renderQuestionContent()}
          
          {/* Hint displayed below question and options */}
          <div className="hint-with-question">
            <div className="hint-header">
              <div className="hint-icon">💡</div>
              <span>Hint</span>
            </div>
            <div className="hint-content">
              <p>{question.hint}</p>
            </div>
          </div>
          
          {showFeedback && (
            <div className={`feedback ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
              {userAnswer?.isCorrect ? '🎉 Correct!' : '❌ Wrong answer'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchingQuestion = ({ question, onAnswer, isAnswered }) => {
  const [matches, setMatches] = useState({});
  const [availableRights, setAvailableRights] = useState(question.pairs.map(p => p.right));

  const handleMatch = (leftItem, rightItem) => {
    if (isAnswered) return;
    
    const prevMatch = matches[leftItem];
    if (prevMatch) {
      setAvailableRights(prev => [...prev, prevMatch].sort());
    }
    
    setMatches(prev => ({ ...prev, [leftItem]: rightItem }));
    setAvailableRights(prev => prev.filter(item => item !== rightItem));
    
    const newMatches = { ...matches, [leftItem]: rightItem };
    if (Object.keys(newMatches).length === question.pairs.length) {
      const answer = question.pairs.map(pair => ({
        left: pair.left,
        right: newMatches[pair.left]
      }));
      onAnswer(answer);
    }
  };

  return (
    <div className="matching-section">
      <div className="matching-left">
        <h4 className="matching-title">Match these concepts:</h4>
        {question.pairs.map((pair, index) => (
          <div
            key={index}
            className={`matching-item ${matches[pair.left] ? 'matched' : ''}`}
          >
            {pair.left}
            {matches[pair.left] && (
              <span className="match-indicator">→ {matches[pair.left]}</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="matching-right">
        <h4 className="matching-title">With these definitions:</h4>
        {availableRights.map((rightItem, index) => (
          <button
            key={index}
            onClick={() => {
              const unmatched = question.pairs.find(pair => !matches[pair.left]);
              if (unmatched) {
                handleMatch(unmatched.left, rightItem);
              }
            }}
            disabled={isAnswered}
            className="matching-option"
          >
            {rightItem}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WordLadderGame;