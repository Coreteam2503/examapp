import React, { useState, useEffect } from 'react';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const [reportConfig, setReportConfig] = useState({
    reportType: 'comprehensive',
    timeRange: '30d',
    includeCharts: true,
    includeUserData: true,
    includeQuizData: true,
    includeSystemMetrics: true,
    format: 'pdf',
    scheduleReport: false,
    emailRecipients: ''
  });

  const [availableReports, setAvailableReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  const fetchAvailableReports = async () => {
    setTimeout(() => {
      setAvailableReports([
        {
          id: 1,
          name: 'Weekly Performance Report',
          type: 'performance',
          generated: '2024-06-03T10:30:00Z',
          size: '2.4 MB',
          format: 'PDF',
          status: 'completed'
        },
        {
          id: 2,
          name: 'Monthly User Analytics',
          type: 'user-analytics',
          generated: '2024-06-01T09:15:00Z',
          size: '1.8 MB',
          format: 'CSV',
          status: 'completed'
        },
        {
          id: 3,
          name: 'Quiz Performance Analysis',
          type: 'quiz-analysis',
          generated: '2024-05-30T14:20:00Z',
          size: '3.2 MB',
          format: 'PDF',
          status: 'completed'
        }
      ]);
    }, 500);
  };

  const handleConfigChange = (field, value) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateReport = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const steps = [
        'Collecting user data...',
        'Analyzing quiz performance...',
        'Gathering system metrics...',
        'Processing analytics...',
        'Generating charts...',
        'Compiling report...',
        'Finalizing export...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(((i + 1) / steps.length) * 100);
      }

      if (reportConfig.format === 'pdf') {
        downloadPDFReport();
      } else if (reportConfig.format === 'csv') {
        downloadCSVReport();
      } else if (reportConfig.format === 'excel') {
        downloadExcelReport();
      }

      const newReport = {
        id: Date.now(),
        name: `${getReportTypeName(reportConfig.reportType)} Report`,
        type: reportConfig.reportType,
        generated: new Date().toISOString(),
        size: '2.1 MB',
        format: reportConfig.format.toUpperCase(),
        status: 'completed'
      };

      setAvailableReports(prev => [newReport, ...prev]);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const getReportTypeName = (type) => {
    const names = {
      'comprehensive': 'Comprehensive Analytics',
      'user-analytics': 'User Analytics',
      'quiz-analysis': 'Quiz Performance',
      'system-health': 'System Health',
      'performance': 'Performance Summary'
    };
    return names[type] || 'Custom Report';
  };

  const downloadPDFReport = () => {
    const reportData = generateReportData();
    const pdfContent = createPDFContent(reportData);
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getReportTypeName(reportConfig.reportType)}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSVReport = () => {
    const reportData = generateReportData();
    const csvContent = createCSVContent(reportData);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getReportTypeName(reportConfig.reportType)}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcelReport = () => {
    const reportData = generateReportData();
    const excelContent = createExcelContent(reportData);
    
    const blob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getReportTypeName(reportConfig.reportType)}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReportData = () => {
    return {
      metadata: {
        reportType: reportConfig.reportType,
        timeRange: reportConfig.timeRange,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Admin System'
      },
      userMetrics: reportConfig.includeUserData ? {
        totalUsers: 1247,
        activeUsers: 856,
        newUsers: 89,
        retentionRate: 72.5,
        engagementScore: 8.3
      } : null,
      quizMetrics: reportConfig.includeQuizData ? {
        totalQuizzes: 342,
        completedAttempts: 8945,
        averageScore: 78.3,
        completionRate: 82.1,
        topCategories: ['JavaScript', 'React', 'Python', 'CSS', 'Node.js']
      } : null,
      systemMetrics: reportConfig.includeSystemMetrics ? {
        uptime: 99.8,
        averageResponseTime: 145,
        errorRate: 0.3,
        serverLoad: 45.2,
        storageUsed: 67.4
      } : null,
      insights: [
        'User engagement increased by 15% this month',
        'JavaScript quizzes show highest completion rates',
        'Weekend study sessions are 23% more effective',
        'System performance remains excellent with 99.8% uptime'
      ]
    };
  };

  const createPDFContent = (data) => {
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 750 Td
(${getReportTypeName(reportConfig.reportType)}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000203 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
295
%%EOF`;
  };

  const createCSVContent = (data) => {
    let csvContent = `Report Type,${data.metadata.reportType}\n`;
    csvContent += `Generated At,${data.metadata.generatedAt}\n`;
    csvContent += `Time Range,${data.metadata.timeRange}\n\n`;

    if (data.userMetrics) {
      csvContent += 'User Metrics\n';
      csvContent += 'Metric,Value\n';
      Object.entries(data.userMetrics).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
      csvContent += '\n';
    }

    if (data.quizMetrics) {
      csvContent += 'Quiz Metrics\n';
      csvContent += 'Metric,Value\n';
      Object.entries(data.quizMetrics).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          csvContent += `${key},"${value.join(', ')}"\n`;
        } else {
          csvContent += `${key},${value}\n`;
        }
      });
      csvContent += '\n';
    }

    if (data.systemMetrics) {
      csvContent += 'System Metrics\n';
      csvContent += 'Metric,Value\n';
      Object.entries(data.systemMetrics).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
      csvContent += '\n';
    }

    return csvContent;
  };

  const createExcelContent = (data) => {
    let excelContent = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report Summary">
<Table>`;

    excelContent += `<Row><Cell><Data ss:Type="String">Report Type</Data></Cell><Cell><Data ss:Type="String">${data.metadata.reportType}</Data></Cell></Row>\n`;
    excelContent += `<Row><Cell><Data ss:Type="String">Generated At</Data></Cell><Cell><Data ss:Type="String">${data.metadata.generatedAt}</Data></Cell></Row>\n`;
    
    excelContent += `</Table>
</Worksheet>
</Workbook>`;
    return excelContent;
  };

  const downloadReport = (reportId) => {
    const report = availableReports.find(r => r.id === reportId);
    if (report) {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${report.name}.${report.format.toLowerCase()}`;
      link.click();
    }
  };

  const deleteReport = (reportId) => {
    setAvailableReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'processing': return '⏳';
      default: return '📄';
    }
  };

  return (
    <div className="report-generator">
      <div className="report-header">
        <div className="header-content">
          <h1>Report Generator</h1>
          <p>Generate and export comprehensive analytics reports</p>
        </div>
      </div>

      <div className="report-content">
        <div className="report-config">
          <h2>Generate New Report</h2>
          
          <div className="config-grid">
            <div className="config-group">
              <label>Report Type</label>
              <select 
                value={reportConfig.reportType}
                onChange={(e) => handleConfigChange('reportType', e.target.value)}
                className="config-select"
              >
                <option value="comprehensive">Comprehensive Analytics</option>
                <option value="user-analytics">User Analytics</option>
                <option value="quiz-analysis">Quiz Performance</option>
                <option value="system-health">System Health</option>
                <option value="performance">Performance Summary</option>
              </select>
            </div>

            <div className="config-group">
              <label>Time Range</label>
              <select 
                value={reportConfig.timeRange}
                onChange={(e) => handleConfigChange('timeRange', e.target.value)}
                className="config-select"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>

            <div className="config-group">
              <label>Export Format</label>
              <select 
                value={reportConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
                className="config-select"
              >
                <option value="pdf">PDF Report</option>
                <option value="csv">CSV Data</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="json">JSON Data</option>
              </select>
            </div>
          </div>

          <div className="config-options">
            <h3>Include in Report</h3>
            <div className="options-grid">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.includeCharts}
                  onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                />
                <span>Charts and Visualizations</span>
              </label>

              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.includeUserData}
                  onChange={(e) => handleConfigChange('includeUserData', e.target.checked)}
                />
                <span>User Analytics</span>
              </label>

              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.includeQuizData}
                  onChange={(e) => handleConfigChange('includeQuizData', e.target.checked)}
                />
                <span>Quiz Performance Data</span>
              </label>

              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={reportConfig.includeSystemMetrics}
                  onChange={(e) => handleConfigChange('includeSystemMetrics', e.target.checked)}
                />
                <span>System Metrics</span>
              </label>
            </div>
          </div>

          <div className="config-actions">
            <button 
              onClick={generateReport}
              disabled={generating}
              className="generate-btn"
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>

            <button className="preview-btn">
              Preview Report
            </button>
          </div>

          {generating && (
            <div className="generation-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(progress)}% Complete</div>
            </div>
          )}
        </div>

        <div className="available-reports">
          <h2>Available Reports</h2>
          
          <div className="reports-list">
            {availableReports.map(report => (
              <div key={report.id} className="report-item">
                <div className="report-info">
                  <div className="report-name">
                    <span className="status-icon">{getStatusIcon(report.status)}</span>
                    {report.name}
                  </div>
                  <div className="report-meta">
                    <span className="report-type">{report.type}</span>
                    <span className="report-date">
                      {new Date(report.generated).toLocaleDateString()}
                    </span>
                    <span className="report-size">{report.size}</span>
                    <span className="report-status">{report.status}</span>
                  </div>
                </div>
                
                <div className="report-actions">
                  {report.status === 'completed' && (
                    <button 
                      onClick={() => downloadReport(report.id)}
                      className="download-btn"
                    >
                      Download
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteReport(report.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;