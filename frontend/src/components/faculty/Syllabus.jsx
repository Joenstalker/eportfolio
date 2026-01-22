import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const Syllabus = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [syllabi, setSyllabi] = useState([]);
    const [newSyllabus, setNewSyllabus] = useState({
        subjectCode: '',
        subjectName: '',
        academicYear: '',
        semester: '',
        file: null
    });

    useEffect(() => {
        loadSyllabi();
    }, []);

    const loadSyllabi = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/syllabus', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setSyllabi(Array.isArray(data) ? data : (data.syllabi || []));
        } catch (error) {
            console.error('Error loading syllabi:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error loading syllabi: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const addSyllabus = async () => {
        if (!newSyllabus.subjectCode || !newSyllabus.subjectName || !newSyllabus.file) {
            Swal.fire({
                title: 'Missing Fields!',
                text: 'Please fill in all required fields and upload a file',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        try {
            const token = ensureToken();
            if (!token) {
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            const formData = new FormData();
            formData.append('subjectCode', newSyllabus.subjectCode);
            formData.append('subjectName', newSyllabus.subjectName);
            formData.append('academicYear', newSyllabus.academicYear);
            formData.append('semester', newSyllabus.semester);
            formData.append('syllabusFile', newSyllabus.file);

            const response = await fetch('http://localhost:5000/api/syllabus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setSyllabi([...syllabi, result.syllabus]);
            setNewSyllabus({
                subjectCode: '', subjectName: '', academicYear: '', semester: '', file: null
            });
            document.getElementById('syllabus-file').value = '';
            Swal.fire({
                title: 'Success!',
                text: 'Syllabus uploaded successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading syllabus:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error uploading syllabus: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Course Syllabus</h2>
                <p>Manage your course syllabi</p>
            </div>

            <div className="content-card">
                <h3>Upload Syllabus</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Subject Code *</label>
                        <input
                            type="text"
                            value={newSyllabus.subjectCode}
                            onChange={(e) => setNewSyllabus({...newSyllabus, subjectCode: e.target.value})}
                            placeholder="e.g., CS101"
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject Name *</label>
                        <input
                            type="text"
                            value={newSyllabus.subjectName}
                            onChange={(e) => setNewSyllabus({...newSyllabus, subjectName: e.target.value})}
                            placeholder="e.g., Introduction to Programming"
                        />
                    </div>
                    <div className="form-group">
                        <label>Academic Year</label>
                        <input
                            type="text"
                            value={newSyllabus.academicYear}
                            onChange={(e) => setNewSyllabus({...newSyllabus, academicYear: e.target.value})}
                            placeholder="e.g., 2024-2025"
                        />
                    </div>
                    <div className="form-group">
                        <label>Semester</label>
                        <select 
                            value={newSyllabus.semester}
                            onChange={(e) => setNewSyllabus({...newSyllabus, semester: e.target.value})}
                        >
                            <option value="">Select Semester</option>
                            <option value="Fall">Fall</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Syllabus File *</label>
                        <input
                            id="syllabus-file"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setNewSyllabus({...newSyllabus, file: e.target.files[0]})}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addSyllabus}>
                    Upload Syllabus
                </button>

                <div className="items-list" style={{marginTop: '2rem'}}>
                    <h3>Your Syllabi</h3>
                    {syllabi.map(syllabus => (
                        <div key={syllabus._id} className="item-card">
                            <div className="item-header">
                                <h4>{syllabus.subjectCode} - {syllabus.subjectName}</h4>
                                <span className="section-badge">{syllabus.academicYear}</span>
                            </div>
                            <p><strong>Semester:</strong> {syllabus.semester}</p>
                            <a href={`http://localhost:5000${syllabus.syllabusFile?.fileUrl || syllabus.fileUrl || ''}`} target="_blank" rel="noopener noreferrer">
                                Download Syllabus
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Syllabus;