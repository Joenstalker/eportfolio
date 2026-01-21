import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Swal from 'sweetalert2'
import './AdminDashboard.css'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import CourseManagementTab from './CourseManagementTab'
import FacultyManagementTab from './FacultyManagementTab'
import ArchivedUsersTab from './ArchivedUsersTab'
import ClassAssignmentsTab from './ClassAssignmentsTab'
import ReportsTab from './ReportsTab'
import SystemAnalyticsTab from './SystemAnalyticsTab'
import SystemSettingsTab from './SystemSettingsTab'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [facultyMenuOpen, setFacultyMenuOpen] = useState(false)
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
  const [archivedFaculty, setArchivedFaculty] = useState([])

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

  // ==================== SWEETALERT HELPER FUNCTIONS ====================
  
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

  const showWarningAlert = (message, title = 'Warning') => {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonColor: '#ff9800'
    });
  };

  // Handler functions
  const handleUploadSchedule = () => {
    if (!selectedFile) return;
    
    for (let i = 0; i <= 100; i += 10) {
      setTimeout(() => setUploadProgress(i), i * 50)
    }
    setTimeout(() => {
      setUploadProgress(0)
      setSelectedFile(null)
      showSuccessAlert('Schedule uploaded successfully!')
    }, 550)
  }

  const handleGenerateReport = () => {
    showSuccessAlert(`${reportType} report generated successfully!`)
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
      showErrorAlert('Please fill all required fields');
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
        showSuccessAlert('Course added successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error adding course');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      showErrorAlert('Error adding course');
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
        showSuccessAlert(`You already have the lock for ${course.courseCode}`);
        return;
      } else {
        // Locked by someone else
        showErrorAlert(
          `This course is currently locked by ${lockStatus.lock?.lockedBy || 'another admin'}. ` +
          `Please try again later.`
        );
        return;
      }
    }
    
    // Try to acquire lock
    const lockResult = await lockCourseOnBackend(course._id);
    
    if (lockResult.success) {
      setSelectedCourse(course);
      setEditCourse({ ...course });
      setShowEditCourseModal(true);
      showSuccessAlert(`Lock acquired for editing ${course.courseCode}`);
    } else {
      showErrorAlert(`Failed to acquire lock: ${lockResult.message}`);
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
        showSuccessAlert('Course updated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error updating course');
      }
    } catch (error) {
      showErrorAlert(error.message);
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
    const result = await Swal.fire({
      title: 'Delete Course?',
      text: `Are you sure you want to delete ${course.courseCode} - ${course.courseName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // First acquire lock
      const lockResult = await lockCourseOnBackend(course._id);
      if (!lockResult.success) {
        showErrorAlert(`Cannot delete: ${lockResult.message}`);
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
        
        showSuccessAlert('Course deleted successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error deleting course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showErrorAlert('Error deleting course');
    }
  };

  const handleAssignFaculty = async () => {
    if (!newAssignment.facultyId || !newAssignment.courseId) {
      showErrorAlert('Please select both faculty and course');
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
        showSuccessAlert('Faculty assigned to course successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error assigning faculty');
      }
    } catch (error) {
      console.error('Error assigning faculty:', error);
      showErrorAlert('Error assigning faculty');
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

  // ==================== FORM VALIDATION FUNCTIONS ====================
  
  // Check if Add Course form has all required fields
  const isAddCourseFormValid = () => {
    return !showCourseModal || (
      newCourse.courseCode.trim() !== '' &&
      newCourse.courseName.trim() !== '' &&
      newCourse.department.trim() !== ''
    );
  };

  // Check if Edit Course form has all required fields
  const isEditCourseFormValid = () => {
    return !showEditCourseModal || (
      editCourse.courseCode?.trim() !== '' &&
      editCourse.courseName?.trim() !== '' &&
      editCourse.department?.trim() !== ''
    );
  };

  // Check if Assign Faculty form has all required fields
  const isAssignFacultyFormValid = () => {
    return !showAssignmentModal || (
      newAssignment.facultyId !== '' &&
      newAssignment.courseId !== ''
    );
  };

  // Check if Add Faculty form has all required fields
  const isAddFacultyFormValid = () => {
    return !showAddModal || (
      newFaculty.firstName.trim() !== '' &&
      newFaculty.email.trim() !== '' &&
      newFaculty.password.trim() !== '' &&
      newFaculty.department.trim() !== ''
    );
  };

  // Check if Edit Faculty form has all required fields
  const isEditFacultyFormValid = () => {
    return !showEditModal || (
      editFaculty.email?.trim() !== '' &&
      editFaculty.department?.trim() !== ''
    );
  };

  // Check if any form with required fields is incomplete
  const hasIncompleteRequiredFields = () => {
    return !isAddCourseFormValid() ||
           !isEditCourseFormValid() ||
           !isAssignFacultyFormValid() ||
           !isAddFacultyFormValid() ||
           !isEditFacultyFormValid();
  };

  // Handle section change with validation
  const sectionToPathMap = {
    dashboard: '/admin-dashboard',
    faculty: '/admin-faculty-management',
    archive: '/admin-archived-users',
    courses: '/admin-course-management',
    assignments: '/admin-class-assignments',
    reports: '/admin-reports',
    analytics: '/admin-system-analytics',
    settings: '/admin-system-settings',
  };

  const pathToSectionMap = Object.entries(sectionToPathMap).reduce((acc, [key, val]) => {
    acc[val] = key;
    return acc;
  }, {});

  const handleSectionChange = (sectionId) => {
    if (hasIncompleteRequiredFields()) {
      const incompleteForms = [];
      if (!isAddCourseFormValid()) incompleteForms.push('Add Course');
      if (!isEditCourseFormValid()) incompleteForms.push('Edit Course');
      if (!isAssignFacultyFormValid()) incompleteForms.push('Assign Faculty');
      if (!isAddFacultyFormValid()) incompleteForms.push('Add Faculty');
      if (!isEditFacultyFormValid()) incompleteForms.push('Edit Faculty');
      
      showWarningAlert(
        `Please complete all required fields in the following forms before navigating: ${incompleteForms.join(', ')}`
      );
      return false;
    }
    setActiveSection(sectionId);
    const nextPath = sectionToPathMap[sectionId] || '/admin-dashboard';
    navigate(nextPath);
    return true;
  };

  // Dashboard content (computed after handlers are defined)
  const dashboardContent = {
    dashboard: {
      title: 'Admin Dashboard',
      content: (
        <div className="dashboard-content enhanced">
          <div className="welcome-banner admin-banner">
            <div className="banner-content">
              <h2>System Administration Panel</h2>
              <p>
                Welcome back, {user?.name || user?.firstName || 'Admin'}. Manage the entire
                e-portfolio system.
              </p>
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
                    {facultyData.filter((f) => f.status === 'active').length}
                  </div>
                  <p>Currently active</p>
                </div>
              </div>
              <div className="stat-card admin-stat departments">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <h4>Departments</h4>
                  <div className="stat-number">
                    {[...new Set(facultyData.map((f) => f.department).filter((d) => d))].length ||
                      0}
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
                  {Object.values(courseLocks).filter((lock) => lock.isLocked).length}
                </span>
              </div>
              <div className="lock-stat">
                <span className="lock-stat-label">Your Locks:</span>
                <span className="lock-stat-value">
                  {Object.values(courseLocks).filter((lock) => lock.lockedByMe).length}
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
        <CourseManagementTab
          user={user}
          courses={courses}
          courseLoading={courseLoading}
          getCourseLockStatus={getCourseLockStatus}
          isCourseLockedByAnotherAdmin={isCourseLockedByAnotherAdmin}
          onAddCourseClick={() => setShowCourseModal(true)}
          onAssignFacultyClick={handleAssignFacultyClick}
          onEditCourseClick={handleEditCourseClick}
          onDeleteCourseClick={handleDeleteCourse}
          courseAssignments={courseAssignments}
          facultyData={facultyData}
        />
      )
    },
    faculty: {
      title: 'Faculty Management',
      content: (
        <FacultyManagementTab
          loading={loading}
          facultyData={facultyData}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          onAddFacultyClick={() => setShowAddModal(true)}
          onEditClick={handleEditClick}
          onArchiveClick={handleArchiveClick}
        />
      )
    },
    archive: {
      title: 'Archived Users',
      content: (
        <ArchivedUsersTab
          archivedFaculty={archivedFaculty}
          onUnarchiveClick={handleUnarchiveClick}
        />
      )
    },
    assignments: {
      title: 'Class Assignment Control',
      content: (
        <ClassAssignmentsTab
          handleUploadSchedule={handleUploadSchedule}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploadProgress={uploadProgress}
          uploadsList={uploadsList}
        />
      )
    },
    reports: {
      title: 'Reports and Analytics',
      content: (
        <ReportsTab
          reportType={reportType}
          setReportType={setReportType}
          handleGenerateReport={handleGenerateReport}
        />
      )
    },
    analytics: {
      title: 'System Analytics',
      content: <SystemAnalyticsTab />
    },
    settings: {
      title: 'System Settings',
      content: <SystemSettingsTab onNavigate={handleSectionChange} />
    }
  }

  const adminMenuItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { 
      id: 'faculty',
      label: 'FACULTY MANAGEMENT',
      children: [
        { id: 'archive', label: 'Archived Users' }
      ]
    },
    { id: 'courses', label: 'COURSE MANAGEMENT' },
    { id: 'assignments', label: 'CLASS ASSIGNMENTS' },
    { id: 'reports', label: 'REPORTS' },
    { id: 'analytics', label: 'SYSTEM ANALYTICS' },
    { id: 'settings', label: 'SYSTEM SETTINGS' }
  ]

  const isMenuItemActive = (item) => {
    if (activeSection === item.id) return true;
    if (item.children) {
      return item.children.some(child => child.id === activeSection);
    }
    return false;
  };

  // Sync URL path -> active section
  useEffect(() => {
    const path = location.pathname;
    const resolved = pathToSectionMap[path];
    if (resolved) {
      setActiveSection(resolved);
      if (resolved === 'faculty' || resolved === 'archive') setFacultyMenuOpen(true);
      return;
    }

    // Default to dashboard for unknown admin paths
    if (path.startsWith('/admin-') && path !== '/admin-dashboard') {
      navigate('/admin-dashboard', { replace: true });
    }
    setActiveSection('dashboard');
  }, [location.pathname, navigate]);

  const handleMenuItemClick = (item) => {
    if (item.id === 'faculty') {
      const changed = handleSectionChange('faculty');
      if (changed) {
        setFacultyMenuOpen(true);
      }
      return;
    }
    setFacultyMenuOpen(false);
    handleSectionChange(item.id);
  };

  const handleSubItemClick = (parentItem, childItem) => {
    const changed = handleSectionChange(childItem.id);
    if (changed) {
      if (parentItem.id === 'faculty') {
        setFacultyMenuOpen(true);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        setArchivedFaculty(data.filter(u => u.status === 'inactive'));
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
      showErrorAlert('Please fill all required fields');
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
        showSuccessAlert('Faculty added successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error adding faculty member');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      showErrorAlert('Error adding faculty member');
    }
  }

  function handleEditClick(faculty) {
    setSelectedFaculty(faculty);
    setEditFaculty({ ...faculty });
    setShowEditModal(true);
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
        showSuccessAlert('Faculty member updated successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error updating faculty member');
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      showErrorAlert('Error updating faculty member');
    }
  }

  const handleStatusClick = (faculty) => {
    setSelectedFaculty(faculty)
    setStatusFaculty({ ...faculty })
    setShowStatusModal(true)
  }

  async function handleArchiveClick(faculty) {
    const result = await Swal.fire({
      title: 'Archive Faculty?',
      text: `Archive ${faculty.name}? They will become inactive and cannot log in.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#111827',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${faculty._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'inactive' })
      });

      if (response.ok) {
        const result = await response.json();
        setFacultyData(prev => 
          prev.map(f => f._id === faculty._id ? result.user : f)
        );
        setArchivedFaculty(prev => [...prev.filter(f => f._id !== result.user._id), result.user]);
        showSuccessAlert('User archived successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error archiving user');
      }
    } catch (error) {
      console.error('Error archiving user:', error);
      showErrorAlert('Error archiving user');
    }
  }

  async function handleUnarchiveClick(faculty) {
    const result = await Swal.fire({
      title: 'Unarchive Faculty?',
      text: `Unarchive ${faculty.name}? They will become active and can log in again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#111827',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, unarchive',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${faculty._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        const result = await response.json();
        setFacultyData(prev =>
          prev.map(f => f._id === faculty._id ? result.user : f)
        );
        setArchivedFaculty(prev => prev.filter(f => f._id !== result.user._id));
        showSuccessAlert('User unarchived successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error unarchiving user');
      }
    } catch (error) {
      console.error('Error unarchiving user:', error);
      showErrorAlert('Error unarchiving user');
    }
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
        setArchivedFaculty(prev =>
          result.user.status === 'inactive'
            ? [...prev.filter(f => f._id !== result.user._id), result.user]
            : prev.filter(f => f._id !== result.user._id)
        );
        setShowStatusModal(false);
        setSelectedFaculty(null);
        setStatusFaculty({});
        showSuccessAlert('Status updated successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showErrorAlert('Error updating status');
    }
  }

  const handleDeleteClick = async (faculty) => {
    const result = await Swal.fire({
      title: 'Delete Faculty?',
      text: `Are you sure you want to delete ${faculty.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

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
        showSuccessAlert('Faculty deleted successfully!');
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error deleting faculty');
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      showErrorAlert('Error deleting faculty member');
    }
  }

  return (
    <div className="dashboard admin-dashboard">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        adminMenuItems={adminMenuItems}
        activeSection={activeSection}
        facultyMenuOpen={facultyMenuOpen}
        user={user}
        handleMenuItemClick={handleMenuItemClick}
        handleSubItemClick={handleSubItemClick}
        handleLogout={handleLogout}
        isMenuItemActive={isMenuItemActive}
      />

      <div className="main-content">
        <AdminTopbar 
          pageTitle={dashboardContent[activeSection]?.title}
          user={user}
        />

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
        <div className="modal-overlay" onClick={() => {
          if (isAddCourseFormValid()) {
            setShowCourseModal(false);
          } else {
            showWarningAlert('Please complete all required fields (marked with *) before closing.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Course</h3>
              <button className="close-btn" onClick={() => {
                if (isAddCourseFormValid()) {
                  setShowCourseModal(false);
                } else {
                  showWarningAlert('Please complete all required fields (marked with *) before closing.');
                }
              }}>×</button>
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
        <div className="modal-overlay" onClick={() => {
          if (isEditCourseFormValid()) {
            handleCancelEditCourse();
          } else {
            showWarningAlert('Please complete all required fields before closing. The lock will be released.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Course (Locked by You)</h3>
              <div className="modal-lock-info">
                <span className="lock-badge">🔒 Exclusive Lock Acquired</span>
              </div>
              <button className="close-btn" onClick={() => {
                if (isEditCourseFormValid()) {
                  handleCancelEditCourse();
                } else {
                  showWarningAlert('Please complete all required fields before closing. The lock will be released.');
                }
              }}>×</button>
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
        <div className="modal-overlay" onClick={() => {
          if (isAssignFacultyFormValid()) {
            setShowAssignmentModal(false);
          } else {
            showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Faculty to Course</h3>
              <button className="close-btn" onClick={() => {
                if (isAssignFacultyFormValid()) {
                  setShowAssignmentModal(false);
                } else {
                  showWarningAlert('Please select both Faculty and Course (marked with *) before closing.');
                }
              }}>×</button>
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