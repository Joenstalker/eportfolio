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

  // Handler functions must be defined BEFORE dashboardContent
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

  // Mock data for dashboard content
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
                <span className="mini-label">Last Updated</span>
                <span className="mini-value">{new Date().toLocaleTimeString()}</span>
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
              <div className="stat-card admin-stat actions">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h4>System Ready</h4>
                  <div className="stat-number">✓</div>
                  <p>All systems nominal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-widgets">
            <div className="widget-section">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => { setActiveSection('faculty'); setShowAddModal(true) }}>
                  <span className="btn-icon">➕</span>
                  <span>Add Faculty</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveSection('assignments')}>
                  <span className="btn-icon">📅</span>
                  <span>Class Schedule</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveSection('reports')}>
                  <span className="btn-icon">📊</span>
                  <span>Generate Report</span>
                </button>
                <button className="quick-action-btn" onClick={() => setActiveSection('settings')}>
                  <span className="btn-icon">⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
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
                  No faculty members found. Click "Add Faculty" to create the first one.
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

              <div className="upload-info">
                <h4>📋 Required Format</h4>
                <ul>
                  <li>Column 1: Course Code (e.g., CS101)</li>
                  <li>Column 2: Faculty Name</li>
                  <li>Column 3: Semester (e.g., Fall 2024)</li>
                  <li>Column 4: Time Slot (e.g., 9:00-10:30 AM)</li>
                  <li>Column 5: Room Number (e.g., Room 101)</li>
                </ul>
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
                      <div className="schedule-status">
                        <span className={`status-badge`}>{u.source}</span>
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

            <div className="reports-history">
              <h4>📁 Report History</h4>
              <div className="reports-list">
                {[
                  { id: 1, name: 'Faculty Portfolio Summary - Nov 2024', type: 'PDF', date: '2024-11-10', size: '2.4 MB' },
                  { id: 2, name: 'Department Statistics - Oct 2024', type: 'Excel', date: '2024-10-28', size: '1.8 MB' },
                  { id: 3, name: 'Activity Log Report - Sep 2024', type: 'CSV', date: '2024-09-15', size: '512 KB' },
                  { id: 4, name: 'Faculty Portfolio Summary - Aug 2024', type: 'PDF', date: '2024-08-30', size: '2.1 MB' },
                ].map(report => (
                  <div key={report.id} className="report-item">
                    <div className="report-icon">
                      {report.type === 'PDF' && '📄'}
                      {report.type === 'Excel' && '📊'}
                      {report.type === 'CSV' && '📋'}
                    </div>
                    <div className="report-details">
                      <h5>{report.name}</h5>
                      <p>{report.date} • {report.size}</p>
                    </div>
                    <div className="report-actions">
                      <button className="btn-action">⬇️ Download</button>
                      <button className="btn-action delete">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-preview">
              <h4>📈 Report Statistics</h4>
              <div className="statistics-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Portfolios</span>
                  <span className="stat-value">{facultyData.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion Rate</span>
                  <span className="stat-value">92%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Updated</span>
                  <span className="stat-value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Reports Generated</span>
                  <span className="stat-value">47</span>
                </div>
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
    { id: 'assignments', label: 'CLASS ASSIGNMENTS', icon: '📅' },
    { id: 'reports', label: 'REPORTS', icon: '📋' },
    { id: 'courses', label: 'COURSE MANAGEMENT', icon: '📚' },
    { id: 'analytics', label: 'SYSTEM ANALYTICS', icon: '📈' },
    { id: 'settings', label: 'SYSTEM SETTINGS', icon: '⚙️' }
  ]

  // NEW: Fetch faculty data from API
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
      // Fallback to demo data if API fails
      setFacultyData([
        { 
          _id: '1', 
          name: 'Dr. John Smith', 
          email: 'john.smith@university.edu', 
          department: 'Computer Science', 
          role: 'Professor',
          status: 'active'
        },
        { 
          _id: '2', 
          name: 'Dr. Maria Garcia', 
          email: 'maria.garcia@university.edu', 
          department: 'Mathematics', 
          role: 'Associate Professor',
          status: 'active'
        },
        { 
          _id: '3', 
          name: 'Dr. Robert Johnson', 
          email: 'robert.johnson@university.edu', 
          department: 'Physics', 
          role: 'Assistant Professor',
          status: 'inactive'
        },
        { 
          _id: '4', 
          name: 'Dr. Sarah Chen', 
          email: 'sarah.chen@university.edu', 
          department: 'Biology', 
          role: 'Professor',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch recent uploaded files across collections for admin view
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
      } else {
        console.warn('Failed to fetch admin uploads')
      }
    } catch (err) {
      console.error('Error fetching uploads:', err)
    }
  }

  useEffect(() => {
    fetchFacultyData()
    fetchUploads()
  }, [])

  // NEW: Add faculty with API call
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

  const hasNewFacultyInput = () => {
    return newFaculty.firstName.trim() && newFaculty.email.trim() && newFaculty.department.trim() && newFaculty.password.trim()
  }

  // Edit Faculty Functions
  const handleEditClick = (faculty) => {
    setSelectedFaculty(faculty)
    setEditFaculty({ ...faculty })
    setShowEditModal(true)
  }

  // NEW: Edit faculty with API call
  const handleEditSave = async () => {
    if (!hasEditChanges()) return;

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
        alert('Faculty member updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating faculty member');
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      alert('Error updating faculty member');
    }
  }

  const hasEditChanges = () => {
    return JSON.stringify(selectedFaculty) !== JSON.stringify(editFaculty)
  }

  // Status Functions
  const handleStatusClick = (faculty) => {
    setSelectedFaculty(faculty)
    setStatusFaculty({ ...faculty })
    setShowStatusModal(true)
  }

  // NEW: Update status with API call
  const handleStatusSave = async () => {
    if (!hasStatusChanges()) return;

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
        alert('Status updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  }

  const hasStatusChanges = () => {
    return selectedFaculty.status !== statusFaculty.status
  }

  const handleStatusToggle = () => {
    setStatusFaculty(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active'
    }))
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

      {/* Sidebar */}
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

      {/* Main Content */}
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

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Faculty Member</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={newFaculty.firstName}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={newFaculty.lastName}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newFaculty.password}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={newFaculty.department}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newFaculty.role}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddFaculty}
              >
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && selectedFaculty && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Faculty Member</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editFaculty.name || ''}
                  onChange={(e) => setEditFaculty(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editFaculty.email || ''}
                  onChange={(e) => setEditFaculty(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={editFaculty.department || ''}
                  onChange={(e) => setEditFaculty(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editFaculty.role || 'Faculty'}
                  onChange={(e) => setEditFaculty(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn-primary ${!hasEditChanges() ? 'disabled' : ''}`}
                onClick={handleEditSave}
                disabled={!hasEditChanges()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedFaculty && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Faculty Status</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="status-info">
                <p><strong>Faculty Member:</strong> {selectedFaculty.name}</p>
                <p><strong>Current Status:</strong> 
                  <span className={`status-badge ${selectedFaculty.status}`}>
                    {selectedFaculty.status}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label>New Status</label>
                <div className="status-toggle">
                  <button
                    className={`status-option ${statusFaculty.status === 'active' ? 'active' : ''}`}
                    onClick={() => setStatusFaculty(prev => ({ ...prev, status: 'active' }))}
                  >
                    Active
                  </button>
                  <button
                    className={`status-option ${statusFaculty.status === 'inactive' ? 'active' : ''}`}
                    onClick={() => setStatusFaculty(prev => ({ ...prev, status: 'inactive' }))}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn-primary ${!hasStatusChanges() ? 'disabled' : ''}`}
                onClick={handleStatusSave}
                disabled={!hasStatusChanges()}
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard