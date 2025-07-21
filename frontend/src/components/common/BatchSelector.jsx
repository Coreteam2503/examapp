import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import './BatchSelector.css';

const BatchSelector = ({
  // Data props
  batches = [],
  selectedBatches = [],
  
  // Configuration props
  mode = 'multi', // 'single' or 'multi'
  placeholder = 'Select batches...',
  searchPlaceholder = 'Search batches...',
  emptyMessage = 'No batches available',
  maxDisplayedSelections = 3,
  
  // Feature flags
  searchable = true,
  clearable = true,
  disabled = false,
  
  // State props
  loading = false,
  error = null,
  
  // Event handlers
  onChange = () => {},
  onSearchChange = () => {},
  onOpen = () => {},
  onClose = () => {},
  
  // Filter props
  filterBy = null, // Custom filter function
  
  // Style props
  className = '',
  dropdownClassName = '',
  
  // Accessibility
  id = null,
  'aria-label': ariaLabel = 'Batch selector',
  
  // Advanced props
  renderBatchOption = null, // Custom render function for batch options
  renderSelectedBatch = null, // Custom render function for selected batches
  showBatchCounts = false,
  groupBy = null, // Group batches by property (e.g., 'subject', 'domain')
}) => {
  // Internal state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // Refs
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Process batches based on search and filters
  const processedBatches = React.useMemo(() => {
    let filtered = batches;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.name?.toLowerCase().includes(term) ||
        batch.description?.toLowerCase().includes(term) ||
        batch.subject?.toLowerCase().includes(term) ||
        batch.domain?.toLowerCase().includes(term)
      );
    }
    
    // Apply custom filter
    if (filterBy && typeof filterBy === 'function') {
      filtered = filtered.filter(filterBy);
    }
    
    // Group batches if groupBy is specified
    if (groupBy) {
      const grouped = filtered.reduce((acc, batch) => {
        const key = batch[groupBy] || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(batch);
        return acc;
      }, {});
      
      return Object.keys(grouped).map(group => ({
        group,
        batches: grouped[group]
      }));
    }
    
    return filtered;
  }, [batches, searchTerm, filterBy, groupBy]);
  
  // Handle clicks outside component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      const flatBatches = groupBy 
        ? processedBatches.flatMap(group => group.batches)
        : processedBatches;
      
      switch (event.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < flatBatches.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : flatBatches.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < flatBatches.length) {
            handleBatchSelect(flatBatches[focusedIndex]);
          }
          break;
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, processedBatches, groupBy]);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);
  
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setFocusedIndex(-1);
    onOpen();
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    onClose();
  };
  
  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };
  
  const handleBatchSelect = (batch) => {
    if (mode === 'single') {
      onChange([batch]);
      handleClose();
    } else {
      const isSelected = selectedBatches.some(selected => selected.id === batch.id);
      const newSelection = isSelected
        ? selectedBatches.filter(selected => selected.id !== batch.id)
        : [...selectedBatches, batch];
      onChange(newSelection);
    }
  };
  
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearchChange(value);
    setFocusedIndex(-1);
  };
  
  const handleClear = (event) => {
    event.stopPropagation();
    onChange([]);
  };
  
  const handleRemoveBatch = (batchToRemove, event) => {
    event.stopPropagation();
    const newSelection = selectedBatches.filter(batch => batch.id !== batchToRemove.id);
    onChange(newSelection);
  };
  
  // Render functions
  const renderBatchOptionDefault = (batch, isSelected, isFocused) => (
    <div className={`batch-option-content ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}>
      <div className="batch-main-info">
        <span className="batch-name">{batch.name}</span>
        {batch.subject && (
          <span className="batch-subject">{batch.subject}</span>
        )}
      </div>
      <div className="batch-meta">
        {batch.domain && (
          <span className="batch-domain">{batch.domain}</span>
        )}
        {showBatchCounts && batch.questionCount && (
          <span className="batch-count">{batch.questionCount} questions</span>
        )}
        {isSelected && mode === 'multi' && (
          <CheckIcon className="check-icon" />
        )}
      </div>
    </div>
  );
  
  const renderSelectedBatchDefault = (batch) => (
    <span className="selected-batch-tag">
      {batch.name}
      <button
        type="button"
        onClick={(e) => handleRemoveBatch(batch, e)}
        className="remove-batch-btn"
        aria-label={`Remove ${batch.name}`}
      >
        <XMarkIcon />
      </button>
    </span>
  );
  
  // Get display text for selector
  const getDisplayText = () => {
    if (selectedBatches.length === 0) {
      return placeholder;
    }
    
    if (mode === 'single') {
      return selectedBatches[0]?.name || placeholder;
    }
    
    if (selectedBatches.length <= maxDisplayedSelections) {
      return selectedBatches.map(batch => batch.name).join(', ');
    }
    
    return `${selectedBatches.length} batches selected`;
  };
  
  const renderGroupedOptions = () => {
    return processedBatches.map((group, groupIndex) => (
      <div key={group.group} className="batch-group">
        <div className="batch-group-header">{group.group}</div>
        {group.batches.map((batch, batchIndex) => {
          const flatIndex = processedBatches
            .slice(0, groupIndex)
            .reduce((acc, g) => acc + g.batches.length, 0) + batchIndex;
          const isSelected = selectedBatches.some(selected => selected.id === batch.id);
          const isFocused = focusedIndex === flatIndex;
          
          return (
            <div
              key={batch.id}
              className={`batch-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
              onClick={() => handleBatchSelect(batch)}
              onMouseEnter={() => setFocusedIndex(flatIndex)}
            >
              {renderBatchOption ? renderBatchOption(batch, isSelected, isFocused) : renderBatchOptionDefault(batch, isSelected, isFocused)}
            </div>
          );
        })}
      </div>
    ));
  };
  
  const renderFlatOptions = () => {
    return processedBatches.map((batch, index) => {
      const isSelected = selectedBatches.some(selected => selected.id === batch.id);
      const isFocused = focusedIndex === index;
      
      return (
        <div
          key={batch.id}
          className={`batch-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
          onClick={() => handleBatchSelect(batch)}
          onMouseEnter={() => setFocusedIndex(index)}
        >
          {renderBatchOption ? renderBatchOption(batch, isSelected, isFocused) : renderBatchOptionDefault(batch, isSelected, isFocused)}
        </div>
      );
    });
  };
  
  return (
    <div 
      ref={containerRef}
      className={`batch-selector ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
      id={id}
    >
      {/* Main selector button */}
      <div 
        className="batch-selector-trigger"
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <div className="batch-selector-content">
          {loading ? (
            <div className="loading-indicator">Loading...</div>
          ) : (
            <>
              {mode === 'multi' && selectedBatches.length > 0 && selectedBatches.length <= maxDisplayedSelections ? (
                <div className="selected-batches">
                  {selectedBatches.map(batch => (
                    <React.Fragment key={batch.id}>
                      {renderSelectedBatch ? renderSelectedBatch(batch) : renderSelectedBatchDefault(batch)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <span className={`display-text ${selectedBatches.length === 0 ? 'placeholder' : ''}`}>
                  {getDisplayText()}
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="batch-selector-controls">
          {clearable && selectedBatches.length > 0 && !disabled && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <XMarkIcon />
            </button>
          )}
          <div className="dropdown-arrow">
            <ChevronDownIcon />
          </div>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="batch-selector-error">
          {error}
        </div>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`batch-selector-dropdown ${dropdownClassName}`}
          role="listbox"
          aria-label="Batch options"
        >
          {/* Search input */}
          {searchable && (
            <div className="batch-search">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          )}
          
          {/* Batch options */}
          <div className="batch-options">
            {loading ? (
              <div className="loading-state">Loading batches...</div>
            ) : processedBatches.length === 0 ? (
              <div className="empty-state">{emptyMessage}</div>
            ) : (
              <>
                {groupBy ? renderGroupedOptions() : renderFlatOptions()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchSelector;