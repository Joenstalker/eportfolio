import React, { useState, useEffect } from 'react';
import AdvancedClassManagement from './AdvancedClassManagement';
import './FacultyDashboard.css';

const FacultyDashboard = ({ user, courses }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    pendingGrades: 0,
    upcomingClasses: 0,
    averageAttendance: 0,
    recentActivity: []
  });

  // ==================== DATA FETCHING ====================
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teaching/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // ==================== RENDER FUNCTIONS ====================
  const renderOverview = () => (
    <div className="faculty-overview">
      <h3>Faculty Dashboard Overview</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h4>Total Students</h4>
            <span className="stat-value">{dashboardStats.totalStudents}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h4>Active Courses</h4>
            <span className="stat-value">{dashboardStats.activeCourses}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>Pending Grades</h4>
            <span className="stat-value">{dashboardStats.pendingGrades}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h4>Upcoming Classes</h4>
            <span className="stat-value">{dashboardStats.upcomingClasses}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h4>Avg Attendance</h4>
            <span className="stat-value">{dashboardStats.averageAttendance}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Performance Score</h4>
            <span className="stat-value">4.2/5.0</span>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h4>Recent Activity</h4>
        <div className="activity-list">
          {dashboardStats.recentActivity.length > 0 ? (
            dashboardStats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
                <span className="activity-description">{activity.description}</span>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="faculty-courses">
      <h3>My Courses</h3>
      
      <div className="courses-grid">
        {courses.filter(course => course.isAssigned).map(course => (
          <div key={course._id} className="course-card">
            <div className="course-header">
              <h4>{course.courseCode}</h4>
              <span className={`status-badge ${course.isActive ? 'active' : 'inactive'}`}>
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="course-details">
              <p className="course-name">{course.courseName}</p>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span>👥 {course.enrolledStudents || 0} students</span>
                <span>📅 {course.schedule || 'TBA'}</span>
                <span>📍 {course.venue || 'TBA'}</span>
              </div>
            </div>

            <div className="course-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  // Navigate to class management for this course
                  console.log('Manage course:', course._id);
                }}
              >
                Manage Class
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  // Generate report for this course
                  console.log('Generate report:', course._id);
                }}
              >
                📊 Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="faculty-analytics">
      <h3>Class Analytics</h3>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Student Performance</h4>
          <div className="chart-placeholder">
            <div className="performance-bars">
              <div className="performance-item">
                <span>Excellent (90-100)</span>
                <div className="bar" style={{ width: '25%', background: '#10b981' }}></div>
                <span>25%</span>
              </div>
              <div className="performance-item">
                <span>Good (80-89)</span>
                <div className="bar" style={{ width: '45%', background: '#3b82f6' }}></div>
                <span>45%</span>
              </div>
              <div className="performance-item">
                <span>Satisfactory (70-79)</span>
                <div className="bar" style={{ width: '20%', background: '#f59e0b' }}></div>
                <span>20%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Attendance Trends</h4>
          <div className="chart-placeholder">
            <div className="attendance-chart">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                <div key={day} className="attendance-day">
                  <div className="day-label">{day}</div>
                  <div className="attendance-bar" style={{ 
                    height: `${Math.random() * 40 + 60}%` 
                  }}></div>
                  <div className="attendance-value">
                    {Math.round(Math.random() * 20 + 80)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Outcome Achievement</h4>
          <div className="chart-placeholder">
            <div className="outcome-radar">
              {['Knowledge', 'Skills', 'Attitude', 'Communication', 'Teamwork'].map(outcome => (
                <div key={outcome} className="outcome-item">
                  <span className="outcome-label">{outcome}</span>
                  <div className="outcome-score">
                    {Math.round(Math.random() * 2 + 3)}/5
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Grade Distribution</h4>
          <div className="chart-placeholder">
            <div className="grade-distribution">
              <div className="grade-item">
                <span className="grade-label">A (90-100)</span>
                <span className="grade-count">15</span>
              </div>
              <div className="grade-item">
                <span className="grade-label">B (80-89)</span>
                <span className="grade-count">22</span>
              </div>
              <div className="grade-item">
                <span className="grade-label">C (70-79)</span>
                <span className="grade-count">18</span>
              </div>
              <div className="grade-item">
                <span className="grade-label">D (60-69)</span>
                <span className="grade-count">8</span>
              </div>
              <div className="grade-item">
                <span className="grade-label">F (<60)</span>
                <span className="grade-count">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="faculty-reports">
      <h3>Reports & Analytics</h3>
      
      <div className="reports-grid">
        <div className="report-card">
          <h4>📊 Class Performance Report</h4>
          <p>Generate comprehensive performance reports for your classes</p>
          <button className="btn-primary">Generate Report</button>
        </div>

        <div className="report-card">
          <h4>📋 Student Grade Summary</h4>
          <p>View and export grade summaries for all students</p>
          <button className="btn-primary">View Grades</button>
        </div>

        <div className="report-card">
          <h4>📅 Attendance Report</h4>
          <p>Generate attendance reports for specific time periods</p>
          <button className="btn-primary">Generate Report</button>
        </div>

        <div className="report-card">
          <h4>🎯 Outcome Analysis</h4>
          <p>Analyze student outcome achievement across different areas</p>
          <button className="btn-primary">View Analysis</button>
        </div>

        <div className="report-card">
          <h4>📄 Portfolio Summary</h4>
          <p>Generate portfolio summary for faculty evaluation</p>
          <button className="btn-primary">Generate Summary</button>
        </div>

        <div className="report-card">
          <h4>📈 Trend Analysis</h4>
          <p>View performance trends over time</p>
          <button className="btn-primary">View Trends</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="faculty-dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, {user.firstName}!</h2>
        <p>Here's your faculty dashboard overview</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 My Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'class-management' ? 'active' : ''}`}
          onClick={() => setActiveTab('class-management')}
        >
          👥 Class Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Reports
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'class-management' && (
          <AdvancedClassManagement user={user} courses={courses} />
        )}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  );
};

export default FacultyDashboard;
