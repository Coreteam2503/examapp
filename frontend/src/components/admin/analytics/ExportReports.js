import React, { useState } from 'react';
import './ExportReports.css';

const ExportReports = ({ onExport }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      id: 'user-analytics',
      title: 'User Analytics',
      description: 'Export user engagement and activity data',
      formats: ['CSV', 'PDF', 'JSON'],
      icon: '👥'
    },
    {
      id: 'quiz-performance',
      title: 'Quiz Performance',
      description: 'Export quiz statistics and completion data',
      formats: ['CSV', 'PDF', 'Excel'],
      icon: '📝'
    },
    {
      id: 'system-metrics',
      title: 'System Metrics',
      description: 'Export system performance and usage data',
      formats: ['CSV', 'JSON'],
      icon: '🖥️'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Report',
      description: 'Export all analytics data in one report',
      formats: ['PDF', 'Excel'],
      icon: '📊'
    }
  ];

  const handleExport = async (reportType, format) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onExport) {
        onExport(format, reportType);
      }
      
      // Create a mock download
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
      console.log(`Exporting ${filename}`);
      
      // You would implement actual file generation and download here
      alert(`Export completed: ${filename}`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const quickExportAll = async () => {
    setIsExporting(true);
    
    try {
      // Simulate comprehensive export
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const filename = `comprehensive-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log(`Quick exporting ${filename}`);
      alert(`Quick export completed: ${filename}`);
      
    } catch (error) {
      console.error('Quick export failed:', error);
      alert('Quick export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-reports">
      <div className="export-buttons">
        <button
          className="quick-export-btn"
          onClick={quickExportAll}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <span className="export-spinner"></span>
              Exporting...
            </>
          ) : (
            <>
              <span className="export-icon">⚡</span>
              Quick Export
            </>
          )}
        </button>
        
        <button
          className="export-menu-btn"
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={isExporting}
        >
          <span className="export-icon">📤</span>
          Export Options
          <span className={`dropdown-arrow ${showExportMenu ? 'open' : ''}`}>▼</span>
        </button>
      </div>

      {showExportMenu && (
        <div className="export-menu">
          <div className="export-menu-header">
            <h3>Export Analytics Data</h3>
            <button 
              className="close-menu-btn"
              onClick={() => setShowExportMenu(false)}
            >
              ×
            </button>
          </div>
          
          <div className="export-options">
            {exportOptions.map((option) => (
              <div key={option.id} className="export-option">
                <div className="option-header">
                  <span className="option-icon">{option.icon}</span>
                  <div className="option-content">
                    <div className="option-title">{option.title}</div>
                    <div className="option-description">{option.description}</div>
                  </div>
                </div>
                
                <div className="format-buttons">
                  {option.formats.map((format) => (
                    <button
                      key={format}
                      className="format-btn"
                      onClick={() => handleExport(option.id, format)}
                      disabled={isExporting}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="export-menu-footer">
            <div className="export-note">
              <span className="note-icon">ℹ️</span>
              <span className="note-text">
                Exports include data from the selected time range and filters
              </span>
            </div>
          </div>
        </div>
      )}
      
      {showExportMenu && (
        <div 
          className="export-overlay"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default ExportReports;