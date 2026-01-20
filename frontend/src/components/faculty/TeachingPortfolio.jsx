import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const TeachingPortfolio = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState({ 
        subjectCode: '', 
        subjectName: '', 
        section: '', 
        semester: '' 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/teaching', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const addSubject = async () => {
        if (!newSubject.subjectCode || !newSubject.subjectName) {
            alert('Please fill in subject code and name');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/teaching/subjects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSubject)
            });

            if (response.ok) {
                const result = await response.json();
                setSubjects(result.portfolio.subjects);
                setNewSubject({ subjectCode: '', subjectName: '', section: '', semester: '' });
                Swal.fire({
                    title: 'Added!',
                    text: 'Subject added successfully!',
                    icon: 'success',
                    confirmButtonColor: '#3498db',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                const error = await response.json();
                Swal.fire({
                    title: 'Error!',
                    text: error.message || 'Error adding subject',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } catch (error) {
            console.error('Error adding subject:', error);
            alert('Error adding subject');
        } finally {
            setLoading(false);
        }
    };

    const deleteSubject = async (subjectId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/teaching/subjects/${subjectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setSubjects(subjects.filter(subject => subject._id !== subjectId));
                alert('Subject deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Error deleting subject');
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Teaching Portfolio</h2>
                <p>Manage your subjects and course outcomes</p>
            </div>

            <div className="content-card">
                <h3>Current Subjects</h3>
                
                {/* Add New Subject */}
                <div className="add-form">
                    <h4>Add New Subject</h4>
                    <div className="form-grid">
                        {/* Add an input dropdown for the Teaching Portfolio section. */}
                        <div className="form-group">
                            <label>Subject Code *</label>
                            <input
                                type="text"
                                placeholder="e.g., CS101"
                                value={newSubject.subjectCode}
                                onChange={(e) => setNewSubject({...newSubject, subjectCode: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Introduction to Programming"
                                value={newSubject.subjectName}
                                onChange={(e) => setNewSubject({...newSubject, subjectName: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Section</label>
                            <input
                                type="text"
                                placeholder="e.g., A"
                                value={newSubject.section}
                                onChange={(e) => setNewSubject({...newSubject, section: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Semester</label>
                            <select
                                value={newSubject.semester}
                                onChange={(e) => setNewSubject({...newSubject, semester: e.target.value})}
                            >
                                <option value="">Select Semester</option>
                                <option value="1st Semester">1st Semester</option>
                                <option value="2nd Semester">2nd Semester</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>
                    </div>
                    <button 
                        className="add-button" 
                        onClick={addSubject}
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Subject'}
                    </button>
                </div>

                {/* Subjects List */}
                <div className="items-list">
                    <h4>Your Subjects ({subjects.length})</h4>
                    {subjects.map(subject => (
                        <div key={subject._id} className="item-card">
                            <div className="item-header">
                                <h4>{subject.subjectCode} - {subject.subjectName}</h4>
                                <span className="section-badge">{subject.section}</span>
                            </div>
                            <p><strong>Semester:</strong> {subject.semester}</p>
                            <div className="item-actions">
                                <button className="action-btn view">View Details</button>
                                <button className="action-btn edit">Edit</button>
                                <button 
                                    className="action-btn delete"
                                    onClick={() => deleteSubject(subject._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeachingPortfolio;