import React, { useState, useEffect } from 'react';
import './MatchingQuestion.css';

const MatchingQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matches, setMatches] = useState(userAnswer || {});
  const [shuffledRight, setShuffledRight] = useState([]);

  // Shuffle right-side items on component mount
  useEffect(() => {
    if (question.pairs) {
      const rightItems = question.pairs.map(pair => pair.right);
      setShuffledRight(shuffleArray([...rightItems]));
    }
  }, [question.pairs]);

  // Notify parent of answer changes
  useEffect(() => {
    onAnswer(matches);
  }, [matches, onAnswer]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleLeftClick = (leftItem) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === leftItem ? null : leftItem);
  };

  const handleRightClick = (rightItem) => {
    if (disabled) return;

    if (selectedLeft) {
      const newMatches = { ...matches };

      // Remove any existing match for this right item
      Object.keys(newMatches).forEach(key => {
        if (newMatches[key] === rightItem) {
          delete newMatches[key];
        }
      });

      newMatches[selectedLeft] = rightItem;
      setMatches(newMatches);
      setSelectedLeft(null);
    } else {
      setSelectedRight(selectedRight === rightItem ? null : rightItem);
    }
  };

  const getLeftItemClass = (leftItem) => {
    let classes = ['matching-item', 'left-item'];
    if (disabled) classes.push('disabled');
    if (selectedLeft === leftItem) classes.push('selected');
    if (matches[leftItem]) classes.push('matched');

    if (showCorrect) {
      const correctMatch = question.pairs.find(p => p.left === leftItem)?.right;
      if (matches[leftItem] === correctMatch) {
        classes.push('correct-match');
      } else if (matches[leftItem]) {
        classes.push('incorrect-match');
      }
    }

    return classes.join(' ');
  };

  const getRightItemClass = (rightItem) => {
    let classes = ['matching-item', 'right-item'];
    if (disabled) classes.push('disabled');
    if (selectedRight === rightItem) classes.push('selected');

    const isMatched = Object.values(matches).includes(rightItem);
    if (isMatched) classes.push('matched');

    if (showCorrect) {
      const matchedLeft = Object.keys(matches).find(left => matches[left] === rightItem);
      if (matchedLeft) {
        const correctMatch = question.pairs.find(p => p.left === matchedLeft)?.right;
        if (rightItem === correctMatch) {
          classes.push('correct-match');
        } else {
          classes.push('incorrect-match');
        }
      }
    }

    return classes.join(' ');
  };

  const clearMatch = (leftItem) => {
    if (disabled) return;
    const newMatches = { ...matches };
    delete newMatches[leftItem];
    setMatches(newMatches);
  };

  const getMatchedRightItem = (leftItem) => {
    return matches[leftItem];
  };

  if (!question.pairs || question.pairs.length === 0) {
    return <div className="matching-question-error">No matching pairs available</div>;
  }

  return (
    <div className="matching-question">
      <div className="matching-instructions">
        <p>Click items to match them. Click a left item, then click its corresponding right item.</p>
      </div>

      <div className="matching-container">
        <div className="matching-column left-column">
          <h4>Concepts</h4>
          {question.pairs.map((pair, index) => (
            <div key={index} className="matching-item-container">
              <div
                className={getLeftItemClass(pair.left)}
                onClick={() => handleLeftClick(pair.left)}
              >
                <span className="item-text">{pair.left}</span>
                {getMatchedRightItem(pair.left) && (
                  <button
                    className="clear-match-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMatch(pair.left);
                    }}
                    disabled={disabled}
                  >
                    ✗
                  </button>
                )}
              </div>
              {getMatchedRightItem(pair.left) && (
                <div className="match-display">
                  → {getMatchedRightItem(pair.left)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="matching-column right-column">
          <h4>Descriptions</h4>
          {shuffledRight.map((rightItem, index) => (
            <div
              key={index}
              className={getRightItemClass(rightItem)}
              onClick={() => handleRightClick(rightItem)}
            >
              <span className="item-text">{rightItem}</span>
            </div>
          ))}
        </div>
      </div>

      {showCorrect && question.explanation && (
        <div className="matching-explanation">
          <h5>Explanation:</h5>
          <p>{question.explanation}</p>
          <div className="correct-matches">
            <h6>Correct Matches:</h6>
            {question.pairs.map((pair, index) => (
              <div key={index} className="correct-match-item">
                <strong>{pair.left}</strong> → {pair.right}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingQuestion;