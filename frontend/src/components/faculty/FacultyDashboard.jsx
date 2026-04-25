import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import './FacultyDashboard.css';
import TeachingActivities from './TeachingActivities';

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
        {courses && courses.filter(course => course.isAssigned).map(course => (
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
                  console.log('Manage course:', course._id);
                }}
              >
                Manage Class
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
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

  const renderTeachingActivities = () => (
    <div className="faculty-teaching-activities">
      <TeachingActivities facultyId={user?._id} />
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
          className={`tab-btn ${activeTab === 'teaching' ? 'active' : ''}`}
          onClick={() => setActiveTab('teaching')}
        >
          👥 Teaching Activities
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'teaching' && renderTeachingActivities()}
      </div>
    </div>
  );
};

export default FacultyDashboard;
