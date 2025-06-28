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

  // Convert ladder_steps data to the format expected by the component
  const convertLadderDataToGameFormat = (question) => {
    console.log('🔄 Converting question:', question);
    
    if (!question?.ladder_steps) {
      console.warn('❌ No ladder_steps found in question:', question);
      return null;
    }

    let ladder_steps;
    
    // Handle ladder_steps as string or object
    if (typeof question.ladder_steps === 'string') {
      try {
        ladder_steps = JSON.parse(question.ladder_steps);
      } catch (e) {
        console.error('❌ Failed to parse ladder_steps string:', question.ladder_steps);
        return null;
      }
    } else {
      ladder_steps = question.ladder_steps;
    }

    console.log('📊 Parsed ladder steps data:', ladder_steps);
    
    // Handle code analysis type questions (NEW FORMAT)
    if (ladder_steps.type === 'code_analysis') {
      // Combine question text with code snippet for display in the question box
      let combinedQuestion = ladder_steps.question;
      if (ladder_steps.code_snippet) {
        combinedQuestion += `\n\n${ladder_steps.code_snippet}`;
      }
      
      // Shuffle options and update correct answer
      const originalOptions = ladder_steps.options || [];
      const originalCorrectAnswer = ladder_steps.correct_answer;
      
      // Find the correct option text
      const correctOptionText = originalOptions.find(option => 
        option.startsWith(originalCorrectAnswer + ')')
      );
      
      // Create array of options without letters
      const optionsWithoutLetters = originalOptions.map(option => ({
        originalLetter: option.match(/^([A-D])\)/)?.[1],
        text: option.replace(/^[A-D]\)\s*/, ''),
        isCorrect: option.startsWith(originalCorrectAnswer + ')')
      }));
      
      // Shuffle the options
      const shuffledOptions = [...optionsWithoutLetters].sort(() => Math.random() - 0.5);
      
      // Reassign letters A, B, C, D and find new correct answer
      const finalOptions = shuffledOptions.map((option, index) => {
        const newLetter = String.fromCharCode(65 + index); // A, B, C, D
        return `${newLetter}) ${option.text}`;
      });
      
      // Find which letter the correct answer is now
      const newCorrectAnswer = shuffledOptions.findIndex(option => option.isCorrect);
      const finalCorrectAnswer = String.fromCharCode(65 + newCorrectAnswer);
      
      console.log('🔀 Shuffled options:', {
        original: originalOptions,
        shuffled: finalOptions,
        originalCorrect: originalCorrectAnswer,
        newCorrect: finalCorrectAnswer
      });
      
      const converted = {
        id: question.id || Math.random(),
        type: 'mcq',
        question: combinedQuestion, // Include code in the question text
        code_snippet: null, // Don't show code separately since it's in question
        options: finalOptions,
        correctAnswer: finalCorrectAnswer,
        hint: ladder_steps.explanation || `This question tests: ${ladder_steps.question_type || 'code understanding'}`,
        ladder_data: ladder_steps,
        question_type: ladder_steps.question_type || 'analysis',
        concepts: ladder_steps.concepts || ['programming']
      };
      
      console.log('✅ Converted code analysis question:', converted);
      return converted;
    }
    
    // Handle legacy programming type questions (debugging)
    if (ladder_steps.type === 'programming') {
      const converted = {
        id: question.id || Math.random(),
        type: 'mcq',
        question: `What is wrong with this code?\n\n${ladder_steps.buggyCode}`,
        code_snippet: ladder_steps.buggyCode,
        options: [
          'A) Syntax error in function definition',
          'B) Missing import statement', 
          'C) Incorrect variable name',
          'D) Wrong function call'
        ],
        correctAnswer: 'A',
        hint: ladder_steps.codeHints?.[0] || 'Look for syntax errors in the code',
        ladder_data: ladder_steps,
        question_type: 'debugging',
        concepts: ['programming', 'debugging']
      };
      
      console.log('✅ Converted programming debug question:', converted);
      return converted;
    }
    
    // Handle legacy word ladder format (convert to programming question)
    const { startWord, endWord, steps, hints } = ladder_steps;
    if (startWord && endWord) {
      const converted = {
        id: question.id || Math.random(),
        type: 'mcq',
        question: `In programming, what concept relates to transforming "${startWord}" to "${endWord}"?`,
        options: [
          'A) Data transformation',
          'B) Algorithm design',
          'C) Problem solving',
          'D) Code optimization'
        ],
        correctAnswer: 'A',
        hint: `Think about how data flows and changes in programming`,
        ladder_data: ladder_steps,
        question_type: 'concept',
        concepts: ['programming', 'concepts']
      };
      
      console.log('✅ Converted legacy word ladder to programming concept:', converted);
      return converted;
    }

    console.warn('❌ Unknown ladder_steps format:', ladder_steps);
    return null;
  };

  // Get the number of questions from gameData
  const numQuestions = gameData?.questions?.length || gameData?.metadata?.totalQuestions || gameData?.game_options?.numQuestions || 5;
  
  // Use actual game data instead of hardcoded content
  const useActualGameData = gameData?.questions && gameData.questions.length > 0;
  
  // Memoize questions to prevent re-shuffling on every render
  const questions = React.useMemo(() => {
    if (useActualGameData) {
      console.log('🎮 Using actual game data for Word Ladder');
      console.log('📊 Full gameData:', gameData);
      console.log('📊 First question ladder_steps:', gameData.questions[0]?.ladder_steps);
      console.log('📊 First question full object:', gameData.questions[0]);
      
      // Convert each question's ladder_steps to the expected format
      const convertedQuestions = gameData.questions.map(question => convertLadderDataToGameFormat(question)).filter(Boolean);
      console.log('🔄 Converted ladder content (one-time):', convertedQuestions);
      
      // NO FALLBACKS - Let it fail if conversion doesn't work
      if (convertedQuestions.length === 0) {
        console.error('❌ CONVERSION FAILED: No questions converted successfully');
        console.error('❌ Raw gameData.questions:', gameData.questions);
        throw new Error('Failed to convert any questions - check conversion logic');
      }
      
      return convertedQuestions;
    } else {
      console.error('❌ NO GAME DATA: useActualGameData is false');
      throw new Error('No game data available - check data loading');
    }
  }, [gameData, useActualGameData]); // Only recalculate if gameData changes

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

    // Move to next question after a longer delay to show feedback
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 3000); // Increased from 1500ms to 3000ms to show correct answer
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
        // Extract letter from the clicked option (e.g., "A) Text..." -> "A")
        const selectedLetter = answer.match(/^([A-D])\)/)?.[1];
        isCorrect = selectedLetter === question.correctAnswer;
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
            {question.options.map((option, index) => {
              let buttonClass = 'option-btn';
              
              if (isAnswered) {
                // Extract letter from option (e.g., "A) Text..." -> "A")
                const optionLetter = option.match(/^([A-D])\)/)?.[1];
                
                // Always highlight the correct answer in green
                if (optionLetter === question.correctAnswer) {
                  buttonClass += ' correct';
                }
                // Also highlight the user's wrong answer in red (if different from correct)
                else if (option === userAnswer?.answer && !userAnswer?.isCorrect) {
                  buttonClass += ' incorrect';
                }
                // All other options remain neutral
                else {
                  buttonClass += ' neutral';
                }
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleSubmit(option)}
                  disabled={isAnswered}
                  className={buttonClass}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <pre className="option-text">{option}</pre>
                </button>
              );
            })}
          </div>
        );

      case 'true_false':
        return (
          <div className="true-false-options">
            {[true, false].map((value) => {
              let buttonClass = 'tf-btn';
              
              if (isAnswered) {
                // Always highlight the correct answer in green
                if (value === question.correctAnswer) {
                  buttonClass += ' correct';
                }
                // Also highlight the user's wrong answer in red (if different from correct)
                else if (value === userAnswer?.answer && !userAnswer?.isCorrect) {
                  buttonClass += ' incorrect';
                }
                // All other options remain neutral
                else {
                  buttonClass += ' neutral';
                }
              }
              
              return (
                <button
                  key={value.toString()}
                  onClick={() => handleSubmit(value)}
                  disabled={isAnswered}
                  className={buttonClass}
                >
                  {value ? '✓ True' : '✗ False'}
                </button>
              );
            })}
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
          <div className="question-text">
            <pre className="question-pre">{question.question}</pre>
          </div>
          
          {renderQuestionContent()}
          
          {/* Show correct answer feedback before moving to next question */}
          {showFeedback && (
            <div className={`feedback ${userAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
              {userAnswer?.isCorrect ? (
                <div className="feedback-correct">
                  🎉 <strong>Correct!</strong>
                </div>
              ) : (
                <div className="feedback-incorrect">
                  ❌ <strong>Wrong answer</strong>
                  <div className="correct-answer-display">
                    ✅ Correct answer: <strong>{question.correctAnswer}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
          
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