import React from 'react';
import './AnalyticsFilters.css';

const AnalyticsFilters = ({ filters, onFilterChange, loading }) => {
  const handleTimeRangeChange = (timeRange) => {
    onFilterChange({ timeRange });
  };

  const handleUserTypeChange = (userType) => {
    onFilterChange({ userType });
  };

  const handleQuizTypeChange = (quizType) => {
    onFilterChange({ quizType });
  };

  const handleDateRangeChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      timeRange: '30d',
      userType: 'all',
      quizType: 'all',
      dateFrom: null,
      dateTo: null
    });
  };

  return (
    <div className="analytics-filters">
      <div className="filters-row">
        {/* Time Range Quick Filters */}
        <div className="filter-group">
          <label className="filter-label">Time Range</label>
          <div className="time-range-buttons">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                className={`time-btn ${filters.timeRange === range ? 'active' : ''}`}
                onClick={() => handleTimeRangeChange(range)}
                disabled={loading}
              >
                {range === '7d' ? 'Last 7 days' : 
                 range === '30d' ? 'Last 30 days' : 
                 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>

        {/* User Type Filter */}
        <div className="filter-group">
          <label className="filter-label">User Type</label>
          <select
            value={filters.userType}
            onChange={(e) => handleUserTypeChange(e.target.value)}
            disabled={loading}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="admin">Administrators</option>
            <option value="teacher">Teachers</option>
          </select>
        </div>

        {/* Quiz Type Filter */}
        <div className="filter-group">
          <label className="filter-label">Quiz Type</label>
          <select
            value={filters.quizType}
            onChange={(e) => handleQuizTypeChange(e.target.value)}
            disabled={loading}
            className="filter-select"
          >
            <option value="all">All Quizzes</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="matching">Matching</option>
          </select>
        </div>

        {/* Custom Date Range */}
        <div className="filter-group">
          <label className="filter-label">Custom Date Range</label>
          <div className="date-range-inputs">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateRangeChange('dateFrom', e.target.value)}
              disabled={loading}
              className="date-input"
              placeholder="From"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateRangeChange('dateTo', e.target.value)}
              disabled={loading}
              className="date-input"
              placeholder="To"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="filter-group">
          <button
            onClick={resetFilters}
            disabled={loading}
            className="reset-btn"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="active-filters">
        <span className="active-filters-label">Active Filters:</span>
        <div className="filter-tags">
          <span className="filter-tag">
            📅 {filters.timeRange === '7d' ? 'Last 7 days' : 
                filters.timeRange === '30d' ? 'Last 30 days' : 
                'Last 90 days'}
          </span>
          {filters.userType !== 'all' && (
            <span className="filter-tag">
              👥 {filters.userType.charAt(0).toUpperCase() + filters.userType.slice(1)}s
            </span>
          )}
          {filters.quizType !== 'all' && (
            <span className="filter-tag">
              📝 {filters.quizType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
          {filters.dateFrom && filters.dateTo && (
            <span className="filter-tag">
              📆 {filters.dateFrom} to {filters.dateTo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsFilters;