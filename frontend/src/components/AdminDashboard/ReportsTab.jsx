import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import './ReportsTab.css';

const ReportsTab = ({ reportType, setReportType, handleGenerateReport, isGeneratingReport }) => {
  const { user, ensureToken } = useContext(AuthContext);
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [format, setFormat] = useState('pdf');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    try {
      const token = ensureToken();
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const faculty = data.filter(u => u.role === 'faculty' && u.isActive !== false);
        setFacultyList(faculty);
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
    }
  };

  const fetchFacultyData = async (facultyId) => {
    if (!facultyId) {
      setFacultyData(null);
      return;
    }

    setLoading(true);
    try {
      const token = ensureToken();
      if (!token) return;

      // Fetch all data for the selected faculty
      const [portfolioResponse, courseResponse] = await Promise.all([
        fetch(`/api/faculty-portfolio/${facultyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/assignments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const data = {
        research: [],
        portfolio: [],
        courses: []
      };

      // For research, we need to check if there's an admin endpoint or use the research model directly
      // For now, we'll set research to empty array as there's no admin endpoint for fetching all research
      data.research = [];

      if (portfolioResponse.ok) {
        const portfolio = await portfolioResponse.json();
        data.portfolio = portfolio ? [portfolio] : [];
      }

      if (courseResponse.ok) {
        const assignments = await courseResponse.json();
        // Filter assignments for the selected faculty
        data.courses = assignments.filter(a => 
          a.facultyId && (a.facultyId._id === facultyId || a.facultyId === facultyId)
        );
      }

      setFacultyData(data);
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch faculty data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyChange = (e) => {
    const facultyId = e.target.value;
    setSelectedFaculty(facultyId);
    fetchFacultyData(facultyId);
  };

  const onGenerateClick = () => {
    if (!selectedFaculty) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please select a faculty member first'
      });
      return;
    }

    handleGenerateReport({
      facultyId: selectedFaculty,
      reportType,
      startDate,
      endDate,
      format
    });
  };

  const getReportTypes = () => {
    const types = [
      { value: 'summary', label: 'Faculty Portfolio Summary' },
      { value: 'research', label: 'Research Activities Report' },
      { value: 'portfolio', label: 'Portfolio Complete Report' },
      { value: 'courses', label: 'Course Assignments Report' },
      { value: 'performance', label: 'Overall Performance Report' },
      { value: 'seminar', label: 'Seminar Participation Report' }
    ];
    return types;
  };

  return (
    <div className="reports-analytics">
      <div className="section-header">
        <h3>Generate & Export Reports</h3>
        <span className="count-badge">Faculty Reports</span>
      </div>

      <div className="reports-container">
        <div className="report-generator">
          <h4>📊 Report Generation</h4>
          <div className="report-options">
            <div className="option-group">
              <label>Select Faculty</label>
              <select
                value={selectedFaculty}
                onChange={handleFacultyChange}
                className="report-select"
              >
                <option value="">-- Select Faculty --</option>
                {facultyList.map(faculty => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.firstName} {faculty.lastName} - {faculty.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="report-select"
                disabled={!selectedFaculty}
              >
                <option value="">Select Report Type</option>
                {getReportTypes().map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
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
              disabled={isGeneratingReport || !reportType || !selectedFaculty}
            >
              <span className="generate-btn-text">
                {isGeneratingReport ? 'Generating Report...' : 'Generate Report'}
              </span>
            </button>
          </div>
        </div>

        {/* Faculty Data Preview Table */}
        {facultyData && (
          <div className="faculty-data-preview">
            <h4>📋 Faculty Data Preview</h4>
            {loading ? (
              <div className="loading-state">Loading data...</div>
            ) : (
              <div className="data-tables">
                {/* Research Section */}
                <div className="data-section research-section">
                  <h5>🔬 Research Activities</h5>
                  {facultyData.research.length > 0 ? (
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Publication Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyData.research.map(item => (
                          <tr key={item._id}>
                            <td>{item.title}</td>
                            <td>{item.researchType}</td>
                            <td>
                              <span className={`status-badge ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>{item.publicationDate || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No research activities found</p>
                  )}
                </div>

                {/* Portfolio Section */}
                <div className="data-section portfolio-section">
                  <h5>📁 Portfolio Updates</h5>
                  {facultyData.portfolio.length > 0 ? (
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Section</th>
                          <th>Semester</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyData.portfolio.map((portfolio, idx) => {
                          const subjects = portfolio.portfolioData?.subjects || {};
                          const subjectKeys = Object.keys(subjects);
                          
                          if (subjectKeys.length === 0) {
                            return (
                              <tr key={idx}>
                                <td colSpan="4">No subjects found in portfolio</td>
                              </tr>
                            );
                          }
                          
                          return subjectKeys.map((subjectKey, subIdx) => {
                            const subject = subjects[subjectKey];
                            return (
                              <tr key={`${idx}-${subIdx}`}>
                                <td>{subject.subjectCode || subjectKey}</td>
                                <td>{subject.sectionCode || 'N/A'}</td>
                                <td>{subject.semester || 'N/A'}</td>
                                <td>{new Date(portfolio.updatedAt).toLocaleDateString()}</td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No portfolio updates found</p>
                  )}
                </div>

                {/* Course Assignments Section */}
                <div className="data-section course-section">
                  <h5>📚 Course Assignments</h5>
                  {facultyData.courses.length > 0 ? (
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Semester</th>
                          <th>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyData.courses.map(item => (
                          <tr key={item._id}>
                            <td>{item.courseId?.courseCode || 'N/A'}</td>
                            <td>{item.courseId?.courseName || 'N/A'}</td>
                            <td>{item.semester || 'N/A'}</td>
                            <td>{item.section || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No course assignments found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;

