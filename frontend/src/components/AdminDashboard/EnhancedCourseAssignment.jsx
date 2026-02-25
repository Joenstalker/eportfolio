import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './EnhancedCourseAssignment.css';

const EnhancedCourseAssignment = ({ user }) => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');

  // Form state for new assignment
  const [assignmentForm, setAssignmentForm] = useState({
    courseId: '',
    facultyId: '',
    semester: '',
    academicYear: '',
    section: '',
    schedule: '',
    room: '',
    maxStudents: 50,
    status: 'active'
  });

  // ==================== DATA FETCHING ====================
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else {
        throw new Error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load course assignments',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaculty(data);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchFaculty();
  }, []);

  // ==================== EVENT HANDLERS ====================
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentForm)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Assignment Created',
          text: 'Course assignment has been created successfully',
          timer: 3000,
          showConfirmButton: false
        });
        setShowAssignmentModal(false);
        setAssignmentForm({
          courseId: '',
          facultyId: '',
          semester: '',
          academicYear: '',
          section: '',
          schedule: '',
          room: '',
          maxStudents: 50,
          status: 'active'
        });
        fetchAssignments();
      } else {
        throw new Error('Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create course assignment',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Assignment Updated',
          text: 'Course assignment has been updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        fetchAssignments();
      } else {
        throw new Error('Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update course assignment',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const result = await Swal.fire({
      title: 'Delete Assignment?',
      text: 'Are you sure you want to delete this course assignment? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Assignment Deleted',
            text: 'Course assignment has been deleted successfully',
            timer: 2000,
            showConfirmButton: false
          });
          fetchAssignments();
        } else {
          throw new Error('Failed to delete assignment');
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete course assignment',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const handleStatusToggle = async (assignmentId, newStatus) => {
    await handleUpdateAssignment(assignmentId, { status: newStatus });
  };

  // ==================== FILTERING AND SORTING ====================
  const getFilteredAssignments = () => {
    let filtered = assignments.filter(assignment => {
      const matchesSearch = searchTerm === '' || 
        assignment.course?.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.course?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.faculty?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.faculty?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.faculty?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSemester = filterSemester === 'all' || assignment.semester === filterSemester;
      const matchesDepartment = filterDepartment === 'all' || 
        assignment.course?.department === filterDepartment ||
        assignment.faculty?.department === filterDepartment;
      const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
      
      return matchesSearch && matchesSemester && matchesDepartment && matchesStatus;
    });

    // Sort assignments
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'course':
          aValue = a.course?.courseCode || '';
          bValue = b.course?.courseCode || '';
          break;
        case 'faculty':
          aValue = `${a.faculty?.firstName} ${a.faculty?.lastName}` || '';
          bValue = `${b.faculty?.firstName} ${b.faculty?.lastName}` || '';
          break;
        case 'semester':
          aValue = a.semester || '';
          bValue = b.semester || '';
          break;
        default:
          aValue = a.createdAt || 0;
          bValue = b.createdAt || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getUniqueDepartments = () => {
    const departments = new Set();
    assignments.forEach(assignment => {
      if (assignment.course?.department) departments.add(assignment.course.department);
      if (assignment.faculty?.department) departments.add(assignment.faculty.department);
    });
    return Array.from(departments).filter(dept => dept && dept.trim() !== '');
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderAssignmentsTab = () => {
    const filteredAssignments = getFilteredAssignments();
    
    return (
      <div className="course-assignment-tab">
        <div className="tab-header">
          <h3>Course Assignments</h3>
          <div className="header-actions">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞ Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                ☰ List
              </button>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowAssignmentModal(true)}
            >
              ➕ New Assignment
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Semesters</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
              <option value="Fall 2025">Fall 2025</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Sort by Date</option>
              <option value="course">Sort by Course</option>
              <option value="faculty">Sort by Faculty</option>
              <option value="semester">Sort by Semester</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              className="sort-toggle"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'} Sort Order
            </button>
          </div>
        </div>

        {/* Assignment Stats */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <span className="stat-value">{filteredAssignments.length}</span>
              <span className="stat-label">Total Assignments</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-value">
                {filteredAssignments.filter(a => a.status === 'active').length}
              </span>
              <span className="stat-label">Active</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">
                {filteredAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0)}
              </span>
              <span className="stat-label">Total Students</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <span className="stat-value">
                {[...new Set(filteredAssignments.map(a => a.facultyId))].length}
              </span>
              <span className="stat-label">Assigned Faculty</span>
            </div>
          </div>
        </div>

        {/* Assignments Display */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading assignments...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="assignments-grid">
            {filteredAssignments.map(assignment => (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                onEdit={setSelectedAssignment}
                onDelete={handleDeleteAssignment}
                onStatusToggle={handleStatusToggle}
              />
            ))}
          </div>
        ) : (
          <div className="assignments-list">
            {filteredAssignments.map(assignment => (
              <AssignmentListItem
                key={assignment._id}
                assignment={assignment}
                onEdit={setSelectedAssignment}
                onDelete={handleDeleteAssignment}
                onStatusToggle={handleStatusToggle}
              />
            ))}
          </div>
        )}

        {!loading && filteredAssignments.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No assignments found</h3>
            <p>No course assignments match your current filters.</p>
            <button 
              className="btn-primary"
              onClick={() => setShowAssignmentModal(true)}
            >
              Create First Assignment
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    const filteredAssignments = getFilteredAssignments();
    
    // Calculate analytics
    const totalAssignments = filteredAssignments.length;
    const activeAssignments = filteredAssignments.filter(a => a.status === 'active').length;
    const totalStudents = filteredAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0);
    const totalCapacity = filteredAssignments.reduce((sum, a) => sum + (a.maxStudents || 0), 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    
    const departmentStats = getUniqueDepartments().map(dept => {
      const deptAssignments = filteredAssignments.filter(a => 
        a.course?.department === dept || a.faculty?.department === dept
      );
      return {
        department: dept,
        assignments: deptAssignments.length,
        students: deptAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0),
        faculty: [...new Set(deptAssignments.map(a => a.facultyId))].length
      };
    });

    const semesterStats = ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025'].map(semester => {
      const semAssignments = filteredAssignments.filter(a => a.semester === semester);
      return {
        semester,
        assignments: semAssignments.length,
        students: semAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0),
        faculty: [...new Set(semAssignments.map(a => a.facultyId))].length
      };
    });

    return (
      <div className="analytics-tab">
        <div className="tab-header">
          <h3>Assignment Analytics</h3>
          <button className="btn-primary" onClick={fetchAssignments}>
            🔄 Refresh
          </button>
        </div>

        <div className="analytics-grid">
          {/* Overview Stats */}
          <div className="analytics-card full-width">
            <h4>Overview</h4>
            <div className="overview-stats">
              <div className="overview-stat">
                <span className="stat-number">{totalAssignments}</span>
                <span className="stat-text">Total Assignments</span>
              </div>
              <div className="overview-stat">
                <span className="stat-number">{activeAssignments}</span>
                <span className="stat-text">Active</span>
              </div>
              <div className="overview-stat">
                <span className="stat-number">{totalStudents}</span>
                <span className="stat-text">Total Students</span>
              </div>
              <div className="overview-stat">
                <span className="stat-number">{utilizationRate}%</span>
                <span className="stat-text">Utilization Rate</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="analytics-card">
            <h4>Department Breakdown</h4>
            <div className="department-chart">
              {departmentStats.map(stat => (
                <div key={stat.department} className="department-stat">
                  <div className="department-info">
                    <span className="department-name">{stat.department}</span>
                    <span className="department-count">{stat.assignments} assignments</span>
                  </div>
                  <div className="department-bars">
                    <div className="bar-item">
                      <span>Students: {stat.students}</span>
                      <div className="bar-fill" style={{ 
                        width: `${Math.min((stat.students / Math.max(...departmentStats.map(s => s.students))) * 100, 100)}%` 
                      }}></div>
                    </div>
                    <div className="bar-item">
                      <span>Faculty: {stat.faculty}</span>
                      <div className="bar-fill faculty" style={{ 
                        width: `${Math.min((stat.faculty / Math.max(...departmentStats.map(s => s.faculty))) * 100, 100)}%` 
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semester Trends */}
          <div className="analytics-card">
            <h4>Semester Trends</h4>
            <div className="semester-chart">
              {semesterStats.map(stat => (
                <div key={stat.semester} className="semester-stat">
                  <div className="semester-info">
                    <span className="semester-name">{stat.semester}</span>
                    <span className="semester-count">{stat.assignments} assignments</span>
                  </div>
                  <div className="semester-bars">
                    <div className="bar-item">
                      <span>Students: {stat.students}</span>
                      <div className="bar-fill" style={{ 
                        width: `${Math.min((stat.students / Math.max(...semesterStats.map(s => s.students))) * 100, 100)}%` 
                      }}></div>
                    </div>
                    <div className="bar-item">
                      <span>Faculty: {stat.faculty}</span>
                      <div className="bar-fill faculty" style={{ 
                        width: `${Math.min((stat.faculty / Math.max(...semesterStats.map(s => s.faculty))) * 100, 100)}%` 
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Load */}
          <div className="analytics-card">
            <h4>Faculty Load Distribution</h4>
            <div className="faculty-load-chart">
              {faculty.slice(0, 10).map(facultyMember => {
                const facultyAssignments = filteredAssignments.filter(a => a.facultyId === facultyMember._id);
                const totalLoad = facultyAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0);
                
                return (
                  <div key={facultyMember._id} className="faculty-load-stat">
                    <div className="faculty-info">
                      <span className="faculty-name">
                        {facultyMember.firstName} {facultyMember.lastName}
                      </span>
                      <span className="faculty-load">{facultyAssignments.length} assignments</span>
                    </div>
                    <div className="load-bar">
                      <div className="bar-fill" style={{ 
                        width: `${Math.min((totalLoad / Math.max(...faculty.map(f => {
                          const fAssignments = filteredAssignments.filter(a => a.facultyId === f._id);
                          return fAssignments.reduce((sum, a) => sum + (a.enrolledStudents || 0), 0);
                        }))) * 100, 100)}%` 
                      }}></div>
                      <span className="load-number">{totalLoad} students</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-course-assignment">
      <div className="dashboard-header">
        <h2>Enhanced Course Assignment Management</h2>
        <p>Comprehensive course assignment and faculty management system</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📚 Assignments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'assignments' && renderAssignmentsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>

      {/* Assignment Modal */}
      {(showAssignmentModal || selectedAssignment) && (
        <AssignmentModal
          assignment={selectedAssignment}
          courses={courses}
          faculty={faculty}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}
          loading={loading}
        />
      )}
    </div>
  );
};

// Assignment Card Component
const AssignmentCard = ({ assignment, onEdit, onDelete, onStatusToggle }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="assignment-card">
      <div className="card-header">
        <div className="course-info">
          <h4>{assignment.course?.courseCode}</h4>
          <p>{assignment.course?.courseName}</p>
        </div>
        <div className="card-actions">
          <button
            className="actions-btn"
            onClick={() => setShowActions(!showActions)}
          >
            ⋮
          </button>
          {showActions && (
            <div className="actions-dropdown">
              <button onClick={() => onEdit(assignment)}>✏️ Edit</button>
              <button onClick={() => onStatusToggle(assignment._id, assignment.status === 'active' ? 'inactive' : 'active')}>
                {assignment.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
              </button>
              <button onClick={() => onDelete(assignment._id)} className="delete-btn">🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="faculty-info">
          <div className="faculty-avatar">
            {assignment.faculty?.firstName?.charAt(0)}{assignment.faculty?.lastName?.charAt(0)}
          </div>
          <div>
            <p className="faculty-name">
              {assignment.faculty?.firstName} {assignment.faculty?.lastName}
            </p>
            <p className="faculty-email">{assignment.faculty?.email}</p>
          </div>
        </div>

        <div className="assignment-details">
          <div className="detail-item">
            <span className="detail-label">Semester:</span>
            <span className="detail-value">{assignment.semester}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Section:</span>
            <span className="detail-value">{assignment.section}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Schedule:</span>
            <span className="detail-value">{assignment.schedule || 'TBA'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Room:</span>
            <span className="detail-value">{assignment.room || 'TBA'}</span>
          </div>
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="stat-number">{assignment.enrolledStudents || 0}</span>
            <span className="stat-label">Enrolled</span>
          </div>
          <div className="stat">
            <span className="stat-number">{assignment.maxStudents || 50}</span>
            <span className="stat-label">Capacity</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {assignment.maxStudents > 0 ? Math.round(((assignment.enrolledStudents || 0) / assignment.maxStudents) * 100) : 0}%
            </span>
            <span className="stat-label">Filled</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span className={`status-badge ${assignment.status}`}>
          {assignment.status}
        </span>
        <span className="date">
          Created: {new Date(assignment.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// Assignment List Item Component
const AssignmentListItem = ({ assignment, onEdit, onDelete, onStatusToggle }) => {
  return (
    <div className="assignment-list-item">
      <div className="item-main">
        <div className="course-info">
          <h4>{assignment.course?.courseCode} - {assignment.course?.courseName}</h4>
          <p>{assignment.semester} • Section {assignment.section}</p>
        </div>
        <div className="faculty-info">
          <div className="faculty-avatar">
            {assignment.faculty?.firstName?.charAt(0)}{assignment.faculty?.lastName?.charAt(0)}
          </div>
          <div>
            <p className="faculty-name">
              {assignment.faculty?.firstName} {assignment.faculty?.lastName}
            </p>
            <p className="faculty-email">{assignment.faculty?.email}</p>
          </div>
        </div>
        <div className="schedule-info">
          <p>{assignment.schedule || 'TBA'}</p>
          <p>{assignment.room || 'TBA'}</p>
        </div>
        <div className="enrollment-info">
          <div className="enrollment-bar">
            <div 
              className="enrollment-fill"
              style={{ width: `${assignment.maxStudents > 0 ? Math.min(((assignment.enrolledStudents || 0) / assignment.maxStudents) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <span>{assignment.enrolledStudents || 0}/{assignment.maxStudents || 50}</span>
        </div>
        <div className="status-info">
          <span className={`status-badge ${assignment.status}`}>
            {assignment.status}
          </span>
        </div>
        <div className="item-actions">
          <button onClick={() => onEdit(assignment)} className="btn-edit">✏️</button>
          <button onClick={() => onStatusToggle(assignment._id, assignment.status === 'active' ? 'inactive' : 'active')} className="btn-status">
            {assignment.status === 'active' ? '⏸️' : '▶️'}
          </button>
          <button onClick={() => onDelete(assignment._id)} className="btn-delete">🗑️</button>
        </div>
      </div>
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ assignment, courses, faculty, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    courseId: assignment?.courseId || '',
    facultyId: assignment?.facultyId || '',
    semester: assignment?.semester || '',
    academicYear: assignment?.academicYear || '',
    section: assignment?.section || '',
    schedule: assignment?.schedule || '',
    room: assignment?.room || '',
    maxStudents: assignment?.maxStudents || 50,
    status: assignment?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (assignment) {
      onSubmit(assignment._id, formData);
    } else {
      onSubmit(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{assignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form className="assignment-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Course *</label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Faculty *</label>
              <select
                value={formData.facultyId}
                onChange={(e) => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}
                required
              >
                <option value="">Select Faculty</option>
                {faculty.map(facultyMember => (
                  <option key={facultyMember._id} value={facultyMember._id}>
                    {facultyMember.firstName} {facultyMember.lastName} - {facultyMember.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                required
              >
                <option value="">Select Semester</option>
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2025">Spring 2025</option>
                <option value="Summer 2025">Summer 2025</option>
                <option value="Fall 2025">Fall 2025</option>
              </select>
            </div>

            <div className="form-group">
              <label>Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                placeholder="e.g., A, B, 1, 2"
              />
            </div>

            <div className="form-group">
              <label>Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                placeholder="e.g., MWF 9:00-10:00 AM"
              />
            </div>

            <div className="form-group">
              <label>Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                placeholder="e.g., Room 101"
              />
            </div>

            <div className="form-group">
              <label>Max Students</label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 50 }))}
                min="1"
                max="200"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (assignment ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedCourseAssignment;
