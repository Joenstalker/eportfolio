import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './EnhancedClassManagement.css';

const EnhancedClassManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  
  // Form states
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    year: '',
    section: ''
  });
  
  const [gradeForm, setGradeForm] = useState({
    type: 'exam',
    name: '',
    score: '',
    maxScore: '',
    weight: ''
  });

  // ==================== EMAIL VALIDATION ====================
  
  const isValidEmailDomain = (email) => {
    if (!email || email.trim() === '') return true; // Email is optional for students
    const trimmedEmail = email.trim().toLowerCase();
    return trimmedEmail.endsWith('@gmail.com') || trimmedEmail.endsWith('@student.buksu.edu.ph');
  };

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch students when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchStudents();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses/faculty', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Swal.fire('Error', 'Failed to fetch courses', 'error');
    }
  };

  const fetchStudents = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Swal.fire('Error', 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentForm)
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Student added successfully', 'success');
        setShowAddStudentModal(false);
        setStudentForm({
          studentId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          year: '',
          section: ''
        });
        fetchStudents();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to add student', 'error');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      Swal.fire('Error', 'Failed to add student', 'error');
    }
  };

  const handleUpdateStudent = async (studentId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}/update/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Student updated successfully', 'success');
        fetchStudents();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to update student', 'error');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      Swal.fire('Error', 'Failed to update student', 'error');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will remove the student from the class',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    });
    
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/teaching/class-list/${selectedCourse}/delete/${studentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          Swal.fire('Success', 'Student removed successfully', 'success');
          fetchStudents();
        } else {
          const error = await response.json();
          Swal.fire('Error', error.message || 'Failed to remove student', 'error');
        }
      } catch (error) {
        console.error('Error removing student:', error);
        Swal.fire('Error', 'Failed to remove student', 'error');
      }
    }
  };

  const handleAddGrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}/grades/${selectedStudent._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gradeForm)
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Grade added successfully', 'success');
        setShowGradeModal(false);
        setGradeForm({
          type: 'exam',
          name: '',
          score: '',
          maxScore: '',
          weight: ''
        });
        fetchStudents();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to add grade', 'error');
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      Swal.fire('Error', 'Failed to add grade', 'error');
    }
  };

  const handleRecordAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId,
        date: attendanceDate,
        status,
        recordedBy: JSON.parse(localStorage.getItem('user')).id
      }));
      
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendance: attendanceRecords })
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Attendance recorded successfully', 'success');
        setShowAttendanceModal(false);
        setAttendanceData({});
        fetchStudents();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to record attendance', 'error');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      Swal.fire('Error', 'Failed to record attendance', 'error');
    }
  };

  const generatePDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${selectedCourse}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `class-list-${selectedCourse}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        Swal.fire('Error', 'Failed to generate PDF', 'error');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    }
  };

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'id':
          return a.studentId.localeCompare(b.studentId);
        case 'grade':
          return (b.averageGrade || 0) - (a.averageGrade || 0);
        case 'attendance':
          return (b.attendanceRate || 0) - (a.attendanceRate || 0);
        default:
          return 0;
      }
    });

  const getClassStatistics = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.isActive).length;
    const averageGrade = students.reduce((acc, s) => acc + (s.averageGrade || 0), 0) / totalStudents || 0;
    const averageAttendance = students.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / totalStudents || 0;
    
    return {
      totalStudents,
      activeStudents,
      averageGrade: averageGrade.toFixed(1),
      averageAttendance: averageAttendance.toFixed(1)
    };
  };

  const stats = getClassStatistics();

  return (
    <div className="enhanced-class-management">
      <div className="dashboard-header">
        <h2>Enhanced Class Management</h2>
        <p>Manage your classes, students, grades, and attendance</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
          Students
        </button>
        <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          Attendance
        </button>
        <button className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => setActiveTab('grades')}>
          Grades
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
      </div>

      {/* Course Selection */}
      <div className="course-selection">
        <label>Select Course:</label>
        <select value={selectedCourse || ''} onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="">Choose a course...</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.courseCode} - {course.courseName}
            </option>
          ))}
        </select>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && selectedCourse && (
        <div className="overview-tab">
          <div className="class-info">
            <h3>Class Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Course:</label>
                <span>{courses.find(c => c._id === selectedCourse)?.courseName}</span>
              </div>
              <div className="info-item">
                <label>Code:</label>
                <span>{courses.find(c => c._id === selectedCourse)?.courseCode}</span>
              </div>
              <div className="info-item">
                <label>Semester:</label>
                <span>{courses.find(c => c._id === selectedCourse)?.semester}</span>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <h3>Class Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Total Students</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.activeStudents}</div>
                  <div className="stat-label">Active Students</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.averageGrade}%</div>
                  <div className="stat-label">Average Grade</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.averageAttendance}%</div>
                  <div className="stat-label">Attendance Rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => setShowAddStudentModal(true)}>
                <span className="btn-icon">➕</span>
                Add Student
              </button>
              <button className="action-btn" onClick={() => setShowAttendanceModal(true)}>
                <span className="btn-icon">📝</span>
                Record Attendance
              </button>
              <button className="action-btn" onClick={generatePDF}>
                <span className="btn-icon">📄</span>
                Generate Class List PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && selectedCourse && (
        <div className="students-tab">
          <div className="tab-header">
            <h3>Students Management</h3>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => setShowAddStudentModal(true)}>
                Add Student
              </button>
              <button className="btn-secondary" onClick={generatePDF}>
                Export PDF
              </button>
            </div>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                <option value="name">Sort by Name</option>
                <option value="id">Sort by ID</option>
                <option value="grade">Sort by Grade</option>
                <option value="attendance">Sort by Attendance</option>
              </select>
            </div>
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                Grid
              </button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading students...</p>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No students found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="students-grid">
              {filteredAndSortedStudents.map(student => (
                <div key={student._id} className="student-card">
                  <div className="card-header">
                    <div className="student-avatar">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="student-info">
                      <h4>{student.firstName} {student.lastName}</h4>
                      <p>{student.studentId}</p>
                    </div>
                    <div className={`status-badge ${student.isActive ? 'active' : 'inactive'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="student-details">
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{student.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phone:</span>
                        <span className="value">{student.phone || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Year/Section:</span>
                        <span className="value">{student.year} - {student.section}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Average Grade:</span>
                        <span className="value">{student.averageGrade || 'N/A'}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Attendance:</span>
                        <span className="value">{student.attendanceRate || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button className="btn-edit" onClick={() => setSelectedStudent(student)}>
                      Edit
                    </button>
                    <button className="btn-grade" onClick={() => {
                      setSelectedStudent(student);
                      setShowGradeModal(true);
                    }}>
                      Add Grade
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteStudent(student._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="students-list">
              <div className="list-header">
                <div>Name</div>
                <div>ID</div>
                <div>Email</div>
                <div>Year/Section</div>
                <div>Avg Grade</div>
                <div>Attendance</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredAndSortedStudents.map(student => (
                <div key={student._id} className="list-item">
                  <div className="student-name">
                    <div className="avatar">{student.firstName.charAt(0)}{student.lastName.charAt(0)}</div>
                    <span>{student.firstName} {student.lastName}</span>
                  </div>
                  <div>{student.studentId}</div>
                  <div>{student.email}</div>
                  <div>{student.year} - {student.section}</div>
                  <div>{student.averageGrade || 'N/A'}%</div>
                  <div>{student.attendanceRate || 'N/A'}%</div>
                  <div>
                    <span className={`status-badge ${student.isActive ? 'active' : 'inactive'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => setSelectedStudent(student)}>Edit</button>
                    <button className="btn-grade" onClick={() => {
                      setSelectedStudent(student);
                      setShowGradeModal(true);
                    }}>Grade</button>
                    <button className="btn-delete" onClick={() => handleDeleteStudent(student._id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && selectedCourse && (
        <div className="attendance-tab">
          <div className="tab-header">
            <h3>Attendance Management</h3>
            <button className="btn-primary" onClick={() => setShowAttendanceModal(true)}>
              Record Attendance
            </button>
          </div>

          <div className="attendance-overview">
            <div className="attendance-stats">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.averageAttendance}%</div>
                  <div className="stat-label">Class Attendance Rate</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{Math.round(stats.totalStudents * stats.averageAttendance / 100)}</div>
                  <div className="stat-label">Students Present Today</div>
                </div>
              </div>
            </div>
          </div>

          <div className="attendance-history">
            <h4>Recent Attendance Records</h4>
            <div className="attendance-list">
              {students.slice(0, 10).map(student => (
                <div key={student._id} className="attendance-item">
                  <div className="student-info">
                    <div className="avatar">{student.firstName.charAt(0)}{student.lastName.charAt(0)}</div>
                    <span>{student.firstName} {student.lastName}</span>
                  </div>
                  <div className="attendance-rate">
                    <span>{student.attendanceRate || 0}%</span>
                    <div className="attendance-bar">
                      <div className="attendance-fill" style={{ width: `${student.attendanceRate || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && selectedCourse && (
        <div className="grades-tab">
          <div className="tab-header">
            <h3>Grade Management</h3>
          </div>

          <div className="grade-overview">
            <div className="grade-stats">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.averageGrade}%</div>
                  <div className="stat-label">Class Average</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{students.filter(s => (s.averageGrade || 0) >= 90).length}</div>
                  <div className="stat-label">High Performers</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grade-distribution">
            <h4>Grade Distribution</h4>
            <div className="distribution-bars">
              <div className="grade-range">
                <span>A (90-100)</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${(students.filter(s => (s.averageGrade || 0) >= 90).length / students.length) * 100}%` }}></div>
                </div>
                <span>{students.filter(s => (s.averageGrade || 0) >= 90).length}</span>
              </div>
              <div className="grade-range">
                <span>B (80-89)</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${(students.filter(s => (s.averageGrade || 0) >= 80 && (s.averageGrade || 0) < 90).length / students.length) * 100}%` }}></div>
                </div>
                <span>{students.filter(s => (s.averageGrade || 0) >= 80 && (s.averageGrade || 0) < 90).length}</span>
              </div>
              <div className="grade-range">
                <span>C (70-79)</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${(students.filter(s => (s.averageGrade || 0) >= 70 && (s.averageGrade || 0) < 80).length / students.length) * 100}%` }}></div>
                </div>
                <span>{students.filter(s => (s.averageGrade || 0) >= 70 && (s.averageGrade || 0) < 80).length}</span>
              </div>
              <div className="grade-range">
                <span>D (60-69)</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${(students.filter(s => (s.averageGrade || 0) >= 60 && (s.averageGrade || 0) < 70).length / students.length) * 100}%` }}></div>
                </div>
                <span>{students.filter(s => (s.averageGrade || 0) >= 60 && (s.averageGrade || 0) < 70).length}</span>
              </div>
              <div className="grade-range">
                <span>F (Below 60)</span>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${(students.filter(s => (s.averageGrade || 0) < 60).length / students.length) * 100}%` }}></div>
                </div>
                <span>{students.filter(s => (s.averageGrade || 0) < 60).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && selectedCourse && (
        <div className="analytics-tab">
          <h3>Class Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Performance Trends</h4>
              <div className="trend-chart">
                <p>Grade performance over time visualization would go here</p>
              </div>
            </div>
            <div className="analytics-card">
              <h4>Attendance Patterns</h4>
              <div className="pattern-chart">
                <p>Attendance patterns visualization would go here</p>
              </div>
            </div>
            <div className="analytics-card">
              <h4>Student Engagement</h4>
              <div className="engagement-chart">
                <p>Student engagement metrics would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Student</h3>
              <button className="close-btn" onClick={() => setShowAddStudentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm({...studentForm, studentId: e.target.value})}
                    placeholder="Enter student ID"
                  />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({...studentForm, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({...studentForm, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                    placeholder="Enter email"
                    className={studentForm.email && !isValidEmailDomain(studentForm.email) ? 'invalid' : ''}
                  />
                  {studentForm.email && !isValidEmailDomain(studentForm.email) && (
                    <small className="error-message">
                      Only @gmail.com and @student.buksu.edu.ph email domains are allowed
                    </small>
                  )}
                  <small>Only @gmail.com and @student.buksu.edu.ph emails are accepted</small>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({...studentForm, year: e.target.value})}
                    placeholder="Enter year"
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({...studentForm, section: e.target.value})}
                    placeholder="Enter section"
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddStudent}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Grade for {selectedStudent.firstName} {selectedStudent.lastName}</h3>
              <button className="close-btn" onClick={() => setShowGradeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Grade Type</label>
                  <select
                    value={gradeForm.type}
                    onChange={(e) => setGradeForm({...gradeForm, type: e.target.value})}
                  >
                    <option value="exam">Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="participation">Participation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Grade Name</label>
                  <input
                    type="text"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({...gradeForm, name: e.target.value})}
                    placeholder="e.g., Midterm Exam"
                  />
                </div>
                <div className="form-group">
                  <label>Score</label>
                  <input
                    type="number"
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                    placeholder="Enter score"
                  />
                </div>
                <div className="form-group">
                  <label>Maximum Score</label>
                  <input
                    type="number"
                    value={gradeForm.maxScore}
                    onChange={(e) => setGradeForm({...gradeForm, maxScore: e.target.value})}
                    placeholder="Enter maximum score"
                  />
                </div>
                <div className="form-group">
                  <label>Weight (%)</label>
                  <input
                    type="number"
                    value={gradeForm.weight}
                    onChange={(e) => setGradeForm({...gradeForm, weight: e.target.value})}
                    placeholder="Enter weight percentage"
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowGradeModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddGrade}>Add Grade</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Attendance</h3>
              <button className="close-btn" onClick={() => setShowAttendanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
              <div className="attendance-list">
                <h4>Mark Attendance for All Students</h4>
                {students.map(student => (
                  <div key={student._id} className="attendance-item">
                    <div className="student-info">
                      <span>{student.firstName} {student.lastName}</span>
                      <span className="student-id">{student.studentId}</span>
                    </div>
                    <div className="attendance-options">
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="present"
                          onChange={(e) => setAttendanceData({...attendanceData, [student._id]: e.target.value})}
                        />
                        Present
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="absent"
                          onChange={(e) => setAttendanceData({...attendanceData, [student._id]: e.target.value})}
                        />
                        Absent
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`attendance-${student._id}`}
                          value="late"
                          onChange={(e) => setAttendanceData({...attendanceData, [student._id]: e.target.value})}
                        />
                        Late
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRecordAttendance}>Record Attendance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedClassManagement;
