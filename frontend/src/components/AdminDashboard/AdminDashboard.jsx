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
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    department: '',
    role: 'Faculty'
  })
  const [editFaculty, setEditFaculty] = useState({})
  const [statusFaculty, setStatusFaculty] = useState({})

  // Mock data for dashboard content
  const dashboardContent = {
    dashboard: {
      title: 'Admin Dashboard',
      content: (
        <div className="dashboard-content">
          <div className="welcome-banner admin-banner">
            <h2>System Administration Panel</h2>
            <p>Welcome back, {user?.name || user?.firstName || 'Admin'}. Manage the entire e-portfolio system.</p>
          </div>
          
          <div className="admin-stats">
            <h3>System Overview</h3>
            <div className="stats-grid">
              <div className="stat-card admin-stat">
                <h3>Total Faculty</h3>
                <div className="stat-number">{facultyData.length}</div>
                <p>Registered members</p>
              </div>
              <div className="stat-card admin-stat">
                <h3>Active Faculty</h3>
                <div className="stat-number">
                  {facultyData.filter(f => f.status === 'active').length}
                </div>
                <p>Currently active</p>
              </div>
              <div className="stat-card admin-stat">
                <h3>Departments</h3>
                <div className="stat-number">
                  {[...new Set(facultyData.map(f => f.department))].length}
                </div>
                <p>Different departments</p>
              </div>
              <div className="stat-card admin-stat">
                <h3>Pending Actions</h3>
                <div className="stat-number">0</div>
                <p>No pending requests</p>
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
    }
  }

  const adminMenuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
    { id: 'faculty', label: 'FACULTY MANAGEMENT', icon: '👨‍🏫' },
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

  useEffect(() => {
    fetchFacultyData()
  }, [])

  // NEW: Add faculty with API call
  const handleAddFaculty = async () => {
    if (!hasNewFacultyInput()) return;

    try {
      const token = localStorage.getItem('token');
      const [fn, ...lnParts] = newFaculty.name.trim().split(' ');
      const payload = {
        firstName: fn || 'New',
        lastName: lnParts.join(' ') || 'User',
        email: newFaculty.email,
        department: newFaculty.department,
        // Map UI role to backend role enum ('admin' | 'faculty')
        role: (newFaculty.role || '').toLowerCase() === 'admin' ? 'admin' : 'faculty',
        password: 'defaultPassword123'
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
        setNewFaculty({ name: '', email: '', department: '', role: 'Professor' });
        alert('Faculty member added successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Error adding faculty member');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      alert('Error adding faculty member');
    }
  }

  const hasNewFacultyInput = () => {
    return newFaculty.name.trim() && newFaculty.email.trim() && newFaculty.department.trim()
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

  return (
    <div className="dashboard admin-dashboard">
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
                <label>Full Name</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
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
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn-primary ${!hasNewFacultyInput() ? 'disabled' : ''}`}
                onClick={handleAddFaculty}
                disabled={!hasNewFacultyInput()}
              >
                Save
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