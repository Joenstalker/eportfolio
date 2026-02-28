import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './ReportsAnalyticsTab.css';

const ReportsAnalyticsTab = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [facultyData, setFacultyData] = useState([]);
  const [seminarData, setSeminarData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [reportType, setReportType] = useState('summary');

  // ==================== HELPER FUNCTIONS ====================
  const showSuccessAlert = (message, title = 'Success') => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const showErrorAlert = (message, title = 'Error') => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonColor: '#d33'
    });
  };

  // ==================== DATA FETCHING ====================
  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch faculty data for reports
      const facultyResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch seminar data
      const seminarResponse = await fetch('/api/seminars', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch course data
      const courseResponse = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (facultyResponse.ok) {
        const faculty = await facultyResponse.json();
        setFacultyData(faculty);
      }
      
      if (seminarResponse.ok) {
        const seminars = await seminarResponse.json();
        setSeminarData(seminars);
      }
      
      if (courseResponse.ok) {
        const courses = await courseResponse.json();
        setCourseData(courses);
      }
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
      showErrorAlert('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // ==================== REPORT GENERATION ====================
  const generatePDFReport = async (reportData, filename) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          data: reportData,
          dateRange,
          faculty: selectedFaculty
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccessAlert('PDF report generated successfully');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showErrorAlert('Failed to generate PDF report');
    }
  };

  // ==================== CALCULATIONS ====================
  const calculateSeminarStats = () => {
    const stats = {
      totalSeminars: seminarData.length,
      totalParticipants: seminarData.reduce((sum, seminar) => sum + (seminar.participants?.length || 0), 0),
      complianceRate: 0,
      departmentBreakdown: {}
    };

    // Calculate compliance rate (seminars attended / total required)
    const requiredSeminarsPerFaculty = 4; // Example requirement
    let totalRequired = facultyData.length * requiredSeminarsPerFaculty;
    let totalAttended = 0;

    facultyData.forEach(faculty => {
      const facultySeminars = seminarData.filter(seminar => 
        seminar.participants?.includes(faculty._id)
      );
      totalAttended += facultySeminars.length;
      
      // Department breakdown
      const dept = faculty.department || 'Unknown';
      stats.departmentBreakdown[dept] = (stats.departmentBreakdown[dept] || 0) + 1;
    });

    stats.complianceRate = totalRequired > 0 ? (totalAttended / totalRequired * 100).toFixed(1) : 0;
    
    return stats;
  };

  const calculateCourseStats = () => {
    return {
      totalCourses: courseData.length,
      activeCourses: courseData.filter(c => c.status === 'active').length,
      departmentBreakdown: courseData.reduce((acc, course) => {
        const dept = course.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
      averageCredits: courseData.length > 0 
        ? (courseData.reduce((sum, course) => sum + (course.credits || 0), 0) / courseData.length).toFixed(1)
        : 0
    };
  };

  const calculateFacultyStats = () => {
    return {
      totalFaculty: facultyData.length,
      activeFaculty: facultyData.filter(f => f.isActive).length,
      departmentBreakdown: facultyData.reduce((acc, faculty) => {
        const dept = faculty.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
      roleBreakdown: facultyData.reduce((acc, faculty) => {
        const role = faculty.role || 'Unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {})
    };
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderOverviewTab = () => {
    const facultyStats = calculateFacultyStats();
    const courseStats = calculateCourseStats();
    const seminarStats = calculateSeminarStats();

    return (
      <div className="reports-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Faculty Overview</h3>
            <div className="stat-item">
              <span className="stat-label">Total Faculty:</span>
              <span className="stat-value">{facultyStats.totalFaculty}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Faculty:</span>
              <span className="stat-value">{facultyStats.activeFaculty}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Departments:</span>
              <span className="stat-value">{Object.keys(facultyStats.departmentBreakdown).length}</span>
            </div>
          </div>

          <div className="stat-card">
            <h3>Course Overview</h3>
            <div className="stat-item">
              <span className="stat-label">Total Courses:</span>
              <span className="stat-value">{courseStats.totalCourses}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Courses:</span>
              <span className="stat-value">{courseStats.activeCourses}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Credits:</span>
              <span className="stat-value">{courseStats.averageCredits}</span>
            </div>
          </div>

          <div className="stat-card">
            <h3>Seminar Overview</h3>
            <div className="stat-item">
              <span className="stat-label">Total Seminars:</span>
              <span className="stat-value">{seminarStats.totalSeminars}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Participants:</span>
              <span className="stat-value">{seminarStats.totalParticipants}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Compliance Rate:</span>
              <span className="stat-value">{seminarStats.complianceRate}%</span>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Faculty by Department</h3>
            <div className="chart-placeholder">
              {Object.entries(facultyStats.departmentBreakdown).map(([dept, count]) => (
                <div key={dept} className="chart-bar">
                  <span className="chart-label">{dept}:</span>
                  <div className="chart-bar-fill" style={{width: `${(count / facultyStats.totalFaculty) * 100}%`}}></div>
                  <span className="chart-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Seminar Compliance</h3>
            <div className="compliance-meter">
              <div className="compliance-fill" style={{width: `${seminarStats.complianceRate}%`}}></div>
              <span className="compliance-text">{seminarStats.complianceRate}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFacultyReports = () => (
    <div className="faculty-reports">
      <div className="report-controls">
        <div className="control-group">
          <label>Faculty:</label>
          <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
            <option value="all">All Faculty</option>
            {facultyData.map(faculty => (
              <option key={faculty._id} value={faculty._id}>
                {faculty.firstName} {faculty.lastName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
          />
        </div>

        <div className="control-group">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="summary">Portfolio Summary</option>
            <option value="activities">Faculty Activities</option>
            <option value="performance">Performance Report</option>
          </select>
        </div>

        <button 
          className="btn-primary"
          onClick={() => generatePDFReport(facultyData, `faculty-${reportType}-report`)}
        >
          Generate PDF Report
        </button>
      </div>

      <div className="faculty-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Email</th>
              <th>Status</th>
              <th>Seminars Attended</th>
              <th>Courses Assigned</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {facultyData.map(faculty => {
              const facultySeminars = seminarData.filter(seminar => 
                seminar.participants?.includes(faculty._id)
              ).length;
              
              return (
                <tr key={faculty._id}>
                  <td>{faculty.firstName} {faculty.lastName}</td>
                  <td>{faculty.department}</td>
                  <td>{faculty.email}</td>
                  <td>
                    <span className={`status-badge ${faculty.isActive ? 'active' : 'inactive'}`}>
                      {faculty.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{facultySeminars}</td>
                  <td>0</td> {/* TODO: Implement course assignments count */}
                  <td>{new Date(faculty.updatedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSeminarReports = () => (
    <div className="seminar-reports">
      <div className="report-controls">
        <button 
          className="btn-primary"
          onClick={() => generatePDFReport(seminarData, 'seminar-participation-report')}
        >
          Export Seminar Participation PDF
        </button>
      </div>

      <div className="seminar-table">
        <table>
          <thead>
            <tr>
              <th>Seminar Title</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Department</th>
              <th>Compliance Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seminarData.map(seminar => (
              <tr key={seminar._id}>
                <td>{seminar.title}</td>
                <td>{new Date(seminar.date).toLocaleDateString()}</td>
                <td>{seminar.participants?.length || 0}</td>
                <td>{seminar.department || 'N/A'}</td>
                <td>
                  <div className="compliance-indicator">
                    <div className="compliance-bar" style={{
                      width: `${Math.min(100, (seminar.participants?.length || 0) / facultyData.length * 100)}%`
                    }}></div>
                    <span>{Math.round(Math.min(100, (seminar.participants?.length || 0) / facultyData.length * 100))}%</span>
                  </div>
                </td>
                <td>
                  <button className="btn-small btn-view">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading reports data...</div>;
  }

  return (
    <div className="reports-analytics-tab">
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}
          onClick={() => setActiveTab('faculty')}
        >
          Faculty Reports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'seminars' ? 'active' : ''}`}
          onClick={() => setActiveTab('seminars')}
        >
          Seminar Reports
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'faculty' && renderFacultyReports()}
        {activeTab === 'seminars' && renderSeminarReports()}
      </div>
    </div>
  );
};

export default ReportsAnalyticsTab;
