import React, { useState } from 'react';
import './ReportsTab.css';

const ReportsTab = ({ reportType, setReportType, handleGenerateReport, isGeneratingReport }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [format, setFormat] = useState('pdf');

  const onGenerateClick = () => {
    handleGenerateReport({
      startDate,
      endDate,
      format
    });
  };

  return (
    <div className="reports-analytics">
      <div className="section-header">
        <h3>Generate & Export Reports</h3>
        <span className="count-badge">Faculty Portfolio Summary</span>
      </div>

      <div className="reports-container">
        <div className="report-generator">
          <h4>📊 Report Generation</h4>
          <div className="report-options">
            <div className="option-group">
              <label>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="report-select"
              >
                <option value="">Select Report Type</option>
                <option value="summary">Faculty Portfolio Summary</option>
                <option value="activities">Detailed Faculty Report</option>
                <option value="performance">Department Statistics</option>
                <option value="seminar-participation">Seminar Participation Report</option>
              </select>
            </div>

            <div className="option-group">
              <label>Start Date</label>
              <input
                type="date"
                className="report-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="option-group">
              <label>End Date</label>
              <input
                type="date"
                className="report-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="option-group">
              <label>Format</label>
              <div className="format-buttons">
                <button
                  type="button"
                  className={`format-btn pdf ${format === 'pdf' ? 'active' : ''}`}
                  onClick={() => setFormat('pdf')}
                >
                  📄 PDF
                </button>
                <button
                  type="button"
                  className={`format-btn excel ${format === 'excel' ? 'active' : ''}`}
                  onClick={() => setFormat('excel')}
                >
                  📊 Excel
                </button>
                <button
                  type="button"
                  className={`format-btn csv ${format === 'csv' ? 'active' : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  📋 CSV
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary generate-btn"
              onClick={onGenerateClick}
              disabled={isGeneratingReport || !reportType}
            >
              <span className="generate-btn-text">
                {isGeneratingReport ? 'Generating Report...' : 'Generate Report'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;

