import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="quiz-criteria-selector">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Main selector button */}
        <button
          type="button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg 
                     shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     ${disabled || loading ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
                     ${error ? 'border-red-300' : ''}
                     ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
              {loading ? 'Loading...' : getDisplayText()}
            </span>
            <div className="flex items-center space-x-1">
              {clearable && value && !disabled && !loading && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  type="button"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
              <ChevronDownIcon 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 
                           ${isOpen ? 'transform rotate-180' : ''}`} 
              />
            </div>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && !disabled && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
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
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:outline-none focus:bg-blue-50
                                 ${isSelected ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{optionLabel}</span>
                        {showCount && optionCount !== undefined && (
                          <span className="ml-2 text-xs text-gray-500">
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
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default QuizCriteriaSelector;
