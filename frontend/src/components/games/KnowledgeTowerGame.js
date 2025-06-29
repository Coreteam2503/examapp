import React, { useState, useEffect } from 'react';
import './KnowledgeTowerGame.css';

const KnowledgeTowerGame = ({ gameData, onGameComplete, onAnswerChange }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [towerHeight, setTowerHeight] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  const questions = gameData?.questions || [];
  const totalLevels = gameData?.metadata?.totalLevels || 5;
  
  // Helper function to get displayable correct answer text
  const getDisplayCorrectAnswer = (question) => {
    if (question.type === 'mcq' && question.options && question.correct_answer) {
      // First try to find exact match with letter prefix
      let correctOption = question.options.find(option => 
        option.startsWith(question.correct_answer + ')')
      );
      
      if (correctOption) {
        return correctOption;
      }
      
      // If no exact match, try to find by content (in case format is wrong)
      correctOption = question.options.find(option => 
        option.toLowerCase().includes(question.correct_answer.toLowerCase()) ||
        question.correct_answer.toLowerCase().includes(option.toLowerCase())
      );
      
      if (correctOption) {
        return correctOption;
      }
      
      // If still no match, check if correct_answer is just the text without letter
      const matchingIndex = question.options.findIndex(option => {
        // Remove letter prefix if it exists and compare
        const optionText = option.replace(/^[A-D]\)\s*/, '');
        return optionText.trim() === question.correct_answer.trim();
      });
      
      if (matchingIndex !== -1) {
        return question.options[matchingIndex];
      }
      
      // Last resort: if correct_answer is a letter, use it to find the option
      if (/^[A-D]$/.test(question.correct_answer)) {
        const letterIndex = question.correct_answer.charCodeAt(0) - 65; // A=0, B=1, etc.
        if (letterIndex >= 0 && letterIndex < question.options.length) {
          return question.options[letterIndex];
        }
      }
      
      // Fallback: return the raw correct_answer
      return question.correct_answer;
    }
    
    if (question.type === 'true_false') {
      return question.correct_answer ? 'True' : 'False';
    }
    
    if (question.type === 'matching') {
      // Format correct matching pairs for display
      const leftItems = question.leftItems || [];
      const rightItems = question.rightItems || [];
      const correctPairs = question.correctPairs || [];
      
      const correctMatches = correctPairs.map(([leftIndex, rightIndex]) => {
        const leftItem = leftItems[leftIndex] || `Item ${leftIndex + 1}`;
        const rightItem = rightItems[rightIndex] || `Option ${rightIndex + 1}`;
        return `${leftItem} → ${rightItem}`;
      });
      
      return correctMatches.join(', ');
    }
    
    return question.correct_answer;
  };

  // Helper function to format selected answer for display
  const getDisplaySelectedAnswer = (selectedAnswer, question) => {
    // Handle null, undefined, or 'No answer' cases
    if (!selectedAnswer || selectedAnswer === 'No answer') {
      return 'No answer';
    }
    
    if (question.type === 'matching' && typeof selectedAnswer === 'object') {
      // Format matching answers as readable text
      const leftItems = question.leftItems || [];
      const rightItems = question.rightItems || [];
      const matches = [];
      
      Object.entries(selectedAnswer).forEach(([leftIndex, rightIndex]) => {
        if (leftIndex !== 'selectedLeft' && rightIndex !== undefined) {
          const leftItem = leftItems[parseInt(leftIndex)] || `Item ${parseInt(leftIndex) + 1}`;
          const rightItem = rightItems[parseInt(rightIndex)] || `Option ${parseInt(rightIndex) + 1}`;
          matches.push(`${leftItem} → ${rightItem}`);
        }
      });
      
      return matches.length > 0 ? matches.join(', ') : 'No matches made';
    }
    
    if (question.type === 'true_false') {
      return selectedAnswer ? 'True' : 'False';
    }
    
    // For MCQ and other types, return as string
    return selectedAnswer?.toString() || 'No answer';
  };
  
  // Initialize shuffled questions on first load
  useEffect(() => {
    if (questions.length > 0 && shuffledQuestions.length === 0) {
      console.log('🔀 Initializing question shuffling and processing...');
      
      const processedQuestions = questions.map(question => {
        // For MCQ questions, shuffle options and update correct answer
        if (question.type === 'mcq' && question.options && Array.isArray(question.options)) {
          console.log('🔀 Shuffling MCQ question:', {
            originalOptions: question.options,
            originalAnswer: question.correct_answer
          });
          
          let processedOptions = [...question.options];
          let processedCorrectAnswer = question.correct_answer;
          
          // Check if options already have letter prefixes
          const hasLetterPrefixes = processedOptions.every(opt => /^[A-D]\)/.test(opt));
          
          if (!hasLetterPrefixes) {
            console.log('🔧 Adding letter prefixes to options before shuffling');
            // Add letter prefixes to options
            processedOptions = processedOptions.map((option, index) => {
              const letter = String.fromCharCode(65 + index); // A, B, C, D
              return `${letter}) ${option}`;
            });
            
            // If correct_answer is the actual text, convert it to letter
            if (!/^[A-D]$/.test(question.correct_answer)) {
              const correctIndex = question.options.findIndex(option => 
                option.toString().trim() === question.correct_answer.toString().trim()
              );
              if (correctIndex !== -1) {
                processedCorrectAnswer = String.fromCharCode(65 + correctIndex);
                console.log(`🔧 Converted answer from "${question.correct_answer}" to "${processedCorrectAnswer}"`);
              }
            }
          }
          
          // Create array of options for shuffling
          const optionsWithoutLetters = processedOptions.map(option => ({
            originalLetter: option.match(/^([A-D])\)/)?.[1],
            text: option.replace(/^[A-D]\)\s*/, ''),
            fullText: option,
            isCorrect: option.startsWith(processedCorrectAnswer + ')') || 
                      option.replace(/^[A-D]\)\s*/, '').trim() === question.correct_answer.toString().trim()
          }));
          
          // IMPORTANT: Proper shuffling using Fisher-Yates algorithm for better randomness
          const shuffledOptions = [...optionsWithoutLetters];
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          // Reassign letters A, B, C, D and find new correct answer
          const finalOptions = shuffledOptions.map((option, index) => {
            const newLetter = String.fromCharCode(65 + index); // A, B, C, D
            return `${newLetter}) ${option.text}`;
          });
          
          // Find which letter the correct answer is now
          const newCorrectAnswerIndex = shuffledOptions.findIndex(option => option.isCorrect);
          const finalCorrectAnswer = String.fromCharCode(65 + newCorrectAnswerIndex);
          
          console.log('✅ MCQ shuffling completed:', {
            finalOptions,
            finalCorrectAnswer,
            originalCorrectAnswer: question.correct_answer
          });
          
          return {
            ...question,
            options: finalOptions,
            correct_answer: finalCorrectAnswer,
            originalCorrectAnswer: question.correct_answer
          };
        }
        
        // For True/False questions, convert string to boolean
        if (question.type === 'true_false') {
          return {
            ...question,
            correct_answer: question.correct_answer === '1' || question.correct_answer === 'true' || question.correct_answer === true
          };
        }
        
        // For Matching questions, parse the items data and shuffle
        if (question.type === 'matching' && question.items) {
          try {
            const matchingData = typeof question.items === 'string' ? JSON.parse(question.items) : question.items;
            const originalLeft = matchingData.left || [];
            const originalRight = matchingData.right || [];
            const originalCorrectPairs = matchingData.correctPairs || [];
            
            console.log('🔀 Shuffling matching question:', {
              originalLeft,
              originalRight,
              originalCorrectPairs
            });
            
            // Shuffle right items (descriptions/answers)
            const rightItemsWithIndex = originalRight.map((item, index) => ({
              item,
              originalIndex: index
            }));
            
            // Shuffle the right items
            const shuffledRightItems = [...rightItemsWithIndex].sort(() => Math.random() - 0.5);
            
            // Create new mapping for correct pairs
            const newCorrectPairs = originalCorrectPairs.map(([leftIndex, rightIndex]) => {
              // Find where the original right item ended up after shuffling
              const newRightIndex = shuffledRightItems.findIndex(item => item.originalIndex === rightIndex);
              return [leftIndex, newRightIndex];
            });
            
            // You can also shuffle left items if desired
            const leftItemsWithIndex = originalLeft.map((item, index) => ({
              item,
              originalIndex: index
            }));
            
            // Shuffle the left items too
            const shuffledLeftItems = [...leftItemsWithIndex].sort(() => Math.random() - 0.5);
            
            // Update correct pairs to account for left item shuffling too
            const finalCorrectPairs = newCorrectPairs.map(([leftIndex, rightIndex]) => {
              const newLeftIndex = shuffledLeftItems.findIndex(item => item.originalIndex === leftIndex);
              return [newLeftIndex, rightIndex];
            });
            
            console.log('✅ Matching question shuffled:', {
              shuffledLeft: shuffledLeftItems.map(item => item.item),
              shuffledRight: shuffledRightItems.map(item => item.item),
              finalCorrectPairs
            });
            
            return {
              ...question,
              leftItems: shuffledLeftItems.map(item => item.item),
              rightItems: shuffledRightItems.map(item => item.item),
              correctPairs: finalCorrectPairs
            };
          } catch (error) {
            console.error('Error parsing matching data:', error);
            return question;
          }
        }
        
        return question;
      });
      
      // Optional: Shuffle question order (uncomment if you want random question order)
      // For Knowledge Tower, you might want to keep progressive order (Level 1, 2, 3...)
      // But if you want random order, uncomment the next 4 lines:
      
      // console.log('🔀 Shuffling question order...');
      // const shuffledQuestionOrder = [...processedQuestions];
      // for (let i = shuffledQuestionOrder.length - 1; i > 0; i--) {
      //   const j = Math.floor(Math.random() * (i + 1));
      //   [shuffledQuestionOrder[i], shuffledQuestionOrder[j]] = [shuffledQuestionOrder[j], shuffledQuestionOrder[i]];
      //   // Update level numbers to maintain 1, 2, 3... sequence
      //   shuffledQuestionOrder[i].level_number = i + 1;
      // }
      // setShuffledQuestions(shuffledQuestionOrder);
      
      setShuffledQuestions(processedQuestions);
    }
  }, [questions, shuffledQuestions.length]);
  
  // Get questions for current level from shuffled questions
  const currentLevelQuestions = shuffledQuestions.filter(q => q.level_number === currentLevel);
  const currentLevelQuestion = currentLevelQuestions[0]; // Assuming one question per level for simplicity

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update tower height based on progress
  useEffect(() => {
    const progress = (currentLevel - 1) / totalLevels;
    setTowerHeight(progress * 100);
  }, [currentLevel, totalLevels]);

  const handleExitGame = () => {
    setShowExitConfirmation(true);
  };

  const confirmExitGame = () => {
    // Calculate final results from current progress
    const finalResults = [...gameResults];
    
    // Add current level result if in progress
    if (!showResult && currentLevel <= totalLevels) {
      const currentResult = {
        level: currentLevel,
        question: currentLevelQuestion?.question || '',
        selectedAnswer: currentLevelQuestion ? getDisplaySelectedAnswer(selectedAnswer || 'No answer', currentLevelQuestion) : 'No answer',
        correctAnswer: currentLevelQuestion ? getDisplayCorrectAnswer(currentLevelQuestion) : '',
        isCorrect: false, // Mark as incomplete
        timeSpent: timeElapsed,
        levelTheme: currentLevelQuestion?.level_theme || 'General',
        incomplete: true
      };
      if (selectedAnswer) {
        finalResults.push(currentResult);
      }
    }
    
    const totalLevelsAttempted = finalResults.length;
    const correctAnswers = finalResults.filter(result => result.isCorrect).length;
    const finalScore = totalLevelsAttempted > 0 ? Math.round((correctAnswers / totalLevelsAttempted) * 100) : 0;
    
    // For debugging: console.log('Knowledge Tower game exited early:', { finalResults, totalLevelsAttempted, correctAnswers, finalScore, timeElapsed });
    
    if (onGameComplete) {
      onGameComplete({
        results: finalResults,
        totalLevels,
        timeElapsed,
        finalLevel: currentLevel,
        completed: false, // Mark as incomplete/exited
        score: finalScore,
        correctAnswers,
        totalQuestions: totalLevelsAttempted,
        exitedEarly: true
      });
    }
  };

  const cancelExitGame = () => {
    setShowExitConfirmation(false);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if ((selectedAnswer === '' || selectedAnswer === null || selectedAnswer === undefined) && selectedAnswer !== false || !currentLevelQuestion) return;

    let isCorrect = false;
    const questionType = currentLevelQuestion.type || 'mcq';
    
    // Handle different question types for validation
    switch (questionType) {
      case 'mcq':
        // For MCQ, compare the selected option with correct answer
        const selectedLetter = selectedAnswer.match(/^([A-D])\)/)?.[1];
        isCorrect = selectedLetter === currentLevelQuestion.correct_answer;
        break;
        
      case 'true_false':
        // For true/false, compare boolean values
        isCorrect = selectedAnswer === currentLevelQuestion.correct_answer;
        break;
        
      case 'matching':
        // For matching, check if user's matches align with correct pairs
        const userMatches = typeof selectedAnswer === 'object' ? selectedAnswer : {};
        const correctPairs = currentLevelQuestion.correctPairs || [];
        
        // Check if all correct pairs are matched correctly
        let correctMatchCount = 0;
        correctPairs.forEach(([leftIndex, rightIndex]) => {
          if (userMatches[leftIndex] === rightIndex) {
            correctMatchCount++;
          }
        });
        
        // Consider correct if most pairs are matched correctly
        isCorrect = correctMatchCount >= Math.ceil(correctPairs.length * 0.7); // 70% threshold
        break;
        
      default:
        // Default to string comparison
        isCorrect = selectedAnswer === currentLevelQuestion.correct_answer;
    }

    const result = {
      level: currentLevel,
      question: currentLevelQuestion.question,
      selectedAnswer: getDisplaySelectedAnswer(selectedAnswer, currentLevelQuestion),
      correctAnswer: getDisplayCorrectAnswer(currentLevelQuestion),
      isCorrect,
      timeSpent: timeElapsed,
      levelTheme: currentLevelQuestion.level_theme || 'General',
      questionType: questionType,
      rawSelectedAnswer: selectedAnswer // Keep raw answer for logic
    };

    setGameResults(prev => [...prev, result]);
    setAnsweredQuestions(prev => ({
      ...prev,
      [currentLevel]: result
    }));

    if (onAnswerChange) {
      onAnswerChange({
        currentLevel,
        result,
        allResults: [...gameResults, result]
      });
    }

    setShowResult(true);
  };

  const nextLevel = () => {
    if (currentLevel < totalLevels) {
      setCurrentLevel(prev => prev + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      // Game complete - show final score
      const finalResults = gameResults;
      const correctAnswers = finalResults.filter(r => r.isCorrect).length;
      const totalQuestions = finalResults.length;
      const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      
      // For debugging: console.log('Game completed:', { finalResults, correctAnswers, totalQuestions, finalScore });
      
      if (onGameComplete) {
        onGameComplete({
          results: finalResults,
          totalLevels,
          timeElapsed,
          finalLevel: currentLevel,
          completed: true,
          score: finalScore,
          correctAnswers,
          totalQuestions
        });
      }
    }
  };

  const restartLevel = () => {
    setSelectedAnswer('');
    setShowResult(false);
    // Remove the answer for this level
    setAnsweredQuestions(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentLevel];
      return newAnswers;
    });
    // Remove from results
    setGameResults(prev => prev.filter(result => result.level !== currentLevel));
  };

  const renderTower = () => {
    const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);
    
    return (
      <div className="tower-container">
        <div className="tower">
          {levels.reverse().map(level => {
            const isCompleted = answeredQuestions[level]?.isCorrect;
            const isFailed = answeredQuestions[level] && !answeredQuestions[level].isCorrect;
            const isCurrent = level === currentLevel;
            const isLocked = level > currentLevel;
            
            return (
              <div 
                key={level}
                className={`tower-level ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => {
                  if (level <= currentLevel && !showResult) {
                    setCurrentLevel(level);
                    setSelectedAnswer('');
                    setShowResult(false);
                  }
                }}
              >
                <div className="level-number">{level}</div>
                <div className="level-status">
                  {isCompleted && '✅'}
                  {isFailed && '❌'}
                  {isCurrent && '👤'}
                  {isLocked && '🔒'}
                </div>
                <div className="level-theme">
                  {questions.find(q => q.level_number === level)?.level_theme || `Level ${level}`}
                </div>
              </div>
            );
          })}
          
          {/* Tower base */}
          <div className="tower-base">
            <div className="base-text">Knowledge Tower</div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="tower-progress">
          <div 
            className="progress-fill"
            style={{ height: `${towerHeight}%` }}
          />
        </div>
      </div>
    );
  };

  const renderQuestionContent = () => {
    if (!currentLevelQuestion) return null;
    
    const questionType = currentLevelQuestion.type || 'mcq';
    
    switch (questionType) {
      case 'mcq':
        const options = currentLevelQuestion.options || [];
        return (
          <div className="mcq-options">
            {options.map((option, index) => {
              let buttonClass = 'option-btn';
              
              if (showResult) {
                // Extract letter from option (e.g., "A) Text..." -> "A")
                const optionLetter = option.match(/^([A-D])\)/)?.[1];
                
                // Always highlight the correct answer in green
                if (optionLetter === currentLevelQuestion.correct_answer) {
                  buttonClass += ' correct';
                }
                // Also highlight the user's wrong answer in red (if different from correct)
                else if (option === selectedAnswer && selectedAnswer !== currentLevelQuestion.correct_answer) {
                  buttonClass += ' incorrect';
                }
                // All other options remain neutral
                else {
                  buttonClass += ' neutral';
                }
              } else if (option === selectedAnswer) {
                buttonClass += ' selected';
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="option-text">{option.replace(/^[A-D]\)\s*/, '')}</span>
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
              
              if (showResult) {
                // Always highlight the correct answer in green
                if (value === currentLevelQuestion.correct_answer) {
                  buttonClass += ' correct';
                }
                // Also highlight the user's wrong answer in red (if different from correct)
                else if (value === selectedAnswer && selectedAnswer !== currentLevelQuestion.correct_answer) {
                  buttonClass += ' incorrect';
                }
                // All other options remain neutral
                else {
                  buttonClass += ' neutral';
                }
              } else if (value === selectedAnswer) {
                buttonClass += ' selected';
              }
              
              return (
                <button
                  key={value.toString()}
                  onClick={() => handleAnswerSelect(value)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  {value ? '✓ True' : '✗ False'}
                </button>
              );
            })}
          </div>
        );

      case 'matching':
        const leftItems = currentLevelQuestion.leftItems || [];
        const rightItems = currentLevelQuestion.rightItems || [];
        const userMatches = selectedAnswer || {};
        const selectedLeftIndex = userMatches.selectedLeft;
        
        return (
          <div className="matching-section">
            <div className="matching-instructions">
              Click an item from the left, then click its match from the right
            </div>
            <div className="matching-container">
              <div className="left-column">
                <h4>Items</h4>
                {leftItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`matching-item left ${
                      selectedLeftIndex === index ? 'selected' : ''
                    } ${userMatches[index] !== undefined ? 'matched' : ''}`}
                    onClick={() => {
                      if (!showResult) {
                        // Select this left item for matching
                        const newAnswer = { ...userMatches };
                        newAnswer.selectedLeft = index;
                        handleAnswerSelect(newAnswer);
                      }
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="right-column">
                <h4>Descriptions</h4>
                {rightItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`matching-item right ${
                      Object.values(userMatches).includes(index) ? 'matched' : ''
                    }`}
                    onClick={() => {
                      if (!showResult && selectedLeftIndex !== undefined) {
                        // Match the selected left item with this right item
                        const newMatches = { ...userMatches };
                        newMatches[selectedLeftIndex] = index;
                        delete newMatches.selectedLeft;
                        handleAnswerSelect(newMatches);
                      }
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Show current matches */}
            {Object.keys(userMatches).filter(key => key !== 'selectedLeft').length > 0 && !showResult && (
              <div className="current-matches">
                <strong>Your matches:</strong>
                {Object.entries(userMatches).filter(([key, _]) => key !== 'selectedLeft').map(([leftIdx, rightIdx]) => (
                  <div key={leftIdx} className="user-match">
                    {leftItems[leftIdx]} → {rightItems[rightIdx]}
                  </div>
                ))}
              </div>
            )}
            
            {showResult && (
              <div className="matching-result">
                <strong>Correct pairs:</strong>
                {(currentLevelQuestion.correctPairs || []).map((pair, index) => (
                  <div key={index} className="correct-pair">
                    {leftItems[pair[0]]} → {rightItems[pair[1]]}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-input-container">
            <input
              type="text"
              className="answer-input"
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              placeholder="Type your answer here..."
              disabled={showResult}
              autoFocus
            />
          </div>
        );
    }
  };

  const renderQuestion = () => {
    if (!currentLevelQuestion) {
      return (
        <div className="question-section">
          <div className="error-message">
            <h3>No question available for Level {currentLevel}</h3>
            <p>This level might not have been generated yet.</p>
            <button onClick={() => setCurrentLevel(1)} className="back-to-start-btn">
              Go to Level 1
            </button>
          </div>
        </div>
      );
    }

    // Parse question text and options if they're stored as JSON strings
    let questionText = currentLevelQuestion.question_text || currentLevelQuestion.question || '';
    let options = currentLevelQuestion.options;
    
    // Handle case where options might be stored as JSON string
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        // For debugging: console.warn('Failed to parse options:', options);
        options = [];
      }
    }

    // For debugging: console.log('Rendering question:', { level: currentLevel, questionText, options, rawQuestion: currentLevelQuestion });

    return (
      <div className="question-section">
        <div className="question-header">
          <h3>Level {currentLevel}: {currentLevelQuestion.level_theme || 'General Knowledge'}</h3>
          <div className="question-difficulty">
            Difficulty: <span className={`difficulty-${currentLevelQuestion.difficulty}`}>
              {currentLevelQuestion.difficulty || 'medium'}
            </span>
          </div>
        </div>
        
        <div className="question-content">
          <h4 className="question-text">{questionText}</h4>
          
          {renderQuestionContent()}
        </div>
        
        {!showResult && (
          <div className="question-actions">
            <button 
              className="submit-btn"
              onClick={submitAnswer}
              disabled={
                (
                  selectedAnswer === '' ||
                  selectedAnswer === null ||
                  selectedAnswer === undefined
                ) ||
                (typeof selectedAnswer === 'string' && selectedAnswer.trim() === '')
              }
            >
              Submit Answer 🚀
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    if (!showResult || !answeredQuestions[currentLevel]) return null;

    const result = answeredQuestions[currentLevel];
    const isCorrect = result.isCorrect;
    const isLastLevel = currentLevel >= totalLevels;

    return (
      <div className={`result-modal ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="result-content">
          <div className="result-icon">
            {isCorrect ? '🎉' : '😞'}
          </div>
          
          <h3>
            {isCorrect ? 'Excellent!' : 'Not quite right'}
          </h3>
          
          <div className="result-details">
            <p><strong>Your answer:</strong> {getDisplaySelectedAnswer(result.selectedAnswer, currentLevelQuestion)}</p>
            <p><strong>Correct answer:</strong> {result.correctAnswer}</p>
            {isCorrect && <p className="success-message">You can climb to the next level!</p>}
            {!isCorrect && <p className="failure-message">Study the material and try again!</p>}
          </div>
          
          {/* Show final score if this is the last level AND answered correctly */}
          {isLastLevel && isCorrect && (
            <div className="final-score-display">
              <h4>🏆 Tower Challenge Complete!</h4>
              <div className="final-stats">
                <div className="stat-item">
                  <span className="stat-value">{Math.round((Object.values(answeredQuestions).filter(r => r.isCorrect).length / totalLevels) * 100)}%</span>
                  <span className="stat-label">Final Score</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{Object.values(answeredQuestions).filter(r => r.isCorrect).length}/{totalLevels}</span>
                  <span className="stat-label">Correct Answers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{formatTime(timeElapsed)}</span>
                  <span className="stat-label">Time Taken</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="result-actions">
            {/* ALWAYS show Try Again button for ANY incorrect answer - this should work for all levels including the last one */}
            {!isCorrect && (
              <button className="retry-btn" onClick={restartLevel}>
                Try Again 🔄
              </button>
            )}
            
            {/* Show next level button only for correct answers on non-final levels */}
            {isCorrect && currentLevel < totalLevels && (
              <button className="next-level-btn" onClick={nextLevel}>
                Climb to Level {currentLevel + 1} 🧗‍♂️
              </button>
            )}
            
            {/* Show completion button only when the last level is answered correctly */}
            {isLastLevel && isCorrect && (
              <button className="complete-game-btn" onClick={() => {
                const finalResults = gameResults;
                const correctAnswers = finalResults.filter(r => r.isCorrect).length;
                const finalScore = Math.round((correctAnswers / totalLevels) * 100);
                
                // For debugging: console.log('Knowledge Tower completed:', { finalResults, correctAnswers, totalLevels, finalScore });
                
                onGameComplete && onGameComplete({
                  results: finalResults,
                  totalLevels,
                  timeElapsed,
                  finalLevel: currentLevel,
                  completed: true,
                  score: finalScore,
                  correctAnswers,
                  totalQuestions: totalLevels
                });
              }}>
                Complete Tower! 🏆
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const correctAnswers = Object.values(answeredQuestions).filter(result => result.isCorrect).length;
    return Math.round((correctAnswers / totalLevels) * 100);
  };

  if (!gameData || !questions.length) {
    return (
      <div className="knowledge-tower-game">
        <div className="error-message">
          <h3>Game data not available</h3>
          <p>Unable to load Knowledge Tower game data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-tower-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>🏗️ Knowledge Tower</h2>
          <div className="game-stats">
            <span className="current-level">Level {currentLevel} of {totalLevels}</span>
            <span className="time">Time: {formatTime(timeElapsed)}</span>
            <span className="score">Score: {calculateScore()}%</span>
          </div>
        </div>
        
        <div className="game-actions">
          <button 
            className="exit-game-btn"
            onClick={handleExitGame}
            title="Exit Game"
          >
            🚪 Exit Quiz
          </button>
        </div>
        
        <div className="game-description">
          <p>Climb the Knowledge Tower by answering questions correctly. Each level builds on the previous one!</p>
        </div>
      </div>

      {/* Game Content */}
      <div className="game-content">
        {/* Tower Visualization */}
        <div className="tower-section">
          {renderTower()}
        </div>

        {/* Question Section */}
        <div className="question-area">
          {renderQuestion()}
        </div>
      </div>

      {/* Result Modal */}
      {renderResult()}

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="exit-confirmation-overlay">
          <div className="exit-confirmation-dialog">
            <div className="exit-confirmation-content">
              <h3>🚪 Exit Tower Challenge?</h3>
              <p>Are you sure you want to exit the Knowledge Tower game?</p>
              <div className="exit-current-progress">
                <p><strong>Current Progress:</strong></p>
                <ul>
                  <li>Current Level: {currentLevel}/{totalLevels}</li>
                  <li>Levels completed: {Object.values(answeredQuestions).filter(r => r.isCorrect).length}</li>
                  <li>Time elapsed: {formatTime(timeElapsed)}</li>
                  <li>Current score: {calculateScore()}%</li>
                </ul>
                <p className="exit-warning">
                  ⚠️ Your progress will be saved, but the quiz will be marked as incomplete.
                </p>
              </div>
              <div className="exit-confirmation-actions">
                <button 
                  className="exit-cancel-btn"
                  onClick={cancelExitGame}
                >
                  ❌ Cancel
                </button>
                <button 
                  className="exit-confirm-btn"
                  onClick={confirmExitGame}
                >
                  🚪 Exit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="progress-summary">
        <h4>Tower Progress</h4>
        <div className="levels-summary">
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map(level => {
            const result = answeredQuestions[level];
            return (
              <div key={level} className={`level-summary ${result ? (result.isCorrect ? 'completed' : 'failed') : 'pending'}`}>
                <span className="level-num">L{level}</span>
                <span className="level-status">
                  {result ? (result.isCorrect ? '✅' : '❌') : '⏳'}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="summary-stats">
          <span>Completed: {Object.values(answeredQuestions).filter(r => r.isCorrect).length}/{totalLevels}</span>
          <span>Success Rate: {calculateScore()}%</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTowerGame;
