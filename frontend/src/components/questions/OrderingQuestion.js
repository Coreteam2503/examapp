import React, { useState, useEffect } from 'react';
import './OrderingQuestion.css';

const OrderingQuestion = ({ question, onAnswer, disabled = false, showCorrect = false, userAnswer = null }) => {
  // Ensure orderedItems is always an array
  const initialOrderedItems = Array.isArray(userAnswer) ? userAnswer : [];
  const [orderedItems, setOrderedItems] = useState(initialOrderedItems);
  const [availableItems, setAvailableItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize items on component mount
  useEffect(() => {
    if (question.items && question.items.length > 0) {
      const validUserAnswer = Array.isArray(userAnswer) && userAnswer.length > 0;
      
      if (validUserAnswer) {
        // Use existing user answer
        setOrderedItems(userAnswer);
        const remaining = question.items.filter(item => !userAnswer.includes(item));
        setAvailableItems(shuffleArray(remaining));
      } else {
        // Start fresh - shuffle all items and put them in available
        setAvailableItems(shuffleArray([...question.items]));
        setOrderedItems([]);
      }
    }
    // Reset submission state when question changes
    setIsSubmitting(false);
  }, [question.items, question.id, userAnswer]); // Added userAnswer to dependencies

  // DISABLED: Auto-submit removed to prevent rapid game completion
  // useEffect(() => {
  //   onAnswer(orderedItems);
  // }, [orderedItems, onAnswer]);

  const handleSubmit = () => {
    if (disabled || isSubmitting || !Array.isArray(orderedItems) || orderedItems.length === 0) {
      console.log('🚫 Ordering submit blocked:', { 
        disabled, 
        isSubmitting, 
        orderedItemsIsArray: Array.isArray(orderedItems),
        orderedItemsLength: Array.isArray(orderedItems) ? orderedItems.length : 'N/A'
      });
      return;
    }
    
    setIsSubmitting(true);
    console.log('🎯 Ordering submitting:', { orderedItems, questionId: question.id });
    
    setTimeout(() => {
      onAnswer(orderedItems);
      console.log('✅ Ordering submitted successfully');
    }, 100);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleDragStart = (e, item, source) => {
    if (disabled) return;
    setDraggedItem({ item, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex = null, targetSource = null) => {
    e.preventDefault();
    if (!draggedItem || disabled) return;

    const { item, source } = draggedItem;

    if (targetSource === 'available') {
      // Moving back to available items
      if (source === 'ordered') {
        setOrderedItems(prev => prev.filter(i => i !== item));
        setAvailableItems(prev => [...prev, item]);
      }
    } else if (targetSource === 'ordered') {
      // Moving to ordered list
      if (source === 'available') {
        setAvailableItems(prev => prev.filter(i => i !== item));
        if (targetIndex !== null) {
          setOrderedItems(prev => {
            const newOrdered = [...prev];
            newOrdered.splice(targetIndex, 0, item);
            return newOrdered;
          });
        } else {
          setOrderedItems(prev => [...prev, item]);
        }
      } else if (source === 'ordered') {
        // Reordering within ordered list
        setOrderedItems(prev => {
          const newOrdered = prev.filter(i => i !== item);
          if (targetIndex !== null) {
            newOrdered.splice(targetIndex, 0, item);
          } else {
            newOrdered.push(item);
          }
          return newOrdered;
        });
      }
    }

    setDraggedItem(null);
  };

  const moveToOrdered = (item) => {
    if (disabled) return;
    setAvailableItems(prev => prev.filter(i => i !== item));
    setOrderedItems(prev => [...prev, item]);
  };

  const moveToAvailable = (item) => {
    if (disabled) return;
    setOrderedItems(prev => prev.filter(i => i !== item));
    setAvailableItems(prev => [...prev, item]);
  };

  const moveUp = (index) => {
    if (disabled || index === 0) return;
    setOrderedItems(prev => {
      const newOrdered = [...prev];
      [newOrdered[index], newOrdered[index - 1]] = [newOrdered[index - 1], newOrdered[index]];
      return newOrdered;
    });
  };

  const moveDown = (index) => {
    if (disabled || index === orderedItems.length - 1) return;
    setOrderedItems(prev => {
      const newOrdered = [...prev];
      [newOrdered[index], newOrdered[index + 1]] = [newOrdered[index + 1], newOrdered[index]];
      return newOrdered;
    });
  };

  const getItemClass = (item, index, isOrdered) => {
    let classes = ['ordering-item'];
    if (disabled) classes.push('disabled');
    if (draggedItem?.item === item) classes.push('dragging');
    
    if (showCorrect && isOrdered) {
      const correctIndex = question.correctOrder ? question.correctOrder.indexOf(item) : index;
      if (index === correctIndex) {
        classes.push('correct-position');
      } else {
        classes.push('incorrect-position');
      }
    }
    
    return classes.join(' ');
  };

  if (!question.items || question.items.length === 0) {
    return <div className="ordering-question-error">No items available for ordering</div>;
  }

  return (
    <div className="ordering-question">
      <div className="ordering-instructions">
        <p>Drag items from the left to arrange them in the correct order on the right.</p>
      </div>

      <div className="ordering-container">
        <div className="ordering-column available-column">
          <h4>Available Items</h4>
          <div 
            className="items-container"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null, 'available')}
          >
            {Array.isArray(availableItems) && availableItems.map((item, index) => (
              <div
                key={`available-${index}`}
                className={getItemClass(item, index, false)}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, item, 'available')}
                onClick={() => moveToOrdered(item)}
              >
                <span className="item-text">{item}</span>
                <span className="move-hint">→</span>
              </div>
            ))}
            {availableItems.length === 0 && (
              <div className="empty-message">All items have been ordered</div>
            )}
          </div>
        </div>

        <div className="ordering-column ordered-column">
          <h4>Correct Order</h4>
          <div 
            className="items-container"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null, 'ordered')}
          >
            {Array.isArray(orderedItems) && orderedItems.map((item, index) => (
              <div key={`ordered-${index}`} className="ordered-item-container">
                <div className="position-number">{index + 1}</div>
                <div
                  className={getItemClass(item, index, true)}
                  draggable={!disabled}
                  onDragStart={(e) => handleDragStart(e, item, 'ordered')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, 'ordered')}
                >
                  <span className="item-text">{item}</span>
                  <div className="item-controls">
                    <button
                      className="control-btn up-btn"
                      onClick={() => moveUp(index)}
                      disabled={disabled || index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="control-btn down-btn"
                      onClick={() => moveDown(index)}
                      disabled={disabled || index === orderedItems.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="control-btn remove-btn"
                      onClick={() => moveToAvailable(item)}
                      disabled={disabled}
                      title="Remove from order"
                    >
                      ←
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {orderedItems.length === 0 && (
              <div className="empty-message">Drag items here to order them</div>
            )}
          </div>
        </div>
      </div>

      {/* Submit button for Ordering questions */}
      <div className="ordering-submit">
        <button 
          onClick={handleSubmit}
          disabled={disabled || orderedItems.length === 0 || isSubmitting}
          className="ordering-submit-btn"
        >
          {isSubmitting ? 'Submitting...' : `Submit Order (${orderedItems.length}/${question.items.length})`}
        </button>
      </div>

      {showCorrect && question.explanation && (
        <div className="ordering-explanation">
          <h5>Explanation:</h5>
          <p>{question.explanation}</p>
          {question.correctOrder && (
            <div className="correct-order">
              <h6>Correct Order:</h6>
              <ol>
                {question.correctOrder.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderingQuestion;