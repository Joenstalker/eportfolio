import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [facultyData, setFacultyData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [reportType, setReportType] = useState('summary')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadsList, setUploadsList] = useState([])
  const [newFaculty, setNewFaculty] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    role: 'faculty'
  })
  const [editFaculty, setEditFaculty] = useState({})
  const [statusFaculty, setStatusFaculty] = useState({})

  // Course Management State
  const [courses, setCourses] = useState([])
  const [courseLoading, setCourseLoading] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showEditCourseModal, setShowEditCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    credits: 3,
    department: '',
    semester: 'Fall 2024',
    maxStudents: 30,
    prerequisites: []
  })
  const [editCourse, setEditCourse] = useState({})
  const [courseAssignments, setCourseAssignments] = useState([])
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    facultyId: '',
    courseId: '',
    semester: 'Fall 2024',
    section: 'A'
  })

  // Lock state - tracks which courses are locked in the UI
  const [courseLocks, setCourseLocks] = useState({})

  // Handler functions
  const handleUploadSchedule = () => {
    if (!selectedFile) return;
    
    for (let i = 0; i <= 100; i += 10) {
      setTimeout(() => setUploadProgress(i), i * 50)
    }
    setTimeout(() => {
      setUploadProgress(0)
      setSelectedFile(null)
      setSuccessMessage('Schedule uploaded successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    }, 550)
  }

  const handleGenerateReport = () => {
    setSuccessMessage(`${reportType} report generated successfully!`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // ==================== BACKEND 2PL API FUNCTIONS ====================
  
  const lockCourseOnBackend = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ durationMinutes: 15 })
      });

      if (response.status === 423) {
        // 423 = Locked
        const errorData = await response.json();
        throw new Error(`Locked by ${errorData.lockedBy?.name || 'another admin'}`);
      }

      if (!response.ok) {
        throw new Error('Failed to acquire lock');
      }

      const data = await response.json();
      
      // Update local lock state
      setCourseLocks(prev => ({
        ...prev,
        [courseId]: {
          isLocked: true,
          lockedByMe: true,
          lockedBy: user?.name || user?.firstName || 'You',
          expiresAt: data.lock?.expiresAt || new Date(Date.now() + 15 * 60 * 1000)
        }
      }));
      
      return { success: true, lock: data.lock };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const unlockCourseOnBackend = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to release lock');
      }

      // Update local lock state
      setCourseLocks(prev => ({
        ...prev,
        [courseId]: {
          isLocked: false,
          lockedByMe: false,
          lockedBy: null
        }
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const checkCourseLockStatus = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/lock-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local lock state
        if (data.isLocked) {
          setCourseLocks(prev => ({
            ...prev,
            [courseId]: {
              isLocked: true,
              lockedByMe: data.lock?.isLockedByMe || false,
              lockedBy: data.lock?.lockedBy || 'Another admin',
              expiresAt: data.lock?.expiresAt
            }
          }));
        } else {
          setCourseLocks(prev => ({
            ...prev,
            [courseId]: {
              isLocked: false,
              lockedByMe: false,
              lockedBy: null
            }
          }));
        }
        
        return data;
      }
      return { isLocked: false };
    } catch (error) {
      console.error('Error checking lock status:', error);
      return { isLocked: false };
    }
  };

  // ==================== COURSE MANAGEMENT API FUNCTIONS ====================
  
  const fetchCourses = async () => {
  setCourseLoading(true);
  try {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token); // Add this line
    
    if (!token) {
      console.error('No token found in localStorage');
      throw new Error('No authentication token found');
    }

    const response = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status); // Add this line
    
    if (response.ok) {
      const data = await response.json();
      setCourses(data);
    } else {
      throw new Error('Failed to fetch courses');
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    setCourses([]);
  } finally {
    setCourseLoading(false);
  }
};

  const fetchCourseAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/course-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourseAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      setCourseAssignments([]);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.courseCode || !newCourse.courseName || !newCourse.department) {
      setErrorMessage('Please fill all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCourse)
      });

      if (response.ok) {
        const result = await response.json();
        setCourses(prev => [...prev, result]);
        setShowCourseModal(false);
        setNewCourse({
          courseCode: '',
          courseName: '',
          description: '',
          credits: 3,
          department: '',
          semester: 'Fall 2024',
          maxStudents: 30,
          prerequisites: []
        });
        setSuccessMessage('Course added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error adding course');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      setErrorMessage('Error adding course');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleEditCourseClick = async (course) => {
    // First check lock status
    const lockStatus = await checkCourseLockStatus(course._id);
    
    if (lockStatus.isLocked) {
      if (lockStatus.lock?.isLockedByMe) {
        // Already locked by me, proceed to edit
        setSelectedCourse(course);
        setEditCourse({ ...course });
        setShowEditCourseModal(true);
        setSuccessMessage(`You already have the lock for ${course.courseCode}`);
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      } else {
        // Locked by someone else
        setErrorMessage(
          `This course is currently locked by ${lockStatus.lock?.lockedBy || 'another admin'}. ` +
          `Please try again later.`
        );
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
    }
    
    // Try to acquire lock
    setErrorMessage('');
    const lockResult = await lockCourseOnBackend(course._id);
    
    if (lockResult.success) {
      setSelectedCourse(course);
      setEditCourse({ ...course });
      setShowEditCourseModal(true);
      setSuccessMessage(`Lock acquired for editing ${course.courseCode}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(`Failed to acquire lock: ${lockResult.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${selectedCourse._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editCourse)
      });

      if (response.status === 423) {
        // Lost the lock
        const error = await response.json();
        throw new Error(`Lock expired or lost: ${error.message}`);
      }

      if (response.ok) {
        const result = await response.json();
        setCourses(prev => 
          prev.map(c => c._id === selectedCourse._id ? result.course : c)
        );
        setShowEditCourseModal(false);
        
        // Release lock after successful save
        await unlockCourseOnBackend(selectedCourse._id);
        
        setSelectedCourse(null);
        setEditCourse({});
        setSuccessMessage('Course updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error updating course');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCancelEditCourse = async () => {
    if (selectedCourse) {
      // Release lock on backend
      await unlockCourseOnBackend(selectedCourse._id);
    }
    setShowEditCourseModal(false);
    setSelectedCourse(null);
    setEditCourse({});
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete ${course.courseCode} - ${course.courseName}?`)) return;

    try {
      // First acquire lock
      const lockResult = await lockCourseOnBackend(course._id);
      if (!lockResult.success) {
        setErrorMessage(`Cannot delete: ${lockResult.message}`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${course._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCourses(prev => prev.filter(c => c._id !== course._id));
        
        // Clean up lock state
        setCourseLocks(prev => {
          const newLocks = { ...prev };
          delete newLocks[course._id];
          return newLocks;
        });
        
        setSuccessMessage('Course deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error deleting course');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      setErrorMessage('Error deleting course');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleAssignFaculty = async () => {
    if (!newAssignment.facultyId || !newAssignment.courseId) {
      setErrorMessage('Please select both faculty and course');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/course-assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAssignment)
      });

      if (response.ok) {
        const result = await response.json();
        setCourseAssignments(prev => [...prev, result.assignment]);
        setShowAssignmentModal(false);
        setNewAssignment({
          facultyId: '',
          courseId: '',
          semester: 'Fall 2024',
          section: 'A'
        });
        setSuccessMessage('Faculty assigned to course successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error assigning faculty');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error assigning faculty:', error);
      setErrorMessage('Error assigning faculty');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleAssignFacultyClick = () => {
    setShowAssignmentModal(true);
  };

  // Helper functions for lock status
  const isCourseLockedByAnotherAdmin = (courseId) => {
    const lock = courseLocks[courseId];
    return lock?.isLocked && !lock?.lockedByMe;
  };

  const getCourseLockStatus = (courseId) => {
    return courseLocks[courseId] || { isLocked: false, lockedByMe: false, lockedBy: null };
  };

  // Dashboard content
  const dashboardContent = {
    dashboard: {
      title: 'Admin Dashboard',
      content: (
        <div className="dashboard-content enhanced">
          <div className="welcome-banner admin-banner">
            <div className="banner-content">
              <h2>System Administration Panel</h2>
              <p>Welcome back, {user?.name || user?.firstName || 'Admin'}. Manage the entire e-portfolio system.</p>
            </div>
            <div className="banner-stats">
              <div className="mini-stat">
                <span className="mini-label">System Status</span>
                <span className="mini-value status-online">🟢 Online</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Current Admin</span>
                <span className="mini-value">{user?.email || user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
          
          <div className="admin-stats">
            <h3>System Overview</h3>
            <div className="stats-grid">
              <div className="stat-card admin-stat faculty-count">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h4>Total Faculty</h4>
                  <div className="stat-number">{facultyData.length}</div>
                  <p>Registered members</p>
                </div>
              </div>
              <div className="stat-card admin-stat active-faculty">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>Active Faculty</h4>
                  <div className="stat-number">
                    {facultyData.filter(f => f.status === 'active').length}
                  </div>
                  <p>Currently active</p>
                </div>
              </div>
              <div className="stat-card admin-stat departments">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <h4>Departments</h4>
                  <div className="stat-number">
                    {[...new Set(facultyData.map(f => f.department).filter(d => d))].length || 0}
                  </div>
                  <p>Different departments</p>
                </div>
              </div>
              <div className="stat-card admin-stat courses-count">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h4>Total Courses</h4>
                  <div className="stat-number">{courses.length}</div>
                  <p>Available courses</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lock-status-panel">
            <h4>🔒 Backend 2PL Concurrency Control</h4>
            <div className="lock-stats">
              <div className="lock-stat">
                <span className="lock-stat-label">Active Locks:</span>
                <span className="lock-stat-value">
                  {Object.values(courseLocks).filter(lock => lock.isLocked).length}
                </span>
              </div>
              <div className="lock-stat">
                <span className="lock-stat-label">Your Locks:</span>
                <span className="lock-stat-value">
                  {Object.values(courseLocks).filter(lock => lock.lockedByMe).length}
                </span>
              </div>
              <div className="lock-stat">
                <span className="lock-stat-label">Current Admin:</span>
                <span className="lock-stat-value">{user?.email || user?.name || 'Admin'}</span>
              </div>
            </div>
            <div className="lock-note">
              <small>Locks are stored in database and shared across all admin users</small>
            </div>
          </div>
        </div>
      )
    },

    courses: {
      title: 'Course Management (2PL Protected)',
      content: (
        <div className="course-management">
          <div className="section-header">
            <h3>Course Catalog</h3>
            <div className="header-actions">
              <button 
                className="btn-primary"
                onClick={() => setShowCourseModal(true)}
              >
                + Add Course
              </button>
              <button 
                className="btn-secondary"
                onClick={handleAssignFacultyClick}
              >
                📋 Assign Faculty
              </button>
            </div>
          </div>

          <div className="2pl-info-banner">
            <div className="2pl-info-content">
              <strong>🔒 Backend Two-Phase Locking Active:</strong> 
              <span> When you edit a course, it gets locked exclusively in the database. Other admins cannot edit it until you save or cancel.</span>
            </div>
            <div className="current-admin-info">
              You are logged in as: <strong>{user?.email || user?.name || 'Admin'}</strong>
            </div>
          </div>

          {courseLoading ? (
            <div className="loading-state">Loading courses...</div>
          ) : (
            <div className="courses-container">
              <div className="courses-grid">
                {courses.map((course) => {
                  const lockInfo = getCourseLockStatus(course._id);
                  const isLocked = lockInfo.isLocked;
                  const isLockedByMe = lockInfo.lockedByMe;
                  const isLockedByOther = isLocked && !isLockedByMe;
                  
                  return (
                    <div key={course._id} className={`course-card ${isLocked ? 'locked' : ''} ${isLockedByMe ? 'locked-by-me' : ''}`}>
                      <div className="course-header">
                        <h4>{course.courseCode}</h4>
                        <div className="course-status-group">
                          <span className={`course-status ${course.status || 'active'}`}>
                            {course.status || 'active'}
                          </span>
                          {isLocked && (
                            <span className={`lock-indicator ${isLockedByMe ? 'my-lock' : 'other-lock'}`}>
                              {isLockedByMe ? '🔒 Your Lock' : `🔐 Locked by ${lockInfo.lockedBy}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="course-body">
                        <h5>{course.courseName}</h5>
                        <p className="course-description">{course.description}</p>
                        <div className="course-details">
                          <div className="course-detail">
                            <span className="detail-label">Department:</span>
                            <span className="detail-value">{course.department}</span>
                          </div>
                          <div className="course-detail">
                            <span className="detail-label">Credits:</span>
                            <span className="detail-value">{course.credits}</span>
                          </div>
                          <div className="course-detail">
                            <span className="detail-label">Semester:</span>
                            <span className="detail-value">{course.semester}</span>
                          </div>
                          <div className="course-detail">
                            <span className="detail-label">Max Students:</span>
                            <span className="detail-value">{course.maxStudents}</span>
                          </div>
                        </div>
                      </div>
                      <div className="course-actions">
                        <button 
                          className={`btn-action edit ${isLockedByOther ? 'disabled' : ''}`}
                          onClick={() => handleEditCourseClick(course)}
                          disabled={isLockedByOther}
                          title={isLockedByOther ? `Currently being edited by ${lockInfo.lockedBy}` : 'Edit course'}
                        >
                          {isLockedByOther ? '🔒 Locked' : 'Edit'}
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDeleteCourse(course)}
                          disabled={isLockedByOther}
                          title={isLockedByOther ? "Cannot delete - course is locked" : "Delete course"}
                        >
                          Delete
                        </button>
                      </div>
                      
                      {isLockedByOther && (
                        <div className="lock-warning">
                          <span className="warning-icon">⚠️</span>
                          <span>This course is currently being edited by {lockInfo.lockedBy}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {courses.length === 0 && (
                <div className="empty-state">
                  No courses found. Click "Add Course" to create the first one.
                </div>
              )}
            </div>
          )}

          <div className="assignments-section">
            <h4>Current Course Assignments</h4>
            <div className="assignments-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Faculty</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courseAssignments.map((assignment) => {
                    const course = courses.find(c => c._id === assignment.courseId);
                    const faculty = facultyData.find(f => f._id === assignment.facultyId);
                    const isCourseLocked = isCourseLockedByAnotherAdmin(assignment.courseId);
                    
                    return (
                      <tr key={assignment._id}>
                        <td>
                          {course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course'}
                          {isCourseLocked && <span className="table-lock-indicator" title="Course is locked"> 🔒</span>}
                        </td>
                        <td>{faculty ? faculty.name : 'Unknown Faculty'}</td>
                        <td>{assignment.semester}</td>
                        <td>{assignment.section}</td>
                        <td>
                          <button 
                            className="btn-action delete"
                            disabled={isCourseLocked}
                            title={isCourseLocked ? "Cannot remove - course is locked" : "Remove assignment"}
                          >
                            {isCourseLocked ? 'Locked' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {courseAssignments.length === 0 && (
                <div className="empty-state">
                  No course assignments found. Assign faculty to courses to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },

    faculty: {
      title: 'Faculty Management',
      content: (
        <div className="faculty-management">
          <div className="section-header">
            <h3>Faculty Members</h3>
            <button 
              className="add-faculty-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Faculty
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading faculty data...</div>
          ) : (
            <div className="faculty-table-container">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyData.map((faculty) => (
                    <tr key={faculty._id} className={faculty.status === 'inactive' ? 'inactive' : ''}>
                      <td>{faculty.name}</td>
                      <td>{faculty.email}</td>
                      <td>{faculty.department}</td>
                      <td>{faculty.role}</td>
                      <td>
                        <span className={`status-badge ${faculty.status}`}>
                          {faculty.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditClick(faculty)}
                          >
                            Edit
                          </button>
                          <button 
                            className="status-btn"
                            onClick={() => handleStatusClick(faculty)}
                          >
                            Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {facultyData.length === 0 && (
                <div className="empty-state">
                  No faculty members found.
                </div>
              )}
            </div>
          )}
        </div>
      )
    },

    assignments: {
      title: 'Class Assignment Control',
      content: (
        <div className="class-assignments">
          <div className="section-header">
            <h3>Class Schedule Upload</h3>
            <span className="count-badge">Upload final class schedules</span>
          </div>

          <div className="assignments-container">
            <div className="upload-section">
              <div className="upload-box">
                <div className="upload-icon">📄</div>
                <h4>Upload Class Schedule</h4>
                <p>Upload a final class schedule (CSV or Excel format)</p>
                <input 
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file-input"
                  id="schedule-upload"
                />
                <label htmlFor="schedule-upload" className="file-label">
                  Choose File
                </label>
                {selectedFile && (
                  <div className="file-selected">
                    <span>✅ {selectedFile.name}</span>
                  </div>
                )}
                <button 
                  className="btn-upload"
                  onClick={handleUploadSchedule}
                  disabled={!selectedFile || uploadProgress > 0}
                >
                  {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Schedule'}
                </button>
                {uploadProgress > 0 && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                )}
              </div>
            </div>

            <div className="schedules-section">
              <h4>Recent Uploads</h4>
              <div className="schedules-list">
                {uploadsList.length === 0 ? (
                  <div className="empty-state">No recent uploads found.</div>
                ) : (
                  uploadsList.map((u, idx) => (
                    <div key={idx} className="schedule-item">
                      <div className="schedule-info">
                        <h5>{u.fileName || u.title || 'Untitled'}</h5>
                        <p>{u.faculty || 'Unknown'} • {u.uploadedAt ? new Date(u.uploadedAt).toLocaleDateString() : ''}</p>
                      </div>
                      {u.fileUrl ? (
                        <a className="btn-action view" href={`http://localhost:5000${u.fileUrl}`} target="_blank" rel="noopener noreferrer">👁️ View</a>
                      ) : (
                        <button className="btn-action view" disabled>No File</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },

    reports: {
      title: 'Reports and Analytics',
      content: (
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
                  <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="report-select">
                    <option value="summary">Faculty Portfolio Summary</option>
                    <option value="detailed">Detailed Faculty Report</option>
                    <option value="department">Department Statistics</option>
                    <option value="activity">Activity Log Report</option>
                    <option value="courses">Course Catalog Report</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>Date Range</label>
                  <input type="date" className="report-input" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="option-group">
                  <label>Format</label>
                  <div className="format-buttons">
                    <button className="format-btn pdf">📄 PDF</button>
                    <button className="format-btn excel">📊 Excel</button>
                    <button className="format-btn csv">📋 CSV</button>
                  </div>
                </div>

                <button className="btn-primary generate-btn" onClick={handleGenerateReport}>
                  🔄 Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  const adminMenuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
    { id: 'faculty', label: 'FACULTY MANAGEMENT', icon: '👨‍🏫' },
    { id: 'courses', label: 'COURSE MANAGEMENT', icon: '📚' },
    { id: 'assignments', label: 'CLASS ASSIGNMENTS', icon: '📅' },
    { id: 'reports', label: 'REPORTS', icon: '📋' },
    { id: 'analytics', label: 'SYSTEM ANALYTICS', icon: '📈' },
    { id: 'settings', label: 'SYSTEM SETTINGS', icon: '⚙️' }
  ]

  const fetchFacultyData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFacultyData(data);
      } else {
        throw new Error('Failed to fetch faculty data');
      }
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      setFacultyData([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchUploads = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/admin/uploads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setUploadsList(Array.isArray(data.uploads) ? data.uploads : (data.uploads || []))
      }
    } catch (err) {
      console.error('Error fetching uploads:', err)
      setUploadsList([]);
    }
  }

  // Auto-refresh lock statuses when on courses section
  useEffect(() => {
    const refreshLocks = async () => {
      if (activeSection === 'courses' && courses.length > 0) {
        // Refresh lock status for visible courses
        await Promise.all(
          courses.slice(0, 10).map(course => 
            checkCourseLockStatus(course._id)
          )
        );
      }
    };

    const interval = setInterval(refreshLocks, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [activeSection, courses]);

  useEffect(() => {
    fetchFacultyData()
    fetchUploads()
    fetchCourses()
    fetchCourseAssignments()
  }, [])

  const handleAddFaculty = async () => {
    if (!newFaculty.firstName || !newFaculty.email || !newFaculty.password || !newFaculty.department) {
      setErrorMessage('Please fill all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        firstName: newFaculty.firstName,
        lastName: newFaculty.lastName,
        email: newFaculty.email,
        password: newFaculty.password,
        department: newFaculty.department,
        role: newFaculty.role
      };

      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setFacultyData(prev => [...prev, result.user]);
        setShowAddModal(false);
        setNewFaculty({ firstName: '', lastName: '', email: '', password: '', department: '', role: 'faculty' });
        setSuccessMessage('Faculty added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error adding faculty member');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      setErrorMessage('Error adding faculty member');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }

  const handleEditClick = (faculty) => {
    setSelectedFaculty(faculty)
    setEditFaculty({ ...faculty })
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const [fn, ...lnParts] = (editFaculty.name || '').trim().split(' ');
      const payload = {
        firstName: fn || undefined,
        lastName: lnParts.join(' ') || undefined,
        email: editFaculty.email,
        department: editFaculty.department,
        role: (editFaculty.role || '').toLowerCase() === 'admin' ? 'admin' : 'faculty'
      };

      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedFaculty._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setFacultyData(prev => 
          prev.map(f => f._id === selectedFaculty._id ? result.user : f)
        );
        setShowEditModal(false);
        setSelectedFaculty(null);
        setEditFaculty({});
        setSuccessMessage('Faculty member updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error updating faculty member');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      setErrorMessage('Error updating faculty member');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }

  const handleStatusClick = (faculty) => {
    setSelectedFaculty(faculty)
    setStatusFaculty({ ...faculty })
    setShowStatusModal(true)
  }

  const handleStatusSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedFaculty._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusFaculty.status })
      });

      if (response.ok) {
        const result = await response.json();
        setFacultyData(prev => 
          prev.map(f => f._id === selectedFaculty._id ? result.user : f)
        );
        setShowStatusModal(false);
        setSelectedFaculty(null);
        setStatusFaculty({});
        setSuccessMessage('Status updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error updating status');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setErrorMessage('Error updating status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }

  const handleDeleteClick = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete ${faculty.name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${faculty._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFacultyData(prev => prev.filter(f => f._id !== faculty._id));
        setSuccessMessage('Faculty deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error deleting faculty');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      setErrorMessage('Error deleting faculty member');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }

  return (
    <div className="dashboard admin-dashboard">
      {successMessage && (
        <div className="success-notification">
          ✅ {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="error-notification">
          ❌ {errorMessage}
        </div>
      )}

      <div className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header admin-header">
          <h2>👑 Admin Portal</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {adminMenuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && (
                <span className="nav-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
            <div className="admin-info">
            <div className="admin-name">{user?.name || user?.firstName || 'Admin'}</div>
            <div className="admin-role">System Administrator</div>
          </div>
          <button 
            className="logout-btn admin-logout"
            onClick={logout}
          >
            <span className="nav-icon">🚪</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      <div className="main-content">
        <header className="content-header admin-content-header">
          <div className="header-left">
            <h1>{dashboardContent[activeSection]?.title || 'Admin Dashboard'}</h1>
            <div className="year-badge admin-badge">Admin System</div>
          </div>
          <div className="header-right">
            <div className="user-menu admin-user-menu">
              <span>System Administrator</span>
              <div className="user-role">{user?.email || ''}</div>
            </div>
          </div>
        </header>

        <main className="content-main">
          {dashboardContent[activeSection]?.content || (
            <div className="admin-coming-soon">
              <h2>Administrative Section</h2>
              <p>This administrative section is under development.</p>
            </div>
          )}
        </main>
      </div>

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Course</h3>
              <button className="close-btn" onClick={() => setShowCourseModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={newCourse.courseCode}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  value={newCourse.credits}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={newCourse.department}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={newCourse.semester}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                >
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2025">Spring 2025</option>
                  <option value="Summer 2025">Summer 2025</option>
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Students</label>
                <input
                  type="number"
                  value={newCourse.maxStudents}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCourseModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddCourse}
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => handleCancelEditCourse()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Course (Locked by You)</h3>
              <div className="modal-lock-info">
                <span className="lock-badge">🔒 Exclusive Lock Acquired</span>
              </div>
              <button className="close-btn" onClick={() => handleCancelEditCourse()}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Course Code</label>
                <input
                  type="text"
                  value={editCourse.courseCode || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={editCourse.courseName || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, courseName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editCourse.description || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  value={editCourse.credits || 3}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="6"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editCourse.department || ''}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={editCourse.semester || 'Fall 2024'}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, semester: e.target.value }))}
                >
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2025">Spring 2025</option>
                  <option value="Summer 2025">Summer 2025</option>
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Students</label>
                <input
                  type="number"
                  value={editCourse.maxStudents || 30}
                  onChange={(e) => setEditCourse(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => handleCancelEditCourse()}>
                Cancel & Release Lock
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditCourse}
              >
                Save Changes & Release Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Faculty to Course</h3>
              <button className="close-btn" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Select Faculty *</label>
                <select
                  value={newAssignment.facultyId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, facultyId: e.target.value }))}
                >
                  <option value="">Select Faculty Member</option>
                  {facultyData.filter(f => f.status === 'active').map(faculty => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.name} - {faculty.department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Course *</label>
                <select
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                >
                  <option value="">Select Course</option>
                  {courses.filter(c => c.status === 'active').map(course => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={newAssignment.semester}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, semester: e.target.value }))}
                >
                  <option value="Fall 2024">Fall 2024</option>
                  <option value="Spring 2025">Spring 2025</option>
                  <option value="Summer 2025">Summer 2025</option>
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={newAssignment.section}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAssignmentModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAssignFaculty}
              >
                Assign Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard