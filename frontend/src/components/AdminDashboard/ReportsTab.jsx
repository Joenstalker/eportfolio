import React from 'react';
import './ReportsTab.css';

const ReportsTab = ({ reportType, setReportType, handleGenerateReport }) => {
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
                <option value="summary">Faculty Portfolio Summary</option>
                <option value="detailed">Detailed Faculty Report</option>
                <option value="department">Department Statistics</option>
                <option value="activity">Activity Log Report</option>
                <option value="courses">Course Catalog Report</option>
              </select>
            </div>

            <div className="option-group">
              <label>Date Range</label>
              <input
                type="date"
                className="report-input"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="option-group">
              <label>Format</label>
              <div className="format-buttons">
                <button className="format-btn pdf">📄 PDF</button>
                <button className="format-btn excel">📊 Excel</button>
                <button className="format-btn csv">📋 CSV</button>
              </div>
            </div>

            <button
              className="btn-primary generate-btn"
              onClick={handleGenerateReport}
            >
              🔄 Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;

