import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './QuizCriteriaSelector.css';

const QuizCriteriaSelector = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...', 
  searchable = true,
  clearable = true,
  disabled = false,
  loading = false,
  error = null,
  showCount = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true;
    const searchText = typeof option === 'object' 
      ? `${option.label} ${option.value}`.toLowerCase()
      : option.toString().toLowerCase();
    return searchText.includes(searchTerm.toLowerCase());
  });

  // Handle option selection
  const handleSelect = (option) => {
    const selectedValue = typeof option === 'object' ? option.value : option;
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value) return placeholder;
    
    const selectedOption = options.find(option => 
      typeof option === 'object' ? option.value === value : option === value
    );
    
    if (selectedOption) {
      const text = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
      return showCount && typeof selectedOption === 'object' && selectedOption.count !== undefined
        ? `${text} (${selectedOption.count})`
        : text;
    }
    
    return value;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        // Only close if the click is outside the dropdown component
        const dropdownElement = event.target.closest('.quiz-criteria-selector');
        if (!dropdownElement) {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="quiz-criteria-selector">
      {label && (
        <label className="selector-label">
          {label}
        </label>
      )}
      
      <div className="selector-container">
        {/* Main selector button */}
        <button
          type="button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`selector-button ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
        >
          <div className="button-content">
            <span className={`button-text ${!value ? 'placeholder' : 'selected'}`}>
              {loading ? 'Loading...' : getDisplayText()}
            </span>
            <div className="button-actions">
              {clearable && value && !disabled && !loading && (
                <button
                  onClick={handleClear}
                  className="clear-button"
                  type="button"
                >
                  ×
                </button>
              )}
              <ChevronDownIcon 
                className={`chevron-icon ${isOpen ? 'open' : ''}`}
              />
            </div>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && !disabled && !loading && (
          <div className="dropdown-menu">
            {/* Search input */}
            {searchable && (
              <div className="search-section">
                <div className="search-container">
                  <MagnifyingGlassIcon className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="options-list">
              {filteredOptions.length === 0 ? (
                <div className="no-options">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object' ? option.label : option;
                  const optionCount = typeof option === 'object' ? option.count : undefined;
                  const isSelected = optionValue === value;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="option-content">
                        <span className="option-label">{optionLabel}</span>
                        {showCount && optionCount !== undefined && (
                          <span className="option-count">
                            {optionCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="error-message">{error}</p>
      )}
    </div>
  );
};

export default QuizCriteriaSelector;