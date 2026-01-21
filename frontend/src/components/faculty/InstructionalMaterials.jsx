import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const InstructionalMaterials = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [materials, setMaterials] = useState([]);
    const [newMaterial, setNewMaterial] = useState({
        title: '',
        description: '',
        subject: '',
        type: 'lecture',
        tags: '',
        accessLevel: 'private',
        file: null
    });

    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/materials', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setMaterials(Array.isArray(data) ? data : (data.materials || []));
        } catch (error) {
            console.error('Error loading materials:', error);
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
                    text: `Error loading materials: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const addMaterial = async () => {
        if (!newMaterial.title || !newMaterial.file) {
            Swal.fire({
                title: 'Missing Fields!',
                text: 'Please fill in title and upload a file',
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
            formData.append('title', newMaterial.title);
            formData.append('description', newMaterial.description);
            // Send both subjectCode and subjectName (using the same value for now)
            formData.append('subjectCode', newMaterial.subject || 'General');
            formData.append('subjectName', newMaterial.subject);
            formData.append('type', newMaterial.type);
            formData.append('tags', newMaterial.tags);
            // Map accessLevel to isPublic (boolean) for the backend
            formData.append('isPublic', newMaterial.accessLevel === 'public');
            if (newMaterial.file) {
                formData.append('file', newMaterial.file);
            }

            const response = await fetch('http://localhost:5000/api/materials', {
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
            setMaterials([...materials, result.material]);
            setNewMaterial({
                title: '', description: '', subject: '', type: 'lecture',
                tags: '', accessLevel: 'private', file: null
            });
            document.getElementById('material-file').value = '';
            Swal.fire({
                title: 'Success!',
                text: 'Material uploaded successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading material:', error);
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
                    text: `Error uploading material: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            lecture: '📚',
            presentation: '📊',
            handout: '📄',
            video: '🎥',
            assignment: '📝',
            quiz: '❓',
            exam: '시험',
            project: '🏗️',
            other: '📁'
        };
        return icons[type] || '📁';
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Instructional Materials</h2>
                <p>Manage your teaching resources and materials</p>
            </div>

            <div className="content-card">
                <h3>Upload Instructional Material</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={newMaterial.title}
                            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                            placeholder="Enter material title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={newMaterial.subject}
                            onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                            placeholder="Enter subject"
                        />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select 
                            value={newMaterial.type}
                            onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                        >
                            <option value="lecture">Lecture</option>
                            <option value="presentation">Presentation</option>
                            <option value="handout">Handout</option>
                            <option value="video">Video</option>
                            <option value="assignment">Assignment</option>
                            <option value="quiz">Quiz</option>
                            <option value="exam">Exam</option>
                            <option value="project">Project</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Access Level</label>
                        <select 
                            value={newMaterial.accessLevel}
                            onChange={(e) => setNewMaterial({...newMaterial, accessLevel: e.target.value})}
                        >
                            <option value="private">Private</option>
                            <option value="department">Department</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label>Description</label>
                        <textarea
                            rows="3"
                            value={newMaterial.description}
                            onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                            placeholder="Enter material description"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tags</label>
                        <input
                            type="text"
                            value={newMaterial.tags}
                            onChange={(e) => setNewMaterial({...newMaterial, tags: e.target.value})}
                            placeholder="Enter tags (comma separated)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload File *</label>
                        <input
                            id="material-file"
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.jpeg,.png"
                            onChange={(e) => setNewMaterial({...newMaterial, file: e.target.files[0]})}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addMaterial}>
                    Upload Material
                </button>

                <div className="materials-grid" style={{marginTop: '2rem'}}>
                    <h3>Your Instructional Materials</h3>
                    {materials.map(material => (
                        <div key={material._id} className="material-card">
                            <div className="material-icon">
                                {getTypeIcon(material.type)}
                            </div>
                            <h4>{material.title}</h4>
                            <p className="material-subject">{material.subject}</p>
                            <p className="material-type">{material.type}</p>
                            <p className="material-description">{material.description}</p>
                            <span className={`access-badge ${material.accessLevel}`}>
                                {material.accessLevel}
                            </span>
                            <a href={`http://localhost:5000${material.file?.fileUrl || material.fileUrl || ''}`} target="_blank" rel="noopener noreferrer">
                                Download
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InstructionalMaterials;