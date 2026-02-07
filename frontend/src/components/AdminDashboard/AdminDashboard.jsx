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
import ArchivedCoursesTab from './ArchivedCoursesTab'
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
  const [coursesMenuOpen, setCoursesMenuOpen] = useState(false)
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
  const [courses, setCourses] = useState([])

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

  // ==================== BACKEND API FUNCTIONS ====================

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
    return !isAddFacultyFormValid() ||
           !isEditFacultyFormValid();
  };

  // Handle section change with validation
  const sectionToPathMap = {
    dashboard: '/admin-dashboard',
    faculty: '/admin-faculty-management',
    archive: '/admin-archived-users',
    courses: '/admin-course-management',
    'archived-courses': '/admin-archived-courses',
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

  // Fetch courses for archived courses tab
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courses', {
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
      setCourses([]);
    }
  };

  const handleUnarchiveCourse = async (course) => {
    const result = await Swal.fire({
      title: 'Unarchive Course?',
      text: `Unarchive ${course.courseCode} - ${course.courseName}? It will become active again.`,
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
      const response = await fetch(`http://localhost:5000/api/courses/${course._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        const result = await response.json();
        setCourses(prev =>
          prev.map(c => c._id === course._id ? result.course : c)
        );
        showSuccessAlert('Course unarchived successfully!');
        fetchCourses(); // Refresh courses
      } else {
        const error = await response.json();
        showErrorAlert(error.message || 'Error unarchiving course');
      }
    } catch (error) {
      console.error('Error unarchiving course:', error);
      showErrorAlert('Error unarchiving course');
    }
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
        </div>
      )
    },
    courses: {
      title: 'Course Management',
      content: (
        <CourseManagementTab
          user={user}
          facultyData={facultyData}
        />
      )
    },
    'archived-courses': {
      title: 'Archived Courses',
      content: (
        <ArchivedCoursesTab
          archivedCourses={courses.filter(c => c.status === 'archived')}
          onUnarchiveClick={handleUnarchiveCourse}
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
    { 
      id: 'courses',
      label: 'COURSE MANAGEMENT',
      children: [
        { id: 'archived-courses', label: 'Archived Courses' }
      ]
    },
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
      if (resolved === 'courses' || resolved === 'archived-courses') setCoursesMenuOpen(true);
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
        setCoursesMenuOpen(false);
      }
      return;
    }
    if (item.id === 'courses') {
      const changed = handleSectionChange('courses');
      if (changed) {
        setCoursesMenuOpen(true);
        setFacultyMenuOpen(false);
      }
      return;
    }
    setFacultyMenuOpen(false);
    setCoursesMenuOpen(false);
    handleSectionChange(item.id);
  };

  const handleSubItemClick = (parentItem, childItem) => {
    const changed = handleSectionChange(childItem.id);
    if (changed) {
      if (parentItem.id === 'faculty') {
        setFacultyMenuOpen(true);
      }
      if (parentItem.id === 'courses') {
        setCoursesMenuOpen(true);
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

  useEffect(() => {
    fetchFacultyData()
    fetchUploads()
    fetchCourses()
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
        coursesMenuOpen={coursesMenuOpen}
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

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Faculty</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newFaculty.firstName}
                  onChange={(e) => setNewFaculty({...newFaculty, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={newFaculty.lastName}
                  onChange={(e) => setNewFaculty({...newFaculty, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({...newFaculty, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newFaculty.password}
                  onChange={(e) => setNewFaculty({...newFaculty, password: e.target.value})}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={newFaculty.department}
                  onChange={(e) => setNewFaculty({...newFaculty, department: e.target.value})}
                  placeholder="Enter department"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newFaculty.role}
                  onChange={(e) => setNewFaculty({...newFaculty, role: e.target.value})}
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="hod">Head of Department</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleAddFaculty}
                disabled={!isAddFacultyFormValid()}
              >
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Faculty</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editFaculty.name || ''}
                  onChange={(e) => setEditFaculty({...editFaculty, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={editFaculty.email || ''}
                  onChange={(e) => setEditFaculty({...editFaculty, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={editFaculty.department || ''}
                  onChange={(e) => setEditFaculty({...editFaculty, department: e.target.value})}
                  placeholder="Enter department"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editFaculty.role || 'faculty'}
                  onChange={(e) => setEditFaculty({...editFaculty, role: e.target.value})}
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="hod">Head of Department</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleEditSave}
                disabled={!isEditFacultyFormValid()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Status</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Faculty Member</label>
                <input
                  type="text"
                  value={statusFaculty.name || ''}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={statusFaculty.status || 'active'}
                  onChange={(e) => setStatusFaculty({...statusFaculty, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleStatusSave}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
