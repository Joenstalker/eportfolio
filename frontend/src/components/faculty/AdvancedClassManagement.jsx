import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './AdvancedClassManagement.css';

const AdvancedClassManagement = ({ user, courses }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    year: '',
    section: '',
    email: '',
    phone: ''
  });
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageGrade: 0,
    attendanceRate: 0
  });

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
  const fetchClassList = async (courseId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teaching/class-list/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setClassStats(data.stats || {});
      } else {
        throw new Error('Failed to fetch class list');
      }
    } catch (error) {
      console.error('Error fetching class list:', error);
      showErrorAlert('Failed to load class list');
    } finally {
      setLoading(false);
    }
  };

  const generateClassListPDF = async () => {
    if (!selectedCourse) {
      showErrorAlert('Please select a course first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/teaching/class-list/${selectedCourse._id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `class-list-${selectedCourse.courseCode}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccessAlert('Class list PDF generated successfully');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      showErrorAlert('Failed to generate class list PDF');
    }
  };

  // ==================== EVENT HANDLERS ====================
  const handleAddStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/teaching/class-list/${selectedCourse._id}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newStudent,
          courseId: selectedCourse._id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setStudents(prev => [...prev, result.student]);
        setClassStats(prev => ({
          ...prev,
          totalStudents: prev.totalStudents + 1,
          activeStudents: prev.activeStudents + 1
        }));
        
        setNewStudent({
          studentId: '',
          firstName: '',
          lastName: '',
          year: '',
          section: '',
          email: '',
          phone: ''
        });
        setShowAddStudentModal(false);
        
        showSuccessAlert('Student added successfully');
      } else {
        throw new Error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      showErrorAlert('Failed to add student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const result = await Swal.fire({
      title: 'Delete Student?',
      text: 'This will permanently remove the student from the class list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/teaching/class-list/students/${studentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setStudents(prev => prev.filter(s => s._id !== studentId));
          setClassStats(prev => ({
            ...prev,
            totalStudents: Math.max(0, prev.totalStudents - 1),
            activeStudents: Math.max(0, prev.activeStudents - 1)
          }));
          
          showSuccessAlert('Student deleted successfully');
        } else {
          throw new Error('Failed to delete student');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        showErrorAlert('Failed to delete student');
      }
    }
  };

  const handleUpdateStudent = async (studentId, updates) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/teaching/class-list/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setStudents(prev => prev.map(s => 
          s._id === studentId ? { ...s, ...updates } : s
        ));
        
        showSuccessAlert('Student updated successfully');
      } else {
        throw new Error('Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      showErrorAlert('Failed to update student');
    }
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderStudentRow = (student) => (
    <tr key={student._id} className="student-row">
      <td>{student.studentId}</td>
      <td>{student.firstName}</td>
      <td>{student.lastName}</td>
      <td>{student.year}</td>
      <td>{student.section}</td>
      <td>{student.email || '-'}</td>
      <td>{student.phone || '-'}</td>
      <td>
        <span className={`status-badge ${student.isActive ? 'active' : 'inactive'}`}>
          {student.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div className="student-actions">
          <button 
            className="btn-edit btn-small"
            onClick={() => {
              // TODO: Implement edit functionality
              console.log('Edit student:', student);
            }}
          >
            ✏️
          </button>
          <button 
            className="btn-delete btn-small"
            onClick={() => handleDeleteStudent(student._id)}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return <div className="loading">Loading class data...</div>;
  }

  return (
    <div className="advanced-class-management">
      <div className="class-selector">
        <h3>Class Management</h3>
        <div className="course-selection">
          <label>Select Course:</label>
          <select
            value={selectedCourse?._id || ''}
            onChange={(e) => {
              const course = courses.find(c => c._id === e.target.value);
              setSelectedCourse(course);
              if (course) {
                fetchClassList(course._id);
              }
            }}
          >
            <option value="">Select a course...</option>
            {courses.filter(course => course.isAssigned).map(course => (
              <option key={course._id} value={course._id}>
                {course.courseCode} - {course.courseName}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="course-info">
            <h4>{selectedCourse.courseCode} - {selectedCourse.courseName}</h4>
            <p>{selectedCourse.description}</p>
          </div>
        )}
      </div>

      {selectedCourse && (
        <>
          <div className="class-stats">
            <h4>Class Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Students:</span>
                <span className="stat-value">{classStats.totalStudents}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Students:</span>
                <span className="stat-value">{classStats.activeStudents}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Grade:</span>
                <span className="stat-value">{classStats.averageGrade || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Attendance Rate:</span>
                <span className="stat-value">{classStats.attendanceRate || 'N/A'}%</span>
              </div>
            </div>
          </div>

          <div className="class-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowAddStudentModal(true)}
            >
              ➕ Add Student
            </button>
            <button 
              className="btn-secondary"
              onClick={generateClassListPDF}
              disabled={students.length === 0}
            >
              📄 Download PDF
            </button>
            <button 
              className="btn-secondary"
              onClick={() => {
                // TODO: Implement import functionality
                console.log('Import students');
              }}
            >
              📥 Import Students
            </button>
          </div>

          <div className="class-list">
            <h4>Student List ({students.length})</h4>
            
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search students..."
                onChange={(e) => {
                  // TODO: Implement search functionality
                  console.log('Search:', e.target.value);
                }}
              />
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map(renderStudentRow)
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-students">
                        No students found. Click "Add Student" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Add New Student</h4>
              <button className="close-btn" onClick={() => setShowAddStudentModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Student ID *</label>
                  <input
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="Enter student ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="text"
                    value={newStudent.year}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Section *</label>
                  <input
                    type="text"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="e.g., A, B, C"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowAddStudentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddStudent}
                disabled={!newStudent.studentId || !newStudent.firstName || !newStudent.lastName || !newStudent.year || !newStudent.section}
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedClassManagement;
